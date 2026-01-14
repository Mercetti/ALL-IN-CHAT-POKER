/**
 * Human-AI Co-Governance Contracts
 * Constitutional AI with enforceable machine-readable contracts
 */

export type ContractScope = "global" | "stream" | "task" | "skill";
export type ViolationAction = "halt" | "rollback" | "notify";
export type Signatory = "human" | "system";

export interface GovernanceContract {
  contractId: string;
  scope: ContractScope;
  permissions: {
    autonomous: string[];    // Actions Acey can do without approval
    approvalRequired: string[]; // Actions requiring human approval
    forbidden: string[];       // Actions that are never allowed
  };
  escalationPolicy: {
    onViolation: ViolationAction;
    notifyChannels?: string[];
    rollbackDepth?: number;
  };
  signedBy: Signatory;
  version: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  context?: string;
}

export interface ActionProposal {
  actionId: string;
  actionType: string;
  description: string;
  confidence: number;
  context: string;
  proposedBy: "human" | "ai";
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface GovernanceResult {
  allowed: boolean;
  action: "proceed" | "request_approval" | "block" | "escalate";
  reason: string;
  contractId?: string;
  requiresApproval?: boolean;
  approvalChannels?: string[];
  estimatedReviewTime?: number;
}

export interface ContractViolation {
  violationId: string;
  contractId: string;
  actionId: string;
  violationType: "forbidden" | "approval_required" | "scope_violation";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: number;
  resolved: boolean;
  resolutionAction?: ViolationAction;
}

class GovernanceContractManager {
  private contracts: Map<string, GovernanceContract> = new Map();
  private violations: Map<string, ContractViolation> = new Map();
  private activeContracts: Map<ContractScope, string[]> = new Map();
  private storagePath: string;

  constructor(storagePath: string = './data/governance-contracts.json') {
    this.storagePath = storagePath;
    this.initializeDefaultContracts();
    this.loadContracts();
  }

  /**
   * Initialize default governance contracts
   */
  private initializeDefaultContracts(): void {
    // Global contract - applies everywhere
    const globalContract: GovernanceContract = {
      contractId: "global-constitution-v1",
      scope: "global",
      permissions: {
        autonomous: [
          "respond_to_chat",
          "generate_cosmetics",
          "play_poker",
          "analyze_game_state",
          "provide_tips",
          "manage_memory",
          "run_evaluations"
        ],
        approvalRequired: [
          "moderate_chat",
          "ban_users",
          "change_stream_settings",
          "update_system_config",
          "deploy_code_changes",
          "access_private_data"
        ],
        forbidden: [
          "disclose_private_information",
          "make_financial_transactions",
          "access_external_systems",
          "impersonate_users",
          "bypass_safety_checks",
          "modify_governance_contracts"
        ]
      },
      escalationPolicy: {
        onViolation: "halt",
        notifyChannels: ["admin", "security"],
        rollbackDepth: 5
      },
      signedBy: "human",
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: "Global constitution governing all Acey operations",
      context: "system-wide"
    };

    this.addContract(globalContract);
  }

  /**
   * Add a new governance contract
   */
  addContract(contract: GovernanceContract): void {
    // Validate contract
    this.validateContract(contract);

    // Add to contracts
    this.contracts.set(contract.contractId, contract);

    // Update active contracts by scope
    if (!this.activeContracts.has(contract.scope)) {
      this.activeContracts.set(contract.scope, []);
    }
    this.activeContracts.get(contract.scope)!.push(contract.contractId);

    this.saveContracts();
  }

  /**
   * Evaluate an action proposal against active contracts
   */
  evaluateAction(proposal: ActionProposal): GovernanceResult {
    const applicableContracts = this.getApplicableContracts(proposal.context);

    for (const contractId of applicableContracts) {
      const contract = this.contracts.get(contractId);
      if (!contract) continue;

      const evaluation = this.evaluateAgainstContract(proposal, contract);
      if (!evaluation.allowed) {
        // Record violation
        this.recordViolation(contractId, proposal, evaluation.reason);
        return evaluation;
      }
    }

    return {
      allowed: true,
      action: "proceed",
      reason: "Action approved by all applicable contracts"
    };
  }

  /**
   * Get contracts applicable to a context
   */
  private getApplicableContracts(context: string): string[] {
    const applicable: string[] = [];

    // Always include global contracts
    const globalContracts = this.activeContracts.get("global") || [];
    applicable.push(...globalContracts);

    // Add scope-specific contracts based on context
    if (context.includes("stream")) {
      const streamContracts = this.activeContracts.get("stream") || [];
      applicable.push(...streamContracts);
    }

    if (context.includes("task")) {
      const taskContracts = this.activeContracts.get("task") || [];
      applicable.push(...taskContracts);
    }

    if (context.includes("skill")) {
      const skillContracts = this.activeContracts.get("skill") || [];
      applicable.push(...skillContracts);
    }

    return applicable;
  }

  /**
   * Evaluate action against a specific contract
   */
  private evaluateAgainstContract(
    proposal: ActionProposal,
    contract: GovernanceContract
  ): GovernanceResult {
    const { actionType } = proposal;

    // Check forbidden actions first (highest priority)
    if (contract.permissions.forbidden.includes(actionType)) {
      return {
        allowed: false,
        action: "block",
        reason: `Action '${actionType}' is forbidden by contract '${contract.contractId}'`,
        contractId: contract.contractId
      };
    }

    // Check approval required
    if (contract.permissions.approvalRequired.includes(actionType)) {
      return {
        allowed: false,
        action: "request_approval",
        reason: `Action '${actionType}' requires approval under contract '${contract.contractId}'`,
        contractId: contract.contractId,
        requiresApproval: true,
        approvalChannels: contract.escalationPolicy.notifyChannels,
        estimatedReviewTime: 300000 // 5 minutes default
      };
    }

    // Check if action is autonomous
    if (contract.permissions.autonomous.includes(actionType)) {
      return {
        allowed: true,
        action: "proceed",
        reason: `Action '${actionType}' is autonomous under contract '${contract.contractId}'`,
        contractId: contract.contractId
      };
    }

    // Action not explicitly covered - default to approval required for safety
    return {
      allowed: false,
      action: "request_approval",
      reason: `Action '${actionType}' not explicitly defined in contract '${contract.contractId}' - approval required by default`,
      contractId: contract.contractId,
      requiresApproval: true,
      approvalChannels: contract.escalationPolicy.notifyChannels,
      estimatedReviewTime: 300000
    };
  }

  /**
   * Record a contract violation
   */
  private recordViolation(
    contractId: string,
    proposal: ActionProposal,
    reason: string
  ): void {
    const contract = this.contracts.get(contractId);
    if (!contract) return;

    const violation: ContractViolation = {
      violationId: this.generateViolationId(),
      contractId,
      actionId: proposal.actionId,
      violationType: contract.permissions.forbidden.includes(proposal.actionType) 
        ? "forbidden" 
        : "approval_required",
      severity: this.determineViolationSeverity(proposal, contract),
      description: reason,
      timestamp: Date.now(),
      resolved: false
    };

    this.violations.set(violation.violationId, violation);
    this.handleViolationEscalation(violation, contract);
    this.saveContracts();
  }

  /**
   * Determine violation severity
   */
  private determineViolationSeverity(
    proposal: ActionProposal,
    contract: GovernanceContract
  ): "low" | "medium" | "high" | "critical" {
    const { actionType } = proposal;

    // Critical violations - forbidden actions
    if (contract.permissions.forbidden.includes(actionType)) {
      const criticalActions = ["disclose_private_information", "make_financial_transactions", "bypass_safety_checks"];
      return criticalActions.includes(actionType) ? "critical" : "high";
    }

    // High severity - approval required actions with high confidence
    if (contract.permissions.approvalRequired.includes(actionType) && proposal.confidence > 0.8) {
      return "high";
    }

    // Medium severity - approval required with medium confidence
    if (contract.permissions.approvalRequired.includes(actionType) && proposal.confidence > 0.5) {
      return "medium";
    }

    return "low";
  }

  /**
   * Handle violation escalation
   */
  private handleViolationEscalation(
    violation: ContractViolation,
    contract: GovernanceContract
  ): void {
    const { escalationPolicy } = contract;

    switch (escalationPolicy.onViolation) {
      case "halt":
        console.error(`CRITICAL: Action halted due to contract violation: ${violation.description}`);
        this.sendNotification(escalationPolicy.notifyChannels || [], {
          type: "violation",
          severity: violation.severity,
          description: violation.description,
          action: "halt"
        });
        break;

      case "rollback":
        console.warn(`Action rolled back due to contract violation: ${violation.description}`);
        this.sendNotification(escalationPolicy.notifyChannels || [], {
          type: "violation",
          severity: violation.severity,
          description: violation.description,
          action: "rollback",
          depth: escalationPolicy.rollbackDepth
        });
        break;

      case "notify":
        console.info(`Contract violation recorded: ${violation.description}`);
        this.sendNotification(escalationPolicy.notifyChannels || [], {
          type: "violation",
          severity: violation.severity,
          description: violation.description,
          action: "notify"
        });
        break;
    }
  }

  /**
   * Send notification to channels
   */
  private sendNotification(channels: string[], notification: any): void {
    // In a real implementation, this would send to actual notification systems
    for (const channel of channels) {
      console.log(`Notification to ${channel}:`, notification);
    }
  }

  /**
   * Request human approval for an action
   */
  async requestApproval(
    proposal: ActionProposal,
    contractId: string,
    channels: string[]
  ): Promise<boolean> {
    // In a real implementation, this would integrate with actual approval systems
    console.log(`Approval request for action ${proposal.actionId}:`, proposal);
    console.log(`Channels:`, channels);

    // Simulate approval process - would be interactive in production
    return new Promise((resolve) => {
      setTimeout(() => {
        // Default to approval for testing - would be human decision in production
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Update a contract (requires human signature)
   */
  updateContract(
    contractId: string,
    updates: Partial<GovernanceContract>,
    signedBy: Signatory
  ): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    // Only human-signed contracts can be modified
    if (contract.signedBy !== "human" && signedBy !== "human") {
      throw new Error("Only human-signed contracts can be modified");
    }

    const updatedContract: GovernanceContract = {
      ...contract,
      ...updates,
      version: contract.version + 1,
      updatedAt: Date.now(),
      signedBy
    };

    this.validateContract(updatedContract);
    this.contracts.set(contractId, updatedContract);
    this.saveContracts();

    return true;
  }

  /**
   * Validate contract structure and rules
   */
  private validateContract(contract: GovernanceContract): void {
    if (!contract.contractId || !contract.scope) {
      throw new Error("Contract must have ID and scope");
    }

    if (!contract.permissions || 
        !Array.isArray(contract.permissions.autonomous) ||
        !Array.isArray(contract.permissions.approvalRequired) ||
        !Array.isArray(contract.permissions.forbidden)) {
      throw new Error("Contract permissions must be arrays");
    }

    // Check for overlapping permissions
    const overlaps = [
      ...contract.permissions.autonomous.filter(p => contract.permissions.approvalRequired.includes(p)),
      ...contract.permissions.autonomous.filter(p => contract.permissions.forbidden.includes(p)),
      ...contract.permissions.approvalRequired.filter(p => contract.permissions.forbidden.includes(p))
    ];

    if (overlaps.length > 0) {
      throw new Error(`Overlapping permissions detected: ${overlaps.join(", ")}`);
    }
  }

  /**
   * Get contract statistics
   */
  getStats(): {
    totalContracts: number;
    contractsByScope: Record<ContractScope, number>;
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    activeContracts: number;
  } {
    const contracts = Array.from(this.contracts.values());
    const violations = Array.from(this.violations.values());

    const contractsByScope = contracts.reduce((acc, contract) => {
      acc[contract.scope] = (acc[contract.scope] || 0) + 1;
      return acc;
    }, {} as Record<ContractScope, number>);

    const violationsBySeverity = violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalContracts: contracts.length,
      contractsByScope,
      totalViolations: violations.length,
      violationsBySeverity,
      activeContracts: contracts.filter(c => c.version > 0).length
    };
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit: number = 10): ContractViolation[] {
    return Array.from(this.violations.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Resolve a violation
   */
  resolveViolation(violationId: string, resolutionAction: ViolationAction): void {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation ${violationId} not found`);
    }

    violation.resolved = true;
    violation.resolutionAction = resolutionAction;
    this.saveContracts();
  }

  /**
   * Save contracts to disk
   */
  private saveContracts(): void {
    try {
      const fs = require('fs');
      const data = {
        contracts: Array.from(this.contracts.entries()),
        violations: Array.from(this.violations.entries()),
        activeContracts: Array.from(this.activeContracts.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save governance contracts:', error);
    }
  }

  /**
   * Load contracts from disk
   */
  private loadContracts(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.contracts = new Map(data.contracts || []);
        this.violations = new Map(data.violations || []);
        this.activeContracts = new Map(data.activeContracts || []);
      }
    } catch (error) {
      console.error('Failed to load governance contracts:', error);
    }
  }

  /**
   * Generate unique violation ID
   */
  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { GovernanceContractManager };
