import { NextRequest, NextResponse } from 'next/server';
import { syncAllData, syncDailyData, syncMonthlyData, syncYearData, validateDataSync } from '@/lib/feishu-sync';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  
  try {
    console.log(`[API] 开始同步，类型: ${type}`);
    
    let result;
    
    switch (type) {
      case 'daily':
        result = await syncDailyData();
        break;
      case 'monthly':
        result = await syncMonthlyData();
        break;
      case 'yearly':
        result = await syncYearData();
        break;
      case 'all':
      default:
        result = await syncAllData();
        break;
    }
    
    return NextResponse.json({
      success: true,
      message: '数据同步成功',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API] 数据同步失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '数据同步失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    if (action === 'validate') {
      // 验证数据同步状态
      const isValid = await validateDataSync();
      
      return NextResponse.json({
        success: true,
        data: {
          isValid,
          message: isValid ? '数据同步正常' : '数据同步异常，需要重新同步'
        }
      });
    }
    
    // 默认返回同步状态
    return NextResponse.json({
      success: true,
      message: '同步API就绪',
      endpoints: {
        'POST /api/sync?type=all': '完整同步',
        'POST /api/sync?type=daily': '同步每日数据',
        'POST /api/sync?type=monthly': '同步月度数据',
        'POST /api/sync?type=yearly': '同步年度数据',
        'GET /api/sync?action=validate': '验证同步状态'
      }
    });
    
  } catch (error) {
    console.error('[API] 处理请求失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
