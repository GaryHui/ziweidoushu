const endpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    res.status(200).json({
      answer: "尚未配置千问密钥。你可以先使用页面内的本地学习与解读；部署后在 Vercel 环境变量中加入 DASHSCOPE_API_KEY，即可启用千问模型。"
    });
    return;
  }

  const { profile, question, localReading } = req.body || {};
  const prompt = [
    "你是一位严谨、温和的紫微斗数与易经学习导师。",
    "请用学习辅助的方式回答，不制造绝对命定、医疗、法律、投资结论。",
    "结合用户资料、本地排盘线索和问题，给出结构清晰、可实践的分析。",
    "",
    `用户资料：${JSON.stringify(profile || {}, null, 2)}`,
    `用户问题：${question || "希望获得综合学习建议"}`,
    `本地解读：${localReading || "暂无"}`
  ].join("\n");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.QWEN_MODEL || "qwen-plus",
        messages: [
          {
            role: "system",
            content: "你输出简体中文，语气清晰克制。把玄学内容作为传统文化学习与自我反思工具。"
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      res.status(response.status).json({ error: "Qwen request failed", detail });
      return;
    }

    const data = await response.json();
    res.status(200).json({
      answer: data?.choices?.[0]?.message?.content || "千问没有返回有效内容，请稍后再试。"
    });
  } catch (error) {
    res.status(500).json({ error: "Qwen request failed", detail: error.message });
  }
};
