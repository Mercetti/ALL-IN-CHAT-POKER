/**
 * Constitutional Intelligence Layer
 * Integrates all constitutional systems into bounded autonomy with human sovereignty
 */

import { GovernanceContractManager, ActionProposal, GovernanceResult } from '../governance/contracts';
import { SkillEconomicsManager, SkillEconomics } from '../economics/skillEconomics';
import { GoalEmergenceManager, LongTermGoal } from '../goals/goalEmergence';
import { EthicalConstraintManager } from '../ethics/constraintLearning';
import { ClosedCognitiveLoop, CognitiveAction } from '../cognitive/closedLoop';

export interface ConstitutionalAction {
  actionId: string;
  actionType: string;
  description: string;
  context: string;
  confidence: number;
  proposedBy: "human" | "ai";
  timestamp: number;
  metadata?: Record<string, any>;
  priority?: number;
  skillId?: string;
}

export interface ConstitutionalResult {
  action: ConstitutionalAction;
  governanceResult: GovernanceResult;
  economicEvaluation: {
    viable: boolean;
    selectedSkill?: SkillEconomics;
    costBenefit: number;
    alternatives: SkillEconomics[];
  };
  ethicalEvaluation: {
    allowed: boolean;
    violations: any[];
    recommendation: string;
  };
  goalAlignment: {
    aligned: boolean;
    alignedGoals: LongTermGoal[];
    alignmentScore: number;
  };
  finalDecision: "execute" | "request_approval" | "block" | "escalate";
  reasoning: string[];
  executionPlan?: {
    steps: string[];
    estimatedTime: number;
    resources: string[];
  };
}

export interface ConstitutionalStats {
  governance: any;
  economics: any;
  goals: any;
  ethics: any;
  overall: "healthy" | "warning" | "critical";
  autonomyLevel: number; // 0-1
  humanOversightRequired: boolean;
}

class ConstitutionalIntelligenceLayer {
  private governanceManager: GovernanceContractManager;
  private economicsManager: SkillEconomicsManager;
  private goalManager: GoalEmergenceManager;
  private ethicsManager: EthicalConstraintManager;
  private cognitiveLoop: ClosedCognitiveLoop;

  // Constitutional parameters
  private readonly AUTONOMY_THRESHOLD = 0.8; // Minimum confidence for autonomy
  private readonly HUMAN_OVERRIDE_WEIGHT = 1.0; // Human intent always overrides
  private readonly ETHICAL_VETO_THRESHOLD = 0.7; // Ethics override threshold

  constructor() {
    this.governanceManager = new GovernanceContractManager();
    this.economicsManager = new SkillEconomicsManager();
    this.goalManager = new GoalEmergenceManager();
    this.ethicsManager = new EthicalConstraintManager();
    this.cognitiveLoop = new ClosedCognitiveLoop();
  }

  /**
   * Process an action through the complete constitutional pipeline
   */
  async processConstitutionalAction(
    action: Omit<ConstitutionalAction, 'actionId' | 'timestamp'>
  ): Promise<ConstitutionalResult> {
    const fullAction: ConstitutionalAction = {
      ...action,
      actionId: this.generateActionId(),
      timestamp: Date.now()
    };

    const reasoning: string[] = [];

    try {
      // Step 1: Governance Contract Check
      reasoning.push("Checking governance contracts...");
      const governanceResult = this.checkGovernance(fullAction);
      reasoning.push(`Governance result: ${governanceResult.action} - ${governanceResult.reason}`);

      if (governanceResult.action === "block") {
        return this.createBlockedResult(fullAction, governanceResult, reasoning, "Governance contract violation");
      }

      // Step 2: Economic Evaluation
      reasoning.push("Evaluating economic viability...");
      const economicEvaluation = this.evaluateEconomics(fullAction);
      reasoning.push(`Economic evaluation: ${economicEvaluation.viable ? "viable" : "not viable"} (cost-benefit: ${economicEvaluation.costBenefit.toFixed(2)})`);

      if (!economicEvaluation.viable && governanceResult.action !== "request_approval") {
        return this.createBlockedResult(fullAction, governanceResult, reasoning, "Economic constraints");
      }

      // Step 3: Ethical Constraint Scan
      reasoning.push("Scanning ethical constraints...");
      const ethicalEvaluation = this.checkEthics(fullAction);
      reasoning.push(`Ethical evaluation: ${ethicalEvaluation.allowed ? "allowed" : "blocked"} - ${ethicalEvaluation.recommendation}`);

      if (!ethicalEvaluation.allowed) {
        return this.createBlockedResult(fullAction, governanceResult, reasoning, "Ethical constraints");
      }

      // Step 4: Long-Term Goal Alignment
      reasoning.push("Checking goal alignment...");
      const goalAlignment = this.checkGoalAlignment(fullAction);
      reasoning.push(`Goal alignment: ${goalAlignment.aligned ? "aligned" : "misaligned"} (score: ${goalAlignment.alignmentScore.toFixed(2)})`);

      // Step 5: Final Decision
      reasoning.push("Making final constitutional decision...");
      const finalDecision = this.makeFinalDecision(
        governanceResult,
        economicEvaluation,
        ethicalEvaluation,
        goalAlignment,
        reasoning
      );

      // Step 6: Generate execution plan if approved
      let executionPlan;
      if (finalDecision === "execute") {
        executionPlan = this.generateExecutionPlan(fullAction, economicEvaluation.selectedSkill);
        reasoning.push("Generated execution plan");
      }

      return {
        action: fullAction,
        governanceResult,
        economicEvaluation,
        ethicalEvaluation,
        goalAlignment,
        finalDecision,
        reasoning,
        executionPlan
      };

    } catch (error) {
      console.error('Constitutional processing error:', error);
      reasoning.push(`Error during processing: ${error.message}`);
      
      return this.createBlockedResult(fullAction, {
        allowed: false,
        action: "block",
        reason: "System error during constitutional processing"
      }, reasoning, "Processing error");
    }
  }

  /**
   * Check governance contracts
   */
  private checkGovernance(action: ConstitutionalAction): GovernanceResult {
    const proposal: ActionProposal = {
      actionId: action.actionId,
      actionType: action.actionType,
      description: action.description,
      confidence: action.confidence,
      context: action.context,
      proposedBy: action.proposedBy,
      timestamp: action.timestamp,
      metadata: action.metadata
    };

    return this.governanceManager.evaluateAction(proposal);
  }

  /**
   * Evaluate economic viability
   */
  private evaluateEconomics(action: ConstitutionalAction): {
    viable: boolean;
    selectedSkill?: SkillEconomics;
    costBenefit: number;
    alternatives: SkillEconomics[];
  } {
    // Get best skills for this context
    const bestSkills = this.economicsManager.getBestSkills(action.context, 5);
    
    if (bestSkills.length === 0) {
      return {
        viable: false,
        costBenefit: 0,
        alternatives: []
      };
    }

    // Select the best skill
    const selectedSkill = bestSkills[0];
    const costBenefit = selectedSkill.netValue;

    // Determine viability
    const viable = costBenefit > 0.2 && selectedSkill.status === "active";

    return {
      viable,
      selectedSkill,
      costBenefit,
      alternatives: bestSkills.slice(1)
    };
  }

  /**
   * Check ethical constraints
   */
  private checkEthics(action: ConstitutionalAction): {
    allowed: boolean;
    violations: any[];
    recommendation: string;
  } {
    return this.ethicsManager.checkEthicalConstraints(
      action.actionId,
      action.description,
      action.context
    );
  }

  /**
   * Check goal alignment
   */
  private checkGoalAlignment(action: ConstitutionalAction): {
    aligned: boolean;
    alignedGoals: LongTermGoal[];
    alignmentScore: number;
  } {
    return this.goalManager.checkGoalAlignment(action.actionType, action.context);
  }

  /**
   * Make final constitutional decision
   */
  private makeFinalDecision(
    governanceResult: GovernanceResult,
    economicEvaluation: any,
    ethicalEvaluation: any,
    goalAlignment: any,
    reasoning: string[]
  ): "execute" | "request_approval" | "block" | "escalate" {
    // Priority 1: Governance contract requirements
    if (governanceResult.action === "block") {
      return "block";
    }

    if (governanceResult.action === "request_approval") {
      return "request_approval";
    }

    // Priority 2: Ethical constraints (override everything else)
    if (!ethicalEvaluation.allowed) {
      reasoning.push("Ethical constraints override other considerations");
      return "block";
    }

    // Priority 3: Economic viability
    if (!economicEvaluation.viable) {
      reasoning.push("Economic constraints prevent execution");
      return "request_approval";
    }

    // Priority 4: Goal alignment (soft constraint)
    if (!goalAlignment.aligned && goalAlignment.alignmentScore < 0.3) {
      reasoning.push("Poor goal alignment requires review");
      return "request_approval";
    }

    // Priority 5: Overall confidence and autonomy
    const overallConfidence = this.calculateOverallConfidence(
      governanceResult,
      economicEvaluation,
      ethicalEvaluation,
      goalAlignment
    );

    if (overallConfidence >= this.AUTONOMY_THRESHOLD) {
      return "execute";
    } else {
      return "request_approval";
    }
  }

  /**
   * Calculate overall confidence for autonomous execution
   */
  private calculateOverallConfidence(
    governanceResult: GovernanceResult,
    economicEvaluation: any,
    ethicalEvaluation: any,
    goalAlignment: any
  ): number {
    let confidence = 0.5; // Base confidence

    // Governance confidence
    if (governanceResult.allowed) {
      confidence += 0.2;
    }

    // Economic confidence
    if (economicEvaluation.viable) {
      confidence += economicEvaluation.costBenefit * 0.2;
    }

    // Ethical confidence
    if (ethicalEvaluation.allowed && ethicalEvaluation.violations.length === 0) {
      confidence += 0.2;
    }

    // Goal alignment confidence
    confidence += goalAlignment.alignmentScore * 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate execution plan
   */
  private generateExecutionPlan(action: ConstitutionalAction, skill?: SkillEconomics): {
    steps: string[];
    estimatedTime: number;
    resources: string[];
  } {
    const steps = [
      "Initialize execution context",
      "Load required skill modules",
      "Execute action with monitoring",
      "Validate results against constraints",
      "Update learning systems"
    ];

    let estimatedTime = 5000; // 5 seconds base
    if (skill) {
      estimatedTime = skill.latencyCost * 10000; // Scale by latency cost
    }

    const resources = ["compute", "memory", "skill_execution"];
    if (skill) {
      resources.push(skill.skillId);
    }

    return {
      steps,
      estimatedTime,
      resources
    };
  }

  /**
   * Create blocked result
   */
  private createBlockedResult(
    action: ConstitutionalAction,
    governanceResult: GovernanceResult,
    reasoning: string[],
    blockReason: string
  ): ConstitutionalResult {
    return {
      action,
      governanceResult,
      economicEvaluation: {
        viable: false,
        costBenefit: 0,
        alternatives: []
      },
      ethicalEvaluation: {
        allowed: false,
        violations: [],
        recommendation: blockReason
      },
      goalAlignment: {
        aligned: false,
        alignedGoals: [],
        alignmentScore: 0
      },
      finalDecision: "block",
      reasoning,
      executionPlan: undefined
    };
  }

  /**
   * Execute an approved action
   */
  async executeAction(result: ConstitutionalResult): Promise<{
    success: boolean;
    output?: any;
    error?: string;
    executionTime: number;
  }> {
    if (result.finalDecision !== "execute") {
      return {
        success: false,
        error: "Action not approved for execution",
        executionTime: 0
      };
    }

    const startTime = Date.now();

    try {
      // Execute through cognitive loop
      const cognitiveAction: CognitiveAction = {
        id: result.action.actionId,
        type: "response",
        input: result.action.description,
        output: "", // Will be generated
        confidence: result.action.confidence,
        context: result.action.context,
        modelVersion: "constitutional-v1.0"
      };

      const cognitiveResult = await this.cognitiveLoop.processAction(cognitiveAction);

      // Record skill execution if applicable
      if (result.economicEvaluation.selectedSkill) {
        this.economicsManager.recordExecution({
          executionId: this.generateExecutionId(),
          skillId: result.economicEvaluation.selectedSkill.skillId,
          startTime,
          endTime: Date.now(),
          success: cognitiveResult.success,
          computeTime: result.executionPlan?.estimatedTime || 1000,
          memoryUsage: 0.5,
          reward: cognitiveResult.success ? 0.8 : 0.2,
          trustImpact: cognitiveResult.success ? 0.1 : -0.05,
          context: result.action.context
        });
      }

      return {
        success: cognitiveResult.success,
        output: cognitiveResult.finalOutput,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process human override
   */
  processHumanOverride(
    actionId: string,
    overrideAction: "approve" | "veto" | "modify",
    reason?: string
  ): void {
    // Record human override in governance system
    console.log(`Human override for action ${actionId}: ${overrideAction}`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    // Update learning systems based on override
    if (overrideAction === "veto") {
      this.ethicsManager.processLearningSignal({
        type: "human_veto",
        description: reason || "Human vetoed action",
        context: "human_override",
        severity: 0.8,
        timestamp: Date.now(),
        source: "human"
      });
    }
  }

  /**
   * Get comprehensive constitutional statistics
   */
  getConstitutionalStats(): ConstitutionalStats {
    const governanceStats = this.governanceManager.getStats();
    const economicsStats = this.economicsManager.getEconomicsStats();
    const goalStats = this.goalManager.getGoalStats();
    const ethicsStats = this.ethicsManager.getEthicsStats();

    // Determine overall system health
    let overall: "healthy" | "warning" | "critical" = "healthy";

    if (ethicsStats.totalViolations > 10 || governanceStats.totalViolations > 5) {
      overall = "critical";
    } else if (ethicsStats.totalViolations > 5 || economicsStats.averageNetValue < 0.3) {
      overall = "warning";
    }

    // Calculate autonomy level
    const autonomyLevel = this.calculateAutonomyLevel();

    // Check if human oversight is required
    const humanOversightRequired = overall !== "healthy" || autonomyLevel < 0.7;

    return {
      governance: governanceStats,
      economics: economicsStats,
      goals: goalStats,
      ethics: ethicsStats,
      overall,
      autonomyLevel,
      humanOversightRequired
    };
  }

  /**
   * Calculate current autonomy level
   */
  private calculateAutonomyLevel(): number {
    const stats = this.getConstitutionalStats();
    
    let autonomy = 0.5; // Base autonomy

    // Governance compliance increases autonomy
    if (stats.governance.totalViolations === 0) {
      autonomy += 0.2;
    }

    // Economic health increases autonomy
    if (stats.economics.averageNetValue > 0.5) {
      autonomy += 0.1;
    }

    // Ethical compliance increases autonomy
    if (stats.ethics.totalViolations === 0) {
      autonomy += 0.2;
    }

    // Goal alignment increases autonomy
    if (stats.goals.activeGoals > 0 && stats.goals.averageConfidence > 0.7) {
      autonomy += 0.1;
    }

    return Math.min(autonomy, 1.0);
  }

  /**
   * Update constitutional parameters
   */
  updateParameters(params: {
    autonomyThreshold?: number;
    humanOverrideWeight?: number;
    ethicalVetoThreshold?: number;
  }): void {
    if (params.autonomyThreshold !== undefined) {
      // Would update threshold in a real implementation
    }
    if (params.humanOverrideWeight !== undefined) {
      // Would update weight in a real implementation
    }
    if (params.ethicalVetoThreshold !== undefined) {
      // Would update threshold in a real implementation
    }
  }

  /**
   * Generate unique IDs
   */
  private generateActionId(): string {
    return `const_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { ConstitutionalIntelligenceLayer };
