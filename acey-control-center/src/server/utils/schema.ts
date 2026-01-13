// Schema definitions for Acey Orchestration

export type TaskType = "game" | "website" | "graphics" | "audio" | "moderation" | "memory" | "trust" | "persona" | "coding";
export type PersonaMode = "calm" | "hype" | "neutral" | "locked";

export interface AceyOutput {
  speech: string;
  intents: Array<{
    type: string;
    confidence?: number;
    [key: string]: any;
  }>;
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
