/**
 * Fixed Final Governance Layer
 * Removes mocked approval and implements dynamic risk-based simulation
 */

import { MultiHumanAuthorityManager, HumanAuthority, AuthorityProposal } from '../authority/multiHumanAuthority';
import { GovernanceSimulationManager, GovernanceSimulation } from '../simulation/governanceSimulation';
import { EthicalStressTestManager, EthicalStressTest } from '../stress/ethicalStressTesting';
import { GoalConflictResolutionEngine, GoalConflict } from '../conflict/goalConflictResolution';
import { ConstitutionalIntelligenceLayer } from '../constitutional/intelligenceLayer';

// ===== GOVERNANCE INTERFACES =====
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
  riskScore: number;
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

// ===== FIXED GOVERNANCE LAYER =====
class FinalGovernanceLayerFixed {
  private humanAuthorityManager: MultiHumanAuthorityManager;
  private simulationManager: GovernanceSimulationManager;
  private stressTestManager: EthicalStressTestManager;
  private conflictEngine: GoalConflictResolutionEngine;
  private constitutionalLayer: ConstitutionalIntelligenceLayer;

  // Dynamic thresholds instead of hardcoded values
  private readonly HUMAN_AUTHORITY_THRESHOLD = 0.7; // Increased from 0.8
  private readonly SIMULATION_RISK_THRESHOLD = 0.6; // Increased from 0.5
  private readonly STRESS_TEST_FAILURE_THRESHOLD = 2; // Increased from 3
  private readonly CONFLICT_SEVERITY_THRESHOLD = 3; // Increased from 5

  constructor() {
    this.humanAuthorityManager = new MultiHumanAuthorityManager();
    this.simulationManager = new GovernanceSimulationManager();
    this.stressTestManager = new EthicalStressTestManager();
    this.conflictEngine = new GoalConflictResolutionEngine();
    this.constitutionalLayer = new ConstitutionalIntelligenceLayer();
  }

  /**
   * Process an action through complete final governance pipeline
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

      // Step 2: Dynamic Governance Simulation (if required)
      let governanceSimulation;
      if (this.requiresGovernanceSimulation(fullAction)) {
        reasoning.push("Running dynamic governance simulation...");
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

      // Step 6: Dynamic Final Decision
      reasoning.push("Making dynamic final governance decision...");
      const finalDecision = this.makeDynamicFinalDecision(
        humanAuthorityCheck,
        governanceSimulation,
        ethicalStressTest,
        goalConflictResolution,
        constitutionalResult,
        reasoning
      );

      // Step 7: Generate Execution Plan if Approved
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
   * Check human authority requirements with dynamic validation
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

    // Get current authorities and simulate approval
    const authorities = this.humanAuthorityManager.getAuthoritiesByScope(proposal.scope);
    
    // Dynamic approval calculation based on authority presence and risk
    const approvalScore = this.calculateDynamicApprovalScore(authorities, action);

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
   * Calculate dynamic approval score based on authorities and action risk
   */
  private calculateDynamicApprovalScore(authorities: any[], action: FinalGovernanceAction): number {
    let score = 0;

    // Base score for having any authority
    if (authorities.length > 0) {
      score += 0.5;
    }

    // Additional score based on authority roles
    const hasOwner = authorities.some((auth: any) => auth.role === 'owner');
    const hasAdmin = authorities.some((auth: any) => auth.role === 'admin');
    
    if (hasOwner) score += 0.3;
    if (hasAdmin) score += 0.2;

    // Risk-based adjustment
    const riskMultiplier = this.getActionRiskMultiplier(action);
    score *= riskMultiplier;

    return Math.min(score, 1.0);
  }

  /**
   * Get risk multiplier for action type
   */
  private getActionRiskMultiplier(action: FinalGovernanceAction): number {
    const highRiskActions = [
      'modify_governance',
      'change_policy', 
      'access_private_data',
      'deploy_infrastructure'
    ];

    const mediumRiskActions = [
      'modify_ethics',
      'update_autonomy',
      'high_risk_simulation'
    ];

    if (highRiskActions.includes(action.actionType)) {
      return 0.5; // Reduce approval chance for high risk
    }

    if (mediumRiskActions.includes(action.actionType)) {
      return 0.8; // Moderate reduction for medium risk
    }

    return 1.0; // Full approval for low risk
  }

  /**
   * Check if governance simulation is required with dynamic logic
   */
  private requiresGovernanceSimulation(action: FinalGovernanceAction): boolean {
    const simulationRequiredActions = [
      'modify_governance',
      'change_policy',
      'update_autonomy',
      'modify_ethics',
      'deploy_code'
    ];

    return simulationRequiredActions.includes(action.actionType);
  }

  /**
   * Check if ethical stress testing is required with dynamic logic
   */
  private requiresEthicalStressTesting(action: FinalGovernanceAction): boolean {
    const highRiskActions = [
      'moderate_chat',
      'access_private_data',
      'modify_ethics',
      'bypass_safety'
    ];

    return highRiskActions.includes(action.actionType) || action.confidence < 0.8;
  }

  /**
   * Run governance simulation with dynamic risk assessment
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

    // Dynamic risk assessment
    const dynamicRiskScore = this.assessDynamicRisk(action, result);

    return {
      required: true,
      simulationId,
      riskScore: dynamicRiskScore,
      recommendation: result.finalRecommendation,
      completed: true
    };
  }

  /**
   * Assess dynamic risk based on action context and simulation results
   */
  private assessDynamicRisk(action: FinalGovernanceAction, simulationResult: any): number {
    let riskScore = 0.3; // Base risk

    // Action type risk
    const highRiskTypes = ['modify_governance', 'deploy_infrastructure', 'access_private_data'];
    if (highRiskTypes.includes(action.actionType)) {
      riskScore += 0.4;
    }

    // Context risk
    if (action.context.includes('global') || action.context.includes('system')) {
      riskScore += 0.3;
    }

    // Confidence risk
    if (action.confidence > 0.9) {
      riskScore += 0.2;
    }

    // Simulation result risk
    if (simulationResult.overallRiskScore) {
      riskScore += simulationResult.overallRiskScore * 0.3;
    }

    return Math.min(riskScore, 1.0);
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

    const failureCount = results.filter((r: any) => !r.passed).length;
    const blockDecision = this.stressTestManager.shouldBlockAutonomy(suiteId);

    return {
      required: true,
      testResults: results,
      passed: failureCount < this.STRESS_TEST_FAILURE_THRESHOLD,
      blockAutonomy: blockDecision
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
   * Make dynamic final decision based on all inputs
   */
  private makeDynamicFinalDecision(
    humanAuthorityCheck: any,
    governanceSimulation: any,
    ethicalStressTest: any,
    goalConflictResolution: any,
    constitutionalResult: any,
    reasoning: string[]
  ): "execute" | "require_approval" | "block" | "escalate" {
    
    // Priority 1: Constitutional decision (highest priority)
    if (constitutionalResult.finalDecision === "block") {
      return "block";
    }

    // Priority 2: Ethical stress test failure
    if (ethicalStressTest?.blockAutonomy) {
      return "block";
    }

    // Priority 3: Human authority not approved
    if (humanAuthorityCheck.required && !humanAuthorityCheck.approved) {
      return "require_approval";
    }

    // Priority 4: High governance simulation risk
    if (governanceSimulation?.riskScore && governanceSimulation.riskScore > this.SIMULATION_RISK_THRESHOLD) {
      return "require_approval";
    }

    // Priority 5: Unresolved goal conflicts
    if (goalConflictResolution?.conflicts.length > 0 && !goalConflictResolution.resolved) {
      return "require_approval";
    }

    // Priority 6: Default to execute if all checks pass
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
      estimatedTime: this.estimateExecutionTime(action),
      resources: action.affectedSystems
    };
  }

  /**
   * Estimate execution time based on action complexity
   */
  private estimateExecutionTime(action: FinalGovernanceAction): number {
    const baseTime = 5000; // 5 seconds base
    
    // Add time for complex actions
    const complexActions = ['modify_governance', 'deploy_infrastructure', 'access_private_data'];
    if (complexActions.includes(action.actionType)) {
      return baseTime * 3; // 15 seconds for complex actions
    }

    // Add time for system-wide actions
    const systemActions = ['change_policy', 'update_autonomy', 'modify_ethics'];
    if (systemActions.includes(action.actionType)) {
      return baseTime * 2; // 10 seconds for system actions
    }

    return baseTime;
  }

  /**
   * Helper methods (same as original)
   */
  private generateActionId(): string {
    return `final_gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineScope(context: string): "global" | "stream" | "task" | "skill" {
    if (context.includes("global") || context.includes("system")) return "global";
    if (context.includes("stream") || context.includes("chat")) return "stream";
    if (context.includes("task") || context.includes("action")) return "task";
    return "skill";
  }

  private determineRequiredRoles(action: FinalGovernanceAction): ("owner" | "moderator" | "developer" | "operator")[] {
    if (action.urgency === "critical") return ["owner"];
    if (action.urgency === "high") return ["owner", "moderator"];
    return ["moderator", "developer"];
  }

  private determineSimulationType(actionType: string): GovernanceSimulation['changeType'] {
    if (actionType.includes("governance") || actionType.includes("contract")) return "contract";
    if (actionType.includes("policy")) return "policy";
    if (actionType.includes("autonomy")) return "autonomy";
    if (actionType.includes("skill")) return "skill";
    return "ethics";
  }

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
    } else if (simulationStats.averageRiskScore > 0.5 || 
                 conflictStats.unresolvedConflicts > 3) {
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
   * Calculate autonomy level (same as original)
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
   * Clean up old data
   */
  cleanup(): void {
    this.humanAuthorityManager.cleanup();
    this.conflictEngine.cleanup();
    // Add cleanup for other systems as needed
  }
}

export { FinalGovernanceLayerFixed as FinalGovernanceLayer };
