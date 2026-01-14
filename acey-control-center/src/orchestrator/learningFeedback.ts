/**
 * Learning Feedback Loop
 * Logs learning data and adjusts confidence weights
 */

import { SkillResult } from './toolDispatcher';

export interface LearningData {
  id: string;
  skill: string;
  contentType: string;
  summary: string;
  logicOrSteps: string[];
  feedback?: 'approve' | 'needs_improvement';
  trustScore?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PatternMetrics {
  patternId: string;
  successRate: number;
  averageConfidence: number;
  usageCount: number;
  lastUpdated: number;
}

// In-memory storage for learning data (replace with persistent storage in production)
const learningDataset: LearningData[] = [];
const patternMetrics: Map<string, PatternMetrics> = new Map();

/**
 * Log learning data from skill results
 */
export async function logLearningData(
  result: SkillResult,
  userFeedback?: any
): Promise<LearningData> {
  const learningData: LearningData = {
    id: generateId(),
    skill: result.skillsUsed[0] || 'unknown',
    contentType: inferContentType(result),
    summary: generateSummary(result),
    logicOrSteps: extractLogicSteps(result),
    feedback: userFeedback?.type,
    trustScore: calculateTrustScore(userFeedback),
    timestamp: Date.now(),
    metadata: {
      processingTime: result.metadata.processingTime,
      confidence: result.metadata.confidence,
      module: result.metadata.module
    }
  };
  
  // Store learning data
  learningDataset.push(learningData);
  
  // Update pattern metrics
  await updatePatternMetrics(learningData);
  
  // Adjust confidence weights
  await adjustConfidenceWeights(learningData);
  
  console.log(`🧠 Learning data logged: ${learningData.skill} (trust: ${learningData.trustScore})`);
  
  return learningData;
}

/**
 * Get learning dataset
 */
export function getLearningDataset(): LearningData[] {
  return [...learningDataset];
}

/**
 * Get pattern metrics
 */
export function getPatternMetrics(): PatternMetrics[] {
  return Array.from(patternMetrics.values());
}

/**
 * Get learning statistics
 */
export function getLearningStats(): any {
  const total = learningDataset.length;
  const approved = learningDataset.filter(d => d.feedback === 'approve').length;
  const needsImprovement = learningDataset.filter(d => d.feedback === 'needs_improvement').length;
  const averageTrust = learningDataset.reduce((sum, d) => sum + (d.trustScore || 0), 0) / total;
  
  const skillStats = learningDataset.reduce((acc, data) => {
    acc[data.skill] = (acc[data.skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total,
    approved,
    needsImprovement,
    averageTrust: averageTrust || 0,
    skillStats,
    patternsCount: patternMetrics.size
  };
}

/**
 * Infer content type from skill result
 */
function inferContentType(result: SkillResult): string {
  const moduleTypeMap: Record<string, string> = {
    'modules/code': 'Code',
    'modules/graphics': 'Image',
    'modules/audio': 'Audio',
    'modules/link-review': 'Link',
    'modules/games': 'Game',
    'modules/streaming': 'Stream',
    'modules/general': 'Text'
  };
  
  return moduleTypeMap[result.metadata.module] || 'Text';
}

/**
 * Generate summary from skill result
 */
function generateSummary(result: SkillResult): string {
  const { data, metadata } = result;
  
  switch (metadata.module) {
    case 'modules/code':
      return `Code analysis completed with ${data.analysis?.issues?.length || 0} issues found`;
      
    case 'modules/graphics':
      return `Image generated with prompt: ${data.prompt || 'Generated'}`;
      
    case 'modules/audio':
      return `Audio generated: ${data.audioSpec?.type || 'General audio'}`;
      
    case 'modules/link-review':
      return `Link review completed for ${data.url}`;
      
    case 'modules/games':
      return `Game initialized: ${data.gameSpec?.type || 'Trivia'}`;
      
    case 'modules/streaming':
      return `Stream analysis: ${data.streamData?.status || 'Unknown'}`;
      
    default:
      return `General response generated`;
  }
}

/**
 * Extract logic steps from skill result
 */
function extractLogicSteps(result: SkillResult): string[] {
  const steps: string[] = [];
  
  steps.push(`1. Detected intent: ${result.skillsUsed.join(', ')}`);
  steps.push(`2. Processed with module: ${result.metadata.module}`);
  steps.push(`3. Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
  steps.push(`4. Processing time: ${result.metadata.processingTime}ms`);
  
  return steps;
}

/**
 * Calculate trust score based on user feedback
 */
function calculateTrustScore(userFeedback?: any): number {
  if (!userFeedback) return 0.5; // Neutral score for no feedback
  
  switch (userFeedback.type) {
    case 'approve':
      return 1.0;
    case 'needs_improvement':
      return 0.3;
    default:
      return 0.5;
  }
}

/**
 * Update pattern metrics
 */
async function updatePatternMetrics(learningData: LearningData): Promise<void> {
  const patternId = `${learningData.skill}_${learningData.contentType}`;
  const existing = patternMetrics.get(patternId);
  
  if (existing) {
    const newSuccessRate = learningData.feedback === 'approve' 
      ? (existing.successRate * existing.usageCount + 1) / (existing.usageCount + 1)
      : (existing.successRate * existing.usageCount) / (existing.usageCount + 1);
    
    const newConfidence = (existing.averageConfidence * existing.usageCount + (learningData.metadata?.confidence || 0)) / (existing.usageCount + 1);
    
    patternMetrics.set(patternId, {
      patternId,
      successRate: newSuccessRate,
      averageConfidence: newConfidence,
      usageCount: existing.usageCount + 1,
      lastUpdated: Date.now()
    });
  } else {
    patternMetrics.set(patternId, {
      patternId,
      successRate: learningData.feedback === 'approve' ? 1.0 : 0.0,
      averageConfidence: learningData.metadata?.confidence || 0,
      usageCount: 1,
      lastUpdated: Date.now()
    });
  }
}

/**
 * Adjust confidence weights based on feedback
 */
async function adjustConfidenceWeights(learningData: LearningData): Promise<void> {
  // This would integrate with your ML model to adjust weights
  // For now, just log the adjustment
  const adjustment = learningData.trustScore || 0.5;
  console.log(`⚖️ Adjusting confidence weights for ${learningData.skill}: ${adjustment}`);
}

/**
 * Get effective patterns (high trust score)
 */
export function getEffectivePatterns(minTrustScore: number = 0.7): PatternMetrics[] {
  return Array.from(patternMetrics.values())
    .filter(pattern => pattern.successRate >= minTrustScore)
    .sort((a, b) => b.successRate - a.successRate);
}

/**
 * Search learning dataset
 */
export function searchLearningDataset(query: string): LearningData[] {
  const lowercaseQuery = query.toLowerCase();
  return learningDataset.filter(data => 
    data.summary.toLowerCase().includes(lowercaseQuery) ||
    data.skill.toLowerCase().includes(lowercaseQuery) ||
    data.contentType.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Export learning data for backup
 */
export function exportLearningData(): string {
  const exportData = {
    exportDate: new Date().toISOString(),
    learningDataset,
    patternMetrics: Array.from(patternMetrics.entries()),
    stats: getLearningStats()
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Clear learning data
 */
export function clearLearningData(): void {
  learningDataset.length = 0;
  patternMetrics.clear();
  console.log('🗑️ Learning data cleared');
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default {
  logLearningData,
  getLearningDataset,
  getPatternMetrics,
  getLearningStats,
  getEffectivePatterns,
  searchLearningDataset,
  exportLearningData,
  clearLearningData
};
