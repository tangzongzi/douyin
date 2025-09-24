-- 添加含保证金利润和不含保证金利润字段到月度汇总表
-- 这两个字段存储累计总和数据

ALTER TABLE monthly_summary 
ADD COLUMN IF NOT EXISTS profit_with_deposit DECIMAL(15,2) DEFAULT 0 COMMENT '含保证金利润（累计）';

ALTER TABLE monthly_summary 
ADD COLUMN IF NOT EXISTS profit_without_deposit DECIMAL(15,2) DEFAULT 0 COMMENT '不含保证金利润（累计）';

-- 更新现有记录的默认值（可选）
-- UPDATE monthly_summary SET profit_with_deposit = 0 WHERE profit_with_deposit IS NULL;
-- UPDATE monthly_summary SET profit_without_deposit = 0 WHERE profit_without_deposit IS NULL;
