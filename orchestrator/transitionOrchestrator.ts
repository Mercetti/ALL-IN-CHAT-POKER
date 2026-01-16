/**
 * Transition Orchestrator for Acey
 * Manages the transition from external LLMs to self-hosted capabilities
 * 
 * This orchestrator bridges current external LLM usage with future self-hosted models
 * while maintaining constitutional compliance and collecting training data
 */

import { HybridLLMOrchestrator, LLMProvider, LLMRequest, LLMResponse } from './hybridLLM';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface TransitionConfig {
  modelPath?: string;
  externalProviders: LLMProvider[];
  selfHostEnabled: boolean;
  learningEnabled: boolean;
  costOptimization: boolean;
  qualityThreshold: number;
  transitionMode: 'conservative' | 'balanced' | 'aggressive';
  maxSelfHostPercentage: number; // Max % of requests to route to self-host
}

export interface Skill {
  name: string;
  description: string;
  version: string;
  permissions: string[];
  trustLevel: number;
  execute: (input: any, context: any) => Promise<any>;
  isActive: boolean;
  preferredProvider?: string;
}

export interface TransitionMetrics {
  totalRequests: number;
  selfHostRequests: number;
  externalRequests: number;
  selfHostSuccessRate: number;
  externalSuccessRate: number;
  costSavings: number;
  learningDataCollected: number;
  transitionProgress: number; // 0-100%
}

export class TransitionOrchestrator extends EventEmitter {
  private hybridLLM: HybridLLMOrchestrator;
  private skills: Map<string, Skill> = new Map();
  private config: TransitionConfig;
  private isInitialized: boolean = false;
  private metrics: TransitionMetrics;
  private transitionHistory: LLMResponse[] = [];

  constructor(config: TransitionConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.initialize();
  }

  /**
   * Initialize the transition orchestrator
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Transition Orchestrator...');

      // Initialize hybrid LLM
      this.hybridLLM = new HybridLLMOrchestrator({
        modelPath: this.config.modelPath,
        externalProviders: this.config.externalProviders,
        selfHostEnabled: this.config.selfHostEnabled,
        fallbackEnabled: true,
        learningEnabled: this.config.learningEnabled,
        costOptimization: this.config.costOptimization,
        qualityThreshold: this.config.qualityThreshold,
        maxRetries: 3
      });

      // Set up event listeners
      this.setupEventListeners();

      // Load existing skills
      await this.loadSkills();

      this.isInitialized = true;

      this.emit('initialized', {
        skillsCount: this.skills.size,
        config: this.config,
        metrics: this.metrics
      });

      console.log('✅ Transition Orchestrator initialized');
      console.log(`📊 Skills registered: ${this.skills.size}`);
      console.log(`🧠 Self-host enabled: ${this.config.selfHostEnabled}`);
      console.log(`📚 Learning enabled: ${this.config.learningEnabled}`);
      console.log(`⚖️ Transition mode: ${this.config.transitionMode}`);

    } catch (error) {
      console.error('❌ Failed to initialize Transition Orchestrator:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): TransitionMetrics {
    return {
      totalRequests: 0,
      selfHostRequests: 0,
      externalRequests: 0,
      selfHostSuccessRate: 0,
      externalSuccessRate: 0,
      costSavings: 0,
      learningDataCollected: 0,
      transitionProgress: 0
    };
  }

  /**
   * Set up event listeners for hybrid LLM
   */
  private setupEventListeners(): void {
    this.hybridLLM.on('requestCompleted', (data: { request: LLMRequest; response: LLMResponse }) => {
      this.handleRequestCompleted(data.request, data.response);
    });

    this.hybridLLM.on('selfHostStatusChanged', (data: { enabled: boolean }) => {
      console.log(`🔄 Self-host status changed: ${data.enabled}`);
      this.emit('selfHostStatusChanged', data);
    });

    this.hybridLLM.on('providerAdded', (provider: LLMProvider) => {
      console.log(`📝 Provider added: ${provider.name}`);
      this.emit('providerAdded', provider);
    });

    this.hybridLLM.on('error', (error: Error) => {
      console.error('Hybrid LLM error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Load existing skills
   */
  private async loadSkills(): Promise<void> {
    // Core skills with preferred providers
    const coreSkills: Partial<Skill>[] = [
      {
        name: 'SecurityObserver',
        description: 'Monitor system security and integrity',
        version: '1.0.0',
        permissions: ['read_project_files', 'monitor_systems', 'create_alerts'],
        trustLevel: 2,
        isActive: true,
        preferredProvider: 'Acey-SelfHost' // Prefer self-hosted for security
      },
      {
        name: 'FileTools',
        description: 'Handle file operations and security scanning',
        version: '1.0.0',
        permissions: ['create_temp_files', 'create_archives', 'scan_files_security'],
        trustLevel: 3,
        isActive: true,
        preferredProvider: 'OpenAI-GPT4' // Prefer external for file operations
      },
      {
        name: 'CodeHelper',
        description: 'Assist with code analysis and suggestions',
        version: '1.0.0',
        permissions: ['analyze_code', 'suggest_tasks'],
        trustLevel: 2,
        isActive: true,
        preferredProvider: 'Anthropic-Claude' // Prefer Claude for code
      },
      {
        name: 'GraphicsWizard',
        description: 'Generate and manipulate graphics',
        version: '1.0.0',
        permissions: ['generate_content', 'create_temp_files'],
        trustLevel: 2,
        isActive: true,
        preferredProvider: 'Google-Gemini' // Prefer Gemini for multimodal
      },
      {
        name: 'AudioMaestro',
        description: 'Process and generate audio content',
        version: '1.0.0',
        permissions: ['generate_content', 'create_temp_files'],
        trustLevel: 2,
        isActive: true,
        preferredProvider: 'OpenAI-GPT4' // Prefer GPT-4 for audio
      },
      {
        name: 'LinkReview',
        description: 'Review and analyze external links',
        version: '1.0.0',
        permissions: ['send_network_requests', 'analyze_content'],
        trustLevel: 2,
        isActive: true,
        preferredProvider: 'Anthropic-Claude' // Prefer Claude for analysis
      }
    ];

    // Register skills
    for (const skillData of coreSkills) {
      const skill: Skill = {
        ...skillData,
        execute: async (input: any, context: any) => {
          return await this.executeSkillThroughHybrid(skillData.name!, input, context);
        }
      } as Skill;

      this.registerSkill(skill.name!, skill);
    }
  }

  /**
   * Register a skill
   */
  registerSkill(name: string, skill: Skill): void {
    this.skills.set(name, skill);
    console.log(`📝 Registered skill: ${name} v${skill.version}`);
    this.emit('skillRegistered', { name, skill });
  }

  /**
   * Get a skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * List all skills
   */
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Execute skill through hybrid LLM system
   */
  async executeSkill(skillName: string, input: any, context: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Transition Orchestrator not initialized');
    }

    const skill = this.getSkill(skillName);
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

    return await skill.execute(input, context);
  }

  /**
   * Execute skill through hybrid LLM
   */
  private async executeSkillThroughHybrid(skillName: string, input: any, context: any): Promise<any> {
    // Create LLM request
    const request: LLMRequest = {
      skillName,
      input,
      context,
      constitutionalCheck: await this.checkConstitutionalCompliance(skillName, input, context),
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    // Execute through hybrid LLM
    const response = await this.hybridLLM.executeRequest(request);

    // Return the output
    return response.output;
  }

  /**
   * Check constitutional compliance
   */
  private async checkConstitutionalCompliance(skillName: string, input: any, context: any): Promise<{
    permitted: boolean;
    reason?: string;
    trustLevel: number;
  }> {
    const skill = this.getSkill(skillName);
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
  private checkPermissions(skill: Skill, role: string): boolean {
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
   * Handle completed request
   */
  private handleRequestCompleted(request: LLMRequest, response: LLMResponse): void {
    // Update metrics
    this.metrics.totalRequests++;
    
    if (response.provider.includes('SelfHost')) {
      this.metrics.selfHostRequests++;
    } else {
      this.metrics.externalRequests++;
    }

    // Add to transition history
    this.transitionHistory.push(response);

    // Keep history manageable
    if (this.transitionHistory.length > 1000) {
      this.transitionHistory = this.transitionHistory.slice(-500);
    }

    // Update transition progress
    this.updateTransitionProgress();

    // Emit event
    this.emit('requestCompleted', { request, response, metrics: this.metrics });
  }

  /**
   * Update transition progress
   */
  private updateTransitionProgress(): void {
    if (this.metrics.totalRequests === 0) {
      this.metrics.transitionProgress = 0;
      return;
    }

    const selfHostPercentage = (this.metrics.selfHostRequests / this.metrics.totalRequests) * 100;
    
    // Calculate progress based on transition mode
    switch (this.config.transitionMode) {
      case 'conservative':
        this.metrics.transitionProgress = Math.min(50, selfHostPercentage);
        break;
      case 'balanced':
        this.metrics.transitionProgress = Math.min(75, selfHostPercentage * 1.5);
        break;
      case 'aggressive':
        this.metrics.transitionProgress = Math.min(100, selfHostPercentage * 2);
        break;
    }

    // Cap at configured maximum
    this.metrics.transitionProgress = Math.min(this.metrics.transitionProgress, this.config.maxSelfHostPercentage);
  }

  /**
   * Get transition metrics
   */
  getTransitionMetrics(): TransitionMetrics {
    // Update success rates
    const stats = this.hybridLLM.getExecutionStats();
    
    const selfHostSuccess = stats['Acey-SelfHost_success'] || 0;
    const selfHostFailure = stats['Acey-SelfHost_failure'] || 0;
    const selfHostTotal = selfHostSuccess + selfHostFailure;
    
    const externalSuccess = Object.entries(stats)
      .filter(([key]) => !key.includes('SelfHost') && key.endsWith('_success'))
      .reduce((sum, [, count]) => sum + count, 0);
    const externalFailure = Object.entries(stats)
      .filter(([key]) => !key.includes('SelfHost') && key.endsWith('_failure'))
      .reduce((sum, [, count]) => sum + count, 0);
    const externalTotal = externalSuccess + externalFailure;

    this.metrics.selfHostSuccessRate = selfHostTotal > 0 ? selfHostSuccess / selfHostTotal : 0;
    this.metrics.externalSuccessRate = externalTotal > 0 ? externalSuccess / externalTotal : 0;

    // Update cost savings
    const costAnalysis = this.hybridLLM.getCostAnalysis();
    this.metrics.costSavings = costAnalysis.savingsFromSelfHost;

    // Update learning data collected
    this.metrics.learningDataCollected = this.hybridLLM.getLearningData().length;

    return { ...this.metrics };
  }

  /**
   * Enable/disable self-hosted model
   */
  setSelfHostEnabled(enabled: boolean): void {
    this.config.selfHostEnabled = enabled;
    this.hybridLLM.setSelfHostEnabled(enabled);
  }

  /**
   * Adjust transition mode
   */
  setTransitionMode(mode: 'conservative' | 'balanced' | 'aggressive'): void {
    this.config.transitionMode = mode;
    console.log(`⚖️ Transition mode changed to: ${mode}`);
    this.emit('transitionModeChanged', { mode });
  }

  /**
   * Adjust maximum self-host percentage
   */
  setMaxSelfHostPercentage(percentage: number): void {
    this.config.maxSelfHostPercentage = Math.max(0, Math.min(100, percentage));
    console.log(`📊 Max self-host percentage set to: ${this.config.maxSelfHostPercentage}%`);
    this.emit('maxSelfHostPercentageChanged', { percentage });
  }

  /**
   * Get provider status
   */
  getProviderStatus(): LLMProvider[] {
    return this.hybridLLM.getProviderStatus();
  }

  /**
   * Add external provider
   */
  addExternalProvider(provider: LLMProvider): void {
    this.hybridLLM.addExternalProvider(provider);
  }

  /**
   * Generate transition report
   */
  generateTransitionReport(): string {
    const metrics = this.getTransitionMetrics();
    const costAnalysis = this.hybridLLM.getCostAnalysis();
    const providers = this.getProviderStatus();
    
    const report = `
# Acey LLM Transition Report

## Current Status
- Total Requests: ${metrics.totalRequests}
- Self-Host Requests: ${metrics.selfHostRequests}
- External Requests: ${metrics.externalRequests}
- Transition Progress: ${metrics.transitionProgress.toFixed(1)}%
- Transition Mode: ${this.config.transitionMode}
- Max Self-Host Percentage: ${this.config.maxSelfHostPercentage}%

## Performance Metrics
- Self-Host Success Rate: ${(metrics.selfHostSuccessRate * 100).toFixed(1)}%
- External Success Rate: ${(metrics.externalSuccessRate * 100).toFixed(1)}%
- Cost Savings: $${metrics.costSavings.toFixed(4)}
- Learning Data Collected: ${metrics.learningDataCollected}

## Provider Status
${providers.map(p => `- ${p.name}: ${p.isAvailable ? '✅ Available' : '❌ Unavailable'} (${p.type})`).join('\n')}

## Cost Analysis
- Total Cost: $${costAnalysis.totalCost.toFixed(4)}
- Cost by Provider:
${Object.entries(costAnalysis.costByProvider)
  .map(([provider, cost]) => `  - ${provider}: $${cost.toFixed(4)}`)
  .join('\n')}

## Transition Recommendations
${metrics.transitionProgress < 25 
  ? '🔄 Early stage: Continue collecting training data and monitoring performance'
  : metrics.transitionProgress < 50 
  ? '📈 Growing: Consider increasing self-hosted usage for high-confidence skills'
  : metrics.transitionProgress < 75 
  ? '🚀 Accelerating: Ready to increase transition mode to balanced or aggressive'
  : '🎯 Advanced: Self-hosted model performing well, consider full transition'
}

## Next Steps
1. Monitor self-hosted model performance
2. Gradually increase self-hosted usage based on confidence
3. Continue collecting high-quality training data
4. Optimize cost by routing appropriate requests to self-hosted model

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.config.modelPath || './models', `transition_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    require('fs').writeFileSync(reportPath, report);
    
    console.log(`📄 Transition report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      skillsCount: this.skills.size,
      config: this.config,
      metrics: this.getTransitionMetrics(),
      providers: this.getProviderStatus(),
      hybridStatus: this.hybridLLM.getStatus()
    };
  }

  /**
   * Get learning data for training
   */
  getLearningData(skillName?: string): LLMResponse[] {
    return this.hybridLLM.getLearningData(skillName);
  }

  /**
   * Export training data for self-hosted model
   */
  exportTrainingData(): string {
    const learningData = this.getLearningData();
    const exportData = learningData.map(response => ({
      input: response.requestId, // Would need to map back to actual input
      output: response.output,
      quality: response.quality,
      provider: response.provider,
      timestamp: new Date().toISOString()
    }));

    const exportPath = path.join(this.config.modelPath || './models', `training_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    require('fs').writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`📁 Training data exported: ${exportPath}`);
    return exportPath;
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Transition Orchestrator...');
    
    // Generate final report
    this.generateTransitionReport();
    
    // Export training data
    this.exportTrainingData();
    
    this.isInitialized = false;
    
    this.emit('shutdown', { 
      timestamp: new Date().toISOString(),
      finalMetrics: this.metrics
    });
    
    console.log('✅ Transition Orchestrator shutdown complete');
  }
}

export default TransitionOrchestrator;
