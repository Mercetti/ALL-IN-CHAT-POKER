// File: src/server/utils/enhancements.ts

import { TaskType, AceyOutput, LearningMetrics } from "./schema";
import { AceyOrchestrator } from "./orchestrator";
import { ContinuousLearningLoop } from "./continuousLearning";
import { RealTimeFineTune } from "./realtimeFineTune";

/**
 * Multi-Persona Support
 * Extends Acey with multiple personality modes for different contexts
 */
export interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  traits: {
    energy: number;        // 0-1: calm to energetic
    formality: number;     // 0-1: casual to formal
    humor: number;         // 0-1: serious to humorous
    empathy: number;       // 0-1: analytical to empathetic
    expertise: string[];   // Areas of expertise
  };
  voiceSettings?: {
    pitch: number;         // Voice pitch
    speed: number;         // Speech speed
    tone: string;          // Voice tone
  };
  responsePatterns: {
    greeting: string[];
    farewell: string[];
    encouragement: string[];
    apology: string[];
  };
}

export class MultiPersonaManager {
  private personas: Map<string, PersonaProfile> = new Map();
  private activePersona: string = 'neutral';
  private contextHistory: Array<{ timestamp: string; context: any; persona: string }> = [];

  constructor() {
    this.initializeDefaultPersonas();
  }

  private initializeDefaultPersonas() {
    const defaultPersonas: PersonaProfile[] = [
      {
        id: 'hype',
        name: 'Hype Master',
        description: 'Energetic, enthusiastic commentator perfect for exciting moments',
        traits: {
          energy: 0.9,
          formality: 0.2,
          humor: 0.7,
          empathy: 0.6,
          expertise: ['gaming', 'entertainment', 'motivation']
        },
        voiceSettings: {
          pitch: 0.8,
          speed: 1.2,
          tone: 'energetic'
        },
        responsePatterns: {
          greeting: ['LET\'S GOOOO!', 'WHAT A PLAY!', 'HERE WE GO!'],
          farewell: ['THAT WAS INSANE!', 'SEE YOU NEXT TIME!', 'PEACE OUT!'],
          encouragement: ['YOU GOT THIS!', 'KEEP IT UP!', 'AMAZING!'],
          apology: ['MY BAD!', 'SORRY ABOUT THAT!', 'LET\'S RESET!']
        }
      },
      {
        id: 'calm',
        name: 'Zen Master',
        description: 'Calm, analytical commentator for strategic moments',
        traits: {
          energy: 0.3,
          formality: 0.6,
          humor: 0.3,
          empathy: 0.8,
          expertise: ['strategy', 'analysis', 'education']
        },
        voiceSettings: {
          pitch: 0.5,
          speed: 0.9,
          tone: 'calm'
        },
        responsePatterns: {
          greeting: ['Welcome back.', 'Good to see you.', 'Let\'s begin.'],
          farewell: ['Until next time.', 'Take care.', 'Well done.'],
          encouragement: ['Steady progress.', 'Well considered.', 'Excellent analysis.'],
          apology: ['My apologies.', 'Let me correct that.', 'Thank you for your patience.']
        }
      },
      {
        id: 'professional',
        name: 'Professional Host',
        description: 'Formal, polished commentator for professional settings',
        traits: {
          energy: 0.5,
          formality: 0.9,
          humor: 0.2,
          empathy: 0.5,
          expertise: ['business', 'presentation', 'formal']
        },
        voiceSettings: {
          pitch: 0.6,
          speed: 1.0,
          tone: 'professional'
        },
        responsePatterns: {
          greeting: ['Welcome.', 'Good day.', 'Thank you for joining.'],
          farewell: ['Thank you for your participation.', 'Have a pleasant day.', 'Until we meet again.'],
          encouragement: ['Excellent work.', 'Well done.', 'Impressive performance.'],
          apology: ['I apologize for the inconvenience.', 'Please allow me to clarify.', 'Thank you for your understanding.']
        }
      },
      {
        id: 'educational',
        name: 'Teacher Mode',
        description: 'Educational, explanatory commentator for learning contexts',
        traits: {
          energy: 0.6,
          formality: 0.7,
          humor: 0.4,
          empathy: 0.9,
          expertise: ['teaching', 'explanation', 'learning']
        },
        voiceSettings: {
          pitch: 0.6,
          speed: 0.8,
          tone: 'educational'
        },
        responsePatterns: {
          greeting: ['Hello everyone!', 'Welcome to our session!', 'Let\'s learn together!'],
          farewell: ['Great job today!', 'See you next class!', 'Keep practicing!'],
          encouragement: ['You\'re learning well!', 'Excellent question!', 'That\'s the right approach!'],
          apology: ['Let me explain better.', 'Good point, let me clarify.', 'Thank you for asking.']
        }
      }
    ];

    defaultPersonas.forEach(persona => {
      this.personas.set(persona.id, persona);
    });
  }

  public getPersona(id: string): PersonaProfile | undefined {
    return this.personas.get(id);
  }

  public setActivePersona(id: string): boolean {
    if (this.personas.has(id)) {
      this.activePersona = id;
      return true;
    }
    return false;
  }

  public getActivePersona(): PersonaProfile {
    return this.personas.get(this.activePersona) || this.personas.get('neutral')!;
  }

  public adaptResponseForPersona(baseResponse: string, personaId?: string): string {
    const persona = personaId ? this.personas.get(personaId) : this.getActivePersona();
    
    // Adapt response based on persona traits
    let adaptedResponse = baseResponse;
    
    if (persona.traits.energy > 0.7) {
      adaptedResponse = adaptedResponse.toUpperCase();
      adaptedResponse = adaptedResponse.replace(/\./g, '!');
    } else if (persona.traits.energy < 0.4) {
      adaptedResponse = adaptedResponse.toLowerCase();
      adaptedResponse = adaptedResponse.replace(/!/g, '.');
    }

    if (persona.traits.formality > 0.7) {
      adaptedResponse = adaptedResponse.replace(/hey/gi, 'greetings');
      adaptedResponse = adaptedResponse.replace(/thanks/gi, 'thank you');
    }

    return adaptedResponse;
  }

  public getContextualPersona(context: any): string {
    // Analyze context to determine best persona
    if (context.gameState?.pot > 1000) return 'hype';
    if (context.educational) return 'educational';
    if (context.professional) return 'professional';
    if (context.strategic) return 'calm';
    return 'neutral';
  }
}

/**
 * Emotion Inference System
 * Analyzes text and context to infer emotional states
 */
export interface EmotionalState {
  primary: string;
  secondary?: string;
  confidence: number;
  intensity: number;
  triggers: string[];
}

export class EmotionInferenceEngine {
  private emotionKeywords: Map<string, string[]> = new Map([
    ['excitement', ['amazing', 'incredible', 'wow', 'awesome', 'fantastic', 'unbelievable', 'insane']],
    ['joy', ['happy', 'great', 'wonderful', 'excellent', 'perfect', 'love', 'enjoy']],
    ['surprise', ['what', 'really', 'no way', 'unbelievable', 'shocking', 'unexpected']],
    ['concern', ['worried', 'concerned', 'careful', 'caution', 'risk', 'dangerous']],
    ['disappointment', ['sad', 'unfortunate', 'too bad', 'shame', 'disappointing', 'missed']],
    ['anger', ['angry', 'frustrated', 'annoyed', 'mad', 'upset', 'ridiculous']],
    ['calm', ['relaxed', 'peaceful', 'calm', 'steady', 'focused', 'balanced']],
    ['confusion', ['confused', 'unclear', 'what do you mean', 'don\'t understand', 'explain']]
  ]);

  public analyzeEmotion(text: string, context: any): EmotionalState {
    const lowerText = text.toLowerCase();
    const detectedEmotions: Array<{ emotion: string; score: number; triggers: string[] }> = [];

    // Analyze text for emotion keywords
    for (const [emotion, keywords] of this.emotionKeywords) {
      const triggers: string[] = [];
      let score = 0;

      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score += 1;
          triggers.push(keyword);
        }
      }

      if (score > 0) {
        detectedEmotions.push({ emotion, score, triggers });
      }
    }

    // Analyze context for emotional indicators
    const contextEmotion = this.analyzeContextEmotion(context);
    if (contextEmotion) {
      const existing = detectedEmotions.find(e => e.emotion === contextEmotion);
      if (existing) {
        existing.score += 2; // Boost context-based emotions
      } else {
        detectedEmotions.push({ emotion: contextEmotion, score: 2, triggers: ['context'] });
      }
    }

    // Determine primary and secondary emotions
    detectedEmotions.sort((a, b) => b.score - a.score);

    if (detectedEmotions.length === 0) {
      return {
        primary: 'neutral',
        confidence: 0.5,
        intensity: 0.3,
        triggers: []
      };
    }

    const primary = detectedEmotions[0];
    const secondary = detectedEmotions[1];

    return {
      primary: primary.emotion,
      secondary: secondary?.emotion,
      confidence: Math.min(primary.score / 5, 1),
      intensity: Math.min(primary.score / 3, 1),
      triggers: primary.triggers
    };
  }

  private analyzeContextEmotion(context: any): string | null {
    if (context.gameState) {
      const pot = context.gameState.pot || 0;
      if (pot > 1000) return 'excitement';
      if (pot < 100) return 'concern';
    }

    if (context.userRating !== undefined) {
      if (context.userRating >= 4) return 'joy';
      if (context.userRating <= 2) return 'disappointment';
    }

    if (context.error) return 'concern';
    if (context.success) return 'excitement';

    return null;
  }

  public getTrustWeightedOutput(baseOutput: AceyOutput, emotionalState: EmotionalState): AceyOutput {
    // Adjust trust and confidence based on emotional state
    const trustAdjustment = this.getTrustAdjustment(emotionalState);
    const confidenceAdjustment = this.getConfidenceAdjustment(emotionalState);

    return {
      ...baseOutput,
      trust: Math.max(0, Math.min(1, (baseOutput.trust || 0.5) + trustAdjustment)),
      confidence: Math.max(0, Math.min(1, (baseOutput.confidence || 0.5) + confidenceAdjustment)),
      intents: [
        ...baseOutput.intents,
        {
          type: 'emotion',
          confidence: emotionalState.confidence,
          emotion: emotionalState.primary,
          intensity: emotionalState.intensity
        }
      ]
    };
  }

  private getTrustAdjustment(emotionalState: EmotionalState): number {
    const adjustments: Record<string, number> = {
      'excitement': 0.1,
      'joy': 0.05,
      'calm': 0.02,
      'concern': -0.05,
      'disappointment': -0.08,
      'anger': -0.15,
      'confusion': -0.1,
      'surprise': 0.0,
      'neutral': 0.0
    };

    return adjustments[emotionalState.primary] || 0;
  }

  private getConfidenceAdjustment(emotionalState: EmotionalState): number {
    const adjustments: Record<string, number> = {
      'excitement': 0.08,
      'joy': 0.05,
      'calm': 0.03,
      'concern': -0.03,
      'disappointment': -0.05,
      'anger': -0.1,
      'confusion': -0.08,
      'surprise': -0.02,
      'neutral': 0.0
    };

    return adjustments[emotionalState.primary] || 0;
  }
}

/**
 * Dry-Run Simulation & A/B Testing Framework
 */
export interface SimulationConfig {
  mode: 'dry-run' | 'ab-test' | 'shadow-run';
  variants: Array<{
    id: string;
    name: string;
    orchestrator: AceyOrchestrator;
    weight: number;
  }>;
  metrics: {
    successRate: number;
    userSatisfaction: number;
    responseTime: number;
    cost: number;
  };
}

export class SimulationFramework {
  private simulations: Map<string, SimulationConfig> = new Map();
  private activeSimulations: Map<string, any> = new Map();

  public createSimulation(id: string, config: SimulationConfig): void {
    this.simulations.set(id, config);
  }

  public async runSimulation(
    simulationId: string,
    tasks: Array<{ taskType: TaskType; prompt: string; context: any }>
  ): Promise<{
    simulationId: string;
    results: Array<{
      taskId: string;
      variant: string;
      output: AceyOutput;
      metrics: any;
      processingTime: number;
    }>;
    summary: {
      totalTasks: number;
      successRate: number;
      avgProcessingTime: number;
      variantComparison: Record<string, any>;
    };
  }> {
    const config = this.simulations.get(simulationId);
    if (!config) {
      throw new Error(`Simulation ${simulationId} not found`);
    }

    const results: any[] = [];
    const startTime = Date.now();

    for (const task of tasks) {
      // Select variant based on weights
      const variant = this.selectVariant(config.variants);
      
      try {
        const taskStartTime = Date.now();
        const output = await variant.orchestrator.runTask(task.taskType, task.prompt, task.context);
        const processingTime = Date.now() - taskStartTime;

        results.push({
          taskId: `${task.taskType}_${Date.now()}`,
          variant: variant.id,
          output,
          metrics: {
            success: true,
            confidence: output.confidence,
            trust: output.trust
          },
          processingTime
        });
      } catch (error) {
        results.push({
          taskId: `${task.taskType}_${Date.now()}`,
          variant: variant.id,
          output: { speech: 'Error occurred', intents: [] },
          metrics: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
          processingTime: 0
        });
      }
    }

    // Generate summary
    const summary = this.generateSummary(results, config);

    return {
      simulationId,
      results,
      summary
    };
  }

  private selectVariant(variants: SimulationConfig['variants']): SimulationConfig['variants'][0] {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[0];
  }

  private generateSummary(results: any[], config: SimulationConfig): any {
    const totalTasks = results.length;
    const successfulTasks = results.filter(r => r.metrics.success).length;
    const successRate = successfulTasks / totalTasks;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / totalTasks;

    // Compare variants
    const variantComparison: Record<string, any> = {};
    for (const variant of config.variants) {
      const variantResults = results.filter(r => r.variant === variant.id);
      const variantSuccessRate = variantResults.filter(r => r.metrics.success).length / variantResults.length;
      const variantAvgTime = variantResults.reduce((sum, r) => sum + r.processingTime, 0) / variantResults.length;

      variantComparison[variant.id] = {
        name: variant.name,
        tasks: variantResults.length,
        successRate: variantSuccessRate,
        avgProcessingTime: variantAvgTime,
        avgConfidence: variantResults.reduce((sum, r) => sum + (r.output.confidence || 0), 0) / variantResults.length
      };
    }

    return {
      totalTasks,
      successRate,
      avgProcessingTime,
      variantComparison
    };
  }
}

/**
 * Shadow-Ban & Auto-Evaluation Loops
 */
export interface AutoEvaluationConfig {
  enabled: boolean;
  thresholds: {
    confidence: number;
    trust: number;
    successRate: number;
    userSatisfaction: number;
  };
  actions: {
    shadowBan: boolean;
    autoApprove: boolean;
    requireReview: boolean;
    escalateToHuman: boolean;
  };
}

export class AutoEvaluationSystem {
  private config: AutoEvaluationConfig;
  private evaluationHistory: Array<{
    timestamp: string;
    taskId: string;
    evaluation: {
      approved: boolean;
      reason: string;
      action: string;
    };
  }> = [];

  constructor(config: AutoEvaluationConfig) {
    this.config = config;
  }

  public evaluateOutput(
    taskId: string,
    output: AceyOutput,
    context: any,
    userFeedback?: any
  ): {
    approved: boolean;
    reason: string;
    action: string;
    requiresHumanReview: boolean;
  } {
    const evaluation = this.performEvaluation(output, context, userFeedback);
    
    // Record evaluation
    this.evaluationHistory.push({
      timestamp: new Date().toISOString(),
      taskId,
      evaluation
    });

    return evaluation;
  }

  private performEvaluation(
    output: AceyOutput,
    context: any,
    userFeedback?: any
  ): {
    approved: boolean;
    reason: string;
    action: string;
    requiresHumanReview: boolean;
  } {
    const confidence = output.confidence || 0;
    const trust = output.trust || 0;
    const userRating = userFeedback?.rating;

    // Check hard thresholds
    if (confidence < this.config.thresholds.confidence) {
      return {
        approved: false,
        reason: `Low confidence: ${confidence} < ${this.config.thresholds.confidence}`,
        action: this.config.actions.shadowBan ? 'shadow_ban' : 'reject',
        requiresHumanReview: true
      };
    }

    if (trust < this.config.thresholds.trust) {
      return {
        approved: false,
        reason: `Low trust: ${trust} < ${this.config.thresholds.trust}`,
        action: this.config.actions.requireReview ? 'require_review' : 'reject',
        requiresHumanReview: true
      };
    }

    // Check user feedback
    if (userRating !== undefined) {
      if (userRating < 3) {
        return {
          approved: false,
          reason: `Negative user feedback: ${userRating}/5`,
          action: 'reject',
          requiresHumanReview: false
        };
      } else if (userRating >= 4 && confidence > 0.8) {
        return {
          approved: true,
          reason: `Positive user feedback: ${userRating}/5 with high confidence`,
          action: this.config.actions.autoApprove ? 'auto_approve' : 'approve',
          requiresHumanReview: false
        };
      }
    }

    // Default approval for high-confidence outputs
    if (confidence > 0.9 && trust > 0.8) {
      return {
        approved: true,
        reason: 'High confidence and trust scores',
        action: this.config.actions.autoApprove ? 'auto_approve' : 'approve',
        requiresHumanReview: false
      };
    }

    // Require review for borderline cases
    return {
      approved: false,
      reason: 'Borderline case requiring review',
      action: this.config.actions.requireReview ? 'require_review' : 'pending',
      requiresHumanReview: true
    };
  }

  public getEvaluationStats(): {
    totalEvaluations: number;
    approvalRate: number;
    rejectionRate: number;
    humanReviewRate: number;
    commonRejectionReasons: Array<{ reason: string; count: number }>;
  } {
    const total = this.evaluationHistory.length;
    const approved = this.evaluationHistory.filter(e => e.evaluation.approved).length;
    const requiresReview = this.evaluationHistory.filter(e => e.evaluation.requiresHumanReview).length;

    // Count rejection reasons
    const rejectionReasons = new Map<string, number>();
    for (const evaluation of this.evaluationHistory) {
      if (!evaluation.evaluation.approved) {
        const reason = evaluation.evaluation.reason;
        rejectionReasons.set(reason, (rejectionReasons.get(reason) || 0) + 1);
      }
    }

    const commonRejectionReasons = Array.from(rejectionReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvaluations: total,
      approvalRate: total > 0 ? approved / total : 0,
      rejectionRate: total > 0 ? (total - approved) / total : 0,
      humanReviewRate: total > 0 ? requiresReview / total : 0,
      commonRejectionReasons
    };
  }
}

/**
 * WebSocket & Polling Updates for Dashboard Metrics
 */
export interface DashboardUpdate {
  type: 'metrics' | 'task' | 'learning' | 'system';
  timestamp: string;
  data: any;
}

export class RealTimeUpdatesManager {
  private connections: Set<any> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private orchestrator: AceyOrchestrator,
    private learningLoop: ContinuousLearningLoop,
    private fineTuneManager: RealTimeFineTune
  ) {}

  public startUpdates(intervalMs: number = 1000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.broadcastUpdates();
    }, intervalMs);
  }

  public stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
  }

  public addConnection(connection: any): void {
    this.connections.add(connection);
  }

  public removeConnection(connection: any): void {
    this.connections.delete(connection);
  }

  private broadcastUpdates(): void {
    const updates: DashboardUpdate[] = [
      {
        type: 'metrics',
        timestamp: new Date().toISOString(),
        data: this.orchestrator.getStats()
      },
      {
        type: 'learning',
        timestamp: new Date().toISOString(),
        data: this.learningLoop.getLearningStats()
      },
      {
        type: 'system',
        timestamp: new Date().toISOString(),
        data: this.fineTuneManager.getStats()
      }
    ];

    for (const connection of this.connections) {
      try {
        connection.send(JSON.stringify(updates));
      } catch (error) {
        console.error('Failed to send update to connection:', error);
        this.connections.delete(connection);
      }
    }
  }

  public async pollUpdates(): Promise<DashboardUpdate[]> {
    return [
      {
        type: 'metrics',
        timestamp: new Date().toISOString(),
        data: this.orchestrator.getStats()
      },
      {
        type: 'learning',
        timestamp: new Date().toISOString(),
        data: this.learningLoop.getLearningStats()
      },
      {
        type: 'system',
        timestamp: new Date().toISOString(),
        data: this.fineTuneManager.getStats()
      }
    ];
  }
}

/**
 * Helper Functions for Orchestration, Dataset Handling, and Fine-Tuning
 */
export class AceyUtilities {
  /**
   * Dataset Management Utilities
   */
  static async validateDataset(datasetPath: string): Promise<{
    isValid: boolean;
    entries: number;
    errors: string[];
    warnings: string[];
  }> {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const content = await fs.readFile(datasetPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const errors: string[] = [];
      const warnings: string[] = [];
      let validEntries = 0;

      for (let i = 0; i < lines.length; i++) {
        try {
          const entry = JSON.parse(lines[i]);
          
          // Validate structure
          if (!entry.input || !entry.output) {
            errors.push(`Line ${i + 1}: Missing input/output structure`);
            continue;
          }

          if (!entry.input.prompt || typeof entry.input.prompt !== 'string') {
            errors.push(`Line ${i + 1}: Invalid or missing prompt`);
            continue;
          }

          if (!entry.output.speech || typeof entry.output.speech !== 'string') {
            warnings.push(`Line ${i + 1}: Missing or invalid speech output`);
          }

          validEntries++;
        } catch (parseError) {
          errors.push(`Line ${i + 1}: JSON parse error - ${parseError}`);
        }
      }

      return {
        isValid: errors.length === 0,
        entries: validEntries,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        entries: 0,
        errors: [`Failed to read dataset: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Fine-Tuning Utilities
   */
  static calculateOptimalBatchSize(
    datasetSize: number,
    modelComplexity: 'small' | 'medium' | 'large' = 'medium'
  ): number {
    const baseSizes = {
      small: { min: 10, max: 50, optimal: 20 },
      medium: { min: 20, max: 100, optimal: 50 },
      large: { min: 50, max: 200, optimal: 100 }
    };

    const config = baseSizes[modelComplexity];
    
    // Adjust based on dataset size
    if (datasetSize < config.min) {
      return Math.max(5, datasetSize);
    }
    
    if (datasetSize < config.optimal) {
      return datasetSize;
    }
    
    return config.optimal;
  }

  static estimateFineTuneTime(
    datasetSize: number,
    modelComplexity: 'small' | 'medium' | 'large' = 'medium'
  ): number {
    // Estimated time in minutes
    const timePerSample = {
      small: 0.1,    // 6 seconds per sample
      medium: 0.3,   // 18 seconds per sample
      large: 0.8     // 48 seconds per sample
    };

    return Math.ceil(datasetSize * timePerSample[modelComplexity]);
  }

  /**
   * Performance Monitoring Utilities
   */
  static calculatePerformanceMetrics(
    results: Array<{ success: boolean; processingTime: number; confidence?: number }>
  ): {
    successRate: number;
    avgProcessingTime: number;
    avgConfidence: number;
    throughput: number; // tasks per minute
  } {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    const totalConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0);

    return {
      successRate: total > 0 ? successful / total : 0,
      avgProcessingTime: total > 0 ? totalTime / total : 0,
      avgConfidence: total > 0 ? totalConfidence / total : 0,
      throughput: totalTime > 0 ? (total / totalTime) * 60000 : 0 // Convert to per minute
    };
  }

  /**
   * Model Version Management
   */
  static incrementModelVersion(currentVersion: string, changeType: 'patch' | 'minor' | 'major' = 'patch'): string {
    const parts = currentVersion.split('.').map(Number);
    
    if (changeType === 'major') {
      return `${parts[0] + 1}.0.0`;
    } else if (changeType === 'minor') {
      return `${parts[0]}.${parts[1] + 1}.0`;
    } else {
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
  }

  static compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }

    return 0;
  }

  /**
   * Cross-Task Learning Utilities
   */
  static findRelatedTasks(
    primaryTaskType: TaskType,
    allTaskTypes: TaskType[]
  ): TaskType[] {
    const relationships: Record<TaskType, TaskType[]> = {
      audio: ['game', 'moderation', 'trust'],
      coding: ['website', 'game', 'graphics'],
      graphics: ['website', 'game', 'images'],
      images: ['graphics', 'website'],
      game: ['audio', 'coding', 'graphics'],
      website: ['coding', 'graphics', 'images'],
      moderation: ['audio', 'trust'],
      memory: ['trust', 'persona'],
      trust: ['moderation', 'memory'],
      persona: ['audio', 'memory']
    };

    return relationships[primaryTaskType] || [];
  }

  static calculateCrossTaskTransfer(
    sourceTaskType: TaskType,
    targetTaskType: TaskType,
    sourcePerformance: number,
    targetPerformance: number
  ): number {
    // Calculate transfer learning potential based on task relationship
    const relatedTasks = this.findRelatedTasks(sourceTaskType, []);
    const isRelated = relatedTasks.includes(targetTaskType);

    if (!isRelated) {
      return 0; // No transfer potential for unrelated tasks
    }

    // Transfer potential based on performance gap and relationship strength
    const performanceGap = sourcePerformance - targetPerformance;
    const relationshipStrength = 0.3; // Base transfer strength

    return Math.max(0, Math.min(1, performanceGap * relationshipStrength));
  }
}
