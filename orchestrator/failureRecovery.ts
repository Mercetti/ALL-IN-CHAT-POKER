/**
 * Failure Recovery Module for Acey
 * Phase 1: Core Orchestrator Setup
 * 
 * This module provides intelligent error recovery and fallback mechanisms
 * for skill execution failures and system errors
 */

import { EventEmitter } from 'events';
import { SimulationResult } from './simulationEngine';

export interface RecoveryStrategy {
  name: string;
  description: string;
  priority: number;
  conditions: (error: Error, context: any) => boolean;
  execute: (error: Error, context: any) => Promise<RecoveryResult>;
}

export interface RecoveryResult {
  success: boolean;
  strategy: string;
  result: any;
  attempts: number;
  duration: number;
  timestamp: string;
  error?: string;
}

export interface FailureContext {
  skillName: string;
  action: string;
  input: any;
  userContext: any;
  previousAttempts: number;
  lastError: Error;
}

export interface RecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  enableFallback: boolean;
  fallbackModel: string;
  logPath: string;
  enableEmergencyMode: boolean;
}

export class FailureRecovery extends EventEmitter {
  private config: RecoveryConfig;
  private strategies: RecoveryStrategy[] = [];
  private recoveryHistory: RecoveryResult[] = [];
  private emergencyMode: boolean = false;

  constructor(config: RecoveryConfig) {
    super();
    this.config = config;
    this.initializeStrategies();
  }

  /**
   * Initialize recovery strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'retry-with-delay',
        description: 'Retry the operation with exponential backoff',
        priority: 1,
        conditions: (error, context) => context.previousAttempts < this.config.maxRetries,
        execute: async (error, context) => this.retryWithDelay(error, context)
      },
      {
        name: 'fallback-to-external-llm',
        description: 'Fallback to external LLM provider',
        priority: 2,
        conditions: (error, context) => this.config.enableFallback && this.isLLMError(error),
        execute: async (error, context) => this.fallbackToExternalLLM(error, context)
      },
      {
        name: 'simplify-input',
        description: 'Simplify input parameters and retry',
        priority: 3,
        conditions: (error, context) => this.isComplexityError(error),
        execute: async (error, context) => this.simplifyInput(error, context)
      },
      {
        name: 'use-cache',
        description: 'Use cached results if available',
        priority: 4,
        conditions: (error, context) => this.hasCachedResult(context),
        execute: async (error, context) => this.useCachedResult(error, context)
      },
      {
        name: 'emergency-mode',
        description: 'Activate emergency mode for critical errors',
        priority: 5,
        conditions: (error, context) => this.config.enableEmergencyMode && this.isCriticalError(error),
        execute: async (error, context) => this.activateEmergencyMode(error, context)
      }
    ];
  }

  /**
   * Handle skill execution failure
   */
  async handleFailure(error: Error, context: FailureContext): Promise<RecoveryResult> {
    console.log(`🔧 Handling failure for ${context.skillName}: ${error.message}`);
    
    const startTime = Date.now();
    
    // Sort strategies by priority
    const applicableStrategies = this.strategies
      .filter(strategy => strategy.conditions(error, context))
      .sort((a, b) => a.priority - b.priority);

    if (applicableStrategies.length === 0) {
      const result: RecoveryResult = {
        success: false,
        strategy: 'none',
        result: null,
        attempts: 0,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: 'No applicable recovery strategies found'
      };

      this.recoveryHistory.push(result);
      this.emit('recoveryFailed', result);
      
      return result;
    }

    // Try strategies in order
    for (const strategy of applicableStrategies) {
      try {
        console.log(`🔄 Trying recovery strategy: ${strategy.name}`);
        
        const result = await strategy.execute(error, context);
        
        if (result.success) {
          console.log(`✅ Recovery successful with strategy: ${strategy.name}`);
          
          this.recoveryHistory.push(result);
          this.emit('recoverySuccess', result);
          
          return result;
        } else {
          console.log(`❌ Recovery strategy failed: ${strategy.name}`);
        }
      } catch (recoveryError) {
        console.error(`💥 Recovery strategy error: ${strategy.name} - ${recoveryError}`);
      }
    }

    // All strategies failed
    const result: RecoveryResult = {
      success: false,
      strategy: 'all-failed',
      result: null,
      attempts: applicableStrategies.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: 'All recovery strategies failed'
    };

    this.recoveryHistory.push(result);
    this.emit('recoveryFailed', result);
    
    return result;
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithDelay(error: Error, context: FailureContext): Promise<RecoveryResult> {
    const delay = Math.min(1000 * Math.pow(2, context.previousAttempts), 30000);
    
    console.log(`⏱️ Retrying in ${delay}ms (attempt ${context.previousAttempts + 1})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // This would normally call the original function again
    // For simulation, we'll return a success after a few attempts
    if (context.previousAttempts >= 2) {
      return {
        success: true,
        strategy: 'retry-with-delay',
        result: { message: 'Retry successful after backoff' },
        attempts: context.previousAttempts + 1,
        duration: delay,
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Retry failed, will try again');
  }

  /**
   * Fallback to external LLM
   */
  private async fallbackToExternalLLM(error: Error, context: FailureContext): Promise<RecoveryResult> {
    console.log(`🌐 Falling back to external LLM: ${this.config.fallbackModel}`);
    
    // Simulate external LLM call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      strategy: 'fallback-to-external-llm',
      result: { 
        message: 'External LLM fallback successful',
        model: this.config.fallbackModel,
        output: `Simulated ${context.skillName} result from external LLM`
      },
      attempts: 1,
      duration: 2000,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Simplify input parameters
   */
  private async simplifyInput(error: Error, context: FailureContext): Promise<RecoveryResult> {
    console.log('🔧 Simplifying input parameters');
    
    // Create simplified version of input
    const simplifiedInput = this.simplifyInputData(context.input);
    
    // Simulate processing with simplified input
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      strategy: 'simplify-input',
      result: { 
        message: 'Simplified input processed successfully',
        originalInput: context.input,
        simplifiedInput
      },
      attempts: 1,
      duration: 1000,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Use cached results
   */
  private async useCachedResult(error: Error, context: FailureContext): Promise<RecoveryResult> {
    console.log('💾 Using cached result');
    
    // Simulate cache lookup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const cachedResult = {
      message: 'Cached result retrieved',
      cacheKey: `${context.skillName}-${context.action}`,
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    };
    
    return {
      success: true,
      strategy: 'use-cache',
      result: cachedResult,
      attempts: 1,
      duration: 100,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Activate emergency mode
   */
  private async activateEmergencyMode(error: Error, context: FailureContext): Promise<RecoveryResult> {
    console.log('🚨 Activating emergency mode');
    
    this.emergencyMode = true;
    
    // Emit emergency mode event
    this.emit('emergencyMode', { 
      enabled: true, 
      error: error.message,
      context: context.skillName,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      strategy: 'emergency-mode',
      result: { 
        message: 'Emergency mode activated',
        limitedOperations: true,
        safetyLevel: 'maximum'
      },
      attempts: 1,
      duration: 500,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if error is LLM-related
   */
  private isLLMError(error: Error): boolean {
    const llmErrorPatterns = [
      'model not found',
      'timeout',
      'connection refused',
      'quota exceeded',
      'rate limit',
      'api error'
    ];
    
    return llmErrorPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Check if error is complexity-related
   */
  private isComplexityError(error: Error): boolean {
    const complexityPatterns = [
      'too large',
      'timeout',
      'memory',
      'complex',
      'limit exceeded'
    ];
    
    return complexityPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      'security',
      'authentication',
      'authorization',
      'critical',
      'fatal',
      'system'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Check if cached result is available
   */
  private hasCachedResult(context: FailureContext): boolean {
    // Simulate cache check - in real implementation, would check actual cache
    return Math.random() > 0.7; // 30% chance of having cache
  }

  /**
   * Simplify input data
   */
  private simplifyInputData(input: any): any {
    if (typeof input === 'string') {
      return input.substring(0, 100) + '...'; // Truncate long strings
    }
    
    if (typeof input === 'object' && input !== null) {
      const simplified: any = {};
      Object.keys(input).slice(0, 3).forEach(key => {
        simplified[key] = input[key];
      });
      return simplified;
    }
    
    return input;
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStatistics(): any {
    const stats = {
      total: this.recoveryHistory.length,
      successful: 0,
      failed: 0,
      byStrategy: {},
      avgDuration: 0,
      emergencyMode: this.emergencyMode
    };

    let totalDuration = 0;

    this.recoveryHistory.forEach(recovery => {
      if (recovery.success) {
        stats.successful++;
      } else {
        stats.failed++;
      }

      // Track by strategy
      if (!stats.byStrategy[recovery.strategy]) {
        stats.byStrategy[recovery.strategy] = {
          total: 0,
          successful: 0,
          failed: 0
        };
      }

      stats.byStrategy[recovery.strategy].total++;
      if (recovery.success) {
        stats.byStrategy[recovery.strategy].successful++;
      } else {
        stats.byStrategy[recovery.strategy].failed++;
      }

      totalDuration += recovery.duration;
    });

    stats.avgDuration = stats.total > 0 ? totalDuration / stats.total : 0;

    return stats;
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory(limit?: number): RecoveryResult[] {
    if (limit) {
      return this.recoveryHistory.slice(-limit);
    }
    return this.recoveryHistory;
  }

  /**
   * Check if emergency mode is active
   */
  isEmergencyModeActive(): boolean {
    return this.emergencyMode;
  }

  /**
   * Deactivate emergency mode
   */
  deactivateEmergencyMode(): void {
    if (this.emergencyMode) {
      this.emergencyMode = false;
      this.emit('emergencyMode', { 
        enabled: false, 
        timestamp: new Date().toISOString() 
      });
      console.log('✅ Emergency mode deactivated');
    }
  }

  /**
   * Clear recovery history
   */
  clearHistory(): void {
    this.recoveryHistory = [];
  }

  /**
   * Add custom recovery strategy
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove recovery strategy
   */
  removeStrategy(strategyName: string): boolean {
    const index = this.strategies.findIndex(s => s.name === strategyName);
    if (index !== -1) {
      this.strategies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): RecoveryStrategy[] {
    return [...this.strategies];
  }

  /**
   * Test recovery system
   */
  async testRecovery(): Promise<void> {
    console.log('🧪 Testing recovery system...');
    
    const testErrors = [
      new Error('Model not found: codellama'),
      new Error('Request timeout after 30 seconds'),
      new Error('Input too large: exceeds 10000 tokens'),
      new Error('Security authentication failed'),
      new Error('Rate limit exceeded')
    ];

    const testContext: FailureContext = {
      skillName: 'CodeHelper',
      action: 'generate',
      input: { code: 'test code generation' },
      userContext: { role: 'user', trustLevel: 2 },
      previousAttempts: 0,
      lastError: testErrors[0]
    };

    for (let i = 0; i < testErrors.length; i++) {
      console.log(`Testing error ${i + 1}: ${testErrors[i].message}`);
      
      testContext.lastError = testErrors[i];
      testContext.previousAttempts = i;
      
      const result = await this.handleFailure(testErrors[i], testContext);
      
      console.log(`Result: ${result.success ? '✅ Success' : '❌ Failed'} - ${result.strategy}`);
    }

    console.log('🧪 Recovery system test complete');
  }
}

export default FailureRecovery;
