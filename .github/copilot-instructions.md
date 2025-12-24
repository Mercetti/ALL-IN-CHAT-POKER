Purpose
-------
This file gives concise, repository-specific guidance to AI coding agents so they can be immediately productive working on the All-In Chat Poker codebase.

**Quick Start**
- **Run (production):** `npm start` — runs the Node server entry (root [server.js](server.js)).
- **Dev:** `npm run dev` — note: script is `NODE_ENV=development node server.js` which is POSIX-style. On Windows use `set NODE_ENV=development&& node server.js` or add `cross-env` for cross-platform parity. `nodemon` is available for hot reload.
- **Tests:** `npm test` — runs `node --test` (tests located in [test/]).
- **Desktop (Electron):** `npm run desktop` — runs [electron/main.js]; packing: `npm run desktop:pack`.

**Big-picture architecture**
- **Entry & server:** root [server.js](server.js) is the declared `main` entry; most server code lives in the [server/](server) directory.
- **Frontend / overlays:** static client code and overlay HTML/JS are in [public/]. Overlays communicate with the server via Socket.IO (look for `socket.io` usage).
- **Game logic:** core rules and evaluation are in [server/game.js]; variant-specific logic lives in [server/modes/](server/modes) (e.g., `poker.js`, `blackjack.js`).
- **State & persistence:** ephemeral state lives in [server/channel-state.js]; the adapter layer is [server/state-adapter.js]; DB connections are in [server/db.js]; payouts are handled by [server/payout-store.js] and [server/payout-utils.js].
- **Bots & integrations:** Twitch/Discord bots are under [bot/] (see `bot.js`, `bot.cleaned.js`). OAuth/token helpers are in [scripts/get-twitch-token.js].

**Project-specific conventions**
- **Module style:** CommonJS (`"type": "commonjs"` in [package.json](package.json)).
- **Node version:** targets Node >= 18 (see [package.json](package.json)).
- **Synchronous DB patterns:** `better-sqlite3` is used (synchronous API) alongside `pg`. Avoid converting sync DB operations to async without careful coordination.
- **Socket event coupling:** client and server share event names across [public/*] and [server/*]; renaming events requires patching both client and server.
- **Payout & money logic:** `server/payout-store.js` and `server/payout-utils.js` are sensitive — treat as high-risk when modifying.

**Developer workflows & gotchas**
- **Cross-platform dev script:** `npm run dev` may fail on Windows as-is; prefer using `cross-env` or the Windows `set` syntax.
- **Running tests:** `npm test` uses Node's test runner; tests are minimal and located in [test/]; run them locally after changes to server modules.
- **Local overlay verification:** after `npm start`, open files under [public/] (e.g., `overlay.html`, `obs-overlay.html`) in a browser pointing at the local server to validate client–server interactions.

**Integration points to watch**
- **Socket.IO:** server emits & client listeners across [public/client.js], [public/overlay.js], and server modules — search for `socket.on` / `io.emit` to map interactions.
- **Database & payouts:** [server/db.js], [server/payout-store.js], [server/payout-utils.js], and `postgres-payouts.sql` are linked; DB schema or migration changes need ops coordination.
- **External services:** Twitch and Discord integration via `tmi.js` and `discord.js` in [bot/]; token management in `scripts/`.

**When not to auto-change**
- Do not rename socket event names or change DB adapter APIs without updating all callers.
- Do not modify payout calculation or state-adapter logic without tests and owner review.

**Quick file pointers (examples)**
- Game rules and evaluator: [server/game.js](server/game.js)
- State flow start: [server/channel-state.js](server/channel-state.js) → [server/state-adapter.js](server/state-adapter.js)
- Overlay client hooks: [public/overlay.js](public/overlay.js) and [public/obs-overlay.js](public/obs-overlay.js)
- Bots: [bot/bot.js](bot/bot.js) and [bot/bot.cleaned.js](bot/bot.cleaned.js)

If anything above is unclear or you want more detail on a specific area (DB, sockets, or packaging the Electron app), say which part and I will expand or adjust this guidance.
