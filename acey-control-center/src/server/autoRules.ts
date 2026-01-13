import { MemoryProposal, PersonaModeProposal, TrustSignal, ModerationSuggestion } from "../contracts/intents";
import { memoryStore } from "../state/memoryStore";
import { trustStore } from "../state/trustStore";
import { personaState } from "../state/personaState";

// Auto-rule logging
function logAutoRule(message: string, intent: any, action?: string) {
  console.log(`[AUTO-RULE] ${message}`, {
    intent,
    action,
    timestamp: Date.now()
  });
}

// 🔹 Memory Auto-Rules
export function memoryAutoRuleLowConfidence(intent: MemoryProposal): "pending" | "reject" {
  const MIN_CONFIDENCE = 0.4;
  if (intent.confidence < MIN_CONFIDENCE) {
    logAutoRule("Memory rejected: low confidence", intent, "reject");
    return "reject";
  }
  return "pending";
}

export function memoryAutoRuleTTL(intent: MemoryProposal): "pending" | "reject" {
  const MAX_TTL_DAYS = 30;
  if (intent.ttl && parseInt(intent.ttl) > MAX_TTL_DAYS) {
    logAutoRule("Memory rejected: TTL too long", intent, "reject");
    return "reject";
  }
  return "pending";
}

export function memoryAutoRuleDuplicate(intent: MemoryProposal): "pending" | "reject" {
  // Check for similar existing memory
  const existing = memoryStore.approved.find(m => 
    m.summary.toLowerCase().includes(intent.summary.toLowerCase().substring(0, 20))
  );
  
  if (existing) {
    logAutoRule("Memory rejected: duplicate", intent, "reject");
    return "reject";
  }
  return "pending";
}

// 🔹 Persona Auto-Rules
export function personaAutoRule(intent: PersonaModeProposal): "approve" | "deny" {
  if (personaState.locked) {
    logAutoRule("Persona switch denied: persona locked", intent, "deny");
    return "deny";
  }
  return "approve";
}

export function personaAutoRuleFrequency(intent: PersonaModeProposal): "approve" | "deny" {
  const MIN_CHANGE_INTERVAL = 300000; // 5 minutes
  const timeSinceLastChange = Date.now() - personaState.lastChange;
  
  if (timeSinceLastChange < MIN_CHANGE_INTERVAL) {
    logAutoRule("Persona switch denied: too frequent", intent, "deny");
    return "deny";
  }
  return "approve";
}

// 🔹 Trust Auto-Rules
export function trustAutoRule(intent: TrustSignal): TrustSignal {
  const MAX_DELTA_PER_MIN = 0.1;
  const recentDeltas = trustStore.history
    .filter(h => Date.now() - h.timestamp < 60000)
    .map(h => h.delta);
  
  const recentTotal = recentDeltas.reduce((sum, delta) => sum + delta, 0);
  
  if (Math.abs(recentTotal + intent.delta) > MAX_DELTA_PER_MIN) {
    const maxAllowed = Math.sign(intent.delta) * (MAX_DELTA_PER_MIN - Math.abs(recentTotal));
    intent.delta = maxAllowed;
    logAutoRule("Trust delta clamped", intent, "modified");
  }
  
  return intent;
}

export function trustAutoRuleBounds(intent: TrustSignal): TrustSignal {
  const MIN_TRUST = 0.0;
  const MAX_TRUST = 1.0;
  
  const newScore = trustStore.score + intent.delta;
  
  if (newScore < MIN_TRUST) {
    intent.delta = MIN_TRUST - trustStore.score;
    logAutoRule("Trust delta adjusted: minimum bound", intent, "modified");
  } else if (newScore > MAX_TRUST) {
    intent.delta = MAX_TRUST - trustStore.score;
    logAutoRule("Trust delta adjusted: maximum bound", intent, "modified");
  }
  
  return intent;
}

// 🔹 Moderation Auto-Rules
export function moderationAutoRule(intent: ModerationSuggestion): "review" | "ignore" {
  const SEVERITY_THRESHOLD = "medium";
  if (intent.severity === "low") {
    logAutoRule("Minor moderation ignored", intent, "ignore");
    return "ignore";
  }
  return "review";
}

export function moderationAutoRuleFrequency(intent: ModerationSuggestion): "review" | "ignore" {
  // Check if similar moderation was suggested recently
  const recentSimilar = trustStore.history
    .filter(h => Date.now() - h.timestamp < 300000) // 5 minutes
    .filter(h => h.reason.toLowerCase().includes(intent.justification.toLowerCase().substring(0, 10)));
  
  if (recentSimilar.length > 0) {
    logAutoRule("Moderation ignored: duplicate recent flag", intent, "ignore");
    return "ignore";
  }
  
  return "review";
}

// 🔹 Auto-Rule Engine
export interface AutoRuleConfig {
  memory: {
    lowConfidence: boolean;
    ttlLimit: boolean;
    duplicateCheck: boolean;
  };
  persona: {
    lockCheck: boolean;
    frequencyLimit: boolean;
  };
  trust: {
    deltaThrottle: boolean;
    boundsCheck: boolean;
  };
  moderation: {
    severityFilter: boolean;
    frequencyLimit: boolean;
  };
}

export const defaultAutoRuleConfig: AutoRuleConfig = {
  memory: {
    lowConfidence: true,
    ttlLimit: true,
    duplicateCheck: true
  },
  persona: {
    lockCheck: true,
    frequencyLimit: true
  },
  trust: {
    deltaThrottle: true,
    boundsCheck: true
  },
  moderation: {
    severityFilter: true,
    frequencyLimit: true
  }
};

export function applyAutoRules(
  intent: MemoryProposal | PersonaModeProposal | TrustSignal | ModerationSuggestion,
  config: AutoRuleConfig = defaultAutoRuleConfig
): { action: string; modifiedIntent?: any; reason?: string } {
  switch (intent.type) {
    case "memory_proposal":
      if (config.memory.lowConfidence) {
        const result = memoryAutoRuleLowConfidence(intent as MemoryProposal);
        if (result === "reject") return { action: "reject", reason: "Low confidence" };
      }
      if (config.memory.ttlLimit) {
        const result = memoryAutoRuleTTL(intent as MemoryProposal);
        if (result === "reject") return { action: "reject", reason: "TTL too long" };
      }
      if (config.memory.duplicateCheck) {
        const result = memoryAutoRuleDuplicate(intent as MemoryProposal);
        if (result === "reject") return { action: "reject", reason: "Duplicate memory" };
      }
      return { action: "pending" };

    case "persona_mode_proposal":
      if (config.persona.lockCheck) {
        const result = personaAutoRule(intent as PersonaModeProposal);
        if (result === "deny") return { action: "deny", reason: "Persona locked" };
      }
      if (config.persona.frequencyLimit) {
        const result = personaAutoRuleFrequency(intent as PersonaModeProposal);
        if (result === "deny") return { action: "deny", reason: "Too frequent changes" };
      }
      return { action: "approve" };

    case "trust_signal":
      let modifiedTrust = intent as TrustSignal;
      if (config.trust.deltaThrottle) {
        modifiedTrust = trustAutoRule(modifiedTrust);
      }
      if (config.trust.boundsCheck) {
        modifiedTrust = trustAutoRuleBounds(modifiedTrust);
      }
      return { action: "apply", modifiedIntent: modifiedTrust };

    case "shadow_ban_suggestion":
      if (config.moderation.severityFilter) {
        const result = moderationAutoRule(intent as ModerationSuggestion);
        if (result === "ignore") return { action: "ignore", reason: "Low severity" };
      }
      if (config.moderation.frequencyLimit) {
        const result = moderationAutoRuleFrequency(intent as ModerationSuggestion);
        if (result === "ignore") return { action: "ignore", reason: "Recent duplicate" };
      }
      return { action: "review" };

    default:
      return { action: "pending" };
  }
}
