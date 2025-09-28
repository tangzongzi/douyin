/**
 * AI分析业务逻辑
 * 提供财务数据的智能分析功能
 */

import { MonthlyFinancialData, SimpleAnalysis, DeepAnalysis, AIAnalysisRequest } from '@/types/ai-analysis';

export class AIAnalysisLogic {
  
  /**
   * 生成简单分析
   */
  static generateSimpleAnalysis(request: AIAnalysisRequest): SimpleAnalysis {
    const { currentMonthData, lastMonthData } = request;
    const positiveFactors: string[] = [];
    const riskWarnings: string[] = [];
    const keyInsights: string[] = [];

    if (lastMonthData) {
      // 利润变化分析
      const profitChange = ((currentMonthData.month_profit - lastMonthData.month_profit) / Math.abs(lastMonthData.month_profit)) * 100;
      if (profitChange > 0) {
        positiveFactors.push(`月净利润${currentMonthData.month_profit.toLocaleString()}元，环比上升${profitChange.toFixed(1)}%`);
      } else if (profitChange < -20) {
        riskWarnings.push(`净利润环比下降${Math.abs(profitChange).toFixed(1)}%，需立即关注`);
      } else if (profitChange < 0) {
        keyInsights.push(`净利润环比下降${Math.abs(profitChange).toFixed(1)}%，但仍在合理范围内`);
      }

      // 赔付分析
      const claimChange = ((currentMonthData.claim_amount_sum - lastMonthData.claim_amount_sum) / Math.abs(lastMonthData.claim_amount_sum || 1)) * 100;
      if (claimChange < -50) {
        positiveFactors.push(`赔付申请金额${currentMonthData.claim_amount_sum.toLocaleString()}元，环比大幅下降${Math.abs(claimChange).toFixed(1)}%，风险控制改善显著`);
      } else if (claimChange > 50) {
        riskWarnings.push(`赔付申请金额环比上升${claimChange.toFixed(1)}%，需加强风险管控`);
      }
    }

    // 成本结构分析
    const totalCost = Math.abs(currentMonthData.payment_expense_sum) + 
                     Math.abs(currentMonthData.qianchuan) + 
                     Math.abs(currentMonthData.hard_expense);
    const profitMargin = (currentMonthData.month_profit / (currentMonthData.month_profit + totalCost)) * 100;
    
    if (profitMargin > 15) {
      positiveFactors.push(`利润率${profitMargin.toFixed(1)}%，盈利能力良好`);
    } else if (profitMargin < 5) {
      riskWarnings.push(`利润率仅${profitMargin.toFixed(1)}%，成本控制需要加强`);
    }

    // 千川投流效率分析
    if (currentMonthData.qianchuan > 0) {
      const qianchuanROI = currentMonthData.month_profit / Math.abs(currentMonthData.qianchuan);
      if (qianchuanROI < 2) {
        riskWarnings.push(`千川投流ROI为${qianchuanROI.toFixed(1)}，投入产出比偏低`);
      } else if (qianchuanROI > 5) {
        positiveFactors.push(`千川投流ROI为${qianchuanROI.toFixed(1)}，投入产出效果优秀`);
      }
    }

    return {
      positiveFactors,
      riskWarnings,
      keyInsights
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
   * 计算风险控制评分
   */
  private static calculateRiskControlScore(current: MonthlyFinancialData, last?: MonthlyFinancialData): number {
    let score = 15; // 基础分
    
    // 赔付率控制
    const claimRate = current.claim_amount_sum / Math.abs(current.payment_expense_sum) * 100;
    if (claimRate < 1) score += 10;
    else if (claimRate < 3) score += 7;
    else if (claimRate < 5) score += 5;
    
    // 赔付趋势
    if (last) {
      const claimChange = (current.claim_amount_sum - last.claim_amount_sum) / Math.abs(last.claim_amount_sum || 1) * 100;
      if (claimChange < -30) score += 5;
      else if (claimChange < 0) score += 3;
      else if (claimChange > 50) score -= 5;
    }
    
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
   * 生成优化建议
   */
  private static generateOptimizationSuggestions(
    current: MonthlyFinancialData, 
    last?: MonthlyFinancialData,
    scores?: { profitabilityScore: number; riskControlScore: number; costControlScore: number }
  ): string[] {
    const suggestions: string[] = [];

    // 基于评分的建议
    if (scores) {
      if (scores.profitabilityScore < 20) {
        suggestions.push('关注收入结构优化，考虑提高客单价或扩大销售规模');
      }
      
      if (scores.riskControlScore < 20) {
        suggestions.push('加强质量控制，降低赔付率，建议优化供应链管理');
      }
      
      if (scores.costControlScore < 25) {
        suggestions.push('优化成本结构，重点控制千川投流和硬性支出');
      }
    }

    // 具体数值建议
    if (current.qianchuan > 3000) {
      suggestions.push(`千川投流支出${Math.abs(current.qianchuan).toLocaleString()}元，建议控制在2,500元以内`);
    }
    
    if (current.deposit > 5000) {
      suggestions.push(`保证金占用${Math.abs(current.deposit).toLocaleString()}元，建议优化资金周转效率`);
    }
    
    if (current.claim_amount_sum > current.month_profit * 0.1) {
      suggestions.push('赔付金额占利润比例较高，建议加强产品质量控制');
    }

    return suggestions.slice(0, 3); // 最多3条建议
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
   * 格式化分析结果为可读文本
   */
  static formatAnalysisToText(simple: SimpleAnalysis, deep: DeepAnalysis): string {
    let report = `📊 财务分析报告\n\n`;
    
    // 简单分析部分
    report += `【简单分析】\n`;
    
    if (simple.positiveFactors.length > 0) {
      report += `✅ 积极因素：\n`;
      simple.positiveFactors.forEach(factor => {
        report += `- ${factor}\n`;
      });
      report += `\n`;
    }
    
    if (simple.riskWarnings.length > 0) {
      report += `⚠️ 关键风险：\n`;
      simple.riskWarnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
      report += `\n`;
    }
    
    if (simple.keyInsights.length > 0) {
      report += `💡 关键洞察：\n`;
      simple.keyInsights.forEach(insight => {
        report += `- ${insight}\n`;
      });
      report += `\n`;
    }

    // 深度分析部分
    report += `【深度分析】\n`;
    report += `💡 财务健康度：${deep.healthLevel === 'excellent' ? '优秀' : deep.healthLevel === 'good' ? '良好' : deep.healthLevel === 'fair' ? '一般' : '较差'}（评分：${deep.healthScore}/100）\n`;
    report += `- 盈利能力：${deep.profitabilityScore}/30分\n`;
    report += `- 风险控制：${deep.riskControlScore}/30分\n`;
    report += `- 成本控制：${deep.costControlScore}/40分\n\n`;
    
    if (deep.optimizationSuggestions.length > 0) {
      report += `🎯 优化建议：\n`;
      deep.optimizationSuggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}\n`;
      });
      report += `\n`;
    }
    
    report += `📈 下月预测：\n`;
    report += `预计净利润区间：${deep.nextMonthPrediction.profitRange[0].toLocaleString()}-${deep.nextMonthPrediction.profitRange[1].toLocaleString()}元\n`;
    deep.nextMonthPrediction.keyFactors.forEach(factor => {
      report += `- ${factor}\n`;
    });

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
