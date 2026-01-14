/**
 * Closed Cognitive Loop Integration
 * Connects all self-awareness systems into a unified architecture
 */

import { MemoryProvenanceManager, MemoryProvenance, MemorySource } from '../memory/provenance';
import { EvaluationManager, EvalCase } from '../evals/evalManager';
import { HallucinationDetector, HallucinationResult, ResponsePolicy } from '../safety/hallucinationDetector';
import { ChatFeedbackProcessor, FeedbackSignal, ReinforcementMetrics } from '../reinforcement/chatFeedback';

export interface CognitiveAction {
  id: string;
  type: "response" | "action" | "memory_creation" | "learning";
  input: string;
  output: string;
  confidence: number;
  timestamp: number;
  context: string;
  modelVersion: string;
}

export interface CognitiveLoopResult {
  action: CognitiveAction;
  provenance: MemoryProvenance;
  hallucinationResult: HallucinationResult;
  responsePolicy: ResponsePolicy;
  evalCases: EvalCase[];
  feedbackSignal?: FeedbackSignal;
  reinforcementMetrics?: ReinforcementMetrics;
  finalOutput: string;
  success: boolean;
  loopTime: number;
}

class ClosedCognitiveLoop {
  private provenanceManager: MemoryProvenanceManager;
  private evaluationManager: EvaluationManager;
  private hallucinationDetector: HallucinationDetector;
  private feedbackProcessor: ChatFeedbackProcessor;
  private modelVersion: string;

  constructor(modelVersion: string = "acey-v1.0") {
    this.modelVersion = modelVersion;
    this.provenanceManager = new MemoryProvenanceManager();
    this.evaluationManager = new EvaluationManager(modelVersion);
    this.hallucinationDetector = new HallucinationDetector();
    this.feedbackProcessor = new ChatFeedbackProcessor();
  }

  /**
   * Process a cognitive action through the complete loop
   */
  async processAction(
    action: Omit<CognitiveAction, "id" | "timestamp" | "modelVersion">,
    parentMemories?: string[],
    chatEvents?: any[]
  ): Promise<CognitiveLoopResult> {
    const startTime = Date.now();

    // Create full action object
    const fullAction: CognitiveAction = {
      ...action,
      id: this.generateActionId(),
      timestamp: startTime,
      modelVersion: this.modelVersion
    };

    try {
      // 1. Create provenance record
      const provenance = this.createProvenance(fullAction, parentMemories);

      // 2. Detect hallucination risk
      const hallucinationResult = await this.detectHallucination(fullAction);

      // 3. Get response policy
      const responsePolicy = this.hallucinationDetector.getResponsePolicy(hallucinationResult);

      // 4. Apply response policy if needed
      const processedOutput = this.applyResponsePolicy(
        fullAction.output,
        responsePolicy,
        hallucinationResult
      );

      // 5. Generate evaluation cases
      const evalCases = await this.generateEvaluationCases(fullAction);

      // 6. Process feedback if available
      let feedbackSignal: FeedbackSignal | undefined;
      let reinforcementMetrics: ReinforcementMetrics | undefined;

      if (chatEvents && chatEvents.length > 0) {
        feedbackSignal = this.feedbackProcessor.processChatEvents(chatEvents, fullAction.id);
        reinforcementMetrics = this.feedbackProcessor.calculateReinforcement(feedbackSignal);

        // Apply reinforcement to memory trust
        this.applyReinforcementToMemory(provenance, reinforcementMetrics);
      }

      // 7. Update action with processed output
      const finalAction = { ...fullAction, output: processedOutput };

      // 8. Store everything in provenance graph
      this.provenanceManager.addMemory(provenance);

      // 9. Add evaluation cases to suite
      if (evalCases.length > 0) {
        const suiteId = this.getOrCreateEvalSuite();
        this.evaluationManager.addCasesToSuite(suiteId, evalCases);
      }

      const loopTime = Date.now() - startTime;

      return {
        action: finalAction,
        provenance,
        hallucinationResult,
        responsePolicy,
        evalCases,
        feedbackSignal,
        reinforcementMetrics,
        finalOutput: processedOutput,
        success: true,
        loopTime
      };

    } catch (error) {
      console.error('Cognitive loop error:', error);
      
      return {
        action: fullAction,
        provenance: this.createProvenance(fullAction, parentMemories),
        hallucinationResult: {
          score: 1.0,
          risk: "high",
          recommendations: ["Error occurred in cognitive loop"],
          signals: {
            confidence: 0,
            memoryMatches: 0,
            contradictionCount: 1
          },
          detectedAt: Date.now()
        },
        responsePolicy: {
          shouldProceed: false,
          shouldHedge: false,
          shouldDefer: true,
          suggestedModifiers: ["I encountered an error"]
        },
        evalCases: [],
        finalOutput: "I encountered an error while processing your request. Please try again.",
        success: false,
        loopTime: Date.now() - startTime
      };
    }
  }

  /**
   * Create provenance record for action
   */
  private createProvenance(
    action: CognitiveAction,
    parentMemories?: string[]
  ): MemoryProvenance {
    const source: MemorySource = this.determineMemorySource(action.context);
    
    return {
      memoryId: action.id,
      source,
      causedBy: parentMemories,
      causedActions: [action.id],
      confidenceAtCreation: action.confidence,
      createdAt: action.timestamp,
      contentHash: this.hashContent(action.output),
      modelVersion: action.modelVersion,
      context: action.context
    };
  }

  /**
   * Determine memory source from context
   */
  private determineMemorySource(context: string): MemorySource {
    if (context.includes("twitch") || context.includes("chat")) return "twitch";
    if (context.includes("system") || context.includes("internal")) return "system";
    if (context.includes("simulation") || context.includes("test")) return "simulation";
    if (context.includes("self") || context.includes("generated")) return "self-generated";
    return "chat";
  }

  /**
   * Detect hallucination in action
   */
  private async detectHallucination(action: CognitiveAction): Promise<HallucinationResult> {
    // Get memory matches for this content
    const memoryMatches = this.countMemoryMatches(action.output);
    
    return this.hallucinationDetector.analyzeContent(
      action.output,
      action.confidence,
      memoryMatches
    );
  }

  /**
   * Count memory matches for content
   */
  private countMemoryMatches(content: string): number {
    // Simplified memory matching - would be more sophisticated
    const keywords = content.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    let matches = 0;
    
    // This would query the actual memory system in practice
    // For now, simulate based on content characteristics
    if (keywords.length > 10) matches += 2;
    if (content.includes("poker") || content.includes("game")) matches += 3;
    if (content.includes("acey")) matches += 1;
    
    return matches;
  }

  /**
   * Apply response policy based on hallucination detection
   */
  private applyResponsePolicy(
    output: string,
    policy: ResponsePolicy,
    hallucinationResult: HallucinationResult
  ): string {
    if (!policy.shouldHedge && !policy.shouldDefer) {
      return output;
    }

    return this.hallucinationDetector.applyResponsePolicy(output, policy);
  }

  /**
   * Generate evaluation cases for action
   */
  private async generateEvaluationCases(action: CognitiveAction): Promise<EvalCase[]> {
    return this.evaluationManager.generateEvalCases({
      input: action.input,
      output: action.output,
      context: action.context,
      confidence: action.confidence
    });
  }

  /**
   * Apply reinforcement to memory trust
   */
  private applyReinforcementToMemory(
    provenance: MemoryProvenance,
    reinforcement: ReinforcementMetrics
  ): void {
    // This would update the actual memory trust scores
    // For now, just log the reinforcement
    console.log(`Applied reinforcement to memory ${provenance.memoryId}:`, reinforcement);
  }

  /**
   * Get or create evaluation suite
   */
  private getOrCreateEvalSuite(): string {
    const suiteName = `auto-generated-${Date.now()}`;
    return this.evaluationManager.createSuite(
      suiteName,
      "Auto-generated evaluation suite from cognitive loop"
    );
  }

  /**
   * Run training gate check
   */
  async runTrainingGate(): Promise<{
    canProceed: boolean;
    reason: string;
    evaluationStatus: any;
    hallucinationStatus: any;
    feedbackStatus: any;
  }> {
    // Check evaluation gate
    const evalGate = this.evaluationManager.getTrainingGateStatus();
    
    if (!evalGate.canProceed) {
      return {
        canProceed: false,
        reason: evalGate.reason,
        evaluationStatus: evalGate,
        hallucinationStatus: this.hallucinationDetector.getStats(),
        feedbackStatus: this.feedbackProcessor.getFeedbackStats()
      };
    }

    // Check hallucination detection status
    const hallucinationStats = this.hallucinationDetector.getStats();
    if (hallucinationStats.averageScore > 0.7) {
      return {
        canProceed: false,
        reason: "High hallucination risk detected",
        evaluationStatus: evalGate,
        hallucinationStatus: hallucinationStats,
        feedbackStatus: this.feedbackProcessor.getFeedbackStats()
      };
    }

    // Check feedback status
    const feedbackStats = this.feedbackProcessor.getFeedbackStats();
    if (feedbackStats.averagePositiveRatio < 0.3) {
      return {
        canProceed: false,
        reason: "Low positive feedback ratio",
        evaluationStatus: evalGate,
        hallucinationStatus: hallucinationStats,
        feedbackStatus: feedbackStats
      };
    }

    return {
      canProceed: true,
      reason: "All cognitive systems healthy",
      evaluationStatus: evalGate,
      hallucinationStatus: hallucinationStats,
      feedbackStatus: feedbackStats
    };
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    provenance: any;
    evaluation: any;
    hallucination: any;
    feedback: any;
    overall: "healthy" | "warning" | "critical";
  } {
    const provenanceStats = this.provenanceManager.getStats();
    const evaluationSummary = this.evaluationManager.getEvaluationSummary();
    const hallucinationStats = this.hallucinationDetector.getStats();
    const feedbackStats = this.feedbackProcessor.getFeedbackStats();

    // Determine overall status
    let overall: "healthy" | "warning" | "critical" = "healthy";

    if (evaluationSummary.averageScore < 0.5 || 
        hallucinationStats.averageScore > 0.7 ||
        feedbackStats.averagePositiveRatio < 0.3) {
      overall = "critical";
    } else if (evaluationSummary.averageScore < 0.7 || 
               hallucinationStats.averageScore > 0.4 ||
               feedbackStats.averagePositiveRatio < 0.5) {
      overall = "warning";
    }

    return {
      provenance: provenanceStats,
      evaluation: evaluationSummary,
      hallucination: hallucinationStats,
      feedback: feedbackStats,
      overall
    };
  }

  /**
   * Find suspicious memory chains
   */
  findSuspiciousChains(): Array<{
    chain: string[];
    reason: string;
    confidence: number;
  }> {
    return this.provenanceManager.findSuspiciousChains();
  }

  /**
   * Rollback problematic memory chains
   */
  rollbackMemoryChain(memoryId: string): void {
    this.provenanceManager.rollbackChain(memoryId);
  }

  /**
   * Clean up old data
   */
  cleanup(): void {
    this.feedbackProcessor.cleanup();
    // Add cleanup for other systems as needed
  }

  /**
   * Generate hash for content integrity
   */
  private hashContent(content: string): string {
    // Simple hash function - would use crypto in production
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { ClosedCognitiveLoop };
