/**
 * Core Orchestrator for Acey with Self-Hosted LLM Integration
 * Phase 1: Self-Hosted Acey LLM Migration
 * 
 * This orchestrator manages skills and routes execution through the self-hosted LLM
 * while maintaining constitutional compliance and fallback capabilities
 */

import { SelfHostLLM } from './llmSelfHost';
import { FineTuneDatasetManager } from './dataset/fineTune';
import { EventEmitter } from 'events';

export interface Skill {
  name: string;
  description: string;
  version: string;
  permissions: string[];
  trustLevel: number;
  execute: (input: any, context: any) => Promise<any>;
  isActive: boolean;
}

export interface SkillExecution {
  skillName: string;
  input: any;
  output: any;
  timestamp: string;
  executionTime: number;
  success: boolean;
  constitutionalCheck: {
    permitted: boolean;
    reason?: string;
    trustLevel: number;
  };
}

export interface OrchestratorConfig {
  modelPath?: string;
  fallbackEnabled?: boolean;
  fineTuneEnabled?: boolean;
  constitutionalMode?: 'strict' | 'permissive';
  maxConcurrentExecutions?: number;
}

export class Orchestrator extends EventEmitter {
  private skills: Map<string, Skill> = new Map();
  private selfHostLLM: SelfHostLLM;
  private datasetManager: FineTuneDatasetManager;
  private config: OrchestratorConfig;
  private isInitialized: boolean = false;
  private executionQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  constructor(config: OrchestratorConfig = {}) {
    super();
    
    this.config = {
      modelPath: config.modelPath || 'D:/AceyLLM',
      fallbackEnabled: config.fallbackEnabled ?? true,
      fineTuneEnabled: config.fineTuneEnabled ?? true,
      constitutionalMode: config.constitutionalMode || 'strict',
      maxConcurrentExecutions: config.maxConcurrentExecutions || 5,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the orchestrator and its components
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Acey Orchestrator...');

      // Initialize self-hosted LLM
      this.selfHostLLM = new SelfHostLLM(this, this.config.modelPath);
      
      // Initialize dataset manager
      this.datasetManager = new FineTuneDatasetManager(this.config.modelPath);

      // Set up event listeners
      this.setupEventListeners();

      // Load existing skills
      await this.loadExistingSkills();

      this.isInitialized = true;

      this.emit('initialized', {
        skillsCount: this.skills.size,
        config: this.config
      });

      console.log('✅ Acey Orchestrator initialized successfully');
      console.log(`📊 Registered skills: ${this.skills.size}`);
      console.log(`🧠 Self-hosted LLM: ${this.config.fallbackEnabled ? 'enabled' : 'disabled'}`);
      console.log(`📝 Fine-tuning: ${this.config.fineTuneEnabled ? 'enabled' : 'disabled'}`);

    } catch (error) {
      console.error('❌ Failed to initialize Orchestrator:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for the self-hosted LLM
   */
  private setupEventListeners(): void {
    this.selfHostLLM.on('skillExecuted', (execution: SkillExecution) => {
      this.emit('skillExecuted', execution);
    });

    this.selfHostLLM.on('skillExecutionFailed', (execution: SkillExecution) => {
      this.emit('skillExecutionFailed', execution);
    });

    this.selfHostLLM.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Load existing skills from the skill registry
   */
  private async loadExistingSkills(): Promise<void> {
    // Core skills that are always available
    const coreSkills: Partial<Skill>[] = [
      {
        name: 'SecurityObserver',
        description: 'Monitor system security and integrity',
        version: '1.0.0',
        permissions: ['read_project_files', 'monitor_systems', 'create_alerts'],
        trustLevel: 2,
        isActive: true
      },
      {
        name: 'FileTools',
        description: 'Handle file operations and security scanning',
        version: '1.0.0',
        permissions: ['create_temp_files', 'create_archives', 'scan_files_security'],
        trustLevel: 3,
        isActive: true
      },
      {
        name: 'CodeHelper',
        description: 'Assist with code analysis and suggestions',
        version: '1.0.0',
        permissions: ['analyze_code', 'suggest_tasks'],
        trustLevel: 2,
        isActive: true
      },
      {
        name: 'GraphicsWizard',
        description: 'Generate and manipulate graphics',
        version: '1.0.0',
        permissions: ['generate_content', 'create_temp_files'],
        trustLevel: 2,
        isActive: true
      },
      {
        name: 'AudioMaestro',
        description: 'Process and generate audio content',
        version: '1.0.0',
        permissions: ['generate_content', 'create_temp_files'],
        trustLevel: 2,
        isActive: true
      },
      {
        name: 'LinkReview',
        description: 'Review and analyze external links',
        version: '1.0.0',
        permissions: ['send_network_requests', 'analyze_content'],
        trustLevel: 2,
        isActive: true
      }
    ];

    // Register core skills
    for (const skillData of coreSkills) {
      const skill: Skill = {
        ...skillData,
        execute: async (input: any, context: any) => {
          // Default execution through self-hosted LLM
          return await this.selfHostLLM.executeSkill(skillData.name!, input, context);
        }
      } as Skill;

      this.registerSkill(skill.name!, skill);
    }
  }

  /**
   * Register a new skill
   */
  registerSkill(name: string, skill: Skill): void {
    if (this.skills.has(name)) {
      console.warn(`⚠️ Skill ${name} is already registered. Overwriting...`);
    }

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
   * List all available skills
   */
  listSkills(role: string = 'user'): Skill[] {
    const allSkills = Array.from(this.skills.values());
    
    // Filter by role and permissions
    return allSkills.filter(skill => {
      if (!skill.isActive) return false;
      
      // Role-based filtering logic would go here
      // For now, return all active skills
      return true;
    });
  }

  /**
   * Execute a skill through the orchestrator
   */
  async executeSkill(skillName: string, input: any, context: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    const skill = this.getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    // Check if skill is active
    if (!skill.isActive) {
      throw new Error(`Skill ${skillName} is not active`);
    }

    // Check permissions based on role
    if (!this.checkPermissions(skill, context.role || 'user')) {
      throw new Error(`Insufficient permissions for skill ${skillName}`);
    }

    // Queue execution if too many concurrent executions
    if (this.executionQueue.length >= this.config.maxConcurrentExecutions!) {
      return await this.queueExecution(() => this.executeSkillInternal(skill, input, context));
    }

    return await this.executeSkillInternal(skill, input, context);
  }

  /**
   * Internal skill execution
   */
  private async executeSkillInternal(skill: Skill, input: any, context: any): Promise<any> {
    const startTime = Date.now();

    try {
      console.log(`🎯 Executing skill: ${skill.name}`);

      // Execute through self-hosted LLM (this handles constitutional compliance)
      const output = await this.selfHostLLM.executeSkill(skill.name, input, context);

      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Skill ${skill.name} completed in ${executionTime}ms`);
      
      return output;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Skill ${skill.name} failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Queue execution for later processing
   */
  private async queueExecution(execution: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.executionQueue.push(async () => {
        try {
          const result = await execution();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.executionQueue.length > 0) {
      const execution = this.executionQueue.shift();
      if (execution) {
        try {
          await execution();
        } catch (error) {
          console.error('Queued execution failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Check if a role has permission to use a skill
   */
  private checkPermissions(skill: Skill, role: string): boolean {
    // Simple permission check - in production, this would be more sophisticated
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
   * Get training dataset for a specific skill
   */
  getTrainingDataset(skillName: string): any[] {
    return this.datasetManager.prepareFineTuneDataset(skillName, this.config.modelPath!);
  }

  /**
   * Get master training dataset
   */
  getMasterTrainingDataset(): any[] {
    return this.datasetManager.prepareMasterDataset(this.config.modelPath!);
  }

  /**
   * Get orchestrator status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      skillsCount: this.skills.size,
      activeSkills: Array.from(this.skills.values()).filter(skill => skill.isActive).length,
      queueLength: this.executionQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      config: this.config,
      llmStatus: this.selfHostLLM.getStatus(),
      datasetStats: this.datasetManager.getDatasetStats()
    };
  }

  /**
   * Enable or disable a skill
   */
  setSkillActive(skillName: string, active: boolean): void {
    const skill = this.getSkill(skillName);
    if (skill) {
      skill.isActive = active;
      console.log(`🔄 Skill ${skillName} ${active ? 'enabled' : 'disabled'}`);
      this.emit('skillStatusChanged', { skillName, active });
    }
  }

  /**
   * Update skill configuration
   */
  updateSkillConfig(skillName: string, updates: Partial<Skill>): void {
    const skill = this.getSkill(skillName);
    if (skill) {
      Object.assign(skill, updates);
      console.log(`⚙️ Updated configuration for skill: ${skillName}`);
      this.emit('skillConfigUpdated', { skillName, updates });
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): Record<string, number> {
    return this.selfHostLLM.getExecutionStats();
  }

  /**
   * Generate training report
   */
  generateTrainingReport(): string {
    return this.datasetManager.generateReport();
  }

  /**
   * Clean up old training data
   */
  cleanupOldData(maxAgeDays = 30): void {
    this.datasetManager.cleanupOldData(maxAgeDays);
  }

  /**
   * Set fallback mode
   */
  setFallbackMode(enabled: boolean): void {
    this.config.fallbackEnabled = enabled;
    this.selfHostLLM.setFallbackMode(enabled);
  }

  /**
   * Set fine-tune mode
   */
  setFineTuneMode(enabled: boolean): void {
    this.config.fineTuneEnabled = enabled;
    this.selfHostLLM.setFineTuneMode(enabled);
  }

  /**
   * Get skill information
   */
  getSkillInfo(skillName: string): any {
    const skill = this.getSkill(skillName);
    if (!skill) {
      return null;
    }

    return {
      name: skill.name,
      description: skill.description,
      version: skill.version,
      permissions: skill.permissions,
      trustLevel: skill.trustLevel,
      isActive: skill.isActive,
      executionStats: this.getExecutionStatsForSkill(skillName)
    };
  }

  /**
   * Get execution statistics for a specific skill
   */
  private getExecutionStatsForSkill(skillName: string): any {
    const stats = this.getExecutionStats();
    return {
      success: stats[`${skillName}_success`] || 0,
      failures: stats[`${skillName}_failure`] || 0,
      total: (stats[`${skillName}_success`] || 0) + (stats[`${skillName}_failure`] || 0)
    };
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Acey Orchestrator...');

    // Wait for queue to finish
    while (this.isProcessingQueue || this.executionQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Shutdown self-hosted LLM
    await this.selfHostLLM.shutdown();

    this.isInitialized = false;

    this.emit('shutdown', { timestamp: new Date().toISOString() });

    console.log('✅ Acey Orchestrator shutdown complete');
  }
}

export default Orchestrator;
