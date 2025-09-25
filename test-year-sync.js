// 测试年度数据同步
const { syncYearlyData } = require('./src/lib/feishu-sync.ts');

async function testYearSync() {
  console.log('开始测试年度数据同步...');
  
  try {
    const result = await syncYearlyData();
    console.log('年度数据同步结果:', result);
  } catch (error) {
    console.error('年度数据同步失败:', error);
  }
}

testYearSync();
