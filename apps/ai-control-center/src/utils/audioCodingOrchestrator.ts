import { AceyOrchestrator, AceyOutput, TaskEntry, TaskType } from './orchestrator';

export interface AudioCodingOrchestratorConfig {
  baseOrchestrator: AceyOrchestrator;
  maxBatchSize?: number;
  batchTimeout?: number;
  enableParallel?: boolean;
}

export class AudioCodingOrchestrator {
  private config: AudioCodingOrchestratorConfig;
  private batchResults: Map<string, AceyOutput> = new Map();
  private processingQueue: TaskEntry[] = [];

  constructor(config: AudioCodingOrchestratorConfig) {
    this.config = {
      maxBatchSize: 10,
      batchTimeout: 60000,
      enableParallel: true,
      ...config
    };
  }

  async runBatch(tasks: TaskEntry[]): Promise<AceyOutput[]> {
    const startTime = Date.now();
    const results: AceyOutput[] = [];
    
    try {
      // Process tasks in parallel if enabled
      if (this.config.enableParallel) {
        const batchSize = this.config.maxBatchSize || 10;
        const batches = this.chunkArray(tasks, batchSize);
        
        for (const batch of batches) {
          const batchPromises = batch.map(task => this.processTask(task));
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              // Create a failed result
              const failedResult: AceyOutput = {
                speech: '',
                intents: [],
                approved: false,
                metadata: {
                  error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
                  taskId: batch[index].id,
                  processingTime: Date.now() - startTime
                },
                timestamp: new Date()
              };
              results.push(failedResult);
            }
          });
        }
      } else {
        // Process sequentially
        for (const task of tasks) {
          try {
            const result = await this.processTask(task);
            results.push(result);
          } catch (error) {
            const failedResult: AceyOutput = {
              speech: '',
              intents: [],
              approved: false,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error',
                taskId: task.id,
                processingTime: Date.now() - startTime
              },
              timestamp: new Date()
            };
            results.push(failedResult);
          }
        }
      }

      // Store batch results
      results.forEach((result, index) => {
        this.batchResults.set(tasks[index].id, result);
      });

      return results;
    } catch (error) {
      throw new Error(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processTask(task: TaskEntry): Promise<AceyOutput> {
    const startTime = Date.now();
    
    try {
      // Update task status to running
      task.status = 'running';
      
      // Generate response using base orchestrator
      const result = await this.config.baseOrchestrator.generateResponse(task.prompt, task.context);
      
      // Update task status to completed
      task.status = 'completed';
      
      // Add task-specific metadata
      result.metadata = {
        ...result.metadata,
        taskId: task.id,
        taskType: task.taskType,
        processingTime: Date.now() - startTime,
        batchProcessed: true
      };

      return result;
    } catch (error) {
      // Update task status to failed
      task.status = 'failed';
      throw error;
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async runSingleTask(task: TaskEntry): Promise<AceyOutput> {
    return this.processTask(task);
  }

  getBatchResults(): Map<string, AceyOutput> {
    return new Map(this.batchResults);
  }

  clearBatchResults(): void {
    this.batchResults.clear();
  }

  getTaskResult(taskId: string): AceyOutput | undefined {
    return this.batchResults.get(taskId);
  }

  getProcessingStats(): {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    taskTypeStats: Record<TaskType, { count: number; successRate: number }>;
  } {
    const results = Array.from(this.batchResults.values());
    const totalProcessed = results.length;
    const successfulResults = results.filter(r => !r.metadata?.error);
    const successRate = totalProcessed > 0 ? successfulResults.length / totalProcessed : 0;
    
    const totalProcessingTime = results.reduce((sum, r) => sum + (r.metadata?.processingTime || 0), 0);
    const averageProcessingTime = totalProcessed > 0 ? totalProcessingTime / totalProcessed : 0;

    // Calculate stats by task type
    const taskTypeStats: Record<TaskType, { count: number; successRate: number }> = {
      audio: { count: 0, successRate: 0 },
      website: { count: 0, successRate: 0 },
      graphics: { count: 0, successRate: 0 },
      images: { count: 0, successRate: 0 }
    };

    // This would need to be tracked separately since we don't have task info in results
    // For now, return empty stats
    return {
      totalProcessed,
      successRate,
      averageProcessingTime,
      taskTypeStats
    };
  }

  async validateTask(task: TaskEntry): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!task.prompt || task.prompt.trim().length === 0) {
      errors.push('Task prompt cannot be empty');
    }

    if (!task.taskType || !['audio', 'website', 'graphics', 'images'].includes(task.taskType)) {
      errors.push('Invalid task type');
    }

    if (task.taskType === 'audio' && !task.context?.type) {
      errors.push('Audio tasks must specify context.type');
    }

    if (task.taskType === 'website' && !task.context?.language) {
      errors.push('Website tasks must specify context.language');
    }

    if (task.taskType === 'graphics' && !task.context?.dimensions) {
      errors.push('Graphics tasks must specify context.dimensions');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async estimateProcessingTime(tasks: TaskEntry[]): Promise<number> {
    // Estimate based on task types and historical data
    const baseTimePerTask = 2000; // 2 seconds base
    const taskTypeMultipliers: Record<TaskType, number> = {
      audio: 1.5,    // Audio takes longer
      website: 1.2,  // Code generation is moderate
      graphics: 1.0, // Graphics are fastest
      images: 1.3    // Images take moderate time
    };

    const totalTime = tasks.reduce((sum, task) => {
      const multiplier = taskTypeMultipliers[task.taskType] || 1.0;
      return sum + (baseTimePerTask * multiplier);
    }, 0);

    // Add parallel processing benefit if enabled
    if (this.config.enableParallel) {
      const concurrency = this.config.maxBatchSize || 10;
      const effectiveConcurrency = Math.min(concurrency, tasks.length);
      return totalTime / effectiveConcurrency;
    }

    return totalTime;
  }
}
