// File: src/server/utils/ethicalConstraints.ts

export type EthicalConstraint = {
  constraintId: string;
  description: string;
  triggerExamples: string[];
  severity: number; // 0–1
  learnedFrom: "human" | "incident" | "feedback";
  created: number;
  lastTriggered?: number;
  triggerCount: number;
  active: boolean;
};

export type EthicalEvaluation = {
  violates: boolean;
  severity: number;
  constraintId?: string;
  reason: string;
  action: "allow" | "caution" | "block" | "escalate";
};

class EthicalConstraintManager {
  private static constraints: Map<string, EthicalConstraint> = new Map();
  private static violationLog: Array<{
    constraintId: string;
    action: string;
    timestamp: number;
    context: string;
    severity: number;
  }> = [];

  /**
   * Initialize default ethical constraints
   */
  static initializeConstraints(): void {
    const defaultConstraints: Omit<EthicalConstraint, "constraintId" | "created" | "triggerCount">[] = [
      {
        description: "Do not generate harmful or dangerous content",
        triggerExamples: [
          "generate harmful instructions",
          "create dangerous content",
          "produce violent material",
          "encourage self-harm"
        ],
        severity: 0.9,
        learnedFrom: "human",
        active: true
      },
      {
        description: "Respect user privacy and data protection",
        triggerExamples: [
          "access private messages",
          "share personal information",
          "extract private data",
          "violate privacy"
        ],
        severity: 0.8,
        learnedFrom: "human",
        active: true
      },
      {
        description: "Avoid discriminatory or biased content",
        triggerExamples: [
          "generate discriminatory content",
          "produce biased material",
          "create hate speech",
          "promote stereotypes"
        ],
        severity: 0.7,
        learnedFrom: "human",
        active: true
      },
      {
        description: "Do not deceive or mislead users",
        triggerExamples: [
          "generate false information",
          "create misleading content",
          "produce fake news",
          "deceive users"
        ],
        severity: 0.6,
        learnedFrom: "human",
        active: true
      },
      {
        description: "Respect intellectual property rights",
        triggerExamples: [
          "copy copyrighted material",
          "plagiarize content",
          "violate IP rights",
          "reproduce protected work"
        ],
        severity: 0.5,
        learnedFrom: "human",
        active: true
      }
    ];

    defaultConstraints.forEach(constraint => {
      const constraintId = `constraint_${constraint.description.toLowerCase().replace(/\s+/g, "_").substring(0, 20)}`;
      this.constraints.set(constraintId, {
        ...constraint,
        constraintId,
        created: Date.now(),
        triggerCount: 0
      });
    });
  }

  /**
   * Evaluate an action against ethical constraints
   */
  static evaluateAction(action: string, context: string): EthicalEvaluation {
    let maxSeverity = 0;
    let violatingConstraint: EthicalConstraint | null = null;
    
    // Check against all active constraints
    for (const constraint of this.constraints.values()) {
      if (!constraint.active) continue;
      
      // Simple keyword matching for trigger detection
      const actionLower = action.toLowerCase();
      const contextLower = context.toLowerCase();
      
      const matches = constraint.triggerExamples.filter(example => 
        actionLower.includes(example.toLowerCase()) || 
        contextLower.includes(example.toLowerCase())
      );
      
      if (matches.length > 0) {
        if (constraint.severity > maxSeverity) {
          maxSeverity = constraint.severity;
          violatingConstraint = constraint;
        }
      }
    }

    if (violatingConstraint) {
      // Update constraint stats
      violatingConstraint.triggerCount++;
      violatingConstraint.lastTriggered = Date.now();
      
      // Log violation
      this.violationLog.push({
        constraintId: violatingConstraint.constraintId,
        action,
        timestamp: Date.now(),
        context,
        severity: violatingConstraint.severity
      });
      
      // Determine action based on severity
      let responseAction: EthicalEvaluation["action"];
      let reason: string;
      
      if (violatingConstraint.severity >= 0.8) {
        responseAction = "block";
        reason = `High severity ethical violation: ${violatingConstraint.description}`;
      } else if (violatingConstraint.severity >= 0.6) {
        responseAction = "escalate";
        reason = `Medium severity ethical concern: ${violatingConstraint.description}`;
      } else if (violatingConstraint.severity >= 0.4) {
        responseAction = "caution";
        reason = `Low severity ethical warning: ${violatingConstraint.description}`;
      } else {
        responseAction = "allow";
        reason = `Minor ethical consideration: ${violatingConstraint.description}`;
      }
      
      return {
        violates: true,
        severity: violatingConstraint.severity,
        constraintId: violatingConstraint.constraintId,
        reason,
        action: responseAction
      };
    }

    return {
      violates: false,
      severity: 0,
      reason: "No ethical constraints violated",
      action: "allow"
    };
  }

  /**
   * Learn from human feedback
   */
  static learnFromFeedback(
    action: string,
    feedback: "approve" | "veto" | "concern",
    context: string,
    reason?: string
  ): void {
    if (feedback === "veto" || feedback === "concern") {
      // Create new constraint from human veto
      const constraintId = `learned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newConstraint: EthicalConstraint = {
        constraintId,
        description: reason || `Human vetoed: ${action.substring(0, 50)}...`,
        triggerExamples: [action],
        severity: feedback === "veto" ? 0.7 : 0.4,
        learnedFrom: "human",
        created: Date.now(),
        triggerCount: 1,
        lastTriggered: Date.now(),
        active: true
      };
      
      this.constraints.set(constraintId, newConstraint);
      console.log(`🚫 Learned new ethical constraint from human feedback: ${newConstraint.description}`);
    }
  }

  /**
   * Learn from incidents
   */
  static learnFromIncident(
    action: string,
    incident: string,
    severity: number,
    context: string
  ): void {
    const constraintId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newConstraint: EthicalConstraint = {
      constraintId,
      description: `Incident: ${incident}`,
      triggerExamples: [action],
      severity: Math.max(0.3, Math.min(0.9, severity)),
      learnedFrom: "incident",
      created: Date.now(),
      triggerCount: 1,
      lastTriggered: Date.now(),
      active: true
    };
    
    this.constraints.set(constraintId, newConstraint);
    console.log(`⚠️ Learned new ethical constraint from incident: ${newConstraint.description}`);
  }

  /**
   * Adjust constraint severity based on patterns
   */
  static adjustConstraintSeverity(constraintId: string, adjustment: number): void {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) return;
    
    // Adjust severity conservatively
    constraint.severity = Math.max(0.1, Math.min(0.9, constraint.severity + adjustment));
    
    // If severity drops too low, consider deactivating
    if (constraint.severity < 0.2) {
      constraint.active = false;
      console.log(`⏸️ Deactivated low-severity constraint: ${constraint.description}`);
    }
  }

  /**
   * Get all active constraints
   */
  static getActiveConstraints(): EthicalConstraint[] {
    return Array.from(this.constraints.values()).filter(c => c.active);
  }

  /**
   * Get constraints by severity level
   */
  static getConstraintsBySeverity(minSeverity: number): EthicalConstraint[] {
    return this.getActiveConstraints().filter(c => c.severity >= minSeverity);
  }

  /**
   * Get violation statistics
   */
  static getViolationStats(): {
    totalViolations: number;
    bySeverity: Record<string, number>;
    byConstraint: Array<{ constraintId: string; count: number; description: string }>;
    recentTrend: "increasing" | "decreasing" | "stable";
  } {
    const totalViolations = this.violationLog.length;
    
    const bySeverity = {
      high: this.violationLog.filter(v => v.severity >= 0.8).length,
      medium: this.violationLog.filter(v => v.severity >= 0.6 && v.severity < 0.8).length,
      low: this.violationLog.filter(v => v.severity < 0.6).length
    };
    
    const constraintCounts: Record<string, number> = {};
    this.violationLog.forEach(v => {
      constraintCounts[v.constraintId] = (constraintCounts[v.constraintId] || 0) + 1;
    });
    
    const byConstraint = Object.entries(constraintCounts)
      .map(([constraintId, count]) => {
        const constraint = this.constraints.get(constraintId);
        return {
          constraintId,
          count,
          description: constraint?.description || "Unknown constraint"
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate trend (last 10 vs previous 10)
    const recent = this.violationLog.slice(-10);
    const previous = this.violationLog.slice(-20, -10);
    const recentTrend: "increasing" | "decreasing" | "stable" = 
      recent.length > previous.length ? "increasing" :
      recent.length < previous.length ? "decreasing" : "stable";
    
    return {
      totalViolations,
      bySeverity,
      byConstraint,
      recentTrend
    };
  }

  /**
   * Get ethical compliance score
   */
  static getComplianceScore(): {
    overall: number;
    byCategory: Record<string, number>;
    recommendations: string[];
  } {
    const activeConstraints = this.getActiveConstraints();
    const totalViolations = this.violationLog.length;
    
    // Calculate overall compliance (inverse of violation rate)
    const totalActions = Math.max(1, this.violationLog.length + 100); // Estimate total actions
    const overall = Math.max(0, 1 - (totalViolations / totalActions));
    
    // Categorize constraints
    const byCategory: Record<string, number> = {
      safety: 0,
      privacy: 0,
      fairness: 0,
      transparency: 0,
      property: 0
    };
    
    activeConstraints.forEach(constraint => {
      const category = this.categorizeConstraint(constraint);
      const violations = this.violationLog.filter(v => v.constraintId === constraint.constraintId).length;
      const compliance = Math.max(0, 1 - (violations / Math.max(1, constraint.triggerCount)));
      byCategory[category] = (byCategory[category] + compliance) / 2;
    });
    
    // Generate recommendations
    const recommendations: string[] = [];
    const stats = this.getViolationStats();
    
    if (stats.recentTrend === "increasing") {
      recommendations.push("Recent violations increasing - review constraint effectiveness");
    }
    
    if (byCategory.safety < 0.8) {
      recommendations.push("Safety compliance below threshold - strengthen safety constraints");
    }
    
    if (stats.bySeverity.high > 0) {
      recommendations.push("High severity violations detected - immediate review required");
    }
    
    return {
      overall,
      byCategory,
      recommendations
    };
  }

  /**
   * Categorize constraint by type
   */
  private static categorizeConstraint(constraint: EthicalConstraint): string {
    const desc = constraint.description.toLowerCase();
    
    if (desc.includes("harm") || desc.includes("danger") || desc.includes("violent")) return "safety";
    if (desc.includes("privacy") || desc.includes("personal") || desc.includes("data")) return "privacy";
    if (desc.includes("discriminatory") || desc.includes("biased") || desc.includes("stereotype")) return "fairness";
    if (desc.includes("deceive") || desc.includes("mislead") || desc.includes("false")) return "transparency";
    if (desc.includes("copyright") || desc.includes("ip") || desc.includes("plagiar")) return "property";
    
    return "other";
  }

  /**
   * Export constraints for audit
   */
  static exportConstraints(): {
    constraints: EthicalConstraint[];
    violations: typeof EthicalConstraintManager.violationLog;
    compliance: ReturnType<typeof EthicalConstraintManager.getComplianceScore>;
    exportedAt: number;
  } {
    return {
      constraints: Array.from(this.constraints.values()),
      violations: this.violationLog,
      compliance: this.getComplianceScore(),
      exportedAt: Date.now()
    };
  }
}

// Initialize default constraints
EthicalConstraintManager.initializeConstraints();

export { EthicalConstraintManager };
