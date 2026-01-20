// File: src/server/utils/orchestrator.ts

import axios from "axios";
import { AceyInteractionLog, TaskType, PersonaMode, AceyOutput, TaskDefinition, BatchResult } from "./schema";
import { saveLog } from "./llmLogger";
import { filterAceyLogs } from "../filter";

export interface OrchestratorOptions {
  llmEndpoint: string;           // 3rd-party LLM endpoint
  personaMode?: PersonaMode;     // Default persona mode
  autoApprove?: boolean;         // Whether to auto-approve filtered outputs
  simulationMode?: boolean;      // If true, do not execute final actions
  dryRunMode?: boolean;          // If true, apply rules but don't execute
  retryAttempts?: number;        // Number of retry attempts for failed LLM calls
  timeout?: number;             // Request timeout in milliseconds
}

/**
 * Main orchestrator class for multi-task Helm Control
 */
export class HelmOrchestrator {
  private llmEndpoint: string;
  private personaMode: PersonaMode;
  private autoApprove: boolean;
  private simulationMode: boolean;
  private dryRunMode: boolean;
  private retryAttempts: number;
  private timeout: number;

  constructor(options: OrchestratorOptions) {
    this.llmEndpoint = options.llmEndpoint;
    this.personaMode = options.personaMode || "neutral";
    this.autoApprove = options.autoApprove ?? true;
    this.simulationMode = options.simulationMode ?? false;
    this.dryRunMode = options.dryRunMode ?? false;
    this.retryAttempts = options.retryAttempts ?? 3;
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Run a task through the orchestrator
   */
  public async runTask(
    taskType: TaskType,
    prompt: string,
    context: any
  ): Promise<AceyOutput> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    // Retry logic for LLM calls
    while (attempt < this.retryAttempts) {
      try {
        // 1️⃣ Call LLM with retry logic
        const llmResponse = await this.callLLM(prompt, context, taskType);
        const llmText: string = llmResponse.data.text || llmResponse.data.content || '';
        const llmIntents = llmResponse.data.intents || [];

        // 2️⃣ Build Acey output
        const aceyOutput: AceyOutput = {
          speech: llmText,
          intents: llmIntents
        };

        // 3️⃣ Build full interaction log
        const log: AceyInteractionLog = {
          taskType,
          timestamp: new Date().toISOString(),
          context: {
            ...context,
            environment: this.simulationMode ? "simulation" : "live",
            attempt: attempt + 1
          },
          llmPrompt: prompt,
          llmOutput: llmText,
          aceyOutput,
          controlDecision: "rejected", // default
          finalAction: null,
          trustDelta: 0,
          personaMode: this.personaMode,
          performance: {
            responseTime: Date.now() - startTime,
            tokenCount: this.estimateTokens(prompt + llmText),
            cost: this.calculateCost(prompt + llmText)
          }
        };

        // 4️⃣ Apply auto-rules / filtering
        const passesFilter = filterAceyLogs(log);

        if (passesFilter && this.autoApprove) {
          log.controlDecision = "approved";
        } else if (!passesFilter) {
          log.controlDecision = "rejected";
          log.finalAction = "Auto-rule rejection";
        } else if (!this.autoApprove) {
          log.controlDecision = "pending";
          log.finalAction = "Manual approval required";
        }

        // 5️⃣ Log interaction
        await saveLog(log);

        // 6️⃣ Simulation mode handling
        if (this.simulationMode || this.dryRunMode) {
          const mode = this.simulationMode ? "Simulation" : "Dry-run";
          console.log(`[${mode}] Task processed, no execution performed`);
          console.log(`  Decision: ${log.controlDecision}`);
          console.log(`  Speech: ${aceyOutput.speech.substring(0, 100)}...`);
          return aceyOutput;
        }

        // 7️⃣ Execute task only if approved
        if (log.controlDecision === "approved") {
          log.finalAction = await this.executeTask(taskType, aceyOutput, context);
          
          // Update log with finalAction
          await saveLog(log);
        }

        return aceyOutput;

      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.retryAttempts) {
          console.warn(`LLM call attempt ${attempt} failed, retrying...`, error);
          await this.delay(1000 * attempt); // Exponential backoff
        } else {
          console.error(`All ${this.retryAttempts} attempts failed for task ${taskType}:`, error);
          
          // Log the failure
          const failureLog: AceyInteractionLog = {
            taskType,
            timestamp: new Date().toISOString(),
            context: { ...context, environment: this.simulationMode ? "simulation" : "live" },
            llmPrompt: prompt,
            llmOutput: `ERROR: ${lastError.message}`,
            aceyOutput: { speech: "Error occurred", intents: [] },
            controlDecision: "rejected",
            finalAction: "LLM call failed",
            trustDelta: 0,
            personaMode: this.personaMode,
            performance: {
              responseTime: Date.now() - startTime,
              tokenCount: 0,
              cost: 0
            }
          };
          
          await saveLog(failureLog);
          throw lastError;
        }
      }
    }

    throw lastError || new Error("Unknown error in task execution");
  }

  /**
   * Call LLM with proper error handling and timeout
   */
  private async callLLM(prompt: string, context: any, taskType: TaskType) {
    const payload = {
      prompt,
      context: {
        ...context,
        taskType,
        personaMode: this.personaMode
      },
      model: "acey-multi-task",
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
   * Get appropriate temperature for task type
   */
  private getTemperatureForTask(taskType: TaskType): number {
    const temperatures: Record<TaskType, number> = {
      game: 0.8,        // More creative for game commentary
      website: 0.3,     // More conservative for website tasks
      graphics: 0.6,   // Moderate for creative tasks
      audio: 0.7,       // Creative for audio generation
      images: 0.8,      // Creative for image generation
      moderation: 0.1,  // Very conservative for moderation
      memory: 0.4,      // Moderate for memory tasks
      trust: 0.2,        // Conservative for trust calculations
      persona: 0.5,      // Balanced for persona decisions
      coding: 0.3       // Conservative for code generation
    };
    
    return temperatures[taskType] || 0.5;
  }

  /**
   * Get appropriate max tokens for task type
   */
  private getMaxTokensForTask(taskType: TaskType): number {
    const tokenLimits: Record<TaskType, number> = {
      game: 150,         // Short commentary
      website: 300,      // Detailed responses
      graphics: 200,    // Descriptive text
      audio: 100,        // Short descriptions
      images: 150,       // Image descriptions
      moderation: 50,    // Brief decisions
      memory: 100,       // Concise summaries
      trust: 50,         // Simple calculations
      persona: 75,       // Brief decisions
      coding: 500        // More tokens for code generation
    };
    
    return tokenLimits[taskType] || 150;
  }

  /**
   * Placeholder task execution - integrate with your website/game/assets
   */
  private async executeTask(taskType: TaskType, output: AceyOutput, context: any): Promise<any> {
    console.log(`[EXECUTE] ${taskType} task: ${output.speech.substring(0, 50)}...`);
    
    switch (taskType) {
      case "game":
        // Send speech/intents to game engine
        return await this.executeGameTask(output, context);
      case "website":
        // Apply website fixes or suggestions
        return await this.executeWebsiteTask(output, context);
      case "graphics":
        // Trigger graphics/cosmetic generation
        return await this.executeGraphicsTask(output, context);
      case "audio":
        // Trigger audio generation
        return await this.executeAudioTask(output, context);
      case "images":
        // Trigger image generation
        return await this.executeImagesTask(output, context);
      case "coding":
        // Execute code generation
        return await this.executeCodingTask(output, context);
      case "moderation":
        // Apply moderation actions
        return await this.executeModerationTask(output, context);
      case "memory":
        // Store memory in memory store
        return await this.executeMemoryTask(output, context);
      case "trust":
        // Update trust scores
        return await this.executeTrustTask(output, context);
      case "persona":
        // Update persona mode
        return await this.executePersonaTask(output, context);
      default:
        return { status: "unknown task type", taskType };
    }
  }

  /**
   * Execute game-specific tasks
   */
  private async executeGameTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with your existing game engine
    // This would send the speech to the game's TTS system
    // and process any game-related intents
    
    return {
      status: "game action executed",
      speech: output.speech,
      intentsProcessed: output.intents.length,
      gameState: context.gameState || "unknown"
    };
  }

  /**
   * Execute website-specific tasks
   */
  private async executeWebsiteTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with website management system
    // This could apply fixes, generate content, etc.
    
    return {
      status: "website action executed",
      action: output.speech,
      context: context
    };
  }

  /**
   * Execute graphics generation tasks
   */
  private async executeGraphicsTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with graphics generation system
    // This could trigger cosmetic generation, badge creation, etc.
    
    return {
      status: "graphics generated",
      description: output.speech,
      parameters: context
    };
  }

  /**
   * Execute audio generation tasks
   */
  private async executeAudioTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with audio generation system
    // This could trigger TTS, sound effects, etc.
    
    return {
      status: "audio generated",
      script: output.speech,
      audioType: context.audioType || "speech",
      audioFilePath: output.audioFilePath || null
    };
  }

  /**
   * Execute image generation tasks
   */
  private async executeImagesTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with image generation system
    // This could trigger DALL-E, Midjourney, etc.
    
    return {
      status: "image generated",
      description: output.speech,
      imageUrl: output.imageUrl || null,
      parameters: context
    };
  }

  /**
   * Execute code generation tasks
   */
  private async executeCodingTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with code execution system
    // This could save code files, run tests, etc.
    
    return {
      status: "code generated",
      code: output.speech,
      language: context.language || "typescript",
      filePath: context.filePath || null
    };
  }

  /**
   * Execute moderation tasks
   */
  private async executeModerationTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with moderation system
    // This could apply bans, warnings, etc.
    
    return {
      status: "moderation action executed",
      decision: output.speech,
      severity: context.severity || "medium"
    };
  }

  /**
   * Execute memory storage tasks
   */
  private async executeMemoryTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with memory store
    // This would store the memory proposal
    
    return {
      status: "memory stored",
      summary: output.speech,
      scope: context.scope || "event"
    };
  }

  /**
   * Execute trust update tasks
   */
  private async executeTrustTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with trust store
    // This would update trust scores
    
    return {
      status: "trust updated",
      delta: context.delta || 0,
      reason: output.speech
    };
  }

  /**
   * Execute persona update tasks
   */
  private async executePersonaTask(output: AceyOutput, context: any): Promise<any> {
    // Integrate with persona state
    // This would update persona mode
    
    return {
      status: "persona updated",
      mode: output.speech,
      previousMode: this.personaMode
    };
  }

  /**
   * Run multiple tasks in batch
   */
  public async runBatch(tasks: { taskType: TaskType; prompt: string; context: any }[]): Promise<AceyOutput[]> {
    console.log(`[BATCH] Processing ${tasks.length} tasks`);
    
    const results: AceyOutput[] = [];
    const startTime = Date.now();
    
    // Process tasks in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(tasks, concurrencyLimit);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(task => 
        this.runTask(task.taskType, task.prompt, task.context)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[BATCH] Completed ${tasks.length} tasks in ${totalTime}ms`);
    
    return results;
  }

  /**
   * Add a single task to the queue
   */
  public addTask(taskType: TaskType, prompt: string, context: any): TaskDefinition {
    const task: TaskDefinition = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskType,
      prompt,
      context,
      priority: 'medium',
      timestamp: new Date().toISOString()
    };
    
    console.log(`[TASK] Added task: ${task.id} (${taskType})`);
    return task;
  }

  /**
   * Run dry-run simulation without execution
   */
  public async dryRunSimulation(tasks: { taskType: TaskType; prompt: string; context: any }[]): Promise<BatchResult[]> {
    console.log(`[DRY-RUN] Simulating ${tasks.length} tasks`);
    
    // Store original mode
    const originalSimulationMode = this.simulationMode;
    const originalDryRunMode = this.dryRunMode;
    
    // Enable dry-run mode
    this.simulationMode = true;
    this.dryRunMode = true;
    
    const results: BatchResult[] = [];
    
    try {
      for (const task of tasks) {
        const startTime = Date.now();
        
        try {
          const output = await this.runTask(task.taskType, task.prompt, task.context);
          
          results.push({
            taskId: task.taskType + '_' + Date.now(),
            output,
            processed: true,
            processingTime: Date.now() - startTime
          });
          
        } catch (error) {
          results.push({
            taskId: task.taskType + '_' + Date.now(),
            output: { speech: "Error occurred", intents: [] },
            processed: false,
            error: error instanceof Error ? error.message : "Unknown error",
            processingTime: Date.now() - startTime
          });
        }
      }
      
      console.log(`[DRY-RUN] Simulation completed: ${results.filter(r => r.processed).length}/${tasks.length} successful`);
      
    } finally {
      // Restore original mode
      this.simulationMode = originalSimulationMode;
      this.dryRunMode = originalDryRunMode;
    }
    
    return results;
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
      timeout: this.timeout
    };
  }

  /**
   * Update orchestrator configuration
   */
  public updateConfig(newConfig: Partial<OrchestratorOptions>) {
    if (newConfig.personaMode) this.personaMode = newConfig.personaMode;
    if (newConfig.autoApprove !== undefined) this.autoApprove = newConfig.autoApprove;
    if (newConfig.simulationMode !== undefined) this.simulationMode = newConfig.simulationMode;
    if (newConfig.dryRunMode !== undefined) this.dryRunMode = newConfig.dryRunMode;
    if (newConfig.retryAttempts !== undefined) this.retryAttempts = newConfig.retryAttempts;
    if (newConfig.timeout !== undefined) this.timeout = newConfig.timeout;
  }

  /**
   * Utility: chunk array for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Utility: delay for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: estimate tokens
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Utility: calculate cost
   */
  private calculateCost(text: string): number {
    const tokens = this.estimateTokens(text);
    return (tokens / 1000) * 0.00002; // $0.02 per 1K tokens
  }
}
