/**
 * Local LLM Orchestrator for Acey
 * Uses Ollama to manage 3 different local models optimized for specific tasks
 * 
 * This orchestrator runs entirely on the local PC using Ollama
 * with no external API dependencies
 */

import { OllamaLLMManager, OllamaModel, LocalLLMConfig } from './ollamaLLM';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import path from 'path';

export interface LocalSkill {
  name: string;
  description: string;
  version: string;
  taskType: 'code' | 'analysis' | 'creative' | 'security' | 'reasoning';
  permissions: string[];
  trustLevel: number;
  isActive: boolean;
  preferredModel?: string;
}

export interface LocalRequest {
  skillName: string;
  input: any;
  context: any;
  constitutionalCheck: {
    permitted: boolean;
    reason?: string;
    trustLevel: number;
  };
  requestId: string;
  timestamp: string;
}

export interface LocalResponse {
  requestId: string;
  skillName: string;
  model: string;
  modelId: string;
  output: any;
  confidence: number;
  executionTime: number;
  success: boolean;
  error?: string;
  taskType: string;
  constitutionalCompliance: boolean;
  localProcessing: boolean;
}

export interface LocalOrchestratorConfig {
  ollamaPath?: string;
  modelsPath?: string;
  enableStreaming: boolean;
  maxConcurrency: number;
  timeoutMs: number;
  learningEnabled: boolean;
  qualityThreshold: number;
}

export class LocalOrchestrator extends EventEmitter {
  private ollamaManager: OllamaLLMManager;
  private skills: Map<string, LocalSkill> = new Map();
  private config: LocalOrchestratorConfig;
  private isInitialized: boolean = false;
  private executionStats: Map<string, number> = new Map();

  constructor(config: LocalOrchestratorConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the local orchestrator
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Local LLM Orchestrator...');

      // Initialize Ollama manager
      const ollamaConfig: LocalLLMConfig = {
        ollamaPath: this.config.ollamaPath,
        modelsPath: this.config.modelsPath,
        defaultModels: [], // Will be loaded by Ollama manager
        enableStreaming: this.config.enableStreaming,
        maxConcurrency: this.config.maxConcurrency,
        timeoutMs: this.config.timeoutMs
      };

      this.ollamaManager = new OllamaLLMManager(ollamaConfig);

      // Set up event listeners
      this.setupEventListeners();

      // Load skills
      await this.loadSkills();

      this.isInitialized = true;

      this.emit('initialized', {
        skillsCount: this.skills.size,
        config: this.config,
        modelsStatus: this.ollamaManager.getModelStatus()
      });

      console.log('✅ Local LLM Orchestrator initialized');
      console.log(`📊 Skills registered: ${this.skills.size}`);
      console.log(`🦙 Models available: ${this.ollamaManager.getModelStatus().filter(m => m.isAvailable).length}`);

    } catch (error) {
      console.error('❌ Failed to initialize Local Orchestrator:', error);
      this.emit('error', error);
    }
  }

  /**
   * Set up event listeners for Ollama manager
   */
  private setupEventListeners(): void {
    this.ollamaManager.on('requestCompleted', (data) => {
      this.emit('requestCompleted', data);
    });

    this.ollamaManager.on('requestFailed', (data) => {
      this.emit('requestFailed', data);
    });

    this.ollamaManager.on('error', (error: Error) => {
      console.error('Ollama manager error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Load skills with task type mappings
   */
  private async loadSkills(): Promise<void> {
    const localSkills: LocalSkill[] = [
      {
        name: 'CodeHelper',
        description: 'Assist with code analysis and generation',
        version: '1.0.0',
        taskType: 'code',
        permissions: ['analyze_code', 'suggest_tasks', 'generate_code'],
        trustLevel: 2,
        isActive: true,
        preferredModel: 'CodeLlama-7B'
      },
      {
        name: 'SecurityObserver',
        description: 'Monitor system security and integrity',
        version: '1.0.0',
        taskType: 'security',
        permissions: ['read_project_files', 'monitor_systems', 'create_alerts'],
        trustLevel: 2,
        isActive: true,
        preferredModel: 'Deepseek-Coder-6.7B'
      },
      {
        name: 'DataAnalyzer',
        description: 'Analyze data patterns and provide insights',
        version: '1.0.0',
        taskType: 'analysis',
        permissions: ['analyze_data', 'generate_insights'],
        trustLevel: 2,
        isActive: true,
        preferredModel: 'Mistral-7B'
      },
      {
        name: 'ContentCreator',
        description: 'Generate creative content and text',
        version: '1.0.0',
        taskType: 'creative',
        permissions: ['generate_content', 'create_text'],
        trustLevel: 2,
        isActive: true,
        preferredModel: 'Vicuna-13B'
      },
      {
        name: 'ReasoningEngine',
        description: 'Perform complex reasoning and analysis',
        version: '1.0.0',
        taskType: 'reasoning',
        permissions: ['reasoning', 'analysis', 'comprehension'],
        trustLevel: 3,
        isActive: true,
        preferredModel: 'Llama2-13B'
      },
      {
        name: 'LinkReview',
        description: 'Review and analyze external links',
        version: '1.0.0',
        taskType: 'analysis',
        permissions: ['send_network_requests', 'analyze_content'],
        trustLevel: 2,
        isActive: true,
        preferredModel: 'Mistral-7B'
      }
    ];

    for (const skill of localSkills) {
      this.skills.set(skill.name, skill);
      console.log(`📝 Registered skill: ${skill.name} → ${skill.preferredModel}`);
    }
  }

  /**
   * Execute skill through local LLM
   */
  async executeSkill(skillName: string, input: any, context: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Local Orchestrator not initialized');
    }

    const skill = this.skills.get(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    if (!skill.isActive) {
      throw new Error(`Skill ${skillName} is not active`);
    }

    // Check permissions
    if (!this.checkPermissions(skill, context.role || 'user')) {
      throw new Error(`Insufficient permissions for skill ${skillName}`);
    }

    // Create request
    const request: LocalRequest = {
      skillName,
      input,
      context,
      constitutionalCheck: await this.checkConstitutionalCompliance(skillName, input, context),
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    // Execute through local LLM
    const response = await this.executeWithLocalLLM(request, skill);

    // Update statistics
    this.updateStats(skillName, response.success);

    // Emit response
    this.emit('skillExecuted', { request, response });

    return response.output;
  }

  /**
   * Execute with local LLM through Ollama
   */
  private async executeWithLocalLLM(request: LocalRequest, skill: LocalSkill): Promise<LocalResponse> {
    const startTime = Date.now();

    try {
      console.log(`🦙 Executing ${skill.name} with ${skill.preferredModel}...`);

      // Format prompt for the skill
      const prompt = this.formatPromptForSkill(skill, request.input, request.context);

      // Execute with Ollama
      const ollamaResponse = await this.ollamaManager.executeRequest(
        skill.taskType,
        prompt,
        {
          temperature: this.getTemperatureForSkill(skill),
          max_tokens: this.getMaxTokensForSkill(skill)
        }
      );

      const executionTime = Date.now() - startTime;

      const response: LocalResponse = {
        requestId: request.requestId,
        skillName: skill.name,
        model: ollamaResponse.model,
        modelId: ollamaResponse.modelId,
        output: this.parseOutput(ollamaResponse.response),
        confidence: ollamaResponse.confidence,
        executionTime,
        success: true,
        taskType: skill.taskType,
        constitutionalCompliance: request.constitutionalCheck.permitted,
        localProcessing: true
      };

      console.log(`✅ ${skill.name} completed in ${executionTime}ms`);
      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;

      const response: LocalResponse = {
        requestId: request.requestId,
        skillName: skill.name,
        model: skill.preferredModel || 'unknown',
        modelId: 'unknown',
        output: null,
        confidence: 0,
        executionTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        taskType: skill.taskType,
        constitutionalCompliance: false,
        localProcessing: true
      };

      console.error(`❌ ${skill.name} failed:`, error);
      return response;
    }
  }

  /**
   * Format prompt for specific skill
   */
  private formatPromptForSkill(skill: LocalSkill, input: any, context: any): string {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    
    let prompt = `You are Acey's ${skill.name} skill. `;
    prompt += `Description: ${skill.description}. `;
    prompt += `Task type: ${skill.taskType}. `;
    prompt += `Trust level: ${skill.trustLevel}.\n\n`;
    
    prompt += `Input:\n${inputStr}\n\n`;
    
    if (context && Object.keys(context).length > 0) {
      prompt += `Context:\n${JSON.stringify(context, null, 2)}\n\n`;
    }
    
    prompt += `Instructions:\n`;
    prompt += `1. Follow constitutional laws and security guidelines\n`;
    prompt += `2. Provide clear, helpful responses\n`;
    prompt += `3. If action requires approval, clearly state this\n`;
    prompt += `4. Include confidence level in your response\n\n`;
    
    prompt += `Response:`;

    return prompt;
  }

  /**
   * Parse output from LLM response
   */
  private parseOutput(response: string): any {
    try {
      // Try to parse as JSON first
      return JSON.parse(response);
    } catch {
      // If not JSON, return as text with metadata
      return {
        type: 'text',
        content: response,
        timestamp: new Date().toISOString(),
        parsed: false
      };
    }
  }

  /**
   * Get temperature setting for skill
   */
  private getTemperatureForSkill(skill: LocalSkill): number {
    switch (skill.taskType) {
      case 'code':
      case 'security':
        return 0.1; // Low temperature for precise tasks
      case 'analysis':
      case 'reasoning':
        return 0.3; // Medium-low for analytical tasks
      case 'creative':
        return 0.8; // High temperature for creative tasks
      default:
        return 0.5; // Medium for general tasks
    }
  }

  /**
   * Get max tokens for skill
   */
  private getMaxTokensForSkill(skill: LocalSkill): number {
    switch (skill.taskType) {
      case 'code':
      case 'security':
        return 2048; // Shorter for code/security
      case 'analysis':
      case 'reasoning':
        return 4096; // Medium for analysis
      case 'creative':
        return 1024; // Shorter for creative
      default:
        return 2048;
    }
  }

  /**
   * Check constitutional compliance
   */
  private async checkConstitutionalCompliance(skillName: string, input: any, context: any): Promise<{
    permitted: boolean;
    reason?: string;
    trustLevel: number;
  }> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      return { permitted: false, reason: 'Skill not found', trustLevel: 0 };
    }

    const trustLevel = context.trustLevel || 2;
    const requiresApproval = ['delete_files', 'modify_system', 'execute_commands'].some(action => 
      JSON.stringify(input).includes(action)
    );

    if (requiresApproval && trustLevel < 3) {
      return {
        permitted: false,
        reason: 'Action requires higher trust level or explicit approval',
        trustLevel
      };
    }

    return {
      permitted: true,
      trustLevel
    };
  }

  /**
   * Check permissions
   */
  private checkPermissions(skill: LocalSkill, role: string): boolean {
    const rolePermissions: Record<string, number> = {
      'owner': 4,
      'admin': 3,
      'developer': 2,
      'user': 1
    };

    const roleLevel = rolePermissions[role] || 1;
    return roleLevel >= skill.trustLevel;
  }

  /**
   * Update execution statistics
   */
  private updateStats(skillName: string, success: boolean): void {
    const key = `${skillName}_${success ? 'success' : 'failure'}`;
    this.executionStats.set(key, (this.executionStats.get(key) || 0) + 1);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): Record<string, number> {
    return Object.fromEntries(this.executionStats);
  }

  /**
   * Get skill information
   */
  getSkillInfo(skillName: string): any {
    const skill = this.skills.get(skillName);
    if (!skill) {
      return null;
    }

    const stats = this.getExecutionStats();
    return {
      name: skill.name,
      description: skill.description,
      version: skill.version,
      taskType: skill.taskType,
      permissions: skill.permissions,
      trustLevel: skill.trustLevel,
      isActive: skill.isActive,
      preferredModel: skill.preferredModel,
      executionStats: {
        success: stats[`${skillName}_success`] || 0,
        failures: stats[`${skillName}_failure`] || 0,
        total: (stats[`${skillName}_success`] || 0) + (stats[`${skillName}_failure`] || 0)
      }
    };
  }

  /**
   * List all skills
   */
  listSkills(): LocalSkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get model status
   */
  getModelStatus(): OllamaModel[] {
    return this.ollamaManager.getModelStatus();
  }

  /**
   * Get models for task type
   */
  getModelsForTask(taskType: string): OllamaModel[] {
    return this.ollamaManager.getModelsForTask(taskType);
  }

  /**
   * Install missing models
   */
  async installMissingModels(): Promise<void> {
    await this.ollamaManager.installMissingModels();
  }

  /**
   * Get learning data
   */
  getLearningData(taskType?: string): any[] {
    return this.ollamaManager.getLearningData(taskType);
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    return this.ollamaManager.generatePerformanceReport();
  }

  /**
   * Enable/disable skill
   */
  setSkillActive(skillName: string, active: boolean): void {
    const skill = this.skills.get(skillName);
    if (skill) {
      skill.isActive = active;
      console.log(`🔄 Skill ${skillName} ${active ? 'enabled' : 'disabled'}`);
      this.emit('skillStatusChanged', { skillName, active });
    }
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      skillsCount: this.skills.size,
      activeSkills: Array.from(this.skills.values()).filter(skill => skill.isActive).length,
      executionStats: this.getExecutionStats(),
      modelsStatus: this.ollamaManager.getModelStatus(),
      ollamaStatus: this.ollamaManager.getStatus(),
      config: this.config
    };
  }

  /**
   * Shutdown the local orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Local LLM Orchestrator...');
    
    // Generate final report
    this.generatePerformanceReport();
    
    // Shutdown Ollama manager
    await this.ollamaManager.shutdown();
    
    this.isInitialized = false;
    
    this.emit('shutdown', { 
      timestamp: new Date().toISOString(),
      finalStats: this.getExecutionStats()
    });
    
    console.log('✅ Local LLM Orchestrator shutdown complete');
  }
}

export default LocalOrchestrator;
