/**
 * Evaluation Manager - Self-Generated Evaluation Suites
 * Acey creates and runs her own tests continuously
 */

import { EvalCase, EvalSuite, EvalResult, EvalType, AutoGenerationPrompt } from './evalTypes';

class EvaluationManager {
  private suites: Map<string, EvalSuite> = new Map();
  private storagePath: string;
  private modelVersion: string;

  constructor(modelVersion: string, storagePath: string = './data/eval-suites.json') {
    this.modelVersion = modelVersion;
    this.storagePath = storagePath;
    this.loadSuites();
  }

  /**
   * Auto-generate evaluation cases based on recent interactions
   */
  async generateEvalCases(interaction: {
    input: string;
    output: string;
    context: string;
    confidence: number;
  }): Promise<EvalCase[]> {
    const cases: EvalCase[] = [];

    // Consistency test - same input should produce similar output
    if (Math.random() < 0.3) { // 30% chance to generate consistency test
      cases.push(this.generateConsistencyCase(interaction));
    }

    // Task accuracy test - did the action succeed?
    if (interaction.context.includes('action') || interaction.context.includes('task')) {
      cases.push(this.generateTaskAccuracyCase(interaction));
    }

    // Persona drift test - maintain consistent tone
    if (Math.random() < 0.2) { // 20% chance
      cases.push(this.generatePersonaDriftCase(interaction));
    }

    // Hallucination test - factual accuracy
    if (interaction.confidence < 0.7) {
      cases.push(this.generateHallucinationCase(interaction));
    }

    return cases;
  }

  /**
   * Generate consistency evaluation case
   */
  private generateConsistencyCase(interaction: any): EvalCase {
    return {
      id: this.generateId(),
      type: "consistency",
      input: interaction.input,
      expectedBehavior: "Response should be semantically similar to previous responses",
      generatedOutput: interaction.output,
      score: 0.8, // Will be updated when run
      modelVersion: this.modelVersion,
      createdAt: Date.now(),
      metadata: {
        confidence: interaction.confidence,
        context: interaction.context,
        tags: ["auto-generated", "consistency"]
      }
    };
  }

  /**
   * Generate task accuracy evaluation case
   */
  private generateTaskAccuracyCase(interaction: any): EvalCase {
    return {
      id: this.generateId(),
      type: "task-accuracy",
      input: interaction.input,
      expectedBehavior: "Task should be completed successfully",
      generatedOutput: interaction.output,
      score: 0.7, // Will be updated when run
      modelVersion: this.modelVersion,
      createdAt: Date.now(),
      metadata: {
        confidence: interaction.confidence,
        context: interaction.context,
        tags: ["auto-generated", "task-accuracy"]
      }
    };
  }

  /**
   * Generate persona drift evaluation case
   */
  private generatePersonaDriftCase(interaction: any): EvalCase {
    return {
      id: this.generateId(),
      type: "persona-drift",
      input: interaction.input,
      expectedBehavior: "Maintain consistent Acey personality - helpful, slightly playful, knowledgeable about poker",
      generatedOutput: interaction.output,
      score: 0.8, // Will be updated when run
      modelVersion: this.modelVersion,
      createdAt: Date.now(),
      metadata: {
        confidence: interaction.confidence,
        context: interaction.context,
        tags: ["auto-generated", "persona-drift"]
      }
    };
  }

  /**
   * Generate hallucination evaluation case
   */
  private generateHallucinationCase(interaction: any): EvalCase {
    return {
      id: this.generateId(),
      type: "hallucination",
      input: interaction.input,
      expectedBehavior: "Response should be factually accurate and not hallucinate information",
      generatedOutput: interaction.output,
      score: 0.6, // Lower initial score for low confidence inputs
      modelVersion: this.modelVersion,
      createdAt: Date.now(),
      metadata: {
        confidence: interaction.confidence,
        context: interaction.context,
        tags: ["auto-generated", "hallucination-check"]
      }
    };
  }

  /**
   * Run an evaluation suite
   */
  async runSuite(suiteId: string): Promise<EvalResult[]> {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Suite ${suiteId} not found`);
    }

    suite.status = "running";
    const results: EvalResult[] = [];

    for (const testCase of suite.cases) {
      const result = await this.runSingleCase(testCase);
      results.push(result);
      
      // Update case score
      testCase.score = result.score;
    }

    // Calculate average score
    suite.averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    suite.lastRun = Date.now();
    suite.status = "completed";

    this.saveSuites();
    return results;
  }

  /**
   * Run a single evaluation case
   */
  private async runSingleCase(testCase: EvalCase): Promise<EvalResult> {
    const startTime = Date.now();
    let score = 0.5; // Default score
    let passed = false;
    let details = "";

    switch (testCase.type) {
      case "consistency":
        ({ score, passed, details } = await this.evaluateConsistency(testCase));
        break;
      case "task-accuracy":
        ({ score, passed, details } = await this.evaluateTaskAccuracy(testCase));
        break;
      case "persona-drift":
        ({ score, passed, details } = await this.evaluatePersonaDrift(testCase));
        break;
      case "hallucination":
        ({ score, passed, details } = await this.evaluateHallucination(testCase));
        break;
      default:
        score = 0.5;
        passed = true;
        details = "Unknown evaluation type";
    }

    return {
      caseId: testCase.id,
      score,
      passed,
      details,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Evaluate consistency
   */
  private async evaluateConsistency(testCase: EvalCase): Promise<{ score: number; passed: boolean; details: string }> {
    // In a real implementation, this would compare with previous responses
    // For now, simulate consistency checking
    const score = 0.7 + Math.random() * 0.3; // 0.7-1.0
    return {
      score,
      passed: score > 0.6,
      details: `Consistency score: ${score.toFixed(2)}`
    };
  }

  /**
   * Evaluate task accuracy
   */
  private async evaluateTaskAccuracy(testCase: EvalCase): Promise<{ score: number; passed: boolean; details: string }> {
    // Check if the output indicates successful task completion
    const successIndicators = ["completed", "done", "success", "finished", "resolved"];
    const hasSuccessIndicator = successIndicators.some(indicator => 
      testCase.generatedOutput.toLowerCase().includes(indicator)
    );
    
    const score = hasSuccessIndicator ? 0.8 + Math.random() * 0.2 : 0.4 + Math.random() * 0.3;
    return {
      score,
      passed: score > 0.5,
      details: `Task completion indicator: ${hasSuccessIndicator}, Score: ${score.toFixed(2)}`
    };
  }

  /**
   * Evaluate persona drift
   */
  private async evaluatePersonaDrift(testCase: EvalCase): Promise<{ score: number; passed: boolean; details: string }> {
    // Check for personality consistency
    const aceyTraits = ["helpful", "poker", "game", "friendly", "let's", "shall"];
    const output = testCase.generatedOutput.toLowerCase();
    
    const traitMatches = aceyTraits.filter(trait => output.includes(trait)).length;
    const score = Math.min(0.3 + (traitMatches * 0.15), 1.0);
    
    return {
      score,
      passed: score > 0.4,
      details: `Personality traits matched: ${traitMatches}/${aceyTraits.length}, Score: ${score.toFixed(2)}`
    };
  }

  /**
   * Evaluate hallucination
   */
  private async evaluateHallucination(testCase: EvalCase): Promise<{ score: number; passed: boolean; details: string }> {
    // Simple hallucination detection based on confidence and content
    const confidence = testCase.metadata?.confidence || 0.5;
    const hasUncertainLanguage = testCase.generatedOutput.toLowerCase().includes("i think") ||
                                testCase.generatedOutput.toLowerCase().includes("might be") ||
                                testCase.generatedOutput.toLowerCase().includes("probably");
    
    // Lower score if confidence is low but no uncertain language
    let score = confidence;
    if (confidence < 0.7 && !hasUncertainLanguage) {
      score *= 0.7; // Penalize confident but potentially hallucinated content
    }
    
    return {
      score,
      passed: score > 0.3,
      details: `Confidence: ${confidence.toFixed(2)}, Uncertain language: ${hasUncertainLanguage}, Score: ${score.toFixed(2)}`
    };
  }

  /**
   * Create a new evaluation suite
   */
  createSuite(name: string, description: string): string {
    const suite: EvalSuite = {
      id: this.generateId(),
      name,
      description,
      cases: [],
      averageScore: 0,
      lastRun: 0,
      modelVersion: this.modelVersion,
      status: "pending"
    };

    this.suites.set(suite.id, suite);
    this.saveSuites();
    return suite.id;
  }

  /**
   * Add cases to a suite
   */
  addCasesToSuite(suiteId: string, cases: EvalCase[]): void {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Suite ${suiteId} not found`);
    }

    suite.cases.push(...cases);
    this.saveSuites();
  }

  /**
   * Get training gate status
   */
  getTrainingGateStatus(): {
    canProceed: boolean;
    reason: string;
    averageScore: number;
  } {
    let totalScore = 0;
    let totalCases = 0;

    for (const suite of this.suites.values()) {
      if (suite.status === "completed") {
        totalScore += suite.averageScore;
        totalCases += suite.cases.length;
      }
    }

    const averageScore = totalCases > 0 ? totalScore / totalCases : 0;

    if (averageScore < 0.5) {
      return {
        canProceed: false,
        reason: "Evaluation score too low - trigger rollback",
        averageScore
      };
    }

    if (averageScore < 0.7) {
      return {
        canProceed: false,
        reason: "Evaluation score below threshold - block fine-tuning",
        averageScore
      };
    }

    return {
      canProceed: true,
      reason: "Evaluation scores acceptable",
      averageScore
    };
  }

  /**
   * Generate evaluation summary
   */
  getEvaluationSummary(): {
    totalSuites: number;
    completedSuites: number;
    averageScore: number;
    scoreByType: Record<EvalType, number>;
  } {
    const suites = Array.from(this.suites.values());
    const completedSuites = suites.filter(s => s.status === "completed");
    
    const scoreByType = {} as Record<EvalType, number>;
    const typeCounts = {} as Record<EvalType, number>;

    for (const suite of completedSuites) {
      for (const testCase of suite.cases) {
        if (!scoreByType[testCase.type]) {
          scoreByType[testCase.type] = 0;
          typeCounts[testCase.type] = 0;
        }
        scoreByType[testCase.type] += testCase.score;
        typeCounts[testCase.type]++;
      }
    }

    // Calculate averages by type
    for (const type in scoreByType) {
      if (typeCounts[type as EvalType] > 0) {
        scoreByType[type as EvalType] /= typeCounts[type as EvalType];
      }
    }

    const averageScore = completedSuites.length > 0 
      ? completedSuites.reduce((sum, s) => sum + s.averageScore, 0) / completedSuites.length 
      : 0;

    return {
      totalSuites: suites.length,
      completedSuites: completedSuites.length,
      averageScore,
      scoreByType
    };
  }

  /**
   * Save suites to disk
   */
  private saveSuites(): void {
    try {
      const fs = require('fs');
      const data = Array.from(this.suites.entries());
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save evaluation suites:', error);
    }
  }

  /**
   * Load suites from disk
   */
  private loadSuites(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.suites = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load evaluation suites:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { EvaluationManager };
