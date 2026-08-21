require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { handleLoa, handleStaff, handleStaffs } = require("./commands");

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Set DISCORD_TOKEN in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.inGuild()) {
    await interaction.reply({ content: "These commands only work in a server.", ephemeral: true });
    return;
  }

  try {
    if (interaction.commandName === "loa") {
      await handleLoa(interaction);
      return;
    }
    if (interaction.commandName === "staff") {
      await handleStaff(interaction);
      return;
    }
    if (interaction.commandName === "staffs") {
      await handleStaffs(interaction);
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

client.login(token);
