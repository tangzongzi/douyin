/**
 * AI分析相关类型定义
 */

export interface AIAnalysisRequest {
  month: string;
  currentMonthData: MonthlyFinancialData;
  lastMonthData?: MonthlyFinancialData;
  historicalData: MonthlyFinancialData[];
  analysisType: 'simple' | 'deep' | 'both';
}

export interface MonthlyFinancialData {
  month: string;
  month_profit: number;
  daily_profit_sum: number;
  net_cashflow: number;
  claim_amount_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  payment_expense_sum: number;
  other_expense_sum: number;
  shipping_insurance: number;
  hard_expense: number;
  qianchuan: number;
  deposit: number;
  initial_fund: number;
}

export interface SimpleAnalysis {
  positiveFactors: string[];
  riskWarnings: string[];
  keyInsights: string[];
}

export interface DeepAnalysis {
  healthScore: number;
  healthLevel: 'excellent' | 'good' | 'fair' | 'poor';
  profitabilityScore: number;
  riskControlScore: number;
  costControlScore: number;
  optimizationSuggestions: string[];
  nextMonthPrediction: {
    profitRange: [number, number];
    keyFactors: string[];
  };
}

export interface AIAnalysisResult {
  id?: number;
  month: string;
  analysis_type: 'simple' | 'deep' | 'both';
  simple_analysis?: SimpleAnalysis;
  deep_analysis?: DeepAnalysis;
  generated_at: string;
  data_snapshot: MonthlyFinancialData;
  created_at?: string;
  updated_at?: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: AIAnalysisResult;
  error?: string;
  fromCache?: boolean;
  generationTime?: number;
}
