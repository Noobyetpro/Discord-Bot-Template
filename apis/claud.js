const fetch = require('node-fetch'); // npm install node-fetch

const API_KEY = process.env.CLAUD_API_KEY;
const ANTHROPIC_VERSION = "2023-06-01"; // replace with the version you want

module.exports = {
  ask: async (prompt) => {
    try {
      const url = 'https://api.anthropic.com/v1/complete';
      const body = {
        model: "claude-v1", // or "claude-v2", adjust as needed
        prompt: prompt,
        max_tokens_to_sample: 300
      };

      const options = {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };

      const response = await fetch(url, options);
      const data = await response.json();

      // Claude returns text in 'completion'
      return data.completion ?? "No response from Claud.";

    } catch (err) {
      console.error('Claud (Anthropic) error:', err);
      return 'Error querying Claud.';
    }
  }
};
