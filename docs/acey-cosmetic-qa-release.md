# Acey Cosmetic QA & Release Protocol

Turn raw cosmetic output into production-ready bundles without surprises.

---

## 1. Pre-QA Intake

1. Confirm cosmetic brief is attached (theme name, rarity, unlock rules, linked audio/sprite IDs).
2. Ensure all assets live under `public/assets/cosmetics/<slot>/<theme>/` with lowercase kebab-case filenames.
3. Verify catalog draft entry exists (even if flagged `draft: true`).

---

## 2. Visual QA Checklist

1. **Resolution & Ratios**
   - Table skins: 2048×1024 minimum, power-of-two if possible.
   - Card backs: 750×1050 default; maintain aspect ratio.
   - Avatar rings/frames: 512×512 with transparent center mask.
2. **Alpha & Edges**
   - View assets on dark (#0c0c0c) and light (#f5f5f5) backgrounds.
   - No stray pixels, smooth alpha gradients.
3. **Animation Preview**
   - Load GIF/MP4 preview in admin dashboard or `npm run dev-overlay` to confirm loops.
4. **Consistency**
   - Colors align with narrative brief and any paired audio/sprite cues.

---

## 3. Technical Validation

1. Run `npm run cosmetics-validate -- --manifest server/cosmetic-catalog.json`.
2. Run `npm run cosmetics-lint-images -- --path public/assets/cosmetics/<slot>/<theme>`.
3. Ensure each asset < 3 MB (ideal < 1 MB) and uses PNG/WebP/WebM as appropriate.
4. Confirm preview GIF/MP4 exists under `/public/assets/cosmetics/previews/<theme>/`.

---

## 4. Overlay Verification

1. Launch overlay dev server: `npm run dev-overlay -- --theme <theme>`.
2. Apply cosmetics via `/overlay?cardBack=<id>&tableSkin=<id>` query.
3. Capture 10-second screen recording showcasing table, cards, effects, and avatar frame.
4. Log overlay console for missing asset warnings.

---

## 5. Catalog & DB Sync

1. Update `server/cosmetic-catalog.json` entry:
   - `rarity`, `price`, `unlock`, `image_url`, `preview_url`, `pairedAudio`, `spriteMeta`.
2. Run seed script if new items require DB seeding: `node scripts/seed-cosmetics.js --theme <theme>`.
3. Document grant/equip test results (admin command or API call) in release ticket.

---

## 6. Release Package

Structure:

```
/package/<theme>/
  assets/
  previews/
  metadata.json
  brief.md
  overlay-recording.mp4
  CHANGELOG.md
```

Use `npm run cosmetics-package -- --theme <theme>` to build the bundle.

---

## 7. Approval Workflow

1. Attach package ZIP + overlay recording + QA checklist to ticket.
2. Reviewer signs off (visual + tech). Record initials/date in `docs/cosmetics-release-log.md`.
3. Ops receives final package, uploads to CDN, and runs catalog sync (see separate protocol).
4. Announce in release notes (theme name, slots, rarity, unlock method).

---

## 8. Post-Release Monitoring

1. After deploy, run smoke test on production overlay (`?theme=<theme>`).
2. Watch logs for 24h for missing asset errors.
3. If issues appear, revert catalog entry using prior manifest backup and notify ops.

Following these steps keeps every cosmetic drop consistent, reviewable, and easy to roll back if needed.
