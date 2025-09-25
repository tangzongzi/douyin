import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const confirm = searchParams.get('confirm') === 'true';
    
    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: '需要确认删除操作，请添加 ?confirm=true 参数'
      }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();
    let result;
    
    switch (table) {
      case 'daily':
        // 清空每日数据表
        const { error: dailyError } = await supabase
          .from('daily_profits')
          .delete()
          .neq('id', 0); // 删除所有记录
        
        if (dailyError) throw dailyError;
        result = { table: 'daily_profits', action: 'cleared', message: '每日数据表已清空' };
        break;
        
      case 'monthly':
        // 清空月度数据表
        const { error: monthlyError } = await supabase
          .from('monthly_summary')
          .delete()
          .neq('id', 0);
        
        if (monthlyError) throw monthlyError;
        result = { table: 'monthly_summary', action: 'cleared', message: '月度数据表已清空' };
        break;
        
      case 'yearly':
        // 清空年度数据表
        const { error: yearlyError } = await supabase
          .from('year_profit')
          .delete()
          .neq('id', 0);
        
        if (yearlyError) throw yearlyError;
        result = { table: 'year_profit', action: 'cleared', message: '年度数据表已清空' };
        break;
        
      case 'logs':
        // 清空同步日志表
        const { error: logsError } = await supabase
          .from('sync_logs')
          .delete()
          .neq('id', 0);
        
        if (logsError) throw logsError;
        result = { table: 'sync_logs', action: 'cleared', message: '同步日志已清空' };
        break;
        
      case 'all':
        // 清空所有主要表（不包括视图，视图会自动更新）
        const [dailyResult, monthlyResult, yearlyResult, logsResult] = await Promise.all([
          supabase.from('daily_profits').delete().neq('id', 0),
          supabase.from('monthly_summary').delete().neq('id', 0),
          supabase.from('year_profit').delete().neq('id', 0),
          supabase.from('sync_logs').delete().neq('id', 0)
        ]);
        
        if (dailyResult.error) throw dailyResult.error;
        if (monthlyResult.error) throw monthlyResult.error;
        if (yearlyResult.error) throw yearlyResult.error;
        if (logsResult.error) throw logsResult.error;
        
        result = { 
          tables: ['daily_profits', 'monthly_summary', 'year_profit', 'sync_logs'], 
          action: 'cleared',
          message: '所有数据表已清空，视图会自动更新'
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: '无效的表格类型，支持: daily, monthly, yearly, logs, all'
        }, { status: 400 });
    }
    
    console.log('[清理] 数据库清理完成:', result);
    
    return NextResponse.json({
      success: true,
      message: '数据库清理成功',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[清理] 数据库清理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '清理失败',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
