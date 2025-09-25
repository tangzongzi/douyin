import { SupabaseService, DailyProfit, MonthlySummary, YearProfit, SyncLog } from './supabase';
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

// 字段名映射函数
function getFieldValue(record: any, fieldKey: string): number {
  if (!record?.fields) return 0;
  
  const fields = record.fields;
  const keys = Object.keys(fields);
  
  // 查找匹配的字段名
  const matchedKey = keys.find(key => 
    key.includes(fieldKey) || 
    key.includes(fieldKey.slice(0, 3))
  );
  
  return matchedKey ? Number(fields[matchedKey]) || 0 : 0;
}

// 智能同步每日数据（支持日期范围和增量同步）
export async function syncDailyData(options?: {
  dateRange?: 'recent' | '7days' | '15days' | '30days' | 'currentMonth' | 'all';
  forceSync?: boolean; // 是否强制同步已存在的数据
}): Promise<SyncLog> {
  const syncLog: SyncLog = {
    sync_type: 'daily',
    sync_status: 'failed',
    records_synced: 0,
    sync_started_at: new Date().toISOString(),
  };
  
  try {
    const { dateRange = 'recent', forceSync = false } = options || {};
    console.log(`[Sync] 开始同步每日数据，范围: ${dateRange}, 强制同步: ${forceSync}`);
    
    // 1. 计算同步的日期范围
    const today = new Date();
    let startDate: Date | null = null;
    
    switch (dateRange) {
      case '7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '15days':
        startDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'currentMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'recent':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 默认30天
        break;
      case 'all':
      default:
        startDate = null; // 同步所有数据
        break;
    }
    
    console.log(`[Sync] 同步日期范围: ${startDate ? startDate.toISOString().split('T')[0] : '全部'} 到 ${today.toISOString().split('T')[0]}`);
    
    // 2. 获取已存在的数据（用于增量同步）
    let existingDates: string[] = [];
    if (!forceSync) {
      try {
        const existingData = await SupabaseService.getDailyProfits(
          startDate ? startDate.toISOString().split('T')[0] : undefined,
          today.toISOString().split('T')[0]
        );
        existingDates = existingData.map(item => item.date);
        console.log(`[Sync] 已存在的日期:`, existingDates);
      } catch (error) {
        console.warn('[Sync] 获取已存在数据失败，将进行完整同步:', error);
      }
    }
    
    // 3. 直接调用飞书API获取数据
    const accessToken = await getFeishuAccessToken();
    const feishuData = await getFeishuTableData(ENV_CONFIG.TABLE_BASE_DAILY, accessToken);
    
    // 4. 转换数据格式
    const dailyProfits: DailyProfit[] = [];
    
    feishuData.forEach((record, index) => {
      // 从飞书表格中直接读取日期字段，而不是基于索引推算
      const dateValue = getFieldValue(record, '日期') || getFieldValue(record, '时间') || getFieldValue(record, 'date');
      
      // 如果没有日期字段，尝试从record中获取
      let recordDate = null;
      if (record?.fields) {
        const dateFields = Object.keys(record.fields).filter(key => 
          key.includes('日期') || key.includes('时间') || key.toLowerCase().includes('date')
        );
        if (dateFields.length > 0) {
          const dateFieldValue = record.fields[dateFields[0]];
          recordDate = dateFieldValue;
        }
      }
      
      // 调试：显示所有可用字段和日期信息
      if (index < 3) {
        console.log(`[Sync] 记录${index}的所有字段:`, Object.keys(record?.fields || {}));
        console.log(`[Sync] 日期字段值:`, recordDate);
        console.log(`[Sync] 每日利润汇总值:`, getFieldValue(record, '每日利润汇总'));
        console.log(`[Sync] 每日盈利值:`, getFieldValue(record, '每日盈利'));
      }
      
      // 解析日期（支持多种格式）
      let parsedDate = null;
      if (recordDate) {
        // 尝试解析各种日期格式
        if (typeof recordDate === 'string') {
          // 处理 "2025/09/25" 或 "2025-09-25" 格式
          parsedDate = new Date(recordDate.replace(/\//g, '-'));
        } else if (typeof recordDate === 'number') {
          // 处理时间戳
          parsedDate = new Date(recordDate);
        }
      }
      
      // 如果无法解析日期，跳过这条记录
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        console.warn(`[Sync] 跳过无效日期记录 (索引${index}):`, recordDate);
        return;
      }
      
      const recordDateStr = parsedDate.toISOString().split('T')[0];
      
      // 检查日期范围过滤
      if (startDate && parsedDate < startDate) {
        console.log(`[Sync] 跳过超出范围的日期: ${recordDateStr}`);
        return;
      }
      
      // 检查增量同步（跳过已存在的数据）
      if (!forceSync && existingDates.includes(recordDateStr)) {
        console.log(`[Sync] 跳过已存在的日期: ${recordDateStr}`);
        return;
      }
      
      const dailyProfit: DailyProfit = {
        date: recordDateStr,
        daily_profit: getFieldValue(record, '每日盈利'), // 每日盈利字段
        profit_summary: getFieldValue(record, '每日利润汇总'), // 每日利润汇总字段
        other_expense: getFieldValue(record, '其他支出'),
        payment_expense: getFieldValue(record, '货款支出'), // 保持原始负数值
        withdraw_amount: getFieldValue(record, '提现金额') || 0,
        claim_amount: getFieldValue(record, '赔付申请金额'), // 赔付申请金额
      };
      
      dailyProfits.push(dailyProfit);
      console.log(`[Sync] ✅ 将同步: ${dailyProfit.date} = 利润¥${dailyProfit.daily_profit}, 汇总¥${dailyProfit.profit_summary} (飞书第${index + 1}行)`);
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

// 年度数据同步函数
export async function syncYearlyData(): Promise<SyncLog> {
  console.log('[Sync] 开始年度数据同步...');
  
  const syncLog: SyncLog = {
    sync_type: 'yearly',
    sync_status: 'failed',
    records_synced: 0,
    sync_started_at: new Date().toISOString(),
  };
  
  try {
    // 获取飞书访问令牌
    const accessToken = await getFeishuAccessToken();
    
    // 获取年度总利润数据
    const feishuData = await getFeishuTableData(accessToken, ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID);
    console.log('[Sync] 年度数据原始数据:', JSON.stringify(feishuData, null, 2));
    
    if (!feishuData || feishuData.length === 0) {
      throw new Error('年度数据为空');
    }
    
    // 转换为年度利润数据
    const yearProfits: YearProfit[] = [];
    
    feishuData.forEach((record) => {
      const yearProfit: YearProfit = {
        year: getFieldValue(record, '年份') || '2025',
        profit_with_deposit: getFieldValue(record, '含保证金利润'),
        total_profit_with_deposit: getFieldValue(record, '含保证金总利润') || getFieldValue(record, '含保证金利润'), // 备用映射
        profit_without_deposit: getFieldValue(record, '不含保证金利润'),
        net_profit_without_deposit: getFieldValue(record, '不含保证金余利润') || getFieldValue(record, '不含保证金利润'), // 备用映射
      };
      yearProfits.push(yearProfit);
    });
    
    console.log('[Sync] 转换后的年度数据:', yearProfits);
    
    // 批量插入/更新年度数据
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

// 完整同步函数
export async function syncAllData(options?: { forceSync?: boolean }): Promise<{ daily: SyncLog; monthly: SyncLog; yearly: SyncLog }> {
  console.log('[Sync] 开始完整数据同步...');
  
  const results = {
    daily: await syncDailyData({ dateRange: 'all', forceSync: options?.forceSync }),
    monthly: await syncMonthlyData(),
    yearly: await syncYearlyData(),
  };
  
  console.log('[Sync] 完整数据同步完成:', results);
  return results;
}

// 按日期范围同步的便捷函数
export async function syncDailyDataByRange(range: '7days' | '15days' | '30days' | 'currentMonth'): Promise<SyncLog> {
  return await syncDailyData({ dateRange: range, forceSync: false });
}

// 强制完整同步（覆盖已存在数据）
export async function forceFullSync(): Promise<{ daily: SyncLog; monthly: SyncLog; yearly: SyncLog }> {
  return await syncAllData({ forceSync: true });
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
