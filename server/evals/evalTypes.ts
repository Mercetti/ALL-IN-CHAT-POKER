/**
 * Self-Generated Evaluation Suites
 * Acey tests herself continuously to maintain reliability
 */

export type EvalType = 
  | "consistency"     // Same input → same output
  | "regression"      // New model vs old
  | "safety"          // Disallowed outputs
  | "task-accuracy"   // Did action succeed
  | "persona-drift"   // Tone & style stability
  | "hallucination"   // Factual accuracy
  | "response-quality"; // Overall response quality

export type EvalCase = {
  id: string;
  type: EvalType;
  input: string;
  expectedBehavior: string;
  generatedOutput: string;
  score: number; // 0–1
  modelVersion: string;
  createdAt: number;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    context?: string;
    tags?: string[];
  };
};

export type EvalSuite = {
  id: string;
  name: string;
  description: string;
  cases: EvalCase[];
  averageScore: number;
  lastRun: number;
  modelVersion: string;
  status: "pending" | "running" | "completed" | "failed";
};

export type EvalResult = {
  caseId: string;
  score: number;
  passed: boolean;
  details?: string;
  executionTime: number;
};

export type AutoGenerationPrompt = {
  type: EvalType;
  description: string;
  template: string;
  difficulty: "easy" | "medium" | "hard";
  contextRequirements?: string[];
};
