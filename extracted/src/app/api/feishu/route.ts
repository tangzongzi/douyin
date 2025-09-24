import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ENV_CONFIG } from '@/config/env';

// 飞书 API 基础 URL
const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

// 获取访问令牌
async function getAccessToken(): Promise<string> {
  try {
    console.log('[Server] 正在获取飞书访问令牌...');
    
    const response = await axios.post(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
      app_id: ENV_CONFIG.FEISHU_APP_ID,
      app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    
    console.log('[Server] 飞书访问令牌响应:', response.data);
    
    if (response.data.code === 0) {
      console.log('[Server] 访问令牌获取成功');
      return response.data.tenant_access_token;
    }
    throw new Error(`获取访问令牌失败: ${response.data.msg || '未知错误'}`);
  } catch (error) {
    console.error('[Server] 获取飞书访问令牌失败:', error);
    throw error;
  }
}

// 获取表格数据
async function getTableData(tableId: string, pageSize: number = 100) {
  try {
    console.log('[Server] 正在获取表格数据...', { tableId });
    
    const accessToken = await getAccessToken();
    
    const url = `${FEISHU_BASE_URL}/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${tableId}/records`;
    console.log('[Server] 请求URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        page_size: pageSize,
      },
      timeout: 15000,
    });

    console.log('[Server] 表格数据响应:', response.data);

    if (response.data.code === 0) {
      const items = response.data.data?.items || [];
      console.log(`[Server] 成功获取 ${items.length} 条记录`);
      return items;
    }
    throw new Error(`获取表格数据失败: ${response.data.msg || '未知错误'}`);
  } catch (error) {
    console.error('[Server] 获取飞书表格数据失败:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  
  try {
    let tableId: string;
    
    switch (table) {
      case 'daily':
        tableId = ENV_CONFIG.TABLE_BASE_DAILY;
        break;
      case 'monthly':
        tableId = ENV_CONFIG.TABLE_MONTH_SUMMARY;
        break;
      default:
        return NextResponse.json(
          { error: '无效的表格类型', code: 400 },
          { status: 400 }
        );
    }
    
    const data = await getTableData(tableId);
    
    return NextResponse.json({
      code: 0,
      data: data,
      message: '获取数据成功'
    });
    
  } catch (error) {
    console.error('[API] 处理请求失败:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '获取数据失败',
        code: 500,
        details: error instanceof axios.AxiosError ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        } : undefined
      },
      { status: 500 }
    );
  }
}
