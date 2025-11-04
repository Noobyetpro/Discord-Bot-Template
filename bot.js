require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const https = require("https");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const GROQ_API_KEY = process.env.GROQ_API_KEY; 

client.on("ready", () => {
    console.log("Your Bot is online and using GroQ with your stupid api key lmao");
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    if (msg.mentions.has(client.user)) {
        const userMessage = msg.content
            .replace(`<@${client.user.id}>`, "")
            .trim();

        const messages = [
            {
                role: "system",
                content:
                    "Put what u want your ai to become e.g. "You are a dumb ai and xevex will kill u"",
            },
            {
                role: "user",
                content: userMessage,
            },
        ];

        const requestBody = JSON.stringify({
            model: "llama3-70b-8192",
            messages: messages,
            temperature: 0.8,
            max_tokens: 540,
        });

        const options = {
            hostname: "api.groq.com",
            port: 443,
            path: "/openai/v1/chat/completions",
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(requestBody),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    const reply = result.choices[0].message.content.trim();
                    msg.reply(reply);
                } else {
                    console.error("GroQ API error:", data);
                    msg.reply("Oops! GroQ didn't vibe with that. Try again?");
                }
            });
        });

        req.on("error", (e) => {
            console.error("HTTPS error:", e);
            msg.reply("Yikes, something broke while talking to GroQ 😬");
        });

        req.write(requestBody);
        req.end();
    }
});

client.login(process.env.DISCORD_TOKEN);
