import { NextRequest, NextResponse } from 'next/server';
import { ENV_CONFIG } from '@/config/env';
import { SupabaseService } from '@/lib/supabase';
import axios from 'axios';

// 获取飞书访问令牌
async function getFeishuAccessToken(): Promise<string> {
  console.log('[Test] 获取飞书访问令牌...');
  const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: ENV_CONFIG.FEISHU_APP_ID,
    app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  
  if (response.data && response.data.code === 0) {
    return response.data.tenant_access_token;
  }
  
  throw new Error(`获取访问令牌失败: ${response.data?.msg || '响应格式错误'}`);
}

// 获取飞书表格数据
async function getFeishuTableData(tableId: string, accessToken: string): Promise<any[]> {
  console.log(`[Test] 获取表格数据: ${tableId}`);
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${tableId}/records`;
  
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    params: { page_size: 100 },
    timeout: 15000,
  });

  if (response.data && response.data.code === 0) {
    return response.data.data?.items || [];
  }
  
  throw new Error(`获取表格数据失败: ${response.data?.msg || `HTTP ${response.status}`}`);
}

export async function GET(request: NextRequest) {
  const testResults = {
    step1_config: null,
    step2_feishu_access: null,
    step3_feishu_data: null,
    step4_supabase_test: null,
    step5_final_result: null
  };
  
  try {
    // 步骤1: 检查配置
    console.log('[Test] 步骤1: 检查配置');
    testResults.step1_config = {
      app_id: ENV_CONFIG.FEISHU_APP_ID,
      app_secret: ENV_CONFIG.FEISHU_APP_SECRET ? '已设置' : '未设置',
      app_token: ENV_CONFIG.FEISHU_APP_TOKEN,
      year_table_id: ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID
    };
    
    // 步骤2: 测试飞书访问
    console.log('[Test] 步骤2: 测试飞书访问');
    const accessToken = await getFeishuAccessToken();
    testResults.step2_feishu_access = { success: true, message: '飞书访问令牌获取成功' };
    
    // 步骤3: 获取年度表格数据
    console.log('[Test] 步骤3: 获取年度表格数据');
    const feishuData = await getFeishuTableData(ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID, accessToken);
    
    // 分析字段映射
    const fieldAnalysis = feishuData.map((record, index) => {
      const fields = record.fields || {};
      const fieldKeys = Object.keys(fields);
      
      // 尝试匹配保证金相关字段
      const profitWithDepositField = fieldKeys.find(key => 
        key.includes('含保证金') && key.includes('利润')
      );
      const profitWithoutDepositField = fieldKeys.find(key => 
        key.includes('不含保证金') && key.includes('利润')
      );
      
      return {
        index,
        allFields: fieldKeys,
        fieldValues: fields,
        mappedFields: {
          '含保证金利润': profitWithDepositField ? fields[profitWithDepositField] : null,
          '不含保证金利润': profitWithoutDepositField ? fields[profitWithoutDepositField] : null,
          '含保证金利润字段名': profitWithDepositField,
          '不含保证金利润字段名': profitWithoutDepositField
        }
      };
    });
    
    testResults.step3_feishu_data = {
      success: true,
      record_count: feishuData.length,
      raw_data: feishuData,
      field_analysis: fieldAnalysis
    };
    
    // 步骤4: 测试Supabase连接
    console.log('[Test] 步骤4: 测试Supabase连接');
    const existingYearData = await SupabaseService.getYearlyData('2025');
    testResults.step4_supabase_test = {
      success: true,
      existing_records: existingYearData?.length || 0,
      existing_data: existingYearData
    };
    
    // 步骤5: 如果有飞书数据，尝试插入一条测试数据
    if (feishuData.length > 0) {
      console.log('[Test] 步骤5: 尝试插入测试数据');
      
      const testRecord = feishuData[0];
      const testData = {
        year: '2025',
        profit_with_deposit: 100000, // 测试值
        total_profit_with_deposit: 100000,
        profit_without_deposit: 80000, // 测试值
        net_profit_without_deposit: 80000
      };
      
      try {
        await SupabaseService.upsertYearProfit(testData);
        testResults.step5_final_result = { success: true, message: '测试数据插入成功', test_data: testData };
      } catch (error) {
        testResults.step5_final_result = { 
          success: false, 
          error: error instanceof Error ? error.message : '插入失败',
          test_data: testData 
        };
      }
    } else {
      testResults.step5_final_result = { success: false, message: '飞书年度表格无数据，无法测试插入' };
    }
    
    return NextResponse.json({
      success: true,
      message: '年度数据同步测试完成',
      results: testResults,
      summary: {
        config_ok: !!testResults.step1_config,
        feishu_access_ok: testResults.step2_feishu_access?.success || false,
        feishu_data_count: testResults.step3_feishu_data?.record_count || 0,
        supabase_ok: testResults.step4_supabase_test?.success || false,
        test_insert_ok: testResults.step5_final_result?.success || false
      }
    });
    
  } catch (error) {
    console.error('[Test] 年度数据同步测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      results: testResults,
      failed_at: Object.keys(testResults).find(key => testResults[key as keyof typeof testResults] === null)
    }, { status: 500 });
  }
}
