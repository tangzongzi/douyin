const axios = require('axios');

// 从环境配置读取
const FEISHU_APP_ID = 'cli_a85bf6b4153bd013';
const FEISHU_APP_SECRET = 'AhOGT0tl2pkjXlynQ2Qb3gFXyXmbE2aP';
const FEISHU_APP_TOKEN = 'R8XfbOXZ2a4fJjsWdpmc1rJOnbm';
const YEAR_PROFIT_TABLE_ID = 'tblyVcenmVYBHTxK';

async function testAccess() {
  try {
    console.log('========== 测试年度表格访问权限 ==========');
    console.log(`表格ID: ${YEAR_PROFIT_TABLE_ID}`);
    console.log(`APP_TOKEN: ${FEISHU_APP_TOKEN}`);
    
    // 获取访问令牌
    const tokenResp = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    });
    
    console.log('令牌响应:', tokenResp.data);
    
    if (tokenResp.data.code !== 0) {
      throw new Error(`获取令牌失败: ${tokenResp.data.msg}`);
    }
    
    const token = tokenResp.data.tenant_access_token;
    
    // 测试年度表格访问
    const tableResp = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${YEAR_PROFIT_TABLE_ID}/records`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { page_size: 5 },
        validateStatus: () => true
      }
    );
    
    console.log('\n========== 表格访问结果 ==========');
    console.log('HTTP状态:', tableResp.status);
    console.log('业务代码:', tableResp.data?.code);
    console.log('消息:', tableResp.data?.msg);
    console.log('完整响应:', JSON.stringify(tableResp.data, null, 2));
    
    if (tableResp.data?.code === 0) {
      const items = tableResp.data.data?.items || [];
      console.log('\n========== 数据分析 ==========');
      console.log(`记录数量: ${items.length}`);
      
      if (items.length > 0) {
        console.log('第一条记录字段:', Object.keys(items[0]?.fields || {}));
        console.log('第一条记录数据:', items[0]?.fields);
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

testAccess();







