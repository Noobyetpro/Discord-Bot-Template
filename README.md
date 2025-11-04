# Discord Bot Template (Node.js + Groq API)

A clean, modern, and scalable **Discord bot template** built with **Node.js**, structured event handling, and optional integration with the **Groq API** for AI-powered interactions.

This template is designed for developers who want a fast, organized starting point without dealing with messy boilerplate.

---

## ✅ Features
* Built-in **Groq API** integration
* Fast startup with Node.js + `discord.js`
* Environment variable support with `.env`
* Easy to deploy locally or on platforms like Replit, Railway, Render, etc.

---

## 📁 Project Structure

```
📦 project
 ┣ 📄 bot.js          # Main bot file
 ┣ 📄 .env
 ┣ 📄 package.json
 ┗ 📄 README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```
npm install
```

### 2. Create a `.env` file

```
TOKEN=your_discord_bot_token
GROQ_API_KEY=your_groq_api_key   # Optional
```

### 3. Run the Bot

```
node bot.js
```

---

## 🔌 Using the Groq API

This template includes optional support for the **Groq API**.

You can call it inside a command or event like:

```js
const response = await groq.chat.completions.create({
  model: "mixtral-8x7b",
  messages: [{ role: "user", content: "Hello!" }]
});
```

If the API key is missing, the bot will simply skip AI-related features.

---

## 🛠️ Customizing the Bot

### Add a Command

Create a new file in `commands/`:

```js
module.exports = {
  name: "ping",
  description: "Replies with Pong!",
  execute(message) {
    message.reply("Pong!");
  }
};
```

### Add an Event

Inside `events/`:

```js
module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`${client.user.tag} is online!`);
  }
};
```

---

## 🧪 Testing

You can test commands locally by running:

```
node bot.js
```

Make sure your bot is invited to your server with appropriate permissions. you can set your bot permissions [here](https://discord.com/developers/applications/REPLACE WITH UR BOT ID/installation)
---

## 📤 Deployment

### Replit

* Import the project
* Run normally if ur not dump

### Other platforms

* Railway / Render / Heroku / VPS all work the same
* Ensure environment variables are set
* Ensure `node bot.js` is your start command

---

## 🤝 Contributing

Pull requests are welcome! If you want to improve structure, add better command loaders, or enhance Groq integration, feel free to open an issue first.

---

## 📄 License

This project is licensed under the MIT License. Use it freely for personal or commercial purposes.

---

### ⭐ If you find this template helpful, consider starring the repo!
