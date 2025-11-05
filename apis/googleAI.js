// npm install @google/genai
const { GoogleGenAI } = require("@google/genai"); // CommonJS require

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_KEY // make sure you set this in .env
});

module.exports = {
  ask: async (prompt) => {
    try {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash", // or whichever model you have access to
        contents: prompt
      });

      return response.text ?? "No response from Google AI.";

    } catch (err) {
      console.error("Google AI error:", err);
      return "Error querying Google AI.";
    }
  }
};
