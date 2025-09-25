import { SupabaseService, DailyProfit, MonthlySummary, SyncLog } from './supabase';
import { ENV_CONFIG } from '@/config/env';
import axios from 'axios';

// 飞书API配置
const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

// 获取飞书访问令牌
async function getFeishuAccessToken(): Promise<string> {
  try {
    console.log('[Sync] 获取飞书访问令牌...');
    console.log('[Sync] APP_ID:', ENV_CONFIG.FEISHU_APP_ID);
    console.log('[Sync] APP_SECRET:', ENV_CONFIG.FEISHU_APP_SECRET ? '已设置' : '未设置');
    
    const response = await axios.post(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
      app_id: ENV_CONFIG.FEISHU_APP_ID,
      app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    
    console.log('[Sync] 访问令牌响应状态:', response.status);
    console.log('[Sync] 访问令牌响应数据:', response.data);
    
    if (response.data && response.data.code === 0) {
      console.log('[Sync] 访问令牌获取成功');
      return response.data.tenant_access_token;
    }
    
    throw new Error(`获取访问令牌失败: ${response.data?.msg || '响应格式错误'}`);
  } catch (error) {
    console.error('[Sync] 获取飞书访问令牌失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('[Sync] 错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
    }
    throw error;
  }
}

// 获取飞书表格数据
async function getFeishuTableData(tableId: string, accessToken: string): Promise<any[]> {
  try {
    console.log(`[Sync] 获取表格数据: ${tableId}`);
    console.log(`[Sync] APP_TOKEN: ${ENV_CONFIG.FEISHU_APP_TOKEN}`);
    
    const url = `${FEISHU_BASE_URL}/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${tableId}/records`;
    console.log(`[Sync] 请求URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      params: { page_size: 100 },
      timeout: 15000,
      validateStatus: (status) => status < 500, // 不要自动抛出4xx错误
    });

    console.log(`[Sync] 表格数据响应状态: ${response.status}`);
    console.log(`[Sync] 表格数据响应类型: ${response.headers['content-type']}`);
    
    // 检查响应是否为JSON
    if (!response.headers['content-type']?.includes('application/json')) {
      console.error('[Sync] 响应不是JSON格式:', response.data);
      throw new Error('API响应不是JSON格式，可能是认证失败或API限制');
    }

    if (response.data && response.data.code === 0) {
      const items = response.data.data?.items || [];
      console.log(`[Sync] 成功获取 ${items.length} 条记录`);
      return items;
    }
    
    throw new Error(`获取表格数据失败: ${response.data?.msg || `HTTP ${response.status}`}`);
  } catch (error) {
    console.error('[Sync] 获取飞书表格数据失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('[Sync] 详细错误信息:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        contentType: error.response?.headers['content-type'],
        data: typeof error.response?.data === 'string' ? 
          error.response.data.substring(0, 200) : error.response?.data
      });
    }
    throw error;
  }
}

// 字段名映射函数（增强版，处理编码和变体）
function getFieldValue(record: any, fieldKey: string): number {
  if (!record?.fields) return 0;
  
  const fields = record.fields;
  const keys = Object.keys(fields);
  
  // 多种匹配策略
  const matchedKey = keys.find(key => {
    // 1. 完全匹配
    if (key === fieldKey) return true;
    
    // 2. 包含匹配
    if (key.includes(fieldKey)) return true;
    
    // 3. 处理重复字符（如"每日每日利润汇总"）
    if (fieldKey === '每日利润汇总' && key.includes('每日') && key.includes('利润汇总')) return true;
    
    // 4. 处理简化匹配
    if (fieldKey === '每日盈利' && (key.includes('每日') && key.includes('盈利'))) return true;
    
    // 5. 前缀匹配
    if (key.includes(fieldKey.slice(0, 3))) return true;
    
    return false;
  });
  
  const value = matchedKey ? fields[matchedKey] : 0;
  
  // 处理字符串数字
  if (typeof value === 'string') {
    return Number(value) || 0;
  }
  
  return Number(value) || 0;
}

// 同步每日数据（恢复简单有效的逻辑）
export async function syncDailyData(): Promise<SyncLog> {
  const syncLog: SyncLog = {
    sync_type: 'daily',
    sync_status: 'failed',
    records_synced: 0,
    sync_started_at: new Date().toISOString(),
  };
  
  try {
    console.log('[Sync] 开始同步每日数据...');
    
    // 1. 直接调用飞书API获取数据
    const accessToken = await getFeishuAccessToken();
    const feishuData = await getFeishuTableData(ENV_CONFIG.TABLE_BASE_DAILY, accessToken);
    
    // 2. 转换数据格式
    const dailyProfits: DailyProfit[] = [];
    
    feishuData.forEach((record, index) => {
      // 恢复昨天可用的简单逻辑：基于索引推算日期，但使用正确的字段名
      // 尝试多种字段名变体来匹配"每日每日利润汇总"
      const profitValue = getFieldValue(record, '每日每日利润汇总') || 
                         getFieldValue(record, '每日利润汇总') ||
                         getFieldValue(record, '利润汇总');
      
      // 调试：显示所有可用字段和值
      if (index < 3) {
        console.log(`[Sync] 记录${index}的所有字段:`, Object.keys(record?.fields || {}));
        console.log(`[Sync] 每日利润汇总值:`, profitValue);
        console.log(`[Sync] 每日盈利值:`, getFieldValue(record, '每日盈利'));
        console.log(`[Sync] 赔付申请金额值:`, getFieldValue(record, '赔付申请金额'));
        console.log(`[Sync] 其他支出值:`, getFieldValue(record, '其他支出'));
        console.log(`[Sync] 货款支出值:`, getFieldValue(record, '货款支出'));
      }
      
      // 恢复昨天的日期逻辑，但使用动态的今天作为基准
      const today = new Date();
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - index); // 从今天开始往前推
      
      const dailyProfit: DailyProfit = {
        date: currentDate.toISOString().split('T')[0],
        daily_profit: getFieldValue(record, '每日盈利'), // 每日盈利字段
        profit_summary: profitValue, // 每日利润汇总字段（使用正确字段名）
        other_expense: getFieldValue(record, '其他支出'),
        payment_expense: getFieldValue(record, '货款支出'), // 保持原始负数值
        withdraw_amount: getFieldValue(record, '提现金额') || 0,
        claim_amount: getFieldValue(record, '赔付申请金额'), // 赔付申请金额
      };
      
      dailyProfits.push(dailyProfit);
      console.log(`[Sync] 处理每日数据: ${dailyProfit.date} = 利润¥${dailyProfit.daily_profit}, 汇总¥${dailyProfit.profit_summary} (索引${index})`);
    });
    
    // 3. 批量插入到Supabase
    for (const dailyProfit of dailyProfits) {
      try {
        await SupabaseService.upsertDailyProfit(dailyProfit);
        syncLog.records_synced++;
      } catch (error) {
        console.error(`[Sync] 插入每日数据失败: ${dailyProfit.date}`, error);
      }
    }
    
    syncLog.sync_status = 'success';
    syncLog.sync_completed_at = new Date().toISOString();
    
    console.log(`[Sync] 每日数据同步完成，成功同步 ${syncLog.records_synced} 条记录`);
    
  } catch (error) {
    console.error('[Sync] 每日数据同步失败:', error);
    syncLog.error_message = error instanceof Error ? error.message : '未知错误';
    syncLog.sync_completed_at = new Date().toISOString();
  }
  
  // 记录同步日志
  try {
    await SupabaseService.logSync(syncLog);
  } catch (error) {
    console.error('[Sync] 记录同步日志失败:', error);
  }
  
  return syncLog;
}

// 同步月度数据
export async function syncMonthlyData(): Promise<SyncLog> {
  const syncLog: SyncLog = {
    sync_type: 'monthly',
    sync_status: 'failed',
    records_synced: 0,
    sync_started_at: new Date().toISOString(),
  };
  
  try {
    console.log('[Sync] 开始同步月度数据...');
    
    // 1. 直接调用飞书API获取数据
    const accessToken = await getFeishuAccessToken();
    const feishuData = await getFeishuTableData(ENV_CONFIG.TABLE_MONTH_SUMMARY, accessToken);
    
    // 2. 转换数据格式
    const monthlySummaries: MonthlySummary[] = [];
    
    feishuData.forEach((record, index) => {
      const monthProfit = getFieldValue(record, '月净利润');
      
      if (monthProfit > 0) {
        // 根据飞书表格实际顺序：第1行是4月，第2行是5月...第6行是9月
        // 所以索引0对应4月，索引1对应5月...索引5对应9月
        const baseMonth = 4; // 4月是基准月
        const targetMonth = baseMonth + index; // 4, 5, 6, 7, 8, 9
        const year = 2025; // 正确的年份
        
        const month = `${year}-${String(targetMonth).padStart(2, '0')}`; // '2025-04', '2025-05'...
        
        const monthlySummary: MonthlySummary = {
          month: month,
          daily_profit_sum: getFieldValue(record, '月度每日利润汇总'), // 红框左边的字段
          month_profit: monthProfit, // 红框右边的字段
          net_cashflow: getFieldValue(record, '累计净现金流'),
          claim_amount_sum: getFieldValue(record, '总赔付申请金额'),
          pdd_service_fee: getFieldValue(record, '总拼多多技术服务费'), // 保持原始值
          douyin_service_fee: getFieldValue(record, '总抖音技术服务费') || 0,
          payment_expense_sum: getFieldValue(record, '总货款支出'), // 保持原始负数值
          other_expense_sum: getFieldValue(record, '总其他支出'), // 保持原始值
          shipping_insurance: getFieldValue(record, '运费保险') || 0,
          hard_expense: getFieldValue(record, '硬性支出') || 0,
          qianchuan: getFieldValue(record, '千川') || 0,
          deposit: getFieldValue(record, '保证金') || 0,
          initial_fund: getFieldValue(record, '初始资金') || 0,
        };
        
        monthlySummaries.push(monthlySummary);
        console.log(`[Sync] 处理月度数据: ${monthlySummary.month} = ¥${monthlySummary.month_profit}`);
      }
    });
    
    // 3. 批量插入到Supabase
    for (const monthlySummary of monthlySummaries) {
      try {
        await SupabaseService.upsertMonthlySummary(monthlySummary);
        syncLog.records_synced++;
      } catch (error) {
        console.error(`[Sync] 插入月度数据失败: ${monthlySummary.month}`, error);
      }
    }
    
    syncLog.sync_status = 'success';
    syncLog.sync_completed_at = new Date().toISOString();
    
    console.log(`[Sync] 月度数据同步完成，成功同步 ${syncLog.records_synced} 条记录`);
    
  } catch (error) {
    console.error('[Sync] 月度数据同步失败:', error);
    syncLog.error_message = error instanceof Error ? error.message : '未知错误';
    syncLog.sync_completed_at = new Date().toISOString();
  }
  
  // 记录同步日志
  try {
    await SupabaseService.logSync(syncLog);
  } catch (error) {
    console.error('[Sync] 记录同步日志失败:', error);
  }
  
  return syncLog;
}

// 移除年度数据同步函数

// 完整同步函数（恢复昨天的简单版本）
export async function syncAllData(): Promise<{ daily: SyncLog; monthly: SyncLog }> {
  console.log('[Sync] 开始完整数据同步...');
  
  const results = {
    daily: await syncDailyData(),
    monthly: await syncMonthlyData(),
  };
  
  console.log('[Sync] 完整数据同步完成:', results);
  return results;
}

// 数据验证函数
export async function validateDataSync(): Promise<boolean> {
  try {
    const dailyCount = await supabase
      .from('daily_profits')
      .select('id', { count: 'exact' });
      
    const monthlyCount = await supabase
      .from('monthly_summary')
      .select('id', { count: 'exact' });
    
    console.log(`[Sync] 数据验证 - 每日记录: ${dailyCount.count}, 月度记录: ${monthlyCount.count}`);
    
    return (dailyCount.count || 0) > 0 && (monthlyCount.count || 0) > 0;
  } catch (error) {
    console.error('[Sync] 数据验证失败:', error);
    return false;
  }
}
