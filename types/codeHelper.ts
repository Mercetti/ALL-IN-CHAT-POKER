export type ProgrammingLanguage = 'TypeScript' | 'Python' | 'JavaScript' | 'Java' | 'CSharp' | 'Go' | 'Rust';

export interface GeneratedCode {
  id: string;
  language: ProgrammingLanguage;
  skill: 'CodeHelper';
  content: string;              // Actual code snippet
  metadata?: CodeMetadata;
  timestamp: number;
  filename?: string;
  description?: string;
}

export interface CodeMetadata {
  description?: string;
  complexity: 'simple' | 'medium' | 'complex';
  category: 'algorithm' | 'utility' | 'api' | 'ui' | 'data' | 'error-handling';
  dependencies?: string[];
  testCoverage?: number;
  linesOfCode?: number;
  executionTime?: number;
}

export interface AceyCodePattern {
  id: string;
  language: ProgrammingLanguage;
  functionSignature: string;
  logicSteps: string[];
  fixesApplied: string[];
  timestamp: number;
  usageCount: number;
  successRate: number;
  category: string;
  tags: string[];
  userContext?: string;
  performanceMetrics?: {
    averageExecutionTime: number;
    memoryUsage: number;
    errorRate: number;
  };
}

export interface CodeGenerationRequest {
  id: string;
  prompt: string;
  language: ProgrammingLanguage;
  context?: string;
  requirements?: string[];
  constraints?: string[];
  userId?: string;
  sessionId: string;
  timestamp: number;
}

export interface CodeGenerationResponse {
  id: string;
  requestId: string;
  code: GeneratedCode;
  patterns: AceyCodePattern[];
  processingTime: number;
  confidence: number;
  alternatives?: GeneratedCode[];
}

export interface LearningAnalytics {
  totalPatterns: number;
  patternsByLanguage: Record<ProgrammingLanguage, number>;
  patternsByCategory: Record<string, number>;
  averageSuccessRate: number;
  mostUsedPatterns: AceyCodePattern[];
  recentImprovements: AceyCodePattern[];
  learningTrends: {
    date: string;
    patternsAdded: number;
    successRate: number;
  }[];
}

export interface UsageTracking {
  userId?: string;
  sessionId: string;
  skill: 'CodeHelper';
  action: 'generate' | 'download' | 'discard';
  language: ProgrammingLanguage;
  timestamp: number;
  codeId?: string;
  tier?: 'free' | 'pro' | 'enterprise';
  usageCount: number;
}
