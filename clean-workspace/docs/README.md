# 🎰 Video Poker Overlay for Twitch

![All-In Chat Poker logo](public/logo.png)

A professional, feature-rich video poker game overlay system for Twitch streamers. Built with Node.js, Express, Socket.IO, and SQLite.

## Features

✨ **Game Features**
- Playable video poker with 5-card draw
- Real-time hand evaluation with multiple hand types
- Leaderboards with persistent player stats
- Per-user balance and chip system
- Configurable game settings

🔐 **Security & Admin**
- JWT-based admin authentication with rate-limiting
- Ephemeral tokens for secure overlay communication
- Exponential backoff protection against brute force
- Admin dashboard with full player management
- Comprehensive audit logging

📊 **Stats & Profiles**
- Per-user profiles with game settings
- Persistent statistics (rounds played, wins, total winnings, biggest hand)
- Leaderboard tracking top players
- SQLite database for reliable data persistence
- Admin profile editing and player management

🎨 **Modern UI**
- Professional, responsive design system
- Dark theme optimized for streaming
- Toast notifications for user feedback
- Overlay-ready layout for OBS integration
- Admin dashboard with comprehensive controls
- Mobile-friendly profile editor

🔄 **Twitch Integration**
- Optional Twitch chat bot integration
- OAuth 2.0 support for user authentication
- Automatic chat command parsing

### Starting a Game Round
1. Click "Start Round" in the admin dashboard
2. Cards will be dealt to all connected players
3. Players select which cards to hold
4. Click "Process Draw" to evaluate hands
5. Winners are announced and payouts credited

### Player Commands
Players can use chat commands to interact:
- `!bet <amount>` - Place a bet
- `!call` - Match current bet
- `!raise <amount>` - Raise the bet
- `!fold` - Exit current round
- `!hit` / `!stand` (Blackjack) - Take a card or hold

### Blackjack Rules (When Enabled)
- Objective: beat the dealer by getting closer to 21 without going over.
- Card values: 2–10 face value; J/Q/K = 10; Ace = 1 or 11 (whichever helps the hand).
- Dealer hits until at least 17. Players who time out auto-hit until 17+.

### Poker Flow (5-Card Draw / Overlay)
- Deal hole cards (private) to each player.
- Pre-flop betting round starts (left of dealer).
- Flop: deal 3 community cards face up.
- Betting round.
- Turn: deal 4th community card face up.
- Betting round.
- River: deal 5th community card face up.
- Final betting round, then showdown: best 5-card hand using hole + community wins. If all others fold, remaining player wins.

### Poker Betting Actions
- **Check**: Pass action without betting (only if no bet yet this round).
- **Bet**: Place the first wager in the round.
- **Call**: Match the current bet to stay in.
- **Raise**: Increase the current bet; others must match to stay.
- **Fold**: Give up your hand and the pot for this round.

### Poker Hand Rankings (High to Low)
1. Royal Flush (A-K-Q-J-10 same suit)
2. Straight Flush (5 in sequence, same suit)
3. Four of a Kind
4. Full House (3 of a kind + pair)
5. Flush (5 same suit)
6. Straight (5 in sequence, any suits)
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

## TODO / Next Steps
- [x] Branding polish: use the All-In Chat Poker logo as favicon and header art across overlay/login/profile/admin.
- [x] Enforce Twitch OAuth for player auth (remove the `x-user-login` fallback) and carry tokens through sockets.
- [ ] Add per-player action timers (auto-fold/check in poker, auto-stand in blackjack) plus automatic phase advance.
- [x] Surface queue state, phase chips, and visible betting/action countdowns in the overlay and admin UI.
- [x] Expand blackjack actions (split, double, surrender, insurance) with correct payout handling.
- [ ] Add explicit split-hand controls (prev/next) with per-hand timers and state.
- [ ] Improve insurance UX (pre-fill max allowed, only show when dealer upcard is Ace).
- [ ] Implement poker call/raise/check/fold state machine per street (flop/turn/river) instead of pre-round only bets.
- [ ] Show detailed payouts/leaderboard deltas in overlay/admin after settlements.
- [ ] Fix poker timeouts marking acted (auto-fold/check should count as acted) and seed acted set on street start.
- [ ] Polish admin payout styling with delta badges/colors.

## Database Schema

### Tables
- **balances** - Player chip balances
- **stats** - Per-player game statistics
- **leaderboard** - Historical hand evaluations
- **tokens** - Ephemeral auth tokens
- **unblock_audit** - Admin unblock actions
- **profiles** - User profiles and settings

## API Endpoints

### Public
- `GET /` - Main overlay page
- `GET /health` - Server health status
- `GET /leaderboard.json` - Top 10 players

### Authentication
- `POST /admin/login` - Admin login (rate-limited)
- `POST /admin/logout` - Admin logout
- `POST /admin/token` - Create ephemeral token

### Admin Only
- `GET /balances.json` - All player balances
- `GET /stats.json` - All player statistics
- `GET /export` - Export all data
- `POST /admin/unblock` - Unblock player/IP
- `GET /admin/profiles` - List all profiles
- `GET /admin/profile/:login` - Get profile
- `POST /admin/profile/:login` - Update profile
- `GET /admin/audit` - Get audit log
- `DELETE /admin/audit/:id` - Delete audit entry

### User
- `GET /profile` - Get current user profile
- `POST /profile` - Save user profile

## Socket.IO Events

### Server Emits
- `state` - Current game state
- `profile` - User profile data
- `roundStarted` - New round started with dealt cards
- `bettingStarted` - Betting phase active
- `roundResult` - Round results and hand evaluation
- `payouts` - Payout information

### Client Emits
- `startRound` - Request to start new round
- `forceDraw` - Process draw/replacement cards

## Performance

- **Single Instance**: ~50-100 concurrent connections
- **With Redis**: Scale to thousands of concurrent connections
- **Database**: SQLite is file-based, suitable for small-to-medium deployments
- For high load, migrate to PostgreSQL and use connection pooling

## Support & Contributing

For issues or feature requests, please create an issue or PR.

## Operational Notes

### PM2 Hardening
- PM2 now runs with interactive features disabled (`PM2_DISABLE_INTERACTION`, `PM2_NO_INTERACTION`, `PM2_NO_PM2_UPDATE_NOTIFICATION`) so it never opens remote dashboards or prompts in production.
- Keep PM2 bound to `localhost`/Fly's internal network only. Do **not** expose the PM2 HTTP API or dashboard publicly; the web app and AI Control Center already talk to the server through Express/Socket.IO.
- If you must inspect PM2 remotely, tunnel through SSH/Fly WireGuard rather than opening ports.

### Security Monitoring
- Run `npm audit` (or `npm run security:audit`) regularly or in CI to detect when PM2 publishes a patched version. The remaining advisory is low severity, so upgrade as soon as a fixed build is available.
- Keep Fly.io logs (`fly logs -a all-in-chat-poker`) open during deploys to ensure no unexpected PM2 output appears.

### Acey Development Workflow
1. Run `npm run acey:dev` before starting work. This launches the backend (`npm run dev`) and Jest in watch mode simultaneously so test results update as files change.
2. Fix any failures the watch window reports before committing. Husky will still run `npm test` on each commit as a safety net.
3. For one-off checks, run `npm test` or the individual scripts (`npm run test:db`, `npm run test:ai`, etc.).
4. Keep `npm run security:audit` in CI/pull requests so dependency advisories are caught early.

## License

MIT

## Acknowledgments

Built with:
- [Express](https://expressjs.com/) - Web framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [tmi.js](https://github.com/tmijs/tmi.js) - Twitch chat client
- [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) - SQLite wrapper

---

**Happy streaming! 🎮**

