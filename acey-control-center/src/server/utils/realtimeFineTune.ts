// File: src/server/utils/realtimeFineTune.ts

import fs from "fs";
import path from "path";
import axios from "axios";
import { TaskType, AceyOutput } from "./schema";

interface FineTuneOptions {
  datasetDir?: string;
  batchSize?: number;
  fineTuneEndpoint: string;
  apiKey: string;
  adaptiveBatchSize?: boolean;
  minConfidence?: number;
  maxQueueSize?: number;
  retryAttempts?: number;
  timeout?: number;
}

interface FineTuneJob {
  id: string;
  taskType: TaskType;
  status: "queued" | "processing" | "completed" | "failed";
  samples: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  modelVersion?: string;
}

interface QueuedOutput {
  taskType: TaskType;
  prompt: string;
  output: AceyOutput;
  confidence: number;
  timestamp: string;
  context?: any;
}

/**
 * Real-Time Fine-Tune Manager
 * Automatically fine-tunes Acey on approved outputs with adaptive learning
 */
export class RealTimeFineTune {
  private datasetDir: string;
  private batchSize: number;
  private apiKey: string;
  private fineTuneEndpoint: string;
  private adaptiveBatchSize: boolean;
  private minConfidence: number;
  private maxQueueSize: number;
  private retryAttempts: number;
  private timeout: number;
  
  private pendingQueue: QueuedOutput[] = [];
  private activeJobs: Map<string, FineTuneJob> = new Map();
  private completedJobs: FineTuneJob[] = [];
  private modelVersions: Map<TaskType, string> = new Map();

  constructor(options: FineTuneOptions) {
    this.datasetDir = options.datasetDir ?? path.join(__dirname, "../../data/dataset");
    this.batchSize = options.batchSize ?? 20;
    this.fineTuneEndpoint = options.fineTuneEndpoint;
    this.apiKey = options.apiKey;
    this.adaptiveBatchSize = options.adaptiveBatchSize ?? true;
    this.minConfidence = options.minConfidence ?? 0.7;
    this.maxQueueSize = options.maxQueueSize ?? 100;
    this.retryAttempts = options.retryAttempts ?? 3;
    this.timeout = options.timeout ?? 30000;

    // Ensure dataset directory exists
    if (!fs.existsSync(this.datasetDir)) {
      fs.mkdirSync(this.datasetDir, { recursive: true });
    }

    // Load existing model versions
    this.loadModelVersions();
    
    console.log(`[RealTimeFineTune] Initialized with batch size: ${this.batchSize}, adaptive: ${this.adaptiveBatchSize}`);
  }

  /**
   * Add a new approved output for real-time fine-tuning
   */
  public async queueApprovedOutput(
    taskType: TaskType, 
    prompt: string, 
    output: AceyOutput,
    confidence: number = 0.8,
    context?: any
  ): Promise<string> {
    // Check confidence threshold
    if (confidence < this.minConfidence) {
      console.log(`[RealTimeFineTune] Skipping low confidence output: ${confidence} < ${this.minConfidence}`);
      return "skipped_low_confidence";
    }

    // Check queue size
    if (this.pendingQueue.length >= this.maxQueueSize) {
      console.warn(`[RealTimeFineTune] Queue full, flushing oldest entries`);
      await this.flushQueue();
    }

    const queuedOutput: QueuedOutput = {
      taskType,
      prompt,
      output,
      confidence,
      timestamp: new Date().toISOString(),
      context
    };

    this.pendingQueue.push(queuedOutput);

    // Append to JSONL dataset
    const datasetFile = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
    const line = JSON.stringify({
      input: prompt,
      output,
      confidence,
      timestamp: queuedOutput.timestamp,
      context
    }) + "\n";
    
    fs.appendFileSync(datasetFile, line);

    console.log(`[RealTimeFineTune] Queued ${taskType} output (confidence: ${confidence})`);

    // Trigger fine-tune if batch size reached
    const currentBatchSize = this.calculateAdaptiveBatchSize(taskType);
    if (this.getQueueSizeForType(taskType) >= currentBatchSize) {
      return await this.runFineTuneBatch(taskType);
    }

    return "queued";
  }

  /**
   * Calculate adaptive batch size based on performance metrics
   */
  private calculateAdaptiveBatchSize(taskType: TaskType): number {
    if (!this.adaptiveBatchSize) {
      return this.batchSize;
    }

    // Get recent performance for this task type
    const recentJobs = this.completedJobs
      .filter(job => job.taskType === taskType && job.status === "completed")
      .slice(-5); // Last 5 jobs

    if (recentJobs.length === 0) {
      return this.batchSize;
    }

    // Calculate average success rate
    const successRate = recentJobs.filter(job => job.status === "completed").length / recentJobs.length;
    
    // Adaptive batch size logic
    if (successRate >= 0.9) {
      return Math.min(this.batchSize * 1.5, 50); // Increase batch size for high success
    } else if (successRate <= 0.5) {
      return Math.max(this.batchSize * 0.5, 5); // Decrease batch size for low success
    }

    return this.batchSize; // Keep default for moderate success
  }

  /**
   * Get queue size for specific task type
   */
  private getQueueSizeForType(taskType: TaskType): number {
    return this.pendingQueue.filter(item => item.taskType === taskType).length;
  }

  /**
   * Run a fine-tune batch for specific task type
   */
  private async runFineTuneBatch(taskType: TaskType): Promise<string> {
    // Get items for this task type
    const taskItems = this.pendingQueue.filter(item => item.taskType === taskType);
    const batchSize = this.calculateAdaptiveBatchSize(taskType);
    const batch = taskItems.slice(0, batchSize);

    if (batch.length === 0) {
      return "no_items";
    }

    // Remove batch from queue
    this.pendingQueue = this.pendingQueue.filter(item => !batch.includes(item));

    // Create job
    const jobId = this.generateJobId();
    const job: FineTuneJob = {
      id: jobId,
      taskType,
      status: "queued",
      samples: batch.length,
      createdAt: new Date().toISOString()
    };

    this.activeJobs.set(jobId, job);

    console.log(`[RealTimeFineTune] Starting fine-tune job ${jobId} for ${taskType} with ${batch.length} samples`);

    // Prepare payload for fine-tuning API
    const payload = {
      model: "acey-base",
      dataset: batch.map(item => ({
        input: item.prompt,
        output: item.output,
        confidence: item.confidence,
        timestamp: item.timestamp,
        context: item.context
      })),
      taskType,
      hyperparameters: {
        learning_rate: this.calculateLearningRate(taskType),
        epochs: this.calculateEpochs(batch.length),
        batch_size: batch.length
      },
      metadata: {
        jobId,
        createdAt: job.createdAt,
        source: "realtime_finetune",
        version: this.getNextModelVersion(taskType)
      }
    };

    try {
      const response = await axios.post(
        this.fineTuneEndpoint,
        payload,
        {
          headers: { 
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      // Update job status
      job.status = "processing";
      job.modelVersion = payload.metadata.version;

      console.log(`[RealTimeFineTune] Fine-tune job ${jobId} queued:`, response.data);

      // Start monitoring the job
      this.monitorJob(jobId, response.data.job_id || jobId);

      return jobId;

    } catch (err) {
      console.error(`[RealTimeFineTune] Fine-tune job ${jobId} failed:`, err);
      
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Unknown error";
      this.completedJobs.push(job);
      this.activeJobs.delete(jobId);

      // Retry logic
      if (this.retryAttempts > 0) {
        console.log(`[RealTimeFineTune] Retrying job ${jobId}...`);
        return await this.runFineTuneBatch(taskType);
      }

      throw err;
    }
  }

  /**
   * Monitor fine-tune job progress
   */
  private async monitorJob(jobId: string, providerJobId?: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    const checkInterval = setInterval(async () => {
      try {
        // Check job status with provider
        const statusResponse = await axios.get(
          `${this.fineTuneEndpoint}/jobs/${providerJobId || jobId}`,
          {
            headers: { Authorization: `Bearer ${this.apiKey}` },
            timeout: 5000
          }
        );

        const status = statusResponse.data.status;
        
        if (status === "completed") {
          job.status = "completed";
          job.completedAt = new Date().toISOString();
          
          // Update model version
          this.modelVersions.set(job.taskType, job.modelVersion || "latest");
          this.saveModelVersions();
          
          console.log(`[RealTimeFineTune] Job ${jobId} completed successfully!`);
          
          this.completedJobs.push(job);
          this.activeJobs.delete(jobId);
          clearInterval(checkInterval);
          
        } else if (status === "failed") {
          job.status = "failed";
          job.error = statusResponse.data.error || "Unknown error";
          
          console.error(`[RealTimeFineTune] Job ${jobId} failed:`, job.error);
          
          this.completedJobs.push(job);
          this.activeJobs.delete(jobId);
          clearInterval(checkInterval);
          
        } else {
          // Still processing
          console.log(`[RealTimeFineTune] Job ${jobId} status: ${status}`);
        }
        
      } catch (err) {
        console.error(`[RealTimeFineTune] Failed to check job ${jobId} status:`, err);
      }
    }, 10000); // Check every 10 seconds

    // Auto-stop after 30 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (this.activeJobs.has(jobId)) {
        console.warn(`[RealTimeFineTune] Job ${jobId} monitoring timeout`);
        job.status = "failed";
        job.error = "Monitoring timeout";
        this.completedJobs.push(job);
        this.activeJobs.delete(jobId);
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Force fine-tune for remaining queued outputs
   */
  public async flushQueue(): Promise<string[]> {
    const jobIds: string[] = [];
    const taskTypes = [...new Set(this.pendingQueue.map(item => item.taskType))];
    
    for (const taskType of taskTypes) {
      if (this.getQueueSizeForType(taskType) > 0) {
        const jobId = await this.runFineTuneBatch(taskType);
        if (jobId !== "no_items") {
          jobIds.push(jobId);
        }
      }
    }
    
    console.log(`[RealTimeFineTune] Flushed queue with ${jobIds.length} jobs`);
    return jobIds;
  }

  /**
   * Get fine-tune statistics
   */
  public getStats(): {
    queue: { total: number; byType: Record<TaskType, number> };
    active: { total: number; jobs: FineTuneJob[] };
    completed: { total: number; successRate: number; jobs: FineTuneJob[] };
    models: Record<TaskType, string>;
  } {
    const queueByType = this.pendingQueue.reduce((acc, item) => {
      acc[item.taskType] = (acc[item.taskType] || 0) + 1;
      return acc;
    }, {} as Record<TaskType, number>);

    const activeJobs = Array.from(this.activeJobs.values());
    const completedJobs = this.completedJobs.slice(-50); // Last 50 jobs
    const successRate = completedJobs.length > 0 
      ? completedJobs.filter(job => job.status === "completed").length / completedJobs.length 
      : 0;

    return {
      queue: {
        total: this.pendingQueue.length,
        byType: queueByType
      },
      active: {
        total: activeJobs.length,
        jobs: activeJobs
      },
      completed: {
        total: this.completedJobs.length,
        successRate,
        jobs: completedJobs
      },
      models: Object.fromEntries(this.modelVersions) as Record<TaskType, string>
    };
  }

  /**
   * Get dataset statistics
   */
  public getDatasetStats(): Record<string, { size: number; entries: number; lastUpdated: string }> {
    const stats: Record<string, { size: number; entries: number; lastUpdated: string }> = {};
    
    try {
      const files = fs.readdirSync(this.datasetDir);
      
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const filePath = path.join(this.datasetDir, file);
          const fileStats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf-8');
          const entries = content.split('\n').filter(line => line.trim()).length;
          
          stats[file] = {
            size: fileStats.size,
            entries,
            lastUpdated: fileStats.mtime.toISOString()
          };
        }
      }
    } catch (error) {
      console.error('[RealTimeFineTune] Failed to get dataset stats:', error);
    }
    
    return stats;
  }

  /**
   * Utility methods
   */
  private generateJobId(): string {
    return `ft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateLearningRate(taskType: TaskType): number {
    // Task-specific learning rates
    const rates: Record<TaskType, number> = {
      audio: 0.0001,
      coding: 0.00005,
      game: 0.0001,
      website: 0.00005,
      graphics: 0.0001,
      images: 0.0001,
      moderation: 0.00002,
      memory: 0.00005,
      trust: 0.00002,
      persona: 0.00005
    };
    
    return rates[taskType] || 0.0001;
  }

  private calculateEpochs(sampleCount: number): number {
    // Adaptive epochs based on sample count
    if (sampleCount < 10) return 5;
    if (sampleCount < 50) return 3;
    return 2;
  }

  private getNextModelVersion(taskType: TaskType): string {
    const currentVersion = this.modelVersions.get(taskType) || "v1.0.0";
    const versionParts = currentVersion.split('.');
    const patch = parseInt(versionParts[2]) + 1;
    return `${versionParts[0]}.${versionParts[1]}.${patch}`;
  }

  private loadModelVersions(): void {
    try {
      const versionsFile = path.join(this.datasetDir, "model_versions.json");
      if (fs.existsSync(versionsFile)) {
        const data = fs.readFileSync(versionsFile, 'utf-8');
        const versions = JSON.parse(data);
        this.modelVersions = new Map(Object.entries(versions) as [TaskType, string][]);
      }
    } catch (error) {
      console.error('[RealTimeFineTune] Failed to load model versions:', error);
    }
  }

  private saveModelVersions(): void {
    try {
      const versionsFile = path.join(this.datasetDir, "model_versions.json");
      const versions = Object.fromEntries(this.modelVersions);
      fs.writeFileSync(versionsFile, JSON.stringify(versions, null, 2));
    } catch (error) {
      console.error('[RealTimeFineTune] Failed to save model versions:', error);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<FineTuneOptions>): void {
    if (config.batchSize !== undefined) this.batchSize = config.batchSize;
    if (config.adaptiveBatchSize !== undefined) this.adaptiveBatchSize = config.adaptiveBatchSize;
    if (config.minConfidence !== undefined) this.minConfidence = config.minConfidence;
    if (config.maxQueueSize !== undefined) this.maxQueueSize = config.maxQueueSize;
    if (config.retryAttempts !== undefined) this.retryAttempts = config.retryAttempts;
    if (config.timeout !== undefined) this.timeout = config.timeout;
  }

  /**
   * Clear all data (for testing/reset)
   */
  public clearAll(): void {
    this.pendingQueue = [];
    this.activeJobs.clear();
    this.completedJobs = [];
    this.modelVersions.clear();
    
    // Clear dataset files
    try {
      const files = fs.readdirSync(this.datasetDir);
      for (const file of files) {
        if (file.endsWith('.jsonl') || file === 'model_versions.json') {
          fs.unlinkSync(path.join(this.datasetDir, file));
        }
      }
    } catch (error) {
      console.error('[RealTimeFineTune] Failed to clear data:', error);
    }
  }
}
