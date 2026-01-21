# 🔧 HELM CONTROL REFACTOR - INVENTORY & CLASSIFICATION

## 📊 MAPPING TABLE

### **ENGINE LAYER** (Must be renamed to Helm/HelmControl)

| Current Name | New Name | Type | Location | Classification |
|--------------|----------|------|----------|----------------|
| `acey-stability.ts` | `helm-stability.ts` | File | server/stability/ | ENGINE |
| `acey-modes.ts` | `helm-modes.ts` | File | server/stability/ | ENGINE |
| `acey-intents.ts` | `helm-intents.ts` | File | server/acey/interfaces/ | ENGINE |
| `acey-llm-system.ts` | `helm-llm-system.ts` | File | server/acey/interfaces/ | ENGINE |
| `acey-validators.ts` | `helm-validators.ts` | File | server/acey/interfaces/ | ENGINE |
| `AceyOrchestrator` | `HelmOrchestrator` | Class | acey-control-center/src/orchestrator/ | ENGINE |
| `aceyOrchestrator.ts` | `helmOrchestrator.ts` | File | acey-control-center/src/orchestrator/ | ENGINE |
| `aceyServiceService.ts` | `helmServiceService.ts` | File | acey-control-center/src/services/ | ENGINE |
| `aceyMobileOrchestrator.ts` | `helmMobileOrchestrator.ts` | File | acey-control-center/src/services/ | ENGINE |
| `aceyMobileNotifier.ts` | `helmMobileNotifier.ts` | File | acey-control-center/src/services/ | ENGINE |
| `aceyApi.ts` | `helmApi.ts` | File | acey-control-center/src/services/ | ENGINE |
| `aceyAdminOrchestrator.ts` | `helmAdminOrchestrator.ts` | File | acey-control-center/src/services/ | ENGINE |
| `aceyBridge.ts` | `helmBridge.ts` | File | acey-control-center/src/server/ | ENGINE |
| `aceyStore.ts` | `helmStore.ts` | File | acey-control-center/src/state/ | ENGINE |
| `AceyControlCenter` | `HelmControlCenter` | Component | acey-control-center/src/client/components/ | ENGINE |
| `AceyControlCenter.tsx` | `HelmControlCenter.tsx` | File | acey-control-center/src/client/components/ | ENGINE |
| `AceyAPIService.ts` | `HelmAPIService.ts` | File | acey-control-apk/src/services/ | ENGINE |
| `AceyExecutionPack.js` | `HelmExecutionPack.js` | File | server/acey/ | ENGINE |
| `AceyControlCenter/` | `HelmControlCenter/` | Folder | apps/ | ENGINE |

### **PERSONA LAYER** (Must stay as Acey, but move to config)

| Current Name | New Location | Type | Classification |
|--------------|--------------|------|----------------|
| `acey-master-system-prompt.md` | `/personas/acey/system-prompt.md` | File | PERSONA |
| `Acey says...` text | `/personas/acey/responses.json` | Content | PERSONA |
| Chat UI labels | `/personas/acey/ui-labels.json` | Config | PERSONA |
| Tone/personality logic | `/personas/acey/personality.ts` | Config | PERSONA |
| Stream/game dialogue | `/personas/acey/game-dialogue.json` | Config | PERSONA |
| Audio voice identity | `/personas/acey/voice-config.json` | Config | PERSONA |
| Demo scripts | `/personas/acey/demo-scripts/` | Folder | PERSONA |

### **APPLICATION LAYER** (All-In Chat Poker - stays as-is)

| Current Name | Action | Type | Classification |
|--------------|--------|------|----------------|
| `All-In Chat Poker` | Keep as-is | Application | APPLICATION |
| `Twitch integration` | Keep as-is | Application | APPLICATION |
| `Game logic` | Keep as-is | Application | APPLICATION |
| `Audio engine` | Keep as-is | Application | APPLICATION |
| `poker-game/` | Keep as-is | Root folder | APPLICATION |

### **MIXED/AMBIGUOUS** (Needs manual review)

| Current Name | Current Location | Type | Notes | Recommended Action |
|--------------|------------------|------|-------|-------------------|
| `AceyServiceControlScreen.tsx` | acey-control-center/src/screens/ | UI | Mix of engine control + persona | Split: rename UI to HelmServiceControlScreen, keep persona references |
| `AceyLabScreen.tsx` | acey-control-center/src/screens/ | UI | Lab interface for engine | Rename to HelmLabScreen.tsx |
| `AceyActivityFeed.tsx` | acey-control-center/src/components/ | UI | Engine monitoring | Rename to HelmActivityFeed.tsx |
| `AceyModeSwitchScreen.tsx` | acey-control-center/src/components/stability/ | UI | Engine mode control | Rename to HelmModeSwitchScreen.tsx |
| `AceyChatInterface.tsx` | examples/ | UI | Demo interface | Keep as demo example |
| `AceyTester.tsx` | apps/ai-control-center/src/components/ | UI | Testing interface | Rename to HelmTester.tsx |
| `AceyDevHelper.tsx` | apps/ai-control-center/src/components/ | UI | Development tools | Rename to HelmDevHelper.tsx |
| `AceyFeedbackAnalyzer.tsx` | apps/ai-control-center/src/components/ | UI | Analysis tool | Rename to HelmFeedbackAnalyzer.tsx |

### **DATA/MODELS** (Engine data, should be renamed)

| Current Name | New Name | Type | Classification |
|--------------|----------|------|----------------|
| `AceyLogs/` | `HelmAudit/` | Folder | ENGINE |
| `AceyLLM/` | `HelmLLM/` | Folder | ENGINE |
| `AceyLearning/` | `HelmLearning/` | Folder | ENGINE |
| `aceyLearningDataset.ts` | `helmLearningDataset.ts` | File | ENGINE |
| `acey_graphics.jsonl` | `helm_graphics.jsonl` | File | ENGINE |
| `acey_cosmetic.jsonl` | `helm_cosmetic.jsonl` | File | ENGINE |
| `acey_coding.jsonl` | `helm_coding.jsonl` | File | ENGINE |
| `acey_chat.jsonl` | `helm_chat.jsonl` | File | ENGINE |
| `acey_audio.jsonl` | `helm_audio.jsonl` | File | ENGINE |

### **DOCUMENTATION** (Update references)

| Current Name | New Name | Type | Classification |
|--------------|----------|------|----------------|
| `acey-*.md` files | `helm-*.md` | Documentation | ENGINE |
| `ACEY_ENGINE_METHODS_FIX.md` | `HELM_ENGINE_METHODS_FIX.md` | Documentation | ENGINE |

## 📋 SUMMARY STATISTICS

- **ENGINE items to rename**: 25+
- **PERSONA items to extract**: 8+
- **APPLICATION items to keep**: 4+
- **MIXED items to review**: 8+
- **Total files affected**: 45+

## 🎯 REFACTOR PRIORITY

1. **HIGH PRIORITY**: Core engine files (orchestrator, stability, services)
2. **MEDIUM PRIORITY**: UI components and data models
3. **LOW PRIORITY**: Documentation and examples

## ⚠️ CRITICAL PATH DEPENDENCIES

1. `aceyOrchestrator.ts` → Many components depend on this
2. `aceyStore.ts` → State management for UI
3. `aceyServiceService.ts` → Mobile API integration
4. `acey-stability.ts` → Core stability system

These must be renamed first with compatibility aliases.
