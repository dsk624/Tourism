import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const generateAttractionGuide = async (attractionName: string, province: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      请为位于中国${province}的景点“${attractionName}”生成一份简短精炼的旅游指南。
      
      请包含以下三个简短的部分（每部分不超过50字）：
      1. ✨ 必看亮点
      2. 🍲 美食推荐
      3. 💡 游玩贴士

      请使用简单的HTML标签格式化输出 (例如 <h3>, <ul>, <li>, <p>)，不要使用markdown代码块。
      语气要生动有趣，富有感染力。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "<p>暂时无法获取AI指南，请稍后再试。</p>";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "<p>AI服务暂时繁忙，请稍后重试。</p>";
  }
};
