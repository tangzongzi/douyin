import { NextRequest, NextResponse } from 'next/server';
import { ENV_CONFIG } from '@/config/env';
import axios from 'axios';

// 获取飞书访问令牌
async function getFeishuAccessToken(): Promise<string> {
  try {
    console.log('[Debug] 获取飞书访问令牌...');
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
  } catch (error) {
    console.error('[Debug] 获取飞书访问令牌失败:', error);
    throw error;
  }
}

// 获取飞书表格数据
async function getFeishuTableData(tableId: string, accessToken: string): Promise<any[]> {
  try {
    console.log(`[Debug] 获取表格数据: ${tableId}`);
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
      const items = response.data.data?.items || [];
      console.log(`[Debug] 成功获取 ${items.length} 条记录`);
      return items;
    }
    
    throw new Error(`获取表格数据失败: ${response.data?.msg || `HTTP ${response.status}`}`);
  } catch (error) {
    console.error('[Debug] 获取飞书表格数据失败:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug] 开始调试年度数据...');
    
    // 1. 获取访问令牌
    const accessToken = await getFeishuAccessToken();
    console.log('[Debug] 访问令牌获取成功');
    
    // 2. 获取年度表格数据
    const yearTableId = ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID;
    console.log('[Debug] 年度表格ID:', yearTableId);
    
    const feishuData = await getFeishuTableData(yearTableId, accessToken);
    console.log('[Debug] 年度表格原始数据:', JSON.stringify(feishuData, null, 2));
    
    // 3. 分析数据结构
    const analysis = {
      recordCount: feishuData.length,
      records: feishuData.map((record, index) => ({
        index,
        recordId: record.record_id,
        fields: record.fields ? Object.keys(record.fields) : [],
        fieldValues: record.fields || {}
      }))
    };
    
    return NextResponse.json({
      success: true,
      message: '年度数据调试完成',
      data: {
        tableId: yearTableId,
        appToken: ENV_CONFIG.FEISHU_APP_TOKEN,
        rawData: feishuData,
        analysis: analysis
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Debug] 年度数据调试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof axios.AxiosError ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
