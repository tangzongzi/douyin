import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { ENV_CONFIG } from '@/config/env';

// 飞书 API 基础配置
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

interface FeishuDepositRecord {
  record_id: string;
  fields: {
    [key: string]: string | number | boolean | null;
  };
}

interface DepositData {
  record_id: string;
  date: string;
  amount: number;
  remarks: string;
}

// 获取飞书访问令牌
async function getFeishuToken(): Promise<string> {
  const response = await fetch(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: ENV_CONFIG.FEISHU_APP_ID,
      app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书token失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

// 获取飞书表格数据
async function getFeishuTableData(tableId: string, token: string): Promise<FeishuDepositRecord[]> {
  const response = await fetch(
    `${FEISHU_API_BASE}/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${tableId}/records?page_size=500`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书表格数据失败: ${data.msg}`);
  }

  return data.data?.items || [];
}

// 解析飞书记录为标准化数据
function parseDepositRecord(record: FeishuDepositRecord): DepositData | null {
  try {
    const fields = record.fields;
    
    // 检查必要字段
    if (!fields['日期'] || fields['金额'] === null || fields['金额'] === undefined) {
      console.warn(`记录 ${record.record_id} 缺少必要字段`);
      return null;
    }

    // 解析日期（从 2025/09/20 格式转换为 2025-09-20）
    let date = '';
    if (typeof fields['日期'] === 'string') {
      // 字符串格式如 "2025/09/20"
      const dateStr = fields['日期'] as string;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 3) {
          date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      } else {
        // 其他格式尝试直接解析
        date = new Date(dateStr).toISOString().split('T')[0];
      }
    } else if (typeof fields['日期'] === 'number') {
      // 时间戳格式
      date = new Date(fields['日期'] as number).toISOString().split('T')[0];
    }

    // 解析金额
    const amount = typeof fields['金额'] === 'number' 
      ? fields['金额'] as number 
      : parseFloat(String(fields['金额'] || '0'));

    // 解析备注
    const remarks = String(fields['备注'] || '');

    return {
      record_id: record.record_id,
      date,
      amount,
      remarks,
    };
  } catch (error) {
    console.error(`解析记录 ${record.record_id} 失败:`, error);
    return null;
  }
}

// 同步国内店铺保证金数据
async function syncDomesticDeposits(supabase: ReturnType<typeof getSupabaseClient>): Promise<{ success: number; failed: number }> {
  const token = await getFeishuToken();
  const records = await getFeishuTableData(ENV_CONFIG.TABLE_DOMESTIC_DEPOSITS, token);
  
  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const depositData = parseDepositRecord(record);
      if (!depositData) {
        failed++;
        continue;
      }

      const { error } = await supabase
        .from('domestic_deposits')
        .upsert({
          record_id: depositData.record_id,
          date: depositData.date,
          amount: depositData.amount,
          remarks: depositData.remarks,
        }, { onConflict: 'record_id' });

      if (error) {
        console.error(`同步国内店铺保证金记录失败:`, error);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      console.error(`处理国内店铺保证金记录失败:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// 同步跨境店铺保证金数据
async function syncCrossborderDeposits(supabase: ReturnType<typeof getSupabaseClient>): Promise<{ success: number; failed: number }> {
  const token = await getFeishuToken();
  const records = await getFeishuTableData(ENV_CONFIG.TABLE_CROSSBORDER_DEPOSITS, token);
  
  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const depositData = parseDepositRecord(record);
      if (!depositData) {
        failed++;
        continue;
      }

      const { error } = await supabase
        .from('crossborder_deposits')
        .upsert({
          record_id: depositData.record_id,
          date: depositData.date,
          amount: depositData.amount,
          remarks: depositData.remarks,
        }, { onConflict: 'record_id' });

      if (error) {
        console.error(`同步跨境店铺保证金记录失败:`, error);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      console.error(`处理跨境店铺保证金记录失败:`, error);
      failed++;
    }
  }

  return { success, failed };
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // all, domestic, crossborder

  try {
    const supabase = getSupabaseClient();
    let domesticResult = { success: 0, failed: 0 };
    let crossborderResult = { success: 0, failed: 0 };

    console.log(`[店铺保证金同步] 开始同步，类型: ${type}`);
    const startTime = Date.now();

    if (type === 'all' || type === 'domestic') {
      console.log('[店铺保证金同步] 同步国内店铺保证金...');
      domesticResult = await syncDomesticDeposits(supabase);
      console.log(`[店铺保证金同步] 国内店铺同步完成: 成功${domesticResult.success}条，失败${domesticResult.failed}条`);
    }

    if (type === 'all' || type === 'crossborder') {
      console.log('[店铺保证金同步] 同步跨境店铺保证金...');
      crossborderResult = await syncCrossborderDeposits(supabase);
      console.log(`[店铺保证金同步] 跨境店铺同步完成: 成功${crossborderResult.success}条，失败${crossborderResult.failed}条`);
    }

    const totalTime = Date.now() - startTime;
    const result = {
      success: true,
      message: '店铺保证金数据同步完成',
      data: {
        domestic: domesticResult,
        crossborder: crossborderResult,
        total: {
          success: domesticResult.success + crossborderResult.success,
          failed: domesticResult.failed + crossborderResult.failed,
        },
        duration: `${totalTime}ms`,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('[店铺保证金同步] 全部同步完成:', result.data);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[店铺保证金同步] 同步失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '店铺保证金数据同步失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'summary'; // summary, domestic, crossborder
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const supabase = getSupabaseClient();

    if (type === 'domestic') {
      const { data, error } = await supabase
        .from('domestic_deposits')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        count: data?.length || 0,
        message: '获取国内店铺保证金数据成功',
      });
    }

    if (type === 'crossborder') {
      const { data, error } = await supabase
        .from('crossborder_deposits')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        count: data?.length || 0,
        message: '获取跨境店铺保证金数据成功',
      });
    }

    // 默认返回汇总信息
    const [domesticCount, crossborderCount] = await Promise.all([
      supabase.from('domestic_deposits').select('*', { count: 'exact', head: true }),
      supabase.from('crossborder_deposits').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        domestic_count: domesticCount.count || 0,
        crossborder_count: crossborderCount.count || 0,
        total_count: (domesticCount.count || 0) + (crossborderCount.count || 0),
      },
      message: '获取店铺保证金数据汇总成功',
    });

  } catch (error) {
    console.error('[店铺保证金查询] 查询失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询店铺保证金数据失败',
      },
      { status: 500 }
    );
  }
}
