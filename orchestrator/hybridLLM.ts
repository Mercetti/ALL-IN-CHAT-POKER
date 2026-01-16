/**
 * Hybrid LLM Orchestrator for Acey
 * Bridges external LLM usage with future self-hosted capabilities
 * 
 * This orchestrator manages the transition from external LLMs to self-hosted models
 * while maintaining constitutional compliance and continuous learning
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface LLMProvider {
  name: string;
  type: 'external' | 'self_hosted' | 'hybrid';
  isAvailable: boolean;
  priority: number; // Lower number = higher priority
  capabilities: string[];
  costPerRequest?: number;
  maxTokens?: number;
}

export interface LLMRequest {
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

export interface LLMResponse {
  requestId: string;
  provider: string;
  output: any;
  confidence: number;
  executionTime: number;
  success: boolean;
  error?: string;
  constitutionalCompliance: boolean;
  quality: number;
  cost?: number;
}

export interface HybridConfig {
  modelPath?: string;
  externalProviders: LLMProvider[];
  selfHostEnabled: boolean;
  fallbackEnabled: boolean;
  learningEnabled: boolean;
  costOptimization: boolean;
  qualityThreshold: number;
  maxRetries: number;
}

export class HybridLLMOrchestrator extends EventEmitter {
  private config: HybridConfig;
  private providers: Map<string, LLMProvider> = new Map();
  private requestQueue: LLMRequest[] = [];
  private activeRequests: Map<string, Promise<LLMResponse>> = new Map();
  private executionStats: Map<string, number> = new Map();
  private learningData: Map<string, LLMResponse[]> = new Map();
  private isInitialized: boolean = false;

  constructor(config: HybridConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the hybrid LLM orchestrator
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Hybrid LLM Orchestrator...');

      // Register providers
      await this.registerProviders();

      // Create learning data directory
      this.ensureLearningDirectory();

      this.isInitialized = true;

      this.emit('initialized', {
        providersCount: this.providers.size,
        config: this.config
      });

      console.log('✅ Hybrid LLM Orchestrator initialized');
      console.log(`📊 Registered providers: ${this.providers.size}`);
      console.log(`🧠 Self-host enabled: ${this.config.selfHostEnabled}`);
      console.log(`📚 Learning enabled: ${this.config.learningEnabled}`);

    } catch (error) {
      console.error('❌ Failed to initialize Hybrid LLM Orchestrator:', error);
      this.emit('error', error);
    }
  }

  /**
   * Register LLM providers
   */
  private async registerProviders(): Promise<void> {
    // External providers (current usage)
    const externalProviders: LLMProvider[] = [
      {
        name: 'OpenAI-GPT4',
        type: 'external',
        isAvailable: true,
        priority: 1,
        capabilities: ['text_generation', 'code_generation', 'analysis'],
        costPerRequest: 0.03,
        maxTokens: 8192
      },
      {
        name: 'Anthropic-Claude',
        type: 'external',
        isAvailable: true,
        priority: 2,
        capabilities: ['text_generation', 'analysis', 'reasoning'],
        costPerRequest: 0.015,
        maxTokens: 100000
      },
      {
        name: 'Google-Gemini',
        type: 'external',
        isAvailable: true,
        priority: 3,
        capabilities: ['text_generation', 'multimodal', 'analysis'],
        costPerRequest: 0.0025,
        maxTokens: 32768
      }
    ];

    // Self-hosted provider (future capability)
    if (this.config.selfHostEnabled) {
      const selfHostProvider: LLMProvider = {
        name: 'Acey-SelfHost',
        type: 'self_hosted',
        isAvailable: false, // Will be enabled when model is ready
        priority: 0, // Highest priority when available
        capabilities: ['all'],
        costPerRequest: 0, // Free when self-hosted
        maxTokens: 32768
      };
      externalProviders.push(selfHostProvider);
    }

    // Add configured external providers
    for (const provider of [...externalProviders, ...this.config.externalProviders]) {
      this.providers.set(provider.name, provider);
    }

    console.log(`📝 Registered ${this.providers.size} LLM providers`);
  }

  /**
   * Ensure learning data directory exists
   */
  private ensureLearningDirectory(): void {
    const learningPath = path.join(this.config.modelPath || './models', 'learning_data');
    if (!fs.existsSync(learningPath)) {
      fs.mkdirSync(learningPath, { recursive: true });
    }
  }

  /**
   * Execute request through hybrid LLM system
   */
  async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('Hybrid LLM Orchestrator not initialized');
    }

    // Constitutional compliance check
    if (!request.constitutionalCheck.permitted) {
      throw new Error(`Constitutional violation: ${request.constitutionalCheck.reason}`);
    }

    // Add to queue
    this.requestQueue.push(request);

    try {
      // Select best provider
      const provider = await this.selectBestProvider(request);
      
      if (!provider) {
        throw new Error('No suitable LLM provider available');
      }

      // Execute with selected provider
      const response = await this.executeWithProvider(request, provider);

      // Log for learning if enabled
      if (this.config.learningEnabled && response.success) {
        await this.logForLearning(request, response);
      }

      // Update statistics
      this.updateStats(provider.name, response.success);

      // Emit response
      this.emit('requestCompleted', { request, response });

      return response;

    } finally {
      // Remove from queue
      const index = this.requestQueue.indexOf(request);
      if (index > -1) {
        this.requestQueue.splice(index, 1);
      }
    }
  }

  /**
   * Select best provider for the request
   */
  private async selectBestProvider(request: LLMRequest): Promise<LLMProvider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => provider.isAvailable)
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      return null;
    }

    // If self-hosted is available and capable, use it
    const selfHosted = availableProviders.find(p => p.type === 'self_hosted');
    if (selfHosted && this.canHandleRequest(selfHosted, request)) {
      return selfHosted;
    }

    // Select best external provider based on capabilities and cost
    const capableProviders = availableProviders.filter(p => 
      p.type === 'external' && this.canHandleRequest(p, request)
    );

    if (capableProviders.length === 0) {
      return null;
    }

    // Cost optimization: choose cheapest capable provider
    if (this.config.costOptimization) {
      return capableProviders.reduce((best, current) => 
        (current.costPerRequest || 0) < (best.costPerRequest || 0) ? current : best
      );
    }

    // Default: highest priority
    return capableProviders[0];
  }

  /**
   * Check if provider can handle the request
   */
  private canHandleRequest(provider: LLMProvider, request: LLMRequest): boolean {
    // Check capabilities
    if (!provider.capabilities.includes('all')) {
      const requiredCapabilities = this.getRequiredCapabilities(request);
      const hasAllCapabilities = requiredCapabilities.every(cap => 
        provider.capabilities.includes(cap)
      );
      if (!hasAllCapabilities) return false;
    }

    // Check token limits
    const estimatedTokens = this.estimateTokens(request.input);
    if (provider.maxTokens && estimatedTokens > provider.maxTokens) {
      return false;
    }

    return true;
  }

  /**
   * Get required capabilities for a request
   */
  private getRequiredCapabilities(request: LLMRequest): string[] {
    const capabilities = ['text_generation'];
    
    // Add specific capabilities based on skill
    if (request.skillName.includes('Code')) {
      capabilities.push('code_generation');
    }
    if (request.skillName.includes('Graphics') || request.skillName.includes('Audio')) {
      capabilities.push('multimodal');
    }
    if (request.skillName.includes('Security') || request.skillName.includes('Analysis')) {
      capabilities.push('analysis');
    }
    
    return capabilities;
  }

  /**
   * Estimate token count for input
   */
  private estimateTokens(input: any): number {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Execute request with specific provider
   */
  private async executeWithProvider(request: LLMRequest, provider: LLMProvider): Promise<LLMResponse> {
    const startTime = Date.now();
    const requestId = request.requestId;

    try {
      console.log(`🎯 Executing ${request.skillName} with ${provider.name}`);

      let output: any;
      let confidence: number;
      let cost: number | undefined;

      switch (provider.type) {
        case 'self_hosted':
          // Future: Execute with self-hosted model
          output = await this.executeWithSelfHost(request);
          confidence = 0.9; // Higher confidence for self-hosted
          cost = 0;
          break;

        case 'external':
          // Current: Execute with external API
          const result = await this.executeWithExternal(request, provider);
          output = result.output;
          confidence = result.confidence;
          cost = provider.costPerRequest;
          break;

        default:
          throw new Error(`Unknown provider type: ${provider.type}`);
      }

      const executionTime = Date.now() - startTime;
      const quality = this.calculateQuality(output, confidence, executionTime);

      const response: LLMResponse = {
        requestId,
        provider: provider.name,
        output,
        confidence,
        executionTime,
        success: true,
        constitutionalCompliance: true,
        quality,
        cost
      };

      console.log(`✅ ${provider.name} execution completed in ${executionTime}ms`);
      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const response: LLMResponse = {
        requestId,
        provider: provider.name,
        output: null,
        confidence: 0,
        executionTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        constitutionalCompliance: false,
        quality: 0
      };

      console.error(`❌ ${provider.name} execution failed:`, error);
      return response;
    }
  }

  /**
   * Execute with self-hosted model (placeholder for future)
   */
  private async executeWithSelfHost(request: LLMRequest): Promise<any> {
    // This is a placeholder for future self-hosted execution
    // For now, simulate self-hosted behavior
    
    console.log('🧠 Simulating self-hosted execution...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return {
      success: true,
      result: `Self-hosted execution of ${request.skillName}`,
      model: 'acey-self-host-v1',
      processingTime: Date.now(),
      confidence: 0.85 + Math.random() * 0.15
    };
  }

  /**
   * Execute with external API (current implementation)
   */
  private async executeWithExternal(request: LLMRequest, provider: LLMProvider): Promise<{
    output: any;
    confidence: number;
  }> {
    // This is a placeholder for external API calls
    // In production, this would make actual API calls to OpenAI, Claude, etc.
    
    console.log(`🌐 Simulating ${provider.name} execution...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // Simulate different behavior based on provider
    let confidence: number;
    let output: any;
    
    switch (provider.name) {
      case 'OpenAI-GPT4':
        confidence = 0.88 + Math.random() * 0.12;
        output = {
          success: true,
          result: `OpenAI GPT-4 execution of ${request.skillName}`,
          model: 'gpt-4',
          tokens: this.estimateTokens(request.input)
        };
        break;
        
      case 'Anthropic-Claude':
        confidence = 0.85 + Math.random() * 0.15;
        output = {
          success: true,
          result: `Claude execution of ${request.skillName}`,
          model: 'claude-3-sonnet',
          reasoning: 'detailed analysis provided'
        };
        break;
        
      case 'Google-Gemini':
        confidence = 0.82 + Math.random() * 0.18;
        output = {
          success: true,
          result: `Gemini execution of ${request.skillName}`,
          model: 'gemini-pro',
          multimodal: true
        };
        break;
        
      default:
        confidence = 0.8 + Math.random() * 0.2;
        output = {
          success: true,
          result: `${provider.name} execution of ${request.skillName}`
        };
    }
    
    return { output, confidence };
  }

  /**
   * Calculate quality score for response
   */
  private calculateQuality(output: any, confidence: number, executionTime: number): number {
    let quality = 0.5; // Base score
    
    // Success bonus
    if (output && output.success) {
      quality += 0.3;
    }
    
    // Confidence bonus
    quality += (confidence - 0.5) * 0.3;
    
    // Execution time bonus (faster is better)
    if (executionTime < 1000) {
      quality += 0.1;
    } else if (executionTime > 5000) {
      quality -= 0.1;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Log response for learning
   */
  private async logForLearning(request: LLMRequest, response: LLMResponse): Promise<void> {
    try {
      const learningPath = path.join(this.config.modelPath || './models', 'learning_data');
      const logFile = path.join(learningPath, 'hybrid_learning.jsonl');
      
      const entry = {
        request,
        response,
        timestamp: new Date().toISOString(),
        learningType: response.provider.includes('SelfHost') ? 'self_host' : 'external'
      };
      
      // Only log high-quality responses
      if (response.quality >= this.config.qualityThreshold) {
        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
        
        // Also store in memory for analysis
        if (!this.learningData.has(request.skillName)) {
          this.learningData.set(request.skillName, []);
        }
        this.learningData.get(request.skillName)!.push(response);
        
        console.log(`📝 Logged learning entry for ${request.skillName} (quality: ${response.quality.toFixed(2)})`);
      }
      
    } catch (error) {
      console.error('Failed to log for learning:', error);
    }
  }

  /**
   * Update execution statistics
   */
  private updateStats(providerName: string, success: boolean): void {
    const key = `${providerName}_${success ? 'success' : 'failure'}`;
    this.executionStats.set(key, (this.executionStats.get(key) || 0) + 1);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): Record<string, number> {
    return Object.fromEntries(this.executionStats);
  }

  /**
   * Get provider status
   */
  getProviderStatus(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Enable/disable self-hosted model
   */
  setSelfHostEnabled(enabled: boolean): void {
    this.config.selfHostEnabled = enabled;
    
    const selfHostProvider = this.providers.get('Acey-SelfHost');
    if (selfHostProvider) {
      selfHostProvider.isAvailable = enabled;
    }
    
    console.log(`🧠 Self-hosted model ${enabled ? 'enabled' : 'disabled'}`);
    this.emit('selfHostStatusChanged', { enabled });
  }

  /**
   * Add external provider
   */
  addExternalProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`📝 Added external provider: ${provider.name}`);
    this.emit('providerAdded', provider);
  }

  /**
   * Remove provider
   */
  removeProvider(providerName: string): void {
    this.providers.delete(providerName);
    console.log(`🗑️ Removed provider: ${providerName}`);
    this.emit('providerRemoved', providerName);
  }

  /**
   * Get learning data for analysis
   */
  getLearningData(skillName?: string): LLMResponse[] {
    if (skillName) {
      return this.learningData.get(skillName) || [];
    }
    
    const allData: LLMResponse[] = [];
    for (const data of this.learningData.values()) {
      allData.push(...data);
    }
    return allData;
  }

  /**
   * Get cost analysis
   */
  getCostAnalysis(): {
    totalCost: number;
    costByProvider: Record<string, number>;
    savingsFromSelfHost: number;
  } {
    let totalCost = 0;
    const costByProvider: Record<string, number> = {};
    let selfHostRequests = 0;
    let externalRequests = 0;

    for (const [key, count] of this.executionStats) {
      const [provider, type] = key.split('_');
      
      if (type === 'success') {
        const providerInfo = this.providers.get(provider);
        if (providerInfo && providerInfo.costPerRequest) {
          const cost = count * providerInfo.costPerRequest;
          totalCost += cost;
          costByProvider[provider] = (costByProvider[provider] || 0) + cost;
          
          if (provider.includes('SelfHost')) {
            selfHostRequests += count;
          } else {
            externalRequests += count;
          }
        }
      }
    }

    // Calculate potential savings
    const avgExternalCost = externalRequests > 0 ? totalCost / externalRequests : 0;
    const savingsFromSelfHost = selfHostRequests * avgExternalCost;

    return {
      totalCost,
      costByProvider,
      savingsFromSelfHost
    };
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      providersCount: this.providers.size,
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      config: this.config,
      executionStats: this.getExecutionStats(),
      costAnalysis: this.getCostAnalysis(),
      learningDataSize: this.getLearningData().length
    };
  }

  /**
   * Generate transition report
   */
  generateTransitionReport(): string {
    const stats = this.getStatus();
    const costAnalysis = this.getCostAnalysis();
    
    const report = `
# Acey LLM Transition Report

## Current Status
- Total Providers: ${stats.providersCount}
- Self-Host Enabled: ${this.config.selfHostEnabled}
- Learning Enabled: ${this.config.learningEnabled}
- Queue Length: ${stats.queueLength}

## Execution Statistics
${Object.entries(stats.executionStats)
  .map(([key, count]) => `- ${key}: ${count}`)
  .join('\n')}

## Cost Analysis
- Total Cost: $${costAnalysis.totalCost.toFixed(4)}
- Savings from Self-Host: $${costAnalysis.savingsFromSelfHost.toFixed(4)}
- Cost by Provider:
${Object.entries(costAnalysis.costByProvider)
  .map(([provider, cost]) => `  - ${provider}: $${cost.toFixed(4)}`)
  .join('\n')}

## Learning Progress
- Learning Entries: ${stats.learningDataSize}
- Quality Threshold: ${this.config.qualityThreshold}

## Transition Recommendations
${this.config.selfHostEnabled 
  ? '✅ Self-hosted model is enabled and ready for training'
  : '🔄 Enable self-hosted model to begin transition'}

## Next Steps
1. Continue collecting high-quality training data
2. Monitor cost savings as self-hosted usage increases
3. Gradually increase self-hosted model usage
4. Phase out external providers as confidence grows

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.config.modelPath || './models', `transition_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Transition report generated: ${reportPath}`);
    return reportPath;
  }
}

export default HybridLLMOrchestrator;
