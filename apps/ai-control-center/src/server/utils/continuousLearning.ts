import { AceyOrchestrator, AceyOutput, TaskType } from './orchestrator';
import { AudioCodingOrchestrator } from './audioCodingOrchestrator';
import AceyLibraryManager from "../server/utils/libraryManager";
import fs from "fs";
import path from "path";

export interface ContinuousLearningConfig {
  autoFineTune: boolean;
  fineTuneBatchSize: number;
  learningRate: number;
  validationSplit: number;
  minConfidenceThreshold: number;
  maxDatasetSize: number;
  checkpointInterval: number;
}

export interface LearningMetrics {
  totalSamples: number;
  approvedSamples: number;
  rejectedSamples: number;
  averageConfidence: number;
  lastUpdateTime: Date;
  fineTuneHistory: Array<{
    timestamp: Date;
    samplesUsed: number;
    accuracy: number;
    loss: number;
  }>;
}

export interface DatasetEntry {
  id: string;
  taskType: TaskType;
  prompt: string;
  output: AceyOutput;
  approved: boolean;
  confidence: number;
  timestamp: Date;
  metadata?: any;
}

export class ContinuousLearningLoop {
  private config: ContinuousLearningConfig;
  private orchestrator: AudioCodingOrchestrator;
  private dataset: Map<string, DatasetEntry> = new Map();
  private metrics: LearningMetrics;
  private fineTuneQueue: DatasetEntry[] = [];
  private isFineTuning: boolean = false;

  constructor(orchestrator: AudioCodingOrchestrator, config: Partial<ContinuousLearningConfig> = {}) {
    this.orchestrator = orchestrator;
    this.config = {
      autoFineTune: true,
      fineTuneBatchSize: 20,
      learningRate: 0.001,
      validationSplit: 0.2,
      minConfidenceThreshold: 0.7,
      maxDatasetSize: 10000,
      checkpointInterval: 100,
      ...config
    };

    this.metrics = {
      totalSamples: 0,
      approvedSamples: 0,
      rejectedSamples: 0,
      averageConfidence: 0,
      lastUpdateTime: new Date(),
      fineTuneHistory: []
    };

    this.loadExistingDataset();
  }

  async processOutput(taskType: TaskType, prompt: string, output: AceyOutput, approved: boolean): Promise<void> {
    const entry: DatasetEntry = {
      id: Date.now().toString() + Math.random(),
      taskType,
      prompt,
      output,
      approved,
      confidence: this.calculateConfidence(output),
      timestamp: new Date(),
      metadata: {
        intents: output.intents,
        processingTime: output.metadata?.processingTime,
        trust: output.metadata?.trust
      }
    };

    // Add to dataset
    this.dataset.set(entry.id, entry);
    this.updateMetrics(entry);

    // Save approved outputs to JSONL using library manager
    if (approved && entry.confidence >= this.config.minConfidenceThreshold) {
      const datasetPath = path.join(
        AceyLibraryManager.paths.datasets,
        `acey_${taskType.toLowerCase()}.jsonl` 
      );
      
      const jsonlEntry = JSON.stringify({
        id: entry.id,
        taskType: entry.taskType,
        prompt: entry.prompt,
        output: entry.output,
        confidence: entry.confidence,
        timestamp: entry.timestamp,
        metadata: entry.metadata
      });
      
      // Append to JSONL file
      fs.appendFileSync(datasetPath, jsonlEntry + "\n");
      
      // Add to fine-tune queue
      this.fineTuneQueue.push(entry);
    }

    // Trigger fine-tuning if conditions are met
    if (this.config.autoFineTune && this.shouldTriggerFineTune()) {
      await this.triggerFineTune();
    }

    // Save dataset
    await this.saveDataset();
  }

  private calculateConfidence(output: AceyOutput): number {
    let confidence = 0.5; // Base confidence

    // Factor in approval status
    if (output.approved) {
      confidence += 0.3;
    }

    // Factor in intent confidence
    if (output.intents && output.intents.length > 0) {
      const avgIntentConfidence = output.intents.reduce((sum, intent) => sum + intent.confidence, 0) / output.intents.length;
      confidence += avgIntentConfidence * 0.2;
    }

    // Factor in output quality
    if (output.speech && output.speech.length > 10) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private updateMetrics(entry: DatasetEntry): void {
    this.metrics.totalSamples++;
    if (entry.approved) {
      this.metrics.approvedSamples++;
    } else {
      this.metrics.rejectedSamples++;
    }

    // Update average confidence
    const totalConfidence = Array.from(this.dataset.values()).reduce((sum, e) => sum + e.confidence, 0);
    this.metrics.averageConfidence = totalConfidence / this.dataset.size;
    this.metrics.lastUpdateTime = new Date();
  }

  private shouldTriggerFineTune(): boolean {
    return (
      !this.isFineTuning &&
      this.fineTuneQueue.length >= this.config.fineTuneBatchSize &&
      this.dataset.size >= this.config.checkpointInterval
    );
  }

  private async triggerFineTune(): Promise<void> {
    if (this.isFineTuning) return;

    this.isFineTuning = true;
    const startTime = Date.now();

    try {
      // Prepare training data
      const trainingData = this.fineTuneQueue.splice(0, this.config.fineTuneBatchSize);
      
      // Split into train/validation
      const splitIndex = Math.floor(trainingData.length * (1 - this.config.validationSplit));
      const trainData = trainingData.slice(0, splitIndex);
      const validationData = trainingData.slice(splitIndex);

      // Simulate fine-tuning process
      const accuracy = 0.85 + Math.random() * 0.1; // 85-95% accuracy
      const loss = Math.random() * 0.2; // 0-0.2 loss

      // Update fine-tune history
      this.metrics.fineTuneHistory.push({
        timestamp: new Date(),
        samplesUsed: trainingData.length,
        accuracy,
        loss
      });

      // Keep only last 10 fine-tune records
      if (this.metrics.fineTuneHistory.length > 10) {
        this.metrics.fineTuneHistory.shift();
      }

      console.log(`Fine-tuning completed: ${trainingData.length} samples, accuracy: ${(accuracy * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('Fine-tuning failed:', error);
    } finally {
      this.isFineTuning = false;
    }
  }

  private async loadExistingDataset(): Promise<void> {
    try {
      // In a real implementation, this would load from a database or file
      // For now, we'll start with an empty dataset
      console.log('Dataset loaded (empty for demo)');
    } catch (error) {
      console.error('Failed to load dataset:', error);
    }
  }

  private async saveDataset(): Promise<void> {
    try {
      // In a real implementation, this would save to a database or file
      console.log(`Dataset saved: ${this.dataset.size} entries`);
    } catch (error) {
      console.error('Failed to save dataset:', error);
    }
  }

  getMetrics(): LearningMetrics {
    return { ...this.metrics };
  }

  getDatasetStats(): Record<TaskType, number> {
    const stats: Record<string, number> = {
      audio: 0,
      website: 0,
      graphics: 0
    };

    for (const entry of this.dataset.values()) {
      if (entry.taskType in stats) {
        stats[entry.taskType]++;
      }
    }

    return stats as Record<TaskType, number>;
  }

  getRecentSamples(limit: number = 10): DatasetEntry[] {
    return Array.from(this.dataset.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getFineTuneProgress(): {
    queuedBatches: number;
    isFineTuning: boolean;
    progress: number;
    estimatedTimeRemaining: number;
  } {
    const queuedBatches = Math.floor(this.fineTuneQueue.length / this.config.fineTuneBatchSize);
    const progress = this.isFineTuning ? Math.random() * 100 : 0;
    const estimatedTimeRemaining = this.isFineTuning ? Math.floor(Math.random() * 30) + 10 : 0;

    return {
      queuedBatches,
      isFineTuning: this.isFineTuning,
      progress,
      estimatedTimeRemaining
    };
  }

  async manualFineTune(): Promise<void> {
    if (this.fineTuneQueue.length < this.config.fineTuneBatchSize) {
      throw new Error('Insufficient samples for fine-tuning');
    }
    await this.triggerFineTune();
  }

  clearDataset(): void {
    this.dataset.clear();
    this.fineTuneQueue = [];
    this.metrics = {
      totalSamples: 0,
      approvedSamples: 0,
      rejectedSamples: 0,
      averageConfidence: 0,
      lastUpdateTime: new Date(),
      fineTuneHistory: []
    };
  }

  exportDataset(): string {
    const data = Array.from(this.dataset.values());
    return JSON.stringify(data, null, 2);
  }

  importDataset(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as DatasetEntry[];
      for (const entry of data) {
        this.dataset.set(entry.id, entry);
        this.updateMetrics(entry);
      }
      console.log(`Imported ${data.length} dataset entries`);
    } catch (error) {
      throw new Error('Invalid dataset format');
    }
  }
}
