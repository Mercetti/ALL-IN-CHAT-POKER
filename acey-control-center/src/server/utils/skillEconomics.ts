// File: src/server/utils/skillEconomics.ts

export type SkillEconomics = {
  skillId: string;
  computeCost: number;
  latencyCost: number;
  successReward: number;
  trustBonus: number;
  netValue: number;
};

export type SkillPerformance = {
  skillId: string;
  successRate: number;
  avgLatency: number;
  avgComputeTime: number;
  trustScore: number;
  totalExecutions: number;
  lastExecution: number;
};

class SkillEconomicsManager {
  private static economics: Map<string, SkillEconomics> = new Map();
  private static performance: Map<string, SkillPerformance> = new Map();
  
  // Cost constants (can be adjusted per deployment)
  private static readonly COST_WEIGHTS = {
    compute: 0.1,      // $ per compute unit
    latency: 0.05,     // $ per millisecond
    success: 1.0,      // base reward for success
    trust: 0.5         // bonus multiplier for trust
  };

  /**
   * Initialize default skill economics
   */
  static initializeEconomics(): void {
    const defaultSkills: Omit<SkillEconomics, "netValue">[] = [
      {
        skillId: "generate_audio",
        computeCost: 0.8,
        latencyCost: 0.3,
        successReward: 1.2,
        trustBonus: 0.4
      },
      {
        skillId: "process_task",
        computeCost: 0.4,
        latencyCost: 0.2,
        successReward: 0.8,
        trustBonus: 0.3
      },
      {
        skillId: "moderate_chat",
        computeCost: 0.2,
        latencyCost: 0.1,
        successReward: 0.6,
        trustBonus: 0.2
      },
      {
        skillId: "optimize_performance",
        computeCost: 1.2,
        latencyCost: 0.5,
        successReward: 2.0,
        trustBonus: 0.6
      },
      {
        skillId: "compress_storage",
        computeCost: 0.6,
        latencyCost: 0.8,
        successReward: 1.0,
        trustBonus: 0.3
      }
    ];

    defaultSkills.forEach(skill => {
      const netValue = this.calculateNetValue(skill);
      this.economics.set(skill.skillId, { ...skill, netValue });
    });
  }

  /**
   * Calculate net value using the formula:
   * netValue = successReward + trustBonus - computeCost - latencyCost
   */
  static calculateNetValue(skill: Omit<SkillEconomics, "netValue">): number {
    return skill.successReward + skill.trustBonus - skill.computeCost - skill.latencyCost;
  }

  /**
   * Update skill performance metrics
   */
  static updatePerformance(skillId: string, execution: {
    success: boolean;
    latency: number;
    computeTime: number;
    trustScore?: number;
  }): void {
    const current = this.performance.get(skillId) || {
      skillId,
      successRate: 0,
      avgLatency: 0,
      avgComputeTime: 0,
      trustScore: 0.5,
      totalExecutions: 0,
      lastExecution: Date.now()
    };

    const newTotal = current.totalExecutions + 1;
    const newSuccessRate = (current.successRate * current.totalExecutions + (execution.success ? 1 : 0)) / newTotal;
    const newAvgLatency = (current.avgLatency * current.totalExecutions + execution.latency) / newTotal;
    const newAvgComputeTime = (current.avgComputeTime * current.totalExecutions + execution.computeTime) / newTotal;
    const newTrustScore = execution.trustScore !== undefined 
      ? (current.trustScore * current.totalExecutions + execution.trustScore) / newTotal
      : current.trustScore;

    const updated: SkillPerformance = {
      ...current,
      successRate: newSuccessRate,
      avgLatency: newAvgLatency,
      avgComputeTime: newAvgComputeTime,
      trustScore: newTrustScore,
      totalExecutions: newTotal,
      lastExecution: Date.now()
    };

    this.performance.set(skillId, updated);

    // Recalculate economics based on performance
    this.recalculateEconomics(skillId, updated);
  }

  /**
   * Recalculate skill economics based on performance
   */
  private static recalculateEconomics(skillId: string, performance: SkillPerformance): void {
    const economics = this.economics.get(skillId);
    if (!economics) return;

    // Adjust costs based on actual performance
    const adjustedComputeCost = economics.computeCost * (1 + performance.avgComputeTime / 1000);
    const adjustedLatencyCost = economics.latencyCost * (1 + performance.avgLatency / 1000);
    
    // Adjust rewards based on success rate and trust
    const adjustedSuccessReward = economics.successReward * performance.successRate;
    const adjustedTrustBonus = economics.trustBonus * performance.trustScore;

    const updated: SkillEconomics = {
      ...economics,
      computeCost: adjustedComputeCost,
      latencyCost: adjustedLatencyCost,
      successReward: adjustedSuccessReward,
      trustBonus: adjustedTrustBonus,
      netValue: this.calculateNetValue({
        skillId,
        computeCost: adjustedComputeCost,
        latencyCost: adjustedLatencyCost,
        successReward: adjustedSuccessReward,
        trustBonus: adjustedTrustBonus
      })
    };

    this.economics.set(skillId, updated);
  }

  /**
   * Get skill economics
   */
  static getEconomics(skillId: string): SkillEconomics | null {
    return this.economics.get(skillId) || null;
  }

  /**
   * Get skill performance
   */
  static getPerformance(skillId: string): SkillPerformance | null {
    return this.performance.get(skillId) || null;
  }

  /**
   * Get all skills ranked by net value
   */
  static getSkillsByValue(): SkillEconomics[] {
    return Array.from(this.economics.values()).sort((a, b) => b.netValue - a.netValue);
  }

  /**
   * Get high-value skills (net value > 0)
   */
  static getHighValueSkills(): SkillEconomics[] {
    return this.getSkillsByValue().filter(skill => skill.netValue > 0);
  }

  /**
   * Get low-value skills (net value < 0)
   */
  static getLowValueSkills(): SkillEconomics[] {
    return this.getSkillsByValue().filter(skill => skill.netValue < 0);
  }

  /**
   * Auto-governance: promote or throttle skills based on value
   */
  static autoGovern(): {
    promoted: string[];
    throttled: string[];
    retired: string[];
  } {
    const promoted: string[] = [];
    const throttled: string[] = [];
    const retired: string[] = [];

    this.economics.forEach((economics, skillId) => {
      const performance = this.performance.get(skillId);
      
      if (!performance) return;

      // High net value + good performance = promote
      if (economics.netValue > 0.5 && performance.successRate > 0.8) {
        promoted.push(skillId);
      }
      
      // Low net value + poor performance = throttle
      if (economics.netValue < -0.3 || performance.successRate < 0.4) {
        throttled.push(skillId);
      }
      
      // Very low net value + very poor performance = retire
      if (economics.netValue < -0.8 && performance.successRate < 0.2 && performance.totalExecutions > 10) {
        retired.push(skillId);
      }
    });

    return { promoted, throttled, retired };
  }

  /**
   * Get cost-benefit analysis for a skill
   */
  static getCostBenefitAnalysis(skillId: string): {
    totalCost: number;
    totalBenefit: number;
    roi: number; // Return on investment
    recommendation: "promote" | "maintain" | "throttle" | "retire";
  } {
    const economics = this.economics.get(skillId);
    const performance = this.performance.get(skillId);
    
    if (!economics || !performance) {
      return {
        totalCost: 0,
        totalBenefit: 0,
        roi: 0,
        recommendation: "maintain"
      };
    }

    const totalCost = economics.computeCost + economics.latencyCost;
    const totalBenefit = economics.successReward + economics.trustBonus;
    const roi = totalCost > 0 ? (totalBenefit - totalCost) / totalCost : 0;

    let recommendation: "promote" | "maintain" | "throttle" | "retire" = "maintain";
    
    if (roi > 0.5 && performance.successRate > 0.8) recommendation = "promote";
    else if (roi < -0.3 || performance.successRate < 0.4) recommendation = "throttle";
    else if (roi < -0.8 && performance.successRate < 0.2) recommendation = "retire";

    return {
      totalCost,
      totalBenefit,
      roi,
      recommendation
    };
  }
}

// Initialize default economics
SkillEconomicsManager.initializeEconomics();

export { SkillEconomicsManager };
