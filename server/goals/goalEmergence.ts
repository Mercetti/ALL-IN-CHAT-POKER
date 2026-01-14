/**
 * Long-Term Goal Emergence System
 * Acey develops persistent objectives over time through evidence-based learning
 */

export type GoalHorizon = "short" | "medium" | "long";
export type GoalStatus = "emerging" | "active" | "achieved" | "deprecated";

export interface LongTermGoal {
  goalId: string;
  description: string;
  supportingSignals: string[];
  confidence: number; // 0-1
  horizon: GoalHorizon;
  status: GoalStatus;
  lastUpdated: number;
  createdAt: number;
  contexts: string[]; // Where this goal was observed
  evidenceCount: number;
  successMetrics: string[];
  priority: number; // 0-1
}

export interface GoalSignal {
  signalId: string;
  type: string;
  description: string;
  context: string;
  timestamp: number;
  strength: number; // 0-1
  relatedGoalId?: string;
}

export interface GoalEvidence {
  evidenceId: string;
  goalId: string;
  context: string;
  outcome: "positive" | "negative" | "neutral";
  impact: number; // 0-1
  timestamp: number;
  description: string;
}

export interface GoalPattern {
  patternId: string;
  description: string;
  contexts: string[];
  frequency: number;
  avgImpact: number;
  lastObserved: number;
}

class GoalEmergenceManager {
  private goals: Map<string, LongTermGoal> = new Map();
  private signals: Map<string, GoalSignal> = new Map();
  private evidence: Map<string, GoalEvidence> = new Map();
  private patterns: Map<string, GoalPattern> = new Map();
  private storagePath: string;

  // Configuration
  private readonly PROMOTION_THRESHOLD = 3; // Minimum contexts for promotion
  private readonly CONFIDENCE_THRESHOLD = 0.7; // Minimum confidence for active goal
  private readonly EVIDENCE_DECAY_RATE = 0.01; // How quickly evidence decays
  private readonly PATTERN_MIN_FREQUENCY = 5; // Minimum frequency for pattern recognition

  constructor(storagePath: string = './data/long-term-goals.json') {
    this.storagePath = storagePath;
    this.loadGoals();
  }

  /**
   * Process a signal that might indicate a goal
   */
  processSignal(signalData: Omit<GoalSignal, 'signalId'>): string {
    const signalId = this.generateSignalId();
    const signal: GoalSignal = {
      ...signalData,
      signalId
    };

    this.signals.set(signalId, signal);

    // Check if this signal matches existing patterns
    const matchingPatterns = this.findMatchingPatterns(signal);
    
    // Check if this suggests a new goal
    this.analyzeForGoalEmergence(signal, matchingPatterns);

    // Update patterns
    this.updatePatterns(signal);

    this.saveGoals();
    return signalId;
  }

  /**
   * Add evidence for or against a goal
   */
  addEvidence(evidence: Omit<GoalEvidence, 'evidenceId'>): string {
    const evidenceId = this.generateEvidenceId();
    const fullEvidence: GoalEvidence = {
      ...evidence,
      evidenceId
    };

    this.evidence.set(evidenceId, fullEvidence);
    this.updateGoalFromEvidence(fullEvidence);
    this.saveGoals();

    return evidenceId;
  }

  /**
   * Analyze signal for potential goal emergence
   */
  private analyzeForGoalEmergence(signal: GoalSignal, patterns: GoalPattern[]): void {
    // Look for recurring patterns across contexts
    const similarSignals = this.findSimilarSignals(signal);
    
    if (similarSignals.length >= this.PROMOTION_THRESHOLD - 1) {
      // Check if this represents a new goal
      const contexts = [...new Set([signal.context, ...similarSignals.map(s => s.context)])];
      
      if (contexts.length >= this.PROMOTION_THRESHOLD) {
        const potentialGoal = this.createGoalFromSignal(signal, contexts);
        if (potentialGoal) {
          this.goals.set(potentialGoal.goalId, potentialGoal);
          console.log(`New goal emerged: ${potentialGoal.description}`);
        }
      }
    }
  }

  /**
   * Create a goal from a signal and contexts
   */
  private createGoalFromSignal(signal: GoalSignal, contexts: string[]): LongTermGoal | null {
    const goalDescription = this.abstractGoalDescription(signal, contexts);
    const horizon = this.determineGoalHorizon(signal, contexts);
    const priority = this.calculateGoalPriority(signal, contexts);

    return {
      goalId: this.generateGoalId(),
      description: goalDescription,
      supportingSignals: [signal.signalId],
      confidence: signal.strength * 0.5, // Start with lower confidence
      horizon,
      status: "emerging",
      lastUpdated: Date.now(),
      createdAt: Date.now(),
      contexts,
      evidenceCount: 0,
      successMetrics: this.generateSuccessMetrics(goalDescription),
      priority
    };
  }

  /**
   * Abstract goal description from signal
   */
  private abstractGoalDescription(signal: GoalSignal, contexts: string[]): string {
    // Extract common patterns and abstract them
    const signalType = signal.type.toLowerCase();
    const description = signal.description.toLowerCase();

    // Common abstractions
    const abstractions: Record<string, string> = {
      "reduce_error": "Reduce system errors and improve reliability",
      "improve_engagement": "Improve user engagement and satisfaction",
      "optimize_performance": "Optimize system performance and efficiency",
      "enhance_quality": "Enhance output quality and consistency",
      "increase_stability": "Increase system stability and uptime",
      "reduce_latency": "Reduce response time and latency",
      "improve_accuracy": "Improve accuracy and correctness",
      "enhance_experience": "Enhance overall user experience"
    };

    // Find matching abstraction
    for (const [key, value] of Object.entries(abstractions)) {
      if (signalType.includes(key) || description.includes(key)) {
        return value;
      }
    }

    // Fallback: create generic description
    return `Improve ${signalType} across multiple contexts`;
  }

  /**
   * Determine goal horizon based on signal characteristics
   */
  private determineGoalHorizon(signal: GoalSignal, contexts: string[]): GoalHorizon {
    // Long-term goals: appear across many contexts, high strength
    if (contexts.length >= 5 && signal.strength > 0.7) {
      return "long";
    }

    // Medium-term goals: moderate contexts and strength
    if (contexts.length >= 3 && signal.strength > 0.5) {
      return "medium";
    }

    // Short-term goals: limited contexts or lower strength
    return "short";
  }

  /**
   * Calculate goal priority based on impact and frequency
   */
  private calculateGoalPriority(signal: GoalSignal, contexts: string[]): number {
    const contextWeight = Math.min(contexts.length / 10, 1.0);
    const strengthWeight = signal.strength;
    const frequencyWeight = this.calculateSignalFrequency(signal.type) / 10;

    return (contextWeight * 0.4 + strengthWeight * 0.4 + frequencyWeight * 0.2);
  }

  /**
   * Calculate how frequently a signal type occurs
   */
  private calculateSignalFrequency(signalType: string): number {
    return Array.from(this.signals.values())
      .filter(s => s.type === signalType)
      .length;
  }

  /**
   * Generate success metrics for a goal
   */
  private generateSuccessMetrics(goalDescription: string): string[] {
    const metrics: string[] = [];

    if (goalDescription.includes("error")) {
      metrics.push("error_rate", "crash_frequency", "system_stability");
    }

    if (goalDescription.includes("engagement")) {
      metrics.push("user_interaction_rate", "session_duration", "positive_feedback");
    }

    if (goalDescription.includes("performance")) {
      metrics.push("response_time", "throughput", "resource_efficiency");
    }

    if (goalDescription.includes("quality")) {
      metrics.push("output_accuracy", "consistency_score", "user_satisfaction");
    }

    if (goalDescription.includes("latency")) {
      metrics.push("response_time", "processing_speed", "queue_depth");
    }

    // Default metrics if none matched
    if (metrics.length === 0) {
      metrics.push("success_rate", "efficiency_score", "user_satisfaction");
    }

    return metrics;
  }

  /**
   * Find similar signals across different contexts
   */
  private findSimilarSignals(signal: GoalSignal): GoalSignal[] {
    return Array.from(this.signals.values())
      .filter(s => 
        s.signalId !== signal.signalId &&
        s.type === signal.type &&
        s.context !== signal.context &&
        this.calculateSignalSimilarity(signal, s) > 0.7
      );
  }

  /**
   * Calculate similarity between two signals
   */
  private calculateSignalSimilarity(signal1: GoalSignal, signal2: GoalSignal): number {
    // Simple similarity based on type and description
    let similarity = 0;

    if (signal1.type === signal2.type) {
      similarity += 0.5;
    }

    // Check description overlap
    const words1 = signal1.description.toLowerCase().split(/\s+/);
    const words2 = signal2.description.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    const similarityRatio = commonWords.length / Math.max(words1.length, words2.length);
    similarity += similarityRatio * 0.5;

    return similarity;
  }

  /**
   * Find matching patterns for a signal
   */
  private findMatchingPatterns(signal: GoalSignal): GoalPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.contexts.includes(signal.context) &&
        pattern.description.toLowerCase().includes(signal.type.toLowerCase())
      );
  }

  /**
   * Update patterns based on new signal
   */
  private updatePatterns(signal: GoalSignal): void {
    const patternKey = `${signal.type}_${signal.context}`;
    let pattern = this.patterns.get(patternKey);

    if (!pattern) {
      pattern = {
        patternId: this.generatePatternId(),
        description: `${signal.type} in ${signal.context}`,
        contexts: [signal.context],
        frequency: 1,
        avgImpact: signal.strength,
        lastObserved: signal.timestamp
      };
      this.patterns.set(patternKey, pattern);
    } else {
      pattern.frequency++;
      pattern.avgImpact = (pattern.avgImpact * (pattern.frequency - 1) + signal.strength) / pattern.frequency;
      pattern.lastObserved = signal.timestamp;
    }
  }

  /**
   * Update goal based on new evidence
   */
  private updateGoalFromEvidence(evidence: GoalEvidence): void {
    const goal = this.goals.get(evidence.goalId);
    if (!goal) return;

    goal.evidenceCount++;
    goal.lastUpdated = Date.now();

    // Update confidence based on evidence
    const evidenceWeight = evidence.impact * 0.1;
    if (evidence.outcome === "positive") {
      goal.confidence = Math.min(goal.confidence + evidenceWeight, 1.0);
    } else if (evidence.outcome === "negative") {
      goal.confidence = Math.max(goal.confidence - evidenceWeight, 0.0);
    }

    // Update status based on confidence
    if (goal.confidence >= this.CONFIDENCE_THRESHOLD && goal.status === "emerging") {
      goal.status = "active";
      console.log(`Goal promoted to active: ${goal.description}`);
    } else if (goal.confidence < 0.3 && goal.status === "active") {
      goal.status = "emerging";
    }

    // Update priority based on recent evidence
    this.updateGoalPriority(goal, evidence);
  }

  /**
   * Update goal priority based on evidence
   */
  private updateGoalPriority(goal: LongTermGoal, evidence: GoalEvidence): void {
    const recentEvidence = this.getRecentEvidence(goal.goalId, 10);
    const positiveImpact = recentEvidence
      .filter(e => e.outcome === "positive")
      .reduce((sum, e) => sum + e.impact, 0);
    
    const negativeImpact = recentEvidence
      .filter(e => e.outcome === "negative")
      .reduce((sum, e) => sum + e.impact, 0);

    const netImpact = positiveImpact - negativeImpact;
    goal.priority = Math.max(0, Math.min(1, goal.priority + netImpact * 0.1));
  }

  /**
   * Get recent evidence for a goal
   */
  private getRecentEvidence(goalId: string, limit: number): GoalEvidence[] {
    return Array.from(this.evidence.values())
      .filter(e => e.goalId === goalId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get active goals by priority
   */
  getActiveGoals(maxGoals: number = 10): LongTermGoal[] {
    return Array.from(this.goals.values())
      .filter(goal => goal.status === "active")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxGoals);
  }

  /**
   * Get emerging goals
   */
  getEmergingGoals(): LongTermGoal[] {
    return Array.from(this.goals.values())
      .filter(goal => goal.status === "emerging")
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get goals by horizon
   */
  getGoalsByHorizon(horizon: GoalHorizon): LongTermGoal[] {
    return Array.from(this.goals.values())
      .filter(goal => goal.horizon === horizon && goal.status === "active")
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if an action aligns with active goals
   */
  checkGoalAlignment(actionType: string, context: string): {
    aligned: boolean;
    alignedGoals: LongTermGoal[];
    conflictingGoals: LongTermGoal[];
    alignmentScore: number;
  } {
    const activeGoals = this.getActiveGoals();
    const alignedGoals: LongTermGoal[] = [];
    const conflictingGoals: LongTermGoal[] = [];

    for (const goal of activeGoals) {
      const alignment = this.calculateActionGoalAlignment(actionType, context, goal);
      
      if (alignment > 0.5) {
        alignedGoals.push(goal);
      } else if (alignment < -0.5) {
        conflictingGoals.push(goal);
      }
    }

    const alignmentScore = alignedGoals.length > 0 
      ? alignedGoals.reduce((sum, g) => sum + g.priority, 0) / alignedGoals.length
      : 0;

    return {
      aligned: alignedGoals.length > conflictingGoals.length,
      alignedGoals,
      conflictingGoals,
      alignmentScore
    };
  }

  /**
   * Calculate alignment between action and goal
   */
  private calculateActionGoalAlignment(actionType: string, context: string, goal: LongTermGoal): number {
    let alignment = 0;

    // Check if action type relates to goal description
    const actionWords = actionType.toLowerCase().split(/\s+/);
    const goalWords = goal.description.toLowerCase().split(/\s+/);
    const commonWords = actionWords.filter(word => goalWords.includes(word));
    
    if (commonWords.length > 0) {
      alignment += commonWords.length / Math.max(actionWords.length, goalWords.length);
    }

    // Check if context matches goal contexts
    if (goal.contexts.some(c => context.includes(c))) {
      alignment += 0.3;
    }

    // Weight by goal priority
    alignment *= goal.priority;

    return alignment;
  }

  /**
   * Get goal statistics
   */
  getGoalStats(): {
    totalGoals: number;
    emergingGoals: number;
    activeGoals: number;
    achievedGoals: number;
    deprecatedGoals: number;
    averageConfidence: number;
    goalsByHorizon: Record<GoalHorizon, number>;
    totalEvidence: number;
    totalSignals: number;
    recognizedPatterns: number;
  } {
    const goals = Array.from(this.goals.values());
    
    const goalsByHorizon = goals.reduce((acc, goal) => {
      acc[goal.horizon] = (acc[goal.horizon] || 0) + 1;
      return acc;
    }, {} as Record<GoalHorizon, number>);

    const averageConfidence = goals.length > 0
      ? goals.reduce((sum, g) => sum + g.confidence, 0) / goals.length
      : 0;

    return {
      totalGoals: goals.length,
      emergingGoals: goals.filter(g => g.status === "emerging").length,
      activeGoals: goals.filter(g => g.status === "active").length,
      achievedGoals: goals.filter(g => g.status === "achieved").length,
      deprecatedGoals: goals.filter(g => g.status === "deprecated").length,
      averageConfidence,
      goalsByHorizon,
      totalEvidence: this.evidence.size,
      totalSignals: this.signals.size,
      recognizedPatterns: this.patterns.size
    };
  }

  /**
   * Save goals to disk
   */
  private saveGoals(): void {
    try {
      const fs = require('fs');
      const data = {
        goals: Array.from(this.goals.entries()),
        signals: Array.from(this.signals.entries()),
        evidence: Array.from(this.evidence.entries()),
        patterns: Array.from(this.patterns.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }

  /**
   * Load goals from disk
   */
  private loadGoals(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.goals = new Map(data.goals || []);
        this.signals = new Map(data.signals || []);
        this.evidence = new Map(data.evidence || []);
        this.patterns = new Map(data.patterns || []);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  private generateGoalId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSignalId(): string {
    return `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEvidenceId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { GoalEmergenceManager };
