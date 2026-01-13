// File: src/server/utils/schema.ts

// Schema definitions for Acey Orchestration

export type TaskType = "game" | "website" | "graphics" | "audio" | "images" | "moderation" | "memory" | "trust" | "persona" | "coding";
export type PersonaMode = "calm" | "hype" | "neutral" | "locked";

export interface AceyOutput {
  speech: string;                    // Generated text/code content
  audioFilePath?: string;            // Path to generated audio file (for audio tasks)
  imageUrl?: string;                  // URL to generated image (for graphics/images tasks)
  intents: Array<{
    type: string;
    confidence?: number;
    [key: string]: any;
  }>;
  trust?: number;                    // Trust score for this output (0-1)
  confidence?: number;               // Overall confidence score (0-1)
}

export interface AceyInteractionLog {
  taskType: TaskType;
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
  aceyOutput: AceyOutput;
  controlDecision: "approved" | "modified" | "rejected" | "pending";
  finalAction: string | null;
  trustDelta: number;
  personaMode: PersonaMode;
  performance: {
    responseTime: number;
    tokenCount?: number;
    cost?: number;
  };
  metadata?: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}

// Helper types used across modules
export interface TaskDefinition {
  id: string;
  taskType: TaskType;
  prompt: string;
  context: any;
  priority?: 'low' | 'medium' | 'high';
  timestamp?: string;
}

export interface BatchResult {
  taskId: string;
  output: AceyOutput;
  processed: boolean;
  error?: string;
  processingTime: number;
}

export interface LearningMetrics {
  totalOutputs: number;
  approvedOutputs: number;
  rejectedOutputs: number;
  successRate: number;
  avgConfidence: number;
  avgTrust: number;
  taskPerformance: Record<TaskType, {
    outputs: number;
    approved: number;
    avgConfidence: number;
    avgTrust: number;
  }>;
  lastUpdated: string;
}

export interface FineTuneJob {
  id: string;
  taskType: TaskType;
  status: "queued" | "processing" | "completed" | "failed";
  samples: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  modelVersion?: string;
}

export interface DatasetStats {
  taskType: TaskType;
  entries: number;
  size: number; // in bytes
  lastUpdated: string;
  path: string;
}
