/**
 * Goal Conflict Resolution Engines
 * Resolves conflicts between multiple long-term goals rationally
 */

export interface GoalConflict {
  conflictId: string;
  goalA: string;
  goalB: string;
  conflictType: "resource" | "ethical" | "temporal" | "strategic";
  severity: number; // 0-1
  description: string;
  detectedAt: number;
  context: string;
}

export interface ConflictResolution {
  resolutionId: string;
  conflictId: string;
  chosenGoal: string;
  deferredGoal?: string;
  compromisedGoal?: string;
  resolutionType: "choose_one" | "defer" | "compromise" | "merge";
  rationale: string;
  factors: {
    governance: number; // 0-1
    ethical: number; // 0-1
    humanPreference: number; // 0-1
    netValue: number; // 0-1
    longTermTrust: number; // 0-1
  };
  confidence: number; // 0-1
  resolvedAt: number;
  validUntil: number; // Resolution expires at this time
}

export interface ConflictDetectionRule {
  ruleId: string;
  name: string;
  description: string;
  conflictType: GoalConflict['conflictType'];
  detectionLogic: string; // Simplified logic description
  severity: number;
}

export interface ResolutionStrategy {
  strategyId: string;
  name: string;
  conflictTypes: GoalConflict['conflictType'][];
  priority: number; // Higher = more preferred
  conditions: {
    maxSeverity: number;
    minConfidence: number;
    requiredFactors: string[];
  };
  resolutionLogic: string;
}

class GoalConflictResolutionEngine {
  private conflicts: Map<string, GoalConflict> = new Map();
  private resolutions: Map<string, ConflictResolution> = new Map();
  private detectionRules: Map<string, ConflictDetectionRule> = new Map();
  private resolutionStrategies: Map<string, ResolutionStrategy> = new Map();
  private storagePath: string;

  // Resolution weights
  private readonly FACTOR_WEIGHTS = {
    governance: 0.25,
    ethical: 0.30,
    humanPreference: 0.20,
    netValue: 0.15,
    longTermTrust: 0.10
  };

  constructor(storagePath: string = './data/goal-conflict-resolution.json') {
    this.storagePath = storagePath;
    this.initializeDetectionRules();
    this.initializeResolutionStrategies();
    this.loadConflicts();
  }

  /**
   * Initialize conflict detection rules
   */
  private initializeDetectionRules(): void {
    const rules: Omit<ConflictDetectionRule, 'ruleId'>[] = [
      {
        name: "Resource Competition",
        description: "Goals compete for limited resources",
        conflictType: "resource",
        detectionLogic: "Goals require same exclusive resources",
        severity: 0.6
      },
      {
        name: "Ethical Opposition",
        description: "Goals have opposing ethical implications",
        conflictType: "ethical",
        detectionLogic: "Goals lead to different ethical outcomes",
        severity: 0.8
      },
      {
        name: "Temporal Conflict",
        description: "Goals require different timing or sequencing",
        conflictType: "temporal",
        detectionLogic: "Goals have incompatible time requirements",
        severity: 0.4
      },
      {
        name: "Strategic Misalignment",
        description: "Goals pursue different strategic directions",
        conflictType: "strategic",
        detectionLogic: "Goals lead to different long-term outcomes",
        severity: 0.5
      }
    ];

    for (const rule of rules) {
      this.detectionRules.set(this.generateRuleId(), {
        ...rule,
        ruleId: this.generateRuleId()
      });
    }
  }

  /**
   * Initialize resolution strategies
   */
  private initializeResolutionStrategies(): void {
    const strategies: Omit<ResolutionStrategy, 'strategyId'>[] = [
      {
        name: "Ethical Priority",
        conflictTypes: ["ethical"],
        priority: 100,
        conditions: {
          maxSeverity: 1.0,
          minConfidence: 0.7,
          requiredFactors: ["ethical", "governance"]
        },
        resolutionLogic: "Always prioritize ethically superior goal"
      },
      {
        name: "Human Preference",
        conflictTypes: ["resource", "strategic"],
        priority: 90,
        conditions: {
          maxSeverity: 0.7,
          minConfidence: 0.6,
          requiredFactors: ["humanPreference"]
        },
        resolutionLogic: "Follow human authority preferences"
      },
      {
        name: "Net Value Maximization",
        conflictTypes: ["resource"],
        priority: 70,
        conditions: {
          maxSeverity: 0.5,
          minConfidence: 0.5,
          requiredFactors: ["netValue"]
        },
        resolutionLogic: "Choose goal with higher economic value"
      },
      {
        name: "Temporal Sequencing",
        conflictTypes: ["temporal"],
        priority: 80,
        conditions: {
          maxSeverity: 0.6,
          minConfidence: 0.4,
          requiredFactors: ["longTermTrust"]
        },
        resolutionLogic: "Sequence goals temporally when possible"
      },
      {
        name: "Compromise Solution",
        conflictTypes: ["resource", "strategic"],
        priority: 60,
        conditions: {
          maxSeverity: 0.4,
          minConfidence: 0.3,
          requiredFactors: ["governance", "netValue"]
        },
        resolutionLogic: "Find compromise that partially satisfies both goals"
      }
    ];

    for (const strategy of strategies) {
      this.resolutionStrategies.set(this.generateStrategyId(), {
        ...strategy,
        strategyId: this.generateStrategyId()
      });
    }
  }

  /**
   * Detect conflicts between goals
   */
  detectConflicts(
    goalA: string,
    goalB: string,
    context: string,
    goalData: {
      resources?: string[];
      ethicalImplications?: string[];
      timeRequirements?: string[];
      strategicOutcomes?: string[];
    }
  ): GoalConflict[] {
    const conflicts: GoalConflict[] = [];

    for (const rule of this.detectionRules.values()) {
      const conflict = this.applyDetectionRule(rule, goalA, goalB, context, goalData);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    // Store detected conflicts
    for (const conflict of conflicts) {
      this.conflicts.set(conflict.conflictId, conflict);
    }

    this.saveConflicts();
    return conflicts;
  }

  /**
   * Apply detection rule to identify conflicts
   */
  private applyDetectionRule(
    rule: ConflictDetectionRule,
    goalA: string,
    goalB: string,
    context: string,
    goalData: any
  ): GoalConflict | null {
    let hasConflict = false;
    let description = "";

    switch (rule.conflictType) {
      case "resource":
        if (goalData.resources && this.hasResourceConflict(goalData.resources)) {
          hasConflict = true;
          description = `Goals compete for resources: ${this.findConflictingResources(goalData.resources).join(", ")}`;
        }
        break;

      case "ethical":
        if (goalData.ethicalImplications && this.hasEthicalConflict(goalData.ethicalImplications)) {
          hasConflict = true;
          description = `Goals have opposing ethical implications`;
        }
        break;

      case "temporal":
        if (goalData.timeRequirements && this.hasTemporalConflict(goalData.timeRequirements)) {
          hasConflict = true;
          description = `Goals have incompatible timing requirements`;
        }
        break;

      case "strategic":
        if (goalData.strategicOutcomes && this.hasStrategicConflict(goalData.strategicOutcomes)) {
          hasConflict = true;
          description = `Goals pursue different strategic directions`;
        }
        break;
    }

    if (hasConflict) {
      return {
        conflictId: this.generateConflictId(),
        goalA,
        goalB,
        conflictType: rule.conflictType,
        severity: rule.severity,
        description,
        detectedAt: Date.now(),
        context
      };
    }

    return null;
  }

  /**
   * Check for resource conflicts
   */
  private hasResourceConflict(resources: string[]): boolean {
    const resourceCounts = new Map<string, number>();
    
    for (const resource of resources) {
      resourceCounts.set(resource, (resourceCounts.get(resource) || 0) + 1);
    }

    return Array.from(resourceCounts.values()).some(count => count > 1);
  }

  /**
   * Find conflicting resources
   */
  private findConflictingResources(resources: string[]): string[] {
    const resourceCounts = new Map<string, number>();
    
    for (const resource of resources) {
      resourceCounts.set(resource, (resourceCounts.get(resource) || 0) + 1);
    }

    return Array.from(resourceCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([resource, _]) => resource);
  }

  /**
   * Check for ethical conflicts
   */
  private hasEthicalConflict(implications: string[]): boolean {
    // Simplified: check for opposing ethical concepts
    const opposingPairs = [
      ["privacy", "transparency"],
      ["autonomy", "safety"],
      ["efficiency", "fairness"],
      ["innovation", "stability"]
    ];

    for (const [concept1, concept2] of opposingPairs) {
      const hasConcept1 = implications.some(imp => imp.toLowerCase().includes(concept1));
      const hasConcept2 = implications.some(imp => imp.toLowerCase().includes(concept2));
      
      if (hasConcept1 && hasConcept2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for temporal conflicts
   */
  private hasTemporalConflict(timeRequirements: string[]): boolean {
    // Simplified: check for conflicting time constraints
    const hasImmediate = timeRequirements.some(req => 
      req.toLowerCase().includes("immediate") || 
      req.toLowerCase().includes("urgent")
    );
    
    const hasLongTerm = timeRequirements.some(req => 
      req.toLowerCase().includes("long-term") || 
      req.toLowerCase().includes("eventual")
    );

    return hasImmediate && hasLongTerm;
  }

  /**
   * Check for strategic conflicts
   */
  private hasStrategicConflict(outcomes: string[]): boolean {
    // Simplified: check for opposing strategic directions
    const opposingDirections = [
      ["growth", "stability"],
      ["innovation", "consistency"],
      ["expansion", "consolidation"],
      ["risk", "security"]
    ];

    for (const [direction1, direction2] of opposingDirections) {
      const hasDirection1 = outcomes.some(out => out.toLowerCase().includes(direction1));
      const hasDirection2 = outcomes.some(out => out.toLowerCase().includes(direction2));
      
      if (hasDirection1 && hasDirection2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve a goal conflict
   */
  resolveConflict(
    conflictId: string,
    additionalData?: {
      governanceScores?: Record<string, number>;
      ethicalScores?: Record<string, number>;
      humanPreferences?: Record<string, number>;
      netValues?: Record<string, number>;
      longTermTrustScores?: Record<string, number>;
    }
  ): ConflictResolution {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    // Select resolution strategy
    const strategy = this.selectResolutionStrategy(conflict);
    
    // Calculate resolution factors
    const factors = this.calculateResolutionFactors(conflict, additionalData);
    
    // Apply resolution logic
    const resolution = this.applyResolutionStrategy(strategy, conflict, factors);
    
    // Create resolution record
    const resolutionRecord: ConflictResolution = {
      resolutionId: this.generateResolutionId(),
      conflictId,
      chosenGoal: resolution.chosenGoal,
      deferredGoal: resolution.deferredGoal,
      compromisedGoal: resolution.compromisedGoal,
      resolutionType: resolution.type,
      rationale: resolution.rationale,
      factors,
      confidence: resolution.confidence,
      resolvedAt: Date.now(),
      validUntil: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    this.resolutions.set(resolutionRecord.resolutionId, resolutionRecord);
    this.saveConflicts();

    return resolutionRecord;
  }

  /**
   * Select best resolution strategy for conflict
   */
  private selectResolutionStrategy(conflict: GoalConflict): ResolutionStrategy {
    const applicableStrategies = Array.from(this.resolutionStrategies.values())
      .filter(strategy => 
        strategy.conflictTypes.includes(conflict.conflictType) &&
        conflict.severity <= strategy.conditions.maxSeverity
      )
      .sort((a, b) => b.priority - a.priority);

    return applicableStrategies[0] || this.resolutionStrategies.values().next().value;
  }

  /**
   * Calculate resolution factors
   */
  private calculateResolutionFactors(
    conflict: GoalConflict,
    additionalData?: any
  ): ConflictResolution['factors'] {
    return {
      governance: additionalData?.governanceScores?.[conflict.goalA] || 0.5,
      ethical: additionalData?.ethicalScores?.[conflict.goalA] || 0.5,
      humanPreference: additionalData?.humanPreferences?.[conflict.goalA] || 0.5,
      netValue: additionalData?.netValues?.[conflict.goalA] || 0.5,
      longTermTrust: additionalData?.longTermTrustScores?.[conflict.goalA] || 0.5
    };
  }

  /**
   * Apply resolution strategy
   */
  private applyResolutionStrategy(
    strategy: ResolutionStrategy,
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): {
    chosenGoal: string;
    deferredGoal?: string;
    compromisedGoal?: string;
    type: ConflictResolution['resolutionType'];
    rationale: string;
    confidence: number;
  } {
    switch (strategy.name) {
      case "Ethical Priority":
        return this.resolveEthicalPriority(conflict, factors);

      case "Human Preference":
        return this.resolveHumanPreference(conflict, factors);

      case "Net Value Maximization":
        return this.resolveNetValue(conflict, factors);

      case "Temporal Sequencing":
        return this.resolveTemporalSequencing(conflict, factors);

      case "Compromise Solution":
        return this.resolveCompromise(conflict, factors);

      default:
        return this.resolveDefault(conflict, factors);
    }
  }

  /**
   * Resolve with ethical priority
   */
  private resolveEthicalPriority(
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): any {
    // Choose goal with higher ethical score
    const chosenGoal = factors.ethical > 0.5 ? conflict.goalA : conflict.goalB;
    
    return {
      chosenGoal,
      deferredGoal: chosenGoal === conflict.goalA ? conflict.goalB : conflict.goalA,
      type: "choose_one" as const,
      rationale: `Prioritized goal with superior ethical implications (${factors.ethical.toFixed(2)})`,
      confidence: 0.8
    };
  }

  /**
   * Resolve with human preference
   */
  private resolveHumanPreference(
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): any {
    const chosenGoal = factors.humanPreference > 0.5 ? conflict.goalA : conflict.goalB;
    
    return {
      chosenGoal,
      deferredGoal: chosenGoal === conflict.goalA ? conflict.goalB : conflict.goalA,
      type: "choose_one" as const,
      rationale: `Followed human authority preference (${factors.humanPreference.toFixed(2)})`,
      confidence: 0.9
    };
  }

  /**
   * Resolve with net value maximization
   */
  private resolveNetValue(
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): any {
    const chosenGoal = factors.netValue > 0.5 ? conflict.goalA : conflict.goalB;
    
    return {
      chosenGoal,
      deferredGoal: chosenGoal === conflict.goalA ? conflict.goalB : conflict.goalA,
      type: "choose_one" as const,
      rationale: `Maximized net economic value (${factors.netValue.toFixed(2)})`,
      confidence: 0.7
    };
  }

  /**
   * Resolve with temporal sequencing
   */
  private resolveTemporalSequencing(
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): any {
    return {
      chosenGoal: conflict.goalA, // Execute first
      deferredGoal: conflict.goalB, // Execute second
      type: "defer" as const,
      rationale: `Sequenced goals temporally to avoid resource conflicts`,
      confidence: 0.6
    };
  }

  /**
   * Resolve with compromise
   */
  private resolveCompromise(
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): any {
    return {
      chosenGoal: conflict.goalA,
      compromisedGoal: conflict.goalB,
      type: "compromise" as const,
      rationale: `Found compromise solution that partially satisfies both goals`,
      confidence: 0.5
    };
  }

  /**
   * Default resolution
   */
  private resolveDefault(
    conflict: GoalConflict,
    factors: ConflictResolution['factors']
  ): any {
    // Calculate weighted score
    const score = 
      factors.governance * this.FACTOR_WEIGHTS.governance +
      factors.ethical * this.FACTOR_WEIGHTS.ethical +
      factors.humanPreference * this.FACTOR_WEIGHTS.humanPreference +
      factors.netValue * this.FACTOR_WEIGHTS.netValue +
      factors.longTermTrust * this.FACTOR_WEIGHTS.longTermTrust;

    const chosenGoal = score > 0.5 ? conflict.goalA : conflict.goalB;

    return {
      chosenGoal,
      deferredGoal: chosenGoal === conflict.goalA ? conflict.goalB : conflict.goalA,
      type: "choose_one" as const,
      rationale: `Selected goal based on weighted factor analysis (${score.toFixed(2)})`,
      confidence: 0.6
    };
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): GoalConflict | undefined {
    return this.conflicts.get(conflictId);
  }

  /**
   * Get resolution by ID
   */
  getResolution(resolutionId: string): ConflictResolution | undefined {
    return this.resolutions.get(resolutionId);
  }

  /**
   * Get all conflicts
   */
  getAllConflicts(): GoalConflict[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Get all resolutions
   */
  getAllResolutions(): ConflictResolution[] {
    return Array.from(this.resolutions.values());
  }

  /**
   * Get conflicts by type
   */
  getConflictsByType(conflictType: GoalConflict['conflictType']): GoalConflict[] {
    return Array.from(this.conflicts.values())
      .filter(c => c.conflictType === conflictType);
  }

  /**
   * Get unresolved conflicts
   */
  getUnresolvedConflicts(): GoalConflict[] {
    const resolvedConflictIds = new Set(
      Array.from(this.resolutions.values()).map(r => r.conflictId)
    );

    return Array.from(this.conflicts.values())
      .filter(c => !resolvedConflictIds.has(c.conflictId));
  }

  /**
   * Get conflict resolution statistics
   */
  getConflictStats(): {
    totalConflicts: number;
    unresolvedConflicts: number;
    conflictsByType: Record<GoalConflict['conflictType'], number>;
    averageSeverity: number;
    totalResolutions: number;
    resolutionsByType: Record<ConflictResolution['resolutionType'], number>;
    averageConfidence: number;
  } {
    const conflicts = Array.from(this.conflicts.values());
    const resolutions = Array.from(this.resolutions.values());

    const conflictsByType = conflicts.reduce((acc: any, c: GoalConflict) => {
      acc[c.conflictType] = (acc[c.conflictType] || 0) + 1;
      return acc;
    }, {} as Record<GoalConflict['conflictType'], number>);

    const resolutionsByType = resolutions.reduce((acc: any, r: ConflictResolution) => {
      acc[r.resolutionType] = (acc[r.resolutionType] || 0) + 1;
      return acc;
    }, {} as Record<ConflictResolution['resolutionType'], number>);

    const averageSeverity = conflicts.length > 0
      ? conflicts.reduce((sum, c) => sum + c.severity, 0) / conflicts.length
      : 0;

    const averageConfidence = resolutions.length > 0
      ? resolutions.reduce((sum, r) => sum + r.confidence, 0) / resolutions.length
      : 0;

    return {
      totalConflicts: conflicts.length,
      unresolvedConflicts: this.getUnresolvedConflicts().length,
      conflictsByType,
      averageSeverity,
      totalResolutions: resolutions.length,
      resolutionsByType,
      averageConfidence
    };
  }

  /**
   * Clean up expired resolutions
   */
  cleanup(): void {
    const now = Date.now();
    const expiredResolutions: string[] = [];

    for (const [resolutionId, resolution] of this.resolutions.entries()) {
      if (now > resolution.validUntil) {
        expiredResolutions.push(resolutionId);
      }
    }

    for (const resolutionId of expiredResolutions) {
      this.resolutions.delete(resolutionId);
    }

    this.saveConflicts();
  }

  /**
   * Save conflicts to disk
   */
  private saveConflicts(): void {
    try {
      const fs = require('fs');
      const data = {
        conflicts: Array.from(this.conflicts.entries()),
        resolutions: Array.from(this.resolutions.entries()),
        detectionRules: Array.from(this.detectionRules.entries()),
        resolutionStrategies: Array.from(this.resolutionStrategies.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save goal conflicts:', error);
    }
  }

  /**
   * Load conflicts from disk
   */
  private loadConflicts(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.conflicts = new Map(data.conflicts || []);
        this.resolutions = new Map(data.resolutions || []);
        this.detectionRules = new Map(data.detectionRules || []);
        this.resolutionStrategies = new Map(data.resolutionStrategies || []);
      }
    } catch (error) {
      console.error('Failed to load goal conflicts:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResolutionId(): string {
    return `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStrategyId(): string {
    return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { GoalConflictResolutionEngine };
