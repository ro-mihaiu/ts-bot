require("dotenv").config();
const { Client, GatewayIntentBits, Events, Partials } = require("discord.js");
const { wrapInteraction, handleLoa, handleStaff, handleStaffs } = require("./commands");
const { handlePrefixMessage } = require("./prefix");
const { registerCommands } = require("./registerCommands");

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Set DISCORD_TOKEN in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  try {
    await registerCommands(readyClient);
  } catch (error) {
    console.error("Failed to register slash commands:", error);
  }
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    await registerCommands(client);
    console.log(`Joined ${guild.name}; slash commands refreshed.`);
  } catch (error) {
    console.error("Failed to register slash commands for new guild:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.inGuild()) {
    await interaction.reply({ content: "These commands only work in a server.", ephemeral: true });
    return;
  }

  const ctx = wrapInteraction(interaction);
  try {
    if (interaction.commandName === "loa") {
      await handleLoa(ctx);
      return;
    }
    if (interaction.commandName === "staff") {
      await handleStaff(ctx);
      return;
    }
    if (interaction.commandName === "staffs") {
      await handleStaffs(ctx);
    }
  } catch (error) {
    console.error(error);
    const message = "Something went wrong running that command.";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    await handlePrefixMessage(message);
  } catch (error) {
    console.error(error);
  }
});

client.login(token);
