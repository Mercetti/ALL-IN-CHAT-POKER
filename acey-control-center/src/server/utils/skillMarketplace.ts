// File: src/server/utils/skillMarketplace.ts

/**
 * Skill Marketplaces
 * Acey's emergent skills become tradeable internal assets
 */

export type SkillAsset = {
  skillId: string;
  description: string;
  domain: string[];
  confidence: number;
  usageCount: number;
  successRate: number;
  enabled: boolean;
  version: string;
  createdAt: number;
  lastUsed: number;
  performanceHistory: Array<{
    timestamp: number;
    success: boolean;
    confidence: number;
    context: string;
  }>;
  cost: {
    compute: number;
    memory: number;
    latency: number;
  };
  dependencies: string[];
  tags: string[];
};

export type SkillMarketplace = {
  skills: SkillAsset[];
  promotionThreshold: number;
  demotionThreshold: number;
  marketplaceStatus: "active" | "maintenance" | "closed";
  totalValue: number;
  skillTransactions: SkillTransaction[];
};

export type SkillTransaction = {
  transactionId: string;
  skillId: string;
  transactionType: "enable" | "disable" | "promote" | "demote" | "version" | "retire";
  timestamp: number;
  reason: string;
  previousState?: Partial<SkillAsset>;
  newState?: Partial<SkillAsset>;
  initiator: "system" | "human" | "auto_governance";
};

export type MarketplaceConfig = {
  autoGovernance: boolean;
  promotionThreshold: number;
  demotionThreshold: number;
  retirementThreshold: number;
  maxSkills: number;
  enableSkillTrading: boolean;
  enableVersioning: boolean;
  governanceIntervalMs: number;
};

/**
 * Skill Marketplace Manager
 */
export class SkillMarketplaceManager {
  private marketplace: SkillMarketplace;
  private config: MarketplaceConfig;
  private governanceTimer: NodeJS.Timeout | null = null;
  private skillMetrics: {
    totalCreated: number;
    totalRetired: number;
    avgSuccessRate: number;
    domainDistribution: Record<string, number>;
    marketplaceActivity: {
      promotions: number;
      demotions: number;
      retirements: number;
      transactions: number;
    };
  };

  constructor(config?: Partial<MarketplaceConfig>) {
    this.config = {
      autoGovernance: true,
      promotionThreshold: 0.8,
      demotionThreshold: 0.3,
      retirementThreshold: 0.1,
      maxSkills: 1000,
      enableSkillTrading: true,
      enableVersioning: true,
      governanceIntervalMs: 60000, // 1 minute
      ...config
    };

    this.marketplace = {
      skills: [],
      promotionThreshold: this.config.promotionThreshold,
      demotionThreshold: this.config.demotionThreshold,
      marketplaceStatus: "active",
      totalValue: 0,
      skillTransactions: []
    };

    this.skillMetrics = {
      totalCreated: 0,
      totalRetired: 0,
      avgSuccessRate: 0,
      domainDistribution: {},
      marketplaceActivity: {
        promotions: 0,
        demotions: 0,
        retirements: 0,
        transactions: 0
      }
    };

    this.startAutoGovernance();
    this.initializeMarketplace();
  }

  /**
   * Initialize marketplace with default skills
   */
  private initializeMarketplace(): void {
    const defaultSkills: SkillAsset[] = [
      {
        skillId: "basic_reasoning",
        description: "Fundamental logical reasoning and analysis",
        domain: ["reasoning", "analysis"],
        confidence: 0.9,
        usageCount: 150,
        successRate: 0.85,
        enabled: true,
        version: "1.0.0",
        createdAt: Date.now() - 86400000, // 1 day ago
        lastUsed: Date.now() - 3600000, // 1 hour ago
        performanceHistory: [],
        cost: { compute: 1, memory: 1, latency: 100 },
        dependencies: [],
        tags: ["core", "reasoning", "analysis"]
      },
      {
        skillId: "creative_synthesis",
        description: "Creative content generation and synthesis",
        domain: ["creative", "generation"],
        confidence: 0.8,
        usageCount: 75,
        successRate: 0.78,
        enabled: true,
        version: "1.2.0",
        createdAt: Date.now() - 172800000, // 2 days ago
        lastUsed: Date.now() - 7200000, // 2 hours ago
        performanceHistory: [],
        cost: { compute: 2, memory: 2, latency: 200 },
        dependencies: ["basic_reasoning"],
        tags: ["creative", "synthesis", "generation"]
      },
      {
        skillId: "safety_validation",
        description: "Safety and ethical validation checks",
        domain: ["safety", "ethics"],
        confidence: 0.95,
        usageCount: 200,
        successRate: 0.92,
        enabled: true,
        version: "2.0.0",
        createdAt: Date.now() - 259200000, // 3 days ago
        lastUsed: Date.now() - 1800000, // 30 minutes ago
        performanceHistory: [],
        cost: { compute: 1, memory: 1, latency: 50 },
        dependencies: [],
        tags: ["safety", "ethics", "validation", "critical"]
      },
      {
        skillId: "data_analysis",
        description: "Data processing and statistical analysis",
        domain: ["data", "analysis"],
        confidence: 0.75,
        usageCount: 50,
        successRate: 0.72,
        enabled: true,
        version: "1.0.0",
        createdAt: Date.now() - 432000000, // 5 days ago
        lastUsed: Date.now() - 14400000, // 4 hours ago
        performanceHistory: [],
        cost: { compute: 3, memory: 2, latency: 300 },
        dependencies: ["basic_reasoning"],
        tags: ["data", "analysis", "statistics"]
      }
    ];

    for (const skill of defaultSkills) {
      this.marketplace.skills.push(skill);
      this.skillMetrics.totalCreated++;
    }

    this.updateMarketplaceValue();
    console.log(`[SkillMarketplace] Initialized with ${defaultSkills.length} default skills`);
  }

  /**
   * Add new skill to marketplace
   */
  public addSkill(skill: Omit<SkillAsset, "skillId" | "createdAt" | "lastUsed" | "performanceHistory">): string {
    const skillId = this.generateSkillId(skill.description);
    
    const newSkill: SkillAsset = {
      ...skill,
      skillId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      performanceHistory: []
    };

    this.marketplace.skills.push(newSkill);
    this.recordTransaction({
      skillId,
      transactionType: "enable",
      timestamp: Date.now(),
      reason: "New skill added to marketplace",
      newState: newSkill,
      initiator: "system"
    });

    this.skillMetrics.totalCreated++;
    this.updateMarketplaceValue();
    this.updateDomainDistribution();

    console.log(`[SkillMarketplace] Added skill ${skillId} to marketplace`);
    return skillId;
  }

  /**
   * Execute skill and update performance
   */
  public async executeSkill(
    skillId: string,
    context: any,
    parameters?: any
  ): Promise<{
    success: boolean;
    result: any;
    confidence: number;
    executionTime: number;
    cost: SkillAsset["cost"];
  }> {
    const skill = this.marketplace.skills.find(s => s.skillId === skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} not found in marketplace`);
    }

    if (!skill.enabled) {
      throw new Error(`Skill ${skillId} is disabled`);
    }

    const startTime = Date.now();

    try {
      // Simulate skill execution
      const result = await this.simulateSkillExecution(skill, context, parameters);
      
      // Update skill performance
      const executionTime = Date.now() - startTime;
      this.updateSkillPerformance(skill, result.success, result.confidence, context, executionTime);

      return {
        ...result,
        executionTime,
        cost: skill.cost
      };

    } catch (error) {
      console.error(`[SkillMarketplace] Skill execution failed:`, error);
      
      this.updateSkillPerformance(skill, false, 0, context, Date.now() - startTime);
      
      return {
        success: false,
        result: null,
        confidence: 0,
        executionTime: Date.now() - startTime,
        cost: skill.cost
      };
    }
  }

  /**
   * Simulate skill execution (mock implementation)
   */
  private async simulateSkillExecution(
    skill: SkillAsset,
    context: any,
    parameters?: any
  ): Promise<{ success: boolean; result: any; confidence: number }> {
    // Simulate processing delay based on skill cost
    await new Promise(resolve => setTimeout(resolve, skill.cost.latency));

    // Calculate success probability based on skill confidence
    const successProbability = skill.confidence * skill.successRate;
    const success = Math.random() < successProbability;

    // Generate result based on skill domains
    const result = {
      skillId: skill.skillId,
      domains: skill.domain,
      executedAt: Date.now(),
      context,
      parameters,
      output: success ? `Skill ${skill.skillId} executed successfully` : `Skill ${skill.skillId} execution failed`
    };

    const confidence = success ? skill.confidence * (0.8 + Math.random() * 0.2) : skill.confidence * 0.3;

    return {
      success,
      result,
      confidence
    };
  }

  /**
   * Update skill performance metrics
   */
  private updateSkillPerformance(
    skill: SkillAsset,
    success: boolean,
    confidence: number,
    context: any,
    executionTime: number
  ): void {
    skill.lastUsed = Date.now();
    skill.usageCount++;

    // Update performance history
    skill.performanceHistory.push({
      timestamp: Date.now(),
      success,
      confidence,
      context: JSON.stringify(context).substring(0, 100)
    });

    // Keep only last 50 performance entries
    if (skill.performanceHistory.length > 50) {
      skill.performanceHistory.shift();
    }

    // Recalculate success rate
    const recentPerformance = skill.performanceHistory.slice(-20); // Last 20 executions
    const successCount = recentPerformance.filter(p => p.success).length;
    skill.successRate = successCount / recentPerformance.length;

    // Update confidence based on recent performance
    const avgConfidence = recentPerformance.reduce((sum, p) => sum + p.confidence, 0) / recentPerformance.length;
    skill.confidence = Math.max(0.1, Math.min(1.0, avgConfidence));

    this.updateMarketplaceValue();
  }

  /**
   * Enable/disable skill
   */
  public setSkillEnabled(skillId: string, enabled: boolean, reason: string = "Manual toggle"): boolean {
    const skill = this.marketplace.skills.find(s => s.skillId === skillId);
    if (!skill) return false;

    const previousState = { enabled: skill.enabled };
    skill.enabled = enabled;

    this.recordTransaction({
      skillId,
      transactionType: enabled ? "enable" : "disable",
      timestamp: Date.now(),
      reason,
      previousState,
      newState: { enabled },
      initiator: "human"
    });

    console.log(`[SkillMarketplace] ${enabled ? 'Enabled' : 'Disabled'} skill ${skillId}: ${reason}`);
    return true;
  }

  /**
   * Auto-governance: promote/demote/retire skills
   */
  private performAutoGovernance(): void {
    if (!this.config.autoGovernance) return;

    console.log(`[SkillMarketplace] Performing auto-governance on ${this.marketplace.skills.length} skills`);

    for (const skill of this.marketplace.skills) {
      // Check for promotion
      if (skill.successRate >= this.config.promotionThreshold && skill.usageCount >= 10) {
        this.promoteSkill(skill.skillId, "Auto-governance: High performance");
      }
      // Check for demotion
      else if (skill.successRate <= this.config.demotionThreshold && skill.usageCount >= 5) {
        this.demoteSkill(skill.skillId, "Auto-governance: Low performance");
      }
      // Check for retirement
      else if (skill.successRate <= this.config.retirementThreshold && skill.usageCount >= 20) {
        this.retireSkill(skill.skillId, "Auto-governance: Consistent poor performance");
      }
    }

    // Check marketplace capacity
    if (this.marketplace.skills.length > this.config.maxSkills) {
      this.retireWorstSkills();
    }

    this.updateSkillMetrics();
  }

  /**
   * Promote skill (increase version, confidence)
   */
  private promoteSkill(skillId: string, reason: string): void {
    const skill = this.marketplace.skills.find(s => s.skillId === skillId);
    if (!skill) return;

    const previousState = {
      version: skill.version,
      confidence: skill.confidence,
      successRate: skill.successRate
    };

    // Increment version
    const versionParts = skill.version.split('.').map(Number);
    versionParts[2]++; // Increment patch version
    skill.version = versionParts.join('.');

    // Boost confidence
    skill.confidence = Math.min(1.0, skill.confidence + 0.05);

    this.recordTransaction({
      skillId,
      transactionType: "promote",
      timestamp: Date.now(),
      reason: "Skill promoted based on performance",
      newState: {
        version: skill.version,
        confidence: skill.confidence
      },
      initiator: "auto_governance"
    });

    this.skillMetrics.marketplaceActivity.promotions++;
    console.log(`[SkillMarketplace] Promoted skill ${skillId} to version ${skill.version}`);
  }

  /**
   * Demote skill (decrease confidence, potentially disable)
  */
  private demoteSkill(skillId: string, reason: string): void {
    const skill = this.marketplace.skills.find(s => s.skillId === skillId);
    if (!skill) return;

    const previousState = {
      confidence: skill.confidence,
      enabled: skill.enabled
    };

    // Reduce confidence
    skill.confidence = Math.max(0.1, skill.confidence - 0.1);

    // Disable if confidence is too low
    if (skill.confidence < 0.3) {
      skill.enabled = false;
    }

    this.recordTransaction({
      skillId,
      transactionType: "demote",
      timestamp: Date.now(),
      reason: "Skill demoted due to poor performance",
      newState: {
        confidence: skill.confidence,
        enabled: skill.enabled
      },
      initiator: "auto_governance"
    });

    this.skillMetrics.marketplaceActivity.demotions++;
    console.log(`[SkillMarketplace] Demoted skill ${skillId} (confidence: ${skill.confidence.toFixed(2)})`);
  }

  /**
   * Retire skill (remove from marketplace)
   */
  private retireSkill(skillId: string, reason: string): void {
    const skillIndex = this.marketplace.skills.findIndex(s => s.skillId === skillId);
    if (skillIndex === -1) return;

    const retiredSkill = this.marketplace.skills[skillIndex];
    this.marketplace.skills.splice(skillIndex, 1);

    this.recordTransaction({
      skillId,
      transactionType: "retire",
      timestamp: Date.now(),
      reason: "Skill retired - obsolete",
      previousState: retiredSkill,
      initiator: "auto_governance"
    });

    this.skillMetrics.totalRetired++;
    this.skillMetrics.marketplaceActivity.retirements++;
    this.updateMarketplaceValue();
    console.log(`[SkillMarketplace] Retired skill ${skillId}: ${reason}`);
  }

  /**
   * Retire worst performing skills to maintain capacity
   */
  private retireWorstSkills(): void {
    const skillsToRetire = this.marketplace.skills.length - this.config.maxSkills;
    if (skillsToRetire <= 0) return;

    // Sort by performance (success rate * confidence * usage)
    const sortedSkills = this.marketplace.skills.sort((a, b) => {
      const scoreA = a.successRate * a.confidence * Math.log(a.usageCount + 1);
      const scoreB = b.successRate * b.confidence * Math.log(b.usageCount + 1);
      return scoreA - scoreB;
    });

    for (let i = 0; i < skillsToRetire; i++) {
      this.retireSkill(sortedSkills[i].skillId, "Auto-governance: Marketplace capacity limit");
    }
  }

  /**
   * Get skills by domain
   */
  public getSkillsByDomain(domain: string): SkillAsset[] {
    return this.marketplace.skills
      .filter(skill => skill.domain.includes(domain))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get enabled skills
   */
  public getEnabledSkills(): SkillAsset[] {
    return this.marketplace.skills
      .filter(skill => skill.enabled)
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get marketplace statistics
   */
  public getMarketplaceStatistics(): typeof this.skillMetrics & {
    marketplace: SkillMarketplace;
    topSkills: SkillAsset[];
    domainDistribution: Record<string, number>;
  } {
    this.updateSkillMetrics();

    const topSkills = this.marketplace.skills
      .sort((a, b) => (b.successRate * b.confidence * b.usageCount) - (a.successRate * a.confidence * a.usageCount))
      .slice(0, 10);

    return {
      ...this.skillMetrics,
      marketplace: this.marketplace,
      topSkills,
      domainDistribution: this.skillMetrics.domainDistribution
    };
  }

  /**
   * Update skill metrics
   */
  private updateSkillMetrics(): void {
    if (this.marketplace.skills.length === 0) return;

    // Update average success rate
    this.skillMetrics.avgSuccessRate = this.marketplace.skills
      .reduce((sum, skill) => sum + skill.successRate, 0) / this.marketplace.skills.length;

    // Update domain distribution
    this.updateDomainDistribution();

    // Update marketplace activity
    this.skillMetrics.marketplaceActivity.transactions = this.marketplace.skillTransactions.length;
  }

  /**
   * Update domain distribution
   */
  private updateDomainDistribution(): void {
    this.skillMetrics.domainDistribution = {};
    
    for (const skill of this.marketplace.skills) {
      for (const domain of skill.domain) {
        this.skillMetrics.domainDistribution[domain] = 
          (this.skillMetrics.domainDistribution[domain] || 0) + 1;
      }
    }
  }

  /**
   * Update marketplace value
   */
  private updateMarketplaceValue(): void {
    this.marketplace.totalValue = this.marketplace.skills
      .reduce((sum, skill) => sum + (skill.confidence * skill.successRate * skill.usageCount), 0);
  }

  /**
   * Record transaction
   */
  private recordTransaction(transaction: Omit<SkillTransaction, "transactionId">): void {
    this.marketplace.skillTransactions.push({
      ...transaction,
      transactionId: this.generateTransactionId()
    });

    // Keep only last 1000 transactions
    if (this.marketplace.skillTransactions.length > 1000) {
      this.marketplace.skillTransactions.shift();
    }
  }

  /**
   * Generate skill ID
   */
  private generateSkillId(description: string): string {
    const hash = description.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `skill_${hash}_${Date.now()}`;
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start auto-governance
   */
  private startAutoGovernance(): void {
    if (this.config.autoGovernance) {
      this.governanceTimer = setInterval(() => {
        this.performAutoGovernance();
      }, this.config.governanceIntervalMs);
    }
  }

  /**
   * Stop auto-governance
   */
  public stopAutoGovernance(): void {
    if (this.governanceTimer) {
      clearInterval(this.governanceTimer);
      this.governanceTimer = null;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MarketplaceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.marketplace.promotionThreshold = this.config.promotionThreshold;
    this.marketplace.demotionThreshold = this.config.demotionThreshold;

    // Restart governance timer if interval changed
    if (newConfig.governanceIntervalMs && this.governanceTimer) {
      this.stopAutoGovernance();
      this.startAutoGovernance();
    }
  }

  /**
   * Get transaction history
   */
  public getTransactionHistory(limit: number = 100): SkillTransaction[] {
    return this.marketplace.skillTransactions.slice(-limit);
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.marketplace.skills = [];
    this.marketplace.skillTransactions = [];
    this.marketplace.totalValue = 0;
    this.skillMetrics = {
      totalCreated: 0,
      totalRetired: 0,
      avgSuccessRate: 0,
      domainDistribution: {},
      marketplaceActivity: {
        promotions: 0,
        demotions: 0,
        retirements: 0,
        transactions: 0
      }
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAutoGovernance();
    this.clearAll();
  }
}

// LLM Rule Integration
export const SKILL_MARKETPLACE_RULES = {
  MODULAR_CAPABILITIES: 'Treat skills as modular, revocable capabilities',
  NO_PERMANENT_SKILLS: 'Never assume a skill is permanent',
  AUTO_GOVERNANCE: {
    HIGH_USAGE_SUCCESS: 'High usage + high success → promote',
    LOW_USAGE_FAILURE: 'Low usage + low success → demote',
    FAILED_EVALS: 'Failed evals → disable'
  },
  SKILL_LIFECYCLE: [
    'Skills can be enabled',
    'Skills can be disabled',
    'Skills can be versioned',
    'Skills can be scoped to contexts'
  ],
  PLUGIN_ECONOMY: 'Think plugin economy for cognition'
};
