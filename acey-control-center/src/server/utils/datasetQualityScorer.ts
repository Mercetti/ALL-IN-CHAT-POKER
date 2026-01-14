// File: src/server/utils/datasetQualityScorer.ts

/**
 * Dataset Quality Scoring
 * Acey decides which data is worth learning from based on comprehensive quality metrics
 */

import fs from 'fs';
import path from 'path';

export type DatasetMetrics = {
  sizeMB: number;
  entropyScore: number;     // 0–1
  duplicateRate: number;    // 0–1
  humanReviewed: boolean;
  errorRate: number;        // 0–1
  avgConfidence: number;    // 0–1
  avgTrust: number;         // 0–1
  diversityIndex: number;   // 0–1
  completenessRate: number; // 0–1
  freshnessScore: number;    // 0–1
};

export type QualityThresholds = {
  excellent: number;  // > 0.8
  good: number;      // > 0.7
  acceptable: number; // > 0.6
  poor: number;      // > 0.4
  unusable: number;  // <= 0.4
};

export type QualityDecision = {
  score: number;
  grade: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unusable';
  action: 'train' | 'archive' | 'reject' | 'review';
  reason: string;
  recommendations: string[];
};

/**
 * Calculate dataset quality score based on multiple metrics
 */
export function scoreDatasetQuality(metrics: DatasetMetrics): number {
  let score = 0;

  // Size contribution (20% weight) - optimal around 100-500MB
  score += Math.min(metrics.sizeMB / 500, 1) * 0.2;

  // Entropy contribution (30% weight) - higher entropy is better
  score += metrics.entropyScore * 0.3;

  // Duplicate penalty (20% weight) - lower duplicates is better
  score += (1 - metrics.duplicateRate) * 0.2;

  // Error penalty (20% weight) - lower errors is better
  score += (1 - metrics.errorRate) * 0.2;

  // Human review bonus (10% weight)
  score += metrics.humanReviewed ? 0.1 : 0;

  return +score.toFixed(2); // 0–1
}

/**
 * Determine quality grade and action based on score
 */
export function evaluateDatasetQuality(
  metrics: DatasetMetrics,
  thresholds: QualityThresholds = {
    excellent: 0.8,
    good: 0.7,
    acceptable: 0.6,
    poor: 0.4,
    unusable: 0.4
  }
): QualityDecision {
  const score = scoreDatasetQuality(metrics);
  
  let grade: QualityDecision['grade'];
  let action: QualityDecision['action'];
  let reason: string;
  const recommendations: string[] = [];

  if (score >= thresholds.excellent) {
    grade = 'excellent';
    action = 'train';
    reason = 'Excellent quality dataset suitable for immediate training';
  } else if (score >= thresholds.good) {
    grade = 'good';
    action = 'train';
    reason = 'Good quality dataset suitable for training';
  } else if (score >= thresholds.acceptable) {
    grade = 'acceptable';
    action = 'train';
    reason = 'Acceptable quality, can be used for training with caution';
    recommendations.push('Consider additional validation');
  } else if (score > thresholds.poor) {
    grade = 'poor';
    action = 'archive';
    reason = 'Poor quality, not suitable for training';
    recommendations.push('Improve data quality before training');
    recommendations.push('Consider data cleaning and deduplication');
  } else {
    grade = 'unusable';
    action = 'reject';
    reason = 'Unusable quality dataset';
    recommendations.push('Reject dataset completely');
    recommendations.push('Requires complete data regeneration');
  }

  // Specific recommendations based on metrics
  if (metrics.duplicateRate > 0.3) {
    recommendations.push('High duplicate rate detected - consider deduplication');
  }
  
  if (metrics.errorRate > 0.2) {
    recommendations.push('High error rate - review data validation');
  }
  
  if (metrics.avgConfidence < 0.6) {
    recommendations.push('Low average confidence - review model outputs');
  }
  
  if (metrics.diversityIndex < 0.5) {
    recommendations.push('Low diversity - add more varied examples');
  }

  return {
    score,
    grade,
    action,
    reason,
    recommendations
  };
}

/**
 * Dataset Quality Scorer Class
 */
export class DatasetQualityScorer {
  private thresholds: QualityThresholds;
  private history: Array<{
    timestamp: number;
    datasetPath: string;
    metrics: DatasetMetrics;
    decision: QualityDecision;
  }> = [];

  constructor(thresholds?: Partial<QualityThresholds>) {
    this.thresholds = {
      excellent: 0.8,
      good: 0.7,
      acceptable: 0.6,
      poor: 0.4,
      unusable: 0.4,
      ...thresholds
    };
  }

  /**
   * Analyze dataset file and calculate quality metrics
   */
  public async analyzeDataset(datasetPath: string): Promise<{
    metrics: DatasetMetrics;
    decision: QualityDecision;
  }> {
    try {
      // Check if file exists
      if (!fs.existsSync(datasetPath)) {
        throw new Error(`Dataset file not found: ${datasetPath}`);
      }

      // Read dataset
      const content = fs.readFileSync(datasetPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Calculate basic metrics
      const stats = fs.statSync(datasetPath);
      const sizeMB = stats.size / (1024 * 1024);
      
      // Parse and analyze entries
      const entries = lines.map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.warn(`Failed to parse line ${index + 1}: ${error}`);
          return null;
        }
      }).filter(entry => entry !== null);

      // Calculate quality metrics
      const metrics = this.calculateMetrics(entries, sizeMB);
      
      // Evaluate quality
      const decision = evaluateDatasetQuality(metrics, this.thresholds);
      
      // Record in history
      this.history.push({
        timestamp: Date.now(),
        datasetPath,
        metrics,
        decision
      });

      return { metrics, decision };
      
    } catch (error) {
      console.error(`Failed to analyze dataset ${datasetPath}:`, error);
      
      // Return poor quality metrics on error
      const errorMetrics: DatasetMetrics = {
        sizeMB: 0,
        entropyScore: 0,
        duplicateRate: 1,
        humanReviewed: false,
        errorRate: 1,
        avgConfidence: 0,
        avgTrust: 0,
        diversityIndex: 0,
        completenessRate: 0,
        freshnessScore: 0
      };
      
      const decision = evaluateDatasetQuality(errorMetrics, this.thresholds);
      
      return { metrics: errorMetrics, decision };
    }
  }

  /**
   * Calculate quality metrics from dataset entries
   */
  private calculateMetrics(entries: any[], sizeMB: number): DatasetMetrics {
    if (entries.length === 0) {
      return {
        sizeMB,
        entropyScore: 0,
        duplicateRate: 1,
        humanReviewed: false,
        errorRate: 1,
        avgConfidence: 0,
        avgTrust: 0,
        diversityIndex: 0,
        completenessRate: 0,
        freshnessScore: 0
      };
    }

    // Calculate entropy (text diversity)
    const allText = entries.map(e => JSON.stringify(e)).join(' ');
    const entropyScore = this.calculateTextEntropy(allText);
    
    // Calculate duplicate rate
    const uniqueInputs = new Set(entries.map(e => e.input?.prompt || '').filter(Boolean));
    const duplicateRate = 1 - (uniqueInputs.size / entries.length);
    
    // Calculate error rate (invalid entries)
    const validEntries = entries.filter(e => 
      e.input && e.output && e.input.prompt && e.output.speech
    );
    const errorRate = 1 - (validEntries.length / entries.length);
    
    // Calculate average confidence and trust
    const confidences = validEntries.map(e => e.output?.confidence || 0).filter(c => c > 0);
    const trusts = validEntries.map(e => e.output?.trust || 0).filter(t => t > 0);
    
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length 
      : 0;
    
    const avgTrust = trusts.length > 0 
      ? trusts.reduce((sum, t) => sum + t, 0) / trusts.length 
      : 0;
    
    // Calculate diversity index (task type diversity)
    const taskTypes = entries.map(e => e.input?.context?.taskType || 'unknown');
    const uniqueTaskTypes = new Set(taskTypes);
    const diversityIndex = uniqueTaskTypes.size / Math.max(taskTypes.length, 1);
    
    // Calculate completeness rate (required fields present)
    const completeEntries = validEntries.filter(e => 
      e.input.context && e.output.intents && e.output.intents.length > 0
    );
    const completenessRate = completeEntries.length / entries.length;
    
    // Calculate freshness score (recency of data)
    const timestamps = entries.map(e => e.timestamp || e.input?.timestamp).filter(Boolean);
    const now = Date.now();
    const avgAge = timestamps.length > 0 
      ? timestamps.reduce((sum, ts) => sum + (now - new Date(ts).getTime()), 0) / timestamps.length
      : Infinity;
    
    // Convert age to freshness score (newer = higher score)
    const freshnessScore = Math.max(0, 1 - (avgAge / (30 * 24 * 60 * 60 * 1000))); // 30 days window
    
    // Check if human reviewed (simplified - could be enhanced with actual review tracking)
    const humanReviewed = entries.some(e => e.humanReviewed || e.reviewed);

    return {
      sizeMB,
      entropyScore,
      duplicateRate,
      humanReviewed,
      errorRate,
      avgConfidence,
      avgTrust,
      diversityIndex,
      completenessRate,
      freshnessScore
    };
  }

  /**
   * Calculate text entropy (measure of diversity/unpredictability)
   */
  private calculateTextEntropy(text: string): number {
    const charFreq: Record<string, number> = {};
    const totalChars = text.length;
    
    // Count character frequencies
    for (const char of text) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
    
    // Calculate entropy
    let entropy = 0;
    for (const freq of Object.values(charFreq)) {
      if (freq > 0) {
        const probability = freq / totalChars;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    // Normalize to 0-1 range (max entropy for ASCII is ~7.1 bits)
    return Math.min(1, entropy / 7.1);
  }

  /**
   * Get quality history
   */
  public getHistory(): typeof this.history {
    return [...this.history];
  }

  /**
   * Get quality statistics
   */
  public getStatistics(): {
    totalDatasets: number;
    avgQualityScore: number;
    gradeDistribution: Record<string, number>;
    actionDistribution: Record<string, number>;
  } {
    if (this.history.length === 0) {
      return {
        totalDatasets: 0,
        avgQualityScore: 0,
        gradeDistribution: {},
        actionDistribution: {}
      };
    }

    const totalDatasets = this.history.length;
    const avgQualityScore = this.history.reduce((sum, h) => sum + h.decision.score, 0) / totalDatasets;
    
    const gradeDistribution: Record<string, number> = {};
    const actionDistribution: Record<string, number> = {};
    
    for (const history of this.history) {
      gradeDistribution[history.decision.grade] = (gradeDistribution[history.decision.grade] || 0) + 1;
      actionDistribution[history.decision.action] = (actionDistribution[history.decision.action] || 0) + 1;
    }

    return {
      totalDatasets,
      avgQualityScore,
      gradeDistribution,
      actionDistribution
    };
  }

  /**
   * Update thresholds
   */
  public updateThresholds(newThresholds: Partial<QualityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.history = [];
  }
}

// LLM Rule Integration
export const DATASET_QUALITY_RULES = {
  MIN_SCORE_FOR_TRAINING: 0.6,
  SCORE_FOR_ARCHIVAL: 0.4,
  NEVER_FINE_TUNE_LOW_QUALITY: 'Never fine-tune on datasets with score < 0.6',
  QUALITY_THRESHOLDS: {
    excellent: 0.8,
    good: 0.7,
    acceptable: 0.6,
    poor: 0.4,
    unusable: 0.4
  }
};
