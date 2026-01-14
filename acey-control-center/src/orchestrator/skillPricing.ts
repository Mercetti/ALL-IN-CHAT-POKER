/**
 * Skill Pricing Optimization
 * Dynamic pricing based on usage, value, and market signals
 */

export interface SkillPricing {
  skillId: string;
  model: 'tier_included' | 'addon' | 'bundle';
  basePrice: number;
  currentPrice: number;
  pricingType: 'monthly' | 'usage' | 'one_time';
  usageMetrics: {
    frequency: number;
    regenerationRate: number;
    approvalRate: number;
    timeSaved: number;
  };
  optimizationSignals: {
    demand: 'high' | 'medium' | 'low';
    value: 'high' | 'medium' | 'low';
    competition: 'high' | 'medium' | 'low';
  };
}

export interface PricingOptimization {
  recommendations: string[];
  potentialRevenue: number;
  suggestedAdjustments: Record<string, number>;
}

class SkillPricingOptimizer {
  private skillMetrics: Map<string, SkillPricing> = new Map();
  private marketSignals: Map<string, any> = new Map();
  
  /**
   * Track skill usage for pricing optimization
   */
  trackUsage(skillId: string, usage: any): void {
    const current = this.skillMetrics.get(skillId) || {
      skillId,
      model: 'tier_included',
      basePrice: 0,
      currentPrice: 0,
      pricingType: 'monthly',
      usageMetrics: {
        frequency: 0,
        regenerationRate: 0,
        approvalRate: 0,
        timeSaved: 0
      },
      optimizationSignals: {
        demand: 'medium',
        value: 'medium',
        competition: 'medium'
      }
    };
    
    // Update usage metrics
    current.usageMetrics.frequency += usage.frequency || 0;
    current.usageMetrics.regenerationRate = 
      (current.usageMetrics.regenerationRate + (usage.regenerationRate || 0)) / 2;
    current.usageMetrics.approvalRate = 
      (current.usageMetrics.approvalRate + (usage.approvalRate || 0)) / 2;
    current.usageMetrics.timeSaved += usage.timeSaved || 0;
    
    this.skillMetrics.set(skillId, current);
    
    console.log(`💰 Skill usage tracked: ${skillId} - Frequency: ${current.usageMetrics.frequency}`);
  }
  
  /**
   * Update market signals
   */
  updateMarketSignals(signals: Record<string, any>): void {
    Object.entries(signals).forEach(([skillId, signal]) => {
      this.marketSignals.set(skillId, signal);
    });
  }
  
  /**
   * Calculate optimal pricing
   */
  optimizePricing(): PricingOptimization {
    const recommendations: string[] = [];
    let potentialRevenue = 0;
    const suggestedAdjustments: Record<string, number> = {};
    
    this.skillMetrics.forEach((pricing, skillId) => {
      const optimization = this.calculateSkillOptimization(pricing, skillId);
      
      recommendations.push(...optimization.recommendations);
      potentialRevenue += optimization.revenueImpact;
      suggestedAdjustments[skillId] = optimization.suggestedPrice;
    });
    
    return {
      recommendations: [...new Set(recommendations)], // Remove duplicates
      potentialRevenue,
      suggestedAdjustments
    };
  }
  
  /**
   * Calculate optimization for individual skill
   */
  private calculateSkillOptimization(pricing: SkillPricing, skillId: string): any {
    const marketSignal = this.marketSignals.get(skillId) || {};
    const recommendations: string[] = [];
    let suggestedPrice = pricing.currentPrice;
    let revenueImpact = 0;
    
    // High usage + high approval = increase price
    if (pricing.usageMetrics.frequency > 100 && pricing.usageMetrics.approvalRate > 0.8) {
      const increase = pricing.currentPrice * 0.2; // 20% increase
      suggestedPrice = pricing.currentPrice + increase;
      recommendations.push(`${skillId}: High usage + approval suggests 20% price increase`);
      revenueImpact += increase * 12; // Monthly impact
    }
    
    // Low usage + low approval = decrease price or add to bundle
    if (pricing.usageMetrics.frequency < 20 && pricing.usageMetrics.approvalRate < 0.5) {
      const decrease = pricing.currentPrice * 0.15; // 15% decrease
      suggestedPrice = pricing.currentPrice - decrease;
      recommendations.push(`${skillId}: Low usage suggests 15% price decrease or bundling`);
      revenueImpact -= decrease * 12;
    }
    
    // High regeneration rate = premium addon
    if (pricing.usageMetrics.regenerationRate > 2.0) {
      const premiumAddon = pricing.currentPrice * 0.5;
      suggestedPrice = pricing.currentPrice + premiumAddon;
      recommendations.push(`${skillId}: High regeneration rate supports premium addon`);
      revenueImpact += premiumAddon * 12;
    }
    
    // Market demand adjustment
    if (marketSignal.demand === 'high' && pricing.currentPrice < 20) {
      const marketAdjustment = pricing.currentPrice * 0.25;
      suggestedPrice = pricing.currentPrice + marketAdjustment;
      recommendations.push(`${skillId}: High market demand supports 25% price increase`);
      revenueImpact += marketAdjustment * 12;
    }
    
    // Time saved value calculation
    const timeValue = pricing.usageMetrics.timeSaved * 0.5; // $0.50 per hour saved
    if (timeValue > pricing.currentPrice) {
      recommendations.push(`${skillId}: High time saved value ($${timeValue.toFixed(2)}/mo) justifies higher price`);
    }
    
    return {
      recommendations,
      suggestedPrice,
      revenueImpact
    };
  }
  
  /**
   * Get skill pricing recommendations
   */
  getPricingRecommendations(): Record<string, any> {
    const recommendations: Record<string, any> = {};
    
    this.skillMetrics.forEach((pricing, skillId) => {
      recommendations[skillId] = {
        currentPrice: pricing.currentPrice,
        suggestedPrice: this.calculateSkillOptimization(pricing, skillId).suggestedPrice,
        usage: pricing.usageMetrics,
        model: pricing.model,
        signals: pricing.optimizationSignals
      };
    });
    
    return recommendations;
  }
  
  /**
   * Identify bundling opportunities
   */
  identifyBundlingOpportunities(): Array<{skills: string[], bundlePrice: number, savings: number}> {
    const opportunities: Array<{skills: string[], bundlePrice: number, savings: number}> = [];
    
    // Find skills with similar usage patterns
    const skillsArray = Array.from(this.skillMetrics.entries());
    
    // Audio + Graphics bundle (creators)
    const audioSkills = skillsArray.filter(([id, pricing]) => 
      id.includes('audio') || id.includes('graphics'));
    
    if (audioSkills.length >= 2) {
      const individualPrice = audioSkills.reduce((sum, [, pricing]) => sum + pricing.currentPrice, 0);
      const bundlePrice = individualPrice * 0.7; // 30% discount
      opportunities.push({
        skills: audioSkills.map(([id]) => id),
        bundlePrice,
        savings: individualPrice - bundlePrice
      });
    }
    
    // Code + Review bundle (developers)
    const devSkills = skillsArray.filter(([id, pricing]) => 
      id.includes('code') || id.includes('review'));
    
    if (devSkills.length >= 2) {
      const individualPrice = devSkills.reduce((sum, [, pricing]) => sum + pricing.currentPrice, 0);
      const bundlePrice = individualPrice * 0.75; // 25% discount
      opportunities.push({
        skills: devSkills.map(([id]) => id),
        bundlePrice,
        savings: individualPrice - bundlePrice
      });
    }
    
    return opportunities;
  }
  
  /**
   * Get free-to-paid conversion triggers
   */
  getConversionTriggers(): Record<string, string[]> {
    const triggers: Record<string, string[]> = {};
    
    this.skillMetrics.forEach((pricing, skillId) => {
      const skillTriggers: string[] = [];
      
      // Usage frequency trigger
      if (pricing.usageMetrics.frequency > 50) {
        skillTriggers.push('High usage frequency - suggest upgrade prompt');
      }
      
      // Regeneration rate trigger
      if (pricing.usageMetrics.regenerationRate > 1.5) {
        skillTriggers.push('Multiple regenerations - suggest premium tier');
      }
      
      // Time saved trigger
      if (pricing.usageMetrics.timeSaved > 20) {
        skillTriggers.push('Significant time saved - highlight ROI');
      }
      
      // Approval rate trigger
      if (pricing.usageMetrics.approvalRate > 0.9) {
        skillTriggers.push('High approval rate - emphasize value');
      }
      
      if (skillTriggers.length > 0) {
        triggers[skillId] = skillTriggers;
      }
    });
    
    return triggers;
  }
  
  /**
   * Calculate revenue projections
   */
  calculateRevenueProjection(months: number = 12): any {
    let totalRevenue = 0;
    const skillRevenue: Record<string, number> = {};
    
    this.skillMetrics.forEach((pricing, skillId) => {
      const monthlyRevenue = pricing.currentPrice * pricing.usageMetrics.frequency;
      skillRevenue[skillId] = monthlyRevenue;
      totalRevenue += monthlyRevenue;
    });
    
    return {
      monthly: totalRevenue,
      projected: totalRevenue * months,
      skillBreakdown: skillRevenue,
      growthRate: this.calculateGrowthRate()
    };
  }
  
  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(): number {
    // Simple growth calculation based on usage trends
    let totalGrowth = 0;
    let skillCount = 0;
    
    this.skillMetrics.forEach((pricing) => {
      // Growth based on frequency and approval rate
      const growth = (pricing.usageMetrics.frequency * pricing.usageMetrics.approvalRate) / 100;
      totalGrowth += growth;
      skillCount++;
    });
    
    return totalGrowth / skillCount;
  }
}

// Singleton instance
export const pricingOptimizer = new SkillPricingOptimizer();

export default {
  SkillPricingOptimizer,
  pricingOptimizer
};
