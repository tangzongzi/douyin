import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const confirm = searchParams.get('confirm') === 'true';
  
  try {
    const supabase = getSupabaseClient();
    
    if (action === 'check-extra-fields') {
      // 检查是否存在多余字段
      console.log('[Cleanup] 检查数据库表结构...');
      
      const { data, error } = await supabase
        .from('monthly_summary')
        .select('*')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      const fields = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      // 定义标准字段列表
      const standardFields = [
        'id', 'month', 'daily_profit_sum', 'month_profit', 'net_cashflow',
        'claim_amount_sum', 'pdd_service_fee', 'douyin_service_fee',
        'payment_expense_sum', 'other_expense_sum', 'shipping_insurance',
        'hard_expense', 'qianchuan', 'deposit', 'initial_fund',
        'created_at', 'updated_at'
      ];
      
      const extraFields = fields.filter(field => !standardFields.includes(field));
      
      return NextResponse.json({
        success: true,
        data: {
          totalFields: fields.length,
          standardFields: standardFields.length,
          extraFields: extraFields,
          allFields: fields,
          hasExtraFields: extraFields.length > 0
        },
        message: extraFields.length > 0 
          ? `发现 ${extraFields.length} 个多余字段: ${extraFields.join(', ')}` 
          : '没有发现多余字段'
      });
    }
    
    if (action === 'delete-extra-field') {
      if (!confirm) {
        return NextResponse.json({
          success: false,
          error: '需要确认参数 confirm=true 才能执行删除操作',
          warning: '此操作将永久删除数据库字段，请谨慎操作！'
        }, { status: 400 });
      }
      
      console.log('[Cleanup] 准备删除多余字段...');
      
      // 使用原生SQL删除字段
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.monthly_summary DROP COLUMN IF EXISTS previous_month_profit;'
      });
      
      if (error) {
        // 如果rpc不可用，返回手动删除指南
        return NextResponse.json({
          success: false,
          error: '无法通过API删除字段，请手动删除',
          manual_steps: [
            '1. 打开Supabase Dashboard',
            '2. 进入 Table Editor',
            '3. 选择 monthly_summary 表',
            '4. 找到 previous_month_profit 字段',
            '5. 点击字段右侧的菜单，选择删除',
            '6. 或者在SQL Editor中执行: ALTER TABLE public.monthly_summary DROP COLUMN IF EXISTS previous_month_profit;'
          ]
        });
      }
      
      return NextResponse.json({
        success: true,
        message: '字段删除成功',
        data: { deletedField: 'previous_month_profit' }
      });
    }
    
    // 默认返回帮助信息
    return NextResponse.json({
      success: true,
      message: '数据库清理工具',
      endpoints: {
        'POST /api/cleanup-database?action=check-extra-fields': '检查多余字段',
        'POST /api/cleanup-database?action=delete-extra-field&confirm=true': '删除多余字段（危险操作）'
      },
      warning: '删除字段是不可逆操作，请谨慎使用！'
    });
    
  } catch (error) {
    console.error('[Cleanup] 数据库清理失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '数据库清理失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
