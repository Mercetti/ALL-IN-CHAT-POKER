// File: src/server/utils/audioCodingOrchestrator.ts

import { AceyOrchestrator } from "./orchestrator";
import { AceyInteractionLog, AceyOutput, TaskType, TaskDefinition, BatchResult } from "./schema";
import { saveLog } from "./llmLogger";
import { filterAceyLogs } from "../filter";
import fs from "fs";
import path from "path";

interface AudioTaskContext {
  type: "speech" | "music" | "effect";
  mood: "hype" | "calm" | "neutral";
  lengthSeconds?: number;
  volume?: number;
  intensity?: "low" | "medium" | "high";
  targetFileName?: string;
  format?: "wav" | "mp3" | "ogg";
  voice?: "energetic" | "calm" | "professional" | "playful";
  context?: {
    gameState?: any;
    player?: string;
    pot?: number;
    chatExcitement?: number;
    subscriberCount?: number;
    donationAmount?: number;
    [key: string]: any;
  };
}

interface CodingTaskContext {
  language: "typescript" | "python" | "bash" | "javascript" | "sql" | "html" | "css";
  filePath?: string;
  functionName?: string;
  description: string;
  inputs?: any;
  outputs?: any;
  maxLines?: number;
  framework?: string;
  dependencies?: string[];
  testCases?: Array<{
    input: any;
    expectedOutput: any;
    description: string;
  }>;
  validationRules?: Array<{
    type: "syntax" | "security" | "performance" | "style";
    rule: string;
    severity: "error" | "warning" | "info";
  }>;
}

type AceyTaskContext = AudioTaskContext | CodingTaskContext;

// Interface for ContinuousLearningLoop (will be implemented in Chunk 4)
interface IContinuousLearningLoop {
  processOutput(taskType: TaskType, prompt: string, output: AceyOutput, context: any, approved?: boolean, confidence?: number): Promise<any>;
}

interface AudioCodingOrchestratorOptions {
  baseOrchestrator: AceyOrchestrator;
  simulationMode?: boolean;
  autoApprove?: boolean;
  datasetDir?: string;
  enableValidation?: boolean;
  enableDatasetPrep?: boolean;
  maxDatasetSize?: number;
  continuousLearningLoop?: IContinuousLearningLoop; // Optional learning loop integration
}

export class AudioCodingOrchestrator {
  private orchestrator: AceyOrchestrator;
  private simulationMode: boolean;
  private autoApprove: boolean;
  private datasetDir: string;
  private enableValidation: boolean;
  private enableDatasetPrep: boolean;
  private maxDatasetSize: number;
  private continuousLearningLoop?: IContinuousLearningLoop;

  constructor(options: AudioCodingOrchestratorOptions) {
    this.orchestrator = options.baseOrchestrator;
    this.simulationMode = options.simulationMode ?? true;
    this.autoApprove = options.autoApprove ?? true;
    this.datasetDir = options.datasetDir ?? path.join(__dirname, "../../data/dataset");
    this.enableValidation = options.enableValidation ?? true;
    this.enableDatasetPrep = options.enableDatasetPrep ?? true;
    this.maxDatasetSize = options.maxDatasetSize ?? 10000;
    this.continuousLearningLoop = options.continuousLearningLoop;

    // Ensure dataset directory exists
    if (!fs.existsSync(this.datasetDir)) {
      fs.mkdirSync(this.datasetDir, { recursive: true });
    }
  }

  /**
   * Run a single audio or coding task
   */
  public async runTask(
    taskType: TaskType,
    prompt: string,
    context: AceyTaskContext
  ): Promise<AceyOutput> {
    const startTime = Date.now();
    
    try {
      // Use base orchestrator for the core task
      const aceyOutput = await this.orchestrator.runTask(taskType, prompt, context);

      // Build enhanced log with task-specific context
      const log: AceyInteractionLog = {
        taskType,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          environment: this.simulationMode ? "simulation" : "live",
          taskCategory: taskType
        },
        llmPrompt: prompt,
        llmOutput: aceyOutput.speech,
        aceyOutput,
        controlDecision: this.autoApprove && filterAceyLogs({ taskType, timestamp: new Date().toISOString(), context: { ...context, environment: this.simulationMode ? "simulation" : "live", taskCategory: taskType }, llmPrompt: prompt, llmOutput: aceyOutput, controlDecision: "approved", finalAction: null, trustDelta: 0, personaMode: "neutral", performance: { responseTime: 0, tokenCount: 0, cost: 0 } } as any)
          ? "approved"
          : "rejected",
        finalAction: this.simulationMode ? null : aceyOutput.speech,
        trustDelta: 0,
        personaMode: "neutral", // Use default persona mode
        performance: {
          responseTime: Date.now() - startTime,
          tokenCount: 0,
          cost: 0
        }
      };

      // Save log
      await saveLog(log);

      // Validation hooks
      if (log.controlDecision === "approved" && this.enableValidation) {
        const validationPassed = await this.validateTask(taskType, context, aceyOutput);
        if (!validationPassed) {
          log.controlDecision = "rejected";
          log.finalAction = "Validation failed";
          log.trustDelta = -0.1;
          await saveLog(log);
        }
      }

      // Add to dataset for fine-tuning if approved
      if (log.controlDecision === "approved" && this.enableDatasetPrep) {
        await this.appendToDataset(taskType, prompt, aceyOutput, context);
      }

      return aceyOutput;

    } catch (error) {
      console.error(`[AUDIO-CODING] Task failed for ${taskType}:`, error);
      
      // Log the failure
      const failureLog: AceyInteractionLog = {
        taskType,
        timestamp: new Date().toISOString(),
        context: { ...context, environment: this.simulationMode ? "simulation" : "live" },
        llmPrompt: prompt,
        llmOutput: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        aceyOutput: { speech: "Error occurred", intents: [] },
        controlDecision: "rejected",
        finalAction: "Task execution failed",
        trustDelta: -0.1,
        personaMode: "neutral", // Use default persona mode
        performance: {
          responseTime: Date.now() - startTime,
          tokenCount: 0,
          cost: 0
        }
      };
      
      await saveLog(failureLog);
      throw error;
    }
  }

  /**
   * Run multiple tasks in batch
   */
  public async runBatch(tasks: { taskType: TaskType; prompt: string; context: AceyTaskContext }[]): Promise<AceyOutput[]> {
    console.log(`[AUDIO-CODING] Running batch of ${tasks.length} tasks`);
    const startTime = Date.now();
    
    const results: AceyOutput[] = [];
    const batchSize = 5; // Process 5 tasks at a time
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchPromises = batch.map(task => 
        this.runTask(task.taskType, task.prompt, task.context)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`[AUDIO-CODING] Batch failed at index ${i}:`, error);
        // Continue with next batch
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[AUDIO-CODING] Batch completed: ${results.length}/${tasks.length} tasks in ${totalTime}ms`);
    
    return results;
  }

  /**
   * Run batch simulation with previews for audio and coding tasks
   */
  public async runBatchSimulation(tasks: { taskType: TaskType; prompt: string; context: AceyTaskContext }[]): Promise<{
    results: BatchResult[];
    previews: Array<{
      taskId: string;
      taskType: TaskType;
      preview: any; // Audio preview, code preview, etc.
      metadata: any;
    }>;
  }> {
    console.log(`[AUDIO-CODING] Running batch simulation with previews for ${tasks.length} tasks`);
    
    // Store original mode
    const originalSimulationMode = this.simulationMode;
    
    // Enable simulation mode
    this.simulationMode = true;
    
    const results: BatchResult[] = [];
    const previews: any[] = [];
    
    try {
      for (const task of tasks) {
        const startTime = Date.now();
        const taskId = `${task.taskType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const output = await this.runTask(task.taskType, task.prompt, task.context);
          
          // Generate preview based on task type
          const preview = this.generatePreview(task.taskType, output, task.context);
          
          results.push({
            taskId,
            output,
            processed: true,
            processingTime: Date.now() - startTime
          });
          
          previews.push({
            taskId,
            taskType: task.taskType,
            preview,
            metadata: {
              confidence: output.confidence,
              trust: output.trust,
              intents: output.intents,
              processingTime: Date.now() - startTime
            }
          });
          
          // Process through continuous learning loop if available
          if (this.continuousLearningLoop && output.confidence && output.confidence > 0.7) {
            await this.continuousLearningLoop.processOutput(
              task.taskType,
              task.prompt,
              output,
              task.context,
              true, // Auto-approve in simulation
              output.confidence
            );
          }
          
        } catch (error) {
          results.push({
            taskId,
            output: { speech: "Error occurred", intents: [] },
            processed: false,
            error: error instanceof Error ? error.message : "Unknown error",
            processingTime: Date.now() - startTime
          });
          
          previews.push({
            taskId,
            taskType: task.taskType,
            preview: { error: error instanceof Error ? error.message : "Unknown error" },
            metadata: { error: true }
          });
        }
      }
      
      console.log(`[AUDIO-CODING] Batch simulation completed: ${results.filter(r => r.processed).length}/${tasks.length} successful`);
      
    } finally {
      // Restore original mode
      this.simulationMode = originalSimulationMode;
    }
    
    return { results, previews };
  }

  /**
   * Validate code task
   */
  public validateCode(task: CodingTaskContext, generatedCode: string): boolean {
    try {
      console.log(`[VALIDATION] Validating ${task.language} code`);
      
      // Syntax validation
      if (task.language === "typescript" || task.language === "javascript") {
        // Basic syntax check
        new Function(generatedCode);
        console.log(`[VALIDATION] ${task.language} syntax check passed`);
      }
      
      // Security validation
      const securityPatterns = [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /document\.write/gi,
        /innerHTML/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /child_process/gi
      ];
      
      for (const pattern of securityPatterns) {
        if (pattern.test(generatedCode)) {
          console.error(`[VALIDATION] Security issue detected: ${pattern}`);
          return false;
        }
      }
      
      // Performance validation
      if (generatedCode.includes('while (true)') || generatedCode.includes('for (;;)')) {
        console.error(`[VALIDATION] Potential infinite loop detected`);
        return false;
      }
      
      // Line count validation
      const lineCount = generatedCode.split('\n').length;
      if (task.maxLines && lineCount > task.maxLines) {
        console.error(`[VALIDATION] Code exceeds max lines: ${lineCount} > ${task.maxLines}`);
        return false;
      }
      
      console.log(`[VALIDATION] Code validation passed`);
      return true;
      
    } catch (err) {
      console.error(`[VALIDATION] Code validation failed:`, err);
      return false;
    }
  }

  /**
   * Validate audio output
   */
  public validateAudio(task: AudioTaskContext, filePath: string): boolean {
    try {
      console.log(`[VALIDATION] Validating audio file: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`[VALIDATION] Audio file does not exist: ${filePath}`);
        return false;
      }
      
      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.error(`[VALIDATION] Audio file is empty: ${filePath}`);
        return false;
      }
      
      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      const allowedExts = ['.wav', '.mp3', '.ogg', '.m4a'];
      if (!allowedExts.includes(ext)) {
        console.error(`[VALIDATION] Invalid audio format: ${ext}`);
        return false;
      }
      
      // Duration validation (if specified)
      if (task.lengthSeconds) {
        // This would require audio processing library
        // For now, just log that duration validation is needed
        console.log(`[VALIDATION] Duration validation needed: ${task.lengthSeconds}s`);
      }
      
      console.log(`[VALIDATION] Audio validation passed`);
      return true;
      
    } catch (err) {
      console.error(`[VALIDATION] Audio validation failed:`, err);
      return false;
    }
  }

  /**
   * Validate task based on type
   */
  private async validateTask(taskType: TaskType, context: AceyTaskContext, output: AceyOutput): Promise<boolean> {
    if (taskType === "coding" && this.isCodingContext(context)) {
      // Extract code from output
      const codeMatch = output.speech.match(/```[\w]*\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : output.speech;
      
      return this.validateCode(context as CodingTaskContext, code);
    }
    
    if (taskType === "audio" && this.isAudioContext(context)) {
      // For audio, we'd need to generate the file first
      // For now, just validate the context
      return this.validateAudioContext(context as AudioTaskContext);
    }
    
    return true; // Default validation passed
  }

  /**
   * Validate audio context
   */
  private validateAudioContext(context: AudioTaskContext): boolean {
    if (!context.type || !["speech", "music", "effect"].includes(context.type)) {
      return false;
    }
    
    if (!context.mood || !["hype", "calm", "neutral"].includes(context.mood)) {
      return false;
    }
    
    if (context.lengthSeconds && context.lengthSeconds <= 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if context is coding context
   */
  private isCodingContext(context: AceyTaskContext): context is CodingTaskContext {
    return 'language' in context;
  }

  /**
   * Check if context is audio context
   */
  private isAudioContext(context: AceyTaskContext): context is AudioTaskContext {
    return 'type' in context && ['speech', 'music', 'effect'].includes((context as AudioTaskContext).type);
  }

  /**
   * Append a task to dataset JSONL for future fine-tuning
   */
  private async appendToDataset(
    taskType: TaskType, 
    prompt: string, 
    output: AceyOutput, 
    context: AceyTaskContext
  ): Promise<void> {
    try {
      const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
      
      // Check dataset size
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxDatasetSize * 1024) { // Convert KB to bytes
          console.log(`[DATASET] Dataset size limit reached for ${taskType}`);
          return;
        }
      }
      
      const datasetEntry = {
        id: `${taskType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskType,
        prompt,
        output,
        context,
        timestamp: new Date().toISOString(),
        intents: output.intents,
        confidence: output.confidence,
        trust: output.trust
      };
      
      // Write to dataset file
      fs.appendFileSync(filePath, JSON.stringify(datasetEntry) + '\n');
    } catch (error) {
      console.error('[DATASET] Failed to append to dataset:', error);
    }
  }

  /**
   * Generate preview for task output
   */
  private generatePreview(taskType: TaskType, output: AceyOutput, context: any): string {
    switch (taskType) {
      case 'audio':
        return `Audio preview: ${output.speech?.substring(0, 100)}...`;
      case 'website':
        return `Code preview: ${output.speech?.substring(0, 100)}...`;
      case 'graphics':
        return `Graphics preview: ${output.speech?.substring(0, 100)}...`;
      case 'images':
        return `Image preview: ${output.speech?.substring(0, 100)}...`;
      default:
        return `Preview: ${output.speech?.substring(0, 100)}...`;
    }
  }

  /**
   * Calculate trust delta based on task and context
   */
  private calculateTrustDelta(taskType: TaskType, context: any): number {
    // Base trust delta
    let delta = 0.05;
    
    // Adjust based on task type
    if (taskType === "coding") {
      delta += 0.02; // Coding tasks get slightly more trust
    }
    
    // Adjust based on context
    if (this.isAudioContext(context)) {
      const audioContext = context as AudioTaskContext;
      if (audioContext.mood === "hype") {
        delta += 0.01; // Hype mood gets slight boost
      }
      if (audioContext.intensity === "high") {
        delta -= 0.01; // High intensity requires more caution
      }
    }
    
    if (this.isCodingContext(context)) {
      const codingContext = context as CodingTaskContext;
      if (codingContext.maxLines && codingContext.maxLines < 20) {
        delta += 0.01; // Shorter code is safer
      }
      if (codingContext.validationRules && codingContext.validationRules.length > 0) {
        delta += 0.02; // Having validation rules shows care
      }
    }
    
    return Math.min(Math.max(delta, -0.1), 0.1); // Clamp between -0.1 and 0.1
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
   * Get dataset statistics
   */
  public getDatasetStats(): Record<string, { size: number; entries: number }> {
    const stats: Record<string, { size: number; entries: number }> = {};
    
    try {
      if (fs.existsSync(this.datasetDir)) {
        const files = fs.readdirSync(this.datasetDir);
        
        for (const file of files) {
          if (file.endsWith('.jsonl')) {
            const filePath = path.join(this.datasetDir, file);
            const fileStats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const entries = content.split('\n').filter(line => line.trim()).length;
            
            stats[file] = {
              size: fileStats.size,
              entries
            };
          }
        }
      }
    } catch (error) {
      console.error('[DATASET] Failed to get stats:', error);
    }
    
    return stats;
  }

  /**
   * Clear dataset
   */
  public clearDataset(taskType?: TaskType): void {
    try {
      if (taskType) {
        const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DATASET] Cleared dataset for ${taskType}`);
        }
      } else {
        // Clear all datasets
        if (fs.existsSync(this.datasetDir)) {
          const files = fs.readdirSync(this.datasetDir);
          for (const file of files) {
            if (file.endsWith('.jsonl')) {
              fs.unlinkSync(path.join(this.datasetDir, file));
            }
          }
        }
        console.log('[DATASET] Cleared all datasets');
      }
    } catch (error) {
      console.error('[DATASET] Failed to clear dataset:', error);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<any>): void {
    if (config.simulationMode !== undefined) this.simulationMode = config.simulationMode;
    if (config.autoApprove !== undefined) this.autoApprove = config.autoApprove;
    if (config.enableValidation !== undefined) this.enableValidation = config.enableValidation;
    if (config.enableDatasetPrep !== undefined) this.enableDatasetPrep = config.enableDatasetPrep;
    if (config.maxDatasetSize !== undefined) this.maxDatasetSize = config.maxDatasetSize;
  }

  /**
   * Get orchestrator statistics
   */
  public getStats() {
    return {
      orchestrator: this.orchestrator.getStats(),
      audioCoding: {
        simulationMode: this.simulationMode,
        autoApprove: this.autoApprove,
        enableValidation: this.enableValidation,
        enableDatasetPrep: this.enableDatasetPrep,
        maxDatasetSize: this.maxDatasetSize,
        datasetStats: this.getDatasetStats()
      }
    };
  }
}
