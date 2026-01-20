import { SkillRegistry, getSkillById } from '../skills/SkillRegistry';
import { hasPermission, canUseSkill } from '../skills/PermissionMatrix';
import { canSkillLearn, getLearningBoundary } from '../skills/LearningBoundaries';
import { addSkillVersion } from '../skills/SkillVersioning';
import { log, LogLevel } from '../logging/Logger';
import { getInternalSkillById } from '../skills/InternalSkillMap';

export interface ExecutionContext {
  userId: string;
  userRole: string;
  userTier?: string;
  sessionId: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  skillId: string;
  context: ExecutionContext;
}

export class Orchestrator {
  private usageTracker: Map<string, number> = new Map();
  private learningTracker: Map<string, number> = new Map();

  async executeSkill(
    skillId: string, 
    context: ExecutionContext, 
    ...args: any[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      log(`Executing skill ${skillId} for user ${context.userId}`, LogLevel.INFO);
      
      // Validate skill exists
      const skill = getSkillById(skillId);
      if (!skill) {
        return this.createErrorResult(skillId, context, startTime, 'Skill not found');
      }

      // Check permissions
      const permissionCheck = canUseSkill(
        skillId, 
        context.userRole, 
        context.userTier,
        this.usageTracker.get(skillId)
      );
      
      if (!permissionCheck.canUse) {
        return this.createErrorResult(skillId, context, startTime, permissionCheck.reason);
      }

      // Check internal skill access
      const internalSkill = getInternalSkillById(skillId);
      if (internalSkill && !internalSkill.access.includes(context.userRole as any)) {
        return this.createErrorResult(skillId, context, startTime, 'Internal skill access denied');
      }

      // Execute skill
      const result = await skill.execute(...args);
      
      // Update usage tracking
      this.updateUsage(skillId);
      
      // Handle learning if enabled
      if (canSkillLearn(skillId)) {
        await this.handleLearning(skillId, result, context);
      }

      const executionTime = Date.now() - startTime;
      
      log(`Skill ${skillId} executed successfully in ${executionTime}ms`, LogLevel.INFO);
      
      return {
        success: true,
        result,
        executionTime,
        skillId,
        context,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      log(`Skill ${skillId} execution failed: ${errorMessage}`, LogLevel.CRITICAL);
      
      return {
        success: false,
        error: errorMessage,
        executionTime,
        skillId,
        context,
      };
    }
  }

  async executeSkillBatch(
    executions: Array<{ skillId: string; context: ExecutionContext; args?: any[] }>
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    for (const execution of executions) {
      const result = await this.executeSkill(
        execution.skillId,
        execution.context,
        ...(execution.args || [])
      );
      results.push(result);
    }
    
    return results;
  }

  async executeSkillWithRetry(
    skillId: string,
    context: ExecutionContext,
    maxRetries: number = 3,
    retryDelay: number = 1000,
    ...args: any[]
  ): Promise<ExecutionResult> {
    let lastResult: ExecutionResult;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResult = await this.executeSkill(skillId, context, ...args);
      
      if (lastResult.success) {
        return lastResult;
      }
      
      if (attempt < maxRetries) {
        log(`Retrying skill ${skillId} (attempt ${attempt + 1}/${maxRetries})`, LogLevel.DEBUG);
        await this.delay(retryDelay * attempt); // Exponential backoff
      }
    }
    
    return lastResult!;
  }

  private createErrorResult(
    skillId: string,
    context: ExecutionContext,
    startTime: number,
    error: string
  ): ExecutionResult {
    return {
      success: false,
      error,
      executionTime: Date.now() - startTime,
      skillId,
      context,
    };
  }

  private updateUsage(skillId: string): void {
    const currentUsage = this.usageTracker.get(skillId) || 0;
    this.usageTracker.set(skillId, currentUsage + 1);
  }

  private async handleLearning(
    skillId: string,
    result: any,
    context: ExecutionContext
  ): Promise<void> {
    const boundary = getLearningBoundary(skillId);
    if (!boundary || !boundary.canImprove) return;

    const currentLearning = this.learningTracker.get(skillId) || 0;
    
    if (boundary.maxLearningPerDay && currentLearning >= boundary.maxLearningPerDay) {
      log(`Learning limit reached for skill ${skillId}`, LogLevel.DEBUG);
      return;
    }

    // Placeholder for learning logic
    // LLM will implement actual learning algorithms
    log(`Processing learning data for skill ${skillId}`, LogLevel.DEBUG);
    
    this.learningTracker.set(skillId, currentLearning + 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getUsageStats(): Record<string, number> {
    return Object.fromEntries(this.usageTracker);
  }

  getLearningStats(): Record<string, number> {
    return Object.fromEntries(this.learningTracker);
  }

  resetDailyUsage(): void {
    this.usageTracker.clear();
    this.learningTracker.clear();
    log('Daily usage and learning stats reset', LogLevel.INFO);
  }

  async upgradeSkill(skillId: string, newVersion: string, changelog: string): Promise<boolean> {
    try {
      addSkillVersion({
        skillId,
        version: newVersion,
        changelog,
        author: 'System Upgrade',
        breakingChanges: false,
        migrationRequired: false,
      });

      log(`Skill ${skillId} upgraded to version ${newVersion}`, LogLevel.INFO);
      return true;
    } catch (error) {
      log(`Failed to upgrade skill ${skillId}: ${error}`, LogLevel.CRITICAL);
      return false;
    }
  }
}
