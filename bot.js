// bot.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} = require("discord.js");

const groq = require("./apis/groq");
const openai = require("./apis/openai");
const googleAI = require("./apis/googleAI");
const claud = require("./apis/claud");
const aimlapi = require("./apis/aimlapi");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID || null;

if (!TOKEN || !CLIENT_ID) {
  console.error("TOKEN and CLIENT_ID must be set in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// storage files
const prefsFile = path.resolve("./userPreferences.json");
const guildChannelsFile = path.resolve("./guildChannels.json");
const guildPermissionsFile = path.resolve("./guildPermissions.json");

let userPrefs = {};
let guildChannels = {};
let guildPermissions = {}; // { guildId: [roleId, roleId, ...] }

// load storage safely
if (fs.existsSync(prefsFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(prefsFile, "utf8"));
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string")
        userPrefs[k] = { platform: v, personality: null };
      else if (v && typeof v === "object")
        userPrefs[k] = {
          platform: v.platform ?? null,
          personality: v.personality ?? null,
          keys: v.keys ?? null,
        };
      else userPrefs[k] = { platform: null, personality: null };
    }
  } catch (e) {
    console.error("Failed to parse userPreferences.json, starting fresh.", e);
    userPrefs = {};
  }
}

if (fs.existsSync(guildChannelsFile)) {
  try {
    guildChannels = JSON.parse(fs.readFileSync(guildChannelsFile, "utf8"));
  } catch (e) {
    guildChannels = {};
  }
}
if (fs.existsSync(guildPermissionsFile)) {
  try {
    guildPermissions = JSON.parse(
      fs.readFileSync(guildPermissionsFile, "utf8"),
    );
  } catch (e) {
    guildPermissions = {};
  }
}

// util saves
function savePrefs() {
  fs.writeFileSync(prefsFile, JSON.stringify(userPrefs, null, 2));
}
function saveGuildChannels() {
  fs.writeFileSync(guildChannelsFile, JSON.stringify(guildChannels, null, 2));
}
function saveGuildPermissions() {
  fs.writeFileSync(
    guildPermissionsFile,
    JSON.stringify(guildPermissions, null, 2),
  );
}

// allowed platform list
const PLATFORMS = ["groq", "openai", "google", "claud", "aimlapi"];
const MAX_PERSONALITY_LENGTH = 1000;

// helper: pick api module
function getApiModule(name) {
  switch (name) {
    case "groq":
      return groq;
    case "openai":
      return openai;
    case "google":
      return googleAI;
    case "claud":
      return claud;
    case "aimlapi":
      return aimlapi;
    default:
      return null;
  }
}

// check whether a guild has restrictions and if member is allowed
function guildHasRestrictions(guildId) {
  const arr = guildPermissions[guildId];
  return Array.isArray(arr) && arr.length > 0;
}
function memberHasAllowedRole(member) {
  if (!member || !member.roles) return false;
  const allowed = guildPermissions[member.guild.id];
  if (!Array.isArray(allowed) || allowed.length === 0) return true; // no restrictions configured -> allow
  // check if member has at least one allowed role
  return allowed.some((roleId) => member.roles.cache.has(roleId));
}

// personality instruction (unchanged)
function personalityInstruction(style) {
  if (!style) return "";
  // if style is one of presets (not used now), leave support; otherwise string is custom and used verbatim
  switch (style) {
    case "friendly":
      return "You are a friendly, helpful assistant. Use warm language and short examples.";
    case "formal":
      return "You are a formal, professional assistant. Use polite and precise language.";
    case "witty":
      return "You are witty and clever. Reply with short, amusing lines when appropriate.";
    case "concise":
      return "Be concise and to the point. Keep responses short and focused.";
    case "sarcastic":
      return "Respond with light sarcasm where appropriate, but avoid being offensive.";
    default:
      return style; // if user set custom text, return it verbatim
  }
}

// Register slash commands (includes permission management)
async function registerCommands() {
  const commands = [
    {
      name: "setai",
      description: "Set your preferred AI platform for future messages",
      options: [
        {
          name: "platform",
          type: ApplicationCommandOptionType.String,
          description: "Select AI: groq, openai, google, claud, aimlapi",
          required: true,
          choices: PLATFORMS.map((p) => ({ name: p, value: p })),
        },
      ],
    },
    {
      name: "channel",
      description: "Configure which channel the bot listens to for AI messages",
      options: [
        {
          name: "action",
          type: ApplicationCommandOptionType.String,
          description: "set or clear the AI channel for this server",
          required: true,
          choices: [
            { name: "set", value: "set" },
            { name: "clear", value: "clear" },
          ],
        },
      ],
    },
    {
      name: "personality",
      description: "Manage your custom AI personality",
      options: [
        {
          name: "set",
          type: ApplicationCommandOptionType.Subcommand,
          description: "Set a custom personality prompt for your AI",
          options: [
            {
              name: "text",
              type: ApplicationCommandOptionType.String,
              description:
                "The personality text to prepend to prompts (max 1000 chars)",
              required: true,
            },
          ],
        },
        {
          name: "view",
          type: ApplicationCommandOptionType.Subcommand,
          description: "View your current custom personality (private)",
        },
        {
          name: "clear",
          type: ApplicationCommandOptionType.Subcommand,
          description: "Clear your custom personality",
        },
      ],
    },
    {
      name: "permission",
      description:
        "Manage which roles can use the bot in this server (Manage Server only)",
      options: [
        {
          name: "action",
          type: ApplicationCommandOptionType.String,
          description: "add/remove/list/clear role permissions",
          required: true,
          choices: [
            { name: "add", value: "add" },
            { name: "remove", value: "remove" },
            { name: "list", value: "list" },
            { name: "clear", value: "clear" },
          ],
        },
        {
          name: "role",
          type: ApplicationCommandOptionType.Role,
          description: "Role to add or remove (required for add/remove)",
          required: false,
        },
      ],
    },
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    if (GUILD_ID) {
      console.log("Registering guild commands for", GUILD_ID);
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
    } else {
      console.log(
        "Registering global commands (may take a few minutes to propagate)",
      );
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    }
    console.log("Slash commands registered.");
  } catch (err) {
    console.error("Error registering commands:", err);
  }
}

// handle slash commands (interactions)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const guildId = interaction.guildId;
  const member = interaction.member; // GuildMember

  // Permission enforcement for commands: if guild has restrictions, member must have allowed role
  if (guildHasRestrictions(guildId) && !memberHasAllowedRole(member)) {
    return interaction.reply({
      content: "You do not have a role allowed to use this bot in this server.",
      ephemeral: true,
    });
  }

  if (commandName === "setai") {
    const platform = interaction.options.getString("platform").toLowerCase();
    if (!PLATFORMS.includes(platform)) {
      return interaction.reply({
        content: `Unknown platform. Choose: ${PLATFORMS.join(", ")}`,
        ephemeral: true,
      });
    }
    const uid = interaction.user.id;
    userPrefs[uid] = userPrefs[uid] ?? { platform: null, personality: null };
    userPrefs[uid].platform = platform;
    savePrefs();
    return interaction.reply({
      content: `✅ Your AI preference is now **${platform}**`,
      ephemeral: true,
    });
  }

  if (commandName === "channel") {
    const action = interaction.options.getString("action");

    // require Manage Guild to change channel
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return interaction.reply({
        content: "You need the **Manage Server** permission to run this.",
        ephemeral: true,
      });
    }

    if (action === "set") {
      guildChannels[guildId] = interaction.channelId;
      saveGuildChannels();
      return interaction.reply({
        content: `✅ This channel (<#${interaction.channelId}>) is set as the AI listening channel.`,
        ephemeral: false,
      });
    } else if (action === "clear") {
      delete guildChannels[guildId];
      saveGuildChannels();
      return interaction.reply({
        content: `✅ AI listening channel cleared for this server.`,
        ephemeral: false,
      });
    }
  }

  if (commandName === "personality") {
    const sub = interaction.options.getSubcommand();
    const uid = interaction.user.id;
    userPrefs[uid] = userPrefs[uid] ?? { platform: null, personality: null };

    if (sub === "set") {
      const text = interaction.options.getString("text");
      if (!text || text.trim().length === 0)
        return interaction.reply({
          content: "Personality text cannot be empty.",
          ephemeral: true,
        });
      if (text.length > MAX_PERSONALITY_LENGTH)
        return interaction.reply({
          content: `Personality too long — max ${MAX_PERSONALITY_LENGTH} characters.`,
          ephemeral: true,
        });

      userPrefs[uid].personality = text;
      savePrefs();
      return interaction.reply({
        content: "✅ Your custom personality has been saved.",
        ephemeral: true,
      });
    }

    if (sub === "view") {
      const p = userPrefs[uid].personality;
      return interaction.reply({
        content: p
          ? `Your personality:\n\`\`\`\n${p}\n\`\`\``
          : "You have no custom personality set.",
        ephemeral: true,
      });
    }

    if (sub === "clear") {
      userPrefs[uid].personality = null;
      savePrefs();
      return interaction.reply({
        content: "✅ Your custom personality has been cleared.",
        ephemeral: true,
      });
    }
  }

  if (commandName === "permission") {
    // only Manage Guild can run permission changes
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return interaction.reply({
        content: "You need the **Manage Server** permission to run this.",
        ephemeral: true,
      });
    }

    const action = interaction.options.getString("action");
    const role = interaction.options.getRole("role"); // may be null for list/clear

    guildPermissions[guildId] = guildPermissions[guildId] ?? [];

    if (action === "add") {
      if (!role)
        return interaction.reply({
          content: "You must provide a role to add.",
          ephemeral: true,
        });
      const roleId = role.id;
      if (!guildPermissions[guildId].includes(roleId)) {
        guildPermissions[guildId].push(roleId);
        saveGuildPermissions();
      }
      return interaction.reply({
        content: `✅ Role <@&${roleId}> added to allowed list.`,
        ephemeral: false,
      });
    }

    if (action === "remove") {
      if (!role)
        return interaction.reply({
          content: "You must provide a role to remove.",
          ephemeral: true,
        });
      const roleId = role.id;
      guildPermissions[guildId] = guildPermissions[guildId].filter(
        (id) => id !== roleId,
      );
      saveGuildPermissions();
      return interaction.reply({
        content: `✅ Role <@&${roleId}> removed from allowed list.`,
        ephemeral: false,
      });
    }

    if (action === "list") {
      const arr = guildPermissions[guildId] ?? [];
      if (arr.length === 0)
        return interaction.reply({
          content: "No roles are configured — everyone may use the bot.",
          ephemeral: true,
        });
      const mentionList = arr.map((id) => `<@&${id}>`).join(", ");
      return interaction.reply({
        content: `Allowed roles: ${mentionList}`,
        ephemeral: true,
      });
    }

    if (action === "clear") {
      delete guildPermissions[guildId];
      saveGuildPermissions();
      return interaction.reply({
        content: "✅ Allowed roles cleared — everyone may use the bot.",
        ephemeral: false,
      });
    }
  }
});

// messageCreate — listen only in configured channels, allow everyone to chat
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return; // ignore bot messages

    const guildId = message.guild?.id;
    if (!guildId) return; // ignore DMs

    const configuredChannelId = guildChannels[guildId];
    if (!configuredChannelId) return; // no channel configured
    if (message.channel.id !== configuredChannelId) return; // not the right channel

    const userId = message.author.id;
    const pref = userPrefs[userId];
    if (!pref || !pref.platform) {
      return message.reply({
        content:
          "You have not set your AI preference. Use the `/setai` command to choose an AI.",
      });
    }

    const apiModule = getApiModule(pref.platform);
    if (!apiModule || typeof apiModule.ask !== "function") {
      console.error(
        `API module missing or invalid for platform: ${pref.platform}`,
      );
      return message.reply({
        content: `Configured AI (${pref.platform}) is not available. Contact an admin.`,
      });
    }

    const personality = pref.personality ?? null;
    const userPrompt = message.content;
    const personalityText = personalityInstruction(personality);
    const fullPrompt = personalityText
      ? `${personalityText}\n\nUser: ${userPrompt}`
      : userPrompt;

    message.channel.sendTyping();

    let aiReply;
    try {
      aiReply = await apiModule.ask(fullPrompt);
    } catch (err) {
      console.error("Error calling AI module:", err);
      aiReply = "Something went wrong while querying the AI.";
    }

    await message.reply({ content: aiReply });
  } catch (err) {
    console.error("Unhandled error in messageCreate:", err);
  }
});

client.once("ready", async () => {
  console.log(`Bot online as ${client.user.tag}`);
  await registerCommands();
});

client.login(TOKEN);
