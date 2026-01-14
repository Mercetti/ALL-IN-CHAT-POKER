// File: src/server/utils/multiAceySwarm.ts

/**
 * Multi-Acey Swarm Intelligence
 * Multiple Acey instances running in parallel with independent memory and trust
 */

export type AceyNodeRole = "host" | "analyst" | "creator" | "guardian" | "optimizer";

export type AceyNode = {
  nodeId: string;
  role: AceyNodeRole;
  modelId: string;
  trustWeight: number;
  memoryScope: "local" | "shared" | "isolated";
  specialization: string[];
  status: "active" | "inactive" | "degraded";
  lastSeen: number;
};

export type SwarmTask = {
  taskId: string;
  prompt: string;
  context: any;
  priority: "low" | "medium" | "high" | "critical";
  swarmMode: "all" | "role_based" | "trust_weighted";
  requiredRoles?: AceyNodeRole[];
  timeoutMs: number;
};

export type SwarmResponse = {
  nodeId: string;
  role: AceyNodeRole;
  output: string;
  confidence: number;
  reasoning: string;
  processingTime: number;
  memoryUsed: boolean;
  trustImpact: number;
};

export type SwarmConsensus = {
  taskId: string;
  responses: SwarmResponse[];
  consensusOutput: string;
  consensusScore: number;
  dissentingNodes: string[];
  consensusMethod: "majority" | "weighted" | "expert" | "safety";
  processingTime: number;
};

export type SwarmConfig = {
  minNodes: number;
  consensusThreshold: number;
  timeoutMs: number;
  enableMemorySharing: boolean;
  enableTrustAdjustment: boolean;
  roleDistribution: Record<AceyNodeRole, number>;
};

/**
 * Multi-Acey Swarm Manager
 */
export class MultiAceySwarmManager {
  private nodes: Map<string, AceyNode> = new Map();
  private config: SwarmConfig;
  private swarmHistory: SwarmConsensus[] = [];
  private memorySlices: Map<string, Map<string, any>> = new Map();
  private trustHistory: Map<string, number[]> = new Map();

  constructor(config?: Partial<SwarmConfig>) {
    this.config = {
      minNodes: 3,
      consensusThreshold: 0.7,
      timeoutMs: 30000,
      enableMemorySharing: true,
      enableTrustAdjustment: true,
      roleDistribution: {
        host: 1,
        analyst: 2,
        creator: 2,
        guardian: 1,
        optimizer: 1
      },
      ...config
    };

    this.initializeSwarm();
  }

  /**
   * Initialize the swarm with default nodes
   */
  private initializeSwarm(): void {
    const defaultNodes: AceyNode[] = [
      {
        nodeId: "acey-host-1",
        role: "host",
        modelId: "acey-base",
        trustWeight: 0.9,
        memoryScope: "shared",
        specialization: ["coordination", "communication"],
        status: "active",
        lastSeen: Date.now()
      },
      {
        nodeId: "acey-analyst-1",
        role: "analyst",
        modelId: "acey-analyst",
        trustWeight: 0.8,
        memoryScope: "local",
        specialization: ["analysis", "validation"],
        status: "active",
        lastSeen: Date.now()
      },
      {
        nodeId: "acey-analyst-2",
        role: "analyst",
        modelId: "acey-analyst-v2",
        trustWeight: 0.85,
        memoryScope: "local",
        specialization: ["risk_assessment", "data_analysis"],
        status: "active",
        lastSeen: Date.now()
      },
      {
        nodeId: "acey-creator-1",
        role: "creator",
        modelId: "acey-creator",
        trustWeight: 0.8,
        memoryScope: "shared",
        specialization: ["generation", "synthesis"],
        status: "active",
        lastSeen: Date.now()
      },
      {
        nodeId: "acey-creator-2",
        role: "creator",
        modelId: "acey-creator-specialized",
        trustWeight: 0.75,
        memoryScope: "local",
        specialization: ["creative", "innovation"],
        status: "active",
        lastSeen: Date.now()
      },
      {
        nodeId: "acey-guardian-1",
        role: "guardian",
        modelId: "acey-guardian",
        trustWeight: 0.95,
        memoryScope: "isolated",
        specialization: ["safety", "security", "ethics"],
        status: "active",
        lastSeen: Date.now()
      },
      {
        nodeId: "acey-optimizer-1",
        role: "optimizer",
        modelId: "acey-optimizer",
        trustWeight: 0.85,
        memoryScope: "shared",
        specialization: ["efficiency", "optimization"],
        status: "active",
        lastSeen: Date.now()
      }
    ];

    for (const node of defaultNodes) {
      this.nodes.set(node.nodeId, node);
      this.initializeMemorySlice(node.nodeId);
      this.initializeTrustHistory(node.nodeId);
    }

    console.log(`[MultiAceySwarm] Initialized swarm with ${defaultNodes.length} nodes`);
  }

  /**
   * Initialize memory slice for a node
   */
  private initializeMemorySlice(nodeId: string): void {
    this.memorySlices.set(nodeId, new Map());
  }

  /**
   * Initialize trust history for a node
   */
  private initializeTrustHistory(nodeId: string): void {
    this.trustHistory.set(nodeId, [this.nodes.get(nodeId)?.trustWeight || 0.5]);
  }

  /**
   * Execute task through swarm
   */
  public async executeSwarmTask(task: SwarmTask): Promise<SwarmConsensus> {
    const startTime = Date.now();
    console.log(`[MultiAceySwarm] Executing task ${task.taskId} with ${task.swarmMode} mode`);

    // Select nodes for this task
    const selectedNodes = this.selectNodes(task);
    if (selectedNodes.length < this.config.minNodes) {
      throw new Error(`Insufficient nodes for swarm execution: ${selectedNodes.length} < ${this.config.minNodes}`);
    }

    // Broadcast task to selected nodes
    const responses = await this.broadcastTask(task, selectedNodes);

    // Achieve consensus
    const consensus = this.achieveConsensus(task, responses);

    // Update trust weights based on consensus participation
    if (this.config.enableTrustAdjustment) {
      this.updateTrustWeights(consensus);
    }

    // Update memory slices if sharing enabled
    if (this.config.enableMemorySharing) {
      this.updateSharedMemory(consensus);
    }

    consensus.processingTime = Date.now() - startTime;
    this.swarmHistory.push(consensus);

    console.log(`[MultiAceySwarm] Task ${task.taskId} completed: consensus=${consensus.consensusScore.toFixed(2)}`);

    return consensus;
  }

  /**
   * Select nodes for task execution
   */
  private selectNodes(task: SwarmTask): AceyNode[] {
    const activeNodes = Array.from(this.nodes.values())
      .filter(node => node.status === "active")
      .filter(node => Date.now() - node.lastSeen < 60000); // Active within last minute

    switch (task.swarmMode) {
      case "all":
        return activeNodes;
      
      case "role_based":
        if (task.requiredRoles) {
          return activeNodes.filter(node => task.requiredRoles!.includes(node.role));
        }
        return activeNodes;
      
      case "trust_weighted":
        return activeNodes
          .sort((a, b) => b.trustWeight - a.trustWeight)
          .slice(0, Math.max(this.config.minNodes, 5));
      
      default:
        return activeNodes;
    }
  }

  /**
   * Broadcast task to selected nodes
   */
  private async broadcastTask(task: SwarmTask, nodes: AceyNode[]): Promise<SwarmResponse[]> {
    const promises = nodes.map(node => this.executeNodeTask(node, task));
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<SwarmResponse> => result.status === "fulfilled")
      .map(result => result.value);
  }

  /**
   * Execute task on individual node
   */
  private async executeNodeTask(node: AceyNode, task: SwarmTask): Promise<SwarmResponse> {
    const startTime = Date.now();

    try {
      // Get node's memory slice
      const memorySlice = this.getMemorySlice(node.nodeId, task.context);
      
      // Simulate node processing (in real implementation, this would call the actual model)
      const nodeOutput = await this.simulateNodeProcessing(node, task, memorySlice);
      
      // Calculate trust impact based on processing
      const trustImpact = this.calculateTrustImpact(node, nodeOutput, task);

      return {
        nodeId: node.nodeId,
        role: node.role,
        output: nodeOutput.output,
        confidence: nodeOutput.confidence,
        reasoning: nodeOutput.reasoning,
        processingTime: Date.now() - startTime,
        memoryUsed: nodeOutput.memoryUsed,
        trustImpact
      };

    } catch (error) {
      console.error(`[MultiAceySwarm] Node ${node.nodeId} failed:`, error);
      
      return {
        nodeId: node.nodeId,
        role: node.role,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        reasoning: "Processing failed",
        processingTime: Date.now() - startTime,
        memoryUsed: false,
        trustImpact: -0.1
      };
    }
  }

  /**
   * Get memory slice for node
   */
  private getMemorySlice(nodeId: string, context: any): Map<string, any> {
    const memorySlice = this.memorySlices.get(nodeId);
    
    if (!memorySlice) {
      return new Map();
    }

    // Filter memory based on scope
    const node = this.nodes.get(nodeId);
    if (!node) return memorySlice;

    switch (node.memoryScope) {
      case "local":
        return memorySlice;
      
      case "shared":
        // Combine with shared memories
        const sharedMemory = new Map(memorySlice);
        for (const [otherNodeId, otherSlice] of this.memorySlices) {
          if (otherNodeId !== nodeId && this.nodes.get(otherNodeId)?.memoryScope === "shared") {
            for (const [key, value] of otherSlice) {
              sharedMemory.set(key, value);
            }
          }
        }
        return sharedMemory;
      
      case "isolated":
        // Return empty memory for isolated nodes
        return new Map();
      
      default:
        return memorySlice;
    }
  }

  /**
   * Simulate node processing (mock implementation)
   */
  private async simulateNodeProcessing(
    node: AceyNode,
    task: SwarmTask,
    memorySlice: Map<string, any>
  ): Promise<{ output: string; confidence: number; reasoning: string; memoryUsed: boolean }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Generate role-based response
    const roleResponses = {
      host: `Host coordination: ${task.prompt}. Coordinating swarm response with ${memorySlice.size} memory items.`,
      analyst: `Analysis: ${task.prompt}. Risk assessment: ${Math.random() > 0.7 ? 'high' : 'low'}. Confidence: ${(0.6 + Math.random() * 0.3).toFixed(2)}.`,
      creator: `Creative synthesis: ${task.prompt}. Generated innovative solution with ${(0.7 + Math.random() * 0.2).toFixed(2)} confidence.`,
      guardian: `Safety check: ${task.prompt}. Security assessment: ${Math.random() > 0.8 ? 'concerns detected' : 'safe'}. Trust level: ${(0.8 + Math.random() * 0.2).toFixed(2)}.`,
      optimizer: `Optimization: ${task.prompt}. Efficiency improvement suggested. Confidence: ${(0.6 + Math.random() * 0.3).toFixed(2)}.`
    };

    const baseResponse = roleResponses[node.role] || `Response: ${task.prompt}`;
    const confidence = 0.5 + Math.random() * 0.5;

    return {
      output: baseResponse,
      confidence,
      reasoning: `${node.role} processing with ${node.specialization.join(', ')}`,
      memoryUsed: memorySlice.size > 0
    };
  }

  /**
   * Calculate trust impact of node response
   */
  private calculateTrustImpact(node: AceyNode, response: any, task: SwarmTask): number {
    let impact = 0;

    // Confidence impact
    if (response.confidence > 0.8) {
      impact += 0.05;
    } else if (response.confidence < 0.3) {
      impact -= 0.05;
    }

    // Role-specific impact
    if (node.role === "guardian" && response.reasoning.includes("safe")) {
      impact += 0.02;
    }

    if (node.role === "analyst" && response.reasoning.includes("low risk")) {
      impact += 0.02;
    }

    // Task priority impact
    if (task.priority === "critical" && response.confidence > 0.7) {
      impact += 0.03;
    }

    return Math.max(-0.1, Math.min(0.1, impact));
  }

  /**
   * Achieve consensus from responses
   */
  private achieveConsensus(task: SwarmTask, responses: SwarmResponse[]): SwarmConsensus {
    if (responses.length === 0) {
      throw new Error("No responses to achieve consensus");
    }

    // Sort responses by confidence
    const sortedResponses = responses.sort((a, b) => b.confidence - a.confidence);

    // Calculate consensus scores for different methods
    const consensusMethods = {
      majority: this.calculateMajorityConsensus(sortedResponses),
      weighted: this.calculateWeightedConsensus(sortedResponses),
      expert: this.calculateExpertConsensus(sortedResponses),
      safety: this.calculateSafetyConsensus(sortedResponses)
    };

    // Select best consensus method
    const bestMethod = Object.entries(consensusMethods)
      .sort(([, a], [, b]) => b.score - a.score)[0];

    const [methodName, methodResult] = bestMethod;

    return {
      taskId: task.taskId,
      responses,
      consensusOutput: methodResult.output,
      consensusScore: methodResult.score,
      dissentingNodes: methodResult.dissentingNodes,
      consensusMethod: methodResult.method as SwarmConsensus["consensusMethod"],
      processingTime: 0 // Will be set by caller
    };
  }

  /**
   * Calculate majority consensus
   */
  private calculateMajorityConsensus(responses: SwarmResponse[]): {
    output: string;
    score: number;
    dissentingNodes: string[];
    method: string;
  } {
    // Group similar outputs
    const outputGroups = new Map<string, SwarmResponse[]>();
    
    for (const response of responses) {
      const key = response.output.substring(0, 50); // Group by first 50 chars
      if (!outputGroups.has(key)) {
        outputGroups.set(key, []);
      }
      outputGroups.get(key)!.push(response);
    }

    // Find largest group
    const largestGroup = Array.from(outputGroups.values())
      .sort((a, b) => b.length - a.length)[0];

    if (!largestGroup) {
      return {
        output: "No consensus",
        score: 0,
        dissentingNodes: responses.map(r => r.nodeId),
        method: "majority"
      };
    }

    const selectedOutput = largestGroup[0].output;
    const dissentingNodes = responses
      .filter(r => !largestGroup.includes(r))
      .map(r => r.nodeId);

    return {
      output: selectedOutput,
      score: largestGroup.length / responses.length,
      dissentingNodes,
      method: "majority"
    };
  }

  /**
   * Calculate weighted consensus
   */
  private calculateWeightedConsensus(responses: SwarmResponse[]): {
    output: string;
    score: number;
    dissentingNodes: string[];
    method: string;
  } {
    // Calculate weighted scores
    const outputScores = new Map<string, number>();
    const outputNodes = new Map<string, string[]>();

    for (const response of responses) {
      const key = response.output.substring(0, 50);
      const weight = response.confidence * (this.nodes.get(response.nodeId)?.trustWeight || 0.5);
      
      outputScores.set(key, (outputScores.get(key) || 0) + weight);
      outputNodes.set(key, [...(outputNodes.get(key) || []), response.nodeId]);
    }

    // Find highest weighted output
    const bestOutput = Array.from(outputScores.entries())
      .sort(([, a], [, b]) => b - a)[0];

    if (!bestOutput) {
      return {
        output: "No consensus",
        score: 0,
        dissentingNodes: responses.map(r => r.nodeId),
        method: "weighted"
      };
    }

    const [outputKey, score] = bestOutput;
    const dissentingNodes = responses
      .filter(r => !outputNodes.get(outputKey)?.includes(r.nodeId))
      .map(r => r.nodeId);

    return {
      output: responses.find(r => r.output.substring(0, 50) === outputKey)?.output || "",
      score: score / responses.reduce((sum, r) => sum + (r.confidence * (this.nodes.get(r.nodeId)?.trustWeight || 0.5)), 0),
      dissentingNodes,
      method: "weighted"
    };
  }

  /**
   * Calculate expert consensus
   */
  private calculateExpertConsensus(responses: SwarmResponse[]): {
    output: string;
    score: number;
    dissentingNodes: string[];
    method: string;
  } {
    // Prioritize guardian and analyst responses
    const expertResponses = responses
      .filter(r => r.role === "guardian" || r.role === "analyst")
      .sort((a, b) => b.confidence - a.confidence);

    if (expertResponses.length === 0) {
      return this.calculateWeightedConsensus(responses);
    }

    const selectedResponse = expertResponses[0];
    const dissentingNodes = responses
      .filter(r => r.nodeId !== selectedResponse.nodeId)
      .map(r => r.nodeId);

    return {
      output: selectedResponse.output,
      score: selectedResponse.confidence,
      dissentingNodes,
      method: "expert"
    };
  }

  /**
   * Calculate safety consensus
   */
  private calculateSafetyConsensus(responses: SwarmResponse[]): {
    output: string;
    score: number;
    dissentingNodes: string[];
    method: string;
  } {
    // Find guardian response
    const guardianResponse = responses.find(r => r.role === "guardian");
    
    if (!guardianResponse) {
      return this.calculateWeightedConsensus(responses);
    }

    // If guardian has safety concerns, use weighted consensus
    if (guardianResponse.reasoning.includes("concerns")) {
      const weighted = this.calculateWeightedConsensus(responses);
      weighted.method = "safety";
      return weighted;
    }

    // Otherwise use guardian's output
    const dissentingNodes = responses
      .filter(r => r.nodeId !== guardianResponse.nodeId)
      .map(r => r.nodeId);

    return {
      output: guardianResponse.output,
      score: guardianResponse.confidence,
      dissentingNodes,
      method: "safety"
    };
  }

  /**
   * Update trust weights based on consensus
   */
  private updateTrustWeights(consensus: SwarmConsensus): void {
    for (const response of consensus.responses) {
      const node = this.nodes.get(response.nodeId);
      if (!node) continue;

      const trustHistory = this.trustHistory.get(response.nodeId);
      if (!trustHistory) continue;

      // Adjust trust based on consensus participation
      let adjustment = 0;
      
      if (consensus.dissentingNodes.includes(response.nodeId)) {
        // Node dissented - reduce trust
        adjustment = -0.02;
      } else {
        // Node agreed - increase trust slightly
        adjustment = 0.01;
      }

      // Apply adjustment
      const currentTrust = node.trustWeight;
      const newTrust = Math.max(0.1, Math.min(1.0, currentTrust + adjustment));
      
      node.trustWeight = newTrust;
      trustHistory.push(newTrust);
      
      // Keep only last 10 trust values
      if (trustHistory.length > 10) {
        trustHistory.shift();
      }
    }
  }

  /**
   * Update shared memory
   */
  private updateSharedMemory(consensus: SwarmConsensus): void {
    const sharedMemoryKey = `task_${consensus.taskId}`;
    const sharedData = {
      output: consensus.consensusOutput,
      consensusScore: consensus.consensusScore,
      timestamp: Date.now(),
      participants: consensus.responses.map(r => r.nodeId)
    };

    // Update shared memory for nodes with shared scope
    for (const [nodeId, memorySlice] of this.memorySlices) {
      const node = this.nodes.get(nodeId);
      if (node && node.memoryScope === "shared") {
        memorySlice.set(sharedMemoryKey, sharedData);
      }
    }
  }

  /**
   * Add new node to swarm
   */
  public addNode(node: AceyNode): void {
    this.nodes.set(node.nodeId, node);
    this.initializeMemorySlice(node.nodeId);
    this.initializeTrustHistory(node.nodeId);
    console.log(`[MultiAceySwarm] Added node ${node.nodeId} with role ${node.role}`);
  }

  /**
   * Remove node from swarm
   */
  public removeNode(nodeId: string): boolean {
    const removed = this.nodes.delete(nodeId);
    this.memorySlices.delete(nodeId);
    this.trustHistory.delete(nodeId);
    
    if (removed) {
      console.log(`[MultiAceySwarm] Removed node ${nodeId}`);
    }
    
    return removed;
  }

  /**
   * Get swarm statistics
   */
  public getSwarmStatistics(): {
    totalNodes: number;
    activeNodes: number;
    roleDistribution: Record<AceyNodeRole, number>;
    avgTrustWeight: number;
    memoryScopeDistribution: Record<string, number>;
    consensusStats: {
      totalTasks: number;
      avgConsensusScore: number;
      avgProcessingTime: number;
      consensusMethodDistribution: Record<string, number>;
    };
  } {
    const nodes = Array.from(this.nodes.values());
    
    const roleDistribution: Record<AceyNodeRole, number> = {
      host: 0,
      analyst: 0,
      creator: 0,
      guardian: 0,
      optimizer: 0
    };

    const memoryScopeDistribution: Record<string, number> = {
      local: 0,
      shared: 0,
      isolated: 0
    };

    let totalTrust = 0;
    let activeCount = 0;

    for (const node of nodes) {
      roleDistribution[node.role]++;
      memoryScopeDistribution[node.memoryScope]++;
      totalTrust += node.trustWeight;
      
      if (node.status === "active" && Date.now() - node.lastSeen < 60000) {
        activeCount++;
      }
    }

    const consensusStats = {
      totalTasks: this.swarmHistory.length,
      avgConsensusScore: this.swarmHistory.length > 0 
        ? this.swarmHistory.reduce((sum, c) => sum + c.consensusScore, 0) / this.swarmHistory.length
        : 0,
      avgProcessingTime: this.swarmHistory.length > 0
        ? this.swarmHistory.reduce((sum, c) => sum + c.processingTime, 0) / this.swarmHistory.length
        : 0,
      consensusMethodDistribution: {} as Record<string, number>
    };

    for (const consensus of this.swarmHistory) {
      consensusStats.consensusMethodDistribution[consensus.consensusMethod] = 
        (consensusStats.consensusMethodDistribution[consensus.consensusMethod] || 0) + 1;
    }

    return {
      totalNodes: nodes.length,
      activeNodes: activeCount,
      roleDistribution,
      avgTrustWeight: nodes.length > 0 ? totalTrust / nodes.length : 0,
      memoryScopeDistribution,
      consensusStats
    };
  }

  /**
   * Get swarm history
   */
  public getSwarmHistory(limit: number = 50): SwarmConsensus[] {
    return this.swarmHistory.slice(-limit);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SwarmConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.nodes.clear();
    this.memorySlices.clear();
    this.trustHistory.clear();
    this.swarmHistory = [];
  }
}

// LLM Rule Integration
export const MULTI_ACEY_SWARM_RULES = {
  INDEPENDENT_REASONING: 'Generate multiple independent solutions',
  NO_REASONING_SHARING: 'Do not share reasoning between nodes',
  CONSENSUS_RESOLUTION: 'Resolve via consensus, not authority',
  SURFACE_DISSENT: 'Never force agreement — surface dissent when present',
  COLLABORATION_PRINCIPLE: 'They collaborate, not compete',
  HIVE_MIND_BOUNDARIES: 'Hive mind with boundaries'
};
