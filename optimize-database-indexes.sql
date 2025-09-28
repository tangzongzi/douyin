-- 数据库索引优化脚本
-- 为飞书数据同步项目添加性能优化索引

-- 1. 每日利润表索引（最重要）
CREATE INDEX IF NOT EXISTS idx_daily_profits_date 
ON daily_profits(date DESC);

-- 2. 月度汇总表索引  
CREATE INDEX IF NOT EXISTS idx_monthly_summary_month 
ON monthly_summary(month DESC);

-- 3. 年度利润表索引
CREATE INDEX IF NOT EXISTS idx_year_profit_year 
ON year_profit(year DESC);

-- 4. 同步日志表索引
CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status 
ON sync_logs(sync_type, sync_status);

-- 5. 同步日志按时间索引
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at 
ON sync_logs(sync_started_at DESC);

-- 验证索引创建情况
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('daily_profits', 'monthly_summary', 'year_profit', 'sync_logs')
ORDER BY tablename, indexname;
