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
 ┣ 📄 userpreference.json
 ┣ 📄 guildchannels.json
 ┣ 📄 guildpermissions.json
 ┗ 📄 README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```
npm install
```

### 2. open the  `.env` file and edit these stuff shown below. 
Ways to obtain them are self explanatory and if u dont know u noob

```
TOKEN=
GROQ_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_KEY=
CLAUD_API_KEY=
AIML_API_KEY=
CLIENT_ID=
GUILD_ID=

```
Note: You only need one of the api keys unless you want to try different apu platforms.

### 3. Run the Bot

```
node bot.js
```

---



## 🧪 Testing

You can test commands locally by running:

```
node bot.js
```

Make sure your bot is invited to your server with appropriate permissions. Use an invite link with this format:
```bash
https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID&scope=bot&permissions=8
```
---

## 📤 Deployment

### Replit

* Import the project
* Run normally if ur not dumb

### Other platforms

* Railway / Render / Heroku / VPS all work the same
* Ensure environment variables are set
* Ensure `node bot.js` is your start command

---
## Command Reference

/personality set <text>
Set the bot’s active personality string.

/personality view
Show the current personality.

/personality clear
Remove the current personality.

/permission <set|remove> <role>
Grant or revoke a role’s access to bot commands.

/setai <provider>
Select the AI backend used for responses. Only one is active.

/channel
Bind the bot to the channel where this command is run. The bot listens and replies only there.

---
## 🤝 Contributing

Pull requests are welcome! If you want to improve structure, add better command loaders, or enhance Groq integration, feel free to open an issue first.

---

## 📄 License

This project is licensed under the MIT License. Use it freely for personal or commercial purposes.

---

### ⭐ If you find this template helpful, consider starring the repo!

### U also have to @ / reply the bot to make it say something if it said nothing copy log and open issue
