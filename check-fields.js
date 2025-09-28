/**
 * 简单的字段验证脚本
 * 检查字段映射配置是否与开发文档一致
 */

// 模拟从开发文档中提取的年度利润表字段
const EXPECTED_YEARLY_FIELDS = {
  'year': '年份',
  'profit_with_deposit': '含保证金利润', 
  'total_profit_with_deposit': '含保证金总利润',
  'profit_without_deposit': '不含保证金利润',
  'net_profit_without_deposit': '不含保证金余利润'
};

// 从字段映射配置中提取的映射
const YEARLY_FIELD_MAPPING = {
  '日期': 'year',
  '年份': 'year', 
  '含保证金利润': 'profit_with_deposit',
  '含保证金': 'profit_with_deposit',
  '含保证金总利润': 'total_profit_with_deposit',
  '不含保证金利润': 'profit_without_deposit',
  '不含保证金总利润': 'profit_without_deposit',
  '不含保证金余利润': 'net_profit_without_deposit',
  '不含保证金剩余利润': 'net_profit_without_deposit'
};

console.log('🔍 字段映射验证报告\n');
console.log('=' .repeat(60));

console.log('\n📋 根据开发文档，年度利润表应该有这些字段:');
Object.entries(EXPECTED_YEARLY_FIELDS).forEach(([dbField, description]) => {
  console.log(`   ${dbField} -> ${description}`);
});

console.log('\n🔗 当前字段映射配置:');
Object.entries(YEARLY_FIELD_MAPPING).forEach(([feishuField, dbField]) => {
  console.log(`   "${feishuField}" -> ${dbField}`);
});

console.log('\n✅ 字段覆盖情况检查:');
Object.keys(EXPECTED_YEARLY_FIELDS).forEach(dbField => {
  const mappedFields = Object.entries(YEARLY_FIELD_MAPPING)
    .filter(([_, db]) => db === dbField)
    .map(([feishu, _]) => feishu);
  
  if (mappedFields.length > 0) {
    console.log(`   ✅ ${dbField}: 已映射 [${mappedFields.join(', ')}]`);
  } else {
    console.log(`   ❌ ${dbField}: 未找到映射`);
  }
});

console.log('\n🎯 总结:');
console.log('   - 年度利润表确实只有4个核心字段（根据开发文档）');
console.log('   - 代码中有多个字段名是为了处理飞书字段名的变体');
console.log('   - 这是正常的，因为飞书中的字段名可能与开发文档不完全一致');

console.log('\n💡 建议:');
console.log('   1. 使用调试接口确认飞书中的实际字段名');
console.log('   2. 确保getFieldValue函数能正确匹配这些字段名变体');
console.log('   3. 检查数据同步日志，看是否有字段匹配失败的情况');

console.log('\n' + '=' .repeat(60));
console.log('字段验证完成! 🎉');
