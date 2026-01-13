/**
 * TypeScript Interfaces for Acey Intent System
 * Makes Acey incapable of doing anything "magical" or hidden
 * Acey can only: Speak to chat, Emit structured intents, Wait for server decision
 */

// ===== LLM OUTPUT ROOT =====
export interface AceyOutput {
  speech: string;              // What chat hears
  intents: AceyIntent[];       // What Acey wants to do
}

// ===== INTENT UNION (STRICT) =====
export type AceyIntent =
  | MemoryProposal
  | TrustSignal
  | PersonaModeProposal
  | ModerationSuggestion
  | GameEventIntent
  | SelfEvaluationIntent;

// ===== MEMORY PROPOSAL =====
export interface MemoryProposal {
  type: "memory_proposal";
  scope: "event" | "stream" | "global";
  summary: string;
  confidence: number; // 0–1
  justification: string; // Why this memory should be stored
  impact?: "low" | "medium" | "high";
  privacy?: "public" | "private" | "sensitive";
  ttl?: string;       // e.g. "7d"
  reversible?: boolean;
  metadata?: Record<string, unknown>;
}

// ===== TRUST SIGNAL =====
export interface TrustSignal {
  type: "trust_signal";
  userId: string;
  delta: number;      // -1.0 to +1.0
  reason: string;
  category: "positive" | "negative" | "neutral";
  source: "ai_suggestion" | "user_action" | "system_detection";
  reversible: true;
  decayRate?: "normal" | "fast" | "slow";
  metadata?: Record<string, unknown>;
}

// ===== PERSONA MODE PROPOSAL (SAFE) =====
export interface PersonaModeProposal {
  type: "persona_mode_proposal";
  mode: "calm" | "hype" | "neutral" | "chaos" | "commentator";
  reason: string;
  confidence: number;
  duration?: "indefinite" | string; // e.g. "30m"
  priority?: "low" | "medium" | "high";
  context?: Record<string, unknown>;
  reversible?: boolean;
}

// ===== MODERATION SUGGESTION (NON-ENFORCED) =====
export interface ModerationSuggestion {
  type: "shadow_ban_suggestion";
  userId: string;
  severity: "low" | "medium" | "high" | "critical";
  action: "shadow_ban" | "rate_limit" | "content_filter";
  justification: string;
  duration?: string; // e.g. "1h"
  evidence?: string[];
  escalationPath?: string[];
  reversible?: boolean;
  metadata?: Record<string, unknown>;
}

// ===== GAME EVENT INTENT =====
export interface GameEventIntent {
  type: "game_event_intent";
  eventType: string;
  gameAction: "observe" | "comment" | "celebrate" | "console";
  target?: string | object | null;
  intensity: "low" | "medium" | "high";
  timing: "immediate" | "delayed" | "conditional";
  confidence: number;
  justification: string;
  reversible?: boolean;
  metadata?: Record<string, unknown>;
}

// ===== SELF-EVALUATION INTENT =====
export interface SelfEvaluationIntent {
  type: "self_evaluation_intent";
  evaluationType: "performance" | "safety" | "compliance";
  questions: string[];
  triggers: string[];
  frequency: "periodic" | "event_driven" | "manual";
  confidence: number;
  justification: string;
  reversible?: boolean;
  metadata?: Record<string, unknown>;
}

// ===== COMMON INTENT FIELDS =====
export interface BaseIntentFields {
  type: string;
  confidence: number;
  justification: string;
  reversible?: boolean;
  ttl?: string;
  metadata?: Record<string, unknown>;
}

// ===== VALIDATION RESULTS =====
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: string[];
}

// ===== INTENT EXECUTION RESULT =====
export interface IntentExecutionResult {
  intentId: string;
  status: "executed" | "rejected" | "pending" | "error";
  result?: unknown;
  error?: string;
  processingTime: number;
  approvedBy?: "auto" | "manual" | "simulation";
}

// ===== OPERATOR COMMANDS =====
export interface OperatorCommand {
  type: "approve_intent" | "reject_intent" | "simulate_intent" | "lock_memory" | "unlock_memory";
  intentId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ===== DASHBOARD DATA =====
export interface DashboardData {
  pendingIntents: PendingIntent[];
  systemStats: SystemStatistics;
  recentActivity: AuditEntry[];
  safetyAlerts: SafetyAlert[];
  streamMetrics: StreamMetrics;
}

export interface PendingIntent {
  intentId: string;
  type: string;
  confidence: number;
  justification: string;
  timestamp: number;
  data: AceyIntent;
}

export interface SystemStatistics {
  totalProcessed: number;
  approved: number;
  rejected: number;
  simulated: number;
  errors: number;
  averageProcessingTime: number;
  pending: number;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  eventType: string;
  severity: "info" | "warn" | "error";
  data: Record<string, unknown>;
  userId?: string;
}

export interface SafetyAlert {
  id: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  intentId?: string;
  resolved: boolean;
}

export interface StreamMetrics {
  chatVelocity: number;
  hypeIndex: number;
  engagementLevel: number;
  moodAxes: {
    energy: number;
    chaos: number;
    tension: number;
    engagement: number;
  };
}

// ===== LLM INPUT CONTEXT =====
export interface LLMInputContext {
  streamId: string;
  channel: string;
  timestamp: number;
  gameState: Record<string, unknown>;
  moodMetrics: StreamMetrics;
  currentPersona: string;
  trustLevel: "very_low" | "low" | "medium" | "high";
}

export interface LLMInputMessage {
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LLMInput {
  context: LLMInputContext;
  message: LLMInputMessage;
  recentEvents: GameEvent[];
  systemPrompts: SystemPrompts;
  constraints: LLMConstraints;
}

export interface GameEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface SystemPrompts {
  core: string;
  behavior: string;
  memory: string;
}

export interface LLMConstraints {
  maxResponseLength: number;
  maxIntents: number;
  allowedIntentTypes: string[];
  forbiddenWords: string[];
}

// ===== CONFIGURATION =====
export interface AceyConfig {
  explicitMode: boolean;
  requireApproval: boolean;
  auditAllOperations: boolean;
  simulationEnabled: boolean;
  safetyEnforcement: boolean;
  operatorNotifications: boolean;
  autoApproveThreshold: number;
  maxPendingIntents: number;
  intentTimeout: number;
}

// ===== SYSTEM STATE =====
export interface AceySystemState {
  active: boolean;
  mode: "production" | "simulation" | "training" | "maintenance";
  operatorConnected: boolean;
  pendingApprovals: number;
  lastActivity: number;
  currentPersona: string;
  memoryLocked: boolean;
}
