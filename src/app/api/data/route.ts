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
        const monthlyData = await SupabaseService.getMonthlySummary(2);
        
        // 计算概览指标
        const currentMonth = monthlyData.find((item) => item.month === '2025-09');
        const lastMonth = monthlyData.find((item) => item.month === '2025-08');
        
        // 移除年度数据调用，恢复昨天的简单逻辑
        
        data = {
          dailyProfitSum: currentMonth?.daily_profit_sum || 0,
          lastMonthDailyProfitSum: lastMonth?.daily_profit_sum || 0,
          monthProfit: currentMonth?.month_profit || 0,
          lastMonthProfit: lastMonth?.month_profit || 0,
          hardExpense: Math.abs(currentMonth?.hard_expense || 0),
          lastMonthHardExpense: Math.abs(lastMonth?.hard_expense || 0),
          qianchuan: Math.abs(currentMonth?.qianchuan || 0),
          lastMonthQianchuan: Math.abs(lastMonth?.qianchuan || 0),
          monthClaimAmount: currentMonth?.claim_amount_sum || 0,
          lastMonthClaimAmount: lastMonth?.claim_amount_sum || 0,
        };
        break;
        
      case 'reports':
        // 扩展：报表专用数据聚合
        const reportsMonthlyData = await SupabaseService.getMonthlySummary(3);
        const reportsDailyData = await SupabaseService.getDailyProfits(
          startDate || '2025-09-01', 
          endDate || '2025-09-30'
        );
        
        const reportsCurrentMonth = reportsMonthlyData.find((item) => item.month === '2025-09');
        const reportsLastMonth = reportsMonthlyData.find((item) => item.month === '2025-08');
        
        // 获取最新每日数据作为"昨日"数据
        const latestDaily = reportsDailyData.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        // 计算月增长率
        const monthGrowthRate = reportsLastMonth?.month_profit 
          ? ((reportsCurrentMonth?.month_profit || 0) - reportsLastMonth.month_profit) / reportsLastMonth.month_profit * 100
          : 0;
        
        // 计算健康度评分
        const healthScore = Math.min(100, Math.max(0, 
          (monthGrowthRate > 0 ? 30 : 10) + 
          ((reportsCurrentMonth?.daily_profit_sum || 0) > 40000 ? 30 : 20) + 
          ((reportsCurrentMonth?.claim_amount_sum || 0) < 5000 ? 25 : 10) + 
          15
        ));
        
        data = {
          kpiData: {
            yesterdayProfit: latestDaily?.daily_profit || 0,
            monthTotal: reportsCurrentMonth?.daily_profit_sum || 0,
            monthGrowthRate: monthGrowthRate,
            targetCompletion: Math.min(100, (reportsCurrentMonth?.daily_profit_sum || 0) / 50000 * 100),
            healthScore: healthScore
          },
          alertData: {
            profitAlert: monthGrowthRate < -10 ? 'error' : monthGrowthRate < 0 ? 'warning' : 'success',
            costAlert: (reportsCurrentMonth?.hard_expense || 0) > 3000 ? 'warning' : 'success',
            cashflowAlert: (reportsCurrentMonth?.claim_amount_sum || 0) > 5000 ? 'warning' : 'success',
            trendAlert: healthScore < 60 ? 'error' : healthScore < 80 ? 'warning' : 'success'
          },
          trendsData: reportsDailyData.slice(0, 30).map((item, index) => ({
            date: item.date,
            dailyProfit: item.daily_profit || 0,
            cumulativeProfit: reportsDailyData.slice(0, index + 1).reduce((sum, d) => sum + (d.daily_profit || 0), 0)
          })),
          analysisData: {
            roi: (reportsCurrentMonth?.daily_profit_sum || 0) / Math.max(1, Math.abs(reportsCurrentMonth?.qianchuan || 1)),
            costStructure: [
              { name: '硬性支出', value: Math.abs(reportsCurrentMonth?.hard_expense || 0), color: '#ff4d4f' },
              { name: '千川投流', value: Math.abs(reportsCurrentMonth?.qianchuan || 0), color: '#fa8c16' },
              { name: '赔付申请', value: reportsCurrentMonth?.claim_amount_sum || 0, color: '#faad14' }
            ],
            riskLevel: (reportsCurrentMonth?.claim_amount_sum || 0) / Math.max(1, reportsCurrentMonth?.daily_profit_sum || 1) * 100
          }
        };
        break;
        
      default:
        return NextResponse.json(
          { error: '无效的数据类型', validTypes: ['daily', 'monthly', 'overview', 'reports'] },
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
