import { Orchestrator } from './core';
import { SkillModule } from './skillModule';
import { Logger } from '../utils/logger';

export interface MonetizationTier {
  name: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  price: number;
  features: string[];
  skillLimit: number;
  apiLimit: number;
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

export interface UsageMetrics {
  totalExecutions: number;
  executionsBySkill: Record<string, number>;
  apiCalls: number;
  storageUsed: number;
  bandwidthUsed: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueBySkill: Record<string, number>;
  revenueByTier: Record<string, number>;
  monthlyGrowth: number;
  churnRate: number;
  ltv: number; // Lifetime Value
}

export interface TrialPeriod {
  skillId: string;
  userId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  conversionProbability: number;
}

export class MonetizationManager {
  private orchestrator: Orchestrator;
  private logger: Logger;
  private tiers: Map<string, MonetizationTier> = new Map();
  private activeTrials: Map<string, TrialPeriod> = new Map();

  constructor(orchestrator: Orchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger();
    this.initializeTiers();
  }

  /**
   * Initialize pricing tiers
   */
  private initializeTiers(): void {
    const tiers: MonetizationTier[] = [
      {
        name: 'Free',
        price: 0,
        features: ['Basic skills', 'Community support', '100 executions/month'],
        skillLimit: 5,
        apiLimit: 1000,
        supportLevel: 'community'
      },
      {
        name: 'Pro',
        price: 29,
        features: ['Advanced skills', 'Email support', '1000 executions/month', 'Basic analytics'],
        skillLimit: 15,
        apiLimit: 10000,
        supportLevel: 'email'
      },
      {
        name: 'Creator+',
        price: 99,
        features: ['All skills', 'Priority support', 'Unlimited executions', 'Advanced analytics', 'Partner payouts'],
        skillLimit: 50,
        apiLimit: 100000,
        supportLevel: 'priority'
      },
      {
        name: 'Enterprise',
        price: 499,
        features: ['Custom skills', 'Dedicated support', 'Unlimited everything', 'White-label options', 'SLA guarantee'],
        skillLimit: -1, // Unlimited
        apiLimit: -1, // Unlimited
        supportLevel: 'dedicated'
      }
    ];

    for (const tier of tiers) {
      this.tiers.set(tier.name, tier);
    }

    this.logger.log(`Initialized ${tiers.length} monetization tiers`);
  }

  /**
   * Check if user can access skill based on tier
   */
  canAccessSkill(userTier: string, skill: SkillModule): boolean {
    const tier = this.tiers.get(userTier);
    if (!tier) {
      this.logger.warn(`Unknown tier: ${userTier}`);
      return false;
    }

    // Free users can only access Free skills
    if (userTier === 'Free' && skill.tier !== 'Free') {
      return false;
    }

    // Pro users can access Free and Pro skills
    if (userTier === 'Pro' && !['Free', 'Pro'].includes(skill.tier)) {
      return false;
    }

    // Creator+ users can access all skills except Enterprise-only
    if (userTier === 'Creator+' && skill.tier === 'Enterprise') {
      return false;
    }

    // Enterprise users can access all skills
    return true;
  }

  /**
   * Get available skills for user tier
   */
  getAvailableSkills(userTier: string, allSkills: SkillModule[]): SkillModule[] {
    return allSkills.filter(skill => this.canAccessSkill(userTier, skill));
  }

  /**
   * Calculate upgrade cost
   */
  calculateUpgradeCost(currentTier: string, targetTier: string): number {
    const current = this.tiers.get(currentTier);
    const target = this.tiers.get(targetTier);
    
    if (!current || !target) {
      return 0;
    }

    return Math.max(0, target.price - current.price);
  }

  /**
   * Start trial period for skill
   */
  startTrial(skillId: string, userId: string, days: number = 14): void {
    const trialId = `${skillId}_${userId}_${Date.now()}`;
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const trial: TrialPeriod = {
      skillId,
      userId,
      startDate: new Date().toISOString(),
      endDate,
      isActive: true,
      usageCount: 0,
      conversionProbability: 0
    };

    this.activeTrials.set(trialId, trial);
    this.logger.log(`Started trial for skill ${skillId}, user ${userId}`);
  }

  /**
   * Get trial status
   */
  getTrialStatus(trialId: string): TrialPeriod | undefined {
    return this.activeTrials.get(trialId);
  }

  /**
   * Convert trial to paid subscription
   */
  convertTrial(trialId: string, targetTier: string): boolean {
    const trial = this.activeTrials.get(trialId);
    if (!trial || !trial.isActive) {
      return false;
    }

    // Update trial
    trial.isActive = false;
    trial.conversionProbability = 1.0;

    this.logger.log(`Converted trial ${trialId} to tier ${targetTier}`);
    return true;
  }

  /**
   * Get usage metrics for user
   */
  getUsageMetrics(userId: string): UsageMetrics {
    // Mock implementation - in real system, this would query database
    return {
      totalExecutions: 1250,
      executionsBySkill: {
        'Code Helper': 450,
        'Audio Maestro': 280,
        'Graphics Wizard': 320,
        'Link Reviewer': 200
      },
      apiCalls: 15420,
      storageUsed: 2.3, // GB
      bandwidthUsed: 8.7 // GB
    };
  }

  /**
   * Get revenue metrics
   */
  getRevenueMetrics(period: 'month' | 'quarter' | 'year' = 'month'): RevenueMetrics {
    // Mock implementation - in real system, this would calculate from payments
    const monthlyData = {
      totalRevenue: 45780,
      revenueBySkill: {
        'Code Helper': 12500,
        'Audio Maestro': 8900,
        'Graphics Wizard': 15600,
        'Analytics & Reporting': 8780
      },
      revenueByTier: {
        'Free': 0,
        'Pro': 12450,
        'Creator+': 28330,
        'Enterprise': 5000
      },
      monthlyGrowth: 12.5, // %
      churnRate: 3.2, // %
      ltv: 2850 // Average customer lifetime value
    };

    if (period === 'month') {
      return monthlyData;
    }

    // For quarter/year, multiply accordingly
    const multiplier = period === 'quarter' ? 3 : 12;
    return {
      ...monthlyData,
      totalRevenue: monthlyData.totalRevenue * multiplier,
      monthlyGrowth: monthlyData.monthlyGrowth,
      churnRate: monthlyData.churnRate,
      ltv: monthlyData.ltv
    };
  }

  /**
   * Calculate skill ROI
   */
  calculateSkillROI(skillName: string, developmentCost: number): number {
    const revenue = this.getRevenueMetrics().revenueBySkill[skillName] || 0;
    const monthlyCost = developmentCost / 12; // Amortize over 12 months
    
    if (monthlyCost === 0) return 0;
    
    return (revenue - monthlyCost) / monthlyCost;
  }

  /**
   * Get pricing information
   */
  getPricingInfo(): MonetizationTier[] {
    return Array.from(this.tiers.values());
  }

  /**
   * Simulate pricing experiment
   */
  simulatePricingExperiment(
    experimentType: 'price_change' | 'new_tier' | 'bundle',
    parameters: any
  ): {
    projectedRevenue: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const currentRevenue = this.getRevenueMetrics().totalRevenue;
    
    switch (experimentType) {
      case 'price_change':
        const priceChange = parameters.priceChange as number;
        const projectedImpact = (priceChange / 29) * 0.15; // 15% of Pro tier revenue affected
        return {
          projectedRevenue: currentRevenue + (projectedImpact * 12),
          riskLevel: Math.abs(priceChange) > 10 ? 'high' : 'medium',
          recommendations: [
            'Test with small user segment first',
            'Monitor churn rate closely',
            'Consider grandfathering existing users'
          ]
        };
        
      case 'new_tier':
        return {
          projectedRevenue: currentRevenue * 1.25, // 25% growth expected
          riskLevel: 'medium',
          recommendations: [
            'Create migration path from existing tiers',
            'Offer early bird discount',
            'Update marketing materials'
          ]
        };
        
      case 'bundle':
        return {
          projectedRevenue: currentRevenue * 1.18, // 18% uplift from bundles
          riskLevel: 'low',
          recommendations: [
            'Bundle complementary skills together',
            'Create tier-based bundle options',
            'Highlight savings in marketing'
          ]
        };
        
      default:
        return {
          projectedRevenue: currentRevenue,
          riskLevel: 'low',
          recommendations: ['No experiment specified']
        };
    }
  }

  /**
   * Get active trials
   */
  getActiveTrials(): TrialPeriod[] {
    return Array.from(this.activeTrials.values());
  }

  /**
   * Clean up expired trials
   */
  cleanupExpiredTrials(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [trialId, trial] of this.activeTrials.entries()) {
      if (new Date(trial.endDate).getTime() < now && trial.isActive) {
        trial.isActive = false;
        trial.conversionProbability = 0;
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired trials`);
    }
  }

  /**
   * Generate monetization report
   */
  generateMonetizationReport(): {
    pricing: MonetizationTier[];
    usage: UsageMetrics;
    revenue: RevenueMetrics;
    trials: TrialPeriod[];
    recommendations: string[];
  } {
    return {
      pricing: this.getPricingInfo(),
      usage: this.getUsageMetrics('system'),
      revenue: this.getRevenueMetrics(),
      trials: this.getActiveTrials(),
      recommendations: [
        'Consider introducing mid-tier pricing at $19/month',
        'Bundle Code Helper with Audio Maestro for 10% discount',
        'Launch enterprise tier with dedicated support SLA'
      ]
    };
  }
}
