// Enhanced schemas for audio and coding tasks

export interface AudioTaskContext {
  type: "speech" | "music" | "effect";
  mood: "hype" | "calm" | "neutral";
  lengthSeconds?: number;
  volume?: number;
  intensity?: "low" | "medium" | "high";
  targetFileName?: string;
  format?: "wav" | "mp3" | "ogg";
  sampleRate?: number;
  channels?: number;
  voice?: "energetic" | "calm" | "professional" | "playful";
  context?: {
    gameState?: any;
    player?: string;
    pot?: number;
    chatExcitement?: number;
    subscriberCount?: number;
    donationAmount?: number;
    [key: string]: any;
  };
}

export interface AudioGenerationResult {
  type: AudioTaskContext["type"];
  fileName: string;
  duration: number;
  fileSize: number;
  format: string;
  metadata: {
    mood: string;
    intensity: string;
    generatedAt: string;
    promptUsed: string;
    confidence?: number;
    lengthSeconds?: number;
    format?: string;
  };
  base64?: string; // For web delivery
  filePath?: string; // For local storage
}

export interface CodingTaskContext {
  language: "typescript" | "python" | "bash" | "javascript" | "sql" | "html" | "css";
  filePath?: string;
  functionName?: string;
  description: string;
  inputs?: any;
  outputs?: any;
  maxLines?: number;
  framework?: string;
  dependencies?: string[];
  testCases?: Array<{
    input: any;
    expectedOutput: any;
    description: string;
  }>;
  validationRules?: Array<{
    type: "syntax" | "security" | "performance" | "style";
    rule: string;
    severity: "error" | "warning" | "info";
  }>;
}

export interface CodingGenerationResult {
  type: CodingTaskContext["language"];
  fileName: string;
  code: string;
  lineCount: number;
  validation: {
    syntax: boolean;
    security: boolean;
    performance: boolean;
    style: boolean;
    errors: Array<{
      type: string;
      message: string;
      line?: number;
      severity: string;
    }>;
  };
  testResults: Array<{
    testCase: string;
    passed: boolean;
    error?: string;
    executionTime: number;
  }>;
  metadata: {
    generatedAt: string;
    promptUsed: string;
    confidence?: number;
    framework?: string;
    dependencies?: string[];
  };
}

export interface TaskValidationResult {
  taskId: string;
  taskType: "audio" | "coding";
  status: "pending" | "validating" | "approved" | "rejected";
  validationSteps: Array<{
    step: string;
    status: "pending" | "passed" | "failed";
    result?: any;
    error?: string;
    timestamp: string;
  }>;
  finalDecision?: {
    approved: boolean;
    reason: string;
    confidence: number;
    autoRuleApplied: boolean;
  };
}

export interface FeedbackData {
  taskId: string;
  taskType: "audio" | "coding";
  timestamp: string;
  feedback: {
    audio?: {
      engagementMetrics: {
        chatEmotes: number;
        clipReplays: number;
        hypeSpikes: number;
        viewerRetention: number;
        donationAmount?: number;
      };
      qualityMetrics: {
        clarity: number; // 1-10
        volume: number; // 1-10
        timing: number; // 1-10
        appropriateness: number; // 1-10
      };
    };
    coding?: {
      bugReports: number;
      runtimeErrors: number;
      performanceIssues: number;
      userReports: number;
      maintainability: number; // 1-10
      reliability: number; // 1-10
    };
  };
  adaptation: {
    trustDelta: number;
    confidenceAdjustment: number;
    moodAdjustment?: string;
    preferenceUpdate?: any;
  };
}

// Extended Acey interaction log with enhanced task support
export interface EnhancedAceyInteractionLog {
  // Base fields
  taskType: "game" | "website" | "graphics" | "audio" | "moderation" | "memory" | "trust" | "persona" | "coding";
  timestamp: string;
  context: {
    channel?: string;
    user?: string;
    gameState?: any;
    previousMessages?: string[];
    environment: "live" | "simulation" | "test";
    [key: string]: any;
  };
  llmPrompt: string;
  llmOutput: string;
  aceyOutput: {
    speech: string;
    intents: Array<{
      type: string;
      confidence?: number;
      [key: string]: any;
    }>;
  };
  controlDecision: "approved" | "modified" | "rejected" | "pending";
  finalAction: string | null;
  trustDelta: number;
  personaMode: "calm" | "hype" | "neutral" | "locked";
  performance: {
    responseTime: number;
    tokenCount?: number;
    cost?: number;
  };

  // Enhanced task-specific fields
  taskContext?: AudioTaskContext | CodingTaskContext;
  taskResult?: AudioGenerationResult | CodingGenerationResult;
  validation?: TaskValidationResult;
  feedback?: FeedbackData;
  
  // Enhanced metadata
  metadata: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    taskCategory: "audio" | "coding" | "general";
    complexity: "simple" | "medium" | "complex";
    iteration?: number;
    [key: string]: any;
  };
}
