const { PREFIXES, STAFF_ROLES } = require("./config");
const { handleLoa, handleStaff, handleStaffs } = require("./commands");

function stripPrefix(content) {
  const text = content.trim();
  if (text.startsWith("!")) return text.slice(1).trim();

  const lower = text.toLowerCase();
  for (const prefix of PREFIXES) {
    if (prefix === "!") continue;
    if (lower === prefix) return "";
    if (lower.startsWith(`${prefix} `)) return text.slice(prefix.length).trim();
  }
  return null;
}

function parseRole(text) {
  const normalized = text.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return STAFF_ROLES.find((role) => role.toLowerCase() === normalized) ?? null;
}

async function resolveUser(message, token) {
  if (!token) return null;
  const mention = token.match(/^<@!?(\d+)>$/);
  const id = mention?.[1] ?? (/^\d{17,20}$/.test(token) ? token : null);
  if (!id) return null;
  try {
    return await message.client.users.fetch(id);
  } catch {
    return null;
  }
}

function wrapMessage(message, { subcommand, strings, users }) {
  return {
    user: message.author,
    guild: message.guild,
    memberPermissions: message.member?.permissions,
    getSubcommand: () => subcommand,
    getString: (name) => strings[name] ?? null,
    getUser: (name) => users[name] ?? null,
    reply: (options) => {
      if (typeof options === "string") return message.reply({ content: options });
      const { ephemeral: _ephemeral, ...payload } = options;
      return message.reply(payload);
    },
  };
}

async function handlePrefixMessage(message) {
  if (message.author.bot || !message.guild) return false;

  const rest = stripPrefix(message.content);
  if (rest == null || rest === "") return false;

  const [command, ...args] = rest.split(/\s+/);
  const name = command.toLowerCase();

  try {
    if (name === "loa") {
      const sub = (args.shift() || "").toLowerCase();
      if (!["rules", "status", "check"].includes(sub)) {
        await message.reply("Use `loa rules`, `loa status`, or `loa check`.");
        return true;
      }

      const strings = {};
      const users = {};

      if (sub === "status") {
        const status = (args.shift() || "").toLowerCase();
        const reason = args.join(" ").trim();
        if (!["active", "inactive"].includes(status) || !reason) {
          await message.reply("Usage: `loa status <active|inactive> <reason>`");
          return true;
        }
        strings.status = status;
        strings.reason = reason;
      }

      if (sub === "check" && args[0]) {
        const user = await resolveUser(message, args[0]);
        if (!user) {
          await message.reply("Mention a staff member or paste their user ID.");
          return true;
        }
        users.user = user;
      }

      await handleLoa(wrapMessage(message, { subcommand: sub, strings, users }));
      return true;
    }

    if (name === "staffs") {
      await handleStaffs(wrapMessage(message, { subcommand: null, strings: {}, users: {} }));
      return true;
    }

    if (name === "staff") {
      const sub = (args.shift() || "").toLowerCase();
      if (!["add", "remove", "upgrade"].includes(sub)) {
        await message.reply("Use `staff add`, `staff remove`, or `staff upgrade`.");
        return true;
      }

      const user = await resolveUser(message, args.shift());
      if (!user) {
        await message.reply("Usage: `staff <add|remove|upgrade> @user ...`");
        return true;
      }

      const strings = {};
      if (sub === "add") {
        const role = parseRole(args.join(" "));
        if (!role) {
          await message.reply(`Usage: \`staff add @user <role>\`\nRoles: ${STAFF_ROLES.join(", ")}`);
          return true;
        }
        strings.role = role;
      }

      if (sub === "upgrade") {
        const role = parseRole(args.join(" "));
        if (!role) {
          await message.reply(`Usage: \`staff upgrade @user <new role>\`\nRoles: ${STAFF_ROLES.join(", ")}`);
          return true;
        }
        strings.new_role = role;
      }

      await handleStaff(wrapMessage(message, { subcommand: sub, strings, users: { user } }));
      return true;
    }
  } catch (error) {
    console.error(error);
    await message.reply("Something went wrong running that command.");
    return true;
  }

  return false;
}

module.exports = {
  handlePrefixMessage,
};
