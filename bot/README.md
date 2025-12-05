# Troubleshooting Bot

Minimal Twitch chat bot that can also hit admin endpoints with the admin bearer token.

## Prereqs
- Node 18+
- Env vars:
  - `BOT_USERNAME` (or `TWITCH_BOT_USERNAME`)
  - `BOT_OAUTH_TOKEN` (or `TWITCH_OAUTH_TOKEN`) e.g., `oauth:xxxx`
  - `TARGET_CHANNELS` (comma separated, no `#`)
  - `ADMIN_TOKEN` (for admin HTTP calls)
  - `BACKEND_URL` (default `https://all-in-chat-poker.fly.dev`)

## Run
```bash
BOT_USERNAME=allinchatpokerbot \
BOT_OAUTH_TOKEN=oauth:... \
TARGET_CHANNELS=mercetti \
ADMIN_TOKEN=Hype420!Hype \
node bot/bot.js
```

Commands in chat:
- `!ping` -> replies `pong`
- `!status` -> calls `/health` with admin token and reports OK/failed
- `!start` -> opens betting window (admin token required)
- `!startnow` -> starts round immediately (admin token required)
- `!mode poker|blackjack` -> sets game mode (admin token required)
- `!rules [poker|blackjack]` -> quick rules summary
- `!commands` -> list bot commands
- `!leaderboard` -> shows top players (public endpoint)
