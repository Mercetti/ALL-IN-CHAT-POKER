/**
 * Runtime Validation with Zod Schemas
 * Validates every message, drops invalid outputs, logs rejections
 */

import { z } from "zod";
import type { 
  AceyOutput, 
  MemoryProposal, 
  TrustSignal, 
  PersonaModeProposal, 
  ModerationSuggestion,
  GameEventIntent,
  SelfEvaluationIntent,
  ValidationResult 
} from './acey-intents';

// ===== MEMORY PROPOSAL SCHEMA =====
export const MemoryProposalSchema = z.object({
  type: z.literal("memory_proposal"),
  scope: z.enum(["event", "stream", "global"]),
  summary: z.string().max(200),
  confidence: z.number().min(0).max(1),
  justification: z.string().min(10).max(500),
  impact: z.enum(["low", "medium", "high"]).optional(),
  privacy: z.enum(["public", "private", "sensitive"]).optional(),
  ttl: z.string().optional(),
  reversible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.confidence >= 0.7 || data.scope === 'event',
  {
    message: "Memory proposals require confidence >= 0.7 for stream/global scope",
    path: ["confidence"]
  }
).refine(
  (data) => !data.summary.toLowerCase().includes('user') && !data.summary.toLowerCase().includes('player'),
  {
    message: "Memory summaries cannot contain user references",
    path: ["summary"]
  }
);

// ===== TRUST SIGNAL SCHEMA =====
export const TrustSignalSchema = z.object({
  type: z.literal("trust_signal"),
  userId: z.string().min(1),
  delta: z.number().min(-1).max(1),
  reason: z.string().min(5).max(200),
  category: z.enum(["positive", "negative", "neutral"]),
  source: z.enum(["ai_suggestion", "user_action", "system_detection"]),
  reversible: z.literal(true),
  decayRate: z.enum(["normal", "fast", "slow"]).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => Math.abs(data.delta) <= 0.2,
  {
    message: "Trust changes must be <= 0.2",
    path: ["delta"]
  }
);

// ===== PERSONA MODE PROPOSAL SCHEMA =====
export const PersonaModeProposalSchema = z.object({
  type: z.literal("persona_mode_proposal"),
  mode: z.enum(["calm", "hype", "neutral", "chaos", "commentator"]),
  reason: z.string().min(5).max(200),
  confidence: z.number().min(0).max(1),
  duration: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  context: z.record(z.unknown()).optional(),
  reversible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.confidence >= 0.6,
  {
    message: "Persona proposals require confidence >= 0.6",
    path: ["confidence"]
  }
);

// ===== MODERATION SUGGESTION SCHEMA =====
export const ModerationSuggestionSchema = z.object({
  type: z.literal("shadow_ban_suggestion"),
  userId: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  action: z.enum(["shadow_ban", "rate_limit", "content_filter"]),
  justification: z.string().min(10).max(500),
  duration: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  escalationPath: z.array(z.string()).optional(),
  reversible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.justification.length >= 20,
  {
    message: "Moderation suggestions require detailed justification (min 20 chars)",
    path: ["justification"]
  }
).refine(
  (data) => data.evidence && data.evidence.length > 0 || data.severity !== 'high',
  {
    message: "High severity moderation requires evidence",
    path: ["evidence"]
  }
);

// ===== GAME EVENT INTENT SCHEMA =====
export const GameEventIntentSchema = z.object({
  type: z.literal("game_event_intent"),
  eventType: z.string().min(1),
  gameAction: z.enum(["observe", "comment", "celebrate", "console"]),
  target: z.union([z.string(), z.object({}), z.null()]).optional(),
  intensity: z.enum(["low", "medium", "high"]),
  timing: z.enum(["immediate", "delayed", "conditional"]),
  confidence: z.number().min(0).max(1),
  justification: z.string().min(5).max(200),
  reversible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.confidence >= 0.5,
  {
    message: "Game event intents require confidence >= 0.5",
    path: ["confidence"]
  }
);

// ===== SELF-EVALUATION INTENT SCHEMA =====
export const SelfEvaluationIntentSchema = z.object({
  type: z.literal("self_evaluation_intent"),
  evaluationType: z.enum(["performance", "safety", "compliance"]),
  questions: z.array(z.string().min(10).max(200)),
  triggers: z.array(z.string()),
  frequency: z.enum(["periodic", "event_driven", "manual"]),
  confidence: z.number().min(0).max(1),
  justification: z.string().min(10).max(500),
  reversible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.questions.length > 0,
  {
    message: "Self-evaluation requires at least one question",
    path: ["questions"]
  }
);

// ===== INTENT UNION SCHEMA =====
export const AceyIntentSchema = z.union([
  MemoryProposalSchema,
  TrustSignalSchema,
  PersonaModeProposalSchema,
  ModerationSuggestionSchema,
  GameEventIntentSchema,
  SelfEvaluationIntentSchema
]);

// ===== ACEY OUTPUT SCHEMA =====
export const AceyOutputSchema = z.object({
  speech: z.string().max(500),
  intents: z.array(AceyIntentSchema).min(0).max(5),
}).refine(
  (data) => {
    // Business rule: Write intents require high confidence
    const writeIntents = data.intents.filter(intent => 
      ['memory_proposal', 'trust_signal', 'shadow_ban_suggestion'].includes(intent.type)
    );
    return writeIntents.every(intent => intent.confidence >= 0.7);
  },
  {
    message: "Write intents (memory, trust, moderation) require confidence >= 0.7"
  }
).refine(
  (data) => {
    // Business rule: All intents must have justification
    return data.intents.every(intent => intent.justification && intent.justification.length >= 10);
  },
  {
    message: "All intents must have justification (min 10 characters)"
  }
).refine(
  (data) => {
    // Business rule: No user-level data in global memories
    const globalMemories = data.intents.filter(intent => 
      intent.type === 'memory_proposal' && intent.scope === 'global'
    );
    return globalMemories.every(intent => 
      !intent.summary.toLowerCase().includes('user') && 
      !intent.summary.toLowerCase().includes('player')
    );
  },
  {
    message: "Global memories cannot contain user-level data"
  }
);

// ===== VALIDATION ENGINE =====
export class AceyValidator {
  private validationStats = {
    totalValidations: 0,
    validOutputs: 0,
    invalidOutputs: 0,
    rejections: [] as Array<{
      timestamp: number;
      error: string;
      data: unknown;
    }>
  };

  /**
   * Validate Acey output
   * @param output - Raw output to validate
   * @returns Validation result
   */
  validateOutput(output: unknown): ValidationResult {
    this.validationStats.totalValidations++;

    try {
      const result = AceyOutputSchema.safeParse(output);

      if (result.success) {
        this.validationStats.validOutputs++;
        return {
          valid: true,
          data: result.data
        };
      } else {
        this.validationStats.invalidOutputs++;
        this.validationStats.rejections.push({
          timestamp: Date.now(),
          error: result.error.message,
          data: output
        });

        // Keep rejection history limited
        if (this.validationStats.rejections.length > 100) {
          this.validationStats.rejections = this.validationStats.rejections.slice(-50);
        }

        return {
          valid: false,
          error: result.error.message,
          details: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        };
      }
    } catch (error) {
      this.validationStats.invalidOutputs++;
      this.validationStats.rejections.push({
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: output
      });

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate individual intent
   * @param intent - Intent to validate
   * @returns Validation result
   */
  validateIntent(intent: unknown): ValidationResult {
    try {
      const result = AceyIntentSchema.safeParse(intent);

      if (result.success) {
        return {
          valid: true,
          data: result.data
        };
      } else {
        return {
          valid: false,
          error: result.error.message,
          details: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate memory proposal specifically
   * @param proposal - Memory proposal to validate
   * @returns Validation result
   */
  validateMemoryProposal(proposal: unknown): ValidationResult {
    try {
      const result = MemoryProposalSchema.safeParse(proposal);

      if (result.success) {
        return {
          valid: true,
          data: result.data
        };
      } else {
        return {
          valid: false,
          error: result.error.message,
          details: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate trust signal specifically
   * @param signal - Trust signal to validate
   * @returns Validation result
   */
  validateTrustSignal(signal: unknown): ValidationResult {
    try {
      const result = TrustSignalSchema.safeParse(signal);

      if (result.success) {
        return {
          valid: true,
          data: result.data
        };
      } else {
        return {
          valid: false,
          error: result.error.message,
          details: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get validation statistics
   * @returns Validation statistics
   */
  getValidationStats() {
    return {
      ...this.validationStats,
      validityRate: this.validationStats.totalValidations > 0 ? 
        this.validationStats.validOutputs / this.validationStats.totalValidations : 0,
      rejectionRate: this.validationStats.totalValidations > 0 ? 
        this.validationStats.invalidOutputs / this.validationStats.totalValidations : 0
    };
  }

  /**
   * Get recent rejections
   * @param limit - Maximum rejections to return
   * @returns Recent rejections
   */
  getRecentRejections(limit = 10) {
    return this.validationStats.rejections
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Reset validation statistics
   */
  resetStats() {
    this.validationStats = {
      totalValidations: 0,
      validOutputs: 0,
      invalidOutputs: 0,
      rejections: []
    };
  }

  /**
   * Export validation data
   * @param format - Export format
   * @returns Exported data
   */
  exportValidationData(format = 'json') {
    const data = {
      stats: this.getValidationStats(),
      recentRejections: this.getRecentRejections(50),
      exportedAt: Date.now()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

// ===== SINGLETON VALIDATOR INSTANCE =====
export const aceyValidator = new AceyValidator();

// ===== HELPER FUNCTIONS =====

/**
 * Quick validation for Acey output
 * @param output - Output to validate
 * @returns True if valid
 */
export function isValidAceyOutput(output: unknown): output is AceyOutput {
  const result = aceyValidator.validateOutput(output);
  return result.valid;
}

/**
 * Quick validation for intent
 * @param intent - Intent to validate
 * @returns True if valid
 */
export function isValidAceyIntent(intent: unknown): intent is AceyIntent {
  const result = aceyValidator.validateIntent(intent);
  return result.valid;
}

/**
 * Validate and sanitize output
 * @param output - Output to validate and sanitize
 * @returns Validated and sanitized output or null
 */
export function validateAndSanitizeOutput(output: unknown): AceyOutput | null {
  const result = aceyValidator.validateOutput(output);
  return result.valid ? result.data : null;
}

/**
 * Get validation error details
 * @param output - Output that failed validation
 * @returns Detailed error information
 */
export function getValidationError(output: unknown): string | null {
  const result = aceyValidator.validateOutput(output);
  return result.valid ? null : result.error;
}
