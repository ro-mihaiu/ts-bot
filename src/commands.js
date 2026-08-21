const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const db = require("./db");
const { STAFF_ROLES, LOA_RULES, EMBED_COLOR, ROLE_RANK } = require("./config");
const { assignStaffRole, removeStaffRole } = require("./discordRoles");

const roleChoices = STAFF_ROLES.map((role) => ({ name: role, value: role }));

function roleSort(a, b) {
  return (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99);
}

function loaEmbed() {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("LOA Rules")
    .setDescription(LOA_RULES.map((rule, i) => `**${i + 1}.** ${rule}`).join("\n\n"));
}

async function resolveMember(interaction, user) {
  try {
    return await interaction.guild.members.fetch(user.id);
  } catch {
    return null;
  }
}

async function handleLoa(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === "rules") {
    await interaction.reply({ embeds: [loaEmbed()] });
    return;
  }

  if (sub === "status") {
    const status = interaction.options.getString("status", true);
    const reason = interaction.options.getString("reason", true);
    const active = status === "active";
    const existing = db.getStaff(interaction.user.id);

    if (!existing) {
      await interaction.reply({
        content: "You are not in the staff database. Ask a manager to run `/staff add` first.",
        ephemeral: true,
      });
      return;
    }

    db.setLoa(interaction.user.id, active, reason);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(active ? 0xf1c40f : 0x57f287)
          .setTitle(active ? "LOA set to active" : "LOA set to inactive")
          .setDescription(`<@${interaction.user.id}> is now **${active ? "on LOA" : "off LOA"}**.`)
          .addFields({ name: "Reason", value: reason }),
      ],
    });
    return;
  }

  if (sub === "check") {
    const target = interaction.options.getUser("user");

    if (target) {
      const row = db.getStaff(target.id);
      if (!row) {
        await interaction.reply({
          content: `<@${target.id}> is not in the staff database.`,
          ephemeral: true,
        });
        return;
      }

      const onLoa = Boolean(row.loa_active);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(onLoa ? 0xf1c40f : 0x57f287)
            .setTitle("Staff LOA status")
            .setDescription(`<@${row.user_id}> · **${row.role}** · LOA: **${onLoa ? "Active" : "Inactive"}**`)
            .addFields({
              name: "Reason",
              value: row.loa_reason || "No reason recorded",
            }),
        ],
      });
      return;
    }

    const staff = db.listStaff().sort(roleSort);
    if (staff.length === 0) {
      await interaction.reply({ content: "No staff are registered yet.", ephemeral: true });
      return;
    }

    const lines = staff.map((row) => {
      const loa = row.loa_active ? "Active" : "Inactive";
      const reason = row.loa_reason ? ` — ${row.loa_reason}` : "";
      return `<@${row.user_id}> · **${row.role}** · LOA: **${loa}**${reason}`;
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLOR)
          .setTitle("Staff LOA status")
          .setDescription(lines.join("\n").slice(0, 4000)),
      ],
    });
  }
}

async function handleStaff(interaction) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply({
      content: "You need **Manage Roles** to use staff commands.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const user = interaction.options.getUser("user", true);
  const member = await resolveMember(interaction, user);

  if (sub === "add") {
    const roleName = interaction.options.getString("role", true);
    db.addStaff(user.id, roleName);

    let extra = "";
    if (member) {
      const result = await assignStaffRole(member, roleName);
      if (result.missing) {
        extra = `\nCould not find a Discord role named \`${roleName}\`. Create it in Server Settings if you want it assigned automatically.`;
      }
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("Staff added")
          .setDescription(`<@${user.id}> is now **${roleName}**.${extra}`),
      ],
    });
    return;
  }

  if (sub === "remove") {
    const existing = db.getStaff(user.id);
    if (!existing) {
      await interaction.reply({ content: `<@${user.id}> is not in the staff database.`, ephemeral: true });
      return;
    }

    db.removeStaff(user.id);
    if (member) {
      await removeStaffRole(member, existing.role);
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("Staff removed")
          .setDescription(`<@${user.id}> was removed from staff (**${existing.role}**).`),
      ],
    });
    return;
  }

  if (sub === "upgrade") {
    const newRole = interaction.options.getString("new_role", true);
    const existing = db.getStaff(user.id);
    if (!existing) {
      await interaction.reply({
        content: `<@${user.id}> is not in the staff database. Use \`/staff add\` first.`,
        ephemeral: true,
      });
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

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLOR)
          .setTitle("Staff role updated")
          .setDescription(`<@${user.id}>: **${existing.role}** → **${newRole}**.${extra}`),
      ],
    });
  }
}

async function handleStaffs(interaction) {
  const staff = db.listStaff().sort(roleSort);
  if (staff.length === 0) {
    await interaction.reply({ content: "No staff are registered yet.", ephemeral: true });
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

  await interaction.reply({
    content: staff.map((row) => `<@${row.user_id}>`).join(" "),
    embeds: [embed],
    allowedMentions: { users: staff.map((row) => row.user_id) },
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
        .setDescription("Set your LOA status")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Active = on LOA, inactive = off LOA")
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
        .setDescription("Check staff LOA statuses")
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
  handleLoa,
  handleStaff,
  handleStaffs,
};
