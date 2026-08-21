# ts-bot

Discord staff + LOA bot (Node.js / discord.js).

## Commands

| Command | What it does |
| --- | --- |
| `/loa rules` | Shows LOA rules |
| `/loa status` `status` `reason` | Sets **your** LOA (must already be staff) |
| `/loa check` `[user]` | Lists every staff member and LOA, or one person if `user` is set |
| `/staffs` | Embed of staff by role, and pings them |
| `/staff add` `user` `role` | Adds staff to the DB and assigns the Discord role if it exists |
| `/staff remove` `user` | Removes staff from the DB and the Discord role |
| `/staff upgrade` `user` `new_role` | Swaps the old Discord role for the new one |

Staff role presets: TheySix, Manager, Admin, Head Moderator, Moderator, Helper Team.

`/staff` commands require **Manage Roles**. The bot’s role must sit **above** the staff roles it assigns.

## Setup

1. Create a Discord application + bot at https://discord.com/developers/applications
2. Enable **Server Members Intent**
3. Invite the bot with `bot` + `applications.commands`, and permissions: Send Messages, Embed Links, Mention Everyone (or use user pings), Manage Roles
4. Copy `.env.example` to `.env` and fill in token, application ID, and guild ID
5. Create Discord roles whose **names match the presets exactly**
6. Install and register commands:

```bash
npm install
npm run deploy
npm start
```

Edit LOA text in `src/config.js`. Staff data is stored in `data/staff.json`.
