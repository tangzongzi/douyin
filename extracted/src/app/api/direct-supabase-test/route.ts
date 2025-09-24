import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // 直接使用硬编码的配置测试连接
    const supabaseUrl = 'https://gayywaplwsilukawgwpt.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheXl3YXBsd3NpbHVrYXdnd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNTEsImV4cCI6MjA3NDI2MjA1MX0.HTWNBuOto7nMk4nQ_M9yRt0TDpdrBBinn-JuB_Z2qho';
    
    console.log('[Direct Test] 创建Supabase客户端...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('[Direct Test] 测试数据库连接...');
    
    // 测试简单查询（使用正确的Supabase语法）
    const { data, error, count } = await supabase
      .from('daily_profits')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('[Direct Test] 查询失败:', error);
      
      return NextResponse.json({
        success: false,
        message: 'Supabase连接失败',
        error: error.message,
        details: error,
        config: {
          url: supabaseUrl,
          keyPrefix: supabaseKey.substring(0, 20) + '...'
        }
      });
    }
    
    console.log('[Direct Test] 查询成功:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase连接成功',
      data: {
        records: data,
        count: count,
        totalRecords: count || 0
      },
      config: {
        url: supabaseUrl,
        keyPrefix: supabaseKey.substring(0, 20) + '...'
      }
    });
    
  } catch (error) {
    console.error('[Direct Test] 测试失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '连接测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // 测试插入数据
    const supabaseUrl = 'https://gayywaplwsilukawgwpt.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheXl3YXBsd3NpbHVrYXdnd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNTEsImV4cCI6MjA3NDI2MjA1MX0.HTWNBuOto7nMk4nQ_M9yRt0TDpdrBBinn-JuB_Z2qho';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 插入测试数据
    const testData = {
      date: '2024-09-24',
      daily_profit: 1500.50,
      other_expense: 200.00,
      payment_expense: 5000.00,
      withdraw_amount: 1000.00,
      claim_amount: 100.00
    };
    
    console.log('[Direct Test] 插入测试数据:', testData);
    
    const { data, error } = await supabase
      .from('daily_profits')
      .upsert(testData)
      .select();
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: '插入数据失败',
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '数据插入成功',
      data: data
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
