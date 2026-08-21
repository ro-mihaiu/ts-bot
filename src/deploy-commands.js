require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commandData } = require("./commands");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error("Set DISCORD_TOKEN and CLIENT_ID in .env");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);
const body = commandData.map((command) => command.toJSON());

async function main() {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    console.log(`Registered ${body.length} guild commands.`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(`Registered ${body.length} global commands (can take up to an hour).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
