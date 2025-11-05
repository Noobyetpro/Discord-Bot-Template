// npm install groq-sdk
const Groq = require("groq-sdk");
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = {
  ask: async (prompt) => {
    try {
      const res = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.error("Groq error:", err);
      return "Error querying Groq.";
    }
  },
};
