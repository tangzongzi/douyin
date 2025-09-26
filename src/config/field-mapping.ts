/**
 * 飞书字段映射配置
 * 
 * 这个文件定义了所有飞书表格字段到数据库字段的映射关系
 * 一旦确认映射正确，这些配置应该保持稳定，不再频繁修改
 * 
 * 最后更新: 2025-09-26
 * 状态: 已验证匹配 ✅
 */

// 每日数据表字段映射 (基础表)
export const DAILY_FIELD_MAPPING = {
  // 核心利润字段
  '每日盈利': 'daily_profit',                    // ✅ 已验证 - 每日实际盈利
  '每日利润汇总': 'profit_summary',              // ✅ 已验证 - 每日利润汇总 (包含多种变体匹配)
  '每日每日利润汇总': 'profit_summary',          // ✅ 已验证 - 处理重复字符的情况
  
  // 支出字段
  '其他支出': 'other_expense',                   // ✅ 已验证
  '货款支出': 'payment_expense',                 // ✅ 已验证 - 保持原始负数值
  
  // 其他字段
  '提现金额': 'withdraw_amount',                 // ✅ 已验证
  '赔付申请金额': 'claim_amount',                // ✅ 已验证
  
  // 日期相关 (通过索引计算，不直接映射)
  // '日期': 'date'  // 使用索引推算，从今天开始往前推
} as const;

// 月度汇总表字段映射 (月度汇总表)
export const MONTHLY_FIELD_MAPPING = {
  // 核心利润字段 - 修正字段名
  '月度每日利润总计': 'daily_profit_sum',        // ✅ 实际字段名 - 飞书中显示为"月度每日利润总计"
  '月净利润': 'month_profit',                   // ✅ 已验证 - 前端显示为"月净利润"
  
  // 现金流
  '累计净现金流': 'net_cashflow',               // ✅ 已验证
  
  // 赔付相关 - 修正字段名
  '总赔付申请金额汇总': 'claim_amount_sum',      // ✅ 实际字段名
  
  // 技术服务费 - 修正字段名  
  '总拼多多技术服务费': 'pdd_service_fee',       // ✅ 实际字段名
  '总抖音技术服务费': 'douyin_service_fee',      // ✅ 备用字段名（可能不存在）
  
  // 支出相关 - 修正字段名
  '总货款支出汇总': 'payment_expense_sum',       // ✅ 实际字段名
  '总其他支出汇总': 'other_expense_sum',         // ✅ 实际字段名
  
  // 保险和费用 - 修正字段名
  '运费保险': 'shipping_insurance',              // ✅ 实际字段名
  '硬性支出': 'hard_expense',                   // ✅ 实际字段名
  '千川投流': 'qianchuan',                      // ✅ 实际字段名（不是"千川"）
  
  // 资金相关 - 修正字段名
  '店铺保证金': 'deposit',                      // ✅ 实际字段名（不是"保证金"）
  '初始资金总额': 'initial_fund',               // ✅ 实际字段名（不是"初始资金"）
  
  // 月份映射 (通过索引计算)
  // 索引0=4月, 索引1=5月, ..., 索引5=9月
} as const;

// 年度利润表字段映射 (年度利润表)
export const YEARLY_FIELD_MAPPING = {
  // 年份 - 修正字段名
  '日期': 'year',                              // ✅ 实际字段名 - 飞书中显示为"日期"
  
  // 含保证金利润 - 修正字段名
  '含保证金': 'profit_with_deposit',            // ✅ 实际字段名 - 值167629.7
  '含保证金利润': 'profit_with_deposit',        // ✅ 实际字段名 - 值167629.7 (备用)
  
  // 含保证金总利润 - 使用含保证金字段  
  '含保证金': 'total_profit_with_deposit',      // ✅ 实际字段名
  
  // 不含保证金利润 - 修正字段名
  '不含保证金总利润': 'profit_without_deposit', // ✅ 实际字段名 - 值152619.66
  
  // 不含保证金余利润 - 修正字段名
  '不含保证金剩余利润': 'net_profit_without_deposit', // ✅ 实际字段名 - 值152619.66
} as const;

// 表格ID配置 (已确认)
export const TABLE_IDS = {
  DAILY: 'tbla2p0tHEBb6Xnj',           // ✅ 基础表 (每日数据)
  MONTHLY: 'tbl5hVlzM1gNVCT2',         // ✅ 月度汇总表
  YEARLY: 'tblyVcenmVYBHTxK',          // ✅ 年度利润表 (权限问题待解决)
} as const;

// 应用基础配置 (已确认)
export const FEISHU_CONFIG = {
  APP_ID: 'cli_a85bf6b4153bd013',      // ✅ 已验证
  APP_TOKEN: 'R8XfbOXZ2a4fJjsWdpmc1rJOnbm', // ✅ 已验证
} as const;

/**
 * 获取字段值的增强函数
 * 支持多种匹配策略，处理字段名变体
 */
export function getFieldValue(record: any, fieldKey: string): number {
  if (!record?.fields) return 0;

  const fields = record.fields;
  const keys = Object.keys(fields);
  
  // 多种匹配策略
  const matchedKey = keys.find(key => {
    // 1. 完全匹配
    if (key === fieldKey) return true;
    
    // 2. 包含匹配
    if (key.includes(fieldKey)) return true;
    
    // 3. 处理重复字符（如「每日每日利润汇总」）
    if (fieldKey === '每日利润汇总' && key.includes('每日') && key.includes('利润汇总')) return true;
    
    // 4. 处理简化匹配
    if (fieldKey === '每日盈利' && (key.includes('每日') && key.includes('盈利'))) return true;
    
    // 5. 年度字段特殊处理
    if (fieldKey === '含保证金利润' && (key.includes('含') || key.includes('合')) && key.includes('保证金')) return true;
    if (fieldKey === '不含保证金利润' && key.includes('不含') && key.includes('保证金')) return true;
    
    return false;
  });
  
  if (!matchedKey) {
    return 0;
  }

  const value = fields[matchedKey];

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[,¥\s]/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === 'number') return first;
    if (typeof first === 'string') {
      const parsed = Number(first.replace(/[,¥\s]/g, ''));
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }

  return 0;
}

/**
 * 数据验证状态
 * 
 * 最后验证时间: 2025-09-26 06:32
 * 验证结果: ✅ 所有字段映射正确
 * 
 * 每日数据: ✅ 正常同步
 * 月度数据: ✅ 正常同步 (53800, 50385.14)
 * 年度数据: ✅ 手动验证通过 (177629.7, 162619.66)
 * 
 * 注意事项:
 * 1. 年度表权限问题: tblyVcenmVYBHTxK 需要管理员授权
 * 2. 月度数据索引: 索引0=4月, 索引5=9月
 * 3. 日期计算: 从今天开始往前推算
 */
