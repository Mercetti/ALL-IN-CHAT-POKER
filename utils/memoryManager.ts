import { GeneratedCode, AceyCodePattern, CodeGenerationRequest, CodeGenerationResponse, UsageTracking, LearningAnalytics, ProgrammingLanguage } from '../types/codeHelper';

// In-memory storage
const memoryOutputs: GeneratedCode[] = [];
const aceyLearningDataset: AceyCodePattern[] = [];
const usageTracker: UsageTracking[] = [];

// Memory Management Functions
export function addOutputToMemory(output: GeneratedCode): void {
  memoryOutputs.push(output);
  console.log(`[CodeHelper] Added to memory: ${output.id} (${output.language})`);
}

export function discardOutput(outputId: string): boolean {
  const index = memoryOutputs.findIndex(o => o.id === outputId);
  if (index !== -1) {
    const discarded = memoryOutputs.splice(index, 1)[0];
    console.log(`[CodeHelper] Discarded from memory: ${outputId}`);
    
    // Track usage
    trackUsage({
      sessionId: generateSessionId(),
      skill: 'CodeHelper',
      action: 'discard',
      language: discarded.language,
      timestamp: Date.now(),
      codeId: outputId,
      usageCount: 1
    });
    
    return true;
  }
  return false;
}

export function getMemoryOutputs(): GeneratedCode[] {
  return [...memoryOutputs];
}

export function getOutputById(outputId: string): GeneratedCode | undefined {
  return memoryOutputs.find(o => o.id === outputId);
}

export function clearMemory(): void {
  memoryOutputs.length = 0;
  console.log('[CodeHelper] Memory cleared');
}

// Download Functions
export async function downloadOutput(output: GeneratedCode, filename?: string): Promise<void> {
  const finalFilename = filename || `${output.id}.${getFileExtension(output.language)}`;
  
  try {
    if (typeof window !== 'undefined' && window.document) {
      // Web environment
      const blob = new Blob([output.content], { 
        type: getMimeType(output.language) 
      });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`[CodeHelper] Downloaded: ${finalFilename}`);
    } else if (typeof require !== 'undefined') {
      // React Native environment
      const { FileSystem, Sharing } = require('react-native');
      
      const path = `${FileSystem.documentDirectory}${finalFilename}`;
      await FileSystem.writeAsStringAsync(path, output.content, {
        encoding: FileSystem.EncodingTypes.UTF8,
      });
      
      await Sharing.shareAsync(path, {
        mimeType: getMimeType(output.language),
        dialogTitle: `Save ${output.language} code`,
      });
      
      console.log(`[CodeHelper] Shared: ${finalFilename}`);
    }
    
    // Track usage
    trackUsage({
      sessionId: generateSessionId(),
      skill: 'CodeHelper',
      action: 'download',
      language: output.language,
      timestamp: Date.now(),
      codeId: output.id,
      usageCount: 1
    });
    
  } catch (error) {
    console.error('[CodeHelper] Download failed:', error);
    throw new Error(`Failed to download ${finalFilename}: ${error}`);
  }
}

// Learning Functions
export function storeForLearning(
  output: GeneratedCode, 
  fixesApplied: string[] = [], 
  logicSteps: string[] = []
): AceyCodePattern {
  const pattern: AceyCodePattern = {
    id: generatePatternId(),
    language: output.language,
    functionSignature: extractFunctionSignature(output.content),
    logicSteps: logicSteps.length > 0 ? logicSteps : extractLogicSteps(output.content),
    fixesApplied,
    timestamp: Date.now(),
    usageCount: 0,
    successRate: 1.0,
    category: output.metadata?.category || 'utility',
    tags: extractTags(output.content, output.metadata),
    userContext: output.metadata?.description,
    performanceMetrics: {
      averageExecutionTime: output.metadata?.executionTime || 0,
      memoryUsage: estimateMemoryUsage(output.content),
      errorRate: 0
    }
  };
  
  aceyLearningDataset.push(pattern);
  console.log(`[CodeHelper] Stored pattern for learning: ${pattern.id}`);
  
  return pattern;
}

export function getLearningDataset(): AceyCodePattern[] {
  return [...aceyLearningDataset];
}

export function updatePatternUsage(patternId: string, success: boolean): void {
  const pattern = aceyLearningDataset.find(p => p.id === patternId);
  if (pattern) {
    pattern.usageCount++;
    pattern.successRate = (pattern.successRate * (pattern.usageCount - 1) + (success ? 1 : 0)) / pattern.usageCount;
    console.log(`[CodeHelper] Updated pattern usage: ${patternId}, success: ${success}`);
  }
}

export function getLearningAnalytics(): LearningAnalytics {
  const patternsByLanguage = {} as Record<ProgrammingLanguage, number>;
  const patternsByCategory: Record<string, number> = {};
  let totalSuccessRate = 0;
  
  aceyLearningDataset.forEach(pattern => {
    patternsByLanguage[pattern.language] = (patternsByLanguage[pattern.language] || 0) + 1;
    patternsByCategory[pattern.category] = (patternsByCategory[pattern.category] || 0) + 1;
    totalSuccessRate += pattern.successRate;
  });
  
  const mostUsedPatterns = [...aceyLearningDataset]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);
  
  const recentImprovements = [...aceyLearningDataset]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  
  return {
    totalPatterns: aceyLearningDataset.length,
    patternsByLanguage,
    patternsByCategory,
    averageSuccessRate: aceyLearningDataset.length > 0 ? totalSuccessRate / aceyLearningDataset.length : 0,
    mostUsedPatterns,
    recentImprovements,
    learningTrends: generateLearningTrends()
  };
}

// Code Generation Functions
export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  const startTime = Date.now();
  
  try {
    // Simulate AI code generation (in real implementation, this would call your LLM)
    const generatedCode = await simulateCodeGeneration(request);
    
    // Add to memory
    addOutputToMemory(generatedCode);
    
    // Extract and store patterns for learning
    const patterns = [
      storeForLearning(generatedCode, ['initial generation'], ['code generation from prompt'])
    ];
    
    const processingTime = Date.now() - startTime;
    
    // Track usage
    trackUsage({
      sessionId: request.sessionId,
      skill: 'CodeHelper',
      action: 'generate',
      language: request.language,
      timestamp: Date.now(),
      codeId: generatedCode.id,
      userId: request.userId,
      usageCount: 1
    });
    
    return {
      id: generateResponseId(),
      requestId: request.id,
      code: generatedCode,
      patterns,
      processingTime,
      confidence: 0.85
    };
    
  } catch (error) {
    console.error('[CodeHelper] Generation failed:', error);
    throw new Error(`Code generation failed: ${error}`);
  }
}

// Usage Tracking Functions
export function trackUsage(usage: UsageTracking): void {
  usageTracker.push(usage);
  console.log(`[CodeHelper] Tracked usage: ${usage.action} for ${usage.language}`);
}

export function getUsageStats(): UsageTracking[] {
  return [...usageTracker];
}

export function getUserUsageCount(userId?: string, sessionId?: string): number {
  return usageTracker.filter(u => 
    (!userId || u.userId === userId) && 
    (!sessionId || u.sessionId === sessionId) &&
    u.action === 'generate'
  ).length;
}

// Helper Functions
function extractFunctionSignature(code: string): string {
  const patterns = [
    /function\s+(\w+)\s*\([^)]*\)/g,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
    /(\w+)\s*\([^)]*\)\s*{/g,
    /def\s+(\w+)\s*\([^)]*\)/g,
    /public\s+\w+\s+(\w+)\s*\([^)]*\)/g,
  ];
  
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'anonymous_function';
}

function extractLogicSteps(code: string): string[] {
  const steps: string[] = [];
  
  // Extract common programming patterns
  if (code.includes('for') || code.includes('while')) {
    steps.push('iteration_logic');
  }
  if (code.includes('if') || code.includes('switch')) {
    steps.push('conditional_logic');
  }
  if (code.includes('sort') || code.includes('order')) {
    steps.push('sorting_algorithm');
  }
  if (code.includes('map') || code.includes('filter') || code.includes('reduce')) {
    steps.push('array_transformation');
  }
  if (code.includes('async') || code.includes('await')) {
    steps.push('asynchronous_operation');
  }
  if (code.includes('try') || code.includes('catch')) {
    steps.push('error_handling');
  }
  
  return steps.length > 0 ? steps : ['general_logic'];
}

function extractTags(code: string, metadata?: any): string[] {
  const tags: string[] = [];
  
  // Extract from content
  if (code.includes('function')) tags.push('function');
  if (code.includes('class')) tags.push('class');
  if (code.includes('async')) tags.push('async');
  if (code.includes('await')) tags.push('await');
  if (code.includes('import')) tags.push('module_import');
  if (code.includes('export')) tags.push('module_export');
  
  // Extract from metadata
  if (metadata?.category) tags.push(metadata.category);
  if (metadata?.dependencies) tags.push(...metadata.dependencies.map((d: string) => `dependency:${d}`));
  
  return [...new Set(tags)]; // Remove duplicates
}

function getFileExtension(language: ProgrammingLanguage): string {
  const extensions = {
    TypeScript: 'ts',
    JavaScript: 'js',
    Python: 'py',
    Java: 'java',
    CSharp: 'cs',
    Go: 'go',
    Rust: 'rs'
  };
  return extensions[language] || 'txt';
}

function getMimeType(language: ProgrammingLanguage): string {
  const mimeTypes = {
    TypeScript: 'text/typescript',
    JavaScript: 'text/javascript',
    Python: 'text/x-python',
    Java: 'text/x-java-source',
    CSharp: 'text/x-csharp',
    Go: 'text/x-go',
    Rust: 'text/x-rust'
  };
  return mimeTypes[language] || 'text/plain';
}

function estimateMemoryUsage(code: string): number {
  // Simple estimation based on code complexity
  const lines = code.split('\n').length;
  const variables = (code.match(/const|let|var/g) || []).length;
  const functions = (code.match(/function|def|=>/g) || []).length;
  
  return lines * 10 + variables * 50 + functions * 100; // bytes
}

function generateLearningTrends(): LearningAnalytics['learningTrends'] {
  // Generate mock trends data (in real implementation, this would come from database)
  const trends = [];
  const now = Date.now();
  
  for (let i = 30; i >= 0; i -= 7) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    trends.push({
      date: date.toISOString().split('T')[0],
      patternsAdded: Math.floor(Math.random() * 10) + 5,
      successRate: 0.8 + Math.random() * 0.2
    });
  }
  
  return trends;
}

async function simulateCodeGeneration(request: CodeGenerationRequest): Promise<GeneratedCode> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Mock code generation based on language and prompt
  const mockCode = generateMockCode(request.language, request.prompt);
  
  return {
    id: generateCodeId(),
    language: request.language,
    skill: 'CodeHelper',
    content: mockCode.content,
    metadata: {
      description: `Generated ${request.language} code for: ${request.prompt}`,
      complexity: mockCode.complexity,
      category: mockCode.category as 'algorithm' | 'utility' | 'api' | 'ui' | 'data' | 'error-handling',
      linesOfCode: mockCode.content.split('\n').length,
      executionTime: Math.random() * 100
    },
    timestamp: Date.now(),
    filename: `${mockCode.name}.${getFileExtension(request.language)}`
  };
}

function generateMockCode(language: ProgrammingLanguage, prompt: string) {
  const templates: Record<ProgrammingLanguage, {name: string, content: string, complexity: 'simple' | 'medium' | 'complex', category: string}> = {
    TypeScript: {
      name: 'utility',
      content: `function ${prompt.toLowerCase().replace(/\s+/g, '_')}(): string {
  // Generated TypeScript function
  return "Hello from Acey!";
}

export { ${prompt.toLowerCase().replace(/\s+/g, '_')};`,
      complexity: 'simple' as const,
      category: 'utility'
    },
    Python: {
      name: 'utility',
      content: `def ${prompt.toLowerCase().replace(/\s+/g, '_')}():
    """Generated Python function"""
    return "Hello from Acey!"

if __name__ == "__main__":
    ${prompt.toLowerCase().replace(/\s+/g, '_')}()`,
      complexity: 'simple' as const,
      category: 'utility'
    },
    JavaScript: {
      name: 'utility',
      content: `function ${prompt.toLowerCase().replace(/\s+/g, '_')}() {
  // Generated JavaScript function
  return "Hello from Acey!";
}

module.exports = { ${prompt.toLowerCase().replace(/\s+/g, '_')};`,
      complexity: 'simple' as const,
      category: 'utility'
    },
    Java: {
      name: 'utility',
      content: `public class ${prompt.charAt(0).toUpperCase() + prompt.slice(1)} {
    public static String ${prompt.toLowerCase().replace(/\s+/g, '_')}() {
        // Generated Java method
        return "Hello from Acey!";
    }
    
    public static void main(String[] args) {
        System.out.println(${prompt.toLowerCase().replace(/\s+/g, '_')}());
    }
}`,
      complexity: 'simple' as const,
      category: 'utility'
    },
    CSharp: {
      name: 'utility',
      content: `using System;

public class ${prompt.charAt(0).toUpperCase() + prompt.slice(1)} {
    public static string ${prompt.toLowerCase().replace(/\s+/g, '_')}() {
        // Generated C# method
        return "Hello from Acey!";
    }
    
    public static void Main(string[] args) {
        Console.WriteLine(${prompt.toLowerCase().replace(/\s+/g, '_')}());
    }
}`,
      complexity: 'simple' as const,
      category: 'utility'
    },
    Go: {
      name: 'utility',
      content: `package main

import "fmt"

func ${prompt.toLowerCase().replace(/\s+/g, '_')}() string {
    // Generated Go function
    return "Hello from Acey!"
}

func main() {
    fmt.Println(${prompt.toLowerCase().replace(/\s+/g, '_')}())
}`,
      complexity: 'simple' as const,
      category: 'utility'
    },
    Rust: {
      name: 'utility',
      content: `fn ${prompt.toLowerCase().replace(/\s+/g, '_')}() -> String {
    // Generated Rust function
    "Hello from Acey!".to_string()
}

fn main() {
    println!("{}", ${prompt.toLowerCase().replace(/\s+/g, '_')}());
}`,
      complexity: 'simple' as const,
      category: 'utility'
    }
  };
  
  return templates[language] || templates.TypeScript;
}

// ID Generators
function generateCodeId(): string {
  return `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generatePatternId(): string {
  return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateResponseId(): string {
  return `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}
