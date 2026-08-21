require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { registerCommands } = require("./registerCommands");

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Set DISCORD_TOKEN in .env");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  try {
    await registerCommands(client);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    client.destroy();
  }
});

client.login(token);
