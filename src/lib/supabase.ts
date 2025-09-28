import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端的工厂函数
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gayywaplwsilukawgwpt.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheXl3YXBsd3NpbHVrYXdnd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNTEsImV4cCI6MjA3NDI2MjA1MX0.HTWNBuOto7nMk4nQ_M9yRt0TDpdrBBinn-JuB_Z2qho';
  
  console.log('[Supabase] 创建客户端，URL:', supabaseUrl);
  console.log('[Supabase] 使用密钥:', supabaseAnonKey.substring(0, 20) + '...');
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// 延迟创建客户端
export function getSupabaseClient() {
  return createSupabaseClient();
}

// 数据类型定义
export interface DailyProfit {
  id?: number;
  date: string;
  daily_profit: number;
  profit_summary: number; // 每日利润汇总
  other_expense: number;
  payment_expense: number;
  withdraw_amount: number;
  claim_amount: number;
  daily_profit_detail?: number; // 每日盈利明细
  created_at?: string;
  updated_at?: string;
}

export interface MonthlySummary {
  id?: number;
  month: string;
  daily_profit_sum: number; // 月度每日利润汇总
  month_profit: number; // 月净利润
  net_cashflow: number;
  claim_amount_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  payment_expense_sum: number;
  other_expense_sum: number;
  shipping_insurance: number;
  hard_expense: number;
  qianchuan: number;
  deposit: number;
  initial_fund: number;
  created_at?: string;
  updated_at?: string;
}

export interface YearProfit {
  id?: number;
  year: string;
  profit_with_deposit: number;     // 含保证金利润 (118612.03)
  profit_without_deposit: number;  // 不含保证金余利润 (103601.99)
  created_at?: string;
  updated_at?: string;
}

export interface SyncLog {
  id?: number;
  sync_type: 'daily' | 'monthly' | 'yearly';
  sync_status: 'success' | 'failed' | 'partial';
  records_synced: number;
  error_message?: string;
  sync_started_at?: string;
  sync_completed_at?: string;
}

// Supabase 数据操作函数
export class SupabaseService {
  
  // 获取每日数据 - 优化版：只查询必要字段
  static async getDailyProfits(startDate?: string, endDate?: string) {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('daily_profits')
      .select(`
        id,
        date,
        daily_profit,
        profit_summary,
        other_expense,
        payment_expense,
        withdraw_amount,
        claim_amount,
        created_at,
        updated_at
      `)
      .order('date', { ascending: false });
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('获取每日数据失败:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // 获取月度汇总数据 - 优化版：只查询必要字段
  static async getMonthlySummary(limit: number = 12) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('monthly_summary')
      .select(`
        id,
        month,
        daily_profit_sum,
        month_profit,
        net_cashflow,
        claim_amount_sum,
        pdd_service_fee,
        douyin_service_fee,
        payment_expense_sum,
        other_expense_sum,
        shipping_insurance,
        hard_expense,
        qianchuan,
        deposit,
        initial_fund,
        created_at,
        updated_at
      `)
      .order('month', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('获取月度数据失败:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // 插入或更新每日数据
  static async upsertDailyProfit(dailyData: DailyProfit) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('daily_profits')
      .upsert(dailyData, { onConflict: 'date' });
    
    if (error) {
      console.error('更新每日数据失败:', error);
      throw error;
    }
    
    return data;
  }

  // 批量插入或更新每日数据 - 性能优化版
  static async batchUpsertDailyProfits(dailyProfits: DailyProfit[]) {
    const supabase = getSupabaseClient();
    
    console.log(`[Supabase] 开始批量更新 ${dailyProfits.length} 条每日数据`);
    
    // 分批处理，每批100条记录
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < dailyProfits.length; i += batchSize) {
      const batch = dailyProfits.slice(i, i + batchSize);
      console.log(`[Supabase] 处理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(dailyProfits.length/batchSize)}`);
      
      const { data, error } = await supabase
        .from('daily_profits')
        .upsert(batch, { onConflict: 'date' });
      
      if (error) {
        console.error(`批量更新每日数据失败 (批次 ${i}-${i + batch.length}):`, error);
        throw error;
      }
      
      results.push(...(data || []));
    }
    
    console.log(`[Supabase] 批量更新完成，共处理 ${results.length} 条记录`);
    return results;
  }
  
  // 插入或更新月度数据
  static async upsertMonthlySummary(monthlyData: MonthlySummary) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('monthly_summary')
      .upsert(monthlyData, { onConflict: 'month' });
    
    if (error) {
      console.error('更新月度数据失败:', error);
      throw error;
    }
    
    return data;
  }
  
  // 记录同步日志
  static async logSync(log: SyncLog) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sync_logs')
      .insert(log);
    
    if (error) {
      console.error('记录同步日志失败:', error);
      throw error;
    }
    
    return data;
  }
  
  // 移除年度数据相关方法

  // 获取最近的同步状态
  static async getLastSyncStatus() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // 忽略"没有数据"的错误
      console.error('获取同步状态失败:', error);
      throw error;
    }
    
    return data;
  }
  
  // 获取年度利润数据
  static async getYearProfits(limit: number = 10) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('year_profit')
      .select('*')
      .order('year', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('获取年度利润数据失败:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // 插入或更新年度利润数据
  static async upsertYearProfit(yearProfit: YearProfit) {
    const supabase = getSupabaseClient();
    console.log('[Supabase] 插入/更新年度利润数据:', yearProfit);
    
    const { data, error } = await supabase
      .from('year_profit')
      .upsert(yearProfit, { 
        onConflict: 'year',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('[Supabase] 年度利润数据操作失败:', error);
      throw error;
    }
    
    console.log('[Supabase] 年度利润数据操作成功:', data);
    return data;
  }
}

// 实时订阅功能
export const subscribeToDataChanges = (
  table: 'daily_profits' | 'monthly_summary' | 'year_profits',
  callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
    schema: string;
    table: string;
  }) => void
) => {
  const supabase = getSupabaseClient();
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table 
      }, 
      callback
    )
    .subscribe();
};
