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
  "Staff must post `/loa status` before going inactive.",
  "Give a clear reason so leadership knows why you are away.",
  "Active LOA means you are not expected on duty until you set status back to inactive.",
  "Do not take LOA to avoid staff work indefinitely — update or return when you can.",
  "Managers and above may still contact you during LOA for urgent issues.",
  "Returning from LOA: run `/loa status` with `inactive` so the roster is accurate.",
  "Only registered staff can set LOA. Use `/staff add` first if you are not listed.",
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
