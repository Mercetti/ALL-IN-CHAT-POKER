# Acey Asset Packaging & Handoff Protocol

Standardize how deliverables are bundled before sending to Ops or deployment.

---

## 1. Directory Layout

```
/package/<request-id>_<theme>/
  README.md               # high-level summary + checklist link
  brief.md                # intake template copy
  assets/                 # source PNG/WebM/GIF/WAV/etc.
  previews/               # GIF/MP4/PNG previews
  metadata/               # JSON (catalog entries, sprite meta, audio manifests)
  automation/             # logs from validators (LUFS, sprite-validate, etc.)
  changelog.md            # bullet list of revisions + reviewers
```

Run `npm run package-init -- --id COS-143 --theme neon_cyber` to scaffold folders.

---

## 2. Naming & Versioning

1. Assets use `slot_descriptor_v##.<ext>` (e.g., `card_back_neon_v02.png`).
2. Metadata files mirror asset IDs (`card_back_neon_v02.json`).
3. Previews match asset names (`card_back_neon_v02.gif`).
4. Keep versions aligned across files before packaging.

---

## 3. Required Files

| File | Purpose |
|------|---------|
| `brief.md` | Final intake form with approvals |
| `README.md` | Summary, dependencies, how to apply |
| `metadata/catalog-entry.json` | Snippet for server catalog |
| `metadata/sprite-meta.json` | Frame data if animation included |
| `metadata/audio-entry.json` | Manifest entry for audio cues |
| `automation/validation.log` | Output from scripts (lint, LUFS, etc.) |
| `previews/*.gif` | Visual proof for review |
| `changelog.md` | Date, owner, change notes |

Use `npm run package-verify -- --dir package/<theme>` to ensure all files present.

---

## 4. Compression & Delivery

1. Compress using `zip -r <theme>_package_v##.zip package/<theme>`.
2. Upload ZIP + hash (SHA256) to shared storage (`/Safe/Packages/<year>/`).
3. Post link + hash in release ticket.

---

## 5. Post-Handoff Checklist

1. Ops confirms ZIP integrity (hash match).
2. Ops copies assets to CDN bucket and metadata to repo branch.
3. Ops comments on ticket with deployment plan/time.
4. Acey archives working directory under `archive/packages/` for future reference.

Following this ensures every drop arrives with predictable structure and documentation, making Ops + QA faster.
