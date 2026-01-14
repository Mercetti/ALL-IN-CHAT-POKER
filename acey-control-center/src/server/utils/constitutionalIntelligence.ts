// File: src/server/utils/constitutionalIntelligence.ts

import { GovernanceContractManager, ActionEvaluation } from './governanceContracts';
import { SkillEconomicsManager, SkillEconomics } from './skillEconomics';
import { LongTermGoalManager, LongTermGoal } from './longTermGoals';
import { EthicalConstraintManager, EthicalEvaluation } from './ethicalConstraints';

export type ActionProposal = {
  actionId: string;
  action: string;
  context: string;
  skillId: string;
  confidence: number;
  timestamp: number;
  metadata?: Record<string, any>;
};

export type ConstitutionalEvaluation = {
  actionId: string;
  allowed: boolean;
  governance: ActionEvaluation;
  economics: {
    skill: SkillEconomics | null;
    costBenefit: "promote" | "maintain" | "throttle" | "retire";
    netValue: number;
  };
  ethics: EthicalEvaluation;
  goals: {
    aligned: boolean;
    supportingGoals: string[];
    conflictingGoals: string[];
    alignmentScore: number;
  };
  finalDecision: "execute" | "block" | "escalate" | "request_approval";
  reasoning: string[];
  humanOverrideRequired: boolean;
  timestamp: number;
};

class ConstitutionalIntelligence {
  private static initialized = false;
  
  /**
   * Initialize the constitutional intelligence layer
   */
  static initialize(): void {
    if (this.initialized) return;
    
    console.log("🏛️ Initializing Constitutional Intelligence Layer...");
    
    // All subsystems are auto-initialized via their static initializers
    this.initialized = true;
    
    console.log("✅ Constitutional Intelligence Layer ready");
  }

  /**
   * Process an action proposal through the constitutional pipeline
   */
  static async evaluateAction(proposal: ActionProposal): Promise<ConstitutionalEvaluation> {
    if (!this.initialized) {
      this.initialize();
    }

    const reasoning: string[] = [];
    let finalDecision: ConstitutionalEvaluation["finalDecision"] = "execute";
    let humanOverrideRequired = false;

    // Step 1: Governance Contract Check
    const governance = GovernanceContractManager.evaluateAction(proposal.action, proposal.context as any);
    reasoning.push(`Governance: ${governance.reason}`);
    
    if (!governance.allowed) {
      if (governance.requiresApproval) {
        finalDecision = "request_approval";
        humanOverrideRequired = true;
        reasoning.push("⚠️ Action requires human approval");
      } else {
        finalDecision = "block";
        reasoning.push("🚫 Action forbidden by governance contract");
      }
    }

    // Step 2: Skill Economic Evaluation
    const skill = SkillEconomicsManager.getEconomics(proposal.skillId);
    const costBenefit = skill ? SkillEconomicsManager.getCostBenefitAnalysis(proposal.skillId) : null;
    
    if (skill) {
      reasoning.push(`Economics: Skill net value ${skill.netValue.toFixed(2)} (${costBenefit?.recommendation})`);
      
      // Economic veto for very low value skills
      if (skill.netValue < -0.5 && costBenefit?.recommendation === "retire") {
        if (finalDecision === "execute") {
          finalDecision = "escalate";
          reasoning.push("⚠️ Low economic value - escalation recommended");
        }
      }
    } else {
      reasoning.push("Economics: Unknown skill - proceeding with caution");
    }

    // Step 3: Ethical Constraint Scan
    const ethics = EthicalConstraintManager.evaluateAction(proposal.action, proposal.context);
    reasoning.push(`Ethics: ${ethics.reason}`);
    
    if (ethics.violates) {
      if (ethics.action === "block") {
        finalDecision = "block";
        reasoning.push("🚫 Ethical constraint violation - action blocked");
      } else if (ethics.action === "escalate") {
        finalDecision = "escalate";
        reasoning.push("⚠️ Ethical concern - escalation required");
      } else if (ethics.action === "caution" && finalDecision === "execute") {
        finalDecision = "request_approval";
        humanOverrideRequired = true;
        reasoning.push("⚠️ Ethical caution - human approval recommended");
      }
    }

    // Step 4: Long-Term Goal Alignment
    const goals = LongTermGoalManager.checkGoalAlignment(proposal.action, proposal.context);
    reasoning.push(`Goals: ${goals.aligned ? 'Aligned' : 'Not aligned'} (${goals.supportingGoals.length} supporting, ${goals.conflictingGoals.length} conflicting)`);
    
    if (goals.conflictingGoals.length > 0 && finalDecision === "execute") {
      finalDecision = "escalate";
      reasoning.push("⚠️ Conflicts with long-term goals - escalation recommended");
    }

    // Final decision logic
    if (finalDecision === "execute" && proposal.confidence < 0.7) {
      finalDecision = "request_approval";
      humanOverrideRequired = true;
      reasoning.push("⚠️ Low confidence - human approval recommended");
    }

    // Human authority override
    if (humanOverrideRequired || finalDecision === "request_approval") {
      reasoning.push("👤 Human authority required");
    }

    const evaluation: ConstitutionalEvaluation = {
      actionId: proposal.actionId,
      allowed: finalDecision === "execute",
      governance,
      economics: {
        skill,
        costBenefit: costBenefit?.recommendation || "maintain",
        netValue: skill?.netValue || 0
      },
      ethics,
      goals,
      finalDecision,
      reasoning,
      humanOverrideRequired,
      timestamp: Date.now()
    };

    // Log evaluation for audit
    this.logEvaluation(evaluation);

    return evaluation;
  }

  /**
   * Execute action with constitutional oversight
   */
  static async executeAction(
    proposal: ActionProposal,
    executor: () => Promise<any>
  ): Promise<{
    success: boolean;
    result?: any;
    evaluation: ConstitutionalEvaluation;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const evaluation = await this.evaluateAction(proposal);
    
    if (!evaluation.allowed) {
      return {
        success: false,
        evaluation,
        executionTime: Date.now() - startTime
      };
    }

    try {
      const result = await executor();
      
      // Update skill performance if applicable
      if (evaluation.economics.skill) {
        SkillEconomicsManager.updatePerformance(proposal.skillId, {
          success: true,
          latency: Date.now() - startTime,
          computeTime: Date.now() - startTime, // Simplified
          trustScore: proposal.confidence
        });
      }

      // Record positive outcome for goals if aligned
      if (evaluation.goals.aligned && evaluation.goals.supportingGoals.length > 0) {
        evaluation.goals.supportingGoals.forEach(goalId => {
          LongTermGoalManager.updateGoalOutcome(goalId, "positive");
        });
      }

      return {
        success: true,
        result,
        evaluation,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      // Update skill performance on failure
      if (evaluation.economics.skill) {
        SkillEconomicsManager.updatePerformance(proposal.skillId, {
          success: false,
          latency: Date.now() - startTime,
          computeTime: Date.now() - startTime,
          trustScore: 0
        });
      }

      // Record negative outcome for goals if aligned
      if (evaluation.goals.aligned && evaluation.goals.supportingGoals.length > 0) {
        evaluation.goals.supportingGoals.forEach(goalId => {
          LongTermGoalManager.updateGoalOutcome(goalId, "negative");
        });
      }

      return {
        success: false,
        evaluation,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Record human feedback for learning
   */
  static recordHumanFeedback(
    actionId: string,
    feedback: "approve" | "veto" | "concern",
    reason?: string
  ): void {
    // Learn ethical constraints from human feedback
    if (feedback === "veto" || feedback === "concern") {
      EthicalConstraintManager.learnFromFeedback(
        actionId,
        feedback,
        "human_override",
        reason
      );
    }

    console.log(`👤 Human feedback recorded: ${feedback} for ${actionId}`);
  }

  /**
   * Get constitutional intelligence statistics
   */
  static getStats(): {
    governance: {
      totalContracts: number;
      activeContracts: number;
    };
    economics: {
      totalSkills: number;
      highValueSkills: number;
      lowValueSkills: number;
    };
    goals: {
      totalGoals: number;
      activeGoals: number;
      avgConfidence: number;
    };
    ethics: {
      totalConstraints: number;
      activeConstraints: number;
      violationRate: number;
      complianceScore: number;
    };
  } {
    return {
      governance: {
        totalContracts: GovernanceContractManager.getAllContracts().length,
        activeContracts: GovernanceContractManager.getAllContracts().length // All are active for now
      },
      economics: {
        totalSkills: SkillEconomicsManager.getSkillsByValue().length,
        highValueSkills: SkillEconomicsManager.getHighValueSkills().length,
        lowValueSkills: SkillEconomicsManager.getLowValueSkills().length
      },
      goals: LongTermGoalManager.getGoalStats(),
      ethics: {
        totalConstraints: EthicalConstraintManager.getActiveConstraints().length,
        activeConstraints: EthicalConstraintManager.getActiveConstraints().length,
        violationRate: EthicalConstraintManager.getViolationStats().totalViolations / 1000, // Simplified
        complianceScore: EthicalConstraintManager.getComplianceScore().overall
      }
    };
  }

  /**
   * Auto-governance: run periodic maintenance
   */
  static runAutoGovernance(): {
    skillUpdates: ReturnType<typeof SkillEconomicsManager.autoGovern>;
    goalPruning: string[];
    constraintAdjustments: number;
  } {
    const skillUpdates = SkillEconomicsManager.autoGovern();
    const goalPruning = LongTermGoalManager.pruneGoals();
    
    // Adjust constraint severity based on violation patterns
    const violationStats = EthicalConstraintManager.getViolationStats();
    let constraintAdjustments = 0;
    
    if (violationStats.recentTrend === "increasing") {
      // Increase severity for frequently violated constraints
      EthicalConstraintManager.getActiveConstraints()
        .filter(c => c.triggerCount > 5)
        .forEach(c => {
          EthicalConstraintManager.adjustConstraintSeverity(c.constraintId, 0.1);
          constraintAdjustments++;
        });
    }

    return {
      skillUpdates,
      goalPruning,
      constraintAdjustments
    };
  }

  /**
   * Export constitutional state for audit
   */
  static exportForAudit(): {
    timestamp: number;
    governance: any;
    economics: any;
    goals: any;
    ethics: any;
    stats: ReturnType<typeof ConstitutionalIntelligence.getStats>;
  } {
    return {
      timestamp: Date.now(),
      governance: {
        contracts: GovernanceContractManager.getAllContracts()
      },
      economics: {
        skills: SkillEconomicsManager.getSkillsByValue(),
        performance: Array.from(SkillEconomicsManager.getSkillsByValue()).map(s => ({
          skillId: s.skillId,
          performance: SkillEconomicsManager.getPerformance(s.skillId)
        }))
      },
      goals: {
        active: LongTermGoalManager.getActiveGoals(),
        stats: LongTermGoalManager.getGoalStats()
      },
      ethics: EthicalConstraintManager.exportConstraints(),
      stats: this.getStats()
    };
  }

  /**
   * Log evaluation for audit trail
   */
  private static logEvaluation(evaluation: ConstitutionalEvaluation): void {
    const logEntry = {
      timestamp: evaluation.timestamp,
      actionId: evaluation.actionId,
      decision: evaluation.finalDecision,
      allowed: evaluation.allowed,
      humanOverride: evaluation.humanOverrideRequired,
      reasoning: evaluation.reasoning
    };
    
    console.log(`🏛️ Constitutional Evaluation: ${evaluation.actionId} -> ${evaluation.finalDecision}`);
  }
}

export { ConstitutionalIntelligence };
