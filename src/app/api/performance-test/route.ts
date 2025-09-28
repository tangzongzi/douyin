import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test') || 'all';
  
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    if (test === 'query' || test === 'all') {
      // 测试查询性能
      console.log('[Performance] 开始查询性能测试...');
      
      const queryStart = performance.now();
      const monthlyData = await SupabaseService.getMonthlySummary(6);
      const queryEnd = performance.now();
      
      results.tests.queryPerformance = {
        duration: Math.round(queryEnd - queryStart),
        recordCount: monthlyData.length,
        avgTimePerRecord: Math.round((queryEnd - queryStart) / monthlyData.length),
        status: 'success'
      };
      
      console.log(`[Performance] 查询测试完成: ${results.tests.queryPerformance.duration}ms`);
    }
    
    if (test === 'daily' || test === 'all') {
      // 测试每日数据查询
      const dailyStart = performance.now();
      const dailyData = await SupabaseService.getDailyProfits('2025-09-01', '2025-09-30');
      const dailyEnd = performance.now();
      
      results.tests.dailyQuery = {
        duration: Math.round(dailyEnd - dailyStart),
        recordCount: dailyData.length,
        avgTimePerRecord: dailyData.length > 0 ? Math.round((dailyEnd - dailyStart) / dailyData.length) : 0,
        status: 'success'
      };
      
      console.log(`[Performance] 每日数据查询测试完成: ${results.tests.dailyQuery.duration}ms`);
    }
    
    if (test === 'indexes' || test === 'all') {
      // 检查索引状态
      console.log('[Performance] 检查数据库索引状态...');
      
      // 注意：这个查询需要适当的权限，可能在某些环境下无法执行
      try {
        const { data: indexData, error } = await SupabaseService.getSupabaseClient()
          .rpc('get_table_indexes', { table_names: ['daily_profits', 'monthly_summary', 'year_profit'] });
        
        results.tests.indexStatus = {
          status: error ? 'error' : 'success',
          error: error?.message,
          indexes: indexData || [],
          message: error ? '需要手动执行索引SQL脚本' : '索引状态检查完成'
        };
      } catch (indexError) {
        results.tests.indexStatus = {
          status: 'warning',
          message: '无法自动检查索引，请手动在Supabase SQL Editor中执行 optimize-database-indexes.sql',
          suggestion: '在Supabase Dashboard > SQL Editor中运行索引优化脚本'
        };
      }
    }
    
    // 计算总体性能评分
    const totalDuration = Object.values(results.tests)
      .filter((test: any) => test.duration)
      .reduce((sum: number, test: any) => sum + test.duration, 0);
    
    results.summary = {
      totalTestDuration: totalDuration,
      overallStatus: totalDuration < 1000 ? 'excellent' : totalDuration < 2000 ? 'good' : 'needs_optimization',
      recommendations: []
    };
    
    // 性能建议
    if (totalDuration > 2000) {
      results.summary.recommendations.push('建议执行数据库索引优化脚本');
    }
    if (results.tests.queryPerformance?.duration > 500) {
      results.summary.recommendations.push('月度数据查询较慢，检查数据量和索引');
    }
    if (results.tests.dailyQuery?.duration > 800) {
      results.summary.recommendations.push('每日数据查询较慢，建议优化日期范围查询');
    }
    
    return NextResponse.json({
      success: true,
      message: '性能测试完成',
      ...results
    });
    
  } catch (error) {
    console.error('[Performance] 性能测试失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '性能测试失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
