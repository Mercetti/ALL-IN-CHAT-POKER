# Acey Audio Mix & Master Protocol

Structured steps Acey follows after generating raw audio so cues remain consistent and production-ready.

---

## 1. Source Intake

1. Log creative brief ID, cue name, and generation timestamp.
2. Ensure raw WAV is 44.1 kHz/24-bit (or higher) before processing.
3. Save working copy to `tmp/audio/<cueName>/raw/`.

---

## 2. Editing & Arrangement

1. Trim silence to ≤50 ms at start/end; add 5 ms fade in/out unless cue requires hard edges.
2. Confirm loop point alignment (crossfade check) for background tracks.
3. Annotate markers for key hits (win stings, UI events) to assist QA.

---

## 3. Mixing Targets

| Type | LUFS Integrated | Peak Ceiling | Notes |
|------|-----------------|--------------|-------|
| Background music | −16 LUFS | −1 dBTP | Wider stereo field, mid-side cleaned |
| SFX/UI | −12 LUFS | −0.5 dBTP | Mono-compatible, transient shaping |
| Ambient beds | −18 LUFS | −1 dBTP | High-pass <80 Hz to avoid rumble |

Steps:

1. Apply EQ cleanup (high-pass 100 Hz for UI sounds, notch harsh resonances 2–4 kHz).
2. Use gentle compression (2:1) for music bus; transient shaper for SFX bus.
3. Run `npm run audio-lufs -- cueName.wav --target <type>` to confirm loudness.

---

## 4. Mastering Chain

1. Tape/Saturation (optional) → Buss comp → Brickwall limiter.
2. Dither to 16-bit if exporting final WAV for shipping.
3. Render final master to `public/assets/audio/<category>/<cueName_v##.wav>`.

---

## 5. Format Exports & Metadata

1. Generate web formats:
   - `ffmpeg -i cue.wav -c:a libvorbis cue.ogg`
   - `ffmpeg -i cue.wav -codec:a libmp3lame -qscale:a 2 cue.mp3`
2. Tag metadata via `npm run audio-tag -- cueName.wav --bpm 120 --mood energetic --instruments piano,strings`.
3. Update `audioManifest.json` with:

   ```json
   {
     "id": "main_theme_glitch_v03",
     "category": "music",
     "bpm": 118,
     "mood": "energetic",
     "length": 32,
     "formats": ["wav", "ogg", "mp3"],
     "createdAt": "2026-01-12T08:15:00Z"
   }
   ```

---

## 6. QA & Sign-off

1. Run `npm run audio-qc -- cueName` (checks clipping, format presence, metadata, file size < 15 MB).
2. Listen on both stereo monitors and mono/budget earbuds.
3. Attach MP3 preview + waveform screenshot to release ticket.
4. Once approved, archive working session under `archive/audio/<cueName_v##>/`.

---

## 7. Failure Handling

- If LUFS/peak fail, adjust mix and rerun QC rather than forcing limiter.
- If artifacts appear after conversion (OGG/MP3), export again with higher bitrate or tweak source.
- Log all retries in `docs/audio-release-log.md` for traceability.

Following this protocol keeps Acey’s audio assets uniform, compliant with platform limits, and ready for instant integration.
