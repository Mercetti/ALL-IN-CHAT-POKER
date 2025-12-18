# Alpha TODO: All-In Chat Poker

## Payments
- Keep purchase flow disabled for users; retain admin/dev stub only.
- Prep flags for future Stripe/PayPal enablement; no live keys yet.

## Cosmetics
- Verify DB seed for `cosmetics`, `user_cosmetics`, `purchases`.
- Add real table skin texture asset(s) and link to catalog.
- Build Profile “Customize” tab with richer previews (owned/locked, equip, buy disabled).
- Optional: admin “refresh cosmetics” button for QA.

## Overlay
- Confirm table tint/texture/logo apply from cosmetics.
- Confirm poker actions hidden in single-channel overlays; visible in lobby- channels.
- Smoke test dealing/flip/chip animations.

## Admin/Help
- Add an alpha test checklist section in admin dashboard.
- Ensure rules links visible (Blackjack, Poker, Hold’em).

## Manual test plan
- Auth/role: streamer/admin/user access; admin endpoints blocked to users.
- Lobby: create/join lobby; poker hidden outside lobby; poker visible in lobby.
- Gameplay (BJ): start/end round; hit/stand/double/split/insurance; payouts/balances; pot display.
- Overlay: cosmetics (card-back tint, avatar ring, profile border, table skin) render; sounds/animations.
- Cosmetics API: grant/equip flows update inventory; catalog loads.
- Marketplace/Profile: pages load; buy remains “coming soon”; support mailto works.
- Deployment: `flyctl deploy --config fly.toml --no-cache` after local smoke.

## Post-alpha: Twitch perks (cosmetic only)
- Streamer-only cosmetics: tables, decks, borders, badges (e.g., Partner/Streamer skins).
- Sub/VIP/Mod unlocks: automatic avatar borders/table colors/badges based on Twitch roles.
- Chat-activated effects: emote explosions, hype mode on raids, all-in alert visuals.
- Channel points: redeem to trigger cosmetic effects or temporary table/deck swaps (no gameplay impact).
- Raid/sub-train rewards: temporary celebration skins, glow effects, dealer animation.
- Drops/watch time: time-based free cosmetics (card backs, borders, table skins).
- Streamer profile cosmetics: broadcaster badge, animated border/aura, creator-only skin.
