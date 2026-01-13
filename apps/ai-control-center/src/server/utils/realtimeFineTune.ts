import { TaskType } from '../../utils/orchestrator';
import { ContinuousLearningLoop, DatasetEntry } from '../../utils/continuousLearning';
import AceyLibraryManager from './libraryManager';
import fs from "fs";
import path from "path";

export interface FineTuneJob {
  id: string;
  taskType: TaskType;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  datasetSize: number;
  modelPath?: string;
  error?: string;
  metrics?: {
    accuracy: number;
    loss: number;
    validationAccuracy: number;
  };
}

export interface FineTuneConfig {
  batchSize: number;
  learningRate: number;
  epochs: number;
  validationSplit: number;
  earlyStoppingPatience: number;
  saveBestModel: boolean;
}

export class RealTimeFineTune {
  private activeJobs: Map<string, FineTuneJob> = new Map();
  private jobQueue: FineTuneJob[] = [];
  private isProcessing: boolean = false;
  private learningLoop: ContinuousLearningLoop;

  constructor(learningLoop: ContinuousLearningLoop) {
    this.learningLoop = learningLoop;
    this.startJobProcessor();
  }

  /**
   * Start fine-tune job for a specific task type
   */
  async startFineTune(taskType: TaskType, dataset: DatasetEntry[], config?: Partial<FineTuneConfig>): Promise<FineTuneJob> {
    const jobId = `finetune-${taskType}-${Date.now()}`;
    
    const job: FineTuneJob = {
      id: jobId,
      taskType,
      status: 'queued',
      progress: 0,
      datasetSize: dataset.length
    };

    this.activeJobs.set(jobId, job);
    this.jobQueue.push(job);

    console.log(`Queued fine-tune job ${jobId} for ${taskType} with ${dataset.length} samples`);
    
    return job;
  }

  /**
   * Monitor job progress
   */
  async monitorProgress(jobId: string): Promise<FineTuneJob | null> {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): FineTuneJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: FineTuneJob['status']): FineTuneJob[] {
    return Array.from(this.activeJobs.values()).filter(job => job.status === status);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === 'queued') {
      // Remove from queue
      const queueIndex = this.jobQueue.findIndex(j => j.id === jobId);
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
      }
      job.status = 'failed';
      job.error = 'Cancelled by user';
      return true;
    }

    if (job.status === 'running') {
      // In a real implementation, you'd signal the training process to stop
      job.status = 'failed';
      job.error = 'Cancelled during execution';
      job.endTime = new Date();
      return true;
    }

    return false;
  }

  /**
   * Save fine-tuned model using library manager
   */
  private async saveModel(taskType: TaskType, modelData: Buffer): Promise<string> {
    const modelFolder = AceyLibraryManager.paths.models;
    const modelName = `finetune-${taskType}-${Date.now()}.pt`;
    
    return AceyLibraryManager.saveFile('models', modelName, modelData);
  }

  /**
   * Load model from library manager
   */
  private loadModel(modelPath: string): Buffer | null {
    // Extract filename from path
    const fileName = path.basename(modelPath);
    return AceyLibraryManager.readFile('models', fileName);
  }

  /**
   * Process queued jobs
   */
  private async processJob(job: FineTuneJob): Promise<void> {
    job.status = 'running';
    job.startTime = new Date();
    
    try {
      console.log(`Starting fine-tune job ${job.id} for ${job.taskType}`);

      // Simulate fine-tuning process
      const epochs = 10;
      for (let epoch = 0; epoch < epochs; epoch++) {
        // Update progress
        job.progress = (epoch / epochs) * 100;
        
        // Simulate training time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if job was cancelled
        if (job.status === 'failed' || job.status === 'cancelled') {
          return;
        }
      }

      // Generate mock model data
      const mockModelData = Buffer.from(`fine-tuned-model-${job.taskType}-${Date.now()}`);
      
      // Save model using library manager
      const modelPath = await this.saveModel(job.taskType, mockModelData);
      job.modelPath = modelPath;

      // Mock metrics
      job.metrics = {
        accuracy: 0.85 + Math.random() * 0.1, // 85-95%
        loss: Math.random() * 0.2, // 0-0.2
        validationAccuracy: 0.82 + Math.random() * 0.1 // 82-92%
      };

      job.status = 'completed';
      job.endTime = new Date();
      job.progress = 100;

      console.log(`Completed fine-tune job ${job.id} with accuracy ${(job.metrics.accuracy * 100).toFixed(1)}%`);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
      console.error(`Fine-tune job ${job.id} failed:`, job.error);
    }
  }

  /**
   * Job processor loop
   */
  private async startJobProcessor(): Promise<void> {
    while (true) {
      if (!this.isProcessing && this.jobQueue.length > 0) {
        this.isProcessing = true;
        
        const job = this.jobQueue.shift()!;
        await this.processJob(job);
        
        this.isProcessing = false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Compare two models
   */
  async compareModels(modelAPath: string, modelBPath: string): Promise<{
    winner: string;
    accuracyA: number;
    accuracyB: number;
    improvement: number;
  }> {
    // Mock comparison - in real implementation, you'd run evaluation
    const accuracyA = 0.85 + Math.random() * 0.1;
    const accuracyB = 0.82 + Math.random() * 0.1;
    
    const winner = accuracyA > accuracyB ? modelAPath : modelBPath;
    const improvement = Math.abs(accuracyA - accuracyB);
    
    return {
      winner,
      accuracyA,
      accuracyB,
      improvement
    };
  }

  /**
   * Rollback to previous model version
   */
  async rollbackModel(targetVersion: string): Promise<boolean> {
    try {
      // In real implementation, you'd:
      // 1. Load the target model from library manager
      // 2. Update the active model reference
      // 3. Restart any services using the model
      
      console.log(`Rolled back to model version: ${targetVersion}`);
      return true;
    } catch (error) {
      console.error(`Failed to rollback to ${targetVersion}:`, error);
      return false;
    }
  }

  /**
   * Get model history
   */
  getModelHistory(taskType: TaskType): Array<{
    version: string;
    path: string;
    createdAt: Date;
    accuracy?: number;
    isActive: boolean;
  }> {
    const modelsFolder = AceyLibraryManager.paths.models;
    const history: Array<{
      version: string;
      path: string;
      createdAt: Date;
      accuracy?: number;
      isActive: boolean;
    }> = [];

    if (fs.existsSync(modelsFolder)) {
      const files = fs.readdirSync(modelsFolder);
      const taskTypeFiles = files.filter(file => file.includes(taskType));
      
      taskTypeFiles.forEach(file => {
        const filePath = path.join(modelsFolder, file);
        const stats = fs.statSync(filePath);
        
        history.push({
          version: file.replace('.pt', ''),
          path: filePath,
          createdAt: stats.mtime,
          isActive: false // Would be determined by current active model
        });
      });
    }

    // Sort by creation date (newest first)
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Schedule periodic fine-tuning
   */
  schedulePeriodicFineTune(taskType: TaskType, intervalHours: number = 24): void {
    setInterval(async () => {
      const datasetStats = this.learningLoop.getDatasetStats();
      const datasetSize = datasetStats[taskType] || 0;
      
      if (datasetSize >= 20) { // Minimum dataset size
        const recentEntries = this.learningLoop.getRecentSamples(20);
        const taskTypeEntries = recentEntries.filter(entry => entry.taskType === taskType);
        
        if (taskTypeEntries.length >= 20) {
          await this.startFineTune(taskType, taskTypeEntries);
        }
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Get system statistics
   */
  getSystemStats(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    runningJobs: number;
    queuedJobs: number;
    averageAccuracy: number;
    totalModels: number;
  } {
    const jobs = Array.from(this.activeJobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.metrics);
    
    const averageAccuracy = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + (job.metrics?.accuracy || 0), 0) / completedJobs.length
      : 0;

    const modelsFolder = AceyLibraryManager.paths.models;
    const totalModels = fs.existsSync(modelsFolder) ? fs.readdirSync(modelsFolder).length : 0;

    return {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      runningJobs: jobs.filter(job => job.status === 'running').length,
      queuedJobs: jobs.filter(job => job.status === 'queued').length,
      averageAccuracy,
      totalModels
    };
  }
}
