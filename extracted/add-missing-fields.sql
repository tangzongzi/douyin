-- 添加缺失的字段到表结构

-- 1. 添加每日利润汇总字段到 daily_profits 表
ALTER TABLE daily_profits 
ADD COLUMN profit_summary DECIMAL(10,2) DEFAULT 0;

-- 2. 添加月度每日利润汇总字段到 monthly_summary 表
ALTER TABLE monthly_summary 
ADD COLUMN daily_profit_sum DECIMAL(12,2) DEFAULT 0;

-- 更新字段注释
COMMENT ON COLUMN daily_profits.profit_summary IS '每日利润汇总（numeric/公式）';
COMMENT ON COLUMN daily_profits.daily_profit IS '每日盈利';
COMMENT ON COLUMN monthly_summary.daily_profit_sum IS '月度每日利润汇总（numeric/公式）';
COMMENT ON COLUMN monthly_summary.month_profit IS '月净利润（numeric/公式）';

-- 查看表结构确认
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'daily_profits' 
ORDER BY ordinal_position;
