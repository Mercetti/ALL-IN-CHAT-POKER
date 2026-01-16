/**
 * Fine-Tune Dataset Preparation for Acey Self-Hosted LLM
 * Phase 1: Self-Hosted Acey LLM Migration
 * 
 * This module prepares and manages training datasets for continuous learning
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface FineTuneEntry {
  input: any;
  output: any;
  timestamp: string;
  skillName: string;
  executionTime: number;
  success: boolean;
  constitutionalCompliance: boolean;
  quality: number;
}

export interface DatasetStats {
  totalEntries: number;
  skillBreakdown: Record<string, number>;
  averageQuality: number;
  successRate: number;
  constitutionalComplianceRate: number;
  lastUpdated: string;
}

export class FineTuneDatasetManager {
  private modelPath: string;
  private datasetPath: string;
  private statsPath: string;

  constructor(modelPath = 'D:/AceyLLM') {
    this.modelPath = modelPath;
    this.datasetPath = path.join(modelPath, 'training_data', 'fine_tune');
    this.statsPath = path.join(this.datasetPath, 'dataset_stats.json');
    
    this.ensureDirectories();
  }

  /**
   * Ensure necessary directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.datasetPath)) {
      fs.mkdirSync(this.datasetPath, { recursive: true });
    }
  }

  /**
   * Prepare fine-tune dataset for a specific skill
   */
  prepareFineTuneDataset(skillName: string, modelPath: string): FineTuneEntry[] {
    const trainingFile = path.join(modelPath, 'training_data', 'skills', `${skillName}_training.jsonl`);
    
    if (!fs.existsSync(trainingFile)) {
      console.log(`📂 No training data found for skill: ${skillName}`);
      return [];
    }

    try {
      const lines = fs.readFileSync(trainingFile, 'utf-8').split('\n').filter(Boolean);
      const entries: FineTuneEntry[] = lines.map(line => JSON.parse(line));
      
      // Filter for high-quality entries
      const highQualityEntries = entries.filter(entry => 
        entry.success && 
        entry.constitutionalCompliance && 
        entry.quality >= 0.7
      );

      console.log(`📊 Prepared ${highQualityEntries.length} high-quality entries for ${skillName}`);
      
      // Update dataset statistics
      this.updateDatasetStats(skillName, highQualityEntries);
      
      return highQualityEntries;
      
    } catch (error) {
      console.error(`Failed to prepare dataset for ${skillName}:`, error);
      return [];
    }
  }

  /**
   * Prepare master fine-tune dataset across all skills
   */
  prepareMasterDataset(modelPath: string): FineTuneEntry[] {
    const masterFile = path.join(modelPath, 'training_data', 'fine_tune', 'master_training.jsonl');
    
    if (!fs.existsSync(masterFile)) {
      console.log('📂 No master training data found');
      return [];
    }

    try {
      const lines = fs.readFileSync(masterFile, 'utf-8').split('\n').filter(Boolean);
      const entries: FineTuneEntry[] = lines.map(line => JSON.parse(line));
      
      // Filter for high-quality entries
      const highQualityEntries = entries.filter(entry => 
        entry.success && 
        entry.constitutionalCompliance && 
        entry.quality >= 0.7
      );

      console.log(`📊 Prepared ${highQualityEntries.length} high-quality master entries`);
      
      return highQualityEntries;
      
    } catch (error) {
      console.error('Failed to prepare master dataset:', error);
      return [];
    }
  }

  /**
   * Transform dataset for model training format
   */
  transformForTraining(entries: FineTuneEntry[]): any[] {
    return entries.map(entry => ({
      // Input format for training
      prompt: this.formatPrompt(entry),
      
      // Expected output
      completion: this.formatCompletion(entry),
      
      // Metadata for analysis
      metadata: {
        skill: entry.skillName,
        timestamp: entry.timestamp,
        quality: entry.quality,
        executionTime: entry.executionTime
      }
    }));
  }

  /**
   * Format input as training prompt
   */
  private formatPrompt(entry: FineTuneEntry): string {
    const input = typeof entry.input === 'string' ? entry.input : JSON.stringify(entry.input);
    
    return `Skill: ${entry.skillName}\nInput: ${input}\nExecute with constitutional compliance:`;
  }

  /**
   * Format output as training completion
   */
  private formatCompletion(entry: FineTuneEntry): string {
    const output = typeof entry.output === 'string' ? entry.output : JSON.stringify(entry.output);
    return output;
  }

  /**
   * Create balanced dataset for training
   */
  createBalancedDataset(entries: FineTuneEntry[], maxEntriesPerSkill = 1000): FineTuneEntry[] {
    // Group entries by skill
    const skillGroups: Record<string, FineTuneEntry[]> = {};
    
    for (const entry of entries) {
      if (!skillGroups[entry.skillName]) {
        skillGroups[entry.skillName] = [];
      }
      skillGroups[entry.skillName].push(entry);
    }

    // Balance the dataset
    const balancedEntries: FineTuneEntry[] = [];
    
    for (const [skillName, skillEntries] of Object.entries(skillGroups)) {
      // Sort by quality (highest first)
      skillEntries.sort((a, b) => b.quality - a.quality);
      
      // Take top entries for this skill
      const topEntries = skillEntries.slice(0, maxEntriesPerSkill);
      balancedEntries.push(...topEntries);
    }

    // Sort overall by timestamp for chronological training
    balancedEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`📊 Created balanced dataset with ${balancedEntries.length} entries across ${Object.keys(skillGroups).length} skills`);
    
    return balancedEntries;
  }

  /**
   * Split dataset into train/validation/test sets
   */
  splitDataset(entries: FineTuneEntry[], trainRatio = 0.8, valRatio = 0.1): {
    train: FineTuneEntry[];
    validation: FineTuneEntry[];
    test: FineTuneEntry[];
  } {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    
    const trainSize = Math.floor(shuffled.length * trainRatio);
    const valSize = Math.floor(shuffled.length * valRatio);
    
    return {
      train: shuffled.slice(0, trainSize),
      validation: shuffled.slice(trainSize, trainSize + valSize),
      test: shuffled.slice(trainSize + valSize)
    };
  }

  /**
   * Export dataset in various formats
   */
  exportDataset(entries: FineTuneEntry[], format: 'jsonl' | 'json' | 'csv' = 'jsonl', outputPath?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(this.datasetPath, `dataset_${timestamp}.${format}`);
    const filePath = outputPath || defaultPath;

    try {
      switch (format) {
        case 'jsonl':
          const jsonlContent = entries.map(entry => JSON.stringify(entry)).join('\n');
          fs.writeFileSync(filePath, jsonlContent);
          break;
          
        case 'json':
          fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
          break;
          
        case 'csv':
          const csvHeader = 'skillName,timestamp,executionTime,success,constitutionalCompliance,quality,input,output\n';
          const csvContent = entries.map(entry => 
            `${entry.skillName},${entry.timestamp},${entry.executionTime},${entry.success},${entry.constitutionalCompliance},${entry.quality},"${JSON.stringify(entry.input).replace(/"/g, '""')}","${JSON.stringify(entry.output).replace(/"/g, '""')}"`
          ).join('\n');
          fs.writeFileSync(filePath, csvHeader + csvContent);
          break;
      }
      
      console.log(`📁 Dataset exported to ${filePath}`);
      return filePath;
      
    } catch (error) {
      console.error('Failed to export dataset:', error);
      throw error;
    }
  }

  /**
   * Analyze dataset quality and provide insights
   */
  analyzeDataset(entries: FineTuneEntry[]): {
    stats: DatasetStats;
    insights: string[];
    recommendations: string[];
  } {
    if (entries.length === 0) {
      return {
        stats: {
          totalEntries: 0,
          skillBreakdown: {},
          averageQuality: 0,
          successRate: 0,
          constitutionalComplianceRate: 0,
          lastUpdated: new Date().toISOString()
        },
        insights: ['No data to analyze'],
        recommendations: ['Generate more training data']
      };
    }

    // Calculate statistics
    const totalEntries = entries.length;
    const skillBreakdown: Record<string, number> = {};
    let totalQuality = 0;
    let successCount = 0;
    let complianceCount = 0;

    for (const entry of entries) {
      // Skill breakdown
      skillBreakdown[entry.skillName] = (skillBreakdown[entry.skillName] || 0) + 1;
      
      // Quality metrics
      totalQuality += entry.quality;
      if (entry.success) successCount++;
      if (entry.constitutionalCompliance) complianceCount++;
    }

    const stats: DatasetStats = {
      totalEntries,
      skillBreakdown,
      averageQuality: totalQuality / totalEntries,
      successRate: successCount / totalEntries,
      constitutionalComplianceRate: complianceCount / totalEntries,
      lastUpdated: new Date().toISOString()
    };

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Quality insights
    if (stats.averageQuality >= 0.8) {
      insights.push('High average quality dataset (>0.8)');
    } else if (stats.averageQuality >= 0.7) {
      insights.push('Good average quality dataset (0.7-0.8)');
      recommendations.push('Focus on higher quality training examples');
    } else {
      insights.push('Low average quality dataset (<0.7)');
      recommendations.push('Improve data quality filtering and generation');
    }

    // Success rate insights
    if (stats.successRate >= 0.95) {
      insights.push('Excellent success rate (>95%)');
    } else if (stats.successRate >= 0.9) {
      insights.push('Good success rate (90-95%)');
    } else {
      insights.push('Low success rate (<90%)');
      recommendations.push('Investigate causes of execution failures');
    }

    // Skill distribution insights
    const skillCount = Object.keys(skillBreakdown).length;
    const maxSkillEntries = Math.max(...Object.values(skillBreakdown));
    const minSkillEntries = Math.min(...Object.values(skillBreakdown));
    
    if (maxSkillEntries / minSkillEntries > 5) {
      insights.push('Imbalanced skill distribution');
      recommendations.push('Generate more training data for underrepresented skills');
    } else {
      insights.push('Balanced skill distribution');
    }

    // Constitutional compliance insights
    if (stats.constitutionalComplianceRate >= 0.99) {
      insights.push('Excellent constitutional compliance (>99%)');
    } else {
      insights.push('Constitutional compliance issues detected');
      recommendations.push('Review constitutional enforcement logic');
    }

    return { stats, insights, recommendations };
  }

  /**
   * Update dataset statistics
   */
  private updateDatasetStats(skillName: string, entries: FineTuneEntry[]): void {
    try {
      let stats: DatasetStats = this.loadDatasetStats();
      
      // Update skill breakdown
      stats.skillBreakdown[skillName] = entries.length;
      
      // Recalculate overall stats
      const allEntries = this.loadAllEntries();
      if (allEntries.length > 0) {
        stats.totalEntries = allEntries.length;
        stats.averageQuality = allEntries.reduce((sum, entry) => sum + entry.quality, 0) / allEntries.length;
        stats.successRate = allEntries.filter(entry => entry.success).length / allEntries.length;
        stats.constitutionalComplianceRate = allEntries.filter(entry => entry.constitutionalCompliance).length / allEntries.length;
      }
      
      stats.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(this.statsPath, JSON.stringify(stats, null, 2));
      
    } catch (error) {
      console.error('Failed to update dataset stats:', error);
    }
  }

  /**
   * Load dataset statistics
   */
  private loadDatasetStats(): DatasetStats {
    if (!fs.existsSync(this.statsPath)) {
      return {
        totalEntries: 0,
        skillBreakdown: {},
        averageQuality: 0,
        successRate: 0,
        constitutionalComplianceRate: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return JSON.parse(fs.readFileSync(this.statsPath, 'utf-8'));
  }

  /**
   * Load all entries from master dataset
   */
  private loadAllEntries(): FineTuneEntry[] {
    const masterFile = path.join(this.datasetPath, 'master_training.jsonl');
    
    if (!fs.existsSync(masterFile)) {
      return [];
    }
    
    try {
      const lines = fs.readFileSync(masterFile, 'utf-8').split('\n').filter(Boolean);
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('Failed to load master dataset:', error);
      return [];
    }
  }

  /**
   * Get dataset statistics
   */
  getDatasetStats(): DatasetStats {
    return this.loadDatasetStats();
  }

  /**
   * Clean up old training data
   */
  cleanupOldData(maxAgeDays = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    try {
      const allEntries = this.loadAllEntries();
      const filteredEntries = allEntries.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );
      
      // Rewrite master file with filtered entries
      const masterFile = path.join(this.datasetPath, 'master_training.jsonl');
      const content = filteredEntries.map(entry => JSON.stringify(entry)).join('\n');
      fs.writeFileSync(masterFile, content);
      
      console.log(`🧹 Cleaned up ${allEntries.length - filteredEntries.length} old entries`);
      
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Generate training report
   */
  generateReport(): string {
    const stats = this.getDatasetStats();
    const allEntries = this.loadAllEntries();
    const analysis = this.analyzeDataset(allEntries);
    
    const report = `
# Acey Fine-Tune Dataset Report

## Overview
- Total Entries: ${stats.totalEntries}
- Average Quality: ${(stats.averageQuality * 100).toFixed(1)}%
- Success Rate: ${(stats.successRate * 100).toFixed(1)}%
- Constitutional Compliance: ${(stats.constitutionalComplianceRate * 100).toFixed(1)}%
- Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}

## Skill Breakdown
${Object.entries(stats.skillBreakdown)
  .map(([skill, count]) => `- ${skill}: ${count} entries`)
  .join('\n')}

## Key Insights
${analysis.insights.map(insight => `- ${insight}`).join('\n')}

## Recommendations
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.datasetPath, `training_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Training report generated: ${reportPath}`);
    return reportPath;
  }
}

export default FineTuneDatasetManager;
