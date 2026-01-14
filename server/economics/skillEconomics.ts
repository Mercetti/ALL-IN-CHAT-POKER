/**
 * Economic Incentives for Skills
 * Skills compete for resource allocation based on cost vs reward
 */

export interface SkillEconomics {
  skillId: string;
  skillName: string;
  computeCost: number;        // CPU/memory cost (0-1)
  latencyCost: number;        // Time cost (0-1)
  successReward: number;      // Reward for successful execution (0-1)
  trustBonus: number;         // Bonus based on trust/reliability (0-1)
  netValue: number;           // Calculated net value
  executionCount: number;    // Total executions
  successRate: number;       // Success rate (0-1)
  lastUpdated: number;
  status: "active" | "throttled" | "retired";
}

export interface SkillExecution {
  executionId: string;
  skillId: string;
  startTime: number;
  endTime: number;
  success: boolean;
  computeTime: number;
  memoryUsage: number;
  reward: number;
  trustImpact: number;
  context: string;
}

export interface EconomicPolicy {
  minNetValue: number;       // Minimum net value to remain active
  throttleThreshold: number; // Net value threshold for throttling
  retirementThreshold: number; // Net value threshold for retirement
  promotionThreshold: number; // Net value threshold for promotion
  trustDecayRate: number;    // How quickly trust decays
  rewardDecayRate: number;   // How quickly rewards decay
}

class SkillEconomicsManager {
  private skills: Map<string, SkillEconomics> = new Map();
  private executions: Map<string, SkillExecution> = new Map();
  private policy: EconomicPolicy;
  private storagePath: string;

  constructor(storagePath: string = './data/skill-economics.json') {
    this.storagePath = storagePath;
    this.policy = this.getDefaultPolicy();
    this.initializeDefaultSkills();
    this.loadSkills();
  }

  /**
   * Get default economic policy
   */
  private getDefaultPolicy(): EconomicPolicy {
    return {
      minNetValue: 0.1,
      throttleThreshold: 0.2,
      retirementThreshold: 0.0,
      promotionThreshold: 0.7,
      trustDecayRate: 0.01,
      rewardDecayRate: 0.02
    };
  }

  /**
   * Initialize default skills with economic parameters
   */
  private initializeDefaultSkills(): void {
    const defaultSkills: Omit<SkillEconomics, 'netValue' | 'executionCount' | 'successRate' | 'lastUpdated' | 'status'>[] = [
      {
        skillId: "chat_response",
        skillName: "Chat Response Generation",
        computeCost: 0.3,
        latencyCost: 0.2,
        successReward: 0.6,
        trustBonus: 0.1
      },
      {
        skillId: "cosmetic_generation",
        skillName: "Cosmetic Generation",
        computeCost: 0.7,
        latencyCost: 0.8,
        successReward: 0.8,
        trustBonus: 0.2
      },
      {
        skillId: "poker_analysis",
        skillName: "Poker Game Analysis",
        computeCost: 0.4,
        latencyCost: 0.3,
        successReward: 0.7,
        trustBonus: 0.3
      },
      {
        skillId: "memory_management",
        skillName: "Memory Management",
        computeCost: 0.2,
        latencyCost: 0.1,
        successReward: 0.4,
        trustBonus: 0.4
      },
      {
        skillId: "evaluation",
        skillName: "Self-Evaluation",
        computeCost: 0.5,
        latencyCost: 0.4,
        successReward: 0.5,
        trustBonus: 0.3
      }
    ];

    for (const skill of defaultSkills) {
      this.skills.set(skill.skillId, {
        ...skill,
        netValue: this.calculateNetValue(skill),
        executionCount: 0,
        successRate: 0,
        lastUpdated: Date.now(),
        status: "active"
      });
    }
  }

  /**
   * Calculate net value for a skill
   */
  private calculateNetValue(skill: Omit<SkillEconomics, 'netValue' | 'executionCount' | 'successRate' | 'lastUpdated' | 'status'>): number {
    return skill.successReward + skill.trustBonus - skill.computeCost - skill.latencyCost;
  }

  /**
   * Record skill execution
   */
  recordExecution(execution: Omit<SkillExecution, 'executionId'>): string {
    const executionId = this.generateExecutionId();
    const fullExecution: SkillExecution = {
      ...execution,
      executionId
    };

    this.executions.set(executionId, fullExecution);
    this.updateSkillEconomics(execution.skillId, fullExecution);
    this.saveSkills();

    return executionId;
  }

  /**
   * Update skill economics based on execution
   */
  private updateSkillEconomics(skillId: string, execution: SkillExecution): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    // Update execution metrics
    skill.executionCount++;
    skill.lastUpdated = Date.now();

    // Update success rate
    const recentExecutions = this.getRecentExecutions(skillId, 50);
    const successCount = recentExecutions.filter(e => e.success).length;
    skill.successRate = recentExecutions.length > 0 ? successCount / recentExecutions.length : 0;

    // Update trust bonus based on recent performance
    const recentSuccessRate = this.getRecentSuccessRate(skillId, 20);
    if (recentSuccessRate > 0.8) {
      skill.trustBonus = Math.min(skill.trustBonus + 0.05, 1.0);
    } else if (recentSuccessRate < 0.5) {
      skill.trustBonus = Math.max(skill.trustBonus - 0.1, 0.0);
    }

    // Apply decay to trust and rewards
    skill.trustBonus = Math.max(skill.trustBonus - this.policy.trustDecayRate, 0.0);
    skill.successReward = Math.max(skill.successReward - this.policy.rewardDecayRate, 0.1);

    // Update costs based on actual execution
    const actualComputeCost = execution.computeTime / 1000; // Normalize to 0-1
    const actualLatencyCost = (execution.endTime - execution.startTime) / 10000; // Normalize to 0-1

    // Smooth cost updates
    skill.computeCost = skill.computeCost * 0.9 + actualComputeCost * 0.1;
    skill.latencyCost = skill.latencyCost * 0.9 + actualLatencyCost * 0.1;

    // Recalculate net value
    skill.netValue = this.calculateNetValue(skill);

    // Update skill status based on net value
    this.updateSkillStatus(skill);
  }

  /**
   * Update skill status based on economic performance
   */
  private updateSkillStatus(skill: SkillEconomics): void {
    if (skill.netValue < this.policy.retirementThreshold) {
      skill.status = "retired";
    } else if (skill.netValue < this.policy.throttleThreshold) {
      skill.status = "throttled";
    } else if (skill.netValue > this.policy.promotionThreshold) {
      skill.status = "active";
    } else {
      skill.status = "active";
    }
  }

  /**
   * Get recent executions for a skill
   */
  private getRecentExecutions(skillId: string, limit: number): SkillExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.skillId === skillId)
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, limit);
  }

  /**
   * Get recent success rate for a skill
   */
  private getRecentSuccessRate(skillId: string, limit: number): number {
    const recentExecutions = this.getRecentExecutions(skillId, limit);
    if (recentExecutions.length === 0) return 0;

    const successCount = recentExecutions.filter(e => e.success).length;
    return successCount / recentExecutions.length;
  }

  /**
   * Get best skills for a given context
   */
  getBestSkills(context: string, maxSkills: number = 3): SkillEconomics[] {
    return Array.from(this.skills.values())
      .filter(skill => skill.status === "active")
      .filter(skill => this.isSkillRelevant(skill.skillId, context))
      .sort((a, b) => b.netValue - a.netValue)
      .slice(0, maxSkills);
  }

  /**
   * Check if a skill is relevant to a context
   */
  private isSkillRelevant(skillId: string, context: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      "chat_response": ["chat", "message", "conversation", "question"],
      "cosmetic_generation": ["cosmetic", "visual", "image", "design"],
      "poker_analysis": ["poker", "game", "cards", "strategy"],
      "memory_management": ["memory", "storage", "recall", "learn"],
      "evaluation": ["eval", "test", "check", "validate"]
    };

    const relevantContexts = relevanceMap[skillId] || [];
    return relevantContexts.some(rc => context.toLowerCase().includes(rc));
  }

  /**
   * Get skill economics by ID
   */
  getSkill(skillId: string): SkillEconomics | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Get all skills
   */
  getAllSkills(): SkillEconomics[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by status
   */
  getSkillsByStatus(status: "active" | "throttled" | "retired"): SkillEconomics[] {
    return Array.from(this.skills.values()).filter(skill => skill.status === status);
  }

  /**
   * Update economic policy
   */
  updatePolicy(newPolicy: Partial<EconomicPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
    this.recalculateAllSkills();
    this.saveSkills();
  }

  /**
   * Recalculate all skill values after policy change
   */
  private recalculateAllSkills(): void {
    for (const skill of this.skills.values()) {
      skill.netValue = this.calculateNetValue(skill);
      this.updateSkillStatus(skill);
    }
  }

  /**
   * Get economic statistics
   */
  getEconomicsStats(): {
    totalSkills: number;
    activeSkills: number;
    throttledSkills: number;
    retiredSkills: number;
    averageNetValue: number;
    totalExecutions: number;
    overallSuccessRate: number;
    topPerformingSkills: SkillEconomics[];
    bottomPerformingSkills: SkillEconomics[];
  } {
    const skills = Array.from(this.skills.values());
    const executions = Array.from(this.executions.values());

    const activeSkills = skills.filter(s => s.status === "active");
    const throttledSkills = skills.filter(s => s.status === "throttled");
    const retiredSkills = skills.filter(s => s.status === "retired");

    const averageNetValue = skills.length > 0 
      ? skills.reduce((sum, s) => sum + s.netValue, 0) / skills.length 
      : 0;

    const totalExecutions = executions.length;
    const overallSuccessRate = executions.length > 0
      ? executions.filter(e => e.success).length / executions.length
      : 0;

    const topPerformingSkills = skills
      .sort((a, b) => b.netValue - a.netValue)
      .slice(0, 5);

    const bottomPerformingSkills = skills
      .sort((a, b) => a.netValue - b.netValue)
      .slice(0, 5);

    return {
      totalSkills: skills.length,
      activeSkills: activeSkills.length,
      throttledSkills: throttledSkills.length,
      retiredSkills: retiredSkills.length,
      averageNetValue,
      totalExecutions,
      overallSuccessRate,
      topPerformingSkills,
      bottomPerformingSkills
    };
  }

  /**
   * Get skill performance trends
   */
  getSkillTrends(skillId: string, days: number = 7): {
    date: string;
    netValue: number;
    successRate: number;
    executionCount: number;
  }[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const trends: any[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * dayMs);
      const dayEnd = dayStart + dayMs;

      const dayExecutions = Array.from(this.executions.values()).filter(e => 
        e.skillId === skillId && 
        e.endTime >= dayStart && 
        e.endTime < dayEnd
      );

      const successCount = dayExecutions.filter(e => e.success).length;
      const successRate = dayExecutions.length > 0 ? successCount / dayExecutions.length : 0;

      // Get skill state at that time (simplified)
      const skill = this.skills.get(skillId);
      const netValue = skill ? skill.netValue : 0;

      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        netValue,
        successRate,
        executionCount: dayExecutions.length
      });
    }

    return trends;
  }

  /**
   * Promote a skill (increase its trust bonus)
   */
  promoteSkill(skillId: string, bonusIncrease: number = 0.1): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    skill.trustBonus = Math.min(skill.trustBonus + bonusIncrease, 1.0);
    skill.netValue = this.calculateNetValue(skill);
    this.updateSkillStatus(skill);
    this.saveSkills();
  }

  /**
   * Throttle a skill (decrease its trust bonus)
   */
  throttleSkill(skillId: string, penaltyDecrease: number = 0.2): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    skill.trustBonus = Math.max(skill.trustBonus - penaltyDecrease, 0.0);
    skill.netValue = this.calculateNetValue(skill);
    this.updateSkillStatus(skill);
    this.saveSkills();
  }

  /**
   * Save skills to disk
   */
  private saveSkills(): void {
    try {
      const fs = require('fs');
      const data = {
        skills: Array.from(this.skills.entries()),
        executions: Array.from(this.executions.entries()),
        policy: this.policy
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save skill economics:', error);
    }
  }

  /**
   * Load skills from disk
   */
  private loadSkills(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.skills = new Map(data.skills || []);
        this.executions = new Map(data.executions || []);
        this.policy = data.policy || this.getDefaultPolicy();
      }
    } catch (error) {
      console.error('Failed to load skill economics:', error);
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { SkillEconomicsManager };
