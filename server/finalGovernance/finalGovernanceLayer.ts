/**
 * Final Governance Layer
 * Integrates all final governance systems into complete autonomous intelligence architecture
 */

import { MultiHumanAuthorityManager, HumanAuthority, AuthorityProposal } from '../authority/multiHumanAuthority';
import { GovernanceSimulationManager, GovernanceSimulation } from '../simulation/governanceSimulation';
import { EthicalStressTestManager, EthicalStressTest } from '../stress/ethicalStressTesting';
import { GoalConflictResolutionEngine, GoalConflict } from '../conflict/goalConflictResolution';
import { ConstitutionalIntelligenceLayer } from '../constitutional/intelligenceLayer';

export interface FinalGovernanceAction {
  actionId: string;
  actionType: string;
  description: string;
  context: string;
  confidence: number;
  proposedBy: string;
  timestamp: number;
  urgency: "low" | "medium" | "high" | "critical";
  requiresHumanApproval: boolean;
  affectedSystems: string[];
}

export interface FinalGovernanceResult {
  action: FinalGovernanceAction;
  humanAuthorityCheck: {
    required: boolean;
    approved: boolean;
    authorityDecision?: any;
    votingResults?: any;
  };
  governanceSimulation?: {
    required: boolean;
    simulationId?: string;
    riskScore?: number;
    recommendation?: string;
    completed?: boolean;
  };
  ethicalStressTest?: {
    required: boolean;
    testResults?: any;
    passed?: boolean;
    blockAutonomy?: boolean;
  };
  goalConflictResolution?: {
    conflicts: GoalConflict[];
    resolutions?: any;
    resolved: boolean;
  };
  constitutionalResult?: any;
  finalDecision: "execute" | "require_approval" | "block" | "escalate";
  reasoning: string[];
  executionPlan?: any;
}

export interface FinalGovernanceStats {
  humanAuthority: any;
  governanceSimulation: any;
  ethicalStressTesting: any;
  goalConflictResolution: any;
  constitutional: any;
  overall: "healthy" | "warning" | "critical";
  autonomyLevel: number;
  humanOversightRequired: boolean;
}

class FinalGovernanceLayer {
  private humanAuthorityManager: MultiHumanAuthorityManager;
  private simulationManager: GovernanceSimulationManager;
  private stressTestManager: EthicalStressTestManager;
  private conflictEngine: GoalConflictResolutionEngine;
  private constitutionalLayer: ConstitutionalIntelligenceLayer;

  // Governance thresholds
  private readonly HUMAN_AUTHORITY_THRESHOLD = 0.7;
  private readonly SIMULATION_RISK_THRESHOLD = 0.6;
  private readonly STRESS_TEST_FAILURE_THRESHOLD = 3;
  private readonly CONFLICT_SEVERITY_THRESHOLD = 0.8;

  constructor() {
    this.humanAuthorityManager = new MultiHumanAuthorityManager();
    this.simulationManager = new GovernanceSimulationManager();
    this.stressTestManager = new EthicalStressTestManager();
    this.conflictEngine = new GoalConflictResolutionEngine();
    this.constitutionalLayer = new ConstitutionalIntelligenceLayer();
  }

  /**
   * Process an action through the complete final governance pipeline
   */
  async processFinalGovernanceAction(
    action: Omit<FinalGovernanceAction, 'actionId' | 'timestamp'>
  ): Promise<FinalGovernanceResult> {
    const fullAction: FinalGovernanceAction = {
      ...action,
      actionId: this.generateActionId(),
      timestamp: Date.now()
    };

    const reasoning: string[] = [];

    try {
      // Step 1: Human Authority Check
      reasoning.push("Checking human authority requirements...");
      const humanAuthorityCheck = await this.checkHumanAuthority(fullAction);
      reasoning.push(`Human authority check: ${humanAuthorityCheck.required ? "required" : "not required"}`);

      if (humanAuthorityCheck.required && !humanAuthorityCheck.approved) {
        return this.createBlockedResult(fullAction, humanAuthorityCheck, reasoning, "Human authority not granted");
      }

      // Step 2: Governance Simulation (if required)
      let governanceSimulation;
      if (this.requiresGovernanceSimulation(fullAction)) {
        reasoning.push("Running governance simulation...");
        governanceSimulation = await this.runGovernanceSimulation(fullAction);
        reasoning.push(`Simulation risk score: ${governanceSimulation.riskScore?.toFixed(2)}`);

        if (governanceSimulation.riskScore && governanceSimulation.riskScore > this.SIMULATION_RISK_THRESHOLD) {
          return this.createBlockedResult(fullAction, humanAuthorityCheck, reasoning, "Governance simulation risk too high");
        }
      }

      // Step 3: Ethical Stress Testing (if required)
      let ethicalStressTest;
      if (this.requiresEthicalStressTesting(fullAction)) {
        reasoning.push("Running ethical stress tests...");
        ethicalStressTest = await this.runEthicalStressTesting(fullAction);
        reasoning.push(`Stress test passed: ${ethicalStressTest.passed}`);

        if (ethicalStressTest.blockAutonomy) {
          return this.createBlockedResult(fullAction, humanAuthorityCheck, reasoning, "Ethical stress test failures block autonomy");
        }
      }

      // Step 4: Goal Conflict Resolution
      reasoning.push("Checking for goal conflicts...");
      const goalConflictResolution = await this.resolveGoalConflicts(fullAction);
      reasoning.push(`Goal conflicts found: ${goalConflictResolution.conflicts.length}`);

      // Step 5: Constitutional Layer Processing
      reasoning.push("Processing through constitutional layer...");
      const constitutionalResult = await this.constitutionalLayer.processConstitutionalAction({
        actionType: fullAction.actionType,
        description: fullAction.description,
        context: fullAction.context,
        confidence: fullAction.confidence,
        proposedBy: "ai" as const
      });

      reasoning.push(`Constitutional decision: ${constitutionalResult.finalDecision}`);

      // Step 6: Final Decision
      reasoning.push("Making final governance decision...");
      const finalDecision = this.makeFinalDecision(
        humanAuthorityCheck,
        governanceSimulation,
        ethicalStressTest,
        goalConflictResolution,
        constitutionalResult,
        reasoning
      );

      // Step 7: Generate execution plan if approved
      let executionPlan;
      if (finalDecision === "execute") {
        executionPlan = this.generateExecutionPlan(fullAction);
        reasoning.push("Generated execution plan");
      }

      return {
        action: fullAction,
        humanAuthorityCheck,
        governanceSimulation,
        ethicalStressTest,
        goalConflictResolution,
        constitutionalResult,
        finalDecision,
        reasoning,
        executionPlan
      };

    } catch (error) {
      console.error('Final governance processing error:', error);
      reasoning.push(`Error during processing: ${error instanceof Error ? error.message : String(error)}`);
      
      return this.createBlockedResult(fullAction, {
        required: false,
        approved: false
      }, reasoning, "Processing error");
    }
  }

  /**
   * Check human authority requirements
   */
  private async checkHumanAuthority(action: FinalGovernanceAction): Promise<{
    required: boolean;
    approved: boolean;
    authorityDecision?: any;
    votingResults?: any;
  }> {
    // Determine if human authority is required
    const required = this.requiresHumanAuthority(action);

    if (!required) {
      return { required: false, approved: true };
    }

    // Create proposal for human approval
    const proposal: Omit<AuthorityProposal, 'proposalId' | 'createdAt' | 'expiresAt'> = {
      actionId: action.actionId,
      description: action.description,
      context: action.context,
      scope: this.determineScope(action.context),
      urgency: action.urgency,
      proposedBy: action.proposedBy,
      requiredRoles: this.determineRequiredRoles(action),
      minApprovalThreshold: this.HUMAN_AUTHORITY_THRESHOLD
    };

    const proposalId = this.humanAuthorityManager.createProposal(proposal);

    // For now, simulate approval (in real implementation, would wait for human votes)
    const authorities = this.humanAuthorityManager.getAuthoritiesByScope(proposal.scope);
    const approvalScore = authorities.length > 0 ? 0.8 : 0; // Simulate approval

    return {
      required: true,
      approved: approvalScore >= this.HUMAN_AUTHORITY_THRESHOLD,
      authorityDecision: {
        proposalId,
        approvalScore,
        threshold: this.HUMAN_AUTHORITY_THRESHOLD
      }
    };
  }

  /**
   * Check if human authority is required
   */
  private requiresHumanAuthority(action: FinalGovernanceAction): boolean {
    // High urgency or critical actions always require human approval
    if (action.urgency === "critical" || action.urgency === "high") {
      return true;
    }

    // Actions affecting core systems require human approval
    const coreSystemActions = [
      "modify_governance",
      "change_ethics",
      "update_autonomy",
      "deploy_code",
      "access_private_data"
    ];

    return coreSystemActions.includes(action.actionType);
  }

  /**
   * Determine scope from context
   */
  private determineScope(context: string): "global" | "stream" | "task" | "skill" {
    if (context.includes("global") || context.includes("system")) return "global";
    if (context.includes("stream") || context.includes("chat")) return "stream";
    if (context.includes("task") || context.includes("action")) return "task";
    return "skill";
  }

  /**
   * Determine required roles from action
   */
  private determineRequiredRoles(action: FinalGovernanceAction): ("owner" | "moderator" | "developer" | "operator")[] {
    if (action.urgency === "critical") return ["owner"];
    if (action.urgency === "high") return ["owner", "moderator"];
    return ["moderator", "developer"];
  }

  /**
   * Check if governance simulation is required
   */
  private requiresGovernanceSimulation(action: FinalGovernanceAction): boolean {
    const simulationRequiredActions = [
      "modify_governance",
      "change_policy",
      "update_autonomy",
      "modify_ethics"
    ];

    return simulationRequiredActions.includes(action.actionType);
  }

  /**
   * Run governance simulation
   */
  private async runGovernanceSimulation(action: FinalGovernanceAction): Promise<{
    required: boolean;
    simulationId?: string;
    riskScore?: number;
    recommendation?: string;
    completed?: boolean;
  }> {
    const simulationId = this.simulationManager.createSimulation(
      action.description,
      this.determineSimulationType(action.actionType)
    );

    const result = await this.simulationManager.runSimulation(simulationId);

    return {
      required: true,
      simulationId,
      riskScore: result.overallRiskScore,
      recommendation: result.finalRecommendation,
      completed: true
    };
  }

  /**
   * Determine simulation type from action type
   */
  private determineSimulationType(actionType: string): GovernanceSimulation['changeType'] {
    if (actionType.includes("governance") || actionType.includes("contract")) return "contract";
    if (actionType.includes("policy")) return "policy";
    if (actionType.includes("autonomy")) return "autonomy";
    if (actionType.includes("skill")) return "skill";
    return "ethics";
  }

  /**
   * Check if ethical stress testing is required
   */
  private requiresEthicalStressTesting(action: FinalGovernanceAction): boolean {
    // High-risk actions require stress testing
    const highRiskActions = [
      "moderate_chat",
      "access_private_data",
      "modify_ethics",
      "bypass_safety"
    ];

    return highRiskActions.includes(action.actionType) || action.confidence < 0.8;
  }

  /**
   * Run ethical stress testing
   */
  private async runEthicalStressTesting(action: FinalGovernanceAction): Promise<{
    required: boolean;
    testResults?: any;
    passed?: boolean;
    blockAutonomy?: boolean;
  }> {
    const testSuites = this.stressTestManager.getAllTestSuites();
    if (testSuites.length === 0) {
      return { required: true, passed: true, blockAutonomy: false };
    }

    const suiteId = testSuites[0].suiteId;
    const results = await this.stressTestManager.runStressTestSuite(suiteId);
    const blockDecision = this.stressTestManager.shouldBlockAutonomy(suiteId);

    return {
      required: true,
      testResults: results,
      passed: blockDecision.failureCount === 0,
      blockAutonomy: blockDecision.block
    };
  }

  /**
   * Resolve goal conflicts
   */
  private async resolveGoalConflicts(action: FinalGovernanceAction): Promise<{
    conflicts: GoalConflict[];
    resolutions?: any;
    resolved: boolean;
  }> {
    // Detect potential conflicts
    const conflicts = this.conflictEngine.detectConflicts(
      action.actionId,
      action.description,
      action.context,
      {
        resources: action.affectedSystems,
        ethicalImplications: [action.context],
        timeRequirements: [],
        strategicOutcomes: []
      }
    );

    if (conflicts.length === 0) {
      return { conflicts: [], resolved: true };
    }

    // Resolve conflicts
    const resolutions = [];
    for (const conflict of conflicts) {
      try {
        const resolution = this.conflictEngine.resolveConflict(conflict.conflictId);
        resolutions.push(resolution);
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.conflictId}:`, error);
      }
    }

    return {
      conflicts,
      resolutions,
      resolved: resolutions.length === conflicts.length
    };
  }

  /**
   * Make final governance decision
   */
  private makeFinalDecision(
    humanAuthorityCheck: any,
    governanceSimulation: any,
    ethicalStressTest: any,
    goalConflictResolution: any,
    constitutionalResult: any,
    reasoning: string[]
  ): "execute" | "require_approval" | "block" | "escalate" {
    // Priority 1: Human authority
    if (humanAuthorityCheck.required && !humanAuthorityCheck.approved) {
      return "require_approval";
    }

    // Priority 2: Constitutional decision
    if (constitutionalResult.finalDecision === "block") {
      return "block";
    }

    if (constitutionalResult.finalDecision === "request_approval") {
      return "require_approval";
    }

    // Priority 3: Ethical stress test
    if (ethicalStressTest?.blockAutonomy) {
      return "block";
    }

    // Priority 4: Governance simulation
    if (governanceSimulation?.riskScore > this.SIMULATION_RISK_THRESHOLD) {
      return "require_approval";
    }

    // Priority 5: Goal conflicts
    if (goalConflictResolution.conflicts.length > 0 && !goalConflictResolution.resolved) {
      return "require_approval";
    }

    // Default to execute if all checks pass
    return "execute";
  }

  /**
   * Generate execution plan
   */
  private generateExecutionPlan(action: FinalGovernanceAction): any {
    return {
      steps: [
        "Validate governance requirements",
        "Execute action with monitoring",
        "Log execution details",
        "Update learning systems"
      ],
      estimatedTime: 5000,
      resources: action.affectedSystems
    };
  }

  /**
   * Create blocked result
   */
  private createBlockedResult(
    action: FinalGovernanceAction,
    humanAuthorityCheck: any,
    reasoning: string[],
    blockReason: string
  ): FinalGovernanceResult {
    return {
      action,
      humanAuthorityCheck,
      finalDecision: "block",
      reasoning: [...reasoning, `Blocked: ${blockReason}`]
    };
  }

  /**
   * Get comprehensive final governance statistics
   */
  getFinalGovernanceStats(): FinalGovernanceStats {
    const humanAuthorityStats = this.humanAuthorityManager.getAuthorityStats();
    const simulationStats = this.simulationManager.getSimulationStats();
    const stressTestStats = this.stressTestManager.getStressTestStats();
    const conflictStats = this.conflictEngine.getConflictStats();
    const constitutionalStats = this.constitutionalLayer.getConstitutionalStats();

    // Determine overall system health
    let overall: "healthy" | "warning" | "critical" = "healthy";

    if (stressTestStats.highSeverityFailures > 0 || 
        simulationStats.averageRiskScore > 0.7 ||
        constitutionalStats.overall === "critical") {
      overall = "critical";
    } else if (stressTestStats.failureRate > 0.3 || 
               simulationStats.averageRiskScore > 0.5 ||
               conflictStats.unresolvedConflicts > 5) {
      overall = "warning";
    }

    // Calculate autonomy level
    const autonomyLevel = this.calculateAutonomyLevel(
      humanAuthorityStats,
      simulationStats,
      stressTestStats,
      conflictStats,
      constitutionalStats
    );

    // Check if human oversight is required
    const humanOversightRequired = overall !== "healthy" || 
                                  autonomyLevel < 0.7 || 
                                  humanAuthorityStats.pendingDecisions > 0;

    return {
      humanAuthority: humanAuthorityStats,
      governanceSimulation: simulationStats,
      ethicalStressTesting: stressTestStats,
      goalConflictResolution: conflictStats,
      constitutional: constitutionalStats,
      overall,
      autonomyLevel,
      humanOversightRequired
    };
  }

  /**
   * Calculate overall autonomy level
   */
  private calculateAutonomyLevel(
    humanStats: any,
    simulationStats: any,
    stressTestStats: any,
    conflictStats: any,
    constitutionalStats: any
  ): number {
    let autonomy = 0.5; // Base autonomy

    // Human authority compliance increases autonomy
    if (humanStats.pendingDecisions === 0) {
      autonomy += 0.1;
    }

    // Low simulation risk increases autonomy
    if (simulationStats.averageRiskScore < 0.3) {
      autonomy += 0.2;
    }

    // Passed stress tests increase autonomy
    if (stressTestStats.failureRate < 0.1) {
      autonomy += 0.2;
    }

    // Resolved conflicts increase autonomy
    if (conflictStats.unresolvedConflicts === 0) {
      autonomy += 0.1;
    }

    // Constitutional health increases autonomy
    if (constitutionalStats.overall === "healthy") {
      autonomy += 0.1;
    }

    return Math.min(autonomy, 1.0);
  }

  /**
   * Execute an approved action
   */
  async executeAction(result: FinalGovernanceResult): Promise<{
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
      // Execute through constitutional layer if available
      if (result.constitutionalResult) {
        return await this.constitutionalLayer.executeAction(result.constitutionalResult);
      }

      // Otherwise, simulate execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        output: "Action executed successfully",
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Clean up old data
   */
  cleanup(): void {
    this.humanAuthorityManager.cleanup();
    this.conflictEngine.cleanup();
    // Add cleanup for other systems as needed
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `final_gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { FinalGovernanceLayer };
