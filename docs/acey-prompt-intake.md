# Acey Prompt & Brief Intake Protocol

Use this template before accepting any creative task (audio, cosmetics, sprites, copy) so requirements are locked.

---

## 1. Intake Template

| Field | Description | Example |
|-------|-------------|---------|
| Request ID | Link to ticket/issue | COS-143 |
| Deliverable | e.g., “Epic card back + matching win FX” | Legendary table skin set |
| Narrative hook | Story, emotion, voice | “Neon cyber casino” |
| Visual/audio refs | URLs or asset IDs | Dribbble link, Spotify playlist |
| Mood & palette | Colors, emotion words | #0ff, #111, “electric, high stakes” |
| Technical constraints | Sizes, formats, loop length, LUFS, frame counts | Card back 750×1050, sprite 24 frames |
| Dependencies | Linked protocols/assets | Sprite SOP, audio mix SOP |
| Deadlines/timebox | When each phase due | Concept 1 day, final 3 days |
| Approval chain | Who signs off | Mercetti -> Ops |
| Risks | Known blockers | Waiting on catalog update |

Acey should duplicate this table per request and fill every column.

---

## 2. Intake Workflow

1. Receive request → send intake template (Markdown or form).
2. Wait for all mandatory fields before starting work.
3. Store filled brief at `docs/briefs/<request-id>.md`.
4. Reference brief in all protocol checklists (audio, cosmetics, sprite).

---

## 3. Change Management

1. Any mid-stream change must include:
   - What changed (e.g., color palette, loop length).
   - Impact on schedule/protocol steps.
   - New approval timestamp.
2. Update the stored brief and note version (v1, v2) for traceability.

---

## 4. Intake SLA

| Task | Target |
|------|--------|
| Acknowledge request | < 15 min |
| Send/receive filled intake | < 1 hr |
| Flag missing info | Immediately, no work until resolved |

Following this protocol guarantees Acey always has the creative targets and technical constraints needed before starting any generation work.
