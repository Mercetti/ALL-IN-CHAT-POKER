// Schema for Acey interaction logging

export interface AceyInteractionLog {
  taskType: "game" | "website" | "graphics" | "audio" | "moderation" | "memory" | "trust" | "persona";
  timestamp: string;
  context: {
    channel?: string;
    user?: string;
    gameState?: any;
    previousMessages?: string[];
    environment: "live" | "simulation" | "test";
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
  metadata?: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}

export interface LLMCallConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  timeout?: number;
}

export interface DatasetPrepConfig {
  taskTypes: string[];
  minConfidence?: number;
  excludeRejected?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
