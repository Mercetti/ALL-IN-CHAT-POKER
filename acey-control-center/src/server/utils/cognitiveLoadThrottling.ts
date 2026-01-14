// File: src/server/utils/cognitiveLoadThrottling.ts

/**
 * Cognitive Load Throttling
 * Acey regulates how hard she thinks to prevent over-reasoning and resource waste
 */

export type CognitiveLoad = {
  activeAgents: number;
  debateDepth: number;
  modelCalls: number;
  latencyMs: number;
  memoryUsage: number;
  computeCost: number;
  timestamp: number;
};

export type ThrottleMode = "minimal" | "standard" | "deep" | "swarm";

export type ThrottleConfig = {
  mode: ThrottleMode;
  maxLatencyMs: number;
  maxModelCalls: number;
  maxMemoryUsage: number;
  maxComputeCost: number;
  autoThrottle: boolean;
  escalationThresholds: {
    confidence: number;
    safety: number;
    complexity: number;
  };
};

export type LoadMetrics = {
  currentLoad: CognitiveLoad;
  avgLoad: CognitiveLoad;
  peakLoad: CognitiveLoad;
  loadHistory: CognitiveLoad[];
  throttleHistory: Array<{
    timestamp: number;
    fromMode: ThrottleMode;
    toMode: ThrottleMode;
    reason: string;
    load: CognitiveLoad;
  }>;
};

/**
 * Cognitive Load Throttler
 */
export class CognitiveLoadThrottler {
  private config: ThrottleConfig;
  private currentLoad: CognitiveLoad;
  private loadHistory: CognitiveLoad[];
  private throttleHistory: LoadMetrics["throttleHistory"];
  private loadMetrics: LoadMetrics;
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ThrottleConfig>) {
    this.config = {
      mode: "standard",
      maxLatencyMs: 2000,
      maxModelCalls: 10,
      maxMemoryUsage: 512, // MB
      maxComputeCost: 100, // credits
      autoThrottle: true,
      escalationThresholds: {
        confidence: 0.7,
        safety: 0.8,
        complexity: 0.6
      },
      ...config
    };

    this.currentLoad = {
      activeAgents: 0,
      debateDepth: 0,
      modelCalls: 0,
      latencyMs: 0,
      memoryUsage: 0,
      computeCost: 0,
      timestamp: Date.now()
    };

    this.loadHistory = [];
    this.throttleHistory = [];
    this.loadMetrics = {
      currentLoad: { ...this.currentLoad },
      avgLoad: { ...this.currentLoad },
      peakLoad: { ...this.currentLoad },
      loadHistory: [],
      throttleHistory: []
    };

    this.startMonitoring();
  }

  /**
   * Start cognitive load monitoring
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updateLoadMetrics();
      this.checkAutoThrottle();
    }, 1000); // Monitor every second
  }

  /**
   * Record cognitive activity
   */
  public recordActivity(activity: Partial<CognitiveLoad>): void {
    this.currentLoad = {
      ...this.currentLoad,
      ...activity,
      timestamp: Date.now()
    };

    // Add to history
    this.loadHistory.push({ ...this.currentLoad });
    
    // Keep only last 1000 entries
    if (this.loadHistory.length > 1000) {
      this.loadHistory.shift();
    }

    // Check if throttling is needed
    if (this.config.autoThrottle) {
      this.checkThrottleNeed();
    }
  }

  /**
   * Check if throttling is needed
   */
  private checkThrottleNeed(): void {
    const needsThrottle = 
      this.currentLoad.latencyMs > this.config.maxLatencyMs ||
      this.currentLoad.modelCalls > this.config.maxModelCalls ||
      this.currentLoad.memoryUsage > this.config.maxMemoryUsage ||
      this.currentLoad.computeCost > this.config.maxComputeCost;

    if (needsThrottle) {
      this.downgradeThrottle("Resource limits exceeded");
    }
  }

  /**
   * Check auto-throttle based on patterns
   */
  private checkAutoThrottle(): void {
    if (!this.config.autoThrottle) return;

    // Analyze recent load patterns
    const recentLoads = this.loadHistory.slice(-10); // Last 10 seconds
    if (recentLoads.length < 5) return;

    const avgLatency = recentLoads.reduce((sum, load) => sum + load.latencyMs, 0) / recentLoads.length;
    const avgModelCalls = recentLoads.reduce((sum, load) => sum + load.modelCalls, 0) / recentLoads.length;

    // Escalate if load is consistently low
    if (avgLatency < this.config.maxLatencyMs * 0.5 && avgModelCalls < this.config.maxModelCalls * 0.5) {
      this.escalateThrottle("Low resource utilization");
    }
    // Downgrade if load is consistently high
    else if (avgLatency > this.config.maxLatencyMs * 0.8 || avgModelCalls > this.config.maxModelCalls * 0.8) {
      this.downgradeThrottle("High resource utilization");
    }
  }

  /**
   * Get appropriate throttle mode for task
   */
  public getThrottleModeForTask(
    taskType: string,
    confidence: number,
    safetyLevel: number,
    complexity: number
  ): ThrottleMode {
    // If auto-throttle is disabled, return current mode
    if (!this.config.autoThrottle) {
      return this.config.mode;
    }

    // Determine mode based on task characteristics
    if (safetyLevel > this.config.escalationThresholds.safety) {
      return "swarm"; // Safety critical - use maximum cognitive resources
    }

    if (confidence < this.config.escalationThresholds.confidence) {
      return "deep"; // Low confidence - need deeper reasoning
    }

    if (complexity > this.config.escalationThresholds.complexity) {
      return "deep"; // High complexity - need deeper reasoning
    }

    // Check current load
    if (this.currentLoad.latencyMs > this.config.maxLatencyMs * 0.7) {
      return "minimal"; // High latency - use minimal cognitive effort
    }

    if (this.currentLoad.modelCalls > this.config.maxModelCalls * 0.7) {
      return "standard"; // High model usage - use standard effort
    }

    return this.config.mode; // Use current mode
  }

  /**
   * Apply throttle mode to task execution
   */
  public applyThrottleMode(mode: ThrottleMode): {
    maxAgents: number;
    maxDebateDepth: number;
    maxModelCalls: number;
    timeoutMs: number;
    enableFullFeatures: boolean;
  } {
    const modeConfigs = {
      minimal: {
        maxAgents: 1,
        maxDebateDepth: 1,
        maxModelCalls: 1,
        timeoutMs: 5000,
        enableFullFeatures: false
      },
      standard: {
        maxAgents: 3,
        maxDebateDepth: 2,
        maxModelCalls: 3,
        timeoutMs: 15000,
        enableFullFeatures: true
      },
      deep: {
        maxAgents: 5,
        maxDebateDepth: 4,
        maxModelCalls: 7,
        timeoutMs: 30000,
        enableFullFeatures: true
      },
      swarm: {
        maxAgents: 10,
        maxDebateDepth: 6,
        maxModelCalls: 15,
        timeoutMs: 60000,
        enableFullFeatures: true
      }
    };

    return modeConfigs[mode];
  }

  /**
   * Upgrade throttle mode (increase cognitive effort)
   */
  public escalateThrottle(reason: string): boolean {
    const modeHierarchy: ThrottleMode[] = ["minimal", "standard", "deep", "swarm"];
    const currentIndex = modeHierarchy.indexOf(this.config.mode);
    
    if (currentIndex < modeHierarchy.length - 1) {
      const fromMode = this.config.mode;
      this.config.mode = modeHierarchy[currentIndex + 1];
      
      this.recordThrottleChange(fromMode, this.config.mode, reason);
      console.log(`[CognitiveLoad] Escalated throttle mode: ${fromMode} → ${this.config.mode} (${reason})`);
      
      return true;
    }

    return false;
  }

  /**
   * Downgrade throttle mode (decrease cognitive effort)
   */
  public downgradeThrottle(reason: string): boolean {
    const modeHierarchy: ThrottleMode[] = ["minimal", "standard", "deep", "swarm"];
    const currentIndex = modeHierarchy.indexOf(this.config.mode);
    
    if (currentIndex > 0) {
      const fromMode = this.config.mode;
      this.config.mode = modeHierarchy[currentIndex - 1];
      
      this.recordThrottleChange(fromMode, this.config.mode, reason);
      console.log(`[CognitiveLoad] Downgraded throttle mode: ${fromMode} → ${this.config.mode} (${reason})`);
      
      return true;
    }

    return false;
  }

  /**
   * Set throttle mode manually
   */
  public setThrottleMode(mode: ThrottleMode, reason: string = "Manual override"): void {
    const fromMode = this.config.mode;
    this.config.mode = mode;
    
    this.recordThrottleChange(fromMode, mode, reason);
    console.log(`[CognitiveLoad] Set throttle mode: ${fromMode} → ${mode} (${reason})`);
  }

  /**
   * Record throttle change
   */
  private recordThrottleChange(fromMode: ThrottleMode, toMode: ThrottleMode, reason: string): void {
    const change = {
      timestamp: Date.now(),
      fromMode,
      toMode,
      reason,
      load: { ...this.currentLoad }
    };

    this.throttleHistory.push(change);
    
    // Keep only last 100 changes
    if (this.throttleHistory.length > 100) {
      this.throttleHistory.shift();
    }
  }

  /**
   * Update load metrics
   */
  private updateLoadMetrics(): void {
    this.loadMetrics.currentLoad = { ...this.currentLoad };
    
    if (this.loadHistory.length > 0) {
      // Calculate average load
      const totalLoads = this.loadHistory.length;
      const avgLoad: CognitiveLoad = {
        activeAgents: 0,
        debateDepth: 0,
        modelCalls: 0,
        latencyMs: 0,
        memoryUsage: 0,
        computeCost: 0,
        timestamp: Date.now()
      };

      for (const load of this.loadHistory) {
        avgLoad.activeAgents += load.activeAgents;
        avgLoad.debateDepth += load.debateDepth;
        avgLoad.modelCalls += load.modelCalls;
        avgLoad.latencyMs += load.latencyMs;
        avgLoad.memoryUsage += load.memoryUsage;
        avgLoad.computeCost += load.computeCost;
      }

      avgLoad.activeAgents /= totalLoads;
      avgLoad.debateDepth /= totalLoads;
      avgLoad.modelCalls /= totalLoads;
      avgLoad.latencyMs /= totalLoads;
      avgLoad.memoryUsage /= totalLoads;
      avgLoad.computeCost /= totalLoads;

      this.loadMetrics.avgLoad = avgLoad;

      // Calculate peak load
      this.loadMetrics.peakLoad = this.loadHistory.reduce((peak, load) => {
        return {
          activeAgents: Math.max(peak.activeAgents, load.activeAgents),
          debateDepth: Math.max(peak.debateDepth, load.debateDepth),
          modelCalls: Math.max(peak.modelCalls, load.modelCalls),
          latencyMs: Math.max(peak.latencyMs, load.latencyMs),
          memoryUsage: Math.max(peak.memoryUsage, load.memoryUsage),
          computeCost: Math.max(peak.computeCost, load.computeCost),
          timestamp: load.timestamp
        };
      }, { ...avgLoad });
    }

    this.loadMetrics.loadHistory = [...this.loadHistory];
    this.loadMetrics.throttleHistory = [...this.throttleHistory];
  }

  /**
   * Get current cognitive load
   */
  public getCurrentLoad(): CognitiveLoad {
    return { ...this.currentLoad };
  }

  /**
   * Get load metrics
   */
  public getLoadMetrics(): LoadMetrics {
    this.updateLoadMetrics();
    return { ...this.loadMetrics };
  }

  /**
   * Get throttle history
   */
  public getThrottleHistory(limit: number = 50): LoadMetrics["throttleHistory"] {
    return this.throttleHistory.slice(-limit);
  }

  /**
   * Check if system is under load
   */
  public isUnderLoad(): boolean {
    return (
      this.currentLoad.latencyMs > this.config.maxLatencyMs * 0.8 ||
      this.currentLoad.modelCalls > this.config.maxModelCalls * 0.8 ||
      this.currentLoad.memoryUsage > this.config.maxMemoryUsage * 0.8 ||
      this.currentLoad.computeCost > this.config.maxComputeCost * 0.8
    );
  }

  /**
   * Check if system is overloaded
   */
  public isOverloaded(): boolean {
    return (
      this.currentLoad.latencyMs > this.config.maxLatencyMs ||
      this.currentLoad.modelCalls > this.config.maxModelCalls ||
      this.currentLoad.memoryUsage > this.config.maxMemoryUsage ||
      this.currentLoad.computeCost > this.config.maxComputeCost
    );
  }

  /**
   * Get resource utilization percentages
   */
  public getResourceUtilization(): {
    latency: number;
    modelCalls: number;
    memory: number;
    compute: number;
    overall: number;
  } {
    const latency = (this.currentLoad.latencyMs / this.config.maxLatencyMs) * 100;
    const modelCalls = (this.currentLoad.modelCalls / this.config.maxModelCalls) * 100;
    const memory = (this.currentLoad.memoryUsage / this.config.maxMemoryUsage) * 100;
    const compute = (this.currentLoad.computeCost / this.config.maxComputeCost) * 100;
    const overall = (latency + modelCalls + memory + compute) / 4;

    return {
      latency: Math.min(100, latency),
      modelCalls: Math.min(100, modelCalls),
      memory: Math.min(100, memory),
      compute: Math.min(100, compute),
      overall: Math.min(100, overall)
    };
  }

  /**
   * Reset current load
   */
  public resetLoad(): void {
    this.currentLoad = {
      activeAgents: 0,
      debateDepth: 0,
      modelCalls: 0,
      latencyMs: 0,
      memoryUsage: 0,
      computeCost: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.loadHistory = [];
    this.throttleHistory = [];
    this.resetLoad();
    this.loadMetrics = {
      currentLoad: { ...this.currentLoad },
      avgLoad: { ...this.currentLoad },
      peakLoad: { ...this.currentLoad },
      loadHistory: [],
      throttleHistory: []
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.clearAll();
  }
}

// LLM Rule Integration
export const COGNITIVE_LOAD_THROTTLING_RULES = {
  MINIMUM_EFFORT: 'Apply the minimum cognitive effort required',
  ESCALATE_REASONING: 'Escalate reasoning depth only when confidence or safety demands it',
  PREVENT_OVERLOAD: [
    'Over-reasoning',
    'Latency spikes',
    'Model burnout',
    'Cost blowups'
  ],
  AUTO_THROTTLE_RULE: 'if (latency > threshold || modelCalls > budget) { downgradeThrottle(); }',
  TASK_SPECIFIC_MODES: {
    CASUAL_CHAT: 'Casual chat → minimal',
    POKER_EDGE_CASE: 'Poker edge case → deep',
    SYSTEM_CHANGE: 'System change → swarm'
  },
  RESOURCE_CONSERVATION: 'Conserve cognitive resources'
};
