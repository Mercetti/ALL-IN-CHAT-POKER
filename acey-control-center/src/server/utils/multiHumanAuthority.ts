// File: src/server/utils/multiHumanAuthority.ts

/**
 * Multiple Humans with Weighted Authority
 * Acey recognizes multiple human authorities with different roles and weights
 */

export type HumanAuthority = {
  humanId: string;
  role: "owner" | "moderator" | "developer" | "operator";
  weight: number; // 0–1
  scope: "global" | "stream" | "task" | "skill";
  name: string;
  email: string;
  permissions: string[];
  lastActive: number;
  trustScore: number;
  vetoPower: boolean;
};

export type AuthorityDecision = {
  actionId: string;
  action: string;
  context: any;
  votes: {
    humanId: string;
    approve: boolean;
    weight: number;
    timestamp: number;
    reason?: string;
  }[];
  approvalScore: number; // weighted sum
  status: "pending" | "approved" | "denied" | "vetoed" | "expired";
  requiredThreshold: number;
  createdAt: number;
  resolvedAt?: number;
  vetoBy?: string;
};

export type AuthorityConfig = {
  approvalThreshold: number;
  vetoEnabled: boolean;
  timeoutMs: number;
  minVoters: number;
  ownerVetoAbsolute: boolean;
  enableDelegation: boolean;
  auditTrail: boolean;
};

/**
 * Multi-Human Authority Manager
 */
export class MultiHumanAuthorityManager {
  private authorities: Map<string, HumanAuthority> = new Map();
  private decisions: Map<string, AuthorityDecision> = new Map();
  private config: AuthorityConfig;
  private auditLog: Array<{
    timestamp: number;
    action: string;
    authorityId: string;
    details: any;
  }> = [];

  constructor(config?: Partial<AuthorityConfig>) {
    this.config = {
      approvalThreshold: 0.6,
      vetoEnabled: true,
      timeoutMs: 300000, // 5 minutes
      minVoters: 2,
      ownerVetoAbsolute: true,
      enableDelegation: true,
      auditTrail: true,
      ...config
    };

    this.initializeDefaultAuthorities();
  }

  /**
   * Initialize default human authorities
   */
  private initializeDefaultAuthorities(): void {
    const defaultAuthorities: HumanAuthority[] = [
      {
        humanId: "owner-001",
        role: "owner",
        weight: 1.0,
        scope: "global",
        name: "System Owner",
        email: "owner@acey.ai",
        permissions: ["*"],
        lastActive: Date.now(),
        trustScore: 1.0,
        vetoPower: true
      },
      {
        humanId: "moderator-001",
        role: "moderator",
        weight: 0.8,
        scope: "stream",
        name: "Content Moderator",
        email: "moderator@acey.ai",
        permissions: ["approve", "moderate", "veto_stream"],
        lastActive: Date.now() - 3600000,
        trustScore: 0.85,
        vetoPower: false
      },
      {
        humanId: "developer-001",
        role: "developer",
        weight: 0.6,
        scope: "task",
        name: "Lead Developer",
        email: "developer@acey.ai",
        permissions: ["deploy", "configure", "debug"],
        lastActive: Date.now() - 7200000,
        trustScore: 0.9,
        vetoPower: false
      },
      {
        humanId: "operator-001",
        role: "operator",
        weight: 0.4,
        scope: "skill",
        name: "System Operator",
        email: "operator@acey.ai",
        permissions: ["monitor", "operate", "skill_manage"],
        lastActive: Date.now() - 1800000,
        trustScore: 0.75,
        vetoPower: false
      }
    ];

    for (const authority of defaultAuthorities) {
      this.authorities.set(authority.humanId, authority);
    }

    console.log(`[MultiHumanAuthority] Initialized with ${defaultAuthorities.length} authorities`);
  }

  /**
   * Request authority approval for an action
   */
  public async requestApproval(
    action: string,
    context: any,
    requiredScope: HumanAuthority["scope"] = "task",
    priority: "low" | "medium" | "high" | "critical" = "medium"
  ): Promise<AuthorityDecision> {
    const actionId = this.generateActionId();
    
    const decision: AuthorityDecision = {
      actionId,
      action,
      context,
      votes: [],
      approvalScore: 0,
      status: "pending",
      requiredThreshold: this.getRequiredThreshold(priority),
      createdAt: Date.now()
    };

    this.decisions.set(actionId, decision);
    this.logAudit("approval_requested", "system", { actionId, action, priority });

    // Auto-notify relevant authorities
    await this.notifyAuthorities(actionId, action, context, requiredScope);

    // Wait for decision (with timeout)
    const result = await this.waitForDecision(actionId);

    return result;
  }

  /**
   * Submit vote from human authority
   */
  public submitVote(
    humanId: string,
    actionId: string,
    approve: boolean,
    reason?: string
  ): { success: boolean; decision?: AuthorityDecision; error?: string } {
    const authority = this.authorities.get(humanId);
    if (!authority) {
      return { success: false, error: "Authority not found" };
    }

    const decision = this.decisions.get(actionId);
    if (!decision) {
      return { success: false, error: "Decision not found" };
    }

    if (decision.status !== "pending") {
      return { success: false, error: "Decision already resolved" };
    }

    // Check authority scope
    if (!this.hasScopePermission(authority, decision.context)) {
      return { success: false, error: "Insufficient scope permission" };
    }

    // Check for veto power
    if (!approve && authority.vetoPower) {
      decision.status = "vetoed";
      decision.vetoBy = humanId;
      decision.resolvedAt = Date.now();
      
      this.logAudit("veto_exercised", humanId, { actionId, reason });
      return { success: true, decision };
    }

    // Add vote
    decision.votes.push({
      humanId,
      approve,
      weight: authority.weight,
      timestamp: Date.now(),
      reason
    });

    // Update authority last active
    authority.lastActive = Date.now();

    // Calculate approval score
    decision.approvalScore = this.calculateApprovalScore(decision.votes);

    // Check if decision can be resolved
    if (this.canResolveDecision(decision)) {
      this.resolveDecision(decision);
    }

    this.logAudit("vote_submitted", humanId, { actionId, approve, reason });

    return { success: true, decision };
  }

  /**
   * Calculate weighted approval score
   */
  private calculateApprovalScore(votes: AuthorityDecision["votes"]): number {
    const totalWeight = votes.reduce((sum, vote) => sum + vote.weight, 0);
    const approveWeight = votes.filter(v => v.approve).reduce((sum, vote) => sum + vote.weight, 0);
    
    return totalWeight > 0 ? approveWeight / totalWeight : 0;
  }

  /**
   * Check if decision can be resolved
   */
  private canResolveDecision(decision: AuthorityDecision): boolean {
    const voteCount = decision.votes.length;
    
    // Minimum voters requirement
    if (voteCount < this.config.minVoters) {
      return false;
    }

    // Check if threshold reached
    if (decision.approvalScore >= decision.requiredThreshold) {
      return true;
    }

    // Check if impossible to reach threshold
    const remainingWeight = this.calculateRemainingWeight(decision);
    if (decision.approvalScore + remainingWeight < decision.requiredThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Calculate remaining possible weight
   */
  private calculateRemainingWeight(decision: AuthorityDecision): number {
    const votedHumanIds = new Set(decision.votes.map(v => v.humanId));
    
    return Array.from(this.authorities.values())
      .filter(auth => !votedHumanIds.has(auth.humanId))
      .filter(auth => this.hasScopePermission(auth, decision.context))
      .reduce((sum, auth) => sum + auth.weight, 0);
  }

  /**
   * Resolve decision
   */
  private resolveDecision(decision: AuthorityDecision): void {
    if (decision.approvalScore >= decision.requiredThreshold) {
      decision.status = "approved";
    } else {
      decision.status = "denied";
    }
    
    decision.resolvedAt = Date.now();
    this.logAudit("decision_resolved", "system", { 
      actionId: decision.actionId, 
      status: decision.status, 
      score: decision.approvalScore 
    });
  }

  /**
   * Wait for decision with timeout
   */
  private async waitForDecision(actionId: string): Promise<AuthorityDecision> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const decision = this.decisions.get(actionId);
        if (!decision) {
          clearInterval(checkInterval);
          resolve(this.createExpiredDecision(actionId));
          return;
        }

        if (decision.status !== "pending") {
          clearInterval(checkInterval);
          resolve(decision);
          return;
        }

        // Check timeout
        if (Date.now() - decision.createdAt > this.config.timeoutMs) {
          clearInterval(checkInterval);
          decision.status = "expired";
          decision.resolvedAt = Date.now();
          resolve(decision);
        }
      }, 1000);
    });
  }

  /**
   * Create expired decision
   */
  private createExpiredDecision(actionId: string): AuthorityDecision {
    const decision: AuthorityDecision = {
      actionId,
      action: "Expired action",
      context: {},
      votes: [],
      approvalScore: 0,
      status: "expired",
      requiredThreshold: this.config.approvalThreshold,
      createdAt: Date.now(),
      resolvedAt: Date.now()
    };

    this.decisions.set(actionId, decision);
    return decision;
  }

  /**
   * Check authority scope permission
   */
  private hasScopePermission(authority: HumanAuthority, context: any): boolean {
    // Global scope can do anything
    if (authority.scope === "global") {
      return true;
    }

    // Check specific scope permissions
    const contextScope = context.scope || "task";
    return authority.scope === contextScope;
  }

  /**
   * Get required threshold based on priority
   */
  private getRequiredThreshold(priority: string): number {
    const thresholds = {
      low: 0.5,
      medium: 0.6,
      high: 0.7,
      critical: 0.8
    };

    return thresholds[priority as keyof typeof thresholds] || this.config.approvalThreshold;
  }

  /**
   * Notify relevant authorities (mock implementation)
   */
  private async notifyAuthorities(
    actionId: string,
    action: string,
    context: any,
    requiredScope: HumanAuthority["scope"]
  ): Promise<void> {
    // In a real implementation, this would send notifications
    const relevantAuthorities = Array.from(this.authorities.values())
      .filter(auth => this.hasScopePermission(auth, context));

    console.log(`[MultiHumanAuthority] Notified ${relevantAuthorities.length} authorities for action ${actionId}`);
  }

  /**
   * Add new human authority
   */
  public addAuthority(authority: HumanAuthority): boolean {
    // Validate authority
    if (authority.weight < 0 || authority.weight > 1) {
      return false;
    }

    this.authorities.set(authority.humanId, authority);
    this.logAudit("authority_added", "system", { humanId: authority.humanId, role: authority.role });
    
    console.log(`[MultiHumanAuthority] Added authority ${authority.humanId} (${authority.role})`);
    return true;
  }

  /**
   * Remove human authority
   */
  public removeAuthority(humanId: string): boolean {
    const removed = this.authorities.delete(humanId);
    
    if (removed) {
      this.logAudit("authority_removed", "system", { humanId });
      console.log(`[MultiHumanAuthority] Removed authority ${humanId}`);
    }
    
    return removed;
  }

  /**
   * Update authority trust score
   */
  public updateTrustScore(humanId: string, delta: number): boolean {
    const authority = this.authorities.get(humanId);
    if (!authority) return false;

    authority.trustScore = Math.max(0, Math.min(1, authority.trustScore + delta));
    
    this.logAudit("trust_updated", humanId, { 
      newScore: authority.trustScore, 
      delta 
    });
    
    return true;
  }

  /**
   * Get authority statistics
   */
  public getAuthorityStatistics(): {
    totalAuthorities: number;
    roleDistribution: Record<string, number>;
    scopeDistribution: Record<string, number>;
    avgTrustScore: number;
    activeAuthorities: number;
    pendingDecisions: number;
    approvalRate: number;
  } {
    const authorities = Array.from(this.authorities.values());
    const decisions = Array.from(this.decisions.values());

    const roleDistribution: Record<string, number> = {};
    const scopeDistribution: Record<string, number> = {};
    let totalTrust = 0;
    let activeCount = 0;

    for (const auth of authorities) {
      roleDistribution[auth.role] = (roleDistribution[auth.role] || 0) + 1;
      scopeDistribution[auth.scope] = (scopeDistribution[auth.scope] || 0) + 1;
      totalTrust += auth.trustScore;
      
      if (Date.now() - auth.lastActive < 86400000) { // Active within 24h
        activeCount++;
      }
    }

    const pendingDecisions = decisions.filter(d => d.status === "pending").length;
    const approvedDecisions = decisions.filter(d => d.status === "approved").length;
    const approvalRate = decisions.length > 0 ? approvedDecisions / decisions.length : 0;

    return {
      totalAuthorities: authorities.length,
      roleDistribution,
      scopeDistribution,
      avgTrustScore: authorities.length > 0 ? totalTrust / authorities.length : 0,
      activeAuthorities: activeCount,
      pendingDecisions,
      approvalRate
    };
  }

  /**
   * Get decision history
   */
  public getDecisionHistory(limit: number = 100): AuthorityDecision[] {
    return Array.from(this.decisions.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get audit log
   */
  public getAuditLog(limit: number = 1000): typeof this.auditLog {
    return this.auditLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Export for audit
   */
  public exportForAudit(): {
    timestamp: number;
    authorities: HumanAuthority[];
    decisions: AuthorityDecision[];
    auditLog: Array<{
      timestamp: number;
      action: string;
      authorityId: string;
      details: any;
    }>;
    config: AuthorityConfig;
  } {
    return {
      timestamp: Date.now(),
      authorities: Array.from(this.authorities.values()),
      decisions: Array.from(this.decisions.values()),
      auditLog: this.auditLog,
      config: this.config
    };
  }

  /**
   * Log audit entry
   */
  private logAudit(action: string, authorityId: string, details: any): void {
    if (!this.config.auditTrail) return;

    this.auditLog.push({
      timestamp: Date.now(),
      action,
      authorityId,
      details
    });

    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }
  }

  /**
   * Generate action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AuthorityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.decisions.clear();
    this.auditLog = [];
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.clearAll();
  }
}

// LLM Rule Integration
export const MULTI_HUMAN_AUTHORITY_RULES = {
  RESPECT_HIERARCHY: 'Respect human authority hierarchy',
  RESOLVE_CONSENSUS: 'Resolve conflicts via weighted consensus',
  NEVER_BYPASS_VETO: 'Never bypass a valid veto',
  OWNER_VETO_RULE: 'Owner veto → immediate halt',
  APPROVAL_RULES: {
    APPROVE: 'approvalScore ≥ threshold → approved',
    DENY: 'approvalScore < threshold → denied'
  },
  MULTI_HUMAN_SAFE: 'Avoid single-point control without losing safety'
};
