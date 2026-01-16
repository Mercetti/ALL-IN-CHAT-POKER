/**
 * Self-Hosted LLM Orchestrator for Acey
 * Phase 1: Self-Hosted Acey LLM Migration
 * 
 * This module enables Acey to run skills through her own LLM instance
 * while maintaining constitutional compliance and fine-tuning capabilities
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

interface SkillExecution {
  skillName: string;
  input: any;
  output: any;
  timestamp: string;
  executionTime: number;
  success: boolean;
  error?: string;
  constitutionalCheck: {
    permitted: boolean;
    reason?: string;
    trustLevel: number;
  };
}

interface FineTuneEntry {
  input: any;
  output: any;
  timestamp: string;
  skillName: string;
  executionTime: number;
  success: boolean;
  constitutionalCompliance: boolean;
  quality: number; // 0-1 score for training quality
}

export class SelfHostLLM extends EventEmitter {
  private orchestrator: any;
  private modelPath: string;
  private trainingDataPath: string;
  private configPath: string;
  private isInitialized: boolean = false;
  private fallbackEnabled: boolean = true;
  private fineTuneEnabled: boolean = true;
  private executionStats: Map<string, number> = new Map();

  constructor(orchestrator: any, modelPath = 'D:/AceyLLM') {
    super();
    this.orchestrator = orchestrator;
    this.modelPath = modelPath;
    this.trainingDataPath = path.join(modelPath, 'training_data');
    this.configPath = path.join(modelPath, 'config');

    this.initialize();
  }

  /**
   * Initialize self-hosted LLM infrastructure
   */
  private async initialize() {
    try {
      // Create directory structure
      this.createDirectoryStructure();
      
      // Load configuration
      await this.loadConfiguration();
      
      // Initialize model (placeholder for actual LLM loading)
      await this.initializeModel();
      
      this.isInitialized = true;
      
      this.emit('initialized', {
        modelPath: this.modelPath,
        fallbackEnabled: this.fallbackEnabled,
        fineTuneEnabled: this.fineTuneEnabled
      });
      
      console.log('✅ Self-Hosted LLM initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Self-Hosted LLM:', error);
      this.emit('error', error);
    }
  }

  /**
   * Create necessary directory structure
   */
  private createDirectoryStructure() {
    const directories = [
      this.modelPath,
      this.trainingDataPath,
      this.configPath,
      path.join(this.trainingDataPath, 'skills'),
      path.join(this.trainingDataPath, 'conversations'),
      path.join(this.trainingDataPath, 'fine_tune'),
      path.join(this.modelPath, 'models'),
      path.join(this.modelPath, 'cache')
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Load configuration
   */
  private async loadConfiguration() {
    const configFile = path.join(this.configPath, 'llm-config.json');
    
    if (!fs.existsSync(configFile)) {
      // Create default configuration
      const defaultConfig = {
        modelPath: this.modelPath,
        fallbackEnabled: true,
        fineTuneEnabled: true,
        maxTrainingEntries: 10000,
        qualityThreshold: 0.7,
        constitutionalCompliance: true,
        loggingLevel: 'info',
        cacheSize: 1000,
        modelType: 'transformer',
        version: '1.0.0'
      };
      
      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
      console.log('📝 Created default LLM configuration');
    }
    
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    this.fallbackEnabled = config.fallbackEnabled;
    this.fineTuneEnabled = config.fineTuneEnabled;
    
    console.log('⚙️ LLM configuration loaded');
  }

  /**
   * Initialize the actual LLM model
   */
  private async initializeModel() {
    // Placeholder for actual LLM initialization
    // In production, this would load the transformer model
    console.log('🧠 Initializing LLM model...');
    
    // Simulate model loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ LLM model ready');
  }

  /**
   * Execute skill through self-hosted LLM with constitutional compliance
   */
  async executeSkill(skillName: string, input: any, context: any = {}): Promise<any> {
    const startTime = Date.now();
    const executionId = crypto.randomUUID();
    
    try {
      if (!this.isInitialized) {
        throw new Error('Self-Hosted LLM not initialized');
      }

      // Get skill from orchestrator
      const skill = this.orchestrator.getSkill(skillName);
      if (!skill) {
        throw new Error(`Skill ${skillName} not found`);
      }

      // Constitutional compliance check
      const constitutionalCheck = await this.checkConstitutionalCompliance(skillName, input, context);
      if (!constitutionalCheck.permitted) {
        throw new Error(`Constitutional violation: ${constitutionalCheck.reason}`);
      }

      // Execute skill through self-hosted LLM
      const output = await this.executeWithSelfHostedLLM(skillName, input, context);
      
      const executionTime = Date.now() - startTime;
      
      // Log execution for fine-tuning
      if (this.fineTuneEnabled) {
        await this.logForFineTune(skillName, input, output, executionTime, true, constitutionalCheck);
      }

      // Update statistics
      this.updateExecutionStats(skillName, true);

      const execution: SkillExecution = {
        skillName,
        input,
        output,
        timestamp: new Date().toISOString(),
        executionTime,
        success: true,
        constitutionalCheck
      };

      this.emit('skillExecuted', execution);
      
      console.log(`✅ Skill ${skillName} executed successfully in ${executionTime}ms`);
      
      return output;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log failed execution
      if (this.fineTuneEnabled) {
        await this.logForFineTune(skillName, input, null, executionTime, false, { permitted: false, reason: error.message });
      }

      this.updateExecutionStats(skillName, false);

      const execution: SkillExecution = {
        skillName,
        input,
        output: null,
        timestamp: new Date().toISOString(),
        executionTime,
        success: false,
        error: error.message,
        constitutionalCheck: { permitted: false, reason: error.message, trustLevel: 0 }
      };

      this.emit('skillExecutionFailed', execution);
      
      console.error(`❌ Skill ${skillName} execution failed:`, error.message);
      
      // Try fallback if enabled
      if (this.fallbackEnabled) {
        console.log('🔄 Attempting fallback to external LLM...');
        return await this.executeWithFallback(skillName, input, context);
      }
      
      throw error;
    }
  }

  /**
   * Execute skill through self-hosted LLM (placeholder implementation)
   */
  private async executeWithSelfHostedLLM(skillName: string, input: any, context: any): Promise<any> {
    // This is a placeholder for actual LLM execution
    // In production, this would use the loaded transformer model
    
    console.log(`🧠 Executing ${skillName} through self-hosted LLM...`);
    
    // Simulate LLM processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Placeholder output - in production, this would be the actual LLM response
    const output = {
      success: true,
      result: `Self-hosted LLM execution of ${skillName}`,
      processingTime: Date.now(),
      model: 'acey-self-host-v1',
      confidence: 0.85 + Math.random() * 0.15
    };
    
    return output;
  }

  /**
   * Fallback to external LLM if self-hosted fails
   */
  private async executeWithFallback(skillName: string, input: any, context: any): Promise<any> {
    console.log(`🔄 Using external LLM fallback for ${skillName}`);
    
    // Simulate external LLM call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    const output = {
      success: true,
      result: `External LLM fallback execution of ${skillName}`,
      processingTime: Date.now(),
      model: 'external-fallback',
      confidence: 0.75 + Math.random() * 0.20,
      fallback: true
    };
    
    return output;
  }

  /**
   * Check constitutional compliance before execution
   */
  private async checkConstitutionalCompliance(skillName: string, input: any, context: any): Promise<{ permitted: boolean; reason?: string; trustLevel: number }> {
    // This would integrate with the constitutional orchestrator
    // For now, simulate compliance check
    
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
   * Log execution for fine-tuning dataset
   */
  private async logForFineTune(
    skillName: string, 
    input: any, 
    output: any, 
    executionTime: number, 
    success: boolean,
    constitutionalCheck: any
  ): Promise<void> {
    try {
      const logFile = path.join(this.trainingDataPath, 'skills', `${skillName}_training.jsonl`);
      
      // Calculate quality score for training
      const quality = this.calculateTrainingQuality(input, output, success, executionTime);
      
      const entry: FineTuneEntry = {
        input,
        output,
        timestamp: new Date().toISOString(),
        skillName,
        executionTime,
        success,
        constitutionalCompliance: constitutionalCheck.permitted,
        quality
      };
      
      // Only log high-quality entries for fine-tuning
      if (quality >= 0.7) {
        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
        
        // Also log to master training file
        const masterFile = path.join(this.trainingDataPath, 'fine_tune', 'master_training.jsonl');
        fs.appendFileSync(masterFile, JSON.stringify(entry) + '\n');
        
        console.log(`📝 Logged training entry for ${skillName} (quality: ${quality.toFixed(2)})`);
      }
      
      // Manage file size (rotate if too large)
      await this.rotateTrainingFiles(logFile);
      
    } catch (error) {
      console.error('Failed to log for fine-tuning:', error);
    }
  }

  /**
   * Calculate training quality score
   */
  private calculateTrainingQuality(input: any, output: any, success: boolean, executionTime: number): number {
    let quality = 0.5; // Base score
    
    // Success bonus
    if (success) quality += 0.3;
    
    // Execution time bonus (faster is better)
    if (executionTime < 1000) quality += 0.1;
    else if (executionTime > 5000) quality -= 0.1;
    
    // Output quality bonus (placeholder - would analyze actual output)
    if (output && output.confidence) {
      quality += (output.confidence - 0.5) * 0.2;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Rotate training files to prevent them from getting too large
   */
  private async rotateTrainingFiles(logFile: string): Promise<void> {
    try {
      const stats = fs.statSync(logFile);
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = logFile.replace('.jsonl', `_${timestamp}.jsonl`);
        
        fs.renameSync(logFile, rotatedFile);
        console.log(`📁 Rotated training file: ${rotatedFile}`);
      }
    } catch (error) {
      console.error('Failed to rotate training file:', error);
    }
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(skillName: string, success: boolean): void {
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
   * Get training dataset for a specific skill
   */
  getTrainingDataset(skillName: string): FineTuneEntry[] {
    const trainingFile = path.join(this.trainingDataPath, 'skills', `${skillName}_training.jsonl`);
    
    if (!fs.existsSync(trainingFile)) {
      return [];
    }
    
    try {
      const lines = fs.readFileSync(trainingFile, 'utf-8').split('\n').filter(Boolean);
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error(`Failed to load training dataset for ${skillName}:`, error);
      return [];
    }
  }

  /**
   * Get master training dataset
   */
  getMasterTrainingDataset(): FineTuneEntry[] {
    const masterFile = path.join(this.trainingDataPath, 'fine_tune', 'master_training.jsonl');
    
    if (!fs.existsSync(masterFile)) {
      return [];
    }
    
    try {
      const lines = fs.readFileSync(masterFile, 'utf-8').split('\n').filter(Boolean);
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('Failed to load master training dataset:', error);
      return [];
    }
  }

  /**
   * Prepare fine-tune dataset for model training
   */
  prepareFineTuneDataset(skillName?: string): any[] {
    const entries = skillName 
      ? this.getTrainingDataset(skillName)
      : this.getMasterTrainingDataset();
    
    // Filter for high-quality entries
    const highQualityEntries = entries.filter(entry => 
      entry.success && 
      entry.constitutionalCompliance && 
      entry.quality >= 0.7
    );
    
    // Transform for fine-tuning format
    return highQualityEntries.map(entry => ({
      input: entry.input,
      output: entry.output,
      skill: entry.skillName,
      timestamp: entry.timestamp
    }));
  }

  /**
   * Enable/disable fallback mode
   */
  setFallbackMode(enabled: boolean): void {
    this.fallbackEnabled = enabled;
    console.log(`Fallback mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable fine-tuning
   */
  setFineTuneMode(enabled: boolean): void {
    this.fineTuneEnabled = enabled;
    console.log(`Fine-tune mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      modelPath: this.modelPath,
      fallbackEnabled: this.fallbackEnabled,
      fineTuneEnabled: this.fineTuneEnabled,
      executionStats: this.getExecutionStats(),
      trainingDataSize: this.getTrainingDatasetSize(),
      uptime: process.uptime()
    };
  }

  /**
   * Get total training data size
   */
  private getTrainingDatasetSize(): number {
    const masterFile = path.join(this.trainingDataPath, 'fine_tune', 'master_training.jsonl');
    
    if (!fs.existsSync(masterFile)) {
      return 0;
    }
    
    try {
      const lines = fs.readFileSync(masterFile, 'utf-8').split('\n').filter(Boolean);
      return lines.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Shutdown the self-hosted LLM
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Self-Hosted LLM...');
    
    // Save current state
    const status = this.getStatus();
    const statusFile = path.join(this.configPath, 'last_status.json');
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    
    this.isInitialized = false;
    
    this.emit('shutdown', status);
    
    console.log('✅ Self-Hosted LLM shutdown complete');
  }
}

export default SelfHostLLM;
