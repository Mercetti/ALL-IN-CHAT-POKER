/**
 * Scheduler
 * Handles auto-cycles, fine-tuning, and low-priority tasks
 */

import { AceyStabilityModule } from "./acey-stability";

export class Scheduler {
  private intervalId?: NodeJS.Timeout;
  private running: boolean = false;
  private taskQueue: Array<{type: string, data: any, priority: number}> = [];

  constructor(private acey: AceyStabilityModule) {}

  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.intervalId = setInterval(async () => {
      await this.runScheduledTasks();
    }, 10000); // Run every 10 seconds
    
    console.log('Scheduler started');
  }

  stop(): void {
    if (!this.running) return;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    console.log('Scheduler stopped');
  }

  forceStop(): void {
    // Emergency stop - no graceful shutdown
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    this.taskQueue = []; // Clear pending tasks
    
    console.log('Scheduler force stopped');
  }

  private async runScheduledTasks(): Promise<void> {
    if (!this.acey.getStatus().active) return;
    
    try {
      // Process high priority tasks first
      const highPriorityTasks = this.taskQueue.filter(t => t.priority >= 8);
      const normalTasks = this.taskQueue.filter(t => t.priority < 8);
      
      // Execute high priority tasks
      for (const task of highPriorityTasks) {
        await this.executeTask(task);
        this.removeTask(task);
      }
      
      // Execute one normal task per cycle to avoid overload
      if (normalTasks.length > 0) {
        const task = normalTasks[0];
        await this.executeTask(task);
        this.removeTask(task);
      }
      
      // Run built-in maintenance tasks
      await this.runMaintenanceTasks();
      
    } catch (error: any) {
      console.error('Scheduler task execution failed:', error.message);
    }
  }

  private async executeTask(task: any): Promise<void> {
    console.log(`Executing task: ${task.type}`);
    
    switch (task.type) {
      case 'fine-tuning':
        await this.runFineTuning(task.data);
        break;
      case 'dataset-prep':
        await this.prepareDataset(task.data);
        break;
      case 'simulation':
        await this.runSimulation(task.data);
        break;
      case 'cleanup':
        await this.runCleanup(task.data);
        break;
      default:
        console.warn(`Unknown task type: ${task.type}`);
    }
  }

  private async runFineTuning(data: any): Promise<void> {
    // Placeholder for fine-tuning implementation
    console.log('Running fine-tuning task');
    // This would integrate with actual fine-tuning system
  }

  private async prepareDataset(data: any): Promise<void> {
    // Placeholder for dataset preparation
    console.log('Preparing dataset');
    // This would integrate with dataset management
  }

  private async runSimulation(data: any): Promise<void> {
    // Placeholder for simulation execution
    console.log('Running simulation');
    // This would integrate with simulation system
  }

  private async runCleanup(data: any): Promise<void> {
    // Placeholder for cleanup tasks
    console.log('Running cleanup task');
    // This would handle log rotation, temp file cleanup, etc.
  }

  private async runMaintenanceTasks(): Promise<void> {
    // Check system health
    const status = this.acey.getStatus();
    
    // If resources are high, skip non-critical tasks
    if (status.resources.cpu > 80 || status.resources.ram > 80) {
      console.log('High resource usage - skipping maintenance tasks');
      return;
    }
    
    // Run routine maintenance
    await this.performLogRotation();
    await this.performCacheCleanup();
    await this.performHealthCheck();
  }

  private async performLogRotation(): Promise<void> {
    // Placeholder for log rotation
    console.log('Performing log rotation');
  }

  private async performCacheCleanup(): Promise<void> {
    // Placeholder for cache cleanup
    console.log('Performing cache cleanup');
  }

  private async performHealthCheck(): Promise<void> {
    // Additional health checks beyond watchdog
    console.log('Performing scheduler health check');
  }

  // Task management methods
  addTask(type: string, data: any, priority: number = 5): void {
    this.taskQueue.push({
      type,
      data,
      priority,
      timestamp: Date.now()
    });
    
    // Sort by priority (highest first)
    this.taskQueue.sort((a, b) => b.priority - a.priority);
  }

  private removeTask(taskToRemove: any): void {
    const index = this.taskQueue.indexOf(taskToRemove);
    if (index > -1) {
      this.taskQueue.splice(index, 1);
    }
  }

  // Get scheduler status
  getStatus(): any {
    return {
      running: this.running,
      taskQueueSize: this.taskQueue.length,
      nextTask: this.taskQueue.length > 0 ? this.taskQueue[0].type : null,
      lastExecution: new Date().toISOString()
    };
  }
}
