# Cosmetics & Animation Assets

Working list of assets that the game can use today and placeholders for new art you want to create.

## Current assets (wired)
- Avatar rings: `public/assets/cosmetics/avatar/*.png` (basic, streamer, subscriber, drop variants).
- Table skins: `public/assets/cosmetics/table/*.png`.
- Card backs: `public/assets/card-back.png` (tintable).
- Sounds: `public/assets/shuffle.mp3`.

## Added needs for animations
Use these filenames so the frontend can pick them up once you drop real art/video in place:

- Deals: `public/assets/cosmetics/effects/deals/deal-trail.webm` (or .png/.gif).
- Flips: `public/assets/cosmetics/effects/flips/flip-burst.webm`.
- Chips: `public/assets/cosmetics/effects/chips/chip-splash.webm`.
- Fold: `public/assets/cosmetics/effects/folds/fold-dust.webm`.
- All-in: `public/assets/cosmetics/effects/all-in/all-in-burst.webm`.
- Chip side views: `public/assets/cosmetics/effects/chips/chip-1-side.png`, `chip-5-side.png`, `chip-25-side.png`, `chip-100-side.png`, `chip-500-side.png` (for stacked visuals).

## Future cosmetics (placeholders created)
- Card backs: put art in `public/assets/cosmetics/cards/basic|drops|streamer/your-name.png`.
- Frames: put art in `public/assets/cosmetics/frame/basic|drops|streamer|subscriber/your-name.png`.
- Table basics: put art in `public/assets/cosmetics/table/basic/your-name.png`.
- Card faces: drop full decks under `public/assets/cosmetics/cards/faces/<deck-name>/rank_of_suit.png` (e.g., `ace_of_spades.png`).

## Notes
- Keep filenames lowercase with hyphens. PNG/WebM work best.
- After adding a new asset, update `server.js` `COSMETIC_CATALOG` with its id/path and rarity/unlock rules.
- The `.gitkeep` files simply keep empty folders in git; replace them with your assets anytime.
