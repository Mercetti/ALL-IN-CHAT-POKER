/**
 * Model Cost Optimization
 * Routes tasks to appropriate LLM models based on complexity and cost
 */

export interface ModelConfig {
  name: string;
  provider: string;
  tier: 'cheap' | 'mid' | 'premium';
  costPer1kTokens: number;
  maxTokens: number;
  capabilities: string[];
  avgLatency: number;
}

export interface TaskRequirement {
  task: 'intent' | 'code_review' | 'audio_prompt' | 'final_response' | 'simulation';
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'speed' | 'quality' | 'balanced';
}

const MODEL_CONFIGS: ModelConfig[] = [
  // Cheap models for simple tasks
  {
    name: 'gpt-3.5-turbo',
    provider: 'openai',
    tier: 'cheap',
    costPer1kTokens: 0.002,
    maxTokens: 4096,
    capabilities: ['intent', 'simple_code', 'basic_generation'],
    avgLatency: 800
  },
  {
    name: 'claude-instant',
    provider: 'anthropic',
    tier: 'cheap',
    costPer1kTokens: 0.003,
    maxTokens: 4096,
    capabilities: ['intent', 'simple_code', 'basic_generation'],
    avgLatency: 600
  },
  
  // Mid-tier for complex tasks
  {
    name: 'gpt-4',
    provider: 'openai',
    tier: 'mid',
    costPer1kTokens: 0.03,
    maxTokens: 8192,
    capabilities: ['code_review', 'complex_generation', 'analysis'],
    avgLatency: 2000
  },
  {
    name: 'claude-sonnet',
    provider: 'anthropic',
    tier: 'mid',
    costPer1kTokens: 0.015,
    maxTokens: 4096,
    capabilities: ['code_review', 'complex_generation', 'analysis'],
    avgLatency: 1500
  },
  
  // Premium for final responses
  {
    name: 'gpt-4-turbo',
    provider: 'openai',
    tier: 'premium',
    costPer1kTokens: 0.01,
    maxTokens: 4096,
    capabilities: ['final_response', 'complex_reasoning', 'detailed_analysis'],
    avgLatency: 1200
  },
  {
    name: 'claude-opus',
    provider: 'anthropic',
    tier: 'premium',
    costPer1kTokens: 0.075,
    maxTokens: 4096,
    capabilities: ['final_response', 'complex_reasoning', 'detailed_analysis'],
    avgLatency: 3000
  }
];

export class ModelOptimizer {
  private usageStats: Map<string, { uses: number; totalCost: number; avgLatency: number }> = new Map();
  
  /**
   * Select optimal model for task
   */
  selectModel(requirement: TaskRequirement): ModelConfig {
    const candidates = MODEL_CONFIGS.filter(model => 
      model.capabilities.includes(requirement.task) &&
      this.meetsComplexity(model, requirement.complexity)
    );
    
    // Sort by cost-effectiveness based on priority
    const sorted = candidates.sort((a, b) => {
      const scoreA = this.calculateScore(a, requirement);
      const scoreB = this.calculateScore(b, requirement);
      return scoreB - scoreA; // Higher score first
    });
    
    const selected = sorted[0];
    if (!selected) {
      throw new Error(`No suitable model found for task: ${requirement.task}`);
    }
    
    console.log(`🤖 Selected model: ${selected.name} (${selected.tier}) for ${requirement.task}`);
    return selected;
  }
  
  /**
   * Calculate model score based on requirements
   */
  private calculateScore(model: ModelConfig, requirement: TaskRequirement): number {
    let score = 0;
    
    // Cost factor (inverse - lower cost = higher score)
    const costScore = (1 / model.costPer1kTokens) * 100;
    score += requirement.priority === 'speed' ? costScore * 2 : costScore;
    
    // Latency factor
    const latencyScore = (1 / model.avgLatency) * 1000;
    score += requirement.priority === 'speed' ? latencyScore * 2 : latencyScore;
    
    // Capability match
    score += model.capabilities.includes(requirement.task) ? 100 : 0;
    
    // Complexity match
    if (requirement.complexity === 'simple' && model.tier === 'cheap') score += 50;
    if (requirement.complexity === 'medium' && model.tier === 'mid') score += 50;
    if (requirement.complexity === 'complex' && model.tier === 'premium') score += 50;
    
    return score;
  }
  
  /**
   * Check if model meets complexity requirements
   */
  private meetsComplexity(model: ModelConfig, complexity: string): boolean {
    const complexityMap = {
      'simple': ['cheap', 'mid', 'premium'],
      'medium': ['mid', 'premium'],
      'complex': ['premium']
    };
    
    return complexityMap[complexity as keyof typeof complexityMap]?.includes(model.tier) || false;
  }
  
  /**
   * Track model usage for optimization
   */
  trackUsage(modelName: string, tokensUsed: number, actualLatency: number): void {
    const model = MODEL_CONFIGS.find(m => m.name === modelName);
    if (!model) return;
    
    const cost = (tokensUsed / 1000) * model.costPer1kTokens;
    const current = this.usageStats.get(modelName) || { uses: 0, totalCost: 0, avgLatency: 0 };
    
    const newUses = current.uses + 1;
    const newTotalCost = current.totalCost + cost;
    const newAvgLatency = (current.avgLatency * current.uses + actualLatency) / newUses;
    
    this.usageStats.set(modelName, {
      uses: newUses,
      totalCost: newTotalCost,
      avgLatency: newAvgLatency
    });
    
    console.log(`💰 Model usage: ${modelName} - Cost: $${cost.toFixed(4)}, Latency: ${actualLatency}ms`);
  }
  
  /**
   * Get cost optimization metrics
   */
  getOptimizationMetrics(): any {
    const totalCost = Array.from(this.usageStats.values())
      .reduce((sum, stats) => sum + stats.totalCost, 0);
    
    const totalUses = Array.from(this.usageStats.values())
      .reduce((sum, stats) => sum + stats.uses, 0);
    
    const avgLatency = Array.from(this.usageStats.values())
      .reduce((sum, stats) => sum + stats.avgLatency, 0) / this.usageStats.size;
    
    const tierDistribution = {
      cheap: 0,
      mid: 0,
      premium: 0
    };
    
    MODEL_CONFIGS.forEach(model => {
      const stats = this.usageStats.get(model.name);
      if (stats) {
        tierDistribution[model.tier] += stats.uses;
      }
    });
    
    return {
      totalCost,
      totalUses,
      avgLatency,
      tierDistribution,
      costPerUse: totalCost / totalUses,
      potentialSavings: this.calculatePotentialSavings()
    };
  }
  
  /**
   * Calculate potential cost savings
   */
  private calculatePotentialSavings(): number {
    // If we used premium for everything, what would it cost?
    const premiumOnlyCost = Array.from(this.usageStats.values())
      .reduce((sum, stats) => {
        const premiumModel = MODEL_CONFIGS.find(m => m.tier === 'premium');
        return sum + (stats.uses * (premiumModel?.costPer1kTokens || 0));
      }, 0);
    
    const actualCost = Array.from(this.usageStats.values())
      .reduce((sum, stats) => sum + stats.totalCost, 0);
    
    return premiumOnlyCost - actualCost;
  }
  
  /**
   * Get recommended model adjustments
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getOptimizationMetrics();
    
    // Check if overusing premium models
    const premiumRatio = metrics.tierDistribution.premium / metrics.totalUses;
    if (premiumRatio > 0.3) {
      recommendations.push('Consider using mid-tier models for non-critical tasks to reduce costs');
    }
    
    // Check latency issues
    if (metrics.avgLatency > 2000) {
      recommendations.push('High latency detected - consider faster models for time-sensitive tasks');
    }
    
    // Check cost per use
    if (metrics.costPerUse > 0.05) {
      recommendations.push('High cost per use - review model selection strategy');
    }
    
    return recommendations;
  }
}

// Singleton instance
export const modelOptimizer = new ModelOptimizer();

// Convenience function for task routing
export function selectOptimalModel(
  task: TaskRequirement['task'],
  complexity: TaskRequirement['complexity'] = 'medium',
  priority: TaskRequirement['priority'] = 'balanced'
): ModelConfig {
  return modelOptimizer.selectModel({ task, complexity, priority });
}

export default {
  ModelOptimizer,
  modelOptimizer,
  selectOptimalModel,
  MODEL_CONFIGS
};
