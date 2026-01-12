# Acey Catalog Sync & Rollout Protocol

Ensure cosmetic/audio entries hit the catalog + DB safely with rollback options.

---

## 1. Pre-Sync Requirements

1. Approved package ZIP + checklist complete (see QA + Packaging SOPs).
2. Catalog diff prepared in `server/cosmetic-catalog.json` (or relevant manifest).
3. DB seeds or migration scripts ready (if new rows needed).
4. Backup of current catalog (`git show HEAD:server/cosmetic-catalog.json > backup/catalog_<date>.json`).

---

## 2. Dry Run (Local)

1. Apply catalog diff locally.
2. Run `npm run cosmetics-validate -- --manifest server/cosmetic-catalog.json`.
3. Seed DB if required: `node scripts/seed-cosmetics.js --theme <theme>`.
4. Start backend + overlay (`npm run dev` + `npm run dev-overlay`) and sanity check new items appear.
5. Commit diff to feature branch.

---

## 3. Production Sync Steps

1. **Maintenance Flag**: Notify ops + set deployment window.
2. **Copy Assets**: Upload new files to CDN/bucket before catalog update.
3. **Update Catalog**:
   - `git checkout main`
   - `git pull`
   - `git apply catalog.diff`
   - `npm run cosmetics-validate`
4. **DB Update**: run seeding/migrations against production DB (tunnel or job).
5. **Deploy**: `flyctl deploy` or equivalent pipeline.

---

## 4. Verification

1. Hit `/catalog` endpoint → confirm JSON shows new entries.
2. Load admin dashboard → new cosmetics visible with correct rarity/price.
3. Overlay smoke test with `?theme=` query.
4. Grant/equip test via admin API to ensure inventory records created.

---

## 5. Monitoring & Rollback

1. Monitor logs for 24h for `asset missing` or `catalog invalid` errors.
2. If rollback needed:
   - Revert catalog file using backup (`cp backup/catalog_<date>.json server/cosmetic-catalog.json`).
   - Redeploy.
   - Remove problematic assets from CDN if necessary.
3. Document cause + fix in release ticket.

---

## 6. Communication

1. Post release notes (what’s new, rarity, unlock instructions) in admin channel.
2. Update `docs/cosmetics-release-log.md` with deploy date + catalog commit hash.
3. If drop is streamer-facing, prep marketing blurb + screenshot using packaged previews.

Following this flow keeps catalog updates deterministic and reversible.
