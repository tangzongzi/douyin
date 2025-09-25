import axios from 'axios';
import { ENV_CONFIG } from '@/config/env';
import { MOCK_DAILY_DATA, MOCK_MONTH_DATA } from './mock-data';

// 飞书 API 配置
const FEISHU_APP_ID = ENV_CONFIG.FEISHU_APP_ID;
const FEISHU_APP_SECRET = ENV_CONFIG.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = ENV_CONFIG.FEISHU_APP_TOKEN;
// 下列常量目前用于调试日志，如后续需要恢复原逻辑可再次引用

// 飞书 API 基础 URL
const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

// 获取访问令牌
export async function getAccessToken(): Promise<string> {
  try {
    console.log('正在获取飞书访问令牌...', { app_id: FEISHU_APP_ID });
    
    const response = await axios.post(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000, // 15秒超时
      withCredentials: false,
    });
    
    console.log('飞书访问令牌响应:', response.data);
    
    if (response.data.code === 0) {
      console.log('访问令牌获取成功');
      return response.data.tenant_access_token;
    }
    throw new Error(`获取访问令牌失败: ${response.data.msg}`);
  } catch (error) {
    console.error('获取飞书访问令牌失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw error;
  }
}

// 飞书表格记录类型
interface FeishuRecord {
  fields: Record<string, unknown>;
  record_id: string;
}

// 获取表格数据
export async function getTableData(tableId: string, pageSize: number = 100): Promise<FeishuRecord[]> {
  try {
    console.log('正在获取表格数据...', { tableId, appToken: FEISHU_APP_TOKEN });
    
    const accessToken = await getAccessToken();
    
    const url = `${FEISHU_BASE_URL}/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${tableId}/records`;
    console.log('请求URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        page_size: pageSize,
      },
    });

    console.log('表格数据响应:', response.data);

    if (response.data.code === 0) {
      const items = response.data.data.items || [];
      console.log(`成功获取 ${items.length} 条记录`);
      return items;
    }
    throw new Error(`获取表格数据失败: ${response.data.msg}`);
  } catch (error) {
    console.error('获取飞书表格数据失败:', error);
    throw error;
  }
}

// 获取每日基础数据
export async function getDailyData(): Promise<FeishuRecord[]> {
  try {
    console.log('正在获取每日基础数据...');
    const response = await axios.get('/api/feishu?table=daily', {
      timeout: 30000, // 30秒超时
    });
    
    if (response.data.code === 0) {
      const data = response.data.data || [];
      console.log('每日基础数据获取成功:', data.length, '条记录');
      return data;
    } else {
      throw new Error(response.data.error || '获取数据失败');
    }
  } catch (error) {
    console.error('获取每日基础数据失败，使用模拟数据:', error);
    if (axios.isAxiosError(error)) {
      console.error('API错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return MOCK_DAILY_DATA;
  }
}

// 获取月度汇总数据
export async function getMonthSummaryData(): Promise<FeishuRecord[]> {
  try {
    console.log('正在获取月度汇总数据...');
    const response = await axios.get('/api/feishu?table=monthly', {
      timeout: 30000, // 30秒超时
    });
    
    if (response.data.code === 0) {
      const data = response.data.data || [];
      console.log('月度汇总数据获取成功:', data.length, '条记录');
      return data;
    } else {
      throw new Error(response.data.error || '获取数据失败');
    }
  } catch (error) {
    console.error('获取月度汇总数据失败，使用模拟数据:', error);
    if (axios.isAxiosError(error)) {
      console.error('API错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return MOCK_MONTH_DATA;
  }
}

// 数据格式化工具函数
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}
