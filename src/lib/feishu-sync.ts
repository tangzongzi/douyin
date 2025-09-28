import { SupabaseService, DailyProfit, MonthlySummary, YearProfit, SyncLog, getSupabaseClient } from './supabase';
import { ENV_CONFIG } from '@/config/env';
import { getFieldValue } from '@/config/field-mapping';
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

interface FeishuRecord {
  fields: Record<string, unknown>;
  record_id?: string;
}

// 获取飞书表格数据
async function getFeishuTableData(tableId: string, accessToken: string): Promise<FeishuRecord[]> {
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

// getFieldValue 函数现在从 @/config/field-mapping 导入

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
      // 尝试多种字段名变体来匹配「每日每日利润汇总」
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
    
    // 4. 自动同步年度数据 - 因为年度数据依赖于每日数据的累计
    try {
      console.log('[Sync] 开始自动同步年度数据...');
      const yearSyncResult = await syncYearData();
      if (yearSyncResult.sync_status === 'success') {
        console.log(`[Sync] 年度数据自动同步成功，同步了 ${yearSyncResult.records_synced} 条记录`);
      } else {
        console.warn('[Sync] 年度数据自动同步失败，但不影响每日数据同步结果');
      }
    } catch (yearError) {
      console.warn('[Sync] 年度数据自动同步出错，但不影响每日数据同步结果:', yearError);
    }
    
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
      
      // 调试：显示所有可用字段和值
      if (index < 3) {
        console.log(`[Sync] 月度记录${index}的所有字段:`, Object.keys(record?.fields || {}));
        console.log(`[Sync] 月净利润值:`, monthProfit);
        console.log(`[Sync] 月度每日利润总计值:`, getFieldValue(record, '月度每日利润总计'));
        console.log(`[Sync] 累计净现金流值:`, getFieldValue(record, '累计净现金流'));
      }
      
      if (monthProfit > 0) {
        // 根据飞书表格实际顺序：第1行是4月，第2行是5月...第6行是9月
        // 所以索引0对应4月，索引1对应5月...索引5对应9月
        const baseMonth = 4; // 4月是基准月
        const targetMonth = baseMonth + index; // 4, 5, 6, 7, 8, 9
        const year = 2025; // 正确的年份
        
        const month = `${year}-${String(targetMonth).padStart(2, '0')}`; // '2025-04', '2025-05'...
        
        const dailyProfitSum = getFieldValue(record, '月度每日利润总计');
        
        const monthlySummary: MonthlySummary = {
          month: month,
          daily_profit_sum: dailyProfitSum, // 月度每日利润总计
          month_profit: monthProfit, // 月净利润
          net_cashflow: getFieldValue(record, '累计净现金流'),
          claim_amount_sum: getFieldValue(record, '总赔付申请金额汇总'),
          pdd_service_fee: getFieldValue(record, '总拼多多技术服务费'),
          douyin_service_fee: getFieldValue(record, '总抖音技术服务费') || 0,
          payment_expense_sum: getFieldValue(record, '总货款支出汇总'),
          other_expense_sum: getFieldValue(record, '总其他支出汇总'),
          shipping_insurance: getFieldValue(record, '运费保险') || 0,
          hard_expense: getFieldValue(record, '硬性支出') || 0,
          qianchuan: getFieldValue(record, '千川投流') || 0,
          deposit: getFieldValue(record, '店铺保证金') || 0,
          initial_fund: getFieldValue(record, '初始资金总额') || 0,
        };
        
        console.log(`[Sync Debug] ${month} 字段值对比:`);
        console.log(`  月净利润: ${monthProfit}`);
        console.log(`  月度每日利润总计: ${dailyProfitSum}`);
        console.log(`  总赔付申请金额汇总: ${getFieldValue(record, '总赔付申请金额汇总')}`);
        
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
    
    // 4. 自动同步年度数据 - 因为年度数据依赖于月度数据的累计
    try {
      console.log('[Sync] 开始自动同步年度数据...');
      const yearSyncResult = await syncYearData();
      if (yearSyncResult.sync_status === 'success') {
        console.log(`[Sync] 年度数据自动同步成功，同步了 ${yearSyncResult.records_synced} 条记录`);
      } else {
        console.warn('[Sync] 年度数据自动同步失败，但不影响月度数据同步结果');
      }
    } catch (yearError) {
      console.warn('[Sync] 年度数据自动同步出错，但不影响月度数据同步结果:', yearError);
    }
    
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

// 同步年度利润数据
export async function syncYearData(): Promise<SyncLog> {
  const syncLog: SyncLog = {
    sync_type: 'yearly',
    sync_status: 'failed',
    records_synced: 0,
    sync_started_at: new Date().toISOString(),
  };

  try {
    console.log('[Sync] 开始同步年度利润数据...');
    
    // 1. 获取飞书访问令牌
    const accessToken = await getFeishuAccessToken();
    
    // 2. 获取年度利润表数据
    const feishuData = await getFeishuTableData(ENV_CONFIG.TABLE_YEAR_PROFIT, accessToken);
    console.log(`[Sync] 从飞书获取到 ${feishuData.length} 条年度数据`);
    
    if (feishuData.length === 0) {
      throw new Error('飞书年度利润表无数据');
    }
    
    // 3. 转换数据格式
    const yearProfits: YearProfit[] = [];
    
    feishuData.forEach((record, index) => {
      // 调试：打印所有可用字段名
      const fields = record.fields || {};
      const fieldNames = Object.keys(fields);
      console.log(`[Sync Debug] 记录${index}的所有字段名:`, fieldNames);
      console.log(`[Sync Debug] 记录${index}的字段值:`, fields);
      
      // 根据最新飞书表格，年度利润表只有2个核心字段
      const profitWithDeposit = getFieldValue(record, '含保证金利润') || getFieldValue(record, '含保证金');
      const profitWithoutDeposit = getFieldValue(record, '不含保证金余利润') || getFieldValue(record, '不含保证金剩余利润') || getFieldValue(record, '不含保证金利润');
      
      const yearProfit: YearProfit = {
        year: String(getFieldValue(record, '日期') || getFieldValue(record, '年份') || '2025').replace('年', ''), 
        profit_with_deposit: profitWithDeposit,      // 含保证金利润 (118612.03)
        profit_without_deposit: profitWithoutDeposit, // 不含保证金余利润 (103601.99)
      };
      
      yearProfits.push(yearProfit);
      console.log(`[Sync] 处理年度数据: ${yearProfit.year}`);
      console.log(`  - 含保证金利润: ¥${yearProfit.profit_with_deposit}`);
      console.log(`  - 不含保证金余利润: ¥${yearProfit.profit_without_deposit}`);
      
      // 调试：显示原始字段值
      console.log(`[Sync Debug] 原始字段值:`);
      console.log(`  - 含保证金利润字段: ${profitWithDeposit}`);
      console.log(`  - 不含保证金余利润字段: ${profitWithoutDeposit}`);
    });
    
    // 4. 批量插入到Supabase
    for (const yearProfit of yearProfits) {
      try {
        await SupabaseService.upsertYearProfit(yearProfit);
        syncLog.records_synced++;
      } catch (error) {
        console.error(`[Sync] 插入年度数据失败: ${yearProfit.year}`, error);
      }
    }
    
    syncLog.sync_status = 'success';
    syncLog.sync_completed_at = new Date().toISOString();
    
    console.log(`[Sync] 年度数据同步完成，成功同步 ${syncLog.records_synced} 条记录`);
    
  } catch (error) {
    console.error('[Sync] 年度数据同步失败:', error);
    syncLog.sync_status = 'failed';
    syncLog.error_message = error instanceof Error ? error.message : '未知错误';
    syncLog.sync_completed_at = new Date().toISOString();
  }
  
  // 记录同步日志
  try {
    await SupabaseService.logSync(syncLog);
  } catch (error) {
    console.error('[Sync] 记录年度同步日志失败:', error);
  }
  
  return syncLog;
}

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
    const supabase = getSupabaseClient();

    const dailyResult = await supabase
      .from('daily_profits')
      .select('id', { count: 'exact', head: true });

    const monthlyResult = await supabase
      .from('monthly_summary')
      .select('id', { count: 'exact', head: true });

    const dailyCount = dailyResult.count ?? 0;
    const monthlyCount = monthlyResult.count ?? 0;

    console.log(`[Sync] 数据验证 - 每日记录: ${dailyCount}, 月度记录: ${monthlyCount}`);

    return dailyCount > 0 && monthlyCount > 0;
  } catch (error) {
    console.error('[Sync] 数据验证失败:', error);
    return false;
  }
}
