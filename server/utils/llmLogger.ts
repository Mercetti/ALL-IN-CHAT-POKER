import axios from "axios";
import fs from "fs";
import path from "path";
import { AceyInteractionLog, LLMCallConfig } from "./schema";

export class LLMLogger {
  private static instance: LLMLogger;
  private logDir: string;
  private config: LLMCallConfig;

  constructor(config: LLMCallConfig) {
    this.config = config;
    this.logDir = path.join(__dirname, "../../data/logs");
    this.ensureLogDir();
  }

  static getInstance(config?: LLMCallConfig): LLMLogger {
    if (!LLMLogger.instance) {
      if (!config) {
        throw new Error("LLMLogger requires config on first instantiation");
      }
      LLMLogger.instance = new LLMLogger(config);
    }
    return LLMLogger.instance;
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Call LLM and automatically log the interaction
   */
  async runLLMAndLog(
    prompt: string,
    taskType: AceyInteractionLog["taskType"],
    context: AceyInteractionLog["context"],
    personaMode: AceyInteractionLog["personaMode"],
    customConfig?: Partial<LLMCallConfig>
  ): Promise<AceyInteractionLog["aceyOutput"]> {
    const startTime = Date.now();
    
    try {
      // Call LLM with merged config
      const llmConfig = { ...this.config, ...customConfig };
      const llmResponse = await this.callLLM(prompt, llmConfig);
      
      // Parse LLM response
      const llmOutput = llmResponse.data.text || llmResponse.data.content || llmResponse.data;
      
      // Create Acey output (adapt to your JSON schema)
      const aceyOutput: AceyInteractionLog["aceyOutput"] = {
        speech: typeof llmOutput === 'string' ? llmOutput : llmOutput.speech || llmOutput.text || '',
        intents: llmOutput.intents || this.extractIntents(llmOutput)
      };

      // Calculate performance metrics
      const responseTime = Date.now() - startTime;
      const tokenCount = llmOutput.usage?.tokenCount || this.estimateTokens(prompt + llmOutput);
      const cost = this.calculateCost(tokenCount, llmConfig.model);

      // Build full log
      const log: AceyInteractionLog = {
        taskType,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          environment: context.environment || "live"
        },
        llmPrompt: prompt,
        llmOutput: typeof llmOutput === 'string' ? llmOutput : JSON.stringify(llmOutput),
        aceyOutput,
        controlDecision: "approved", // Will be modified by auto-rules
        finalAction: null,
        trustDelta: 0,
        personaMode,
        performance: {
          responseTime,
          tokenCount,
          cost
        },
        metadata: {
          model: llmConfig.model,
          temperature: llmConfig.temperature,
          maxTokens: llmConfig.maxTokens,
          endpoint: llmConfig.endpoint
        }
      };

      // Save to logging endpoint
      await this.saveLog(log);

      return aceyOutput;

    } catch (error) {
      console.error('LLM call failed:', error);
      
      // Log the error
      const errorLog: Partial<AceyInteractionLog> = {
        taskType,
        timestamp: new Date().toISOString(),
        context,
        llmPrompt: prompt,
        llmOutput: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
        controlDecision: "rejected",
        finalAction: null,
        trustDelta: 0,
        personaMode,
        performance: {
          responseTime: Date.now() - startTime
        }
      };
      
      await this.saveLog(errorLog as AceyInteractionLog);
      throw error;
    }
  }

  /**
   * Call the actual LLM endpoint
   */
  private async callLLM(prompt: string, config: LLMCallConfig): Promise<any> {
    const payload = {
      prompt,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1000,
      ...config
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await axios.post(config.endpoint, payload, {
      headers,
      timeout: config.timeout || 30000
    });

    return response;
  }

  /**
   * Extract intents from LLM output if not explicitly provided
   */
  private extractIntents(llmOutput: any): any[] {
    const text = typeof llmOutput === 'string' ? llmOutput : llmOutput.text || llmOutput.speech || '';
    
    // Simple intent extraction - you can make this more sophisticated
    const intents = [];
    
    if (text.toLowerCase().includes('all-in') || text.toLowerCase().includes('all in')) {
      intents.push({
        type: "memory_proposal",
        scope: "event",
        summary: "All-in moment detected",
        confidence: 0.9
      });
    }
    
    if (text.toLowerCase().includes('great') || text.toLowerCase().includes('amazing')) {
      intents.push({
        type: "trust_signal",
        delta: 0.1,
        reason: "Positive engagement detected",
        reversible: true
      });
    }
    
    return intents;
  }

  /**
   * Save log to file system
   */
  private async saveLog(log: AceyInteractionLog): Promise<void> {
    const filename = `acey-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    const filepath = path.join(this.logDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(log, null, 2));
    
    // Also send to logging endpoint if available
    try {
      await axios.post(`${process.env.BASE_URL || 'http://localhost:8080'}/log`, log);
    } catch (error) {
      console.warn('Failed to send log to endpoint:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on token count and model
   */
  private calculateCost(tokens: number, model: string): number {
    // Example pricing - update based on your actual LLM costs
    const pricing: Record<string, number> = {
      'gpt-3.5-turbo': 0.000002, // $0.002 per 1K tokens
      'gpt-4': 0.00003, // $0.03 per 1K tokens
      'claude-3': 0.000015 // $0.015 per 1K tokens
    };
    
    const rate = pricing[model] || 0.00001; // Default rate
    return (tokens / 1000) * rate;
  }

  /**
   * Get recent logs for analysis
   */
  async getRecentLogs(limit: number = 100): Promise<AceyInteractionLog[]> {
    const files = fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .slice(-limit);
    
    const logs: AceyInteractionLog[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.logDir, file), 'utf-8');
        logs.push(JSON.parse(content));
      } catch (error) {
        console.warn(`Failed to read log file ${file}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return logs.reverse(); // Most recent first
  }

  /**
   * Update log with control decision
   */
  async updateLogDecision(filename: string, decision: AceyInteractionLog["controlDecision"], finalAction?: string): Promise<void> {
    const filepath = path.join(this.logDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Log file not found: ${filename}`);
    }
    
    const log: AceyInteractionLog = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    log.controlDecision = decision;
    if (finalAction) {
      log.finalAction = finalAction;
    }
    
    fs.writeFileSync(filepath, JSON.stringify(log, null, 2));
  }
}
