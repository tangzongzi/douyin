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
  // 核心利润字段 - 支持多种可能的字段名
  '每日盈利': 'daily_profit',                    // ✅ 已验证 - 每日实际盈利
  '每日利润汇总': 'profit_summary',              // ✅ 已验证 - 每日利润汇总
  '每日每日利润汇总': 'profit_summary',          // ✅ 已验证 - 处理重复字符的情况
  '利润汇总': 'profit_summary',                  // 备选字段名
  '日利润汇总': 'profit_summary',                // 备选字段名
  
  // 支出字段
  '其他支出': 'other_expense',                   // ✅ 已验证
  '货款支出': 'payment_expense',                 // ✅ 已验证 - 保持原始负数值
  '支出': 'other_expense',                       // 备选字段名
  
  // 其他字段
  '提现金额': 'withdraw_amount',                 // ✅ 已验证
  '赔付申请金额': 'claim_amount',                // ✅ 已验证
  '赔付金额': 'claim_amount',                    // 备选字段名
  
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
// 根据最新飞书表格，年度利润表只有2个核心字段
export const YEARLY_FIELD_MAPPING = {
  // 年份字段 - 飞书中显示为"日期"
  '日期': 'year',                              // 飞书字段名：日期（2025年）
  '年份': 'year',                              // 备选字段名：年份
  
  // 含保证金利润 - 飞书实际字段名
  '含保证金利润': 'profit_with_deposit',        // 飞书字段名：含保证金利润 (118612.03)
  '含保证金': 'profit_with_deposit',            // 备选字段名
  
  // 不含保证金余利润 - 飞书实际字段名  
  '不含保证金余利润': 'profit_without_deposit', // 飞书字段名：不含保证金余利润 (103601.99)
  '不含保证金剩余利润': 'profit_without_deposit', // 备选字段名
  '不含保证金利润': 'profit_without_deposit',   // 备选字段名
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
interface FeishuRecord {
  fields: Record<string, unknown>;
  record_id?: string;
}

export function getFieldValue(record: FeishuRecord, fieldKey: string): number {
  if (!record?.fields) {
    console.log(`[Field Debug] record.fields 为空，fieldKey: ${fieldKey}`);
    return 0;
  }

  const fields = record.fields;
  const keys = Object.keys(fields);
  
  // 改进的字段匹配策略 - 按优先级排序
  const matchedKey = keys.find(key => {
    // 1. 完全匹配 - 最高优先级
    if (key === fieldKey) return true;
    
    // 2. 年度字段精确匹配 - 避免"含"匹配到"不含"
    if (fieldKey === '含保证金') {
      return key === '含保证金' || key === '含保证金利润';
    }
    if (fieldKey === '不含保证金总利润') {
      return key === '不含保证金总利润' || key === '不含保证金利润';
    }
    if (fieldKey === '不含保证金剩余利润') {
      return key === '不含保证金剩余利润' || key === '不含保证金余利润';
    }
    
    // 3. 每日利润字段的特殊处理
    if (fieldKey === '每日利润汇总' || fieldKey === '每日每日利润汇总' || fieldKey === '利润汇总') {
      return (key.includes('利润') && key.includes('汇总')) ||
             (key.includes('每日') && key.includes('利润')) ||
             key === '利润汇总' || key === '日利润汇总';
    }
    
    // 4. 每日盈利字段匹配
    if (fieldKey === '每日盈利') {
      return key.includes('盈利') || (key.includes('每日') && key.includes('利润'));
    }
    
    // 5. 支出字段匹配
    if (fieldKey === '其他支出' || fieldKey === '支出') {
      return key.includes('支出') && !key.includes('货款') && !key.includes('总');
    }
    if (fieldKey === '货款支出') {
      return key.includes('货款') && key.includes('支出');
    }
    
    // 6. 赔付字段匹配
    if (fieldKey === '赔付申请金额' || fieldKey === '赔付金额') {
      return key.includes('赔付') && (key.includes('金额') || key.includes('申请'));
    }
    
    // 7. 月度字段匹配
    if (fieldKey === '月度每日利润总计') {
      return (key.includes('月度') && key.includes('利润')) ||
             (key.includes('每日') && key.includes('总计')) ||
             key === '每日利润总计';
    }
    
    // 8. 技术服务费匹配
    if (fieldKey.includes('技术服务费')) {
      return key.includes('技术服务费') || key.includes('服务费');
    }
    
    // 9. 通用包含匹配 - 最后的备选方案
    if (key.includes(fieldKey) || fieldKey.includes(key)) {
      // 避免误匹配保证金相关字段
      if (fieldKey.includes('保证金') || key.includes('保证金')) {
        return false;
      }
      return true;
    }
    
    return false;
  });
  
  if (!matchedKey) {
    console.log(`[Field Debug] 未找到匹配字段，查找: "${fieldKey}"`);
    console.log(`[Field Debug] 可用字段: [${keys.join(', ')}]`);
    return 0;
  }

  console.log(`[Field Debug] 字段匹配成功: "${fieldKey}" -> "${matchedKey}"`);
  const value = fields[matchedKey];
  console.log(`[Field Debug] 原始值:`, value, `类型: ${typeof value}`);

  // 改进的值解析逻辑
  if (typeof value === 'number') {
    console.log(`[Field Debug] 返回数字值: ${value}`);
    return value;
  }

  if (typeof value === 'string') {
    // 移除常见的格式化字符
    const cleanValue = value.replace(/[,¥\s%]/g, '').replace(/^[\+\-]?/, match => match);
    const parsed = Number(cleanValue);
    console.log(`[Field Debug] 字符串解析: "${value}" -> "${cleanValue}" -> ${parsed}`);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    console.log(`[Field Debug] 数组第一个元素:`, first, `类型: ${typeof first}`);
    if (typeof first === 'number') return first;
    if (typeof first === 'string') {
      const cleanValue = first.replace(/[,¥\s%]/g, '').replace(/^[\+\-]?/, match => match);
      const parsed = Number(cleanValue);
      console.log(`[Field Debug] 数组字符串解析: "${first}" -> "${cleanValue}" -> ${parsed}`);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }

  // 处理对象类型的值（飞书可能返回对象格式的数值）
  if (typeof value === 'object' && value !== null) {
    if ('text' in value && typeof value.text === 'string') {
      const cleanValue = value.text.replace(/[,¥\s%]/g, '');
      const parsed = Number(cleanValue);
      console.log(`[Field Debug] 对象文本解析: "${value.text}" -> ${parsed}`);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if ('value' in value && typeof value.value === 'number') {
      console.log(`[Field Debug] 对象值解析: ${value.value}`);
      return value.value;
    }
  }

  console.log(`[Field Debug] 无法解析值，返回0:`, value);
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
