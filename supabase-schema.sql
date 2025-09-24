-- Supabase 数据库结构设计
-- 基于飞书表格数据结构

-- 1. 每日基础数据表
CREATE TABLE daily_profits (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  daily_profit DECIMAL(10,2) DEFAULT 0,
  other_expense DECIMAL(10,2) DEFAULT 0,
  payment_expense DECIMAL(10,2) DEFAULT 0,
  withdraw_amount DECIMAL(10,2) DEFAULT 0,
  claim_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 月度汇总数据表
CREATE TABLE monthly_summary (
  id SERIAL PRIMARY KEY,
  month VARCHAR(7) UNIQUE NOT NULL, -- '2024-09'
  month_profit DECIMAL(12,2) DEFAULT 0,
  net_cashflow DECIMAL(12,2) DEFAULT 0,
  claim_amount_sum DECIMAL(12,2) DEFAULT 0,
  pdd_service_fee DECIMAL(10,2) DEFAULT 0,
  douyin_service_fee DECIMAL(10,2) DEFAULT 0,
  payment_expense_sum DECIMAL(12,2) DEFAULT 0,
  other_expense_sum DECIMAL(12,2) DEFAULT 0,
  shipping_insurance DECIMAL(10,2) DEFAULT 0,
  hard_expense DECIMAL(10,2) DEFAULT 0,
  qianchuan DECIMAL(10,2) DEFAULT 0,
  deposit DECIMAL(10,2) DEFAULT 0,
  initial_fund DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 数据同步日志表
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(20) NOT NULL, -- 'daily' or 'monthly'
  sync_status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. 创建索引优化查询性能
CREATE INDEX idx_daily_profits_date ON daily_profits(date DESC);
CREATE INDEX idx_monthly_summary_month ON monthly_summary(month DESC);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(sync_started_at DESC);

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_profits_updated_at BEFORE UPDATE
    ON daily_profits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_summary_updated_at BEFORE UPDATE
    ON monthly_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 行级安全策略 (RLS) - 可选
-- ALTER TABLE daily_profits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;

-- 7. 创建视图用于数据分析
CREATE VIEW daily_profit_analysis AS
SELECT 
  date,
  daily_profit,
  LAG(daily_profit) OVER (ORDER BY date) as previous_day_profit,
  AVG(daily_profit) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as week_avg,
  AVG(daily_profit) OVER (ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as month_avg
FROM daily_profits
WHERE daily_profit > 0
ORDER BY date DESC;

CREATE VIEW monthly_trends AS
SELECT 
  month,
  month_profit,
  net_cashflow,
  claim_amount_sum,
  LAG(month_profit) OVER (ORDER BY month) as previous_month_profit,
  (month_profit - LAG(month_profit) OVER (ORDER BY month)) / NULLIF(LAG(month_profit) OVER (ORDER BY month), 0) * 100 as profit_growth_rate
FROM monthly_summary
ORDER BY month DESC;
