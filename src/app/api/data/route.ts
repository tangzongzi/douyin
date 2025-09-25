import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    let data;
    
    switch (type) {
      case 'daily':
        data = await SupabaseService.getDailyProfits(startDate || undefined, endDate || undefined);
        break;
        
      case 'monthly':
        const limit = parseInt(searchParams.get('limit') || '12');
        data = await SupabaseService.getMonthlySummary(limit);
        break;
        
      case 'overview':
        // 获取概览数据
        const [dailyData, monthlyData] = await Promise.all([
          SupabaseService.getDailyProfits('2025-09-01', '2025-09-30'), // 当月数据
          SupabaseService.getMonthlySummary(2) // 最近2个月
        ]);
        
        // 计算概览指标
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayRecord = dailyData.find(item => item.date === today);
        const yesterdayRecord = dailyData.find(item => item.date === yesterday);
        const currentMonth = monthlyData.find(item => item.month === '2025-09');
        const lastMonth = monthlyData.find(item => item.month === '2025-08');
        
        // 移除年度数据调用，恢复昨天的简单逻辑
        
        data = {
          dailyProfitSum: currentMonth?.daily_profit_sum || 0, // 月度每日利润汇总（第一位）
          lastMonthDailyProfitSum: lastMonth?.daily_profit_sum || 0,
          monthProfit: currentMonth?.month_profit || 0, // 月净利润（第二位）
          lastMonthProfit: lastMonth?.month_profit || 0,
          hardExpense: Math.abs(currentMonth?.hard_expense || 0), // 硬性支出（第三位）
          lastMonthHardExpense: Math.abs(lastMonth?.hard_expense || 0),
          qianchuan: Math.abs(currentMonth?.qianchuan || 0), // 千川投流（第四位）
          lastMonthQianchuan: Math.abs(lastMonth?.qianchuan || 0),
          monthClaimAmount: currentMonth?.claim_amount_sum || 0, // 当月赔付申请（第五位）
          lastMonthClaimAmount: lastMonth?.claim_amount_sum || 0,
          // 移除年度数据，恢复昨天的简单结构
        };
        break;
        
      default:
        return NextResponse.json(
          { error: '无效的数据类型', validTypes: ['daily', 'monthly', 'overview'] },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 1,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API] 获取数据失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取数据失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
