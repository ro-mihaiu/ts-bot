const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const db = require("./db");
const { STAFF_ROLES, LOA_RULES, EMBED_COLOR, ROLE_RANK } = require("./config");
const { assignStaffRole, removeStaffRole } = require("./discordRoles");

const roleChoices = STAFF_ROLES.map((role) => ({ name: role, value: role }));
const NO_PING = { parse: [] };

function roleSort(a, b) {
  return (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99);
}

function embedReply({ color = EMBED_COLOR, title, description, fields, ephemeral }) {
  const embed = new EmbedBuilder().setColor(color);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields) embed.addFields(fields);
  return { embeds: [embed], allowedMentions: NO_PING, ephemeral };
}
  return (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99);
}

function loaEmbed() {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("LOA Rules")
    .setDescription(LOA_RULES.map((rule, i) => `**${i + 1}.** ${rule}`).join("\n\n"));
}

async function resolveMember(ctx, user) {
  try {
    return await ctx.guild.members.fetch(user.id);
  } catch {
    return null;
  }
}

function wrapInteraction(interaction) {
  return {
    user: interaction.user,
    guild: interaction.guild,
    memberPermissions: interaction.memberPermissions,
    getSubcommand: () => interaction.options.getSubcommand(),
    getString: (name, required = false) => interaction.options.getString(name, required),
    getUser: (name, required = false) => interaction.options.getUser(name, required),
    reply: (options) => interaction.reply(options),
  };
}

async function handleLoa(ctx) {
  const sub = ctx.getSubcommand();

  if (sub === "rules") {
    await ctx.reply({ embeds: [loaEmbed()] });
    return;
  }

  if (sub === "status") {
    const status = ctx.getString("status", true);
    const reason = ctx.getString("reason", true);
    const active = status === "active";
    const existing = db.getStaff(ctx.user.id);

    if (!existing) {
      await ctx.reply({
        content: "You are not in the staff database. Ask a manager to run `/staff add` first.",
        ephemeral: true,
      });
      return;
    }

    db.setLoa(ctx.user.id, active, reason);
    await ctx.reply(
      embedReply({
        color: active ? 0x57f287 : 0xf1c40f,
        title: active ? "Status set to active" : "Status set to inactive",
        description: active
          ? `<@${ctx.user.id}> is **active** and can help.`
          : `<@${ctx.user.id}> is **inactive** (away / on vacation).`,
        fields: { name: "Reason", value: reason },
      }),
    );
    return;
  }

  if (sub === "check") {
    const target = ctx.getUser("user");

    if (target) {
      const row = db.getStaff(target.id);
      if (!row) {
        await ctx.reply(
          embedReply({
            color: 0xed4245,
            title: "Not staff",
            description: `<@${target.id}> is not in the staff database.`,
            ephemeral: true,
          }),
        );
        return;
      }

      const isActive = Boolean(row.loa_active);
      await ctx.reply(
        embedReply({
          color: isActive ? 0x57f287 : 0xf1c40f,
          title: "Staff status",
          description: `<@${row.user_id}> · **${row.role}** · **${isActive ? "Active" : "Inactive"}**`,
          fields: { name: "Reason", value: row.loa_reason || "No reason recorded" },
        }),
      );
      return;
    }

    const staff = db.listStaff().sort(roleSort);
    if (staff.length === 0) {
      await ctx.reply({ content: "No staff are registered yet.", ephemeral: true });
      return;
    }

    const lines = staff.map((row) => {
      const status = row.loa_active ? "Active" : "Inactive";
      const reason = row.loa_reason ? ` — ${row.loa_reason}` : "";
      return `<@${row.user_id}> · **${row.role}** · **${status}**${reason}`;
    });

    await ctx.reply(
      embedReply({
        title: "Staff status",
        description: lines.join("\n").slice(0, 4000),
      }),
    );
  }
}

async function handleStaff(ctx) {
  if (!ctx.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await ctx.reply({
      content: "You need **Manage Roles** to use staff commands.",
      ephemeral: true,
    });
    return;
  }

  const sub = ctx.getSubcommand();
  const user = ctx.getUser("user", true);
  const member = await resolveMember(ctx, user);

  if (sub === "add") {
    const roleName = ctx.getString("role", true);
    db.addStaff(user.id, roleName);

    let extra = "";
    if (member) {
      const result = await assignStaffRole(member, roleName);
      if (result.missing) {
        extra = `\nCould not find a Discord role named \`${roleName}\`. Create it in Server Settings if you want it assigned automatically.`;
      }
    }

    await ctx.reply(
      embedReply({
        color: 0x57f287,
        title: "Staff added",
        description: `<@${user.id}> is now **${roleName}**.${extra}`,
      }),
    );
    return;
  }

  if (sub === "remove") {
    const existing = db.getStaff(user.id);
    if (!existing) {
      await ctx.reply(
        embedReply({
          color: 0xed4245,
          title: "Not staff",
          description: `<@${user.id}> is not in the staff database.`,
          ephemeral: true,
        }),
      );
      return;
    }

    db.removeStaff(user.id);
    if (member) {
      await removeStaffRole(member, existing.role);
    }

    await ctx.reply(
      embedReply({
        color: 0xed4245,
        title: "Staff removed",
        description: `<@${user.id}> was removed from staff (**${existing.role}**).`,
      }),
    );
    return;
  }

  if (sub === "upgrade") {
    const newRole = ctx.getString("new_role", true);
    const existing = db.getStaff(user.id);
    if (!existing) {
      await ctx.reply(
        embedReply({
          color: 0xed4245,
          title: "Not staff",
          description: `<@${user.id}> is not in the staff database. Use \`/staff add\` first.`,
          ephemeral: true,
        }),
      );
      return;
    }

    db.setRole(user.id, newRole);

    let extra = "";
    if (member) {
      await removeStaffRole(member, existing.role);
      const assigned = await assignStaffRole(member, newRole);
      if (assigned.missing) {
        extra = `\nCould not find a Discord role named \`${newRole}\`.`;
      }
    }

    await ctx.reply(
      embedReply({
        title: "Staff role updated",
        description: `<@${user.id}>: **${existing.role}** → **${newRole}**.${extra}`,
      }),
    );
  }
}

async function handleStaffs(ctx) {
  const staff = db.listStaff().sort(roleSort);
  if (staff.length === 0) {
    await ctx.reply({ content: "No staff are registered yet.", ephemeral: true });
    return;
  }

  const grouped = new Map();
  for (const role of STAFF_ROLES) grouped.set(role, []);
  for (const row of staff) {
    if (!grouped.has(row.role)) grouped.set(row.role, []);
    grouped.get(row.role).push(`<@${row.user_id}>`);
  }

  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setTitle("Current staff");
  for (const [role, members] of grouped) {
    if (members.length === 0) continue;
    embed.addFields({ name: role, value: members.join("\n"), inline: false });
  }

  await ctx.reply({
    embeds: [embed],
    allowedMentions: NO_PING,
  });
}

const commandData = [
  new SlashCommandBuilder()
    .setName("loa")
    .setDescription("Leave of absence commands")
    .addSubcommand((sub) => sub.setName("rules").setDescription("Show all LOA rules"))
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Set whether you can help")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("active = can help, inactive = away / on vacation")
            .setRequired(true)
            .addChoices({ name: "active", value: "active" }, { name: "inactive", value: "inactive" }),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Why you are changing LOA").setRequired(true).setMaxLength(500),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check who is active or inactive")
        .addUserOption((option) =>
          option.setName("user").setDescription("Check one staff member (omit to list everyone)").setRequired(false),
        ),
    ),
  new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Manage staff in the database")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a staff member")
        .addUserOption((option) => option.setName("user").setDescription("Member to add").setRequired(true))
        .addStringOption((option) =>
          option
            .setName("role")
            .setDescription("Staff role")
            .setRequired(true)
            .addChoices(...roleChoices),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a staff member")
        .addUserOption((option) => option.setName("user").setDescription("Member to remove").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("upgrade")
        .setDescription("Change a staff member's role")
        .addUserOption((option) => option.setName("user").setDescription("Staff member").setRequired(true))
        .addStringOption((option) =>
          option
            .setName("new_role")
            .setDescription("New staff role")
            .setRequired(true)
            .addChoices(...roleChoices),
        ),
    ),
  new SlashCommandBuilder().setName("staffs").setDescription("Ping and list all current staff"),
];

module.exports = {
  commandData,
  wrapInteraction,
  handleLoa,
  handleStaff,
  handleStaffs,
};
