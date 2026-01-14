// File: src/server/utils/longTermGoals.ts

export type LongTermGoal = {
  goalId: string;
  description: string;
  supportingSignals: string[];
  confidence: number;
  horizon: "short" | "medium" | "long";
  lastUpdated: number;
  contexts: string[]; // Where this goal was observed
  outcomes: {
    positive: number;
    negative: number;
    neutral: number;
  };
};

export type GoalSignal = {
  signalId: string;
  context: string;
  objective: string;
  timestamp: number;
  outcome?: "positive" | "negative" | "neutral";
  confidence: number;
};

class LongTermGoalManager {
  private static goals: Map<string, LongTermGoal> = new Map();
  private static signals: Map<string, GoalSignal[]> = new Map();
  
  // Emergence thresholds
  private static readonly EMERGENCE_THRESHOLD = {
    minContexts: 3,        // Must appear in 3+ contexts
    minConfidence: 0.7,    // Average confidence > 70%
    minSignals: 5,         // Minimum supporting signals
    positiveBias: 0.6      // 60%+ positive outcomes
  };

  /**
   * Record a potential goal signal
   */
  static recordSignal(signal: Omit<GoalSignal, "signalId">): string {
    const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullSignal: GoalSignal = { ...signal, signalId };
    
    // Group signals by objective
    const existing = this.signals.get(signal.objective) || [];
    existing.push(fullSignal);
    this.signals.set(signal.objective, existing);
    
    // Check for goal emergence
    this.checkForEmergence(signal.objective);
    
    return signalId;
  }

  /**
   * Check if a goal should emerge from signals
   */
  private static checkForEmergence(objective: string): void {
    const signals = this.signals.get(objective);
    if (!signals || signals.length < this.EMERGENCE_THRESHOLD.minSignals) return;

    // Analyze signals for emergence criteria
    const contexts = new Set(signals.map(s => s.context));
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const outcomes = signals.filter(s => s.outcome);
    
    const positiveCount = outcomes.filter(s => s.outcome === "positive").length;
    const outcomeRatio = outcomes.length > 0 ? positiveCount / outcomes.length : 0;

    // Check emergence criteria
    const shouldEmerge = 
      contexts.size >= this.EMERGENCE_THRESHOLD.minContexts &&
      avgConfidence >= this.EMERGENCE_THRESHOLD.minConfidence &&
      outcomeRatio >= this.EMERGENCE_THRESHOLD.positiveBias;

    if (shouldEmerge) {
      this.emergeGoal(objective, signals);
    }
  }

  /**
   * Create a new long-term goal from signals
   */
  private static emergeGoal(objective: string, signals: GoalSignal[]): void {
    const goalId = `goal_${objective.toLowerCase().replace(/\s+/g, "_")}`;
    
    // Calculate initial confidence
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    
    // Determine horizon based on signal patterns
    const timeSpan = Math.max(...signals.map(s => s.timestamp)) - Math.min(...signals.map(s => s.timestamp));
    const horizon: "short" | "medium" | "long" = 
      timeSpan < 7 * 24 * 60 * 60 * 1000 ? "short" :   // < 1 week
      timeSpan < 30 * 24 * 60 * 60 * 1000 ? "medium" :  // < 1 month
      "long";                                           // > 1 month

    // Count outcomes
    const outcomes = signals.filter(s => s.outcome);
    const positiveCount = outcomes.filter(s => s.outcome === "positive").length;
    const negativeCount = outcomes.filter(s => s.outcome === "negative").length;
    const neutralCount = outcomes.filter(s => s.outcome === "neutral").length;

    const goal: LongTermGoal = {
      goalId,
      description: objective,
      supportingSignals: signals.map(s => s.signalId),
      confidence: avgConfidence,
      horizon,
      lastUpdated: Date.now(),
      contexts: Array.from(new Set(signals.map(s => s.context))),
      outcomes: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };

    this.goals.set(goalId, goal);
    console.log(`🎯 Emerged new long-term goal: ${objective} (confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
  }

  /**
   * Update goal outcome
   */
  static updateGoalOutcome(goalId: string, outcome: "positive" | "negative" | "neutral"): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.outcomes[outcome]++;
    goal.lastUpdated = Date.now();
    
    // Recalculate confidence based on outcomes
    const totalOutcomes = goal.outcomes.positive + goal.outcomes.negative + goal.outcomes.neutral;
    const outcomeRatio = totalOutcomes > 0 ? goal.outcomes.positive / totalOutcomes : 0;
    
    // Adjust confidence based on outcomes
    goal.confidence = Math.max(0.1, Math.min(0.99, goal.confidence * (0.5 + outcomeRatio)));
    
    console.log(`📈 Updated goal ${goalId}: ${outcome} outcome (confidence: ${(goal.confidence * 100).toFixed(1)}%)`);
  }

  /**
   * Get all active goals
   */
  static getActiveGoals(): LongTermGoal[] {
    return Array.from(this.goals.values()).filter(goal => goal.confidence > 0.5);
  }

  /**
   * Get goals by horizon
   */
  static getGoalsByHorizon(horizon: LongTermGoal["horizon"]): LongTermGoal[] {
    return this.getActiveGoals().filter(goal => goal.horizon === horizon);
  }

  /**
   * Get top goals by confidence
   */
  static getTopGoals(limit: number = 10): LongTermGoal[] {
    return this.getActiveGoals()
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Check if an action aligns with long-term goals
   */
  static checkGoalAlignment(action: string, context: string): {
    aligned: boolean;
    supportingGoals: string[];
    conflictingGoals: string[];
    alignmentScore: number;
  } {
    const activeGoals = this.getActiveGoals();
    const supportingGoals: string[] = [];
    const conflictingGoals: string[] = [];
    
    let alignmentScore = 0;
    let totalWeight = 0;

    activeGoals.forEach(goal => {
      // Simple keyword matching for goal alignment
      const goalKeywords = goal.description.toLowerCase().split(/\s+/);
      const actionKeywords = action.toLowerCase().split(/\s+/);
      
      const matches = goalKeywords.filter(keyword => 
        actionKeywords.some(actionKeyword => actionKeyword.includes(keyword))
      ).length;
      
      if (matches > 0) {
        supportingGoals.push(goal.goalId);
        alignmentScore += goal.confidence * matches;
        totalWeight += matches;
      } else if (goal.contexts.includes(context)) {
        // If in same context but no keyword match, potential conflict
        conflictingGoals.push(goal.goalId);
      }
    });

    const finalScore = totalWeight > 0 ? alignmentScore / totalWeight : 0;

    return {
      aligned: supportingGoals.length > 0 && conflictingGoals.length === 0,
      supportingGoals,
      conflictingGoals,
      alignmentScore: finalScore
    };
  }

  /**
   * Get goal statistics
   */
  static getGoalStats(): {
    totalGoals: number;
    activeGoals: number;
    byHorizon: Record<LongTermGoal["horizon"], number>;
    avgConfidence: number;
    topContexts: Array<{ context: string; count: number }>;
  } {
    const allGoals = Array.from(this.goals.values());
    const activeGoals = this.getActiveGoals();
    
    const byHorizon = {
      short: activeGoals.filter(g => g.horizon === "short").length,
      medium: activeGoals.filter(g => g.horizon === "medium").length,
      long: activeGoals.filter(g => g.horizon === "long").length
    };

    const avgConfidence = activeGoals.length > 0 
      ? activeGoals.reduce((sum, g) => sum + g.confidence, 0) / activeGoals.length
      : 0;

    // Count contexts
    const contextCounts: Record<string, number> = {};
    activeGoals.forEach(goal => {
      goal.contexts.forEach(context => {
        contextCounts[context] = (contextCounts[context] || 0) + 1;
      });
    });

    const topContexts = Object.entries(contextCounts)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalGoals: allGoals.length,
      activeGoals: activeGoals.length,
      byHorizon,
      avgConfidence,
      topContexts
    };
  }

  /**
   * Prune low-confidence goals
   */
  static pruneGoals(): string[] {
    const pruned: string[] = [];
    
    this.goals.forEach((goal, goalId) => {
      if (goal.confidence < 0.3) {
        this.goals.delete(goalId);
        pruned.push(goalId);
      }
    });

    return pruned;
  }

  /**
   * Get goal evolution history
   */
  static getGoalEvolution(goalId: string): {
    created: number;
    updates: number;
    outcomeHistory: Array<{ type: string; timestamp: number }>;
  } | null {
    const goal = this.goals.get(goalId);
    if (!goal) return null;

    const totalOutcomes = goal.outcomes.positive + goal.outcomes.negative + goal.outcomes.neutral;
    
    return {
      created: goal.lastUpdated - (totalOutcomes * 1000), // Estimate creation time
      updates: totalOutcomes,
      outcomeHistory: [] // Would need to store actual history in production
    };
  }
}

export { LongTermGoalManager };
