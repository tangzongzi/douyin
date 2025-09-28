-- 创建AI分析报告表
-- 存储每月的AI分析结果，支持缓存和历史查看

CREATE TABLE IF NOT EXISTS public.ai_analysis_reports (
    id BIGSERIAL PRIMARY KEY,
    month VARCHAR(7) NOT NULL UNIQUE, -- 格式: 2025-09
    analysis_type VARCHAR(10) NOT NULL DEFAULT 'both', -- simple, deep, both
    simple_analysis JSONB, -- 简单分析结果
    deep_analysis JSONB, -- 深度分析结果  
    ai_enhanced_text TEXT, -- EdgeOne AI增强分析文本
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_snapshot JSONB NOT NULL, -- 分析时的数据快照
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_ai_analysis_reports_month 
ON public.ai_analysis_reports(month DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_reports_generated_at 
ON public.ai_analysis_reports(generated_at DESC);

-- 创建更新时间自动更新触发器
CREATE OR REPLACE FUNCTION update_ai_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analysis_reports_updated_at
    BEFORE UPDATE ON public.ai_analysis_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_analysis_updated_at();

-- 添加表注释
COMMENT ON TABLE public.ai_analysis_reports IS 'AI财务分析报告表，存储每月的智能分析结果';
COMMENT ON COLUMN public.ai_analysis_reports.month IS '分析月份，格式YYYY-MM';
COMMENT ON COLUMN public.ai_analysis_reports.analysis_type IS '分析类型：simple简单分析，deep深度分析，both两者都有';
COMMENT ON COLUMN public.ai_analysis_reports.simple_analysis IS '简单分析结果JSON';
COMMENT ON COLUMN public.ai_analysis_reports.deep_analysis IS '深度分析结果JSON';
COMMENT ON COLUMN public.ai_analysis_reports.ai_enhanced_text IS 'EdgeOne AI增强分析文本';
COMMENT ON COLUMN public.ai_analysis_reports.data_snapshot IS '分析时的财务数据快照';

-- 验证表创建
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_analysis_reports' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
