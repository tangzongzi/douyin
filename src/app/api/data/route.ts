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
        
        // 获取年度数据
        const yearlyData = await SupabaseService.getYearlyData('2025');
        const currentYear = yearlyData && yearlyData.length > 0 ? yearlyData[0] : null;
        
        console.log('[API] 年度数据查询结果:', yearlyData);
        console.log('[API] 当前年度数据:', currentYear);
        console.log('[API] Supabase年度数据时间戳:', currentYear?.updated_at);
        
        // 检查年度数据是否过期（如果更新时间超过1小时，尝试重新同步）
        const isYearDataStale = !currentYear || 
          !currentYear.updated_at || 
          (new Date().getTime() - new Date(currentYear.updated_at).getTime()) > 60 * 60 * 1000;
        
        if (isYearDataStale) {
          console.log('[API] 年度数据过期或不存在，尝试从飞书重新同步');
          try {
            // 触发年度数据同步
            const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync?type=yearly`, {
              method: 'POST'
            });
            if (syncResponse.ok) {
              console.log('[API] 年度数据同步成功，重新获取');
              const newYearlyData = await SupabaseService.getYearlyData('2025');
              const newCurrentYear = newYearlyData && newYearlyData.length > 0 ? newYearlyData[0] : null;
              if (newCurrentYear) {
                console.log('[API] 获取到新的年度数据:', newCurrentYear);
              }
            }
          } catch (syncError) {
            console.error('[API] 年度数据同步失败:', syncError);
          }
        }
        
        // 重新获取年度数据
        const finalYearlyData = await SupabaseService.getYearlyData('2025');
        const finalCurrentYear = finalYearlyData && finalYearlyData.length > 0 ? finalYearlyData[0] : null;
        
        let profitWithDeposit = finalCurrentYear?.profit_with_deposit || 0;
        let profitWithoutDeposit = finalCurrentYear?.profit_without_deposit || 0;
        
        if ((!currentYear || (profitWithDeposit === 0 && profitWithoutDeposit === 0)) && monthlyData.length > 0) {
          console.log('[API] 年度数据为空，从月度数据计算累计值');
          console.log('[API] 月度数据:', monthlyData.map(m => ({ 
            month: m.month, 
            profit: m.month_profit, 
            deposit: m.deposit,
            dailyProfitSum: m.daily_profit_sum 
          })));
          
          // 从月度数据计算累计值
          const totalMonthlyProfit = monthlyData.reduce((sum, month) => sum + (month.month_profit || 0), 0);
          const totalDailyProfitSum = monthlyData.reduce((sum, month) => sum + (month.daily_profit_sum || 0), 0);
          const totalDeposit = monthlyData.reduce((sum, month) => sum + (month.deposit || 0), 0);
          const totalInitialFund = monthlyData.reduce((sum, month) => sum + (month.initial_fund || 0), 0);
          
          // 计算含保证金和不含保证金利润
          // 含保证金利润 = 总月净利润 + 保证金 + 初始资金
          profitWithDeposit = totalMonthlyProfit + totalDeposit + totalInitialFund;
          // 不含保证金利润 = 总月净利润
          profitWithoutDeposit = totalMonthlyProfit;
          
          console.log('[API] 计算详情:');
          console.log('[API] - 总月净利润:', totalMonthlyProfit);
          console.log('[API] - 总每日利润汇总:', totalDailyProfitSum);
          console.log('[API] - 总保证金:', totalDeposit);
          console.log('[API] - 总初始资金:', totalInitialFund);
          console.log('[API] - 含保证金利润:', profitWithDeposit);
          console.log('[API] - 不含保证金利润:', profitWithoutDeposit);
        }
        
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
          // 年度累计数据
          profitWithDeposit: profitWithDeposit,
          profitWithoutDeposit: profitWithoutDeposit,
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
