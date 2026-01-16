/**
 * Ollama LLM Integration for Acey
 * Manages local LLM models through Ollama
 * 
 * This system uses Ollama to run 3 different local models
 * each optimized for specific tasks, all running on the local PC
 */

import { EventEmitter } from 'events';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface OllamaModel {
  name: string;
  taskType: 'code' | 'analysis' | 'creative' | 'security' | 'reasoning';
  modelId: string; // Ollama model name (e.g., 'llama2', 'codellama', 'mistral')
  size: string; // Model size (e.g., '7B', '13B', '70B')
  isAvailable: boolean;
  priority: number;
  capabilities: string[];
  maxTokens: number;
  description: string;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stream?: boolean;
  };
  context?: any;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  load_duration?: number;
}

export interface LocalLLMConfig {
  ollamaPath?: string;
  modelsPath?: string;
  defaultModels: OllamaModel[];
  enableStreaming: boolean;
  maxConcurrency: number;
  timeoutMs: number;
}

export class OllamaLLMManager extends EventEmitter {
  private config: LocalLLMConfig;
  private models: Map<string, OllamaModel> = new Map();
  private activeRequests: Map<string, any> = new Map();
  private isOllamaRunning: boolean = false;
  private executionStats: Map<string, number> = new Map();
  private learningData: Map<string, any[]> = new Map();

  constructor(config: LocalLLMConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize Ollama LLM manager
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🦙 Initializing Ollama LLM Manager...');

      // Check if Ollama is installed and running
      await this.checkOllamaStatus();

      // Register default models
      await this.registerDefaultModels();

      // Create learning data directory
      this.ensureLearningDirectory();

      console.log('✅ Ollama LLM Manager initialized');
      console.log(`📊 Registered models: ${this.models.size}`);
      console.log(`🦙 Ollama status: ${this.isOllamaRunning ? 'running' : 'stopped'}`);

      this.emit('initialized', {
        modelsCount: this.models.size,
        ollamaRunning: this.isOllamaRunning
      });

    } catch (error) {
      console.error('❌ Failed to initialize Ollama LLM Manager:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check if Ollama is installed and running
   */
  private async checkOllamaStatus(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec('ollama --version', (error, stdout) => {
        if (error) {
          console.log('📦 Ollama not found, attempting to start...');
          this.startOllama().then(resolve).catch(reject);
        } else {
          console.log(`✅ Ollama found: ${stdout.trim()}`);
          this.isOllamaRunning = true;
          resolve();
        }
      });
    });
  }

  /**
   * Start Ollama service
   */
  private async startOllama(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting Ollama service...');
      
      const ollama = spawn('ollama', ['serve'], {
        stdio: 'pipe',
        detached: true
      });

      ollama.on('error', (error) => {
        console.error('Failed to start Ollama:', error);
        reject(error);
      });

      ollama.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Ollama service started');
          this.isOllamaRunning = true;
          resolve();
        } else {
          reject(new Error(`Ollama exited with code ${code}`));
        }
      });

      // Give it a moment to start
      setTimeout(() => {
        if (this.isOllamaRunning) {
          resolve();
        } else {
          reject(new Error('Ollama failed to start within timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Register default local models
   */
  private async registerDefaultModels(): Promise<void> {
    const defaultModels: OllamaModel[] = [
      {
        name: 'CodeLlama-7B',
        taskType: 'code',
        modelId: 'codellama:7b',
        size: '7B',
        isAvailable: false,
        priority: 1,
        capabilities: ['code_generation', 'code_analysis', 'debugging'],
        maxTokens: 16384,
        description: 'Specialized for code generation and analysis'
      },
      {
        name: 'Llama2-13B',
        taskType: 'reasoning',
        modelId: 'llama2:13b',
        size: '13B',
        isAvailable: false,
        priority: 2,
        capabilities: ['reasoning', 'analysis', 'comprehension'],
        maxTokens: 4096,
        description: 'General reasoning and analysis tasks'
      },
      {
        name: 'Mistral-7B',
        taskType: 'analysis',
        modelId: 'mistral:7b',
        size: '7B',
        isAvailable: false,
        priority: 3,
        capabilities: ['text_analysis', 'summarization', 'classification'],
        maxTokens: 8192,
        description: 'Fast and efficient text analysis'
      },
      {
        name: 'Vicuna-13B',
        taskType: 'creative',
        modelId: 'vicuna:13b',
        size: '13B',
        isAvailable: false,
        priority: 4,
        capabilities: ['creative_writing', 'content_generation', 'dialogue'],
        maxTokens: 4096,
        description: 'Creative content generation and dialogue'
      },
      {
        name: 'Deepseek-Coder-6.7B',
        taskType: 'security',
        modelId: 'deepseek-coder:6.7b',
        size: '6.7B',
        isAvailable: false,
        priority: 5,
        capabilities: ['security_analysis', 'vulnerability_detection', 'code_review'],
        maxTokens: 16384,
        description: 'Specialized for security and vulnerability analysis'
      }
    ];

    // Check which models are available
    for (const model of defaultModels) {
      const isAvailable = await this.checkModelAvailability(model.modelId);
      model.isAvailable = isAvailable;
      this.models.set(model.name, model);
      
      if (isAvailable) {
        console.log(`✅ Model available: ${model.name} (${model.modelId})`);
      } else {
        console.log(`📥 Model not installed: ${model.name} (${model.modelId})`);
      }
    }
  }

  /**
   * Check if a model is available in Ollama
   */
  private async checkModelAvailability(modelId: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(`ollama list | grep "${modelId}"`, (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Ensure learning data directory exists
   */
  private ensureLearningDirectory(): void {
    const learningPath = path.join(this.config.modelsPath || './models', 'learning_data');
    if (!fs.existsSync(learningPath)) {
      fs.mkdirSync(learningPath, { recursive: true });
    }
  }

  /**
   * Execute request with appropriate local model
   */
  async executeRequest(taskType: string, prompt: string, options: any = {}): Promise<any> {
    if (!this.isOllamaRunning) {
      throw new Error('Ollama is not running');
    }

    // Select best model for the task
    const model = this.selectBestModel(taskType);
    if (!model) {
      throw new Error(`No suitable model found for task type: ${taskType}`);
    }

    if (!model.isAvailable) {
      // Try to pull the model
      await this.pullModel(model.modelId);
      model.isAvailable = true;
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      console.log(`🦙 Executing with ${model.name}...`);

      const request: OllamaRequest = {
        model: model.modelId,
        prompt,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || model.maxTokens,
          stream: false
        }
      };

      const response = await this.callOllama(request);
      const executionTime = Date.now() - startTime;

      // Update statistics
      this.updateStats(model.name, true);

      // Log for learning
      await this.logForLearning(model.name, taskType, prompt, response, executionTime);

      const result = {
        success: true,
        model: model.name,
        modelId: model.modelId,
        response: response.response,
        executionTime,
        confidence: this.calculateConfidence(response),
        taskType,
        requestId,
        metadata: {
          total_duration: response.total_duration,
          prompt_eval_count: response.prompt_eval_count,
          eval_count: response.eval_count
        }
      };

      console.log(`✅ ${model.name} execution completed in ${executionTime}ms`);
      this.emit('requestCompleted', { request, response: result });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats(model.name, false);

      const result = {
        success: false,
        model: model.name,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        taskType,
        requestId
      };

      console.error(`❌ ${model.name} execution failed:`, error);
      this.emit('requestFailed', { request, response: result });

      throw error;
    }
  }

  /**
   * Select best model for task type
   */
  private selectBestModel(taskType: string): OllamaModel | null {
    const availableModels = Array.from(this.models.values())
      .filter(model => model.isAvailable && model.taskType === taskType)
      .sort((a, b) => a.priority - b.priority);

    if (availableModels.length > 0) {
      return availableModels[0];
    }

    // Fallback to models with matching capabilities
    const fallbackModels = Array.from(this.models.values())
      .filter(model => model.isAvailable && model.capabilities.includes(taskType))
      .sort((a, b) => a.priority - b.priority);

    return fallbackModels.length > 0 ? fallbackModels[0] : null;
  }

  /**
   * Pull model from Ollama
   */
  private async pullModel(modelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`📥 Pulling model ${modelId}...`);
      
      const pull = spawn('ollama', ['pull', modelId], {
        stdio: 'pipe'
      });

      pull.on('error', reject);
      pull.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Model ${modelId} pulled successfully`);
          resolve();
        } else {
          reject(new Error(`Failed to pull model ${modelId}`));
        }
      });

      // Set timeout
      setTimeout(() => {
        pull.kill();
        reject(new Error(`Model pull timeout for ${modelId}`));
      }, 300000); // 5 minutes
    });
  }

  /**
   * Call Ollama API
   */
  private async callOllama(request: OllamaRequest): Promise<OllamaResponse> {
    return new Promise((resolve, reject) => {
      const ollama = spawn('ollama', ['run', request.model], {
        stdio: 'pipe',
        input: Buffer.from(request.prompt + '\n')
      });

      let output = '';
      let errorOutput = '';

      ollama.stdout.on('data', (data) => {
        output += data.toString();
      });

      ollama.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ollama.on('close', (code) => {
        if (code === 0) {
          resolve({
            model: request.model,
            response: output.trim(),
            done: true
          });
        } else {
          reject(new Error(`Ollama error: ${errorOutput}`));
        }
      });

      ollama.on('error', reject);

      // Set timeout
      setTimeout(() => {
        ollama.kill();
        reject(new Error('Ollama request timeout'));
      }, this.config.timeoutMs || 60000);
    });
  }

  /**
   * Calculate confidence score from response
   */
  private calculateConfidence(response: OllamaResponse): number {
    // Base confidence on response quality
    let confidence = 0.7; // Base score

    // Length bonus (reasonable length responses)
    const responseLength = response.response.length;
    if (responseLength > 50 && responseLength < 2000) {
      confidence += 0.1;
    }

    // Completion bonus
    if (response.done) {
      confidence += 0.1;
    }

    // Token count bonus
    if (response.eval_count && response.eval_count > 0) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Log execution for learning
   */
  private async logForLearning(modelName: string, taskType: string, prompt: string, response: OllamaResponse, executionTime: number): Promise<void> {
    try {
      const learningPath = path.join(this.config.modelsPath || './models', 'learning_data');
      const logFile = path.join(learningPath, 'ollama_learning.jsonl');
      
      const entry = {
        modelName,
        modelId: response.model,
        taskType,
        prompt,
        response: response.response,
        executionTime,
        timestamp: new Date().toISOString(),
        confidence: this.calculateConfidence(response),
        metadata: {
          total_duration: response.total_duration,
          prompt_eval_count: response.prompt_eval_count,
          eval_count: response.eval_count
        }
      };

      // Only log high-quality responses
      if (entry.confidence >= 0.6) {
        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
        
        // Store in memory for analysis
        if (!this.learningData.has(taskType)) {
          this.learningData.set(taskType, []);
        }
        this.learningData.get(taskType)!.push(entry);
        
        console.log(`📝 Logged learning entry for ${taskType} (confidence: ${entry.confidence.toFixed(2)})`);
      }
      
    } catch (error) {
      console.error('Failed to log for learning:', error);
    }
  }

  /**
   * Update execution statistics
   */
  private updateStats(modelName: string, success: boolean): void {
    const key = `${modelName}_${success ? 'success' : 'failure'}`;
    this.executionStats.set(key, (this.executionStats.get(key) || 0) + 1);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): Record<string, number> {
    return Object.fromEntries(this.executionStats);
  }

  /**
   * Get model status
   */
  getModelStatus(): OllamaModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get available models for task type
   */
  getModelsForTask(taskType: string): OllamaModel[] {
    return Array.from(this.models.values())
      .filter(model => model.isAvailable && (
        model.taskType === taskType || 
        model.capabilities.includes(taskType)
      ));
  }

  /**
   * Install missing models
   */
  async installMissingModels(): Promise<void> {
    console.log('📦 Installing missing models...');
    
    const missingModels = Array.from(this.models.values())
      .filter(model => !model.isAvailable);

    for (const model of missingModels) {
      try {
        console.log(`📥 Installing ${model.name}...`);
        await this.pullModel(model.modelId);
        model.isAvailable = true;
        console.log(`✅ ${model.name} installed successfully`);
      } catch (error) {
        console.error(`❌ Failed to install ${model.name}:`, error);
      }
    }
  }

  /**
   * Get learning data
   */
  getLearningData(taskType?: string): any[] {
    if (taskType) {
      return this.learningData.get(taskType) || [];
    }
    
    const allData: any[] = [];
    for (const data of this.learningData.values()) {
      allData.push(...data);
    }
    return allData;
  }

  /**
   * Get system status
   */
  getStatus(): any {
    const availableModels = Array.from(this.models.values()).filter(m => m.isAvailable);
    
    return {
      ollamaRunning: this.isOllamaRunning,
      totalModels: this.models.size,
      availableModels: availableModels.length,
      executionStats: this.getExecutionStats(),
      learningDataSize: this.getLearningData().length,
      config: this.config
    };
  }

  /**
   * Generate model performance report
   */
  generatePerformanceReport(): string {
    const stats = this.getExecutionStats();
    const models = this.getModelStatus();
    
    const report = `
# Ollama LLM Performance Report

## System Status
- Ollama Running: ${this.isOllamaRunning ? '✅ Yes' : '❌ No'}
- Total Models: ${this.models.size}
- Available Models: ${models.filter(m => m.isAvailable).length}
- Learning Entries: ${this.getLearningData().length}

## Model Performance
${models.map(model => {
  const success = stats[`${model.name}_success`] || 0;
  const failure = stats[`${model.name}_failure`] || 0;
  const total = success + failure;
  const successRate = total > 0 ? (success / total * 100).toFixed(1) : '0.0';
  
  return `- ${model.name}: ${success} success, ${failure} failure (${successRate}% success rate)`;
}).join('\n')}

## Task Distribution
${Array.from(this.learningData.entries()).map(([task, entries]) => 
  `- ${task}: ${entries.length} entries`
).join('\n')}

## Recommendations
${models.filter(m => !m.isAvailable).length > 0 
  ? '📥 Consider installing missing models for better task coverage' 
  : '✅ All models are installed and available'}

${this.getLearningData().length < 100 
  ? '📚 Generate more learning data to improve model performance' 
  : '📚 Good amount of learning data collected'}

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.config.modelsPath || './models', `performance_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Performance report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Shutdown Ollama LLM manager
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Ollama LLM Manager...');
    
    // Generate final report
    this.generatePerformanceReport();
    
    this.isOllamaRunning = false;
    
    this.emit('shutdown', { timestamp: new Date().toISOString() });
    
    console.log('✅ Ollama LLM Manager shutdown complete');
  }
}

export default OllamaLLMManager;
