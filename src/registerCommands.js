const { REST, Routes } = require("discord.js");
const { commandData } = require("./commands");

async function registerCommands(client) {
  const body = commandData.map((command) => command.toJSON());
  const rest = new REST({ version: "10" }).setToken(client.token);
  const appId = client.application.id;
  const guilds = [...client.guilds.cache.keys()];

  if (guilds.length === 0) {
    await rest.put(Routes.applicationCommands(appId), { body });
    console.log(`Registered ${body.length} global slash commands (may take up to an hour).`);
    return;
  }

  for (const guildId of guilds) {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
    console.log(`Registered ${body.length} slash commands in guild ${guildId}`);
  }
}

module.exports = { registerCommands };
