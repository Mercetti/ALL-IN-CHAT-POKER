# Auto-Refactor Prompt (Send to Your LLM)

Use this to merge Acey → Helm cleanly.

## TASK:
Refactor project to separate Helm Control (engine) from Acey (persona).

## RULES:
- Helm owns skills, permissions, stability, orchestration
- Acey becomes a persona package only
- Rename acey-* engine files to helm-*
- Do NOT break public APIs
- Preserve behavior
- Introduce clear boundaries

## OUTPUT:
- Updated TypeScript files
- New folder structure
- Migration notes
