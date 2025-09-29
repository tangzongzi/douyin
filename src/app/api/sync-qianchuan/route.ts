import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { ENV_CONFIG } from '@/config/env';

// 飞书 API 基础配置
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

interface FeishuQianchuanRecord {
  record_id: string;
  fields: {
    [key: string]: string | number | boolean | null;
  };
}

interface QianchuanData {
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
async function getFeishuTableData(tableId: string, token: string): Promise<FeishuQianchuanRecord[]> {
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
function parseQianchuanRecord(record: FeishuQianchuanRecord): QianchuanData | null {
  try {
    const fields = record.fields;
    
    // 检查必要字段
    if (!fields['日期'] || fields['金额'] === null || fields['金额'] === undefined) {
      console.warn(`记录 ${record.record_id} 缺少必要字段`);
      return null;
    }

    // 解析日期（从 2025/09/29 格式转换为 2025-09-29）
    let date = '';
    if (typeof fields['日期'] === 'string') {
      // 字符串格式如 "2025/09/29"
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

// 同步千川投流数据
async function syncQianchuanAds(supabase: ReturnType<typeof getSupabaseClient>): Promise<{ success: number; failed: number }> {
  const token = await getFeishuToken();
  const records = await getFeishuTableData(ENV_CONFIG.TABLE_QIANCHUAN_ADS, token);
  
  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const qianchuanData = parseQianchuanRecord(record);
      if (!qianchuanData) {
        failed++;
        continue;
      }

      const { error } = await supabase
        .from('qianchuan_ads')
        .upsert({
          record_id: qianchuanData.record_id,
          date: qianchuanData.date,
          amount: qianchuanData.amount,
          remarks: qianchuanData.remarks,
        }, { onConflict: 'record_id' });

      if (error) {
        console.error(`同步千川投流记录失败:`, error);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      console.error(`处理千川投流记录失败:`, error);
      failed++;
    }
  }

  return { success, failed };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    console.log('[千川投流同步] 开始同步...');
    const startTime = Date.now();

    const result = await syncQianchuanAds(supabase);
    console.log(`[千川投流同步] 同步完成: 成功${result.success}条，失败${result.failed}条`);

    const totalTime = Date.now() - startTime;
    const response = {
      success: true,
      message: '千川投流数据同步完成',
      data: {
        ...result,
        duration: `${totalTime}ms`,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('[千川投流同步] 全部同步完成:', response.data);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[千川投流同步] 同步失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '千川投流数据同步失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('qianchuan_ads')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      message: '获取千川投流数据成功',
    });

  } catch (error) {
    console.error('[千川投流查询] 查询失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询千川投流数据失败',
      },
      { status: 500 }
    );
  }
}
