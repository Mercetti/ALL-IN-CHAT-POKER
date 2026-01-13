export type AceyIntent =
  | MemoryProposal
  | TrustSignal
  | PersonaModeProposal
  | ModerationSuggestion;

export interface MemoryProposal {
  type: "memory_proposal";
  scope: "event" | "stream" | "global";
  summary: string;
  confidence: number;
  ttl?: string;
}

export interface TrustSignal {
  type: "trust_signal";
  delta: number;
  reason: string;
  reversible: true;
}

export interface PersonaModeProposal {
  type: "persona_mode_proposal";
  mode: "calm" | "hype" | "neutral";
  reason: string;
}

export interface ModerationSuggestion {
  type: "shadow_ban_suggestion";
  severity: "low" | "medium";
  justification: string;
}
