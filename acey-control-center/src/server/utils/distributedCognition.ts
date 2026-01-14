// File: src/server/utils/distributedCognition.ts

/**
 * Distributed Cognition Integration
 * Connects all 4 distributed intelligence systems with governance
 */

import { MultiAceySwarmManager, SwarmTask, SwarmConsensus } from "./multiAceySwarm";
import { CrossModelConsensusManager, ConsensusResult } from "./crossModelConsensus";
import { SkillMarketplaceManager, SkillAsset } from "./skillMarketplace";
import { CognitiveLoadThrottler, ThrottleMode, CognitiveLoad } from "./cognitiveLoadThrottling";

export type DistributedTask = {
  taskId: string;
  prompt: string;
  context: any;
  priority: "low" | "medium" | "high" | "critical";
  complexity: number; // 0-1
  safetyLevel: number; // 0-1
  confidence: number; // 0-1
  requiredSkills?: string[];
  preferredMode?: "individual" | "swarm" | "consensus" | "hybrid";
  timeoutMs: number;
};

export type DistributedResult = {
  taskId: string;
  success: boolean;
  output: string;
  confidence: number;
  processingTime: number;
  mode: "individual" | "swarm" | "consensus" | "hybrid";
  throttleMode: ThrottleMode;
  cognitiveLoad: CognitiveLoad;
  skillsUsed: SkillAsset[];
  swarmResult?: SwarmConsensus;
  consensusResult?: ConsensusResult;
  reasoning: string;
  cost: {
    compute: number;
    memory: number;
    latency: number;
    modelCalls: number;
  };
};

export type DistributedConfig = {
  enableSwarm: boolean;
  enableConsensus: boolean;
  enableSkillMarketplace: boolean;
  enableLoadThrottling: boolean;
  defaultMode: "individual" | "swarm" | "consensus" | "hybrid";
  autoModeSelection: boolean;
  costLimits: {
    maxCompute: number;
    maxMemory: number;
    maxLatency: number;
    maxModelCalls: number;
  };
};

export type DistributedMetrics = {
  totalTasks: number;
  successRate: number;
  avgProcessingTime: number;
  avgConfidence: number;
  modeDistribution: Record<string, number>;
  skillUsageRate: number;
  swarmUsageRate: number;
  consensusUsageRate: number;
  throttleEscalations: number;
  costEfficiency: number;
};

/**
 * Distributed Cognition Manager
 */
export class DistributedCognitionManager {
  private swarmManager: MultiAceySwarmManager;
  private consensusManager: CrossModelConsensusManager;
  private skillMarketplace: SkillMarketplaceManager;
  private loadThrottler: CognitiveLoadThrottler;
  private config: DistributedConfig;
  private taskHistory: DistributedResult[];
  private metrics: DistributedMetrics;

  constructor(config?: Partial<DistributedConfig>) {
    this.config = {
      enableSwarm: true,
      enableConsensus: true,
      enableSkillMarketplace: true,
      enableLoadThrottling: true,
      defaultMode: "hybrid",
      autoModeSelection: true,
      costLimits: {
        maxCompute: 1000,
        maxMemory: 1024,
        maxLatency: 10000,
        maxModelCalls: 50
      },
      ...config
    };

    // Initialize all distributed systems
    this.swarmManager = new MultiAceySwarmManager();
    this.consensusManager = new CrossModelConsensusManager();
    this.skillMarketplace = new SkillMarketplaceManager();
    this.loadThrottler = new CognitiveLoadThrottler();

    this.taskHistory = [];
    this.metrics = this.initializeMetrics();

    console.log("[DistributedCognition] Initialized distributed intelligence layer");
  }

  /**
   * Process task through distributed cognition
   */
  public async processTask(task: DistributedTask): Promise<DistributedResult> {
    const startTime = Date.now();
    console.log(`[DistributedCognition] Processing task ${task.taskId} with priority: ${task.priority}`);

    try {
      // Step 1: Determine processing mode and throttle level
      const { mode, throttleMode } = this.selectProcessingMode(task);
      
      // Step 2: Apply throttle configuration
      const throttleConfig = this.loadThrottler.applyThrottleMode(throttleMode);
      
      // Step 3: Record cognitive load start
      this.loadThrottler.recordActivity({
        activeAgents: throttleConfig.maxAgents,
        debateDepth: throttleConfig.maxDebateDepth,
        modelCalls: 0,
        latencyMs: 0,
        memoryUsage: 0,
        computeCost: 0
      });

      // Step 4: Execute based on mode
      let result: Partial<DistributedResult> = {
        taskId: task.taskId,
        mode,
        throttleMode,
        cognitiveLoad: this.loadThrottler.getCurrentLoad(),
        skillsUsed: [],
        reasoning: "",
        cost: { compute: 0, memory: 0, latency: 0, modelCalls: 0 }
      };

      switch (mode) {
        case "swarm":
          result = await this.processSwarmTask(task, result, throttleConfig);
          break;
        case "consensus":
          result = await this.processConsensusTask(task, result, throttleConfig);
          break;
        case "hybrid":
          result = await this.processHybridTask(task, result, throttleConfig);
          break;
        default:
          result = await this.processIndividualTask(task, result, throttleConfig);
      }

      // Step 5: Apply skills if enabled
      if (this.config.enableSkillMarketplace && task.requiredSkills) {
        result.skillsUsed = await this.applySkills(task.requiredSkills, task.context);
      }

      // Step 6: Finalize result
      const finalResult: DistributedResult = {
        taskId: task.taskId,
        ...result,
        success: true,
        output: result.output || "Task processed successfully",
        confidence: result.confidence || 0.5,
        processingTime: Date.now() - startTime,
        mode: result.mode || "individual",
        throttleMode: result.throttleMode || "minimal",
        cognitiveLoad: result.cognitiveLoad || this.loadThrottler.getCurrentLoad(),
        skillsUsed: result.skillsUsed || [],
        reasoning: result.reasoning || "",
        cost: this.calculateTaskCost(result, throttleConfig)
      };

      // Step 7: Update metrics and history
      this.updateMetrics(finalResult);
      this.taskHistory.push(finalResult);

      // Step 8: Record final cognitive load
      this.loadThrottler.recordActivity({
        modelCalls: result.cost?.modelCalls || 0,
        memoryUsage: result.cost?.memory || 0,
        computeCost: result.cost?.compute || 0
      });

      console.log(`[DistributedCognition] Task ${task.taskId} completed: ${mode} mode (${finalResult.processingTime}ms)`);
      
      return finalResult;

    } catch (error) {
      console.error(`[DistributedCognition] Task ${task.taskId} failed:`, error);
      
      return {
        taskId: task.taskId,
        success: false,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        processingTime: Date.now() - startTime,
        mode: this.config.defaultMode,
        throttleMode: "minimal",
        cognitiveLoad: this.loadThrottler.getCurrentLoad(),
        skillsUsed: [],
        reasoning: "Processing failed",
        cost: { compute: 0, memory: 0, latency: 0, modelCalls: 0 }
      };
    }
  }

  /**
   * Select optimal processing mode and throttle level
   */
  private selectProcessingMode(task: DistributedTask): { mode: DistributedResult["mode"]; throttleMode: ThrottleMode } {
    // Auto-select mode if enabled
    if (this.config.autoModeSelection) {
      let mode: DistributedResult["mode"] = this.config.defaultMode;
      
      // High priority or safety critical -> swarm
      if (task.priority === "critical" || task.safetyLevel > 0.8) {
        mode = "swarm";
      }
      // High complexity or low confidence -> consensus
      else if (task.complexity > 0.7 || task.confidence < 0.5) {
        mode = "consensus";
      }
      // Medium complexity -> hybrid
      else if (task.complexity > 0.4) {
        mode = "hybrid";
      }
      // Low complexity -> individual
      else {
        mode = "individual";
      }

      // Override with preferred mode if specified
      if (task.preferredMode) {
        mode = task.preferredMode;
      }

      const throttleMode = this.loadThrottler.getThrottleModeForTask(
        task.prompt,
        task.confidence,
        task.safetyLevel,
        task.complexity
      );

      return { mode, throttleMode };
    }

    return {
      mode: task.preferredMode || this.config.defaultMode,
      throttleMode: this.loadThrottler.getThrottleModeForTask(
        task.prompt,
        task.confidence,
        task.safetyLevel,
        task.complexity
      )
    };
  }

  /**
   * Process task with swarm intelligence
   */
  private async processSwarmTask(
    task: DistributedTask,
    result: Partial<DistributedResult>,
    throttleConfig: any
  ): Promise<Partial<DistributedResult>> {
    if (!this.config.enableSwarm) {
      return await this.processIndividualTask(task, result, throttleConfig);
    }

    const swarmTask: SwarmTask = {
      taskId: task.taskId,
      prompt: task.prompt,
      context: task.context,
      priority: task.priority,
      swarmMode: "all",
      timeoutMs: task.timeoutMs
    };

    const swarmConsensus = await this.swarmManager.executeSwarmTask(swarmTask);
    
    return {
      ...result,
      output: swarmConsensus.consensusOutput,
      confidence: swarmConsensus.consensusScore,
      swarmResult: swarmConsensus,
      reasoning: `Swarm consensus: ${swarmConsensus.consensusMethod} with ${swarmConsensus.responses.length} nodes`,
      cost: {
        compute: throttleConfig.maxAgents * 2,
        memory: throttleConfig.maxAgents * 64,
        latency: swarmConsensus.processingTime,
        modelCalls: swarmConsensus.responses.length
      }
    };
  }

  /**
   * Process task with cross-model consensus
   */
  private async processConsensusTask(
    task: DistributedTask,
    result: Partial<DistributedResult>,
    throttleConfig: any
  ): Promise<Partial<DistributedResult>> {
    if (!this.config.enableConsensus) {
      return await this.processIndividualTask(task, result, throttleConfig);
    }

    const consensusResult = await this.consensusManager.achieveConsensus(task.prompt, task.context);
    
    return {
      ...result,
      output: consensusResult.selectedOutput,
      confidence: consensusResult.agreementScore,
      consensusResult,
      reasoning: `Cross-model consensus: ${consensusResult.decision} with ${consensusResult.votingDetails.length} models`,
      cost: {
        compute: consensusResult.votingDetails.length * 3,
        memory: consensusResult.votingDetails.length * 32,
        latency: consensusResult.processingTime,
        modelCalls: consensusResult.votingDetails.length
      }
    };
  }

  /**
   * Process task with hybrid approach
   */
  private async processHybridTask(
    task: DistributedTask,
    result: Partial<DistributedResult>,
    throttleConfig: any
  ): Promise<Partial<DistributedResult>> {
    // Try consensus first, fall back to swarm if needed
    try {
      if (this.config.enableConsensus) {
        const consensusResult = await this.consensusManager.achieveConsensus(task.prompt, task.context);
        
        // If consensus is good, use it
        if (consensusResult.agreementScore > 0.6) {
          return {
            ...result,
            output: consensusResult.selectedOutput,
            confidence: consensusResult.agreementScore,
            consensusResult,
            reasoning: `Hybrid: Cross-model consensus (agreement: ${consensusResult.agreementScore.toFixed(2)})`,
            cost: {
              compute: consensusResult.votingDetails.length * 3,
              memory: consensusResult.votingDetails.length * 32,
              latency: consensusResult.processingTime,
              modelCalls: consensusResult.votingDetails.length
            }
          };
        }
      }
    } catch (error) {
      console.warn("[DistributedCognition] Consensus failed, falling back to swarm:", error);
    }

    // Fall back to swarm
    if (this.config.enableSwarm) {
      return await this.processSwarmTask(task, result, throttleConfig);
    }

    // Final fallback to individual
    return await this.processIndividualTask(task, result, throttleConfig);
  }

  /**
   * Process task individually
   */
  private async processIndividualTask(
    task: DistributedTask,
    result: Partial<DistributedResult>,
    throttleConfig: any
  ): Promise<Partial<DistributedResult>> {
    // Simulate individual processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const confidence = task.confidence * (0.8 + Math.random() * 0.2);
    const output = `Individual processing: ${task.prompt}. Confidence: ${confidence.toFixed(2)}.`;

    return {
      ...result,
      output,
      confidence,
      reasoning: "Individual processing with single model",
      cost: {
        compute: 1,
        memory: 32,
        latency: 1000 + Math.random() * 2000,
        modelCalls: 1
      }
    };
  }

  /**
   * Apply skills to task
   */
  private async applySkills(requiredSkills: string[], context: any): Promise<SkillAsset[]> {
    const skills: SkillAsset[] = [];
    
    for (const skillId of requiredSkills) {
      try {
        const skillResult = await this.skillMarketplace.executeSkill(skillId, context);
        if (skillResult.success) {
          const skill = this.skillMarketplace.getEnabledSkills().find(s => s.skillId === skillId);
          if (skill) {
            skills.push(skill);
          }
        }
      } catch (error) {
        console.warn(`[DistributedCognition] Skill ${skillId} execution failed:`, error);
      }
    }

    return skills;
  }

  /**
   * Calculate task cost
   */
  private calculateTaskCost(result: Partial<DistributedResult>, throttleConfig: any): DistributedResult["cost"] {
    return {
      compute: result.cost?.compute || 0,
      memory: result.cost?.memory || 0,
      latency: result.cost?.latency || 0,
      modelCalls: result.cost?.modelCalls || 0
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): DistributedMetrics {
    return {
      totalTasks: 0,
      successRate: 0,
      avgProcessingTime: 0,
      avgConfidence: 0,
      modeDistribution: {
        individual: 0,
        swarm: 0,
        consensus: 0,
        hybrid: 0
      },
      skillUsageRate: 0,
      swarmUsageRate: 0,
      consensusUsageRate: 0,
      throttleEscalations: 0,
      costEfficiency: 0
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(result: DistributedResult): void {
    this.metrics.totalTasks++;
    
    // Update success rate
    const successCount = this.taskHistory.filter(r => r.success).length;
    this.metrics.successRate = successCount / this.taskHistory.length;
    
    // Update averages
    this.metrics.avgProcessingTime = this.taskHistory.reduce((sum, r) => sum + r.processingTime, 0) / this.taskHistory.length;
    this.metrics.avgConfidence = this.taskHistory.reduce((sum, r) => sum + r.confidence, 0) / this.taskHistory.length;
    
    // Update mode distribution
    this.metrics.modeDistribution[result.mode] = (this.metrics.modeDistribution[result.mode] || 0) + 1;
    
    // Update usage rates
    this.metrics.skillUsageRate = this.taskHistory.filter(r => r.skillsUsed.length > 0).length / this.taskHistory.length;
    this.metrics.swarmUsageRate = this.taskHistory.filter(r => r.mode === "swarm").length / this.taskHistory.length;
    this.metrics.consensusUsageRate = this.taskHistory.filter(r => r.mode === "consensus" || r.mode === "hybrid").length / this.taskHistory.length;
    
    // Update cost efficiency (output quality per cost)
    const totalQuality = this.taskHistory.reduce((sum, r) => sum + ((r.confidence || 0) * (r.success ? 1 : 0)), 0);
    const totalCost = this.taskHistory.reduce((sum, r) => sum + (r.cost.compute + r.cost.memory + r.cost.latency), 0);
    this.metrics.costEfficiency = totalCost > 0 ? totalQuality / totalCost : 0;
  }

  /**
   * Get distributed cognition statistics
   */
  public getDistributedStatistics(): {
    metrics: DistributedMetrics;
    swarm: any;
    consensus: any;
    skills: any;
    load: any;
  } {
    return {
      metrics: this.metrics,
      swarm: this.swarmManager.getSwarmStatistics(),
      consensus: this.consensusManager.getModelStatistics(),
      skills: this.skillMarketplace.getMarketplaceStatistics(),
      load: this.loadThrottler.getLoadMetrics()
    };
  }

  /**
   * Get task history
   */
  public getTaskHistory(limit: number = 100): DistributedResult[] {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<DistributedConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check system health
   */
  public getSystemHealth(): {
    overall: "healthy" | "degraded" | "critical";
    components: Record<string, "healthy" | "degraded" | "critical">;
    issues: string[];
  } {
    const issues: string[] = [];
    const components: Record<string, "healthy" | "degraded" | "critical"> = {};

    // Check swarm health
    const swarmStats = this.swarmManager.getSwarmStatistics();
    components.swarm = swarmStats.activeNodes >= 3 ? "healthy" : swarmStats.activeNodes >= 1 ? "degraded" : "critical";
    if (components.swarm !== "healthy") {
      issues.push(`Swarm has only ${swarmStats.activeNodes} active nodes`);
    }

    // Check consensus health
    const consensusStats = this.consensusManager.getModelStatistics();
    components.consensus = consensusStats.activeModels >= 3 ? "healthy" : consensusStats.activeModels >= 1 ? "degraded" : "critical";
    if (components.consensus !== "healthy") {
      issues.push(`Consensus has only ${consensusStats.activeModels} active models`);
    }

    // Check skill marketplace health
    const skillStats = this.skillMarketplace.getMarketplaceStatistics();
    components.skills = skillStats.marketplace.totalValue > 10 ? "healthy" : skillStats.marketplace.totalValue > 0 ? "degraded" : "critical";
    if (components.skills !== "healthy") {
      issues.push(`Skill marketplace value is low: ${skillStats.marketplace.totalValue.toFixed(2)}`);
    }

    // Check load throttler health
    const loadStats = this.loadThrottler.getLoadMetrics();
    components.load = this.loadThrottler.isOverloaded() ? "critical" : this.loadThrottler.isUnderLoad() ? "degraded" : "healthy";
    if (components.load !== "healthy") {
      issues.push("System is under high cognitive load");
    }

    // Determine overall health
    const criticalCount = Object.values(components).filter(status => status === "critical").length;
    const degradedCount = Object.values(components).filter(status => status === "degraded").length;
    
    let overall: "healthy" | "degraded" | "critical";
    if (criticalCount > 0) {
      overall = "critical";
    } else if (degradedCount > 1) {
      overall = "degraded";
    } else {
      overall = "healthy";
    }

    return { overall, components, issues };
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.taskHistory = [];
    this.metrics = this.initializeMetrics();
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.swarmManager.clearAll();
    this.consensusManager.clearAll();
    this.skillMarketplace.cleanup();
    this.loadThrottler.cleanup();
    this.clearAll();
  }
}

// LLM Rule Integration
export const DISTRIBUTED_COGNITION_RULES = {
  NO_PERSONALITY_DRIFT: 'No personality drift',
  MODULAR_REVERSIBLE: 'Modular, reversible systems',
  TRUST_WEIGHTED_DECISIONS: 'Trust-weighted decisions',
  GRACEFUL_DEGRADATION: 'Graceful degradation',
  EXPLAINABLE_OUTCOMES: 'Explainable outcomes',
  CAPABILITIES: [
    'Think collectively',
    'Disagree safely',
    'Evolve skills organically',
    'Conserve cognitive resources'
  ],
  ARCHITECTURE_EQUIVALENT: [
    'Autonomous trading systems',
    'AI ops controllers',
    'Game directors',
    'Research copilots'
  ],
  COGNITIVE_LOOP: [
    'Throttle Selection',
    'Swarm (optional)',
    'Cross-Model Voting',
    'Skill Invocation',
    'Memory + Trust Update'
  ]
};
