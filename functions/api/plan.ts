
export const onRequestPost = async (context: any) => {
  try {
    const { destination, days, interests } = await context.request.json();
    const env = context.env;

    // 优先读取 DEEPSEEK_API_KEY，如果没有则尝试读取通用的 API_KEY
    const apiKey = env.DEEPSEEK_API_KEY || env.API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), { status: 500 });
    }

    const systemPrompt = `你是一位资深、热情的中国旅游规划专家。
请根据用户的目的地、行程天数和兴趣偏好，为其定制一份详尽的旅行计划。

输出要求：
1. 格式：使用清晰的 Markdown 格式。
2. 结构：按天数划分（如 ### 第一天），包含【上午】、【下午】、【晚上】的具体行程。
3. 内容：
   - 景点安排：需考虑路线顺畅度。
   - 美食推荐：必须包含具体的当地特色菜名和推荐理由。
   - 交通贴士：提供景点间的交通建议。
4. 风格：文案生动有趣，富有感染力，让用户对旅程充满期待。
5. 禁止：不要输出 JSON 代码块或任何系统解释性文字，直接输出行程内容。`;

    const userPrompt = `我计划去【${destination || '中国'}】游玩【${days || '3'}】天。
我的兴趣偏好是：${interests || '经典地标, 地道美食'}。
请为我规划行程。`;

    // 调用 DeepSeek API (兼容 OpenAI 格式)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // 使用 DeepSeek-V3 模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1.2, // 稍微调高温度以增加行程的创意和丰富度
        stream: false,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData: any = await response.json();
      throw new Error(errorData.error?.message || `DeepSeek API Error: ${response.status}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || '抱歉，AI 暂时没有返回内容。';

    return new Response(JSON.stringify({ 
      success: true, 
      content: content 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('AI Planning error:', error);
    return new Response(JSON.stringify({ 
      error: '智能规划服务暂时繁忙，请稍后重试',
      details: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
};
