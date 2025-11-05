const OpenAI = require("openai");

module.exports = {
  ask: async (prompt) => {
    try {
      const client = new OpenAI({
        apiKey: process.env.AIML_API_KEY,
        baseURL: "https://api.aimlapi.com/v1",
      });

      const response = await client.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{ role: "user", content: prompt }],
      });

      return response.choices[0].message.content;
    } catch (err) {
      console.error("Aimlapi error:", err);
      return "Error querying Aimlapi.";
    }
  },
};
