import axios from "axios";
import { AceyInteractionLog, TaskType, PersonaMode, AceyOutput } from "./schema";
import { EnhancedAceyInteractionLog, AudioTaskContext, CodingTaskContext, AudioGenerationResult, CodingGenerationResult, TaskValidationResult, FeedbackData } from "./enhancedSchema";
import { saveLog } from "./llmLogger";
import { filterAceyLogs } from "../filter";
import { PromptTemplates } from "./promptTemplates";
import { TaskHandlers } from "./taskHandlers";

export interface EnhancedOrchestratorOptions {
  llmEndpoint: string;
  personaMode?: PersonaMode;
  autoApprove?: boolean;
  simulationMode?: boolean;
  dryRunMode?: boolean;
  retryAttempts?: number;
  timeout?: number;
  enableAudioGeneration?: boolean;
  enableCodingGeneration?: boolean;
  enableFeedback?: boolean;
}

/**
 * Enhanced Orchestrator with audio and coding capabilities
 */
export class EnhancedAceyOrchestrator {
  private llmEndpoint: string;
  private personaMode: PersonaMode;
  private autoApprove: boolean;
  private simulationMode: boolean;
  private dryRunMode: boolean;
  private retryAttempts: number;
  private timeout: number;
  private enableAudioGeneration: boolean;
  private enableCodingGeneration: boolean;
  private enableFeedback: boolean;

  constructor(options: EnhancedOrchestratorOptions) {
    this.llmEndpoint = options.llmEndpoint;
    this.personaMode = options.personaMode || "neutral";
    this.autoApprove = options.autoApprove ?? true;
    this.simulationMode = options.simulationMode ?? false;
    this.dryRunMode = options.dryRunMode ?? false;
    this.retryAttempts = options.retryAttempts ?? 3;
    this.timeout = options.timeout ?? 30000;
    this.enableAudioGeneration = options.enableAudioGeneration ?? true;
    this.enableCodingGeneration = options.enableCodingGeneration ?? true;
    this.enableFeedback = options.enableFeedback ?? true;
  }

  /**
   * Run an audio generation task
   */
  public async runAudioTask(context: AudioTaskContext): Promise<AudioGenerationResult> {
    if (!this.enableAudioGeneration) {
      throw new Error("Audio generation is disabled");
    }

    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.retryAttempts) {
      try {
        // Generate prompt using templates
        const prompt = PromptTemplates.getAudioPrompt(context);
        
        // Call LLM
        const llmResponse = await this.callLLM(prompt, context, "audio");
        const llmOutput = llmResponse.data.text || llmResponse.data.content || '';

        // Handle audio generation
        const result = await TaskHandlers.handleAudioGeneration(context, llmOutput);

        // Validate the result
        const validation = await TaskHandlers.validateTask("audio", context, result);

        // Log the interaction
        const log: EnhancedAceyInteractionLog = {
          taskType: "audio",
          timestamp: new Date().toISOString(),
          context: {
            ...context,
            environment: this.simulationMode ? "simulation" : "live",
            attempt: attempt + 1
          },
          llmPrompt: prompt,
          llmOutput,
          aceyOutput: {
            speech: `Generated ${context.type} audio: ${llmOutput.substring(0, 100)}...`,
            intents: [{
              type: "audio_generation",
              confidence: result.metadata.confidence || 0.8,
              audioType: context.type,
              mood: context.mood
            }]
          },
          controlDecision: validation.finalDecision?.approved ? "approved" : "rejected",
          finalAction: validation.finalDecision?.approved ? "Audio generated" : "Audio generation rejected",
          trustDelta: validation.finalDecision?.approved ? 0.1 : -0.1,
          personaMode: this.personaMode,
          performance: {
            responseTime: Date.now() - startTime,
            tokenCount: this.estimateTokens(prompt + llmOutput),
            cost: this.calculateCost(prompt + llmOutput)
          },
          taskContext: context,
          taskResult: result,
          validation: validation,
          metadata: {
            model: "acey-enhanced",
            taskCategory: "audio",
            complexity: this.getComplexity(context)
          }
        };

        await saveLog(log);
        return result;

      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.retryAttempts) {
          console.warn(`Audio task attempt ${attempt} failed, retrying...`, error);
          await this.delay(1000 * attempt);
        } else {
          console.error(`All ${this.retryAttempts} audio task attempts failed:`, error);
          throw lastError;
        }
      }
    }

    throw lastError || new Error("Audio task failed");
  }

  /**
   * Run a coding generation task
   */
  public async runCodingTask(context: CodingTaskContext): Promise<CodingGenerationResult> {
    if (!this.enableCodingGeneration) {
      throw new Error("Coding generation is disabled");
    }

    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.retryAttempts) {
      try {
        // Generate prompt using templates
        const prompt = PromptTemplates.getCodingPrompt(context);
        
        // Call LLM
        const llmResponse = await this.callLLM(prompt, context, "coding");
        const llmOutput = llmResponse.data.text || llmResponse.data.content || '';

        // Handle code generation
        const result = await TaskHandlers.handleCodingGeneration(context, llmOutput);

        // Validate the result
        const validation = await TaskHandlers.validateTask("coding", context, result);

        // Log the interaction
        const log: EnhancedAceyInteractionLog = {
          taskType: "coding",
          timestamp: new Date().toISOString(),
          context: {
            ...context,
            environment: this.simulationMode ? "simulation" : "live",
            attempt: attempt + 1
          },
          llmPrompt: prompt,
          llmOutput,
          aceyOutput: {
            speech: `Generated ${context.language} code: ${context.description}`,
            intents: [{
              type: "code_generation",
              confidence: result.metadata.confidence || 0.8,
              language: context.language,
              framework: context.framework
            }]
          },
          controlDecision: validation.finalDecision?.approved ? "approved" : "rejected",
          finalAction: validation.finalDecision?.approved ? "Code generated" : "Code generation rejected",
          trustDelta: validation.finalDecision?.approved ? 0.1 : -0.1,
          personaMode: this.personaMode,
          performance: {
            responseTime: Date.now() - startTime,
            tokenCount: this.estimateTokens(prompt + llmOutput),
            cost: this.calculateCost(prompt + llmOutput)
          },
          taskContext: context,
          taskResult: result,
          validation: validation,
          metadata: {
            model: "acey-enhanced",
            taskCategory: "coding",
            complexity: this.getComplexity(context)
          }
        };

        await saveLog(log);
        return result;

      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.retryAttempts) {
          console.warn(`Coding task attempt ${attempt} failed, retrying...`, error);
          await this.delay(1000 * attempt);
        } else {
          console.error(`All ${this.retryAttempts} coding task attempts failed:`, error);
          throw lastError;
        }
      }
    }

    throw lastError || new Error("Coding task failed");
  }

  /**
   * Submit feedback for a completed task
   */
  public async submitFeedback(taskId: string, feedback: FeedbackData): Promise<void> {
    if (!this.enableFeedback) {
      throw new Error("Feedback is disabled");
    }

    try {
      // Process the feedback
      await TaskHandlers.processFeedback(feedback);

      // Apply adaptations to orchestrator
      this.applyFeedbackAdaptations(feedback);

      console.log(`[FEEDBACK] Feedback processed for task ${taskId}`);
    } catch (error) {
      console.error(`[FEEDBACK] Failed to process feedback for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get task-specific statistics
   */
  public async getTaskStatistics(): Promise<{
    audio: { total: number; approved: number; rejected: number; avgConfidence: number };
    coding: { total: number; approved: number; rejected: number; avgConfidence: number };
    overall: { total: number; successRate: number; avgResponseTime: number };
  }> {
    try {
      // This would query the logging database for statistics
      // For now, return mock data
      return {
        audio: {
          total: 0,
          approved: 0,
          rejected: 0,
          avgConfidence: 0
        },
        coding: {
          total: 0,
          approved: 0,
          rejected: 0,
          avgConfidence: 0
        },
        overall: {
          total: 0,
          successRate: 0,
          avgResponseTime: 0
        }
      };
    } catch (error) {
      console.error("Failed to get task statistics:", error);
      throw error;
    }
  }

  /**
   * Apply feedback adaptations to orchestrator
   */
  private applyFeedbackAdaptations(feedback: FeedbackData): void {
    // Adjust persona mode based on feedback
    if (feedback.adaptation.moodAdjustment) {
      this.personaMode = feedback.adaptation.moodAdjustment as PersonaMode;
    }

    // Adjust auto-approval based on success rate
    if (feedback.adaptation.confidenceAdjustment < 0) {
      this.autoApprove = false; // Be more conservative after negative feedback
    }

    console.log(`[ADAPTATION] Updated persona mode to: ${this.personaMode}`);
    console.log(`[ADAPTATION] Updated auto-approve to: ${this.autoApprove}`);
  }

  /**
   * Call LLM with proper error handling
   */
  private async callLLM(prompt: string, context: any, taskType: string) {
    const payload = {
      prompt,
      context: {
        ...context,
        taskType,
        personaMode: this.personaMode
      },
      model: "acey-enhanced",
      temperature: this.getTemperatureForTask(taskType),
      max_tokens: this.getMaxTokensForTask(taskType)
    };

    const response = await axios.post(this.llmEndpoint, payload, {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Task-Type': taskType,
        'X-Persona-Mode': this.personaMode
      }
    });

    return response;
  }

  /**
   * Get temperature for task type
   */
  private getTemperatureForTask(taskType: string): number {
    const temperatures: Record<string, number> = {
      audio: 0.7,      // More creative for audio
      coding: 0.3,     // More conservative for code
      game: 0.8,       // More creative for game
      website: 0.3,    // Conservative for website
      graphics: 0.6,  // Moderate for graphics
      moderation: 0.1  // Very conservative for moderation
    };
    
    return temperatures[taskType] || 0.5;
  }

  /**
   * Get max tokens for task type
   */
  private getMaxTokensForTask(taskType: string): number {
    const tokenLimits: Record<string, number> = {
      audio: 200,      // Descriptive text for audio
      coding: 500,     // More tokens for code
      game: 150,       // Short commentary
      website: 300,    // Detailed responses
      graphics: 200,  // Descriptive text
      moderation: 50   // Brief decisions
    };
    
    return tokenLimits[taskType] || 200;
  }

  /**
   * Get complexity level for context
   */
  private getComplexity(context: AudioTaskContext | CodingTaskContext): "simple" | "medium" | "complex" {
    // Simple complexity logic - can be enhanced
    if ('maxLines' in context && context.maxLines && context.maxLines < 20) {
      return "simple";
    }
    if ('lengthSeconds' in context && context.lengthSeconds && context.lengthSeconds < 5) {
      return "simple";
    }
    if ('dependencies' in context && context.dependencies && context.dependencies.length > 3) {
      return "complex";
    }
    return "medium";
  }

  /**
   * Estimate tokens
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost
   */
  private calculateCost(text: string): number {
    const tokens = this.estimateTokens(text);
    return (tokens / 1000) * 0.00002; // $0.02 per 1K tokens
  }

  /**
   * Delay for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get orchestrator statistics
   */
  public getStats() {
    return {
      llmEndpoint: this.llmEndpoint,
      personaMode: this.personaMode,
      autoApprove: this.autoApprove,
      simulationMode: this.simulationMode,
      dryRunMode: this.dryRunMode,
      retryAttempts: this.retryAttempts,
      timeout: this.timeout,
      enableAudioGeneration: this.enableAudioGeneration,
      enableCodingGeneration: this.enableCodingGeneration,
      enableFeedback: this.enableFeedback
    };
  }

  /**
   * Update orchestrator configuration
   */
  public updateConfig(newConfig: Partial<EnhancedOrchestratorOptions>) {
    if (newConfig.personaMode) this.personaMode = newConfig.personaMode;
    if (newConfig.autoApprove !== undefined) this.autoApprove = newConfig.autoApprove;
    if (newConfig.simulationMode !== undefined) this.simulationMode = newConfig.simulationMode;
    if (newConfig.dryRunMode !== undefined) this.dryRunMode = newConfig.dryRunMode;
    if (newConfig.retryAttempts !== undefined) this.retryAttempts = newConfig.retryAttempts;
    if (newConfig.timeout !== undefined) this.timeout = newConfig.timeout;
    if (newConfig.enableAudioGeneration !== undefined) this.enableAudioGeneration = newConfig.enableAudioGeneration;
    if (newConfig.enableCodingGeneration !== undefined) this.enableCodingGeneration = newConfig.enableCodingGeneration;
    if (newConfig.enableFeedback !== undefined) this.enableFeedback = newConfig.enableFeedback;
  }
}
