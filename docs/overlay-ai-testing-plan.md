# Overlay & AI Testing Plan

## Goals
- Validate the live overlay experience end-to-end (socket connection, state updates, cosmetics, and sync APIs).
- Exercise AI-powered endpoints (branding proposals, overlay diagnosis) to catch regressions before rollout.
- Provide a repeatable checklist that can be run manually today and automated later.

## Preconditions
1. **Environment**: https://all-in-chat-poker.fly.dev (production) and local dev server.
2. **Accounts**: Twitch-linked admin/dev account (e.g., `mercetti`) plus a regular player login for sanity checks.
3. **Tools**:
   - Browser with OBS-like browser source (Chrome or OBS 29+).
   - Access to `/admin-enhanced.html` and `/admin-dev-enhanced.html`.
   - Postman or curl for direct API hits when needed.

## Test Matrix
| Area | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| Overlay load | Vanilla overlay load with channel param | Open `/obs-overlay.html?channel=<login>` in browser/OBS | Overlay connects, shows waiting state, no console errors |
| Socket reconnection | Simulate network drop | Toggle browser offline/online or kill local backend | Overlay reconnects within retry window, no stale state |
| Player join | Chat join sequence | Use admin tools to start blackjack round, add bots/players | Overlay seats players, updates timers & pot |
| Loadout fetch | `/overlay/loadout` response | Trigger via overlay load; monitor network tab | Cosmetics applied, fallback assets used when missing |
| Overlay sync | POST `/overlay/sync` | From overlay editor enable sync and change cosmetics | Overlay updates card backs/rings live |
| FX playback | Deal/win effects | Force wins via admin controls or mock state | Animations play without frame glitches |
| AI branding apply | Submit proposal | Use `/admin/premier/proposal` UI/API, then approve | Overlay receives `overlaySettings` event, applies colors/logos |
| Overlay diagnosis | `/admin/overlay-diagnose` | Call endpoint for active channel | Response contains snapshot summary, no server errors |

## Detailed Test Steps
1. **Overlay Smoke Test**
   - Clear localStorage/sessionStorage to mimic first-time load.
   - Load overlay URL with and without `channel` to ensure default channel fallback works.
   - Verify assets (card backs, chips, avatars) resolve (watch for 404/SSL errors).

2. **Loadout & Sync**
   - Run through overlay editor: equip new card back and avatar ring, enable sync.
   - Confirm POST `/overlay/sync` returns 200 and overlay receives websocket update.
   - Disable sync toggle, ensure equip stays local only.

3. **AI Branding Flow**
   - From admin-dev dashboard, generate a branding proposal (or call `/admin/premier/proposal`).
   - Approve proposal for a test channel.
   - Observe overlay applying tint/texture; verify `/admin/overlay-snapshot` now reflects branding proposal data.

4. **Diagnostics**
   - Call `/admin/overlay-diagnose` and ensure it returns summary text.
   - Review server logs for errors/warnings related to overlay diagnosis or AI calls.

5. **Regression Checks**
   - Run blackjack round start/stop from admin enhanced UI to ensure overlay state resets between rounds.
   - Validate `/overlay/loadout` handles empty inventory (simulate new user) without crashing overlay.
   - Confirm fallback avatar logic (recent fix) prevents repeated 404s when assets are missing.

## Automation Notes
- Future automation can leverage Playwright to load overlay/editor pages, mock socket events, and screenshot states.
- API tests can be scripted with Postman collections or k6 hitting `/overlay/loadout`, `/overlay/sync`, `/admin/overlay-diagnose`, etc.

## Reporting
- Capture console logs + network HAR for each run (especially OBS overlay load).
- File issues with channel ID, timestamp, and relevant response payloads.
- Keep this plan updated as modules split (post modularization, add unit tests per module).
