const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "staff.json");

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return migrate(data);
  } catch {
    return { schemaVersion: 2, staff: {} };
  }
}

function migrate(data) {
  if (!data.staff) data.staff = {};
  if ((data.schemaVersion ?? 1) >= 2) return data;

  // v1: loa_active true meant "on leave". v2: loa_active true means available to help.
  for (const row of Object.values(data.staff)) {
    row.loa_active = !row.loa_active;
  }
  data.schemaVersion = 2;
  save(data);
  return data;
}

function save(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function addStaff(userId, role) {
  const data = load();
  const existing = data.staff[userId];
  data.staff[userId] = {
    user_id: userId,
    role,
    loa_active: existing?.loa_active ?? true,
    loa_reason: existing?.loa_reason ?? null,
    loa_updated_at: existing?.loa_updated_at ?? null,
  };
  save(data);
}

function removeStaff(userId) {
  const data = load();
  if (!data.staff[userId]) return false;
  delete data.staff[userId];
  save(data);
  return true;
}

function getStaff(userId) {
  return load().staff[userId] ?? null;
}

function setRole(userId, role) {
  const data = load();
  if (!data.staff[userId]) return false;
  data.staff[userId].role = role;
  save(data);
  return true;
}

function setLoa(userId, active, reason) {
  const data = load();
  if (!data.staff[userId]) return false;
  data.staff[userId].loa_active = Boolean(active);
  data.staff[userId].loa_reason = reason;
  data.staff[userId].loa_updated_at = new Date().toISOString();
  save(data);
  return true;
}

function listStaff() {
  return Object.values(load().staff);
}

module.exports = {
  addStaff,
  removeStaff,
  getStaff,
  setRole,
  setLoa,
  listStaff,
};
