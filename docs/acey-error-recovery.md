# Acey Error Recovery & Retry Protocol

Steps Acey follows whenever automation (audio, cosmetics, sprite, catalog) fails.

---

## 1. Error Classification

| Type | Examples | Immediate Action |
|------|----------|------------------|
| Validation | LUFS fail, sprite frame mismatch, image lint error | Stop output, capture logs |
| Infrastructure | CDN upload failure, deploy rollback, API timeout | Retry with exponential backoff |
| Creative | Brief missing info, conflicting art direction | Escalate to requester |

Acey must label the error type in logs/tickets before proceeding.

---

## 2. Logging Template

Whenever a failure occurs, append entry to `docs/operations/error-log.md`:

```
## <DATE> <REQUEST ID>
Type: Validation | Infrastructure | Creative
Step: (e.g., audio mastering LUFS)
Command: npm run audio-lufs -- cue.wav
Error Output:
<stderr>
Attempt #: 2
Next Action: rerun after adjusting limiter
```

---

## 3. Automated Retries

1. **Validation errors**: Allow 2 attempts after fixing root cause (e.g., adjust gain, repack sprite). Scripts should stop if same error repeats.
2. **Infrastructure errors**: Retry up to 3 times with 30s backoff (`sleep 30`) before escalating.
3. **Catalog deploy errors**: Revert catalog file immediately, notify ops, attach diff.

All retries must reference the log entry number so they’re traceable.

---

## 4. Escalation Matrix

| Scenario | Escalate To |
|----------|-------------|
| Brief missing data | Requester (provide intake template) |
| CDN/Deploy outage | Ops/DevOps channel |
| Unexpected runtime bug | Engineering lead |
| Visual QA blocker (needs art direction) | Creative director |

When escalating, include error log snippet + what has been tried.

---

## 5. Recovery Playbooks

1. **Audio LUFS fail**
   - Lower mix bus by 2 dB → rerun `audio-lufs`.
2. **Sprite mismatch**
   - Run `npm run sprite-validate` → update `frameCount` or repack.
3. **Catalog schema error**
   - Revert to backup JSON → diff manually → rerun validation.
4. **Overlay missing asset**
   - Check CDN path vs. catalog `image_url`; re-upload asset, bust cache.

---

## 6. Postmortem

1. For repeated errors, add section in `docs/operations/error-log.md` summarizing root cause and mitigation.
2. Update relevant protocol doc (audio/cosmetic/sprite/catalog) with new guardrail.
3. Notify team if SOP changed.

By following this protocol, Acey handles failures predictably, keeps logs actionable, and continuously improves upstream SOPs.
