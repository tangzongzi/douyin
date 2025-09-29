-- 创建国内电商硬性支出表
CREATE TABLE IF NOT EXISTS domestic_expenses (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(50) UNIQUE NOT NULL, -- 飞书记录ID
  date DATE NOT NULL, -- 支出日期（如：2025-09-14）
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 支出金额（正负数）
  remarks TEXT, -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建跨境电商硬性支出表  
CREATE TABLE IF NOT EXISTS crossborder_expenses (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(50) UNIQUE NOT NULL, -- 飞书记录ID
  date DATE NOT NULL, -- 支出日期（如：2025-09-14）
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 支出金额（正负数）
  remarks TEXT, -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建国内店铺保证金表
CREATE TABLE IF NOT EXISTS domestic_deposits (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(50) UNIQUE NOT NULL, -- 飞书记录ID
  date DATE NOT NULL, -- 保证金日期（如：2025-09-20）
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 保证金金额（正负数）
  remarks TEXT, -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建跨境店铺保证金表
CREATE TABLE IF NOT EXISTS crossborder_deposits (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(50) UNIQUE NOT NULL, -- 飞书记录ID
  date DATE NOT NULL, -- 保证金日期（如：2025-09-26）
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 保证金金额（正负数）
  remarks TEXT, -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建千川投流表
CREATE TABLE IF NOT EXISTS qianchuan_ads (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(50) UNIQUE NOT NULL, -- 飞书记录ID
  date DATE NOT NULL, -- 投流日期（如：2025-09-29）
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 投流金额（负数为投流支出）
  remarks TEXT, -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建年度总支出表
CREATE TABLE IF NOT EXISTS annual_expenses (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(50) UNIQUE NOT NULL, -- 飞书记录ID
  date DATE NOT NULL, -- 支出日期（如：2025-09-28）
  expense_detail VARCHAR(200), -- 费用明细（如：分红）
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 支出金额（负数为支出）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_domestic_expenses_date ON domestic_expenses(date);
CREATE INDEX IF NOT EXISTS idx_domestic_expenses_created_at ON domestic_expenses(created_at);

CREATE INDEX IF NOT EXISTS idx_crossborder_expenses_date ON crossborder_expenses(date);
CREATE INDEX IF NOT EXISTS idx_crossborder_expenses_created_at ON crossborder_expenses(created_at);

CREATE INDEX IF NOT EXISTS idx_domestic_deposits_date ON domestic_deposits(date);
CREATE INDEX IF NOT EXISTS idx_domestic_deposits_created_at ON domestic_deposits(created_at);

CREATE INDEX IF NOT EXISTS idx_crossborder_deposits_date ON crossborder_deposits(date);
CREATE INDEX IF NOT EXISTS idx_crossborder_deposits_created_at ON crossborder_deposits(created_at);

CREATE INDEX IF NOT EXISTS idx_qianchuan_ads_date ON qianchuan_ads(date);
CREATE INDEX IF NOT EXISTS idx_qianchuan_ads_created_at ON qianchuan_ads(created_at);

CREATE INDEX IF NOT EXISTS idx_annual_expenses_date ON annual_expenses(date);
CREATE INDEX IF NOT EXISTS idx_annual_expenses_expense_detail ON annual_expenses(expense_detail);
CREATE INDEX IF NOT EXISTS idx_annual_expenses_created_at ON annual_expenses(created_at);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为国内电商硬性支出表添加更新触发器
DROP TRIGGER IF EXISTS update_domestic_expenses_updated_at ON domestic_expenses;
CREATE TRIGGER update_domestic_expenses_updated_at
    BEFORE UPDATE ON domestic_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为跨境电商硬性支出表添加更新触发器  
DROP TRIGGER IF EXISTS update_crossborder_expenses_updated_at ON crossborder_expenses;
CREATE TRIGGER update_crossborder_expenses_updated_at
    BEFORE UPDATE ON crossborder_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为国内店铺保证金表添加更新触发器
DROP TRIGGER IF EXISTS update_domestic_deposits_updated_at ON domestic_deposits;
CREATE TRIGGER update_domestic_deposits_updated_at
    BEFORE UPDATE ON domestic_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为跨境店铺保证金表添加更新触发器
DROP TRIGGER IF EXISTS update_crossborder_deposits_updated_at ON crossborder_deposits;
CREATE TRIGGER update_crossborder_deposits_updated_at
    BEFORE UPDATE ON crossborder_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为千川投流表添加更新触发器
DROP TRIGGER IF EXISTS update_qianchuan_ads_updated_at ON qianchuan_ads;
CREATE TRIGGER update_qianchuan_ads_updated_at
    BEFORE UPDATE ON qianchuan_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为年度总支出表添加更新触发器
DROP TRIGGER IF EXISTS update_annual_expenses_updated_at ON annual_expenses;
CREATE TRIGGER update_annual_expenses_updated_at
    BEFORE UPDATE ON annual_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE domestic_expenses IS '国内电商硬性支出数据表';
COMMENT ON TABLE crossborder_expenses IS '跨境电商硬性支出数据表';
COMMENT ON TABLE domestic_deposits IS '国内店铺保证金数据表';
COMMENT ON TABLE crossborder_deposits IS '跨境店铺保证金数据表';
COMMENT ON TABLE qianchuan_ads IS '千川投流数据表';
COMMENT ON TABLE annual_expenses IS '年度总支出数据表';

COMMENT ON COLUMN domestic_expenses.record_id IS '飞书表格记录ID，用于数据同步';
COMMENT ON COLUMN domestic_expenses.date IS '支出发生日期（从飞书日期字段解析）';
COMMENT ON COLUMN domestic_expenses.amount IS '支出金额（负数为支出，正数为收入）';
COMMENT ON COLUMN domestic_expenses.remarks IS '备注说明（对应飞书备注字段）';

COMMENT ON COLUMN crossborder_expenses.record_id IS '飞书表格记录ID，用于数据同步';
COMMENT ON COLUMN crossborder_expenses.date IS '支出发生日期（从飞书日期字段解析）';
COMMENT ON COLUMN crossborder_expenses.amount IS '支出金额（负数为支出，正数为收入）';
COMMENT ON COLUMN crossborder_expenses.remarks IS '备注说明（对应飞书备注字段）';

COMMENT ON COLUMN domestic_deposits.record_id IS '飞书表格记录ID，用于数据同步';
COMMENT ON COLUMN domestic_deposits.date IS '保证金日期（从飞书日期字段解析）';
COMMENT ON COLUMN domestic_deposits.amount IS '保证金金额（负数为支付保证金，正数为退还保证金）';
COMMENT ON COLUMN domestic_deposits.remarks IS '保证金备注说明（对应飞书备注字段）';

COMMENT ON COLUMN crossborder_deposits.record_id IS '飞书表格记录ID，用于数据同步';
COMMENT ON COLUMN crossborder_deposits.date IS '保证金日期（从飞书日期字段解析）';
COMMENT ON COLUMN crossborder_deposits.amount IS '保证金金额（负数为支付保证金，正数为退还保证金）';
COMMENT ON COLUMN crossborder_deposits.remarks IS '保证金备注说明（对应飞书备注字段）';

COMMENT ON COLUMN qianchuan_ads.record_id IS '飞书表格记录ID，用于数据同步';
COMMENT ON COLUMN qianchuan_ads.date IS '投流日期（从飞书日期字段解析）';
COMMENT ON COLUMN qianchuan_ads.amount IS '投流金额（负数为投流支出）';
COMMENT ON COLUMN qianchuan_ads.remarks IS '投流备注说明（对应飞书备注字段）';

COMMENT ON COLUMN annual_expenses.record_id IS '飞书表格记录ID，用于数据同步';
COMMENT ON COLUMN annual_expenses.date IS '支出日期（从飞书日期字段解析）';
COMMENT ON COLUMN annual_expenses.expense_detail IS '费用明细（对应飞书费用明细字段）';
COMMENT ON COLUMN annual_expenses.amount IS '支出金额（负数为支出）';
