// npm install openai
const { OpenAI } = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  ask: async (prompt) => {
    try {
      const res = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.error("OpenAI error:", err);
      return "Error querying OpenAI.";
    }
  },
};
