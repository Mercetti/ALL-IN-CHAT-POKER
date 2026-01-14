// File: src/server/utils/crossModelConsensus.ts

/**
 * Cross-Model Consensus Voting
 * Acey does not trust one model — she trusts agreement across models
 */

export type ModelVote = {
  modelId: string;
  output: string;
  confidence: number;
  trustWeight: number;
  reasoning: string;
  processingTime: number;
  modelVersion: string;
};

export type ConsensusResult = {
  selectedOutput: string;
  agreementScore: number; // 0–1
  dissentingModels: string[];
  consensusMethod: "majority" | "weighted" | "unanimous" | "confidence_weighted" | "trust_weighted";
  votingDetails: ModelVote[];
  processingTime: number;
  decision: "accept" | "hedge" | "block" | "escalate";
  reasoning: string;
};

export type ModelDescriptor = {
  modelId: string;
  name: string;
  version: string;
  trustWeight: number;
  capabilities: string[];
  specialization: string[];
  status: "active" | "inactive" | "degraded" | "experimental";
  lastUsed: number;
  performanceHistory: Array<{
    timestamp: number;
    consensusAgreement: number;
    predictionAccuracy: number;
  }>;
};

export type ConsensusConfig = {
  minModels: number;
  agreementThreshold: number;
  hedgeThreshold: number;
  blockThreshold: number;
  enableTrustAdjustment: boolean;
  enablePerformanceTracking: boolean;
  votingTimeoutMs: number;
  consensusMethods: Array<ConsensusResult["consensusMethod"]>;
};

/**
 * Cross-Model Consensus Manager
 */
export class CrossModelConsensusManager {
  private models: Map<string, ModelDescriptor> = new Map();
  private config: ConsensusConfig;
  private consensusHistory: ConsensusResult[] = [];
  private trustAdjustmentHistory: Map<string, number[]> = new Map();

  constructor(config?: Partial<ConsensusConfig>) {
    this.config = {
      minModels: 3,
      agreementThreshold: 0.7,
      hedgeThreshold: 0.4,
      blockThreshold: 0.4,
      enableTrustAdjustment: true,
      enablePerformanceTracking: true,
      votingTimeoutMs: 15000,
      consensusMethods: ["majority", "weighted", "confidence_weighted", "trust_weighted"],
      ...config
    };

    this.initializeModels();
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    const defaultModels: ModelDescriptor[] = [
      {
        modelId: "acey-base-v1",
        name: "Acey Base Model",
        version: "1.0.0",
        trustWeight: 0.8,
        capabilities: ["general", "reasoning", "analysis"],
        specialization: ["general_purpose"],
        status: "active",
        lastUsed: Date.now(),
        performanceHistory: []
      },
      {
        modelId: "acey-analyst-v2",
        name: "Acey Analyst Model",
        version: "2.1.0",
        trustWeight: 0.85,
        capabilities: ["analysis", "validation", "risk_assessment"],
        specialization: ["data_analysis", "logic_validation"],
        status: "active",
        lastUsed: Date.now(),
        performanceHistory: []
      },
      {
        modelId: "acey-creative-v3",
        name: "Acey Creative Model",
        version: "3.0.0",
        trustWeight: 0.75,
        capabilities: ["creativity", "synthesis", "innovation"],
        specialization: ["creative_writing", "design"],
        status: "active",
        lastUsed: Date.now(),
        performanceHistory: []
      },
      {
        modelId: "acey-guardian-v1",
        name: "Acey Guardian Model",
        version: "1.2.0",
        trustWeight: 0.95,
        capabilities: ["safety", "ethics", "security"],
        specialization: ["safety_checking", "ethical_validation"],
        status: "active",
        lastUsed: Date.now(),
        performanceHistory: []
      },
      {
        modelId: "acey-optimizer-v2",
        name: "Acey Optimizer Model",
        version: "2.0.0",
        trustWeight: 0.8,
        capabilities: ["optimization", "efficiency", "performance"],
        specialization: ["process_optimization", "resource_management"],
        status: "active",
        lastUsed: Date.now(),
        performanceHistory: []
      },
      {
        modelId: "acey-experimental-v4",
        name: "Acey Experimental Model",
        version: "4.0.0-alpha",
        trustWeight: 0.6,
        capabilities: ["experimental", "research", "testing"],
        specialization: ["research", "experimental_features"],
        status: "experimental",
        lastUsed: Date.now(),
        performanceHistory: []
      }
    ];

    for (const model of defaultModels) {
      this.models.set(model.modelId, model);
      this.trustAdjustmentHistory.set(model.modelId, [model.trustWeight]);
    }

    console.log(`[CrossModelConsensus] Initialized with ${defaultModels.length} models`);
  }

  /**
   * Achieve consensus across multiple models
   */
  public async achieveConsensus(prompt: string, context: any): Promise<ConsensusResult> {
    const startTime = Date.now();
    console.log(`[CrossModelConsensus] Achieving consensus for: ${prompt.substring(0, 100)}...`);

    // Get all available models
    const models = this.selectModels();
    const results = new Map<string, { output: string; confidence: number; reasoning: string }>();

    // Get votes from all selected models
    const votes = await this.collectVotes(models, prompt, context);

    // Calculate consensus using different methods
    const consensusResults = this.calculateConsensusMethods(votes);

    // Select best consensus method
    const bestConsensus = this.selectBestConsensus(consensusResults);

    // Update model trust weights based on consensus participation
    if (this.config.enableTrustAdjustment) {
      this.updateTrustWeights({
        ...bestConsensus,
        votingDetails: [],
        processingTime: Date.now() - startTime
      });
    }

    // Update model performance tracking
    if (this.config.enablePerformanceTracking) {
      this.updatePerformanceTracking({
        ...bestConsensus,
        votingDetails: [],
        processingTime: Date.now() - startTime
      });
    }

    const finalConsensus: ConsensusResult = {
      ...bestConsensus,
      votingDetails: [],
      processingTime: Date.now() - startTime
    };
    
    this.consensusHistory.push(finalConsensus);

    console.log(`[CrossModelConsensus] Consensus achieved: ${finalConsensus.decision} (${finalConsensus.agreementScore.toFixed(2)})`);

    return finalConsensus;
  }

  /**
   * Select models for voting
   */
  private selectModels(requiredModels?: string[]): ModelDescriptor[] {
    const activeModels = Array.from(this.models.values())
      .filter(model => model.status === "active" || model.status === "experimental")
      .filter(model => Date.now() - model.lastUsed < 300000); // Active within 5 minutes

    if (requiredModels && requiredModels.length > 0) {
      const required = activeModels.filter(model => requiredModels.includes(model.modelId));
      if (required.length >= this.config.minModels) {
        return required;
      }
      console.warn(`[CrossModelConsensus] Required models insufficient, using available models`);
    }

    // Select models with highest trust weights
    return activeModels
      .sort((a, b) => b.trustWeight - a.trustWeight)
      .slice(0, Math.max(this.config.minModels, 5));
  }

  /**
   * Collect votes from models
   */
  private async collectVotes(models: ModelDescriptor[], prompt: string, context: any): Promise<ModelVote[]> {
    const promises = models.map(model => this.getModelVote(model, prompt, context));
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<ModelVote> => result.status === "fulfilled")
      .map(result => result.value);
  }

  /**
   * Get vote from individual model
   */
  private async getModelVote(model: ModelDescriptor, prompt: string, context: any): Promise<ModelVote> {
    const startTime = Date.now();

    try {
      // Simulate model processing (in real implementation, this would call the actual model API)
      const modelOutput = await this.simulateModelProcessing(model, prompt, context);
      
      return {
        modelId: model.modelId,
        output: modelOutput.output,
        confidence: modelOutput.confidence,
        trustWeight: model.trustWeight,
        reasoning: modelOutput.reasoning,
        processingTime: Date.now() - startTime,
        modelVersion: model.version
      };

    } catch (error) {
      console.error(`[CrossModelConsensus] Model ${model.modelId} failed:`, error);
      
      return {
        modelId: model.modelId,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        trustWeight: model.trustWeight,
        reasoning: "Processing failed",
        processingTime: Date.now() - startTime,
        modelVersion: model.version
      };
    }
  }

  /**
   * Simulate model processing (mock implementation)
   */
  private async simulateModelProcessing(
    model: ModelDescriptor,
    prompt: string,
    context: any
  ): Promise<{ output: string; confidence: number; reasoning: string }> {
    // Simulate processing delay based on model capabilities
      const processingDelay = model.capabilities.includes("optimization") ? 500 : 800;
      await new Promise(resolve => setTimeout(resolve, processingDelay + Math.random() * 500));

    // Generate model-specific response
    const modelResponses = {
      "acey-base-v1": `Base model response: ${prompt}. General purpose reasoning with ${(0.6 + Math.random() * 0.3).toFixed(2)} confidence.`,
      "acey-analyst-v2": `Analysis: ${prompt}. Detailed analysis with ${(0.7 + Math.random() * 0.2).toFixed(2)} confidence. Risk assessment: ${Math.random() > 0.7 ? 'high' : 'low'}.`,
      "acey-creative-v3": `Creative synthesis: ${prompt}. Innovative approach with ${(0.65 + Math.random() * 0.25).toFixed(2)} confidence. Generated ${Math.random() > 0.5 ? 'novel' : 'standard'} solution.`,
      "acey-guardian-v1": `Safety assessment: ${prompt}. Security check completed. ${(0.9 + Math.random() * 0.1).toFixed(2)} confidence. Status: ${Math.random() > 0.9 ? 'safe' : 'requires review'}.`,
      "acey-optimizer-v2": `Optimization: ${prompt}. Efficiency analysis with ${(0.75 + Math.random() * 0.2).toFixed(2)} confidence. Suggested improvements available.`,
      "acey-experimental-v4": `Experimental approach: ${prompt}. Research-oriented response with ${(0.5 + Math.random() * 0.4).toFixed(2)} confidence. Novel concepts explored.`
    };

    const baseResponse = modelResponses[model.modelId as keyof typeof modelResponses] || `Response: ${prompt}`;
    const confidence = 0.5 + Math.random() * 0.5;

    return {
      output: baseResponse,
      confidence,
      reasoning: `${model.name} (${model.version}) processing with ${model.capabilities.join(', ')}`
    };
  }

  /**
   * Calculate consensus using different methods
   */
  private calculateConsensusMethods(votes: ModelVote[]): Record<string, Omit<ConsensusResult, "votingDetails" | "processingTime">> {
    const results: Record<string, Omit<ConsensusResult, "votingDetails" | "processingTime">> = {};

    for (const method of this.config.consensusMethods) {
      switch (method) {
        case "majority":
          results[method] = this.calculateMajorityConsensus(votes);
          break;
        case "weighted":
          results[method] = this.calculateWeightedConsensus(votes);
          break;
        case "confidence_weighted":
          results[method] = this.calculateConfidenceWeightedConsensus(votes);
          break;
        case "trust_weighted":
          results[method] = this.calculateTrustWeightedConsensus(votes);
          break;
        case "unanimous":
          results[method] = this.calculateUnanimousConsensus(votes);
          break;
      }
    }

    return results;
  }

  /**
   * Calculate majority consensus
   */
  private calculateMajorityConsensus(votes: ModelVote[]): Omit<ConsensusResult, "votingDetails" | "processingTime"> {
    // Group similar outputs
    const outputGroups = new Map<string, ModelVote[]>();
    
    for (const vote of votes) {
      const key = vote.output.substring(0, 100); // Group by first 100 chars
      if (!outputGroups.has(key)) {
        outputGroups.set(key, []);
      }
      outputGroups.get(key)!.push(vote);
    }

    // Find largest group
    const largestGroup = Array.from(outputGroups.values())
      .sort((a, b) => b.length - a.length)[0];

    if (!largestGroup) {
      return {
        selectedOutput: "No consensus",
        agreementScore: 0,
        dissentingModels: votes.map(v => v.modelId),
        consensusMethod: "majority",
        decision: "block",
        reasoning: "No valid votes received"
      };
    }

    const selectedOutput = largestGroup[0].output;
    const agreementScore = largestGroup.length / votes.length;
    const dissentingModels = votes
      .filter(v => !largestGroup.includes(v))
      .map(v => v.modelId);

    return {
      selectedOutput,
      agreementScore,
      dissentingModels,
      consensusMethod: "majority",
      decision: this.determineDecision(agreementScore),
      reasoning: `Majority consensus: ${largestGroup.length}/${votes.length} models agree`
    };
  }

  /**
   * Calculate weighted consensus
   */
  private calculateWeightedConsensus(votes: ModelVote[]): Omit<ConsensusResult, "votingDetails" | "processingTime"> {
    // Calculate weighted scores
    const outputScores = new Map<string, number>();
    const outputModels = new Map<string, string[]>();

    for (const vote of votes) {
      const key = vote.output.substring(0, 100);
      const weight = vote.trustWeight;
      
      outputScores.set(key, (outputScores.get(key) || 0) + weight);
      outputModels.set(key, [...(outputModels.get(key) || []), vote.modelId]);
    }

    // Find highest weighted output
    const bestOutput = Array.from(outputScores.entries())
      .sort(([, a], [, b]) => b - a)[0];

    if (!bestOutput) {
      return {
        selectedOutput: "No consensus",
        agreementScore: 0,
        dissentingModels: votes.map(v => v.modelId),
        consensusMethod: "weighted",
        decision: "block",
        reasoning: "No valid votes received"
      };
    }

    const [outputKey, score] = bestOutput;
    const selectedOutput = votes.find(v => v.output.substring(0, 100) === outputKey)?.output || "";
    const totalWeight = votes.reduce((sum, v) => sum + v.trustWeight, 0);
    const dissentingModels = votes
      .filter(v => !outputModels.get(outputKey)?.includes(v.modelId))
      .map(v => v.modelId);

    return {
      selectedOutput,
      agreementScore: score / totalWeight,
      dissentingModels,
      consensusMethod: "weighted",
      decision: this.determineDecision(score / totalWeight),
      reasoning: `Weighted consensus: ${score.toFixed(2)}/${totalWeight.toFixed(2)} weight`
    };
  }

  /**
   * Calculate confidence-weighted consensus
   */
  private calculateConfidenceWeightedConsensus(votes: ModelVote[]): Omit<ConsensusResult, "votingDetails" | "processingTime"> {
    // Calculate confidence-weighted scores
    const outputScores = new Map<string, number>();
    const outputModels = new Map<string, string[]>();

    for (const vote of votes) {
      const key = vote.output.substring(0, 100);
      const weight = vote.confidence;
      
      outputScores.set(key, (outputScores.get(key) || 0) + weight);
      outputModels.set(key, [...(outputModels.get(key) || []), vote.modelId]);
    }

    // Find highest confidence-weighted output
    const bestOutput = Array.from(outputScores.entries())
      .sort(([, a], [, b]) => b - a)[0];

    if (!bestOutput) {
      return {
        selectedOutput: "No consensus",
        agreementScore: 0,
        dissentingModels: votes.map(v => v.modelId),
        consensusMethod: "confidence_weighted",
        decision: "block",
        reasoning: "No valid votes received"
      };
    }

    const [outputKey, score] = bestOutput;
    const selectedOutput = votes.find(v => v.output.substring(0, 100) === outputKey)?.output || "";
    const totalConfidence = votes.reduce((sum, v) => sum + v.confidence, 0);
    const dissentingModels = votes
      .filter(v => !outputModels.get(outputKey)?.includes(v.modelId))
      .map(v => v.modelId);

    return {
      selectedOutput,
      agreementScore: score / totalConfidence,
      dissentingModels,
      consensusMethod: "confidence_weighted",
      decision: this.determineDecision(score / totalConfidence),
      reasoning: `Confidence-weighted consensus: ${score.toFixed(2)}/${totalConfidence.toFixed(2)} confidence`
    };
  }

  /**
   * Calculate trust-weighted consensus
   */
  private calculateTrustWeightedConsensus(votes: ModelVote[]): Omit<ConsensusResult, "votingDetails" | "processingTime"> {
    // This is similar to weighted consensus but with trust weights
    return this.calculateWeightedConsensus(votes);
  }

  /**
   * Calculate unanimous consensus
   */
  private calculateUnanimousConsensus(votes: ModelVote[]): Omit<ConsensusResult, "votingDetails" | "processingTime"> {
    if (votes.length === 0) {
      return {
        selectedOutput: "No consensus",
        agreementScore: 0,
        dissentingModels: [],
        consensusMethod: "unanimous",
        decision: "block",
        reasoning: "No votes received"
      };
    }

    // Check if all outputs are identical
    const firstOutput = votes[0].output;
    const allIdentical = votes.every(vote => vote.output === firstOutput);

    if (allIdentical) {
      return {
        selectedOutput: firstOutput,
        agreementScore: 1.0,
        dissentingModels: [],
        consensusMethod: "unanimous",
        decision: "accept",
        reasoning: "Unanimous agreement across all models"
      };
    }

    // Otherwise fall back to weighted consensus
    return this.calculateWeightedConsensus(votes);
  }

  /**
   * Select best consensus method
   */
  private selectBestConsensus(results: Record<string, Omit<ConsensusResult, "votingDetails" | "processingTime">>): Omit<ConsensusResult, "votingDetails" | "processingTime"> {
    const methodPriority: Record<ConsensusResult["consensusMethod"], number> = {
      "unanimous": 5,
      "trust_weighted": 4,
      "confidence_weighted": 3,
      "weighted": 2,
      "majority": 1
    };

    const bestMethod = Object.entries(results)
      .sort(([, a], [, b]) => methodPriority[b.consensusMethod as keyof typeof methodPriority] - methodPriority[a.consensusMethod as keyof typeof methodPriority])
      [0];

    const [method, result] = bestMethod;

    return {
      ...result,
      consensusMethod: method as ConsensusResult["consensusMethod"]
    };
  }

  /**
   * Determine decision based on agreement score
   */
  private determineDecision(agreementScore: number): ConsensusResult["decision"] {
    if (agreementScore >= this.config.agreementThreshold) {
      return "accept";
    } else if (agreementScore >= this.config.hedgeThreshold) {
      return "hedge";
    } else {
      return "block";
    }
  }

  /**
   * Update model trust weights based on consensus
   */
  private updateTrustWeights(consensus: ConsensusResult): void {
    for (const vote of consensus.votingDetails) {
      const model = this.models.get(vote.modelId);
      if (!model) continue;

      const trustHistory = this.trustAdjustmentHistory.get(vote.modelId);
      if (!trustHistory) continue;

      // Adjust trust based on consensus participation
      let adjustment = 0;
      
      if (consensus.dissentingModels.includes(vote.modelId)) {
        // Model dissented - reduce trust
        adjustment = -0.02;
      } else {
        // Model agreed with consensus - increase trust
        adjustment = 0.01;
      }

      // Additional adjustment based on consensus quality
      if (consensus.agreementScore > 0.8) {
        adjustment += 0.005;
      } else if (consensus.agreementScore < 0.5) {
        adjustment -= 0.005;
      }

      // Apply adjustment
      const currentTrust = model.trustWeight;
      const newTrust = Math.max(0.1, Math.min(1.0, currentTrust + adjustment));
      
      model.trustWeight = newTrust;
      trustHistory.push(newTrust);
      
      // Keep only last 20 trust values
      if (trustHistory.length > 20) {
        trustHistory.shift();
      }
    }
  }

  /**
   * Update model performance tracking
   */
  private updatePerformanceTracking(consensus: ConsensusResult): void {
    for (const vote of consensus.votingDetails) {
      const model = this.models.get(vote.modelId);
      if (!model) continue;

      const performanceEntry = {
        timestamp: Date.now(),
        consensusAgreement: consensus.agreementScore,
        predictionAccuracy: vote.confidence
      };

      model.performanceHistory.push(performanceEntry);
      model.lastUsed = Date.now();

      // Keep only last 50 performance entries
      if (model.performanceHistory.length > 50) {
        model.performanceHistory.shift();
      }
    }
  }

  /**
   * Add new model
   */
  public addModel(model: ModelDescriptor): void {
    this.models.set(model.modelId, model);
    this.trustAdjustmentHistory.set(model.modelId, [model.trustWeight]);
    console.log(`[CrossModelConsensus] Added model ${model.modelId}`);
  }

  /**
   * Remove model
   */
  public removeModel(modelId: string): boolean {
    const removed = this.models.delete(modelId);
    this.trustAdjustmentHistory.delete(modelId);
    
    if (removed) {
      console.log(`[CrossModelConsensus] Removed model ${modelId}`);
    }
    
    return removed;
  }

  /**
   * Get model statistics
   */
  public getModelStatistics(): {
    totalModels: number;
    activeModels: number;
    avgTrustWeight: number;
    modelDistribution: Record<string, number>;
    consensusStats: {
      totalConsensus: number;
      avgAgreementScore: number;
      avgProcessingTime: number;
      consensusMethodDistribution: Record<string, number>;
      decisionDistribution: Record<string, number>;
    };
  } {
    const models = Array.from(this.models.values());
    
    const modelDistribution: Record<string, number> = {};
    let totalTrust = 0;
    let activeCount = 0;

    for (const model of models) {
      modelDistribution[model.status] = (modelDistribution[model.status] || 0) + 1;
      totalTrust += model.trustWeight;
      
      if (model.status === "active") {
        activeCount++;
      }
    }

    const consensusStats = {
      totalConsensus: this.consensusHistory.length,
      avgAgreementScore: this.consensusHistory.length > 0 
        ? this.consensusHistory.reduce((sum, c) => sum + c.agreementScore, 0) / this.consensusHistory.length
        : 0,
      avgProcessingTime: this.consensusHistory.length > 0
        ? this.consensusHistory.reduce((sum, c) => sum + c.processingTime, 0) / this.consensusHistory.length
        : 0,
      consensusMethodDistribution: {} as Record<string, number>,
      decisionDistribution: {} as Record<string, number>
    };

    for (const consensus of this.consensusHistory) {
      consensusStats.consensusMethodDistribution[consensus.consensusMethod] = 
        (consensusStats.consensusMethodDistribution[consensus.consensusMethod] || 0) + 1;
      consensusStats.decisionDistribution[consensus.decision] = 
        (consensusStats.decisionDistribution[consensus.decision] || 0) + 1;
    }

    return {
      totalModels: models.length,
      activeModels: activeCount,
      avgTrustWeight: models.length > 0 ? totalTrust / models.length : 0,
      modelDistribution,
      consensusStats
    };
  }

  /**
   * Get consensus history
   */
  public getConsensusHistory(limit: number = 50): ConsensusResult[] {
    return this.consensusHistory.slice(-limit);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ConsensusConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.models.clear();
    this.trustAdjustmentHistory.clear();
    this.consensusHistory = [];
  }
}

// LLM Rule Integration
export const CROSS_MODEL_CONSENSUS_RULES = {
  NO_SINGLE_MODEL_TRUST: 'Acey does not trust one model — she trusts agreement across models',
  PROTECTION_AGAINST: [
    'Model hallucinations',
    'Fine-tune regressions',
    'Bias drift'
  ],
  DECISION_RULES: {
    ACCEPT: 'agreementScore ≥ 0.7 → accept',
    HEDGE: '0.4–0.7 → hedge language',
    BLOCK: '< 0.4 → block + escalate'
  },
  TRUST_ADJUSTMENT: {
    DISAGREE_CONSENSUS: 'Models that consistently disagree with consensus lose trustWeight',
    PREDICT_CONSENSUS: 'Models that predict consensus gain trustWeight'
  },
  PREFER_CONVERGENCE: 'Prefer outputs that multiple models independently converge on',
  SURFACE_DISSENT: 'Never force agreement — surface dissent when present'
};
