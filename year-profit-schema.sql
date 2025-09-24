-- 年度总利润表
CREATE TABLE year_profit (
  id SERIAL PRIMARY KEY,
  year VARCHAR(4) UNIQUE NOT NULL, -- '2025'
  profit_with_deposit DECIMAL(15,2) DEFAULT 0, -- 含保证金利润
  total_profit_with_deposit DECIMAL(15,2) DEFAULT 0, -- 含保证金总利润
  profit_without_deposit DECIMAL(15,2) DEFAULT 0, -- 不含保证金利润
  net_profit_without_deposit DECIMAL(15,2) DEFAULT 0, -- 不含保证金余利润
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_year_profit_year ON year_profit(year DESC);

-- 创建更新时间触发器
CREATE TRIGGER update_year_profit_updated_at BEFORE UPDATE
    ON year_profit FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
