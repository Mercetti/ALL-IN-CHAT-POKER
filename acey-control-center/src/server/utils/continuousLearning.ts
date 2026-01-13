// File: src/server/utils/continuousLearning.ts

import fs from "fs";
import path from "path";
import { TaskType, AceyOutput, DatasetStats } from "./schema";
import { RealTimeFineTune } from "./realtimeFineTune";
import { AudioCodingOrchestrator } from "./audioCodingOrchestrator";

interface LearningOptions {
  fineTuneOptions: {
    datasetDir?: string;
    batchSize?: number;
    fineTuneEndpoint: string;
    apiKey: string;
    adaptiveBatchSize?: boolean;
    minConfidence?: number;
    maxQueueSize?: number;
    retryAttempts?: number;
    timeout?: number;
  };
  learningRate?: number;
  feedbackThreshold?: number;
  enableAutoApproval?: boolean;
  simulationValidation?: boolean;
  crossTaskLearning?: boolean;
}

interface LearningMetrics {
  totalOutputs: number;
  approvedOutputs: number;
  rejectedOutputs: number;
  fineTuneJobs: number;
  successRate: number;
  avgConfidence: number;
  avgTrust: number;
  taskPerformance: Record<TaskType, {
    outputs: number;
    approved: number;
    avgConfidence: number;
    avgTrust: number;
    lastFineTune?: string;
  }>;
  lastUpdated: string;
}

interface FeedbackData {
  taskId: string;
  taskType: TaskType;
  timestamp: string;
  approved: boolean;
  confidence: number;
  feedback: {
    userRating?: number;
    engagementMetrics?: any;
    qualityMetrics?: any;
    errorCorrection?: string;
  };
  adaptation: {
    trustDelta: number;
    confidenceAdjustment: number;
    moodAdjustment?: string;
  };
}

/**
 * Continuous Learning Loop
 * Integrates with AudioCodingOrchestrator and RealTimeFineTune for self-evolving Acey
 */
export class ContinuousLearningLoop {
  private fineTuneManager: RealTimeFineTune;
  private orchestrator: AudioCodingOrchestrator;
  private learningRate: number;
  private feedbackThreshold: number;
  private enableAutoApproval: boolean;
  private simulationValidation: boolean;
  private crossTaskLearning: boolean;
  
  private metrics: LearningMetrics;
  private feedbackHistory: FeedbackData[] = [];
  private learningDataPath: string;

  constructor(
    orchestrator: AudioCodingOrchestrator,
    options: LearningOptions
  ) {
    this.orchestrator = orchestrator;
    this.fineTuneManager = new RealTimeFineTune(options.fineTuneOptions);
    this.learningRate = options.learningRate ?? 0.1;
    this.feedbackThreshold = options.feedbackThreshold ?? 0.7;
    this.enableAutoApproval = options.enableAutoApproval ?? true;
    this.simulationValidation = options.simulationValidation ?? true;
    this.crossTaskLearning = options.crossTaskLearning ?? true;
    
    this.learningDataPath = path.join(options.fineTuneOptions.datasetDir || "./data/dataset", "learning_metrics.json");
    
    // Initialize metrics
    this.metrics = this.loadMetrics();
    
    console.log(`[ContinuousLearning] Initialized with learning rate: ${this.learningRate}`);
  }

  /**
   * Process an output from the orchestrator
   */
  public async processOutput(
    taskType: TaskType,
    prompt: string,
    output: AceyOutput,
    context: any,
    approved?: boolean,
    confidence: number = 0.8
  ): Promise<{
    processed: boolean;
    fineTuneJobId?: string;
    learningUpdate: boolean;
    metrics: LearningMetrics;
  }> {
    const startTime = Date.now();
    
    try {
      // Update metrics
      this.updateMetrics(taskType, approved, confidence);
      
      // Auto-approval logic
      const finalApproved = this.determineApproval(approved, confidence, output);
      
      if (!finalApproved) {
        console.log(`[ContinuousLearning] Output rejected for ${taskType} (confidence: ${confidence})`);
        return {
          processed: false,
          learningUpdate: false,
          metrics: this.metrics
        };
      }

      // Simulation validation if enabled
      if (this.simulationValidation) {
        const validationPassed = await this.validateOutput(taskType, output, context);
        if (!validationPassed) {
          console.log(`[ContinuousLearning] Output failed simulation validation for ${taskType}`);
          return {
            processed: false,
            learningUpdate: false,
            metrics: this.metrics
          };
        }
      }

      // Queue for fine-tuning
      const fineTuneJobId = await this.fineTuneManager.queueApprovedOutput(
        taskType,
        prompt,
        output,
        confidence,
        context
      );

      // Cross-task learning if enabled
      if (this.crossTaskLearning) {
        await this.processCrossTaskLearning(taskType, output, context);
      }

      // Update orchestrator based on learning
      this.updateOrchestratorLearning(taskType, confidence, finalApproved);

      console.log(`[ContinuousLearning] Processed ${taskType} output (job: ${fineTuneJobId})`);

      return {
        processed: true,
        fineTuneJobId,
        learningUpdate: true,
        metrics: this.metrics
      };

    } catch (error) {
      console.error(`[ContinuousLearning] Error processing output:`, error);
      return {
        processed: false,
        learningUpdate: false,
        metrics: this.metrics
      };
    } finally {
      // Save metrics
      this.saveMetrics();
      
      const processingTime = Date.now() - startTime;
      console.log(`[ContinuousLearning] Processing completed in ${processingTime}ms`);
    }
  }

  /**
   * Process feedback for continuous learning
   */
  public async processFeedback(feedback: FeedbackData): Promise<{
    processed: boolean;
    adaptations: string[];
    metrics: LearningMetrics;
  }> {
    try {
      // Store feedback
      this.feedbackHistory.push(feedback);
      
      // Analyze feedback patterns
      const adaptations = this.analyzeFeedback(feedback);
      
      // Apply adaptations
      await this.applyFeedbackAdaptations(feedback, adaptations);
      
      // Update metrics based on feedback
      this.updateMetricsFromFeedback(feedback);
      
      console.log(`[ContinuousLearning] Processed feedback for ${feedback.taskType}: ${adaptations.join(", ")}`);

      return {
        processed: true,
        adaptations,
        metrics: this.metrics
      };

    } catch (error) {
      console.error(`[ContinuousLearning] Error processing feedback:`, error);
      return {
        processed: false,
        adaptations: [],
        metrics: this.metrics
      };
    }
  }

  /**
   * Run a batch learning cycle
   */
  public async runBatchLearningCycle(
    tasks: Array<{
      taskType: TaskType;
      prompt: string;
      context: any;
    }>
  ): Promise<{
    results: any[];
    learningSummary: {
      processed: number;
      approved: number;
      fineTuneJobs: string[];
      avgConfidence: number;
    };
  }> {
    console.log(`[ContinuousLearning] Starting batch learning cycle with ${tasks.length} tasks`);
    
    const startTime = Date.now();
    const results = [];
    const fineTuneJobs: string[] = [];
    let totalConfidence = 0;
    let approvedCount = 0;

    // Process tasks in batches
    const batchSize = 5;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (task) => {
        try {
          const output = await this.orchestrator.runTask(task.taskType, task.prompt, task.context);
          const confidence = this.calculateConfidence(output);
          
          const result = await this.processOutput(
            task.taskType,
            task.prompt,
            output,
            task.context,
            undefined, // Let system determine approval
            confidence
          );
          
          if (result.processed && result.fineTuneJobId) {
            fineTuneJobs.push(result.fineTuneJobId);
          }
          
          if (result.processed) {
            approvedCount++;
            totalConfidence += confidence;
          }
          
          return { task, output, result };
          
        } catch (error) {
          console.error(`[ContinuousLearning] Batch task failed:`, error);
          return { task, error };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const avgConfidence = approvedCount > 0 ? totalConfidence / approvedCount : 0;
    const processingTime = Date.now() - startTime;

    console.log(`[ContinuousLearning] Batch cycle completed in ${processingTime}ms`);
    console.log(`[ContinuousLearning] Processed: ${approvedCount}/${tasks.length}, Jobs: ${fineTuneJobs.length}`);

    return {
      results,
      learningSummary: {
        processed: approvedCount,
        approved: approvedCount,
        fineTuneJobs,
        avgConfidence
      }
    };
  }

  /**
   * Get learning metrics and statistics
   */
  public getLearningStats(): {
    metrics: LearningMetrics;
    fineTuneStats: any;
    feedbackStats: any;
    recommendations: string[];
  } {
    const fineTuneStats = this.fineTuneManager.getStats();
    const feedbackStats = this.analyzeFeedbackHistory();
    const recommendations = this.generateRecommendations();

    return {
      metrics: this.metrics,
      fineTuneStats,
      feedbackStats,
      recommendations
    };
  }

  /**
   * Private helper methods
   */

  private determineApproval(
    manualApproval?: boolean,
    confidence: number,
    output: AceyOutput
  ): boolean {
    // Use manual approval if provided
    if (manualApproval !== undefined) {
      return manualApproval;
    }

    // Auto-approval logic
    if (!this.enableAutoApproval) {
      return false;
    }

    // Check confidence threshold
    if (confidence < this.feedbackThreshold) {
      return false;
    }

    // Check output quality
    if (!output.speech || output.speech.length < 10) {
      return false;
    }

    // Check intents
    if (!output.intents || output.intents.length === 0) {
      return false;
    }

    return true;
  }

  private async validateOutput(taskType: TaskType, output: AceyOutput, context: any): Promise<boolean> {
    try {
      // Task-specific validation
      switch (taskType) {
        case "coding":
          return this.validateCodingOutput(output, context);
        case "audio":
          return this.validateAudioOutput(output, context);
        default:
          return this.validateGeneralOutput(output, context);
      }
    } catch (error) {
      console.error(`[ContinuousLearning] Validation error:`, error);
      return false;
    }
  }

  private validateCodingOutput(output: AceyOutput, context: any): boolean {
    // Extract code from output
    const codeMatch = output.speech.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : output.speech;
    
    // Basic validation
    if (code.length < 20) return false;
    
    // Check for dangerous patterns
    const dangerousPatterns = [/eval\s*\(/, /Function\s*\(/, /exec\s*\(/];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) return false;
    }
    
    return true;
  }

  private validateAudioOutput(output: AceyOutput, context: any): boolean {
    // Audio validation would check file existence, format, etc.
    // For now, just check if output seems reasonable
    return output.speech.length > 5 && output.speech.length < 500;
  }

  private validateGeneralOutput(output: AceyOutput, context: any): boolean {
    return output.speech.length > 10 && output.speech.length < 1000;
  }

  private async processCrossTaskLearning(taskType: TaskType, output: AceyOutput, context: any): Promise<void> {
    // Find related task types for cross-learning
    const relatedTasks = this.getRelatedTaskTypes(taskType);
    
    for (const relatedTask of relatedTasks) {
      // Create cross-task learning entry
      const crossTaskPrompt = this.generateCrossTaskPrompt(taskType, relatedTask, output, context);
      
      // Queue with lower priority
      await this.fineTuneManager.queueApprovedOutput(
        relatedTask,
        crossTaskPrompt,
        output,
        0.6, // Lower confidence for cross-task
        { ...context, crossTaskSource: taskType }
      );
    }
  }

  private getRelatedTaskTypes(taskType: TaskType): TaskType[] {
    const relationships: Record<TaskType, TaskType[]> = {
      audio: ["game", "moderation"],
      coding: ["website", "game"],
      game: ["audio", "coding"],
      website: ["coding", "graphics"],
      graphics: ["website", "game"],
      moderation: ["audio", "trust"],
      memory: ["persona", "trust"],
      trust: ["moderation", "memory"],
      persona: ["memory", "audio"]
    };
    
    return relationships[taskType] || [];
  }

  private generateCrossTaskPrompt(sourceTask: TaskType, targetTask: TaskType, output: AceyOutput, context: any): string {
    return `Cross-task learning from ${sourceTask} to ${targetTask}. Source output: ${output.speech}. Context: ${JSON.stringify(context)}. Generate similar output for ${targetTask} context.`;
  }

  private updateOrchestratorLearning(taskType: TaskType, confidence: number, approved: boolean): void {
    // Update orchestrator configuration based on learning
    if (approved && confidence > 0.9) {
      // High confidence approved output - can be more permissive
      // This would update the orchestrator's auto-approval thresholds
    } else if (!approved || confidence < 0.5) {
      // Low confidence or rejected - be more conservative
      // This would update the orchestrator's validation rules
    }
  }

  private calculateConfidence(output: AceyOutput): number {
    // Calculate confidence based on output characteristics
    let confidence = 0.5; // Base confidence
    
    // Length factor
    if (output.speech.length > 50 && output.speech.length < 500) {
      confidence += 0.1;
    }
    
    // Intents factor
    if (output.intents && output.intents.length > 0) {
      confidence += 0.1;
      const avgIntentConfidence = output.intents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / output.intents.length;
      confidence += avgIntentConfidence * 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private updateMetrics(taskType: TaskType, approved?: boolean, confidence: number = 0.8): void {
    this.metrics.totalOutputs++;
    
    if (approved) {
      this.metrics.approvedOutputs++;
    } else if (approved === false) {
      this.metrics.rejectedOutputs++;
    }
    
    // Update task-specific metrics
    if (!this.metrics.taskPerformance[taskType]) {
      this.metrics.taskPerformance[taskType] = {
        outputs: 0,
        approved: 0,
        avgConfidence: 0
      };
    }
    
    const taskMetrics = this.metrics.taskPerformance[taskType];
    taskMetrics.outputs++;
    
    if (approved) {
      taskMetrics.approved++;
    }
    
    // Update average confidence
    taskMetrics.avgConfidence = (taskMetrics.avgConfidence * (taskMetrics.outputs - 1) + confidence) / taskMetrics.outputs;
    
    // Update overall success rate
    this.metrics.successRate = this.metrics.approvedOutputs / this.metrics.totalOutputs;
    this.metrics.avgConfidence = (this.metrics.avgConfidence * (this.metrics.totalOutputs - 1) + confidence) / this.metrics.totalOutputs;
    
    this.metrics.lastUpdated = new Date().toISOString();
  }

  private updateMetricsFromFeedback(feedback: FeedbackData): void {
    // Update metrics based on feedback
    if (feedback.feedback.userRating) {
      const rating = feedback.feedback.userRating;
      if (rating >= 4) {
        // Positive feedback - increase confidence in similar outputs
        this.metrics.avgConfidence += 0.01;
      } else if (rating <= 2) {
        // Negative feedback - decrease confidence
        this.metrics.avgConfidence -= 0.02;
      }
    }
  }

  private analyzeFeedback(feedback: FeedbackData): string[] {
    const adaptations: string[] = [];
    
    // Analyze feedback patterns
    if (feedback.feedback.userRating && feedback.feedback.userRating < 3) {
      adaptations.push("increase_validation_strictness");
    }
    
    if (feedback.feedback.engagementMetrics?.lowEngagement) {
      adaptations.push("adjust_content_style");
    }
    
    if (feedback.feedback.qualityMetrics?.lowQuality) {
      adaptations.push("improve_output_quality");
    }
    
    if (feedback.adaptation.trustDelta < -0.1) {
      adaptations.push("reduce_auto_approval");
    }
    
    return adaptations;
  }

  private async applyFeedbackAdaptations(feedback: FeedbackData, adaptations: string[]): Promise<void> {
    for (const adaptation of adaptations) {
      switch (adaptation) {
        case "increase_validation_strictness":
          this.feedbackThreshold = Math.min(this.feedbackThreshold + 0.05, 0.9);
          break;
        case "adjust_content_style":
          // Would update orchestrator's persona/style settings
          break;
        case "improve_output_quality":
          // Would update quality requirements
          break;
        case "reduce_auto_approval":
          this.enableAutoApproval = false;
          break;
      }
    }
  }

  private analyzeFeedbackHistory(): any {
    const recentFeedback = this.feedbackHistory.slice(-100); // Last 100 feedback entries
    
    return {
      total: this.feedbackHistory.length,
      recent: recentFeedback.length,
      avgRating: recentFeedback.reduce((sum, f) => sum + (f.feedback.userRating || 0), 0) / recentFeedback.length,
      commonIssues: this.identifyCommonIssues(recentFeedback),
      improvementTrends: this.analyzeImprovementTrends(recentFeedback)
    };
  }

  private identifyCommonIssues(feedback: FeedbackData[]): string[] {
    const issues: string[] = [];
    
    // Analyze common patterns in feedback
    const lowRatings = feedback.filter(f => (f.feedback.userRating || 0) < 3);
    const errorCorrections = feedback.filter(f => f.feedback.errorCorrection);
    
    if (lowRatings.length > feedback.length * 0.3) {
      issues.push("high_low_ratings");
    }
    
    if (errorCorrections.length > feedback.length * 0.2) {
      issues.push("frequent_corrections");
    }
    
    return issues;
  }

  private analyzeImprovementTrends(feedback: FeedbackData[]): string[] {
    // Analyze if feedback is improving over time
    const recent = feedback.slice(-20);
    const older = feedback.slice(-40, -20);
    
    const recentAvg = recent.reduce((sum, f) => sum + (f.feedback.userRating || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, f) => sum + (f.feedback.userRating || 0), 0) / older.length;
    
    const trends: string[] = [];
    
    if (recentAvg > olderAvg + 0.5) {
      trends.push("improving");
    } else if (recentAvg < olderAvg - 0.5) {
      trends.push("declining");
    } else {
      trends.push("stable");
    }
    
    return trends;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Generate recommendations based on metrics
    if (this.metrics.successRate < 0.7) {
      recommendations.push("Consider increasing validation thresholds");
    }
    
    if (this.metrics.avgConfidence < 0.6) {
      recommendations.push("Review prompt templates and context");
    }
    
    const fineTuneStats = this.fineTuneManager.getStats();
    if (fineTuneStats.queue.total > 50) {
      recommendations.push("Consider flushing fine-tune queue");
    }
    
    return recommendations;
  }

  private loadMetrics(): LearningMetrics {
    try {
      if (fs.existsSync(this.learningDataPath)) {
        const data = fs.readFileSync(this.learningDataPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[ContinuousLearning] Failed to load metrics:', error);
    }
    
    // Return default metrics
    return {
      totalOutputs: 0,
      approvedOutputs: 0,
      rejectedOutputs: 0,
      fineTuneJobs: 0,
      successRate: 0,
      avgConfidence: 0,
      taskPerformance: {} as Record<TaskType, any>,
      lastUpdated: new Date().toISOString()
    };
  }

  private saveMetrics(): void {
    try {
      fs.writeFileSync(this.learningDataPath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('[ContinuousLearning] Failed to save metrics:', error);
    }
  }

  /**
   * Public utility methods
   */

  public async forceFlush(): Promise<string[]> {
    return await this.fineTuneManager.flushQueue();
  }

  public updateLearningConfig(config: Partial<LearningOptions>): void {
    if (config.learningRate !== undefined) this.learningRate = config.learningRate;
    if (config.feedbackThreshold !== undefined) this.feedbackThreshold = config.feedbackThreshold;
    if (config.enableAutoApproval !== undefined) this.enableAutoApproval = config.enableAutoApproval;
    if (config.simulationValidation !== undefined) this.simulationValidation = config.simulationValidation;
    if (config.crossTaskLearning !== undefined) this.crossTaskLearning = config.crossTaskLearning;
  }

  public clearLearningData(): void {
    this.metrics = this.loadMetrics();
    this.feedbackHistory = [];
    this.fineTuneManager.clearAll();
  }
}
