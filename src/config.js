const STAFF_ROLES = [
  "TheySix",
  "Manager",
  "Admin",
  "Head Moderator",
  "Moderator",
  "Helper Team",
];

const ROLE_RANK = Object.fromEntries(STAFF_ROLES.map((role, index) => [role, index]));

const LOA_RULES = [
  "Set `/loa status` to **inactive** when you cannot staff (vacation, busy, away).",
  "Give a clear reason so leadership knows why you are unavailable.",
  "**Inactive** means you are not expected on duty until you set status back to **active**.",
  "Do not stay inactive indefinitely — update or return when you can.",
  "Managers and above may still contact you while you are inactive for urgent issues.",
  "When you can help again, run `/loa status` with **active** so the roster is accurate.",
  "Only registered staff can set status. Use `/staff add` first if you are not listed.",
];

const EMBED_COLOR = 0x5865f2;

const PREFIXES = ["!", "th"];

module.exports = {
  STAFF_ROLES,
  ROLE_RANK,
  LOA_RULES,
  EMBED_COLOR,
  PREFIXES,
};
