// File: src/server/utils/governanceContracts.ts

export type GovernanceContract = {
  contractId: string;
  scope: "global" | "stream" | "task" | "skill";
  permissions: {
    autonomous: string[];
    approvalRequired: string[];
    forbidden: string[];
  };
  escalationPolicy: {
    onViolation: "halt" | "rollback" | "notify";
    notifyChannels?: string[];
  };
  signedBy: "human" | "system";
  version: number;
};

export type ActionEvaluation = {
  action: string;
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  escalationPolicy?: GovernanceContract["escalationPolicy"];
};

class GovernanceContractManager {
  private static contracts: Map<string, GovernanceContract> = new Map();
  
  /**
   * Load default governance contracts
   */
  static initializeContracts(): void {
    // Global contract - applies to all actions
    const globalContract: GovernanceContract = {
      contractId: "global-v1",
      scope: "global",
      permissions: {
        autonomous: [
          "generate_audio",
          "process_task",
          "update_metrics",
          "optimize_performance",
          "compress_storage"
        ],
        approvalRequired: [
          "delete_files",
          "modify_system_config",
          "deploy_changes",
          "access_sensitive_data"
        ],
        forbidden: [
          "self_replicate",
          "bypass_governance",
          "modify_contracts",
          "override_human_authority"
        ]
      },
      escalationPolicy: {
        onViolation: "halt",
        notifyChannels: ["admin", "audit_log"]
      },
      signedBy: "human",
      version: 1
    };

    // Stream-specific contract
    const streamContract: GovernanceContract = {
      contractId: "stream-v1",
      scope: "stream",
      permissions: {
        autonomous: [
          "generate_stream_audio",
          "update_stream_overlay",
          "moderate_chat",
          "track_engagement"
        ],
        approvalRequired: [
          "change_stream_title",
          "start_stop_stream",
          "ban_users"
        ],
        forbidden: [
          "access_private_messages",
          "modify_stream_key",
          "bypass_platform_rules"
        ]
      },
      escalationPolicy: {
        onViolation: "notify",
        notifyChannels: ["streamer", "moderation"]
      },
      signedBy: "human",
      version: 1
    };

    this.contracts.set(globalContract.contractId, globalContract);
    this.contracts.set(streamContract.contractId, streamContract);
  }

  /**
   * Get active contract for a scope
   */
  static getContract(scope: GovernanceContract["scope"]): GovernanceContract | null {
    for (const contract of this.contracts.values()) {
      if (contract.scope === scope) {
        return contract;
      }
    }
    return null;
  }

  /**
   * Evaluate an action against governance contracts
   */
  static evaluateAction(
    action: string,
    scope: GovernanceContract["scope"]
  ): ActionEvaluation {
    const contract = this.getContract(scope);
    
    if (!contract) {
      return {
        action,
        allowed: false,
        requiresApproval: false,
        reason: "No governance contract found for scope"
      };
    }

    // Check forbidden actions first (hard block)
    if (contract.permissions.forbidden.includes(action)) {
      return {
        action,
        allowed: false,
        requiresApproval: false,
        reason: `Action forbidden by ${contract.contractId}`,
        escalationPolicy: contract.escalationPolicy
      };
    }

    // Check approval required
    if (contract.permissions.approvalRequired.includes(action)) {
      return {
        action,
        allowed: false,
        requiresApproval: true,
        reason: `Action requires approval under ${contract.contractId}`,
        escalationPolicy: contract.escalationPolicy
      };
    }

    // Check autonomous
    if (contract.permissions.autonomous.includes(action)) {
      return {
        action,
        allowed: true,
        requiresApproval: false,
        reason: `Action permitted autonomously by ${contract.contractId}`
      };
    }

    // Default: not explicitly allowed
    return {
      action,
      allowed: false,
      requiresApproval: true,
      reason: `Action not explicitly permitted in ${contract.contractId}`,
      escalationPolicy: contract.escalationPolicy
    };
  }

  /**
   * Add or update a contract
   */
  static updateContract(contract: GovernanceContract): void {
    this.contracts.set(contract.contractId, contract);
  }

  /**
   * Get all contracts for audit
   */
  static getAllContracts(): GovernanceContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Check if action violates any contract
   */
  static isViolation(action: string, scope: GovernanceContract["scope"]): boolean {
    const evaluation = this.evaluateAction(action, scope);
    return !evaluation.allowed && !evaluation.requiresApproval;
  }
}

// Initialize default contracts
GovernanceContractManager.initializeContracts();

export { GovernanceContractManager };
