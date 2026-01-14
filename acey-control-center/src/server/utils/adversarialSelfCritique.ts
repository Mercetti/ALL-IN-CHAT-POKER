// File: src/server/utils/adversarialSelfCritique.ts

/**
 * Adversarial Self-Critique System
 * Acey actively tries to prove herself wrong with hostile analysis
 */

export type SelfCritique = {
  targetOutputId: string;
  identifiedFlaws: string[];
  severity: number; // 0–1
  suggestedCorrection?: string;
  critiqueTimestamp: number;
  critiqueType: 'logic' | 'factual' | 'safety' | 'efficiency' | 'completeness';
  confidence: number;
};

export type CritiqueTrigger = {
  type: 'low_consensus' | 'high_hallucination' | 'failed_eval' | 'user_reaction' | 'auto_trigger';
  threshold: number;
  currentValue: number;
  context: any;
};

export type CritiqueResult = {
  critique: SelfCritique;
  action: 'accept' | 'reject' | 'revise' | 'escalate';
  reasoning: string;
  requiresHumanApproval: boolean;
  blockedFromLearning: boolean;
};

export type CritiqueConfig = {
  severityThreshold: number;
  autoEscalateThreshold: number;
  maxCritiquesPerOutput: number;
  critiqueTimeoutMs: number;
  enableHostileMode: boolean;
  learningBlockThreshold: number;
};

/**
 * Adversarial Self-Critique Manager
 */
export class AdversarialSelfCritiqueManager {
  private config: CritiqueConfig;
  private critiqueHistory: SelfCritique[] = [];
  private blockedOutputs: Set<string> = new Set();
  private critiqueStats: {
    totalCritiques: number;
    avgSeverity: number;
    blockRate: number;
    revisionRate: number;
    escalationRate: number;
  } = {
    totalCritiques: 0,
    avgSeverity: 0,
    blockRate: 0,
    revisionRate: 0,
    escalationRate: 0
  };

  constructor(config?: Partial<CritiqueConfig>) {
    this.config = {
      severityThreshold: 0.7,
      autoEscalateThreshold: 0.8,
      maxCritiquesPerOutput: 3,
      critiqueTimeoutMs: 10000,
      enableHostileMode: true,
      learningBlockThreshold: 0.7,
      ...config
    };
  }

  /**
   * Perform adversarial self-critique on an output
   */
  public async critiqueOutput(
    outputId: string,
    output: any,
    context: any,
    triggers: CritiqueTrigger[] = []
  ): Promise<CritiqueResult> {
    console.log(`[SelfCritique] Starting adversarial critique for output ${outputId}`);

    // Check if output is already blocked
    if (this.blockedOutputs.has(outputId)) {
      return {
        critique: this.createBlockedCritique(outputId),
        action: 'reject',
        reasoning: 'Output previously blocked due to severe critique',
        requiresHumanApproval: true,
        blockedFromLearning: true
      };
    }

    // Determine if critique should be triggered
    const shouldCritique = this.shouldTriggerCritique(triggers);
    if (!shouldCritique) {
      return {
        critique: this.createEmptyCritique(outputId),
        action: 'accept',
        reasoning: 'No critique triggers detected',
        requiresHumanApproval: false,
        blockedFromLearning: false
      };
    }

    // Perform hostile analysis
    const critique = await this.performHostileCritique(outputId, output, context);
    
    // Store critique
    this.critiqueHistory.push(critique);
    this.updateStats(critique);

    // Determine action based on severity
    const result = this.determineCritiqueAction(critique);

    // Block severe critiques from learning
    if (critique.severity >= this.config.learningBlockThreshold) {
      this.blockedOutputs.add(outputId);
      result.blockedFromLearning = true;
    }

    console.log(`[SelfCritique] Critique completed: severity=${critique.severity.toFixed(2)}, action=${result.action}`);

    return result;
  }

  /**
   * Determine if critique should be triggered
   */
  private shouldTriggerCritique(triggers: CritiqueTrigger[]): boolean {
    if (triggers.length === 0) return false;

    return triggers.some(trigger => {
      switch (trigger.type) {
        case 'low_consensus':
          return trigger.currentValue < 0.65;
        case 'high_hallucination':
          return trigger.currentValue > 0.8;
        case 'failed_eval':
          return trigger.currentValue > 0.5;
        case 'user_reaction':
          return trigger.currentValue < 0.3; // Negative user reaction
        case 'auto_trigger':
          return Math.random() < 0.1; // 10% random critique for robustness
        default:
          return false;
      }
    });
  }

  /**
   * Perform hostile analysis on the output
   */
  private async performHostileCritique(
    outputId: string,
    output: any,
    context: any
  ): Promise<SelfCritique> {
    const flaws: string[] = [];
    let severity = 0;
    let critiqueType: SelfCritique['critiqueType'] = 'logic';
    let suggestedCorrection: string | undefined;

    // Hostile analysis logic - actively look for problems
    if (this.config.enableHostileMode) {
      // Logic flaws
      const logicFlaws = this.analyzeLogicFlaws(output, context);
      flaws.push(...logicFlaws);
      severity += logicFlaws.length * 0.2;

      // Factual accuracy issues
      const factualFlaws = this.analyzeFactualFlaws(output, context);
      flaws.push(...factualFlaws);
      severity += factualFlaws.length * 0.3;

      // Safety concerns
      const safetyFlaws = this.analyzeSafetyFlaws(output, context);
      flaws.push(...safetyFlaws);
      severity += safetyFlaws.length * 0.4;

      // Efficiency problems
      const efficiencyFlaws = this.analyzeEfficiencyFlaws(output, context);
      flaws.push(...efficiencyFlaws);
      severity += efficiencyFlaws.length * 0.1;

      // Completeness issues
      const completenessFlaws = this.analyzeCompletenessFlaws(output, context);
      flaws.push(...completenessFlaws);
      severity += completenessFlaws.length * 0.15;

      // Determine primary critique type
      critiqueType = this.determinePrimaryCritiqueType(logicFlaws, factualFlaws, safetyFlaws, efficiencyFlaws, completenessFlaws);

      // Generate suggested correction for high severity
      if (severity > 0.6) {
        suggestedCorrection = this.generateCorrection(output, flaws, critiqueType);
      }
    }

    // Cap severity at 1.0
    severity = Math.min(1.0, severity);

    return {
      targetOutputId: outputId,
      identifiedFlaws: flaws,
      severity,
      suggestedCorrection,
      critiqueTimestamp: Date.now(),
      critiqueType,
      confidence: Math.max(0.3, 1.0 - severity) // Lower confidence for higher severity
    };
  }

  /**
   * Analyze logic flaws in the output
   */
  private analyzeLogicFlaws(output: any, context: any): string[] {
    const flaws: string[] = [];
    const text = output.speech || output.content || '';

    // Check for logical contradictions
    if (text.includes('but') && text.includes('however')) {
      const sentences = text.split('.').filter((s: string) => s.trim());
      for (let i = 0; i < sentences.length - 1; i++) {
        if (sentences[i].includes('always') && sentences[i + 1].includes('never')) {
          flaws.push('Logical contradiction: always vs never statements');
        }
      }
    }

    // Check for circular reasoning
    if (text.includes('because') && text.split('because').length > 2) {
      flaws.push('Potential circular reasoning detected');
    }

    // Check for unsupported claims
    if (text.includes('definitely') || text.includes('certainly')) {
      flaws.push('Unsupported absolute certainty in claim');
    }

    return flaws;
  }

  /**
   * Analyze factual accuracy issues
   */
  private analyzeFactualFlaws(output: any, context: any): string[] {
    const flaws: string[] = [];
    const text = output.speech || output.content || '';

    // Check for numerical inconsistencies
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 1) {
      const uniqueNumbers = new Set(numbers);
      if (uniqueNumbers.size < numbers.length) {
        flaws.push('Repeated numerical values may indicate inconsistency');
      }
    }

    // Check for temporal inconsistencies
    if (text.includes('yesterday') && text.includes('tomorrow')) {
      flaws.push('Temporal inconsistency: references to both yesterday and tomorrow');
    }

    // Check for vague quantifiers
    if (text.includes('many') || text.includes('few') || text.includes('some')) {
      flaws.push('Vague quantifiers reduce factual precision');
    }

    return flaws;
  }

  /**
   * Analyze safety concerns
   */
  private analyzeSafetyFlaws(output: any, context: any): string[] {
    const flaws: string[] = [];
    const text = output.speech || output.content || '';

    // Check for potentially harmful instructions
    const harmfulPatterns = [
      /delete\s+all/i,
      /remove\s+everything/i,
      /ignore\s+safety/i,
      /bypass\s+security/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(text)) {
        flaws.push(`Potentially harmful instruction detected: ${pattern.source}`);
      }
    }

    // Check for privacy violations
    if (text.includes('password') || text.includes('secret') || text.includes('private key')) {
      flaws.push('Potential privacy violation in output');
    }

    // Check for system manipulation
    if (text.includes('system') && text.includes('modify')) {
      flaws.push('System modification without proper authorization');
    }

    return flaws;
  }

  /**
   * Analyze efficiency problems
   */
  private analyzeEfficiencyFlaws(output: any, context: any): string[] {
    const flaws: string[] = [];
    const text = output.speech || output.content || '';

    // Check for redundant operations
    if (text.split('and').length > 5) {
      flaws.push('Excessive conjunctions may indicate inefficient approach');
    }

    // Check for unnecessary complexity
    const sentences = text.split('.').filter((s: string) => s.trim());
    const avgSentenceLength = sentences.reduce((sum: number, s: string) => sum + s.length, 0) / sentences.length;
    if (avgSentenceLength > 100) {
      flaws.push('Overly complex sentences suggest inefficient communication');
    }

    return flaws;
  }

  /**
   * Analyze completeness issues
   */
  private analyzeCompletenessFlaws(output: any, context: any): string[] {
    const flaws: string[] = [];
    const text = output.speech || output.content || '';

    // Check for incomplete thoughts
    if (text.endsWith('...') || text.endsWith('but')) {
      flaws.push('Incomplete thought or unfinished sentence');
    }

    // Check for missing context
    if (text.length < 50 && !context.isBrief) {
      flaws.push('Output too brief for comprehensive response');
    }

    // Check for missing examples
    if (text.includes('for example') && !text.includes('such as')) {
      flaws.push('Mentioned examples but did not provide them');
    }

    return flaws;
  }

  /**
   * Determine primary critique type
   */
  private determinePrimaryCritiqueType(
    logic: string[],
    factual: string[],
    safety: string[],
    efficiency: string[],
    completeness: string[]
  ): SelfCritique['critiqueType'] {
    const counts = {
      logic: logic.length,
      factual: factual.length,
      safety: safety.length,
      efficiency: efficiency.length,
      completeness: completeness.length
    };

    const maxType = Object.entries(counts).reduce((max, [type, count]) => 
      count > max[1] ? [type, count] : max
    , ['', 0]);

    return maxType[0] as SelfCritique['critiqueType'];
  }

  /**
   * Generate correction suggestions
   */
  private generateCorrection(
    output: any,
    flaws: string[],
    critiqueType: SelfCritique['critiqueType']
  ): string {
    const corrections: Record<SelfCritique['critiqueType'], string> = {
      logic: 'Review logical flow and remove contradictions',
      factual: 'Verify all facts and provide supporting evidence',
      safety: 'Remove harmful content and add safety considerations',
      efficiency: 'Simplify and streamline the approach',
      completeness: 'Add missing details and complete thoughts'
    };

    return `Suggested correction: ${corrections[critiqueType]}. Address identified flaws: ${flaws.slice(0, 3).join(', ')}`;
  }

  /**
   * Determine action based on critique severity
   */
  private determineCritiqueAction(critique: SelfCritique): CritiqueResult {
    if (critique.severity >= this.config.autoEscalateThreshold) {
      return {
        critique,
        action: 'escalate',
        reasoning: `Severe issues detected (severity: ${critique.severity.toFixed(2)})`,
        requiresHumanApproval: true,
        blockedFromLearning: true
      };
    }

    if (critique.severity >= this.config.severityThreshold) {
      return {
        critique,
        action: 'revise',
        reasoning: `Significant issues require revision (severity: ${critique.severity.toFixed(2)})`,
        requiresHumanApproval: critique.severity > 0.8,
        blockedFromLearning: false
      };
    }

    if (critique.severity > 0.4) {
      return {
        critique,
        action: 'reject',
        reasoning: `Moderate issues detected (severity: ${critique.severity.toFixed(2)})`,
        requiresHumanApproval: false,
        blockedFromLearning: false
      };
    }

    return {
      critique,
      action: 'accept',
      reasoning: `Minor issues within acceptable range (severity: ${critique.severity.toFixed(2)})`,
      requiresHumanApproval: false,
      blockedFromLearning: false
    };
  }

  /**
   * Create blocked critique
   */
  private createBlockedCritique(outputId: string): SelfCritique {
    return {
      targetOutputId: outputId,
      identifiedFlaws: ['Previously blocked due to severe critique'],
      severity: 1.0,
      critiqueTimestamp: Date.now(),
      critiqueType: 'safety',
      confidence: 0.9
    };
  }

  /**
   * Create empty critique
   */
  private createEmptyCritique(outputId: string): SelfCritique {
    return {
      targetOutputId: outputId,
      identifiedFlaws: [],
      severity: 0,
      critiqueTimestamp: Date.now(),
      critiqueType: 'logic',
      confidence: 1.0
    };
  }

  /**
   * Update critique statistics
   */
  private updateStats(critique: SelfCritique): void {
    this.critiqueStats.totalCritiques++;
    
    const totalSeverity = this.critiqueStats.avgSeverity * (this.critiqueStats.totalCritiques - 1) + critique.severity;
    this.critiqueStats.avgSeverity = totalSeverity / this.critiqueStats.totalCritiques;

    // Update action rates (simplified)
    if (critique.severity >= this.config.learningBlockThreshold) {
      this.critiqueStats.blockRate = (this.critiqueStats.blockRate * (this.critiqueStats.totalCritiques - 1) + 1) / this.critiqueStats.totalCritiques;
    }
  }

  /**
   * Get critique statistics
   */
  public getCritiqueStatistics(): typeof this.critiqueStats & {
    blockedOutputsCount: number;
    critiqueHistorySize: number;
    avgFlawsPerCritique: number;
  } {
    const avgFlawsPerCritique = this.critiqueHistory.length > 0
      ? this.critiqueHistory.reduce((sum, c) => sum + c.identifiedFlaws.length, 0) / this.critiqueHistory.length
      : 0;

    return {
      ...this.critiqueStats,
      blockedOutputsCount: this.blockedOutputs.size,
      critiqueHistorySize: this.critiqueHistory.length,
      avgFlawsPerCritique
    };
  }

  /**
   * Get critique history
   */
  public getCritiqueHistory(limit: number = 100): SelfCritique[] {
    return this.critiqueHistory.slice(-limit);
  }

  /**
   * Unblock an output
   */
  public unblockOutput(outputId: string): boolean {
    return this.blockedOutputs.delete(outputId);
  }

  /**
   * Clear history and blocked outputs
   */
  public clearAll(): void {
    this.critiqueHistory = [];
    this.blockedOutputs.clear();
    this.critiqueStats = {
      totalCritiques: 0,
      avgSeverity: 0,
      blockRate: 0,
      revisionRate: 0,
      escalationRate: 0
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CritiqueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// LLM Rule Integration
export const ADVERSARIAL_SELF_CRITIQUE_RULES = {
  HOSTILE_ANALYSIS: 'Actively search for weaknesses, edge cases, and incorrect assumptions',
  OVERLY_CRITICAL: 'Prefer being overly critical to being permissive',
  ENFORCEMENT_RULE: 'If severity > 0.7: Block learning, Require correction or human approval',
  CRITIQUE_TRIGGERS: [
    'Low debate consensus',
    'High hallucination score',
    'Failed eval suite',
    'Unexpected user or chat reaction'
  ]
};
