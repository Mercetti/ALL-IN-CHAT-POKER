import { GeneratedOutput, AceyLearningPattern, UnifiedUsageTracking, UnifiedLearningAnalytics, SkillType } from '../types/skills';

// In-memory storage for all skills
const memoryOutputs: GeneratedOutput[] = [];
const aceyLearningDataset: AceyLearningPattern[] = [];
const usageTracker: UnifiedUsageTracking[] = [];

// Memory Management Functions
export function addOutputToMemory(output: GeneratedOutput): void {
  memoryOutputs.push(output);
  console.log(`[${output.skill}] Added to memory: ${output.id}`);
}

export function discardOutput(outputId: string): boolean {
  const index = memoryOutputs.findIndex(o => o.id === outputId);
  if (index !== -1) {
    const discarded = memoryOutputs.splice(index, 1)[0];
    console.log(`[${discarded.skill}] Discarded from memory: ${outputId}`);
    
    // Track usage
    trackUsage({
      sessionId: generateSessionId(),
      skill: discarded.skill,
      action: 'discard',
      timestamp: Date.now(),
      outputId: outputId,
      usageCount: 1
    });
    
    return true;
  }
  return false;
}

export function getMemoryOutputs(): GeneratedOutput[] {
  return [...memoryOutputs];
}

export function getOutputById(outputId: string): GeneratedOutput | undefined {
  return memoryOutputs.find(o => o.id === outputId);
}

export function getOutputsBySkill(skill: SkillType): GeneratedOutput[] {
  return memoryOutputs.filter(o => o.skill === skill);
}

export function clearMemory(): void {
  memoryOutputs.length = 0;
  console.log('[Unified] Memory cleared');
}

// Download Functions - Cross-platform
export async function downloadOutput(output: GeneratedOutput, filename?: string): Promise<void> {
  const finalFilename = filename || generateFilename(output);
  
  try {
    if (typeof window !== 'undefined' && window.document) {
      // Web environment
      if (typeof output.content === 'string') {
        // Text content (code)
        const blob = new Blob([output.content], { 
          type: getTextMimeType(output.skill) 
        });
        triggerDownload(blob, finalFilename);
      } else {
        // Binary content (graphics/audio)
        const blob = new Blob([output.content]);
        triggerDownload(blob, finalFilename);
      }
    } else if (typeof require !== 'undefined') {
      // React Native environment
      const { FileSystem, Sharing } = require('react-native');
      
      if (typeof output.content === 'string') {
        const path = `${FileSystem.documentDirectory}${finalFilename}`;
        await FileSystem.writeAsStringAsync(path, output.content, {
          encoding: FileSystem.EncodingTypes.UTF8,
        });
        
        await Sharing.shareAsync(path, {
          mimeType: getTextMimeType(output.skill),
          dialogTitle: `Save ${output.skill} output`,
        });
      } else {
        // For binary content, we'd need to handle it differently
        console.log('Binary content download not implemented in React Native');
      }
    }
    
    // Track usage
    trackUsage({
      sessionId: generateSessionId(),
      skill: output.skill,
      action: 'download',
      timestamp: Date.now(),
      outputId: output.id,
      usageCount: 1
    });
    
  } catch (error) {
    console.error(`[${output.skill}] Download failed:`, error);
    throw new Error(`Failed to download ${finalFilename}: ${error}`);
  }
}

// Copy to Clipboard (for text content)
export async function copyToClipboard(output: GeneratedOutput): Promise<void> {
  if (typeof output.content !== 'string') {
    throw new Error('Cannot copy binary content to clipboard');
  }
  
  try {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(output.content);
      console.log(`[${output.skill}] Copied to clipboard`);
    } else {
      // Fallback for older browsers or React Native
      console.log('Clipboard copy not supported in this environment');
    }
  } catch (error) {
    console.error(`[${output.skill}] Clipboard copy failed:`, error);
    throw new Error(`Failed to copy to clipboard: ${error}`);
  }
}

// Learning Functions - Automatic for Acey
export function storeForLearning(
  output: GeneratedOutput,
  summary: string,
  logicOrSteps: string[],
  fixesApplied: string[] = []
): AceyLearningPattern {
  const contentType = output.skill === 'CodeHelper' ? 'Code' : 
                   output.skill === 'GraphicsWizard' ? 'Image' : 'Audio';
  
  const pattern: AceyLearningPattern = {
    id: generatePatternId(),
    skill: output.skill,
    contentType,
    summary,
    logicOrSteps: logicOrSteps.length > 0 ? logicOrSteps : extractDefaultSteps(output),
    fixesApplied,
    timestamp: Date.now(),
    usageCount: 0,
    successRate: 1.0,
    userContext: output.description,
    performanceMetrics: extractPerformanceMetrics(output)
  };
  
  aceyLearningDataset.push(pattern);
  console.log(`[${output.skill}] Stored pattern for learning: ${pattern.id}`);
  
  return pattern;
}

export function getLearningDataset(): AceyLearningPattern[] {
  return [...aceyLearningDataset];
}

export function updatePatternUsage(patternId: string, success: boolean): void {
  const pattern = aceyLearningDataset.find(p => p.id === patternId);
  if (pattern) {
    pattern.usageCount++;
    pattern.successRate = (pattern.successRate * (pattern.usageCount - 1) + (success ? 1 : 0)) / pattern.usageCount;
    console.log(`[${pattern.skill}] Updated pattern usage: ${patternId}, success: ${success}`);
  }
}

export function getLearningAnalytics(): UnifiedLearningAnalytics {
  const patternsBySkill = {} as Record<SkillType, number>;
  const patternsByContentType = {} as Record<'Code' | 'Image' | 'Audio', number>;
  let totalSuccessRate = 0;
  
  aceyLearningDataset.forEach(pattern => {
    patternsBySkill[pattern.skill] = (patternsBySkill[pattern.skill] || 0) + 1;
    patternsByContentType[pattern.contentType] = (patternsByContentType[pattern.contentType] || 0) + 1;
    totalSuccessRate += pattern.successRate;
  });
  
  const mostUsedSkills = Object.entries(patternsBySkill)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([skill]) => skill) as SkillType[];
  
  const recentImprovements = [...aceyLearningDataset]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  
  return {
    totalPatterns: aceyLearningDataset.length,
    patternsBySkill,
    patternsByContentType,
    averageSuccessRate: aceyLearningDataset.length > 0 ? totalSuccessRate / aceyLearningDataset.length : 0,
    mostUsedSkills,
    recentImprovements,
    learningTrends: generateLearningTrends(),
    userPreferences: calculateUserPreferences()
  };
}

// Usage Tracking Functions
export function trackUsage(usage: UnifiedUsageTracking): void {
  usageTracker.push(usage);
  console.log(`[${usage.skill}] Tracked usage: ${usage.action}`);
}

export function getUsageStats(): UnifiedUsageTracking[] {
  return [...usageTracker];
}

export function getUserUsageCount(userId?: string, sessionId?: string, skill?: SkillType): number {
  return usageTracker.filter(u => 
    (!userId || u.userId === userId) && 
    (!sessionId || u.sessionId === sessionId) &&
    (!skill || u.skill === skill) &&
    u.action === 'generate'
  ).length;
}

export function getSkillUsageStats(skill: SkillType): {
  total: number;
  downloads: number;
  discards: number;
  learning: number;
} {
  const skillUsage = usageTracker.filter(u => u.skill === skill);
  
  return {
    total: skillUsage.length,
    downloads: skillUsage.filter(u => u.action === 'download').length,
    discards: skillUsage.filter(u => u.action === 'discard').length,
    learning: skillUsage.filter(u => u.action === 'learn').length
  };
}

// Helper Functions
function generateFilename(output: GeneratedOutput): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  switch (output.skill) {
    case 'CodeHelper':
      return `${output.metadata?.language || 'code'}_${timestamp}.${getFileExtension(output.metadata?.language || 'typescript')}`;
    case 'GraphicsWizard':
      return `${output.metadata?.format || 'png'}_${timestamp}.${output.metadata?.format || 'png'}`;
    case 'AudioMaestro':
      return `${output.metadata?.format || 'mp3'}_${timestamp}.${output.metadata?.format || 'mp3'}`;
    default:
      return `output_${timestamp}`;
  }
}

function getTextMimeType(skill: SkillType): string {
  switch (skill) {
    case 'CodeHelper':
      return 'text/plain';
    default:
      return 'text/plain';
  }
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    'typescript': 'ts',
    'javascript': 'js',
    'python': 'py',
    'java': 'java',
    'csharp': 'cs',
    'go': 'go',
    'rust': 'rs'
  };
  return extensions[language.toLowerCase()] || 'txt';
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function extractDefaultSteps(output: GeneratedOutput): string[] {
  const steps: string[] = [];
  
  switch (output.skill) {
    case 'CodeHelper':
      if (typeof output.content === 'string') {
        if (output.content.includes('function')) steps.push('function_definition');
        if (output.content.includes('class')) steps.push('class_definition');
        if (output.content.includes('import')) steps.push('module_import');
        if (output.content.includes('async')) steps.push('asynchronous_operation');
      }
      break;
    case 'GraphicsWizard':
      steps.push('image_generation');
      if (output.metadata?.dimensions) steps.push('resize_operation');
      if (output.metadata?.format) steps.push('format_conversion');
      break;
    case 'AudioMaestro':
      steps.push('audio_generation');
      if (output.metadata?.duration) steps.push('duration_control');
      if (output.metadata?.format) steps.push('audio_formatting');
      break;
  }
  
  return steps.length > 0 ? steps : ['general_processing'];
}

function extractPerformanceMetrics(output: GeneratedOutput): AceyLearningPattern['performanceMetrics'] {
  const metrics: AceyLearningPattern['performanceMetrics'] = {};
  
  if (output.metadata?.performanceMetrics) {
    if (output.skill === 'CodeHelper') {
      metrics.averageExecutionTime = output.metadata.performanceMetrics.executionTime;
    } else if (output.skill === 'GraphicsWizard') {
      metrics.averageRenderTime = output.metadata.performanceMetrics.renderTime;
    } else if (output.skill === 'AudioMaestro') {
      metrics.averageProcessingTime = output.metadata.performanceMetrics.processingTime;
    }
    
    metrics.quality = output.metadata.performanceMetrics.quality;
  }
  
  return metrics;
}

function generateLearningTrends(): UnifiedLearningAnalytics['learningTrends'] {
  const trends: UnifiedLearningAnalytics['learningTrends'] = [];
  const now = Date.now();
  
  for (let i = 30; i >= 0; i -= 7) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const trendsForDate = aceyLearningDataset.filter(p => {
      const patternDate = new Date(p.timestamp);
      return patternDate.toDateString() === date.toDateString();
    });
    
    const skillCounts = {} as Record<SkillType, number>;
    trendsForDate.forEach(pattern => {
      skillCounts[pattern.skill] = (skillCounts[pattern.skill] || 0) + 1;
    });
    
    const mostUsedSkill = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as SkillType;
    
    trends.push({
      date: date.toISOString().split('T')[0],
      patternsAdded: trendsForDate.length,
      successRate: trendsForDate.reduce((sum, p) => sum + p.successRate, 0) / trendsForDate.length || 0,
      skill: mostUsedSkill || 'CodeHelper'
    });
  }
  
  return trends;
}

function calculateUserPreferences(): UnifiedLearningAnalytics['userPreferences'] {
  const skillUsage = {} as Record<SkillType, number>;
  let totalSessionTime = 0;
  let sessionCount = 0;
  
  usageTracker.forEach(usage => {
    skillUsage[usage.skill] = (skillUsage[usage.skill] || 0) + 1;
  });
  
  const favoriteSkill = Object.entries(skillUsage)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as SkillType;
  
  const totalDownloads = usageTracker.filter(u => u.action === 'download').length;
  const totalGenerations = usageTracker.filter(u => u.action === 'generate').length;
  const totalLearning = usageTracker.filter(u => u.action === 'learn').length;
  
  return {
    favoriteSkill: favoriteSkill || 'CodeHelper',
    mostUsedLanguage: 'TypeScript', // Default, would be calculated from actual usage
    averageSessionLength: sessionCount > 0 ? totalSessionTime / sessionCount : 0,
    downloadRate: totalGenerations > 0 ? totalDownloads / totalGenerations : 0,
    learningRate: totalGenerations > 0 ? totalLearning / totalGenerations : 0
  };
}

// ID Generators
function generateOutputId(): string {
  return `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generatePatternId(): string {
  return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// Batch operations
export function batchDownload(outputs: GeneratedOutput[]): Promise<void[]> {
  const downloadPromises = outputs.map(output => 
    downloadOutput(output).catch(error => ({ output, error }))
  );
  
  return Promise.allSettled(downloadPromises);
}

export function batchDiscard(outputIds: string[]): number {
  let discardedCount = 0;
  
  outputIds.forEach(id => {
    if (discardOutput(id)) {
      discardedCount++;
    }
  });
  
  return discardedCount;
}

export function batchStoreForLearning(outputs: GeneratedOutput[]): AceyLearningPattern[] {
  return outputs.map(output => {
    const summary = `${output.skill} output generated`;
    const steps = extractDefaultSteps(output);
    return storeForLearning(output, summary, steps);
  });
}
