# ts-bot

Discord staff + LOA bot (Node.js / discord.js).

## Commands

| Command | What it does |
| --- | --- |
| `/loa rules` | Shows LOA rules |
| `/loa status` `status` `reason` | Sets **your** status: **active** = can help, **inactive** = away / vacation |
| `/loa check` `[user]` | Lists every staff member and LOA, or one person if `user` is set |
| `/staffs` | Embed of staff by role, and pings them |
| `/staff add` `user` `role` | Adds staff to the DB and assigns the Discord role if it exists |
| `/staff remove` `user` | Removes staff from the DB and the Discord role |
| `/staff upgrade` `user` `new_role` | Swaps the old Discord role for the new one |

Same commands also work with prefixes **`!`** and **`th`**:

```
!loa rules
th loa status inactive family trip
!loa check @user
th staffs
!staff add @user Moderator
th staff upgrade @user Head Moderator
```

Staff role presets: TheySix, Manager, Admin, Head Moderator, Moderator, Helper Team.

`/staff` commands require **Manage Roles**. The bot’s role must sit **above** the staff roles it assigns.

## Setup

1. Create a Discord application + bot at https://discord.com/developers/applications
2. Enable **Server Members Intent** and **Message Content Intent** (needed for `!` / `th` prefix commands)
3. Invite the bot with **both** `bot` and `applications.commands` scopes (if you invited with only `bot`, slash commands will never show — kick and re-invite)
4. Copy `.env.example` to `.env` and set `DISCORD_TOKEN`
5. Create Discord roles whose **names match the presets exactly**
6. Start the bot (`npm start`). Slash commands register automatically on login.

On bot-hosting, keep the startup file as `index.js`. Upload the project, set `DISCORD_TOKEN`, restart, and check the console for `Registered 3 slash commands`. Then type `/` in Discord; you should see the bot’s icon next to `/loa`, `/staff`, and `/staffs`.

Edit LOA text in `src/config.js`. Staff data is stored in `data/staff.json`.
