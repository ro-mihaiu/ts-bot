async function findGuildRole(guild, roleName) {
  const cached = guild.roles.cache.find((role) => role.name === roleName);
  if (cached) return cached;

  const roles = await guild.roles.fetch();
  return roles.find((role) => role.name === roleName) ?? null;
}

async function assignStaffRole(member, roleName) {
  const role = await findGuildRole(member.guild, roleName);
  if (!role) return { ok: false, missing: true };
  await member.roles.add(role);
  return { ok: true, role };
}

async function removeStaffRole(member, roleName) {
  const role = await findGuildRole(member.guild, roleName);
  if (!role) return { ok: false, missing: true };
  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role);
  }
  return { ok: true, role };
}

module.exports = {
  findGuildRole,
  assignStaffRole,
  removeStaffRole,
};
