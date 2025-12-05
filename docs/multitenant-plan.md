# Multi-tenant refactor plan (channel-scoped tables)

Goal: run many simultaneous streamer tables in one deployment with pooled bot workers.

## Core principles
- Every request/socket/bot message must carry a `channel` identifier (normalized Twitch channel name).
- All mutable game state is keyed by `channel` (no singletons like `betAmounts`, `waitingQueue`, etc.).
- Storage (DB) persists per-channel data so restarts don’t mix tables.
- Bots join only the channels they’re assigned and forward chat events with `channel` attached.

## Incremental rollout (recommended)
1) **State container + helpers**
   - Introduce `getChannelState(channel)` that returns/create a state object:
     ```js
     { mode, roundInProgress, bettingOpen, betAmounts, waitingQueue, playerStates, dealerState, communityCards, timers, currentDeck, currentHand, pokerStreetBets, pokerPot, pokerCurrentBet, pokerActed, playerTurnOrder, playerTurnIndex, heuristics }
     ```
   - Replace globals with this container throughout game logic.
   - Add `resetChannelState(channel)` for fresh tables and cleanup on idle.

2) **Channel detection**
   - For sockets: require `handshake.auth.channel` (fallback to configured default for backwards compatibility).
   - For HTTP: accept `channel` query/header and default to configured channel.
   - For bots: carry `channel` in chat events; tmi client joins multiple channels.

3) **DB and config**
   - Persist balances/stats keyed by `channel` + `login`.
   - Public config exposes default channel but allows dynamic channels.
   - Allow admin token + channel override (e.g., `?channel=foo`).

4) **Bots**
   - Maintain set of assigned channels in DB (already partially present with `/bot/channels`).
   - Each chat message forwarded as `{ channel, user, message }`.
   - On login, add streamer’s channel to bot’s set.

5) **Admin + overlay**
   - Admin dashboard: select/enter channel; sockets use that channel.
   - Overlay: accept `?channel=` param (or default) and connect with that channel.
   - Quickstart: show overlay/admin URLs with `?channel=` example.

6) **Cleanup + limits**
   - TTL unused channel states, cap max live channels, and guard against unbounded joins.

## Risk and testing
- Large surface: all game handlers need channel plumbing.
- Stage behind a feature flag; verify poker/blackjack flows per-channel.
- Add integration tests for two channels concurrently (bets, rounds, payouts).

## Proposed sequence for implementation
1) Add channel state container and migrate game logic to use it.
2) Require/propagate `channel` on sockets and HTTP (with backwards-compatible default).
3) Update bot to include channel on events and join multiple channels.
4) Update admin/overlay clients to pass channel param and select channel.
5) Persist balances/stats per channel; migrate existing data into default channel bucket.
