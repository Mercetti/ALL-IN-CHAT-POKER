/**
 * Cognitive Load Throttling
 * Adapts intelligence level based on system resources
 */

export interface ThrottlingRule {
  condition: string;
  threshold: number;
  action: 'simplify-prompts' | 'disable-memory-recall' | 'postpone-generation' | 'batch-learning';
  parameters?: any;
}

export interface CognitiveState {
  currentLevel: 'minimal' | 'normal' | 'enhanced' | 'maximum';
  resourcePressure: number; // 0-100
  responseComplexity: 'simple' | 'standard' | 'detailed' | 'comprehensive';
  activeThrottling: ThrottlingRule[];
  lastAdjustment: string;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  gpu: number;
  disk: number;
  network: number;
  overallPressure: number;
}

export class CognitiveThrottling {
  private currentState: CognitiveState;
  private throttlingRules: ThrottlingRule[] = [];
  private resourceHistory: Array<{timestamp: string, metrics: ResourceMetrics}> = [];
  private performanceBaseline: ResourceMetrics;

  constructor() {
    this.performanceBaseline = {
      cpu: 50,
      memory: 60,
      gpu: 30,
      disk: 40,
      network: 20,
      overallPressure: 40
    };

    this.currentState = {
      currentLevel: 'normal',
      resourcePressure: 40,
      responseComplexity: 'standard',
      activeThrottling: [],
      lastAdjustment: new Date().toISOString()
    };

    this.initializeThrottlingRules();
    this.loadHistoricalData();
  }

  // Initialize throttling rules
  private initializeThrottlingRules(): void {
    this.throttlingRules = [
      {
        condition: 'high_cpu',
        threshold: 80,
        action: 'simplify-prompts',
        parameters: {
          maxTokens: 500,
          disableChainOfThought: true
        }
      },
      {
        condition: 'low_memory',
        threshold: 85,
        action: 'disable-memory-recall',
        parameters: {
          memoryWindow: 'immediate-only'
        }
      },
      {
        condition: 'gpu_busy',
        threshold: 90,
        action: 'postpone-generation',
        parameters: {
          postponeTime: 300000, // 5 minutes
          queueForLater: true
        }
      },
      {
        condition: 'idle_system',
        threshold: 20,
        action: 'batch-learning',
        parameters: {
          batchSize: 10,
          enableBackgroundLearning: true
        }
      },
      {
        condition: 'extreme_load',
        threshold: 95,
        action: 'simplify-prompts',
        parameters: {
          maxTokens: 200,
          disableContext: true,
          emergencyMode: true
        }
      }
    ];
  }

  // Update cognitive state based on current resources
  async updateCognitiveState(resourceMetrics: ResourceMetrics): Promise<CognitiveState> {
    console.log(`CognitiveThrottling: Updating state - CPU: ${resourceMetrics.cpu}%, Memory: ${resourceMetrics.memory}%`);

    // Store resource history
    this.resourceHistory.push({
      timestamp: new Date().toISOString(),
      metrics: { ...resourceMetrics }
    });

    // Keep only last 100 entries
    if (this.resourceHistory.length > 100) {
      this.resourceHistory = this.resourceHistory.slice(-100);
    }

    // Calculate resource pressure
    const resourcePressure = this.calculateResourcePressure(resourceMetrics);
    
    // Apply throttling rules
    const activeThrottling = this.applyThrottlingRules(resourceMetrics);
    
    // Determine cognitive level
    const cognitiveLevel = this.determineCognitiveLevel(resourcePressure);
    const responseComplexity = this.determineResponseComplexity(cognitiveLevel, activeThrottling);

    // Update current state
    this.currentState = {
      currentLevel: cognitiveLevel,
      resourcePressure,
      responseComplexity,
      activeThrottling,
      lastAdjustment: new Date().toISOString()
    };

    console.log(`CognitiveThrottling: New state - Level: ${cognitiveLevel}, Pressure: ${resourcePressure}%, Complexity: ${responseComplexity}`);
    
    return this.currentState;
  }

  // Calculate overall resource pressure
  private calculateResourcePressure(metrics: ResourceMetrics): number {
    // Weighted calculation based on importance
    const weights = {
      cpu: 0.3,
      memory: 0.3,
      gpu: 0.2,
      disk: 0.1,
      network: 0.1
    };

    const pressure = 
      (metrics.cpu * weights.cpu) +
      (metrics.memory * weights.memory) +
      (metrics.gpu * weights.gpu) +
      (metrics.disk * weights.disk) +
      (metrics.network * weights.network);

    return Math.min(100, Math.max(0, pressure));
  }

  // Apply throttling rules
  private applyThrottlingRules(metrics: ResourceMetrics): ThrottlingRule[] {
    const activeRules: ThrottlingRule[] = [];

    for (const rule of this.throttlingRules) {
      if (this.evaluateRule(rule, metrics)) {
        activeRules.push(rule);
        console.log(`CognitiveThrottling: Activated rule ${rule.condition} - ${rule.action}`);
      }
    }

    return activeRules;
  }

  // Evaluate individual throttling rule
  private evaluateRule(rule: ThrottlingRule, metrics: ResourceMetrics): boolean {
    switch (rule.condition) {
      case 'high_cpu':
        return metrics.cpu >= rule.threshold;
      case 'low_memory':
        return metrics.memory >= rule.threshold;
      case 'gpu_busy':
        return metrics.gpu >= rule.threshold;
      case 'idle_system':
        return metrics.overallPressure <= rule.threshold;
      case 'extreme_load':
        return metrics.overallPressure >= rule.threshold;
      default:
        return false;
    }
  }

  // Determine cognitive level based on resource pressure
  private determineCognitiveLevel(pressure: number): 'minimal' | 'normal' | 'enhanced' | 'maximum' {
    if (pressure >= 90) return 'minimal';
    if (pressure >= 70) return 'normal';
    if (pressure >= 40) return 'enhanced';
    return 'maximum';
  }

  // Determine response complexity
  private determineResponseComplexity(
    level: 'minimal' | 'normal' | 'enhanced' | 'maximum',
    activeThrottling: ThrottlingRule[]
  ): 'simple' | 'standard' | 'detailed' | 'comprehensive' {
    // Check for specific throttling actions that override complexity
    const simplifyRule = activeThrottling.find(r => r.action === 'simplify-prompts');
    if (simplifyRule) {
      return simplifyRule.parameters?.emergencyMode ? 'simple' : 'standard';
    }

    // Base complexity on cognitive level
    switch (level) {
      case 'minimal': return 'simple';
      case 'normal': return 'standard';
      case 'enhanced': return 'detailed';
      case 'maximum': return 'comprehensive';
      default: return 'standard';
    }
  }

  // Get throttled prompt configuration
  getThrottledPromptConfig(): {
    maxTokens: number;
    enableChainOfThought: boolean;
    useContext: boolean;
    enableMemory: boolean;
    complexity: 'simple' | 'standard' | 'detailed' | 'comprehensive';
  } {
    const config = {
      maxTokens: 2000,
      enableChainOfThought: true,
      useContext: true,
      enableMemory: true,
      complexity: this.currentState.responseComplexity
    };

    // Apply active throttling rules
    for (const rule of this.currentState.activeThrottling) {
      switch (rule.action) {
        case 'simplify-prompts':
          if (rule.parameters?.maxTokens) {
            config.maxTokens = rule.parameters.maxTokens;
          }
          if (rule.parameters?.disableChainOfThought) {
            config.enableChainOfThought = false;
          }
          if (rule.parameters?.disableContext) {
            config.useContext = false;
          }
          break;
        case 'disable-memory-recall':
          if (rule.parameters?.memoryWindow === 'immediate-only') {
            config.enableMemory = false;
          }
          break;
      }
    }

    return config;
  }

  // Check if generation should be postponed
  shouldPostponeGeneration(): {
    shouldPostpone: boolean;
    postponeTime?: number;
    queueForLater?: boolean;
  } {
    const postponeRule = this.currentState.activeThrottling.find(r => r.action === 'postpone-generation');
    
    if (postponeRule) {
      return {
        shouldPostpone: true,
        postponeTime: postponeRule.parameters?.postponeTime,
        queueForLater: postponeRule.parameters?.queueForLater
      };
    }

    return { shouldPostpone: false };
  }

  // Check if learning should be batched
  shouldBatchLearning(): {
    shouldBatch: boolean;
    batchSize?: number;
    enableBackground?: boolean;
  } {
    const batchRule = this.currentState.activeThrottling.find(r => r.action === 'batch-learning');
    
    if (batchRule) {
      return {
        shouldBatch: true,
        batchSize: batchRule.parameters?.batchSize,
        enableBackground: batchRule.parameters?.enableBackgroundLearning
      };
    }

    return { shouldBatch: false };
  }

  // Get current cognitive state
  getCurrentState(): CognitiveState {
    return { ...this.currentState };
  }

  // Get resource history
  getResourceHistory(count?: number): Array<{timestamp: string, metrics: ResourceMetrics}> {
    const history = [...this.resourceHistory].reverse();
    return count ? history.slice(0, count) : history;
  }

  // Get throttling statistics
  getThrottlingStats(): any {
    const ruleUsage = new Map<string, number>();
    
    for (const entry of this.resourceHistory) {
      const activeRules = this.applyThrottlingRules(entry.metrics);
      for (const rule of activeRules) {
        const count = ruleUsage.get(rule.condition) || 0;
        ruleUsage.set(rule.condition, count + 1);
      }
    }

    return {
      currentLevel: this.currentState.currentLevel,
      resourcePressure: this.currentState.resourcePressure,
      responseComplexity: this.currentState.responseComplexity,
      activeThrottlingCount: this.currentState.activeThrottling.length,
      activeRules: this.currentState.activeThrottling.map(r => r.condition),
      ruleUsage: Object.fromEntries(ruleUsage),
      averageResourcePressure: this.calculateAverageResourcePressure(),
      lastAdjustment: this.currentState.lastAdjustment
    };
  }

  // Calculate average resource pressure
  private calculateAverageResourcePressure(): number {
    if (this.resourceHistory.length === 0) return 0;
    
    const totalPressure = this.resourceHistory.reduce((sum, entry) => 
      sum + entry.metrics.overallPressure, 0
    );
    
    return totalPressure / this.resourceHistory.length;
  }

  // Load historical data
  private loadHistoricalData(): void {
    // In real implementation, would load from file or database
    console.log('CognitiveThrottling: Loaded historical data');
  }

  // Save current state
  saveCurrentState(): void {
    // In real implementation, would save to file or database
    console.log(`CognitiveThrottling: Saved state - Level: ${this.currentState.currentLevel}`);
  }

  // Reset to baseline
  resetToBaseline(): void {
    console.log('CognitiveThrottling: Resetting to baseline state');
    this.currentState = {
      currentLevel: 'normal',
      resourcePressure: this.performanceBaseline.overallPressure,
      responseComplexity: 'standard',
      activeThrottling: [],
      lastAdjustment: new Date().toISOString()
    };
  }

  // Get performance recommendations
  getPerformanceRecommendations(): Array<{
    type: 'optimization' | 'upgrade' | 'configuration';
    priority: 'high' | 'medium' | 'low';
    description: string;
  }> {
    const recommendations = [];
    const avgPressure = this.calculateAverageResourcePressure();

    if (avgPressure > 80) {
      recommendations.push({
        type: 'upgrade' as const,
        priority: 'high' as const,
        description: 'Consistently high resource pressure - consider hardware upgrades'
      });
    }

    const highCpuUsage = this.resourceHistory.filter(h => h.metrics.cpu > 80).length;
    if (highCpuUsage > this.resourceHistory.length * 0.5) {
      recommendations.push({
        type: 'optimization' as const,
        priority: 'medium' as const,
        description: 'Frequent high CPU usage - review background processes'
      });
    }

    const lowMemoryEvents = this.resourceHistory.filter(h => h.metrics.memory > 90).length;
    if (lowMemoryEvents > 0) {
      recommendations.push({
        type: 'configuration' as const,
        priority: 'medium' as const,
        description: 'Memory pressure detected - consider increasing memory limits'
      });
    }

    return recommendations;
  }
}
