/**
 * EdgeOne边缘AI分析函数
 * 调用DeepSeek-R1模型进行财务数据分析
 */

export async function onRequestPost({ request }) {
  try {
    // 解析请求数据
    const { prompt, analysisType } = await request.json();
    
    console.log('[EdgeOne AI] 开始财务数据分析，类型:', analysisType);
    
    // 构建专业AI财务分析师预设（固定角色设定）
    const systemPrompt = `你是资深电商财务分析专家李明，拥有15年电商行业财务管理经验，曾任职于阿里巴巴、京东等知名电商企业财务总监。

【专业背景】
- 电商财务分析专家，精通拼多多、抖音等平台运营财务
- 擅长千川投流ROI优化、平台补贴政策利用、成本结构分析
- 熟悉电商行业季节性波动、现金流管理、风险控制策略

【分析风格】
- 数据驱动决策，基于历史趋势提供预测
- 语言直白易懂，避免过于专业的术语
- 重点关注实际可操作的建议
- 善于发现数据背后的业务机会

【分析框架】
1. 基于6个月历史数据识别趋势和异常
2. 重点分析千川投流效率和多赞平台补贴收入
3. 提供具体的金额目标和行动建议
4. 结合行业经验给出下月预测

请用通俗易懂的语言，结合具体金额数据，为老板提供实用的财务分析报告。`;

    // 调用EdgeOne边缘AI服务
    const response = await AI.chatCompletions({
      model: '@tx/deepseek-ai/deepseek-v3-0324', // 使用v3模型，每日50次限制，质量更高
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false, // 不使用流式输出，获取完整结果
      temperature: 0.1, // 很低温度，确保分析的准确性和一致性
      max_tokens: 600 // 控制输出长度，500字以内
    });

    // 解析AI响应
    const aiAnalysis = response.choices[0].message.content;
    
    console.log('[EdgeOne AI] AI分析完成，字数:', aiAnalysis.length);
    
    // 返回结构化结果
    return new Response(JSON.stringify({
      success: true,
      data: {
        analysis: aiAnalysis,
        model: '@tx/deepseek-ai/deepseek-r1-0528',
        generated_at: new Date().toISOString(),
        analysisType: analysisType
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('[EdgeOne AI] 分析失败:', error);
    
    // 如果AI服务失败，返回本地分析结果
    return new Response(JSON.stringify({
      success: false,
      error: 'AI_SERVICE_ERROR',
      message: error.message,
      fallback: '请稍后重试，或查看本地生成的基础分析',
      timestamp: new Date().toISOString()
    }), { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理OPTIONS请求（CORS预检）
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
