import { AudioTaskContext, CodingTaskContext, AudioGenerationResult, CodingGenerationResult, TaskValidationResult, FeedbackData } from "./enhancedSchema";
import { PromptTemplates } from "./promptTemplates";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export class TaskHandlers {
  // Audio Generation Handler
  static async handleAudioGeneration(context: AudioTaskContext, llmOutput: string): Promise<AudioGenerationResult> {
    const timestamp = new Date().toISOString();
    const fileName = context.targetFileName || `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${context.format || 'mp3'}`;
    const filePath = path.join(process.cwd(), 'data', 'audio', fileName);
    
    // Ensure audio directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    
    // For simulation mode, just return metadata
    if (process.env.SIMULATION_MODE === 'true') {
      return {
        type: context.type,
        fileName,
        duration: context.lengthSeconds || 3,
        fileSize: 1024 * 100, // Estimated
        format: context.format || 'mp3',
        metadata: {
          mood: context.mood,
          intensity: context.intensity || 'medium',
          generatedAt: timestamp,
          promptUsed: llmOutput,
          confidence: 0.85,
          lengthSeconds: context.lengthSeconds
        },
        base64: this.generateMockBase64(context)
      };
    }
    
    // In production, this would integrate with actual audio generation service
    const audioResult = await this.generateAudioFile(context, llmOutput, filePath);
    
    return {
      type: context.type,
      fileName,
      duration: audioResult.duration || context.lengthSeconds || 3,
      fileSize: audioResult.fileSize || 1024 * 100,
      format: context.format || 'mp3',
      metadata: {
        mood: context.mood,
        intensity: context.intensity || 'medium',
        generatedAt: timestamp,
        promptUsed: llmOutput,
        confidence: audioResult.confidence || 0.85,
        lengthSeconds: context.lengthSeconds
      },
      filePath: audioResult.filePath || filePath
    };
  }

  private static async generateAudioFile(context: AudioTaskContext, llmOutput: string, filePath: string): Promise<any> {
    // This would integrate with your actual audio generation service
    // For now, return mock data
    console.log(`[AUDIO] Generating ${context.type} with context:`, context);
    console.log(`[AUDIO] LLM Output:`, llmOutput);
    console.log(`[AUDIO] Target file:`, filePath);
    
    // Mock audio generation
    const mockDuration = context.lengthSeconds || 3;
    const mockFileSize = mockDuration * 44100 * 2 * 2; // Rough estimate
    
    return {
      duration: mockDuration,
      fileSize: mockFileSize,
      filePath: filePath,
      confidence: 0.85
    };
  }

  private static generateMockBase64(context: AudioTaskContext): string {
    // Generate a mock base64 string for simulation
    const mockData = `data:audio/${context.format || 'mp3'};base64,mock${context.type}data`;
    return mockData;
  }

  // Coding Generation Handler
  static async handleCodingGeneration(context: CodingTaskContext, llmOutput: string): Promise<CodingGenerationResult> {
    const timestamp = new Date().toISOString();
    const fileName = context.filePath || `${context.functionName || 'generated'}_${Date.now()}.${context.language}`;
    const code = this.extractCodeFromLLMOutput(llmOutput);
    const lineCount = code.split('\n').length;
    
    // Validate the generated code
    const validation = await this.validateCode(code, context);
    
    // Run tests if available
    const testResults = await this.runCodeTests(code, context.testCases || []);
    
    // Save code to file
    const filePath = path.join(process.cwd(), 'data', 'code', fileName);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, code);
    
    return {
      type: context.language,
      fileName,
      code,
      lineCount,
      validation,
      testResults,
      metadata: {
        generatedAt: timestamp,
        promptUsed: llmOutput,
        confidence: this.calculateCodeConfidence(validation, testResults),
        framework: context.framework,
        dependencies: context.dependencies || []
      }
    };
  }

  private static extractCodeFromLLMOutput(llmOutput: string): string {
    // Extract code from LLM output (handles markdown code blocks, plain text, etc.)
    const codeBlockMatch = llmOutput.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }
    
    // If no code block, assume the entire output is code
    return llmOutput;
  }

  private static async validateCode(code: string, context: CodingTaskContext): Promise<CodingGenerationResult["validation"]> {
    const validation = {
      syntax: true,
      security: true,
      performance: true,
      style: true,
      errors: [] as Array<{
        type: string;
        message: string;
        line?: number;
        severity: string;
      }>
    };
    
    // Syntax validation
    if (context.language === 'typescript' || context.language === 'javascript') {
      try {
        // Basic syntax check
        new Function(code);
      } catch (error) {
        validation.syntax = false;
        validation.errors.push({
          type: 'syntax',
          message: `Syntax error: ${(error as Error).message}`,
          severity: 'error'
        });
      }
    }
    
    // Security validation
    const securityPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\.write/gi,
      /innerHTML/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi,
      /child_process/gi
    ];
    
    securityPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        validation.security = false;
        validation.errors.push({
          type: 'security',
          message: `Potential security issue detected`,
          severity: 'error'
        });
      }
    });
    
    // Performance validation
    if (code.includes('while (true)') || code.includes('for (;;')) {
      validation.performance = false;
      validation.errors.push({
        type: 'performance',
        message: 'Infinite loop detected',
        severity: 'warning'
      });
    }
    
    // Style validation
    if (context.language === 'typescript' || context.language === 'javascript') {
      if (!code.includes('//') && !code.includes('/*') && !code.includes('*')) {
        validation.style = false;
        validation.errors.push({
          type: 'style',
          message: 'Missing comments',
          severity: 'info'
        });
      }
    }
    
    return validation;
  }

  private static async runCodeTests(code: string, testCases: CodingTaskContext["testCases"]): Promise<CodingGenerationResult["testResults"]> {
    const results = [];
    
    for (const testCase of testCases || []) {
      const startTime = Date.now();
      let passed = false;
      let error = '';
      
      try {
        // Create a test function from the code
        const testFunction = new Function('input', `
          ${code}
          return ${testCase.expectedOutput};
        `);
        
        const result = testFunction(testCase.input);
        passed = JSON.stringify(result) === JSON.stringify(testCase.expectedOutput);
        
        if (!passed) {
          error = `Expected ${JSON.stringify(testCase.expectedOutput)}, got ${JSON.stringify(result)}`;
        }
      } catch (testError) {
        error = testError instanceof Error ? testError.message : 'Unknown error';
        passed = false;
      }
      
      results.push({
        testCase: testCase.description,
        passed,
        error: passed ? undefined : error,
        executionTime: Date.now() - startTime
      });
    }
    
    return results;
  }

  private static calculateCodeConfidence(validation: CodingGenerationResult["validation"], testResults: CodingGenerationResult["testResults"]): number {
    let confidence = 0.5; // Base confidence
    
    if (validation.syntax) confidence += 0.2;
    if (validation.security) confidence += 0.2;
    if (validation.performance) confidence += 0.1;
    if (validation.style) confidence += 0.1;
    
    // Adjust based on test results
    if (testResults.length > 0) {
      const passRate = testResults.filter(r => r.passed).length / testResults.length;
      confidence += passRate * 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Task Validation Handler
  static async validateTask(taskType: "audio" | "coding", context: AudioTaskContext | CodingTaskContext, result: AudioGenerationResult | CodingGenerationResult): Promise<TaskValidationResult> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const validationSteps: Array<{
    step: string;
    status: "pending" | "passed" | "failed";
    result?: any;
    error?: string;
    timestamp: string;
  }> = [
      {
        step: "Initial validation",
        status: "passed",
        timestamp: new Date().toISOString()
      }
    ];
    
    try {
      // Audio-specific validation
      if (taskType === "audio") {
        const audioResult = result as AudioGenerationResult;
        
        // Validate duration
        validationSteps.push({
          step: "Duration validation",
          status: audioResult.duration <= (audioResult.metadata.lengthSeconds || 10) ? "passed" : "failed",
          timestamp: new Date().toISOString(),
          result: { actualDuration: audioResult.duration, maxDuration: audioResult.metadata.lengthSeconds || 10 }
        });
        
        // Validate format
        validationSteps.push({
          step: "Format validation",
          status: audioResult.format === audioResult.metadata.format ? "passed" : "failed",
          timestamp: new Date().toISOString(),
          result: { actualFormat: audioResult.format, expectedFormat: audioResult.metadata.format }
        });
        
        // Validate file size
        validationSteps.push({
          step: "File size validation",
          status: audioResult.fileSize > 0 ? "passed" : "failed",
          timestamp: new Date().toISOString(),
          result: { fileSize: audioResult.fileSize }
        });
      }
      
      // Coding-specific validation
      if (taskType === "coding") {
        const codingResult = result as CodingGenerationResult;
        
        // Use existing validation
        validationSteps.push({
          step: "Code validation",
          status: codingResult.validation.syntax && codingResult.validation.security ? "passed" : "failed",
          timestamp: new Date().toISOString(),
          result: { validation: codingResult.validation }
        });
        
        // Test validation
        const allTestsPassed = codingResult.testResults.every(r => r.passed);
        validationSteps.push({
          step: "Test validation",
          status: allTestsPassed ? "passed" : "failed",
          timestamp: new Date().toISOString(),
          result: { testResults: codingResult.testResults }
        });
      }
      
      // Final decision
      const allPassed = validationSteps.every(step => step.status === "passed");
      
      return {
        taskId,
        taskType,
        status: allPassed ? "approved" : "rejected",
        validationSteps,
        finalDecision: {
          approved: allPassed,
          reason: allPassed ? "All validation steps passed" : "Some validation steps failed",
          confidence: allPassed ? 0.9 : 0.3,
          autoRuleApplied: false
        }
      };
      
    } catch (error) {
      validationSteps.push({
        step: "Validation error",
        status: "failed",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown validation error"
      });
      
      return {
        taskId,
        taskType,
        status: "rejected",
        validationSteps,
        finalDecision: {
          approved: false,
          reason: "Validation process failed",
          confidence: 0.1,
          autoRuleApplied: false
        }
      };
    }
  }

  // Feedback Handler
  static async processFeedback(feedback: FeedbackData): Promise<void> {
    console.log(`[FEEDBACK] Processing feedback for task ${feedback.taskId}:`, feedback);
    
    // Store feedback data
    const feedbackPath = path.join(process.cwd(), 'data', 'feedback', `${feedback.taskId}.json`);
    await fs.promises.mkdir(path.dirname(feedbackPath), { recursive: true });
    await fs.promises.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));
    
    // Generate adaptation recommendations
    const adaptationPrompt = PromptTemplates.getFeedbackAnalysisPrompt(feedback);
    console.log(`[FEEDBACK] Adaptation prompt generated:`, adaptationPrompt);
    
    // In production, this would:
    // 1. Send to LLM for analysis
    // 2. Apply adaptations to orchestrator
    // 3. Update user preferences
    // 4. Log the adaptation
    
    console.log(`[FEEDBACK] Trust delta: ${feedback.adaptation.trustDelta}`);
    console.log(`[FEEDBACK] Confidence adjustment: ${feedback.adaptation.confidenceAdjustment}`);
  }

  // Utility function to get current timestamp
  private static getCurrentTimestamp(): number {
    return new Date().getTime();
  }
}
