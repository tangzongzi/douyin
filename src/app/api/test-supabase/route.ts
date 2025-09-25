import { NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('[Test] 开始测试Supabase连接（仅读取数据）...');

    const [dailyData, monthlyData] = await Promise.all([
      SupabaseService.getDailyProfits(),
      SupabaseService.getMonthlySummary(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Supabase连接测试成功',
      data: {
        dailyRecords: dailyData.length,
        monthlyRecords: monthlyData.length,
        latestDaily: dailyData[0] || null,
        latestMonthly: monthlyData[0] || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Test] Supabase测试失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Supabase连接测试失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const [dailyData, monthlyData] = await Promise.all([
      SupabaseService.getDailyProfits(),
      SupabaseService.getMonthlySummary(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Supabase连接正常',
      data: {
        dailyRecords: dailyData.length,
        monthlyRecords: monthlyData.length,
        latestDaily: dailyData[0] || null,
        latestMonthly: monthlyData[0] || null,
      },
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
