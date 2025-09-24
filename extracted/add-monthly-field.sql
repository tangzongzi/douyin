-- 添加月度表的缺失字段
ALTER TABLE monthly_summary 
ADD COLUMN daily_profit_sum DECIMAL(12,2) DEFAULT 0;

-- 更新字段注释
COMMENT ON COLUMN monthly_summary.daily_profit_sum IS '月度每日利润汇总（numeric/公式）';

-- 查看表结构确认
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'monthly_summary' 
ORDER BY ordinal_position;
