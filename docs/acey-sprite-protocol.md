# Acey Animated Cosmetic Sprite Protocol

Guidelines Acey should follow to generate shippable sprite sheets for animated cosmetics (deal FX, win bursts, avatar rings, etc.) without rework.

---

## 1. Preparation & Intake

1. **Gather references**
   - Example cosmetic or motion brief (GIF/video, frame notes, loop length).
   - Required slot & overlay target (e.g., `winFx`, `dealFx`, `avatarRing`).
   - Palette + branding constraints (RGB/hex swatches, gradients, bloom levels).
   - Allowed animation duration window (usually 0.4–1.2s for FX, 1.5–2s loops for ambient sets).
2. **Define specs before painting**
   - Canvas size per frame: `512x512` default for win FX, `512x716` for cards, `256x256` for avatar rings.
   - Total frame count & FPS target (e.g., 24 frames @ 18 fps).
   - Single-row horizontal sheet unless explicitly multi-row (win effects may use rows when >24 frames).
   - Transparency rules: Always use alpha (RGBA) with premultiplied friendly edges.
3. **Confirm asset ID**
   - Follow catalog naming (e.g., `win_burst_glitch_24`).
   - Reserve path under `/public/assets/cosmetics/effects/{category}/{asset_id}`.

---

## 2. Sprite Sheet Construction

| Item | Requirement |
| --- | --- |
| Sheet layout | Horizontal strip preferred. Columns = frame count. Multi-row allowed only if meta.columns specified. |
| Margins | 0 px margin, but keep 4 px padding inside frame edges to prevent clipping. |
| Background | Transparent. No baked-in table colors. |
| Color depth | 8-bit RGBA. Avoid indexed color to preserve alpha. |
| File format | PNG (lossless). Use `pngquant` or `oxipng` to reduce size without artifacts. |
| Naming | `{asset_id}_{framecount}frames_{width}x{height}.png` (e.g., `allin_burst_24frames_1024x1024.png`). |
| Looping | First & last frames should align for seamless looping. |
| Motion blur | Use additive/glow layers sparingly; avoid pure white > 240 to prevent clipping. |

**Steps Acey should automate:**

1. Generate key frames in layered PSD/clip file.
2. Export numbered PNG sequence (e.g., `0000.png` → `0023.png`).
3. Use sprite packing script (TexturePacker, shoebox, or custom node script) with fixed width order (frame 0 → N).
4. Ensure metadata is exported/created (see §3).

---

## 3. Metadata & JSON Schema

Sprite consumers expect metadata co-located with the image.

```json
{
  "id": "win_burst_glitch_24",
  "frameCount": 24,
  "frameWidth": 512,
  "frameHeight": 512,
  "fps": 18,
  "loop": true,
  "spacing": 0,
  "columns": 24,
  "image": "win_burst_glitch_24frames_512x512.png",
  "frames": [
    { "index": 0, "x": 0, "y": 0, "duration": 55 },
    { "index": 1, "x": 512, "y": 0, "duration": 55 }
  ]
}
```

### Rules

- If spacing or gutters exist, include `spacing`/`spacingY`.
- For multi-row sheets, set `columns` and allow `frames` to include `w/h` when irregular.
- For bidirectional animations (card flip), mark `frames[n].side` (`"back"` or `"front"`).
- Validate JSON against current overlay loader (see `public/overlay.js` derive/load helpers).

---

## 4. Automation Hooks for Acey

1. **Sprite assembler command**
   - `node tools/acey-dev-helper.js --build-sprite --input ./tmp/acey --output ./public/assets/cosmetics/effects/win/win_burst_glitch_24frames_512x512.png --meta ./public/assets/cosmetics/effects/win/win_burst_glitch_24.json`
2. **Metadata validator**
   - Extend dev helper to check: matching frame count vs. sheet width, file existence, consistent fps.
3. **Catalog updater**
   - After sprite approved, add entry to cosmetics catalog (id, rarity, type, price) with `meta_path` and `image_url`.
4. **Preview generator**
   - Auto-make a small GIF or MP4 for admin dashboard preview (6 fps, 512px square) stored under `/public/assets/cosmetics/previews`.

---

## 5. QA Checklist (No Exceptions)

1. **Visual**
   - Seamless loop, no pops at frame 0/last.
   - Alpha edges blend cleanly over dark & light backdrops (test in compositor layer).
   - Center anchor consistent; effect shouldn’t drift unless intended.
2. **Technical**
   - File size < 2.5 MB recommended; never > 5 MB for overlays.
   - Metadata frame count matches actual columns.
   - JSON + PNG named identically (aside from extension) and referenced in catalog.
   - Sprite and meta load successfully via `npm run dev-overlay` (watch console for errors).
3. **Integration**
   - Update `effectsMeta` registry if the animation should be selectable (e.g., `overlayFx.winFx`).
   - Ensure admin dashboard preview uses correct `fxKey`.
   - Commit assets + metadata with LFS if file > 10 MB (should be avoided ideally).

---

## 6. Handoff to Production

1. **Package**: PNG sheet, JSON meta, preview GIF, changelog snippet (what slot it targets, FPS, palette, recommended rarity).
2. **Register**: Add to `cosmetic catalog` (server-side) with inventory attributes (rarity, price, unlock requirements).
3. **Notify**: Ping ops with asset ID + preview for approval. Include fallback instructions if overlay doesn’t support the new frame size.
4. **Deploy**: Run `npm run build` (if necessary) and push to CDN/hosting. Confirm overlay loads assets from new path.

Following these steps keeps Acey’s sprite output consistent, compresses review cycles, and prevents runtime errors in the overlay.

---

## 7. Timeboxing & Performance Guardrails

1. **Estimated effort**
   - Brief confirmation: 5 min
   - Keyframe block‑in: 25–30 min
   - Polish & glow pass: 15 min
   - Packing + metadata + QA: 10 min
   - Export + GIF preview + catalog update: 10 min
2. **GPU/Texture limits**
   - Max sheet dimension 4096 px wide; prefer ≤2048 for win FX.
   - Keep total sprite memory < 8 MB per effect to avoid overlay spikes.
   - Store fallback 256 px static PNG for low-powered overlays.
3. **Automated sanity**
   - `npm run sprite-validate -- --meta path/to/meta.json` ensures frame counts align.
   - `npm run overlay-preview -- --fx win_burst_glitch_24` spins overlay dev server with query `?fxKey=` for manual verification.

Acey should log actual times per phase to keep delivery predictable and flag any overruns early.
