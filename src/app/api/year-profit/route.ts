import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const source = searchParams.get('source') || 'supabase'; // supabase 或 feishu
  
  try {
    console.log(`[API] 获取年度利润数据，来源: ${source}, 限制: ${limit}`);
    
    if (source === 'feishu') {
      // 直接从飞书获取数据
      const feishuResponse = await fetch(
        `${request.nextUrl.origin}/api/feishu?table=yearly`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!feishuResponse.ok) {
        throw new Error('飞书API调用失败');
      }
      
      const feishuData = await feishuResponse.json();
      
      return NextResponse.json({
        success: true,
        message: '从飞书获取年度利润数据成功',
        data: feishuData.data || [],
        source: 'feishu',
        count: feishuData.data?.length || 0,
        timestamp: new Date().toISOString()
      });
    } else {
      // 从Supabase获取数据
      const data = await SupabaseService.getYearProfits(limit);
      
      return NextResponse.json({
        success: true,
        message: '获取年度利润数据成功',
        data: data,
        source: 'supabase',
        count: data.length,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('[API] 获取年度利润数据失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '获取年度利润数据失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, profit_with_deposit, total_profit_with_deposit, profit_without_deposit, net_profit_without_deposit } = body;
    
    // 验证必填字段
    if (!year) {
      return NextResponse.json(
        { success: false, message: '年份字段不能为空' },
        { status: 400 }
      );
    }
    
    console.log('[API] 创建/更新年度利润数据:', body);
    
    const yearProfit = {
      year,
      profit_with_deposit: profit_with_deposit || 0,
      total_profit_with_deposit: total_profit_with_deposit || 0,
      profit_without_deposit: profit_without_deposit || 0,
      net_profit_without_deposit: net_profit_without_deposit || 0,
    };
    
    const result = await SupabaseService.upsertYearProfit(yearProfit);
    
    return NextResponse.json({
      success: true,
      message: '年度利润数据保存成功',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API] 保存年度利润数据失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '保存年度利润数据失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
