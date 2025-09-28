/**
 * EdgeOne边缘AI分析函数
 * 调用DeepSeek-R1模型进行财务数据分析
 */

export async function onRequestPost({ request }) {
  try {
    // 解析请求数据
    const { prompt, analysisType } = await request.json();
    
    console.log('[EdgeOne AI] 开始财务数据分析，类型:', analysisType);
    
    // 构建AI分析提示词
    const systemPrompt = `你是一位专业的电商财务分析师，擅长从数据中发现问题和机会。
请基于提供的财务数据，进行专业、实用的分析。

分析要求：
1. 语言简洁专业，重点突出
2. 提供具体可行的建议
3. 数据解读要准确客观
4. 风险提醒要及时明确
5. 字数控制在500字以内

输出格式：
- 使用markdown格式
- 分为积极因素、风险警告、优化建议、预测展望四个部分
- 每个建议都要具体可操作`;

    // 调用EdgeOne边缘AI服务
    const response = await AI.chatCompletions({
      model: '@tx/deepseek-ai/deepseek-r1-0528', // 使用R1模型，每日20次限制
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false, // 不使用流式输出，获取完整结果
      temperature: 0.3, // 较低温度，确保分析的准确性
      max_tokens: 800 // 控制输出长度
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
