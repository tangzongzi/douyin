import { NextRequest, NextResponse } from 'next/server';
import { ENV_CONFIG } from '@/config/env';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] ==================== 测试年度表格访问 ====================');
    console.log('[TEST] 表格ID:', ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID);
    console.log('[TEST] APP_TOKEN:', ENV_CONFIG.FEISHU_APP_TOKEN);
    
    // 1. 获取访问令牌
    const tokenResponse = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: ENV_CONFIG.FEISHU_APP_ID,
      app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    
    console.log('[TEST] 令牌响应:', tokenResponse.data);
    
    if (tokenResponse.data.code !== 0) {
      throw new Error(`获取令牌失败: ${tokenResponse.data.msg}`);
    }
    
    const accessToken = tokenResponse.data.tenant_access_token;
    
    // 2. 测试年度表格访问
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID}/records`;
    console.log('[TEST] 请求URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: { page_size: 10 },
      timeout: 15000,
      validateStatus: () => true, // 接受所有状态码
    });
    
    console.log('[TEST] 响应状态:', response.status);
    console.log('[TEST] 响应头:', response.headers);
    console.log('[TEST] 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 返回详细的调试信息
    return NextResponse.json({
      success: response.status === 200 && response.data.code === 0,
      config: {
        tableId: ENV_CONFIG.FEISHU_YEAR_PROFIT_TABLE_ID,
        appToken: ENV_CONFIG.FEISHU_APP_TOKEN,
        appId: ENV_CONFIG.FEISHU_APP_ID
      },
      response: {
        status: response.status,
        businessCode: response.data?.code,
        message: response.data?.msg,
        data: response.data?.data,
        error: response.data?.error
      },
      url: url,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TEST] 测试失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

