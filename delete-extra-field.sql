-- 删除 monthly_summary 表中多余的 previous_month_profit 字段
-- 执行前请确认这个字段确实存在且不需要

-- 检查字段是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'monthly_summary' 
  AND table_schema = 'public'
  AND column_name = 'previous_month_profit';

-- 如果上面的查询返回了结果，说明字段存在，可以执行下面的删除命令
-- ALTER TABLE public.monthly_summary DROP COLUMN IF EXISTS previous_month_profit;

-- 删除后验证字段已被删除
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'monthly_summary' 
--   AND table_schema = 'public'
-- ORDER BY ordinal_position;
