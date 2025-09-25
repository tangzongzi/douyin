import { NextRequest, NextResponse } from 'next/server';
import { ENV_CONFIG } from '@/config/env';
import axios from 'axios';

// 获取飞书访问令牌
async function getFeishuAccessToken(): Promise<string> {
  const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: ENV_CONFIG.FEISHU_APP_ID,
    app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
  });
  return response.data.tenant_access_token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'daily';
    
    let tableId = ENV_CONFIG.TABLE_BASE_DAILY;
    if (table === 'monthly') tableId = ENV_CONFIG.TABLE_MONTH_SUMMARY;
    if (table === 'yearly') tableId = ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID;
    
    console.log(`[调试] 检查表格字段: ${table} (${tableId})`);
    
    const accessToken = await getFeishuAccessToken();
    
    // 获取表格数据（只取前3条用于调试）
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${tableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: { page_size: 3 },
        timeout: 15000,
      }
    );
    
    if (response.data.code !== 0) {
      throw new Error(`API错误: ${response.data.msg}`);
    }
    
    const records = response.data.data?.items || [];
    
    // 分析字段结构
    const fieldAnalysis = records.map((record, index) => ({
      recordIndex: index,
      allFields: Object.keys(record.fields || {}),
      fieldValues: record.fields || {}
    }));
    
    return NextResponse.json({
      success: true,
      table: table,
      tableId: tableId,
      recordCount: records.length,
      fieldAnalysis: fieldAnalysis,
      message: `成功分析 ${table} 表格的字段结构`
    });
    
  } catch (error) {
    console.error('[调试] 字段分析失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '字段分析失败',
      details: axios.isAxiosError(error) ? {
        status: error.response?.status,
        data: error.response?.data
      } : null
    }, { status: 500 });
  }
}
