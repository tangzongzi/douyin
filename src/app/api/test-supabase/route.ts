import { NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('[Test] 开始测试Supabase连接...');
    
    // 测试插入模拟数据
    const testDailyData = {
      date: '2024-09-24',
      daily_profit: 1500.00,
      other_expense: 200.00,
      payment_expense: 5000.00,
      withdraw_amount: 1000.00,
      claim_amount: 100.00
    };
    
    const testMonthlyData = {
      month: '2024-09',
      month_profit: 45000.00,
      net_cashflow: 170000.00,
      claim_amount_sum: 5000.00,
      pdd_service_fee: 2000.00,
      douyin_service_fee: 1500.00,
      payment_expense_sum: 150000.00,
      other_expense_sum: 8000.00,
      shipping_insurance: 3000.00,
      hard_expense: 0.00,
      qianchuan: 0.00,
      deposit: 0.00,
      initial_fund: 0.00
    };
    
    // 测试插入数据
    console.log('[Test] 插入测试每日数据...');
    await SupabaseService.upsertDailyProfit(testDailyData);
    
    console.log('[Test] 插入测试月度数据...');
    await SupabaseService.upsertMonthlySummary(testMonthlyData);
    
    // 测试读取数据
    console.log('[Test] 读取每日数据...');
    const dailyData = await SupabaseService.getDailyProfits();
    
    console.log('[Test] 读取月度数据...');
    const monthlyData = await SupabaseService.getMonthlySummary();
    
    return NextResponse.json({
      success: true,
      message: 'Supabase连接测试成功',
      data: {
        dailyRecords: dailyData.length,
        monthlyRecords: monthlyData.length,
        testDataInserted: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test] Supabase测试失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase连接测试失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 简单的连接测试
    const dailyData = await SupabaseService.getDailyProfits();
    const monthlyData = await SupabaseService.getMonthlySummary();
    
    return NextResponse.json({
      success: true,
      message: 'Supabase连接正常',
      data: {
        dailyRecords: dailyData.length,
        monthlyRecords: monthlyData.length,
        latestDaily: dailyData[0] || null,
        latestMonthly: monthlyData[0] || null
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '连接失败'
      },
      { status: 500 }
    );
  }
}
