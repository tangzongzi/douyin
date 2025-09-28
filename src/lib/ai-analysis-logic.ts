/**
 * AI分析业务逻辑
 * 提供财务数据的智能分析功能
 */

import { MonthlyFinancialData, SimpleAnalysis, DeepAnalysis, AIAnalysisRequest } from '@/types/ai-analysis';

// 基于历史数据的固定参数配置
const ANALYSIS_THRESHOLDS = {
  // 利润相关阈值
  EXCELLENT_PROFIT: 50000,    // 优秀利润线
  GOOD_PROFIT: 35000,         // 良好利润线
  WARNING_PROFIT: 20000,      // 警告利润线
  
  // 多赞平台补贴阈值
  EXCELLENT_CLAIM_RATIO: 10,  // 多赞平台补贴占利润比例优秀线(%)
  GOOD_CLAIM_RATIO: 5,        // 良好线(%)
  LOW_CLAIM_RATIO: 2,         // 偏低线(%)
  
  // 千川投流阈值
  EXCELLENT_QIANCHUAN_ROI: 15, // 优秀ROI
  GOOD_QIANCHUAN_ROI: 8,       // 良好ROI
  WARNING_QIANCHUAN_ROI: 3,    // 警告ROI
  MAX_QIANCHUAN_COST: 3000,    // 最大投流支出
  
  // 利润率阈值
  EXCELLENT_MARGIN: 20,        // 优秀利润率(%)
  GOOD_MARGIN: 12,            // 良好利润率(%)
  WARNING_MARGIN: 5,          // 警告利润率(%)
  
  // 成本控制阈值
  MAX_HARD_EXPENSE: 3000,     // 最大硬性支出
  MAX_DEPOSIT: 5000,          // 最大保证金占用
};

export class AIAnalysisLogic {
  
  /**
   * 生成简单分析 - 深度优化版
   */
  static generateSimpleAnalysis(request: AIAnalysisRequest): SimpleAnalysis {
    const { currentMonthData, lastMonthData, historicalData } = request;
    const positiveFactors: string[] = [];
    const riskWarnings: string[] = [];
    const keyInsights: string[] = [];

    // 核心财务指标分析
    const currentProfit = currentMonthData.month_profit;
    const currentRevenue = currentMonthData.daily_profit_sum;
    const totalCosts = Math.abs(currentMonthData.payment_expense_sum) + 
                      Math.abs(currentMonthData.qianchuan) + 
                      Math.abs(currentMonthData.hard_expense) +
                      Math.abs(currentMonthData.other_expense_sum);

    if (lastMonthData) {
      // 1. 利润变化深度分析
      const profitChange = ((currentProfit - lastMonthData.month_profit) / Math.abs(lastMonthData.month_profit)) * 100;
      const revenueChange = ((currentRevenue - lastMonthData.daily_profit_sum) / Math.abs(lastMonthData.daily_profit_sum)) * 100;
      
      if (profitChange > 15) {
        positiveFactors.push(`💰 净利润强劲增长${profitChange.toFixed(1)}%至¥${currentProfit.toLocaleString()}，经营效率显著提升`);
      } else if (profitChange > 0) {
        positiveFactors.push(`📈 净利润稳健增长${profitChange.toFixed(1)}%，保持良好盈利态势`);
      } else if (profitChange < -30) {
        riskWarnings.push(`🚨 净利润大幅下降${Math.abs(profitChange).toFixed(1)}%，需紧急调整经营策略`);
      } else if (profitChange < -10) {
        riskWarnings.push(`⚠️ 净利润下降${Math.abs(profitChange).toFixed(1)}%，建议分析收入结构变化`);
      } else if (profitChange < 0) {
        keyInsights.push(`📊 净利润小幅下降${Math.abs(profitChange).toFixed(1)}%，属于正常波动范围`);
      }

      // 2. 收入质量分析
      if (revenueChange > profitChange + 10) {
        keyInsights.push(`💡 营收增长${revenueChange.toFixed(1)}%但利润增长较慢，成本控制有待优化`);
      } else if (revenueChange < profitChange - 10) {
        positiveFactors.push(`⚡ 营收增长${revenueChange.toFixed(1)}%且利润增长更快，运营效率优秀`);
      }

      // 3. 多赞平台补贴分析（具体化说明）
      const claimChange = ((currentMonthData.claim_amount_sum - lastMonthData.claim_amount_sum) / Math.abs(lastMonthData.claim_amount_sum || 1)) * 100;
      const claimIncomeRatio = (currentMonthData.claim_amount_sum / currentMonthData.month_profit) * 100;
      
      if (claimChange < -80) {
        positiveFactors.push(`💰 多赞平台补贴从¥${lastMonthData.claim_amount_sum.toLocaleString()}降至¥${currentMonthData.claim_amount_sum.toLocaleString()}，减少了¥${(lastMonthData.claim_amount_sum - currentMonthData.claim_amount_sum).toLocaleString()}支出风险`);
      } else if (claimChange > 50) {
        positiveFactors.push(`📈 多赞平台补贴增加¥${(currentMonthData.claim_amount_sum - lastMonthData.claim_amount_sum).toLocaleString()}，额外收入能力提升`);
      } else if (claimChange > 0) {
        positiveFactors.push(`📊 多赞平台补贴为¥${currentMonthData.claim_amount_sum.toLocaleString()}，比上月增加¥${(currentMonthData.claim_amount_sum - lastMonthData.claim_amount_sum).toLocaleString()}`);
      }
      
      // 具体的收入贡献说明
      if (currentMonthData.claim_amount_sum > 1000) {
        const contributionAmount = currentMonthData.claim_amount_sum;
        const withoutClaimProfit = currentMonthData.month_profit - contributionAmount;
        keyInsights.push(`💡 多赞平台补贴为本月贡献¥${contributionAmount.toLocaleString()}收入，若无此收入净利润仅为¥${withoutClaimProfit.toLocaleString()}`);
      }

      // 4. 营销投入效率分析
      const qianchuanChange = ((Math.abs(currentMonthData.qianchuan) - Math.abs(lastMonthData.qianchuan)) / Math.abs(lastMonthData.qianchuan || 1)) * 100;
      if (currentMonthData.qianchuan > 0) {
        const qianchuanROI = currentProfit / Math.abs(currentMonthData.qianchuan);
        const lastROI = lastMonthData.month_profit / Math.abs(lastMonthData.qianchuan || 1);
        
        // 具体ROI分析
        const investmentAmount = Math.abs(currentMonthData.qianchuan);
        const returnAmount = currentProfit;
        const actualReturn = returnAmount - investmentAmount;
        
        if (qianchuanROI > ANALYSIS_THRESHOLDS.EXCELLENT_QIANCHUAN_ROI) {
          positiveFactors.push(`🎯 千川投流：投入¥${investmentAmount.toLocaleString()}，获得¥${returnAmount.toLocaleString()}利润，净赚¥${actualReturn.toLocaleString()}，ROI=${qianchuanROI.toFixed(1)}倍，效果卓越`);
        } else if (qianchuanROI > ANALYSIS_THRESHOLDS.GOOD_QIANCHUAN_ROI) {
          positiveFactors.push(`📊 千川投流：投入¥${investmentAmount.toLocaleString()}，净赚¥${actualReturn.toLocaleString()}，ROI=${qianchuanROI.toFixed(1)}倍，投入产出良好`);
        } else if (qianchuanROI < ANALYSIS_THRESHOLDS.WARNING_QIANCHUAN_ROI) {
          riskWarnings.push(`📉 千川投流：投入¥${investmentAmount.toLocaleString()}但ROI仅${qianchuanROI.toFixed(1)}倍，建议暂停或优化投放策略`);
        } else {
          keyInsights.push(`🔍 千川投流：投入¥${investmentAmount.toLocaleString()}，ROI=${qianchuanROI.toFixed(1)}倍，处于合理范围`);
        }
        
        // 千川投流支出预算检查
        if (investmentAmount > ANALYSIS_THRESHOLDS.MAX_QIANCHUAN_COST) {
          riskWarnings.push(`💸 千川投流¥${investmentAmount.toLocaleString()}超出预算上限¥${ANALYSIS_THRESHOLDS.MAX_QIANCHUAN_COST.toLocaleString()}，建议控制在预算内`);
        }
      }
    }

    // 5. 历史趋势洞察
    if (historicalData.length >= 3) {
      const recent3Months = historicalData.slice(-3);
      const profitTrend = recent3Months.map(m => m.month_profit);
      const isUptrend = profitTrend[2] > profitTrend[1] && profitTrend[1] > profitTrend[0];
      const isDowntrend = profitTrend[2] < profitTrend[1] && profitTrend[1] < profitTrend[0];
      
      if (isUptrend) {
        positiveFactors.push(`📈 近3月利润持续上升趋势，经营状况稳步改善`);
      } else if (isDowntrend) {
        riskWarnings.push(`📉 近3月利润持续下降，需制定扭转策略`);
      }
      
      // 波动性分析
      const avgProfit = profitTrend.reduce((a, b) => a + b, 0) / profitTrend.length;
      const variance = profitTrend.reduce((acc, val) => acc + Math.pow(val - avgProfit, 2), 0) / profitTrend.length;
      const volatility = Math.sqrt(variance) / avgProfit * 100;
      
      if (volatility > 30) {
        keyInsights.push(`⚡ 利润波动性较高(${volatility.toFixed(1)}%)，建议稳定收入来源`);
      } else if (volatility < 10) {
        positiveFactors.push(`🎯 利润稳定性良好，经营风险可控`);
      }
    }

    // 6. 成本效率具体分析
    const profitMargin = (currentProfit / (currentProfit + totalCosts)) * 100;
    const dailyProfit = currentProfit / 30; // 日均利润
    
    // 具体利润水平说明
    if (currentProfit > ANALYSIS_THRESHOLDS.EXCELLENT_PROFIT) {
      positiveFactors.push(`🏆 月净利润¥${currentProfit.toLocaleString()}（日均¥${dailyProfit.toLocaleString()}），已达到优秀盈利水平`);
    } else if (currentProfit > ANALYSIS_THRESHOLDS.GOOD_PROFIT) {
      positiveFactors.push(`📈 月净利润¥${currentProfit.toLocaleString()}（日均¥${dailyProfit.toLocaleString()}），保持良好盈利状态`);
    } else if (currentProfit < ANALYSIS_THRESHOLDS.WARNING_PROFIT) {
      riskWarnings.push(`📉 月净利润¥${currentProfit.toLocaleString()}（日均¥${dailyProfit.toLocaleString()}），距离理想目标¥${ANALYSIS_THRESHOLDS.GOOD_PROFIT.toLocaleString()}还差¥${(ANALYSIS_THRESHOLDS.GOOD_PROFIT - currentProfit).toLocaleString()}`);
    }
    
    // 具体成本分析
    const costBreakdown = {
      payment: Math.abs(currentMonthData.payment_expense_sum),
      qianchuan: Math.abs(currentMonthData.qianchuan),
      hard: Math.abs(currentMonthData.hard_expense),
      other: Math.abs(currentMonthData.other_expense_sum)
    };
    
    const maxCost = Math.max(costBreakdown.payment, costBreakdown.qianchuan, costBreakdown.hard);
    if (maxCost === costBreakdown.payment) {
      keyInsights.push(`💰 货款支出¥${costBreakdown.payment.toLocaleString()}是最大成本项，占总成本${(costBreakdown.payment/totalCosts*100).toFixed(1)}%`);
    } else if (maxCost === costBreakdown.qianchuan) {
      keyInsights.push(`📱 千川投流¥${costBreakdown.qianchuan.toLocaleString()}是最大成本项，每投入¥1获得¥${(currentProfit/costBreakdown.qianchuan).toFixed(1)}利润`);
    }

    // 7. 资金效率分析
    if (currentMonthData.deposit > 0) {
      const depositEfficiency = currentProfit / Math.abs(currentMonthData.deposit);
      if (depositEfficiency < 5) {
        keyInsights.push(`💰 保证金占用¥${Math.abs(currentMonthData.deposit).toLocaleString()}，建议优化资金周转`);
      }
    }

    return {
      positiveFactors: positiveFactors.slice(0, 4), // 最多4条积极因素
      riskWarnings: riskWarnings.slice(0, 3), // 最多3条风险警告
      keyInsights: keyInsights.slice(0, 3) // 最多3条关键洞察
    };
  }

  /**
   * 生成深度分析
   */
  static generateDeepAnalysis(request: AIAnalysisRequest): DeepAnalysis {
    const { currentMonthData, lastMonthData, historicalData } = request;
    
    // 计算财务健康度评分
    let healthScore = 70; // 基础分数
    
    // 盈利能力评分 (30分)
    const profitabilityScore = this.calculateProfitabilityScore(currentMonthData, lastMonthData);
    
    // 风险控制评分 (30分)
    const riskControlScore = this.calculateRiskControlScore(currentMonthData, lastMonthData);
    
    // 成本控制评分 (40分)
    const costControlScore = this.calculateCostControlScore(currentMonthData, historicalData);
    
    healthScore = Math.round((profitabilityScore + riskControlScore + costControlScore));
    
    // 健康等级
    let healthLevel: 'excellent' | 'good' | 'fair' | 'poor';
    if (healthScore >= 85) healthLevel = 'excellent';
    else if (healthScore >= 70) healthLevel = 'good';
    else if (healthScore >= 55) healthLevel = 'fair';
    else healthLevel = 'poor';

    // 优化建议
    const optimizationSuggestions = this.generateOptimizationSuggestions(
      currentMonthData, 
      lastMonthData, 
      { profitabilityScore, riskControlScore, costControlScore }
    );

    // 下月预测
    const nextMonthPrediction = this.generateNextMonthPrediction(currentMonthData, historicalData);

    return {
      healthScore,
      healthLevel,
      profitabilityScore,
      riskControlScore,
      costControlScore,
      optimizationSuggestions,
      nextMonthPrediction
    };
  }

  /**
   * 计算盈利能力评分
   */
  private static calculateProfitabilityScore(current: MonthlyFinancialData, last?: MonthlyFinancialData): number {
    let score = 15; // 基础分
    
    // 绝对盈利能力
    if (current.month_profit > 50000) score += 10;
    else if (current.month_profit > 30000) score += 7;
    else if (current.month_profit > 10000) score += 5;
    else if (current.month_profit > 0) score += 3;
    
    // 环比增长
    if (last) {
      const growthRate = (current.month_profit - last.month_profit) / Math.abs(last.month_profit) * 100;
      if (growthRate > 10) score += 5;
      else if (growthRate > 0) score += 3;
      else if (growthRate > -10) score += 1;
    }
    
    return Math.min(score, 30);
  }

  /**
   * 计算风险控制评分（修正：薅羊毛收入是正面因素）
   */
  private static calculateRiskControlScore(current: MonthlyFinancialData, last?: MonthlyFinancialData): number {
    let score = 10; // 基础分
    
    // 平台补贴收入能力评分（赔付申请金额是额外收入）
    const claimIncomeRatio = (current.claim_amount_sum / Math.abs(current.payment_expense_sum)) * 100;
    if (claimIncomeRatio > 2) score += 15; // 政策利用能力强
    else if (claimIncomeRatio > 1) score += 10;
    else if (claimIncomeRatio > 0.5) score += 7;
    else if (claimIncomeRatio > 0.1) score += 5;
    
    // 平台补贴收入增长趋势
    if (last) {
      const claimChange = (current.claim_amount_sum - last.claim_amount_sum) / Math.abs(last.claim_amount_sum || 1) * 100;
      if (claimChange > 50) score += 5; // 平台补贴收入大增是好事
      else if (claimChange > 0) score += 3;
      else if (claimChange < -50) score -= 2; // 补贴机会减少
    }
    
    // 业务稳定性评分
    const profitStability = current.month_profit > 10000 ? 5 : current.month_profit > 5000 ? 3 : 1;
    score += profitStability;
    
    return Math.min(Math.max(score, 0), 30);
  }

  /**
   * 计算成本控制评分
   */
  private static calculateCostControlScore(current: MonthlyFinancialData, historical: MonthlyFinancialData[]): number {
    let score = 20; // 基础分
    
    // 成本效率
    const totalCost = Math.abs(current.payment_expense_sum) + Math.abs(current.qianchuan) + Math.abs(current.hard_expense);
    const costEfficiency = current.month_profit / totalCost;
    
    if (costEfficiency > 0.15) score += 10;
    else if (costEfficiency > 0.10) score += 7;
    else if (costEfficiency > 0.05) score += 5;
    
    // 千川投流效率
    if (current.qianchuan > 0) {
      const qianchuanROI = current.month_profit / Math.abs(current.qianchuan);
      if (qianchuanROI > 10) score += 10;
      else if (qianchuanROI > 5) score += 7;
      else if (qianchuanROI > 2) score += 5;
      else if (qianchuanROI < 1) score -= 5;
    }
    
    return Math.min(Math.max(score, 0), 40);
  }

  /**
   * 生成优化建议 - 深度优化版
   */
  private static generateOptimizationSuggestions(
    current: MonthlyFinancialData, 
    last?: MonthlyFinancialData,
    scores?: { profitabilityScore: number; riskControlScore: number; costControlScore: number }
  ): string[] {
    const suggestions: string[] = [];

    // 基于评分的精准建议
    if (scores) {
      if (scores.profitabilityScore < 15) {
        suggestions.push('🎯 盈利能力亟需提升：建议分析产品定价策略，考虑提高客单价或优化产品组合');
      } else if (scores.profitabilityScore < 25) {
        suggestions.push('📈 盈利能力有待改善：可考虑扩大高利润产品销售占比');
      }
      
      if (scores.riskControlScore < 15) {
        suggestions.push('🛡️ 风险控制需要加强：建立完善的质量管控体系，重点排查高赔付产品');
      } else if (scores.riskControlScore < 25) {
        suggestions.push('⚠️ 继续优化风险控制：建议定期分析赔付原因，建立预警机制');
      }
      
      if (scores.costControlScore < 20) {
        suggestions.push('💰 成本控制亟需优化：重点审查千川投流效果和硬性支出必要性');
      } else if (scores.costControlScore < 30) {
        suggestions.push('🔍 成本结构可进一步优化：建议细化成本分析，寻找节约空间');
      }
    }

    // 基于具体数据的精准建议
    const totalCosts = Math.abs(current.payment_expense_sum) + Math.abs(current.qianchuan) + Math.abs(current.hard_expense);
    const profitMargin = (current.month_profit / (current.month_profit + totalCosts)) * 100;
    
    // 千川投流优化建议
    if (current.qianchuan > 0) {
      const qianchuanROI = current.month_profit / Math.abs(current.qianchuan);
      const qianchuanRatio = Math.abs(current.qianchuan) / totalCosts * 100;
      
      if (qianchuanROI < 5) {
        suggestions.push(`📉 千川投流ROI仅${qianchuanROI.toFixed(1)}，建议暂停低效投放，重新制定投放策略`);
      } else if (qianchuanRatio > 15) {
        suggestions.push(`⚖️ 千川投流占总成本${qianchuanRatio.toFixed(1)}%，建议分散营销渠道降低依赖`);
      } else if (qianchuanROI > 10 && qianchuanRatio < 10) {
        suggestions.push(`🚀 千川投流效果优秀(ROI=${qianchuanROI.toFixed(1)})，可适当增加投入规模`);
      }
    }
    
    // 成本结构优化建议
    if (profitMargin < 10) {
      suggestions.push(`📊 利润率${profitMargin.toFixed(1)}%偏低，建议：1)提高产品定价 2)降低采购成本 3)优化运营效率`);
    }
    
    // 保证金效率建议
    if (current.deposit > 0) {
      const depositEfficiency = current.month_profit / Math.abs(current.deposit);
      if (depositEfficiency < 8) {
        suggestions.push(`💳 保证金效率偏低(${depositEfficiency.toFixed(1)}倍)，建议优化资金配置或提高周转率`);
      }
    }
    
    // 平台补贴收入优化建议
    const claimIncomeRatio = (current.claim_amount_sum / current.month_profit) * 100;
    if (claimIncomeRatio > 15) {
      suggestions.push(`🎯 平台补贴收入占利润${claimIncomeRatio.toFixed(1)}%，建议继续深挖政策红利扩大收入`);
    } else if (claimIncomeRatio < 2) {
      suggestions.push(`💡 平台补贴收入较少，建议研究平台政策寻找更多补贴机会`);
    }
    
    // 现金流建议
    if (last && current.net_cashflow < last.net_cashflow) {
      suggestions.push(`💧 现金流状况需关注，建议加快资金回笼和优化付款周期`);
    }

    return suggestions.slice(0, 4); // 最多4条精准建议
  }

  /**
   * 生成下月预测
   */
  private static generateNextMonthPrediction(
    current: MonthlyFinancialData, 
    historical: MonthlyFinancialData[]
  ): { profitRange: [number, number]; keyFactors: string[] } {
    // 基于历史数据计算趋势
    const recentMonths = historical.slice(-3);
    const avgProfit = recentMonths.reduce((sum, month) => sum + month.month_profit, 0) / recentMonths.length;
    
    // 考虑季节性和趋势
    const trendFactor = current.month_profit / avgProfit;
    const seasonalFactor = 1.0; // 可以根据历史数据计算季节性因子
    
    const predictedProfit = avgProfit * trendFactor * seasonalFactor;
    const variance = predictedProfit * 0.2; // 20%的预测区间
    
    const profitRange: [number, number] = [
      Math.max(0, predictedProfit - variance),
      predictedProfit + variance
    ];

    const keyFactors = [
      '基于近3个月趋势分析',
      '考虑当前成本控制水平',
      '假设市场环境稳定'
    ];

    return { profitRange, keyFactors };
  }

  /**
   * 格式化分析结果为可读文本 - 深度优化版
   */
  static formatAnalysisToText(simple: SimpleAnalysis, deep: DeepAnalysis): string {
    const healthLevelText = {
      'excellent': '🏆 优秀',
      'good': '✅ 良好', 
      'fair': '⚠️ 一般',
      'poor': '🚨 较差'
    }[deep.healthLevel] || deep.healthLevel;
    
    let report = `# 📊 ${new Date().getMonth() + 1}月财务智能分析报告\n\n`;
    
    // 财务健康度总览
    report += `## 💡 财务健康度评估\n`;
    report += `**综合评分：${deep.healthScore}/100分 (${healthLevelText})**\n\n`;
    report += `| 评估维度 | 得分 | 状态 |\n`;
    report += `|---------|------|------|\n`;
    report += `| 💰 盈利能力 | ${deep.profitabilityScore}/30 | ${deep.profitabilityScore > 25 ? '优秀' : deep.profitabilityScore > 20 ? '良好' : deep.profitabilityScore > 15 ? '一般' : '需改进'} |\n`;
    report += `| 🛡️ 风险控制 | ${deep.riskControlScore}/30 | ${deep.riskControlScore > 25 ? '优秀' : deep.riskControlScore > 20 ? '良好' : deep.riskControlScore > 15 ? '一般' : '需改进'} |\n`;
    report += `| 🎯 成本控制 | ${deep.costControlScore}/40 | ${deep.costControlScore > 35 ? '优秀' : deep.costControlScore > 30 ? '良好' : deep.costControlScore > 25 ? '一般' : '需改进'} |\n\n`;
    
    // 关键发现
    if (simple.positiveFactors.length > 0 || simple.riskWarnings.length > 0) {
      report += `## 🔍 关键发现\n\n`;
      
      if (simple.positiveFactors.length > 0) {
        report += `### ✅ 积极表现\n`;
        simple.positiveFactors.forEach((factor, index) => {
          report += `${index + 1}. ${factor}\n`;
        });
        report += `\n`;
      }
      
      if (simple.riskWarnings.length > 0) {
        report += `### ⚠️ 风险警示\n`;
        simple.riskWarnings.forEach((warning, index) => {
          report += `${index + 1}. ${warning}\n`;
        });
        report += `\n`;
      }
      
      if (simple.keyInsights.length > 0) {
        report += `### 💡 深度洞察\n`;
        simple.keyInsights.forEach((insight, index) => {
          report += `${index + 1}. ${insight}\n`;
        });
        report += `\n`;
      }
    }
    
    // 优化建议
    if (deep.optimizationSuggestions.length > 0) {
      report += `## 🎯 专业建议\n\n`;
      deep.optimizationSuggestions.forEach((suggestion, index) => {
        report += `### ${index + 1}. ${suggestion}\n`;
      });
      report += `\n`;
    }
    
    // 预测展望
    report += `## 📈 下月预测\n\n`;
    report += `**预计净利润区间：¥${deep.nextMonthPrediction.profitRange[0].toLocaleString()} - ¥${deep.nextMonthPrediction.profitRange[1].toLocaleString()}**\n\n`;
    report += `**预测依据：**\n`;
    deep.nextMonthPrediction.keyFactors.forEach((factor, index) => {
      report += `${index + 1}. ${factor}\n`;
    });
    
    report += `\n---\n`;
    report += `*报告生成时间：${new Date().toLocaleString('zh-CN')}*\n`;
    report += `*分析引擎：本地智能算法 + EdgeOne AI增强*`;

    return report;
  }

  /**
   * 准备发送给EdgeOne AI的数据
   */
  static prepareAIPrompt(request: AIAnalysisRequest): string {
    const { currentMonthData, lastMonthData, historicalData } = request;
    
    let prompt = `请分析以下电商财务数据，提供专业的财务分析和建议：\n\n`;
    
    // 当前月数据
    prompt += `【当前月份：${currentMonthData.month}】\n`;
    prompt += `- 月净利润：${currentMonthData.month_profit.toLocaleString()}元\n`;
    prompt += `- 月度每日利润总计：${currentMonthData.daily_profit_sum.toLocaleString()}元\n`;
    prompt += `- 总货款支出：${Math.abs(currentMonthData.payment_expense_sum).toLocaleString()}元\n`;
    prompt += `- 千川投流：${Math.abs(currentMonthData.qianchuan).toLocaleString()}元\n`;
    prompt += `- 硬性支出：${Math.abs(currentMonthData.hard_expense).toLocaleString()}元\n`;
    prompt += `- 赔付申请金额：${currentMonthData.claim_amount_sum.toLocaleString()}元\n`;
    prompt += `- 拼多多技术服务费：${Math.abs(currentMonthData.pdd_service_fee).toLocaleString()}元\n\n`;
    
    // 上月对比数据
    if (lastMonthData) {
      prompt += `【上月对比：${lastMonthData.month}】\n`;
      prompt += `- 月净利润：${lastMonthData.month_profit.toLocaleString()}元\n`;
      prompt += `- 千川投流：${Math.abs(lastMonthData.qianchuan).toLocaleString()}元\n`;
      prompt += `- 赔付申请金额：${lastMonthData.claim_amount_sum.toLocaleString()}元\n\n`;
    }
    
    // 历史趋势
    if (historicalData.length > 0) {
      prompt += `【历史趋势】\n`;
      const avgProfit = historicalData.reduce((sum, month) => sum + month.month_profit, 0) / historicalData.length;
      prompt += `- 近${historicalData.length}个月平均利润：${avgProfit.toLocaleString()}元\n`;
      prompt += `- 利润波动情况：${historicalData.map(m => m.month_profit.toLocaleString()).join('元, ')}元\n\n`;
    }
    
    prompt += `请提供：\n`;
    prompt += `1. 财务健康度评估（评分0-100）\n`;
    prompt += `2. 关键风险点识别\n`;
    prompt += `3. 具体优化建议（不超过3条）\n`;
    prompt += `4. 下月利润预测区间\n\n`;
    prompt += `要求：分析要专业、简洁，重点关注实用性建议，字数控制在500字以内。`;
    
    return prompt;
  }
}

