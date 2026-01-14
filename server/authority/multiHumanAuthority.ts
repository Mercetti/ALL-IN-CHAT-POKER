/**
 * Multiple Humans with Weighted Authority
 * Acey recognizes multiple human authorities with roles, weights, and scopes
 */

export type HumanRole = "owner" | "moderator" | "developer" | "operator";
export type AuthorityScope = "global" | "stream" | "task" | "skill";

export interface HumanAuthority {
  humanId: string;
  name: string;
  role: HumanRole;
  weight: number; // 0-1
  scope: AuthorityScope;
  permissions: string[];
  active: boolean;
  lastActive: number;
  trustScore: number; // 0-1, evolves over time
}

export interface AuthorityDecision {
  actionId: string;
  decisionType: "approve" | "veto" | "modify";
  votes: {
    humanId: string;
    approve: boolean;
    weight: number;
    reason?: string;
    timestamp: number;
  }[];
  approvalScore: number; // weighted sum
  finalDecision: "approved" | "denied" | "pending" | "vetoed";
  threshold: number;
  requiredVotes: number;
  createdAt: number;
  resolvedAt?: number;
}

export interface AuthorityProposal {
  proposalId: string;
  actionId: string;
  description: string;
  context: string;
  scope: AuthorityScope;
  urgency: "low" | "medium" | "high" | "critical";
  proposedBy: string;
  createdAt: number;
  expiresAt: number;
  requiredRoles: HumanRole[];
  minApprovalThreshold: number;
}

class MultiHumanAuthorityManager {
  private authorities: Map<string, HumanAuthority> = new Map();
  private decisions: Map<string, AuthorityDecision> = new Map();
  private proposals: Map<string, AuthorityProposal> = new Map();
  private storagePath: string;

  // Role-based weights and thresholds
  private readonly ROLE_WEIGHTS: Record<HumanRole, number> = {
    owner: 1.0,
    moderator: 0.8,
    developer: 0.6,
    operator: 0.4
  };

  private readonly SCOPE_THRESHOLDS: Record<AuthorityScope, number> = {
    global: 0.8,
    stream: 0.6,
    task: 0.5,
    skill: 0.4
  };

  private readonly DEFAULT_THRESHOLDS: Record<string, number> = {
    critical: 0.9,
    high: 0.7,
    medium: 0.5,
    low: 0.3
  };

  constructor(storagePath: string = './data/multi-human-authority.json') {
    this.storagePath = storagePath;
    this.initializeDefaultAuthorities();
    this.loadAuthorities();
  }

  /**
   * Initialize default human authorities
   */
  private initializeDefaultAuthorities(): void {
    const defaultAuthorities: Omit<HumanAuthority, 'humanId' | 'lastActive' | 'trustScore'>[] = [
      {
        name: "mercetti",
        role: "owner",
        weight: this.ROLE_WEIGHTS.owner,
        scope: "global",
        permissions: ["all"],
        active: true
      },
      {
        name: "System Moderator",
        role: "moderator",
        weight: this.ROLE_WEIGHTS.moderator,
        scope: "stream",
        permissions: ["moderate_chat", "manage_stream", "approve_content"],
        active: true
      },
      {
        name: "Lead Developer",
        role: "developer",
        weight: this.ROLE_WEIGHTS.developer,
        scope: "task",
        permissions: ["deploy_code", "modify_system", "debug_issues"],
        active: true
      },
      {
        name: "Stream Operator",
        role: "operator",
        weight: this.ROLE_WEIGHTS.operator,
        scope: "skill",
        permissions: ["execute_skills", "monitor_performance"],
        active: true
      }
    ];

    for (const auth of defaultAuthorities) {
      this.authorities.set(this.generateHumanId(), {
        ...auth,
        humanId: this.generateHumanId(),
        lastActive: Date.now(),
        trustScore: 0.8 // Start with high trust for default authorities
      });
    }
  }

  /**
   * Register a new human authority
   */
  registerAuthority(authority: Omit<HumanAuthority, 'humanId' | 'trustScore'>): string {
    const humanId = this.generateHumanId();
    
    // Validate role and weight
    if (authority.weight !== this.ROLE_WEIGHTS[authority.role]) {
      throw new Error(`Weight ${authority.weight} does not match role ${authority.role} weight ${this.ROLE_WEIGHTS[authority.role]}`);
    }

    const fullAuthority: HumanAuthority = {
      ...authority,
      humanId,
      trustScore: 0.5 // New authorities start with neutral trust
    };

    this.authorities.set(humanId, fullAuthority);
    this.saveAuthorities();
    
    return humanId;
  }

  /**
   * Create a proposal for authority decision
   */
  createProposal(proposal: Omit<AuthorityProposal, 'proposalId' | 'createdAt' | 'expiresAt'>): string {
    const proposalId = this.generateProposalId();
    const fullProposal: AuthorityProposal = {
      ...proposal,
      proposalId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    this.proposals.set(proposalId, fullProposal);
    this.saveAuthorities();
    
    return proposalId;
  }

  /**
   * Submit a vote on a proposal
   */
  submitVote(
    proposalId: string,
    humanId: string,
    approve: boolean,
    reason?: string
  ): AuthorityDecision | null {
    const proposal = this.proposals.get(proposalId);
    const authority = this.authorities.get(humanId);

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (!authority) {
      throw new Error(`Authority ${humanId} not found`);
    }

    if (!authority.active) {
      throw new Error(`Authority ${humanId} is not active`);
    }

    if (!this.hasPermission(authority, proposal)) {
      throw new Error(`Authority ${humanId} lacks permission for proposal ${proposalId}`);
    }

    // Check if proposal has expired
    if (Date.now() > proposal.expiresAt) {
      throw new Error(`Proposal ${proposalId} has expired`);
    }

    // Get or create decision
    let decision = this.decisions.get(proposal.actionId);
    if (!decision) {
      decision = {
        actionId: proposal.actionId,
        decisionType: "approve",
        votes: [],
        approvalScore: 0,
        finalDecision: "pending",
        threshold: this.calculateThreshold(proposal),
        requiredVotes: this.calculateRequiredVotes(proposal),
        createdAt: Date.now()
      };
      this.decisions.set(proposal.actionId, decision);
    }

    // Check if already voted
    const existingVote = decision.votes.find(v => v.humanId === humanId);
    if (existingVote) {
      // Update existing vote
      existingVote.approve = approve;
      existingVote.weight = authority.weight * authority.trustScore;
      existingVote.reason = reason;
      existingVote.timestamp = Date.now();
    } else {
      // Add new vote
      decision.votes.push({
        humanId,
        approve,
        weight: authority.weight * authority.trustScore,
        reason,
        timestamp: Date.now()
      });
    }

    // Update authority activity
    authority.lastActive = Date.now();

    // Recalculate approval score and final decision
    this.calculateDecisionResult(decision);

    this.saveAuthorities();
    return decision;
  }

  /**
   * Check if authority has permission for proposal
   */
  private hasPermission(authority: HumanAuthority, proposal: AuthorityProposal): boolean {
    // Owner has all permissions
    if (authority.role === "owner") {
      return true;
    }

    // Check scope permission
    if (!this.scopeMatches(authority.scope, proposal.scope)) {
      return false;
    }

    // Check role requirements
    if (!proposal.requiredRoles.includes(authority.role)) {
      return false;
    }

    // Check specific permissions
    if (authority.permissions.includes("all")) {
      return true;
    }

    return true; // Simplified for now
  }

  /**
   * Check if scope matches (higher scopes include lower scopes)
   */
  private scopeMatches(authorityScope: AuthorityScope, proposalScope: AuthorityScope): boolean {
    const scopeHierarchy: Record<AuthorityScope, AuthorityScope[]> = {
      global: ["global", "stream", "task", "skill"],
      stream: ["stream", "task", "skill"],
      task: ["task", "skill"],
      skill: ["skill"]
    };

    return scopeHierarchy[authorityScope].includes(proposalScope);
  }

  /**
   * Calculate approval threshold for proposal
   */
  private calculateThreshold(proposal: AuthorityProposal): number {
    // Use proposal-specific threshold or default based on urgency
    if (proposal.minApprovalThreshold > 0) {
      return proposal.minApprovalThreshold;
    }

    return this.DEFAULT_THRESHOLDS[proposal.urgency] || 0.5;
  }

  /**
   * Calculate required votes for proposal
   */
  private calculateRequiredVotes(proposal: AuthorityProposal): number {
    // Critical and high urgency require more votes
    switch (proposal.urgency) {
      case "critical":
        return 1; // Any single vote (usually owner) can decide
      case "high":
        return 2;
      case "medium":
        return 3;
      case "low":
        return 2;
      default:
        return 2;
    }
  }

  /**
   * Calculate decision result from votes
   */
  private calculateDecisionResult(decision: AuthorityDecision): void {
    // Check for owner veto (immediate halt)
    const ownerVotes = decision.votes.filter(v => {
      const authority = this.authorities.get(v.humanId);
      return authority && authority.role === "owner" && !v.approve;
    });

    if (ownerVotes.length > 0) {
      decision.finalDecision = "vetoed";
      decision.decisionType = "veto";
      decision.resolvedAt = Date.now();
      return;
    }

    // Check if enough votes have been cast
    if (decision.votes.length < decision.requiredVotes) {
      decision.finalDecision = "pending";
      return;
    }

    // Calculate weighted approval score
    const approveWeight = decision.votes
      .filter(v => v.approve)
      .reduce((sum, v) => sum + v.weight, 0);

    const totalWeight = decision.votes
      .reduce((sum, v) => sum + v.weight, 0);

    decision.approvalScore = totalWeight > 0 ? approveWeight / totalWeight : 0;

    // Make final decision
    if (decision.approvalScore >= decision.threshold) {
      decision.finalDecision = "approved";
      decision.decisionType = "approve";
    } else {
      decision.finalDecision = "denied";
      decision.decisionType = "veto";
    }

    decision.resolvedAt = Date.now();

    // Update trust scores based on decision outcomes
    this.updateTrustScores(decision);
  }

  /**
   * Update trust scores based on decision outcomes
   */
  private updateTrustScores(decision: AuthorityDecision): void {
    // This would normally track outcomes and adjust trust
    // For now, maintain current trust scores
  }

  /**
   * Get authority by ID
   */
  getAuthority(humanId: string): HumanAuthority | undefined {
    return this.authorities.get(humanId);
  }

  /**
   * Get all authorities
   */
  getAllAuthorities(): HumanAuthority[] {
    return Array.from(this.authorities.values());
  }

  /**
   * Get authorities by role
   */
  getAuthoritiesByRole(role: HumanRole): HumanAuthority[] {
    return Array.from(this.authorities.values())
      .filter(a => a.role === role && a.active);
  }

  /**
   * Get authorities by scope
   */
  getAuthoritiesByScope(scope: AuthorityScope): HumanAuthority[] {
    return Array.from(this.authorities.values())
      .filter(a => this.scopeMatches(a.scope, scope) && a.active);
  }

  /**
   * Get decision for action
   */
  getDecision(actionId: string): AuthorityDecision | undefined {
    return this.decisions.get(actionId);
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: string): AuthorityProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get pending proposals
   */
  getPendingProposals(): AuthorityProposal[] {
    return Array.from(this.proposals.values())
      .filter(p => Date.now() < p.expiresAt);
  }

  /**
   * Get recent decisions
   */
  getRecentDecisions(limit: number = 10): AuthorityDecision[] {
    return Array.from(this.decisions.values())
      .sort((a, b) => (b.resolvedAt || b.createdAt) - (a.resolvedAt || a.createdAt))
      .slice(0, limit);
  }

  /**
   * Update authority trust score
   */
  updateTrustScore(humanId: string, newScore: number): void {
    const authority = this.authorities.get(humanId);
    if (authority) {
      authority.trustScore = Math.max(0, Math.min(1, newScore));
      this.saveAuthorities();
    }
  }

  /**
   * Deactivate authority
   */
  deactivateAuthority(humanId: string): void {
    const authority = this.authorities.get(humanId);
    if (authority) {
      authority.active = false;
      this.saveAuthorities();
    }
  }

  /**
   * Reactivate authority
   */
  reactivateAuthority(humanId: string): void {
    const authority = this.authorities.get(humanId);
    if (authority) {
      authority.active = true;
      authority.lastActive = Date.now();
      this.saveAuthorities();
    }
  }

  /**
   * Get authority statistics
   */
  getAuthorityStats(): {
    totalAuthorities: number;
    activeAuthorities: number;
    authoritiesByRole: Record<HumanRole, number>;
    averageTrustScore: number;
    totalDecisions: number;
    pendingDecisions: number;
    approvalRate: number;
  } {
    const authorities = Array.from(this.authorities.values());
    const decisions = Array.from(this.decisions.values());

    const authoritiesByRole = authorities.reduce((acc, a) => {
      acc[a.role] = (acc[a.role] || 0) + 1;
      return acc;
    }, {} as Record<HumanRole, number>);

    const averageTrustScore = authorities.length > 0
      ? authorities.reduce((sum, a) => sum + a.trustScore, 0) / authorities.length
      : 0;

    const resolvedDecisions = decisions.filter(d => d.finalDecision !== "pending");
    const approvalRate = resolvedDecisions.length > 0
      ? resolvedDecisions.filter(d => d.finalDecision === "approved").length / resolvedDecisions.length
      : 0;

    return {
      totalAuthorities: authorities.length,
      activeAuthorities: authorities.filter(a => a.active).length,
      authoritiesByRole,
      averageTrustScore,
      totalDecisions: decisions.length,
      pendingDecisions: decisions.filter(d => d.finalDecision === "pending").length,
      approvalRate
    };
  }

  /**
   * Clean up expired proposals
   */
  cleanup(): void {
    const now = Date.now();
    const expiredProposals: string[] = [];

    for (const [proposalId, proposal] of this.proposals.entries()) {
      if (now > proposal.expiresAt) {
        expiredProposals.push(proposalId);
      }
    }

    for (const proposalId of expiredProposals) {
      this.proposals.delete(proposalId);
    }

    this.saveAuthorities();
  }

  /**
   * Save authorities to disk
   */
  private saveAuthorities(): void {
    try {
      const fs = require('fs');
      const data = {
        authorities: Array.from(this.authorities.entries()),
        decisions: Array.from(this.decisions.entries()),
        proposals: Array.from(this.proposals.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save multi-human authority:', error);
    }
  }

  /**
   * Load authorities from disk
   */
  private loadAuthorities(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.authorities = new Map(data.authorities || []);
        this.decisions = new Map(data.decisions || []);
        this.proposals = new Map(data.proposals || []);
      }
    } catch (error) {
      console.error('Failed to load multi-human authority:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  private generateHumanId(): string {
    return `human_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProposalId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { MultiHumanAuthorityManager };
