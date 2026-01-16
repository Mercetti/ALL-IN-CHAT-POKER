import { Logger } from '../utils/logger';

export interface DatasetEntry {
  id: string;
  skill: string;
  input: any;
  output: any;
  userRole: string;
  timestamp: string;
  approved: boolean;
  confidence?: number;
  feedback?: string;
}

export interface TrainingMetrics {
  totalEntries: number;
  approvedEntries: number;
  pendingEntries: number;
  lastTrainingDate?: string;
  trainingThreshold: number;
  readyForTraining: boolean;
}

export class DatasetManager {
  private pending: DatasetEntry[] = [];
  private trained: DatasetEntry[] = [];
  private logger: Logger;
  private trainingThreshold = 10; // Minimum entries to trigger training
  private lastTrainingDate?: string;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Add new entry to dataset
   */
  add(entry: Omit<DatasetEntry, 'id'>): void {
    const fullEntry: DatasetEntry = {
      id: this.generateEntryId(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.pending.push(fullEntry);
    this.logger.debug(`Dataset entry added: ${entry.skill} by ${entry.userRole}`);
  }

  /**
   * Get pending entries for training
   */
  getPending(): DatasetEntry[] {
    return [...this.pending];
  }

  /**
   * Get all entries (pending + trained)
   */
  getAll(): DatasetEntry[] {
    return [...this.pending, ...this.trained];
  }

  /**
   * Mark entries as trained and move to trained set
   */
  async markAsTrained(entries: DatasetEntry[]): Promise<void> {
    for (const entry of entries) {
      const index = this.pending.findIndex(p => p.id === entry.id);
      if (index > -1) {
        this.pending.splice(index, 1);
        this.trained.push(entry);
      }
    }

    this.lastTrainingDate = new Date().toISOString();
    this.logger.log(`Trained ${entries.length} dataset entries`);
  }

  /**
   * Get dataset metrics
   */
  getMetrics(): TrainingMetrics {
    const pendingCount = this.pending.length;
    const trainedCount = this.trained.length;
    const totalCount = pendingCount + trainedCount;

    return {
      totalEntries: totalCount,
      approvedEntries: trainedCount,
      pendingEntries: pendingCount,
      lastTrainingDate: this.lastTrainingDate,
      trainingThreshold: this.trainingThreshold,
      readyForTraining: pendingCount >= this.trainingThreshold
    };
  }

  /**
   * Get entries by skill
   */
  getEntriesBySkill(skillName: string): DatasetEntry[] {
    return this.getAll().filter(entry => entry.skill === skillName);
  }

  /**
   * Get entries by user role
   */
  getEntriesByRole(role: string): DatasetEntry[] {
    return this.getAll().filter(entry => entry.userRole === role);
  }

  /**
   * Get high-quality entries for training
   */
  getHighQualityEntries(minConfidence: number = 0.8): DatasetEntry[] {
    return this.getAll().filter(entry => 
      entry.approved && 
      (entry.confidence || 0) >= minConfidence
    );
  }

  /**
   * Generate training data in JSONL format for LLM fine-tuning
   */
  generateTrainingData(skillName?: string): string {
    let entries = this.getHighQualityEntries();
    
    if (skillName) {
      entries = entries.filter(entry => entry.skill === skillName);
    }

    const trainingData = entries.map(entry => ({
      prompt: this.formatPrompt(entry),
      completion: this.formatCompletion(entry),
      skill: entry.skill,
      userRole: entry.userRole
    }));

    return trainingData.map(item => JSON.stringify(item)).join('\n');
  }

  /**
   * Format input for LLM training
   */
  private formatPrompt(entry: DatasetEntry): string {
    return `Skill: ${entry.skill}\nUser Role: ${entry.userRole}\nInput: ${JSON.stringify(entry.input)}`;
  }

  /**
   * Format output for LLM training
   */
  private formatCompletion(entry: DatasetEntry): string {
    return JSON.stringify(entry.output);
  }

  /**
   * Get last training date
   */
  getLastTrainingDate(): string | undefined {
    return this.lastTrainingDate;
  }

  /**
   * Add feedback to entry
   */
  addFeedback(entryId: string, feedback: string, rating?: number): void {
    const entry = this.findEntryById(entryId);
    if (entry) {
      entry.feedback = feedback;
      if (rating) {
        entry.confidence = rating;
      }
      this.logger.log(`Feedback added for entry ${entryId}`);
    }
  }

  /**
   * Find entry by ID
   */
  private findEntryById(id: string): DatasetEntry | undefined {
    return this.getAll().find(entry => entry.id === id);
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    return `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean old entries to manage memory
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    const initialCount = this.getAll().length;

    this.pending = this.pending.filter(entry => 
      new Date(entry.timestamp).getTime() > cutoffTime
    );
    this.trained = this.trained.filter(entry => 
      new Date(entry.timestamp).getTime() > cutoffTime
    );

    const finalCount = this.getAll().length;
    if (initialCount !== finalCount) {
      this.logger.log(`Cleaned up ${initialCount - finalCount} old dataset entries`);
    }
  }

  /**
   * Export dataset for backup
   */
  async exportDataset(): Promise<string> {
    const datasetData = {
      exportTime: new Date().toISOString(),
      metrics: this.getMetrics(),
      entries: this.getAll()
    };
    
    return JSON.stringify(datasetData, null, 2);
  }

  /**
   * Get skill performance statistics
   */
  getSkillPerformance(): Record<string, {
    usage: number;
    avgConfidence: number;
    successRate: number;
  }> {
    const entries = this.getAll();
    const skillStats: Record<string, any> = {};

    for (const entry of entries) {
      if (!skillStats[entry.skill]) {
        skillStats[entry.skill] = {
          usage: 0,
          totalConfidence: 0,
          successes: 0
        };
      }

      skillStats[entry.skill].usage++;
      if (entry.confidence) {
        skillStats[entry.skill].totalConfidence += entry.confidence;
      }
      if (entry.approved) {
        skillStats[entry.skill].successes++;
      }
    }

    // Calculate averages and rates
    for (const [skill, stats] of Object.entries(skillStats)) {
      const avgConfidence = stats.totalConfidence / stats.usage;
      const successRate = (stats.successes / stats.usage) * 100;
      
      skillStats[skill] = {
        usage: stats.usage,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        successRate: Math.round(successRate * 100) / 100
      };
    }

    return skillStats;
  }
}
