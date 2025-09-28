import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService, getSupabaseClient } from '@/lib/supabase';
import { AIAnalysisLogic } from '@/lib/ai-analysis-logic';
import { AIAnalysisRequest, MonthlyFinancialData } from '@/types/ai-analysis';
import { AIAnalysisReport } from '@/lib/supabase';
import dayjs from 'dayjs';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '2025-09';
  const force = searchParams.get('force') === 'true';
  
  try {
    console.log(`[AI Analysis] 开始分析月份: ${month}, 强制重新生成: ${force}`);
    
    // 1. 检查是否已有分析结果（如果不是强制生成）
    if (!force) {
      const existingAnalysis = await getExistingAnalysis(month);
      if (existingAnalysis) {
        console.log('[AI Analysis] 返回缓存的分析结果');
        return NextResponse.json({
          success: true,
          data: existingAnalysis,
          fromCache: true,
          message: '返回已有分析结果'
        });
      }
    }
    
    // 2. 获取财务数据
    const monthlyData = await SupabaseService.getMonthlySummary(12);
    if (monthlyData.length === 0) {
      throw new Error('没有可分析的月度数据');
    }
    
    // 3. 准备分析数据
    const currentMonthData = monthlyData.find(item => item.month === month);
    if (!currentMonthData) {
      throw new Error(`未找到${month}的数据`);
    }
    
    const lastMonth = dayjs(month).subtract(1, 'month').format('YYYY-MM');
    const lastMonthData = monthlyData.find(item => item.month === lastMonth);
    
    // 按时间排序历史数据
    const historicalData = monthlyData
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(0, 6);
    
    const analysisRequest: AIAnalysisRequest = {
      month,
      currentMonthData: currentMonthData as MonthlyFinancialData,
      lastMonthData: lastMonthData as MonthlyFinancialData,
      historicalData: historicalData as MonthlyFinancialData[],
      analysisType: 'both'
    };
    
    // 4. 生成本地分析（作为基础）
    const simpleAnalysis = AIAnalysisLogic.generateSimpleAnalysis(analysisRequest);
    const deepAnalysis = AIAnalysisLogic.generateDeepAnalysis(analysisRequest);
    
    // 5. 调用EdgeOne AI增强分析（本地环境暂时跳过）
    let aiEnhancedAnalysis = null;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      try {
        const aiPrompt = AIAnalysisLogic.prepareAIPrompt(analysisRequest);
        
        // 调用EdgeOne边缘AI函数（仅在生产环境）
        const aiResponse = await fetch('/edge-functions/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiPrompt,
            analysisType: 'both'
          })
        });
        
        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          if (aiResult.success) {
            aiEnhancedAnalysis = aiResult.data.analysis;
            console.log('[AI Analysis] EdgeOne AI增强分析完成');
          }
        }
      } catch (aiError) {
        console.warn('[AI Analysis] EdgeOne AI调用失败，使用本地分析:', aiError);
      }
    } else {
      console.log('[AI Analysis] 本地环境，跳过EdgeOne AI调用，使用本地分析');
    }
    
    // 6. 保存分析结果到数据库
    const analysisResult: AIAnalysisReport = {
      month,
      analysis_type: 'both',
      simple_analysis: simpleAnalysis,
      deep_analysis: deepAnalysis,
      generated_at: new Date().toISOString(),
      data_snapshot: currentMonthData as MonthlyFinancialData,
      ai_enhanced_text: aiEnhancedAnalysis // 新增AI增强分析
    };
    
    await saveAnalysisResult(analysisResult);
    
    // 7. 格式化返回结果
    const formattedText = AIAnalysisLogic.formatAnalysisToText(simpleAnalysis, deepAnalysis, month);
    
    return NextResponse.json({
      success: true,
      data: {
        ...analysisResult,
        formatted_text: formattedText,
        ai_enhanced_text: aiEnhancedAnalysis
      },
      fromCache: false,
      generationTime: Date.now(),
      message: 'AI分析生成完成'
    });
    
  } catch (error) {
    console.error('[AI Analysis] 分析失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI分析失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  
  try {
    if (month) {
      // 获取指定月份的分析结果
      const analysis = await getExistingAnalysis(month);
      
      if (analysis) {
        return NextResponse.json({
          success: true,
          data: analysis,
          message: '获取分析结果成功'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: '该月份暂无分析结果',
          suggestion: '请点击"生成AI分析"按钮创建分析报告'
        });
      }
    } else {
      // 获取所有分析结果
      const allAnalysis = await getAllAnalysisResults();
      
      return NextResponse.json({
        success: true,
        data: allAnalysis,
        count: allAnalysis.length,
        message: '获取所有分析结果成功'
      });
    }
    
  } catch (error) {
    console.error('[AI Analysis] 获取分析结果失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取分析结果失败'
      },
      { status: 500 }
    );
  }
}

// 辅助函数：获取已有分析结果
async function getExistingAnalysis(month: string): Promise<AIAnalysisReport | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ai_analysis_reports')
      .select('*')
      .eq('month', month)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.log(`[AI Analysis] 未找到${month}的分析结果:`, error);
    return null;
  }
}

// 辅助函数：保存分析结果
async function saveAnalysisResult(result: AIAnalysisReport): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('ai_analysis_reports')
      .upsert(result, { onConflict: 'month' });
    
    if (error) {
      throw error;
    }
    
    console.log(`[AI Analysis] 分析结果已保存: ${result.month}`);
  } catch (error) {
    console.error('[AI Analysis] 保存分析结果失败:', error);
    throw error;
  }
}

// 辅助函数：获取所有分析结果
async function getAllAnalysisResults(): Promise<AIAnalysisReport[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ai_analysis_reports')
      .select('*')
      .order('month', { ascending: false })
      .limit(12);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[AI Analysis] 获取所有分析结果失败:', error);
    return [];
  }
}
