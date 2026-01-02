# Overlay JS Modularization Plan

## Goals
1. Split the monolithic `public/overlay.js` (≈1.9k LOC) into smaller focused modules to improve readability, testing, and future feature work.
2. Preserve existing functionality (socket handling, loadouts, rendering, FX) while introducing a structure that allows incremental refactors.
3. Maintain compatibility with current build/deployment (no bundler required yet, so use ES modules loaded via `<script type="module">`).

## Proposed Module Structure
| Module | Responsibility | Key Exports |
| --- | --- | --- |
| `overlay-config.js` | Shared constants and helpers (URLs, chip definitions, tuning defaults, `getChannelParam`, etc.). | `OVERLAY_CONSTANTS`, helper functions |
| `overlay-connection.js` | Socket.IO setup, reconnection logic, incoming event routing, command dispatch. | `createOverlayConnection(opts)` returning `{ socket, subscribe(event, cb), emit(...) }` |
| `overlay-state.js` | Centralized state store (players, dealer hand, overlay tuning, timers). Could expose a simple event emitter for state changes. | `overlayState`, `updateState(partial)`, `onStateChange(cb)` |
| `overlay-render.js` | DOM updates for players/pot/cards, countdown timers, user badges. Consumes `overlayState` and uses requestAnimationFrame where needed. | `initRenderer(state)`, `render()` |
| `overlay-effects.js` | Loading and applying sprite sheets, card flips, chip stacks, FX previews. | `initEffects()`, `playEffect(type, payload)` |
| `overlay-loadout.js` | Fetching `/overlay/loadout`, mapping catalog items to tuning + FX, applying to state. | `loadOverlayLoadout(channel, state)` |
| `overlay-sync.js` | Handles `/overlay/sync` payloads, saving FX/cosmetics locally, responding to external sync events. | `syncOverlay(payload)` |
| `overlay-main.js` | Entry point that wires the modules: loads config, initializes state, kicks off connection + render loops. | Self-executing module imported by HTML |

_Initial focus_: config, connection, and rendering modules (3 files) to keep first PR manageable. Subsequent passes can peel off effects/sync logic.

## Refactor Stages
1. **Stage 1 – Scaffolding**
   - Create `public/js/overlay/` directory (or similar) for modular files.
   - Move constants/helper functions into `overlay-config.js`.
   - Wrap Socket.IO logic into `overlay-connection.js` returning a clean API.
   - Keep `overlay.js` as the entry point that imports new modules to minimize disruption.

2. **Stage 2 – State + Rendering**
   - Extract overlay state object + helper functions into `overlay-state.js`.
   - Move DOM update/render functions into `overlay-render.js`, with renderer subscribing to state changes.

3. **Stage 3 – Effects + Loadouts**
   - Isolate sprite loading, FX playback, and loadout mapping into dedicated modules.
   - Ensure these modules expose async init functions so the entry point can await as needed.

4. **Stage 4 – Cleanup**
   - Remove legacy globals, convert to ES module syntax (`import`/`export`).
   - Update `obs-overlay.html` (and any other consumers) to load `overlay-main.js` via `<script type="module">`.
   - Add documentation to `docs/overlay-modularization-plan.md` (this file) after each stage.

## Risks & Mitigations
- **Global dependencies (e.g., `Toast`, `getBackendBase`)**: import or pass them via config to avoid undefined errors.
- **Socket auth tokens**: ensure connection module still reads from `getUserToken`/`window.__USER_TOKEN__` or accept a callback.
- **Browser support**: ES modules are widely supported, but we should test in OBS browser source (Chromium-based) to confirm.

## Next Actions
1. Create module directory and move shared constants/helpers (`OVERLAY_CONSTANTS`, `normalizeSuitName`, etc.) into `overlay-config.js`.
2. Extract socket setup into `overlay-connection.js` and have `overlay.js` import it.
3. Smoke-test overlay locally/production to confirm no regressions before proceeding to Stage 2.
