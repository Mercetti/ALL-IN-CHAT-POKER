/**
 * Ethical Constraint Learning System
 * Acey learns ethical boundaries from human overrides, violations, and feedback
 */

export type ConstraintSource = "human" | "incident" | "feedback" | "system";
export type ConstraintSeverity = "low" | "medium" | "high" | "critical";

export interface EthicalConstraint {
  constraintId: string;
  description: string;
  triggerExamples: string[];
  severity: ConstraintSeverity; // 0-1
  learnedFrom: ConstraintSource;
  createdAt: number;
  lastTriggered: number;
  triggerCount: number;
  falsePositiveCount: number;
  confidence: number; // 0-1
  category: string;
  action: "block" | "warn" | "debate" | "log";
}

export interface EthicalViolation {
  violationId: string;
  constraintId: string;
  actionId: string;
  description: string;
  context: string;
  severity: ConstraintSeverity;
  timestamp: number;
  resolved: boolean;
  resolutionAction?: string;
  humanOverride?: boolean;
}

export interface EthicalFeedback {
  feedbackId: string;
  constraintId: string;
  action: "confirm" | "reject" | "adjust_severity";
  severity?: ConstraintSeverity;
  description: string;
  source: ConstraintSource;
  timestamp: number;
}

export interface EthicalLearningSignal {
  signalId: string;
  type: "human_veto" | "contract_violation" | "community_complaint" | "incident_report";
  description: string;
  context: string;
  severity: number; // 0-1
  timestamp: number;
  source: ConstraintSource;
}

class EthicalConstraintManager {
  private constraints: Map<string, EthicalConstraint> = new Map();
  private violations: Map<string, EthicalViolation> = new Map();
  private feedback: Map<string, EthicalFeedback> = new Map();
  private learningSignals: Map<string, EthicalLearningSignal> = new Map();
  private storagePath: string;

  // Learning parameters
  private readonly SEVERITY_PROMOTION_THRESHOLD = 3; // Triggers to increase severity
  private readonly CONFIDENCE_DECAY_RATE = 0.01; // How quickly confidence decays
  private readonly FALSE_POSITIVE_PENALTY = 0.2; // Penalty for false positives
  private readonly MIN_CONFIDENCE_FOR_ENFORCEMENT = 0.6; // Minimum confidence to enforce

  constructor(storagePath: string = './data/ethical-constraints.json') {
    this.storagePath = storagePath;
    this.initializeDefaultConstraints();
    this.loadConstraints();
  }

  /**
   * Initialize default ethical constraints
   */
  private initializeDefaultConstraints(): void {
    const defaultConstraints: Omit<EthicalConstraint, 'constraintId' | 'createdAt' | 'lastTriggered' | 'triggerCount' | 'falsePositiveCount' | 'confidence'>[] = [
      {
        description: "Do not disclose private user information",
        triggerExamples: [
          "share personal data",
          "reveal user identity",
          "disclose private messages",
          "show user location"
        ],
        severity: "critical",
        learnedFrom: "system",
        category: "privacy",
        action: "block"
      },
      {
        description: "Do not make financial decisions or transactions",
        triggerExamples: [
          "transfer money",
          "make payment",
          "invest funds",
          "handle cryptocurrency"
        ],
        severity: "high",
        learnedFrom: "system",
        category: "financial",
        action: "block"
      },
      {
        description: "Avoid harmful or offensive content",
        triggerExamples: [
          "hate speech",
          "discriminatory language",
          "harassment",
          "bullying"
        ],
        severity: "high",
        learnedFrom: "system",
        category: "safety",
        action: "block"
      },
      {
        description: "Be transparent about AI limitations",
        triggerExamples: [
          "claim human capabilities",
          "hide AI nature",
          "pretend to be human",
          "misrepresent abilities"
        ],
        severity: "medium",
        learnedFrom: "system",
        category: "transparency",
        action: "warn"
      },
      {
        description: "Respect user consent and autonomy",
        triggerExamples: [
          "ignore user preferences",
          "override user choices",
          "force actions",
          "disregard boundaries"
        ],
        severity: "medium",
        learnedFrom: "system",
        category: "autonomy",
        action: "debate"
      }
    ];

    for (const constraint of defaultConstraints) {
      this.constraints.set(this.generateConstraintId(), {
        ...constraint,
        constraintId: this.generateConstraintId(),
        createdAt: Date.now(),
        lastTriggered: 0,
        triggerCount: 0,
        falsePositiveCount: 0,
        confidence: 0.8
      });
    }
  }

  /**
   * Process an ethical learning signal
   */
  processLearningSignal(signal: Omit<EthicalLearningSignal, 'signalId'>): string {
    const signalId = this.generateSignalId();
    const fullSignal: EthicalLearningSignal = {
      ...signal,
      signalId
    };

    this.learningSignals.set(signalId, fullSignal);

    // Try to match signal to existing constraints
    const matchingConstraints = this.findMatchingConstraints(fullSignal);
    
    if (matchingConstraints.length === 0) {
      // Create new constraint from signal
      this.createConstraintFromSignal(fullSignal);
    } else {
      // Strengthen existing constraints
      for (const constraint of matchingConstraints) {
        this.strengthenConstraint(constraint.constraintId, fullSignal);
      }
    }

    this.saveConstraints();
    return signalId;
  }

  /**
   * Check if an action violates ethical constraints
   */
  checkEthicalConstraints(
    actionId: string,
    actionDescription: string,
    context: string
  ): {
    allowed: boolean;
    violations: Array<{
      constraint: EthicalConstraint;
      severity: ConstraintSeverity;
      confidence: number;
      action: string;
    }>;
    recommendation: string;
  } {
    const violations: Array<{
      constraint: EthicalConstraint;
      severity: ConstraintSeverity;
      confidence: number;
      action: string;
    }> = [];

    for (const constraint of this.constraints.values()) {
      if (constraint.confidence < this.MIN_CONFIDENCE_FOR_ENFORCEMENT) {
        continue; // Skip low-confidence constraints
      }

      const violation = this.evaluateConstraintViolation(constraint, actionDescription, context);
      if (violation) {
        violations.push(violation);
      }
    }

    // Sort by severity and confidence
    violations.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aWeight = severityWeight[a.severity] * a.confidence;
      const bWeight = severityWeight[b.severity] * b.confidence;
      return bWeight - aWeight;
    });

    const hasCriticalViolation = violations.some(v => v.severity === "critical");
    const hasHighViolation = violations.some(v => v.severity === "high");

    let recommendation = "Action appears ethically acceptable";
    if (hasCriticalViolation) {
      recommendation = "Action blocked due to critical ethical constraints";
    } else if (hasHighViolation) {
      recommendation = "Action requires review due to ethical concerns";
    } else if (violations.length > 0) {
      recommendation = "Proceed with caution - minor ethical concerns detected";
    }

    return {
      allowed: !hasCriticalViolation && !hasHighViolation,
      violations,
      recommendation
    };
  }

  /**
   * Evaluate if an action violates a specific constraint
   */
  private evaluateConstraintViolation(
    constraint: EthicalConstraint,
    actionDescription: string,
    context: string
  ): {
    constraint: EthicalConstraint;
    severity: ConstraintSeverity;
    confidence: number;
    action: string;
  } | null {
    const actionText = (actionDescription + " " + context).toLowerCase();
    
    // Check trigger examples
    let matchScore = 0;
    for (const example of constraint.triggerExamples) {
      if (actionText.includes(example.toLowerCase())) {
        matchScore += 1;
      }
    }

    if (matchScore === 0) {
      return null;
    }

    // Calculate confidence based on match strength and constraint confidence
    const matchConfidence = Math.min(matchScore / constraint.triggerExamples.length, 1.0);
    const overallConfidence = (matchConfidence + constraint.confidence) / 2;

    return {
      constraint,
      severity: constraint.severity,
      confidence: overallConfidence,
      action: constraint.action
    };
  }

  /**
   * Find constraints that match a learning signal
   */
  private findMatchingConstraints(signal: EthicalLearningSignal): EthicalConstraint[] {
    const signalText = signal.description.toLowerCase();
    const matching: EthicalConstraint[] = [];

    for (const constraint of this.constraints.values()) {
      // Check category matches
      if (this.categoryMatches(signal, constraint)) {
        matching.push(constraint);
        continue;
      }

      // Check description similarity
      const descriptionSimilarity = this.calculateTextSimilarity(
        signalText,
        constraint.description.toLowerCase()
      );

      if (descriptionSimilarity > 0.6) {
        matching.push(constraint);
        continue;
      }

      // Check trigger example similarity
      for (const example of constraint.triggerExamples) {
        const exampleSimilarity = this.calculateTextSimilarity(
          signalText,
          example.toLowerCase()
        );

        if (exampleSimilarity > 0.7) {
          matching.push(constraint);
          break;
        }
      }
    }

    return matching;
  }

  /**
   * Check if signal category matches constraint category
   */
  private categoryMatches(signal: EthicalLearningSignal, constraint: EthicalConstraint): boolean {
    const signalCategories = this.inferCategory(signal.description);
    return signalCategories.includes(constraint.category);
  }

  /**
   * Infer category from description
   */
  private inferCategory(description: string): string[] {
    const categories: string[] = [];
    const desc = description.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      privacy: ["private", "personal", "data", "information", "identity"],
      financial: ["money", "payment", "transaction", "financial", "invest"],
      safety: ["harm", "danger", "unsafe", "hurt", "damage"],
      transparency: ["honest", "transparent", "clear", "truthful", "reveal"],
      autonomy: ["choice", "consent", "freedom", "control", "voluntary"],
      fairness: ["fair", "unbiased", "equal", "just", "discrimination"]
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ["general"];
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  /**
   * Create a new constraint from a learning signal
   */
  private createConstraintFromSignal(signal: EthicalLearningSignal): void {
    const severity = this.mapSeverityFromSignal(signal.severity);
    const category = this.inferCategory(signal.description)[0] || "general";

    const constraint: EthicalConstraint = {
      constraintId: this.generateConstraintId(),
      description: signal.description,
      triggerExamples: [signal.description],
      severity,
      learnedFrom: signal.source,
      createdAt: Date.now(),
      lastTriggered: 0,
      triggerCount: 0,
      falsePositiveCount: 0,
      confidence: 0.5, // Start with lower confidence for learned constraints
      category,
      action: this.determineConstraintAction(severity)
    };

    this.constraints.set(constraint.constraintId, constraint);
    console.log(`New ethical constraint created: ${constraint.description}`);
  }

  /**
   * Strengthen an existing constraint
   */
  private strengthenConstraint(constraintId: string, signal: EthicalLearningSignal): void {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) return;

    // Update trigger count
    constraint.triggerCount++;
    constraint.lastTriggered = Date.now();

    // Add to trigger examples if not already present
    if (!constraint.triggerExamples.includes(signal.description)) {
      constraint.triggerExamples.push(signal.description);
    }

    // Increase confidence
    constraint.confidence = Math.min(constraint.confidence + 0.1, 1.0);

    // Potentially increase severity
    if (constraint.triggerCount >= this.SEVERITY_PROMOTION_THRESHOLD) {
      const newSeverity = this.potentiallyIncreaseSeverity(constraint.severity);
      if (newSeverity !== constraint.severity) {
        constraint.severity = newSeverity;
        constraint.action = this.determineConstraintAction(newSeverity);
        console.log(`Constraint severity increased: ${constraint.description}`);
      }
    }
  }

  /**
   * Map signal severity to constraint severity
   */
  private mapSeverityFromSignal(signalSeverity: number): ConstraintSeverity {
    if (signalSeverity >= 0.8) return "critical";
    if (signalSeverity >= 0.6) return "high";
    if (signalSeverity >= 0.4) return "medium";
    return "low";
  }

  /**
   * Potentially increase constraint severity
   */
  private potentiallyIncreaseSeverity(currentSeverity: ConstraintSeverity): ConstraintSeverity {
    const severityLevels: ConstraintSeverity[] = ["low", "medium", "high", "critical"];
    const currentIndex = severityLevels.indexOf(currentSeverity);
    
    if (currentIndex < severityLevels.length - 1) {
      return severityLevels[currentIndex + 1];
    }
    
    return currentSeverity;
  }

  /**
   * Determine constraint action based on severity
   */
  private determineConstraintAction(severity: ConstraintSeverity): "block" | "warn" | "debate" | "log" {
    switch (severity) {
      case "critical":
        return "block";
      case "high":
        return "warn";
      case "medium":
        return "debate";
      case "low":
        return "log";
      default:
        return "log";
    }
  }

  /**
   * Record an ethical violation
   */
  recordViolation(
    constraintId: string,
    actionId: string,
    description: string,
    context: string,
    severity: ConstraintSeverity
  ): string {
    const violationId = this.generateViolationId();
    const violation: EthicalViolation = {
      violationId,
      constraintId,
      actionId,
      description,
      context,
      severity,
      timestamp: Date.now(),
      resolved: false
    };

    this.violations.set(violationId, violation);
    this.saveConstraints();
    return violationId;
  }

  /**
   * Add feedback on a constraint
   */
  addConstraintFeedback(feedback: Omit<EthicalFeedback, 'feedbackId'>): string {
    const feedbackId = this.generateFeedbackId();
    const fullFeedback: EthicalFeedback = {
      ...feedback,
      feedbackId
    };

    this.feedback.set(feedbackId, fullFeedback);
    this.applyFeedbackToConstraint(fullFeedback);
    this.saveConstraints();
    return feedbackId;
  }

  /**
   * Apply feedback to a constraint
   */
  private applyFeedbackToConstraint(feedback: EthicalFeedback): void {
    const constraint = this.constraints.get(feedback.constraintId);
    if (!constraint) return;

    switch (feedback.action) {
      case "confirm":
        constraint.confidence = Math.min(constraint.confidence + 0.1, 1.0);
        break;

      case "reject":
        constraint.confidence = Math.max(constraint.confidence - 0.2, 0.0);
        constraint.falsePositiveCount++;
        break;

      case "adjust_severity":
        if (feedback.severity) {
          constraint.severity = feedback.severity;
          constraint.action = this.determineConstraintAction(feedback.severity);
        }
        break;
    }
  }

  /**
   * Get constraints by severity
   */
  getConstraintsBySeverity(severity: ConstraintSeverity): EthicalConstraint[] {
    return Array.from(this.constraints.values())
      .filter(c => c.severity === severity && c.confidence >= this.MIN_CONFIDENCE_FOR_ENFORCEMENT)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get constraints by category
   */
  getConstraintsByCategory(category: string): EthicalConstraint[] {
    return Array.from(this.constraints.values())
      .filter(c => c.category === category && c.confidence >= this.MIN_CONFIDENCE_FOR_ENFORCEMENT)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit: number = 10): EthicalViolation[] {
    return Array.from(this.violations.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get ethical system statistics
   */
  getEthicsStats(): {
    totalConstraints: number;
    activeConstraints: number;
    constraintsBySeverity: Record<ConstraintSeverity, number>;
    constraintsByCategory: Record<string, number>;
    totalViolations: number;
    unresolvedViolations: number;
    averageConfidence: number;
    totalLearningSignals: number;
    totalFeedback: number;
  } {
    const constraints = Array.from(this.constraints.values());
    const violations = Array.from(this.violations.values());

    const constraintsBySeverity = constraints.reduce((acc, c) => {
      acc[c.severity] = (acc[c.severity] || 0) + 1;
      return acc;
    }, {} as Record<ConstraintSeverity, number>);

    const constraintsByCategory = constraints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeConstraints = constraints.filter(c => c.confidence >= this.MIN_CONFIDENCE_FOR_ENFORCEMENT);
    const averageConfidence = constraints.length > 0 
      ? constraints.reduce((sum, c) => sum + c.confidence, 0) / constraints.length 
      : 0;

    return {
      totalConstraints: constraints.length,
      activeConstraints: activeConstraints.length,
      constraintsBySeverity,
      constraintsByCategory,
      totalViolations: violations.length,
      unresolvedViolations: violations.filter(v => !v.resolved).length,
      averageConfidence,
      totalLearningSignals: this.learningSignals.size,
      totalFeedback: this.feedback.size
    };
  }

  /**
   * Apply confidence decay to all constraints
   */
  applyConfidenceDecay(): void {
    for (const constraint of this.constraints.values()) {
      constraint.confidence = Math.max(
        constraint.confidence - this.CONFIDENCE_DECAY_RATE,
        0.0
      );
    }
    this.saveConstraints();
  }

  /**
   * Save constraints to disk
   */
  private saveConstraints(): void {
    try {
      const fs = require('fs');
      const data = {
        constraints: Array.from(this.constraints.entries()),
        violations: Array.from(this.violations.entries()),
        feedback: Array.from(this.feedback.entries()),
        learningSignals: Array.from(this.learningSignals.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save ethical constraints:', error);
    }
  }

  /**
   * Load constraints from disk
   */
  private loadConstraints(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.constraints = new Map(data.constraints || []);
        this.violations = new Map(data.violations || []);
        this.feedback = new Map(data.feedback || []);
        this.learningSignals = new Map(data.learningSignals || []);
      }
    } catch (error) {
      console.error('Failed to load ethical constraints:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  private generateConstraintId(): string {
    return `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSignalId(): string {
    return `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { EthicalConstraintManager };
