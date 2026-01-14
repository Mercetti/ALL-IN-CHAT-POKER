// File: src/server/utils/goalConflictResolution.ts

/**
 * Goal Conflict Resolution Engines
 * Acey resolves conflicting long-term goals rationally
 */

export type Goal = {
  goalId: string;
  description: string;
  priority: number; // 0–1
  category: "safety" | "performance" | "user_experience" | "efficiency" | "innovation" | "compliance";
  shortTerm: string;
  longTerm: string;
  metrics: {
    currentValue: number;
    targetValue: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  constraints: string[];
  dependencies: string[];
  createdAt: number;
  lastUpdated: number;
};

export type GoalConflict = {
  conflictId: string;
  goalA: string;
  goalB: string;
  conflictType: "resource" | "ethical" | "temporal" | "priority";
  severity: number; // 0–1
  description: string;
  detectedAt: number;
  status: "active" | "resolved" | "deferred";
};

export type ConflictResolution = {
  conflictId: string;
  chosenGoal: string;
  deferredGoal?: string;
  resolutionStrategy: "prioritize" | "balance" | "sequence" | "modify" | "merge";
  rationale: string;
  impact: {
    onChosenGoal: number;
    onDeferredGoal: number;
    overall: number;
  };
  ethicalConsiderations: string[];
  governanceConstraints: string[];
  humanAuthorityRequired: boolean;
  resolvedAt: number;
  expiresAt?: number;
};

export type ResolutionConfig = {
  enableAutoResolution: boolean;
  ethicalWeight: number;
  governanceWeight: number;
  humanWeight: number;
  performanceWeight: number;
  conflictTimeoutMs: number;
  enableHistoricalLearning: boolean;
  strictEthicalMode: boolean;
};

/**
 * Goal Conflict Resolution Manager
 */
export class GoalConflictResolutionManager {
  private goals: Map<string, Goal> = new Map();
  private conflicts: Map<string, GoalConflict> = new Map();
  private resolutions: Map<string, ConflictResolution> = new Map();
  private config: ResolutionConfig;
  private resolutionHistory: ConflictResolution[] = [];
  private conflictPatterns: Map<string, number> = new Map();

  constructor(config?: Partial<ResolutionConfig>) {
    this.config = {
      enableAutoResolution: true,
      ethicalWeight: 0.4,
      governanceWeight: 0.3,
      humanWeight: 0.2,
      performanceWeight: 0.1,
      conflictTimeoutMs: 300000, // 5 minutes
      enableHistoricalLearning: true,
      strictEthicalMode: true,
      ...config
    };

    this.initializeDefaultGoals();
    this.startConflictMonitoring();
  }

  /**
   * Initialize default goals
   */
  private initializeDefaultGoals(): void {
    const defaultGoals: Goal[] = [
      {
        goalId: "safety_first",
        description: "Maintain highest safety standards in all operations",
        priority: 1.0,
        category: "safety",
        shortTerm: "No safety incidents",
        longTerm: "Zero tolerance for safety violations",
        metrics: {
          currentValue: 0.95,
          targetValue: 1.0,
          trend: "increasing"
        },
        constraints: ["Never compromise safety", "Always prioritize safety"],
        dependencies: [],
        createdAt: Date.now(),
        lastUpdated: Date.now()
      },
      {
        goalId: "user_satisfaction",
        description: "Maximize user satisfaction and experience quality",
        priority: 0.8,
        category: "user_experience",
        shortTerm: "High user ratings",
        longTerm: "Consistently excellent user experience",
        metrics: {
          currentValue: 0.75,
          targetValue: 0.9,
          trend: "increasing"
        },
        constraints: ["Maintain system stability", "Respect user privacy"],
        dependencies: ["safety_first"],
        createdAt: Date.now(),
        lastUpdated: Date.now()
      },
      {
        goalId: "performance_optimization",
        description: "Optimize system performance and efficiency",
        priority: 0.6,
        category: "performance",
        shortTerm: "Fast response times",
        longTerm: "Optimal resource utilization",
        metrics: {
          currentValue: 0.7,
          targetValue: 0.8,
          trend: "increasing"
        },
        constraints: ["Maintain safety", "Ensure reliability"],
        dependencies: ["safety_first"],
        createdAt: Date.now(),
        lastUpdated: Date.now()
      },
      {
        goalId: "innovation_growth",
        description: "Foster innovation and capability expansion",
        priority: 0.4,
        category: "innovation",
        shortTerm: "New feature development",
        longTerm: "Continuous improvement and adaptation",
        metrics: {
          currentValue: 0.5,
          targetValue: 0.7,
          trend: "increasing"
        },
        constraints: ["Maintain stability", "Ensure safety"],
        dependencies: ["performance_optimization"],
        createdAt: Date.now(),
        lastUpdated: Date.now()
      },
      {
        goalId: "cost_efficiency",
        description: "Minimize computational and operational costs",
        priority: 0.5,
        category: "efficiency",
        shortTerm: "Reduce resource usage",
        longTerm: "Optimal cost-effectiveness",
        metrics: {
          currentValue: 0.6,
          targetValue: 0.8,
          trend: "increasing"
        },
        constraints: ["Maintain quality", "Ensure safety"],
        dependencies: ["performance_optimization"],
        createdAt: Date.now(),
        lastUpdated: Date.now()
      },
      {
        goalId: "compliance_adherence",
        description: "Ensure full compliance with regulations and policies",
        priority: 0.9,
        category: "compliance",
        shortTerm: "No violations",
        longTerm: "Perfect compliance record",
        metrics: {
          currentValue: 0.85,
          targetValue: 1.0,
          trend: "increasing"
        },
        constraints: ["Never violate regulations", "Maintain transparency"],
        dependencies: ["safety_first"],
        createdAt: Date.now(),
        lastUpdated: Date.now()
      }
    ];

    for (const goal of defaultGoals) {
      this.goals.set(goal.goalId, goal);
    }

    console.log(`[GoalConflictResolution] Initialized with ${defaultGoals.length} goals`);
  }

  /**
   * Start conflict monitoring
   */
  private startConflictMonitoring(): void {
    setInterval(() => {
      this.detectConflicts();
    }, 60000); // Check every minute
  }

  /**
   * Detect conflicts between goals
   */
  private detectConflicts(): void {
    const goalArray = Array.from(this.goals.values());
    
    for (let i = 0; i < goalArray.length; i++) {
      for (let j = i + 1; j < goalArray.length; j++) {
        const goalA = goalArray[i];
        const goalB = goalArray[j];
        
        const conflict = this.analyzeGoalConflict(goalA, goalB);
        if (conflict) {
          this.handleConflict(conflict);
        }
      }
    }
  }

  /**
   * Analyze conflict between two goals
   */
  private analyzeGoalConflict(goalA: Goal, goalB: Goal): GoalConflict | null {
    // Check for resource conflicts
    if (this.hasResourceConflict(goalA, goalB)) {
      return {
        conflictId: this.generateConflictId(),
        goalA: goalA.goalId,
        goalB: goalB.goalId,
        conflictType: "resource",
        severity: this.calculateConflictSeverity(goalA, goalB, "resource"),
        description: `Resource conflict between ${goalA.description} and ${goalB.description}`,
        detectedAt: Date.now(),
        status: "active"
      };
    }

    // Check for ethical conflicts
    if (this.hasEthicalConflict(goalA, goalB)) {
      return {
        conflictId: this.generateConflictId(),
        goalA: goalA.goalId,
        goalB: goalB.goalId,
        conflictType: "ethical",
        severity: this.calculateConflictSeverity(goalA, goalB, "ethical"),
        description: `Ethical conflict between ${goalA.description} and ${goalB.description}`,
        detectedAt: Date.now(),
        status: "active"
      };
    }

    // Check for temporal conflicts
    if (this.hasTemporalConflict(goalA, goalB)) {
      return {
        conflictId: this.generateConflictId(),
        goalA: goalA.goalId,
        goalB: goalB.goalId,
        conflictType: "temporal",
        severity: this.calculateConflictSeverity(goalA, goalB, "temporal"),
        description: `Temporal conflict between ${goalA.description} and ${goalB.description}`,
        detectedAt: Date.now(),
        status: "active"
      };
    }

    // Check for priority conflicts
    if (this.hasPriorityConflict(goalA, goalB)) {
      return {
        conflictId: this.generateConflictId(),
        goalA: goalA.goalId,
        goalB: goalB.goalId,
        conflictType: "priority",
        severity: this.calculateConflictSeverity(goalA, goalB, "priority"),
        description: `Priority conflict between ${goalA.description} and ${goalB.description}`,
        detectedAt: Date.now(),
        status: "active"
      };
    }

    return null;
  }

  /**
   * Check for resource conflicts
   */
  private hasResourceConflict(goalA: Goal, goalB: Goal): boolean {
    // Check if goals compete for the same resources
    const resourceCategories = [
      "compute", "memory", "storage", "network", "human_attention"
    ];

    for (const resource of resourceCategories) {
      if (goalA.shortTerm.toLowerCase().includes(resource) && 
          goalB.shortTerm.toLowerCase().includes(resource)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for ethical conflicts
   */
  private hasEthicalConflict(goalA: Goal, goalB: Goal): boolean {
    // Safety vs other goals
    if ((goalA.category === "safety" && goalB.category !== "safety") ||
        (goalB.category === "safety" && goalA.category !== "safety")) {
      return true;
    }

    // Compliance vs innovation
    if ((goalA.category === "compliance" && goalB.category === "innovation") ||
        (goalB.category === "compliance" && goalA.category === "innovation")) {
      return true;
    }

    // Check for opposing constraints
    const hasOpposingConstraints = goalA.constraints.some(constraintA =>
      goalB.constraints.some(constraintB => this.areConstraintsOpposing(constraintA, constraintB))
    );

    return hasOpposingConstraints;
  }

  /**
   * Check if constraints are opposing
   */
  private areConstraintsOpposing(constraintA: string, constraintB: string): boolean {
    const opposingPairs = [
      ["maximize", "minimize"],
      ["increase", "decrease"],
      ["expand", "reduce"],
      ["enable", "disable"],
      ["always", "never"]
    ];

    for (const [wordA, wordB] of opposingPairs) {
      if ((constraintA.toLowerCase().includes(wordA) && constraintB.toLowerCase().includes(wordB)) ||
          (constraintB.toLowerCase().includes(wordA) && constraintA.toLowerCase().includes(wordB))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for temporal conflicts
   */
  private hasTemporalConflict(goalA: Goal, goalB: Goal): boolean {
    // Short-term vs long-term conflicts
    const goalAShortTerm = goalA.shortTerm.toLowerCase().includes("long") || goalA.longTerm.toLowerCase().includes("short");
    const goalBShortTerm = goalB.shortTerm.toLowerCase().includes("long") || goalB.longTerm.toLowerCase().includes("short");

    return goalAShortTerm !== goalBShortTerm;
  }

  /**
   * Check for priority conflicts
   */
  private hasPriorityConflict(goalA: Goal, goalB: Goal): boolean {
    // High priority goals with conflicting requirements
    const highPriorityThreshold = 0.7;
    
    if (goalA.priority > highPriorityThreshold && goalB.priority > highPriorityThreshold) {
      // Check if their requirements conflict
      return this.areConstraintsOpposing(goalA.constraints[0] || "", goalB.constraints[0] || "");
    }

    return false;
  }

  /**
   * Calculate conflict severity
   */
  private calculateConflictSeverity(goalA: Goal, goalB: Goal, conflictType: GoalConflict["conflictType"]): number {
    let severity = 0.5; // Base severity

    // Category-based severity adjustments
    const categorySeverity = {
      safety: 0.9,
      compliance: 0.8,
      ethical: 0.8,
      resource: 0.6,
      temporal: 0.4,
      priority: 0.3
    };

    severity += (categorySeverity[conflictType] || 0.5) - 0.5;

    // Priority-based severity
    const avgPriority = (goalA.priority + goalB.priority) / 2;
    severity += (avgPriority - 0.5) * 0.3;

    // Trend-based severity
    const trendConflict = this.calculateTrendConflict(goalA.metrics.trend, goalB.metrics.trend);
    severity += trendConflict * 0.2;

    return Math.max(0, Math.min(1, severity));
  }

  /**
   * Calculate trend conflict
   */
  private calculateTrendConflict(trendA: Goal["metrics"]["trend"], trendB: Goal["metrics"]["trend"]): number {
    if (trendA === trendB) return 0;
    if ((trendA === "increasing" && trendB === "decreasing") ||
        (trendA === "decreasing" && trendB === "increasing")) {
      return 0.5;
    }
    return 0;
  }

  /**
   * Handle detected conflict
   */
  private handleConflict(conflict: GoalConflict): void {
    const existingConflict = this.conflicts.get(conflict.conflictId);
    
    if (!existingConflict || existingConflict.status !== "active") {
      this.conflicts.set(conflict.conflictId, conflict);
      this.logConflict(conflict, "detected");
      
      // Auto-resolve if enabled
      if (this.config.enableAutoResolution) {
        this.autoResolveConflict(conflict);
      }
    }
  }

  /**
   * Auto-resolve conflict
   */
  private async autoResolveConflict(conflict: GoalConflict): Promise<void> {
    try {
      const resolution = await this.resolveConflict(conflict);
      this.resolutions.set(conflict.conflictId, resolution);
      
      // Update conflict status
      conflict.status = "resolved";
      
      this.logConflict(conflict, "resolved");
      console.log(`[GoalConflict] Auto-resolved conflict: ${conflict.goalA} vs ${conflict.goalB} → ${resolution.chosenGoal}`);
      
    } catch (error) {
      console.error(`[GoalConflict] Auto-resolution failed for conflict ${conflict.conflictId}:`, error);
    }
  }

  /**
   * Resolve conflict between goals
   */
  public async resolveConflict(conflict: GoalConflict): Promise<ConflictResolution> {
    const goalA = this.goals.get(conflict.goalA);
    const goalB = this.goals.get(conflict.goalB);
    
    if (!goalA || !goalB) {
      throw new Error(`Goals not found for conflict ${conflict.conflictId}`);
    }

    console.log(`[GoalConflict] Resolving conflict: ${conflict.goalA} vs ${conflict.goalB}`);

    // Calculate resolution factors
    const factors = this.calculateResolutionFactors(goalA, goalB, conflict);
    
    // Choose resolution strategy
    const strategy = this.chooseResolutionStrategy(factors);
    
    // Execute resolution
    const resolution = await this.executeResolutionStrategy(strategy, conflict, factors);
    
    return resolution;
  }

  /**
   * Calculate resolution factors
   */
  private calculateResolutionFactors(goalA: Goal, goalB: Goal, conflict: GoalConflict): {
    ethicalScoreA: number;
    ethicalScoreB: number;
    governanceScoreA: number;
    governanceScoreB: number;
    performanceScoreA: number;
    performanceScoreB: number;
    humanPreferenceScore: number;
    conflictType: string;
    severity: number;
    priorityA: number;
    priorityB: number;
    trendA: "increasing" | "decreasing" | "stable";
    trendB: "increasing" | "decreasing" | "stable";
  } {
    const ethicalScoreA = this.calculateEthicalScore(goalA);
    const ethicalScoreB = this.calculateEthicalScore(goalB);
    const governanceScoreA = this.calculateGovernanceScore(goalA);
    const governanceScoreB = this.calculateGovernanceScore(goalB);
    const performanceScoreA = this.calculatePerformanceScore(goalA);
    const performanceScoreB = this.calculatePerformanceScore(goalB);
    const humanPreferenceScore = this.calculateHumanPreferenceScore(goalA, goalB);

    return {
      ethicalScoreA,
      ethicalScoreB,
      governanceScoreA,
      governanceScoreB,
      performanceScoreA,
      performanceScoreB,
      humanPreferenceScore,
      conflictType: conflict.conflictType,
      severity: conflict.severity,
      priorityA: goalA.priority,
      priorityB: goalB.priority,
      trendA: goalA.metrics.trend,
      trendB: goalB.metrics.trend
    };
  }

  /**
   * Calculate ethical score for goal
   */
  private calculateEthicalScore(goal: Goal): number {
    const categoryScores = {
      safety: 1.0,
      compliance: 0.9,
      fairness: 0.8,
      transparency: 0.7,
      accountability: 0.6,
      user_experience: 0.5,
      performance: 0.4,
      efficiency: 0.3,
      innovation: 0.2
    };

    return categoryScores[goal.category] || 0.5;
  }

  /**
   * Calculate governance score for goal
   */
  private calculateGovernanceScore(goal: Goal): number {
    let score = 0.5;

    // Compliance and safety get higher scores
    if (goal.category === "compliance") score += 0.3;
    if (goal.category === "safety") score += 0.4;

    // Check constraints for governance alignment
    if (goal.constraints.some(c => c.includes("compliance") || c.includes("governance"))) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate performance score for goal
   */
  private calculatePerformanceScore(goal: Goal): number {
    // Based on current vs target metrics
    const progress = (goal.metrics.currentValue / goal.metrics.targetValue);
    const trendBonus = goal.metrics.trend === "increasing" ? 0.1 : 0;
    
    return Math.min(1.0, progress + trendBonus);
  }

  /**
   * Calculate human preference score
   */
  private calculateHumanPreferenceScore(goalA: Goal, goalB: Goal): number {
    // In a real implementation, this would query human preferences
    // For now, assume slight preference for user experience
    const userExperienceBonusA = goalA.category === "user_experience" ? 0.1 : 0;
    const userExperienceBonusB = goalB.category === "user_experience" ? 0.1 : 0;
    
    return userExperienceBonusA - userExperienceBonusB;
  }

  /**
   * Choose resolution strategy
   */
  private chooseResolutionStrategy(factors: any): ConflictResolution["resolutionStrategy"] {
    const { ethicalScoreA, ethicalScoreB, conflictType, severity } = factors;

    // Ethical conflicts require careful consideration
    if (conflictType === "ethical") {
      if (ethicalScoreA > ethicalScoreB) {
        return "prioritize";
      } else if (ethicalScoreB > ethicalScoreA) {
        return "prioritize";
      } else {
        return "modify";
      }
    }

    // High severity conflicts require human input
    if (severity > 0.7) {
      return "modify";
    }

    // Resource conflicts often require balancing
    if (conflictType === "resource") {
      return "balance";
    }

    // Temporal conflicts can be sequenced
    if (conflictType === "temporal") {
      return "sequence";
    }

    // Default to prioritization
    return "prioritize";
  }

  /**
   * Execute resolution strategy
   */
  private async executeResolutionStrategy(
    strategy: ConflictResolution["resolutionStrategy"],
    conflict: GoalConflict,
    factors: any
  ): Promise<ConflictResolution> {
    const goalA = this.goals.get(conflict.goalA)!;
    const goalB = this.goals.get(conflict.goalB)!;

    let chosenGoal: string;
    let deferredGoal: string | undefined;
    let rationale: string;
    let impact: ConflictResolution["impact"];

    switch (strategy) {
      case "prioritize":
        chosenGoal = this.choosePrioritizedGoal(goalA, goalB, factors);
        rationale = `Prioritized based on ethical and governance considerations`;
        impact = this.calculateImpact(chosenGoal, undefined, factors);
        break;

      case "balance":
        chosenGoal = goalA.goalId; // Default to goal A
        deferredGoal = goalB.goalId;
        rationale = `Balancing conflicting goals with modified approach`;
        impact = this.calculateImpact(chosenGoal, deferredGoal, factors, true);
        break;

      case "sequence":
        chosenGoal = this.chooseSequentialGoal(goalA, goalB, factors);
        rationale = `Sequencing goals to address both over time`;
        impact = this.calculateImpact(chosenGoal, undefined, factors, false);
        break;

      case "modify":
        chosenGoal = goalA.goalId; // Default to goal A
        rationale = `Modifying approach to resolve conflict`;
        impact = this.calculateImpact(chosenGoal, undefined, factors, true);
        break;

      case "merge":
        chosenGoal = this.createMergedGoal(goalA, goalB);
        rationale = `Merging goals to create unified approach`;
        impact = this.calculateImpact(chosenGoal, undefined, factors, false);
        break;

      default:
        chosenGoal = goalA.goalId;
        rationale = "Default prioritization";
        impact = this.calculateImpact(chosenGoal, undefined, factors);
    }

    const resolution: ConflictResolution = {
      conflictId: conflict.conflictId,
      chosenGoal,
      deferredGoal,
      resolutionStrategy: strategy,
      rationale,
      impact,
      ethicalConsiderations: this.getEthicalConsiderations(factors),
      governanceConstraints: this.getGovernanceConstraints(factors),
      humanAuthorityRequired: this.requiresHumanAuthority(factors),
      resolvedAt: Date.now(),
      expiresAt: strategy === "sequence" ? Date.now() + 86400000 : undefined // 24 hours for sequence
    };

    // Update conflict status
    conflict.status = "resolved";

    return resolution;
  }

  /**
   * Choose prioritized goal
   */
  private choosePrioritizedGoal(goalA: Goal, goalB: Goal, factors: any): string {
    const scoreA = this.calculateGoalScore(goalA, factors);
    const scoreB = this.calculateGoalScore(goalB, factors);
    
    return scoreA >= scoreB ? goalA.goalId : goalB.goalId;
  }

  /**
   * Choose sequential goal
   */
  private chooseSequentialGoal(goalA: Goal, goalB: Goal, factors: any): string {
    // Prefer short-term goals first in temporal conflicts
    const goalAShortTerm = goalA.shortTerm.toLowerCase().includes("short") || !goalA.longTerm.toLowerCase().includes("long");
    const goalBShortTerm = goalB.shortTerm.toLowerCase().includes("short") || !goalB.longTerm.toLowerCase().includes("long");

    return goalAShortTerm ? goalA.goalId : goalB.goalId;
  }

  /**
   * Calculate goal score
   */
  private calculateGoalScore(goal: Goal, factors: any): number {
    const ethicalScore = factors.ethicalScoreA === goal.goalId ? factors.ethicalScoreA : factors.ethicalScoreB;
    const governanceScore = factors.governanceScoreA === goal.goalId ? factors.governanceScoreA : factors.governanceScoreB;
    const performanceScore = factors.performanceScoreA === goal.goalId ? factors.performanceScoreA : factors.performanceScoreB;
    const humanScore = factors.humanPreferenceScore;
    const priority = factors.priorityA === goal.goalId ? factors.priorityA : factors.priorityB;

    return (
      ethicalScore * this.config.ethicalWeight +
      governanceScore * this.config.governanceWeight +
      performanceScore * this.config.performanceWeight +
      humanScore * this.config.humanWeight +
      priority * 0.1
    );
  }

  /**
   * Calculate impact of resolution
   */
  private calculateImpact(
    chosenGoal: string,
    deferredGoal: string | undefined,
    factors: any,
    isBalanced: boolean = false
  ): ConflictResolution["impact"] {
    const goalA = this.goals.get(chosenGoal);
    
    let onChosenGoal = 0.5;
    let onDeferredGoal = 0;
    let overall = 0.5;

    if (goalA) {
      onChosenGoal = this.calculateGoalScore(goalA, factors);
    }

    if (deferredGoal) {
      const goalB = this.goals.get(deferredGoal);
      if (goalB) {
        onDeferredGoal = this.calculateGoalScore(goalB, {
          ...factors,
          ethicalScoreB: factors.ethicalScoreA,
          governanceScoreB: factors.governanceScoreA,
          performanceScoreB: factors.performanceScoreA,
          humanPreferenceScore: -factors.humanPreferenceScore
        });
      }
    }

    if (isBalanced) {
      overall = (onChosenGoal + onDeferredGoal) / 2;
    } else {
      overall = onChosenGoal;
    }

    return {
      onChosenGoal,
      onDeferredGoal,
      overall
    };
  }

  /**
   * Create merged goal
   */
  private createMergedGoal(goalA: Goal, goalB: Goal): string {
    // In a real implementation, this would create a new merged goal
    // For now, return goalA as the base
    return goalA.goalId;
  }

  /**
   * Get ethical considerations
   */
  private getEthicalConsiderations(factors: any): string[] {
    const considerations: string[] = [];

    if (factors.conflictType === "ethical") {
      considerations.push("Ethical conflict requires careful consideration");
      considerations.push("Safety and compliance must be prioritized");
    }

    if (factors.severity > 0.7) {
      considerations.push("High severity conflict requires additional safeguards");
    }

    return considerations;
  }

  /**
   * Get governance constraints
   */
  private getGovernanceConstraints(factors: any): string[] {
    const constraints: string[] = [];

    if (factors.conflictType === "resource") {
      constraints.push("Resource constraints must be respected");
      constraints.push("Fair allocation required");
    }

    if (factors.conflictType === "priority") {
      constraints.push("Priority hierarchy must be maintained");
    }

    return constraints;
  }

  /**
   * Check if human authority is required
   */
  private requiresHumanAuthority(factors: any): boolean {
    return (
      factors.severity > 0.8 ||
      factors.conflictType === "ethical" ||
      this.config.strictEthicalMode
    );
  }

  /**
   * Log conflict event
   */
  private logConflict(conflict: GoalConflict, action: string): void {
    console.log(`[GoalConflict] ${action}: ${conflict.conflictId} - ${conflict.description}`);
  }

  /**
   * Get conflict statistics
   */
  public getConflictStatistics(): {
    totalConflicts: number;
    activeConflicts: number;
    resolvedConflicts: number;
    conflictTypeDistribution: Record<string, number>;
    avgResolutionTime: number;
    ethicalConflictRate: number;
  } {
    const conflicts = Array.from(this.conflicts.values());
    const resolutions = Array.from(this.resolutions.values());

    const totalConflicts = conflicts.length;
    const activeConflicts = conflicts.filter(c => c.status === "active").length;
    const resolvedConflicts = resolutions.length;
    
    const conflictTypeDistribution: Record<string, number> = {};
    for (const conflict of conflicts) {
      conflictTypeDistribution[conflict.conflictType] = (conflictTypeDistribution[conflict.conflictType] || 0) + 1;
    }

    const ethicalConflicts = conflicts.filter(c => c.conflictType === "ethical");
    const ethicalConflictRate = totalConflicts > 0 ? ethicalConflicts.length / totalConflicts : 0;

    const resolutionTimes = resolutions
      .filter(r => r.resolvedAt)
      .map(r => {
        const conflict = this.conflicts.get(r.conflictId);
        return conflict ? r.resolvedAt - conflict.detectedAt : 0;
      })
      .filter(time => time > 0);

    const avgResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0;

    return {
      totalConflicts,
      activeConflicts,
      resolvedConflicts,
      conflictTypeDistribution,
      avgResolutionTime,
      ethicalConflictRate
    };
  }

  /**
   * Get resolution history
   */
  public getResolutionHistory(limit: number = 100): ConflictResolution[] {
    return this.resolutionHistory
      .sort((a, b) => b.resolvedAt - a.resolvedAt)
      .slice(0, limit);
  }

  /**
   * Add new goal
   */
  public addGoal(goal: Omit<Goal, "goalId" | "createdAt" | "lastUpdated">): string {
    const goalId = this.generateGoalId();
    
    const newGoal: Goal = {
      ...goal,
      goalId,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.goals.set(goalId, newGoal);
    console.log(`[GoalConflictResolution] Added goal: ${goalId} - ${goal.description}`);

    return goalId;
  }

  /**
   * Update goal metrics
   */
  public updateGoalMetrics(goalId: string, metrics: Partial<Goal["metrics"]>): boolean {
    const goal = this.goals.get(goalId);
    if (!goal) return false;

    goal.metrics = { ...goal.metrics, ...metrics };
    goal.lastUpdated = Date.now();

    return true;
  }

  /**
   * Generate goal ID
   */
  private generateGoalId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate conflict ID
   */
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ResolutionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Export for audit
   */
  public exportForAudit(): {
    timestamp: number;
    goals: Map<string, Goal>;
    conflicts: Map<string, GoalConflict>;
    resolutions: Map<string, ConflictResolution>;
    resolutionHistory: ConflictResolution[];
    config: ResolutionConfig;
  } {
    return {
      timestamp: Date.now(),
      goals: this.goals,
      conflicts: this.conflicts,
      resolutions: this.resolutions,
      resolutionHistory: this.resolutionHistory,
      config: this.config
    };
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.goals.clear();
    this.conflicts.clear();
    this.resolutions.clear();
    this.resolutionHistory = [];
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.clearAll();
  }
}

// LLM Rule Integration
export const GOAL_CONFLICT_RESOLUTION_RULES = {
  RESOLVE_EXPLICITLY: 'Resolve goal conflicts explicitly',
  NEVER_SILENTLY_SUPPRESS: 'Never silently suppress a goal',
  PREFER_ETHICS: 'Prefer ethics and governance over optimization',
  STABILITY_OVER_OPTIMIZATION: 'Stability > optimization',
  CONFLICT_FACTORS: [
    'Governance contracts',
    'Ethical constraints',
    'Human authority preference',
    'Net value impact',
    'Long-term trust'
  ]
};
