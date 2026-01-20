/**
 * Acey Stability Module Core
 * Central coordinator for all stability and resource management
 */

import { SkillModule } from "./skill-module";
import { ResourceMonitor } from "./resource-monitor";
import { Watchdog } from "./watchdog";
import { Scheduler } from "./scheduler";
import { LLMValidator } from "./llm-validator";
import { Logger } from "./logger";
import { RollbackManager } from "./rollback-manager";

export interface StabilityConfig {
  resourceThresholds: {
    cpu: number;     // percentage
    gpu: number;     // percentage  
    ram: number;     // percentage
  };
  snapshotIntervalMs: number;
  skillCheckIntervalMs: number;
  autoThrottleEnabled: boolean;
  emergencyShutdownThreshold: number;
}

export interface SystemStatus {
  active: boolean;
  uptime: number;
  resources: {
    cpu: number;
    gpu: number;
    ram: number;
    disk: number;
  };
  skills: Array<{
    name: string;
    healthy: boolean;
    uptime: number;
    lastError?: string;
  }>;
  llmConnections: number;
  lastSnapshot?: string;
}

export class AceyStabilityModule {
  private skills: SkillModule[] = [];
  private resourceMonitor: ResourceMonitor;
  private watchdog: Watchdog;
  private scheduler: Scheduler;
  private llmValidator: LLMValidator;
  private logger: Logger;
  private rollbackManager: RollbackManager;
  private active: boolean = false;
  private startTime: number = 0;
  private emergencyMode: boolean = false;

  constructor(private config: StabilityConfig) {
    this.logger = new Logger('AceyStability');
    this.resourceMonitor = new ResourceMonitor(config.resourceThresholds);
    this.rollbackManager = new RollbackManager(config.snapshotIntervalMs);
    this.llmValidator = new LLMValidator();
    this.scheduler = new Scheduler(this);
    this.watchdog = new Watchdog(this);
    
    this.logger.log('Acey Stability Module initialized');
  }

  // Add a skill to be supervised
  addSkill(skill: SkillModule): void {
    this.skills.push(skill);
    this.logger.log(`Skill added: ${skill.name}`);
  }

  // Start Acey Engine
  async start(): Promise<void> {
    if (this.active) {
      this.logger.warn('Acey already active');
      return;
    }

    this.logger.log('Starting Acey Engine...');
    this.startTime = Date.now();
    this.emergencyMode = false;

    try {
      // Start resource monitoring
      this.resourceMonitor.start();
      
      // Start all skills
      for (const skill of this.skills) {
        await this.startSkill(skill);
      }
      
      // Start scheduler
      this.scheduler.start();
      
      // Start watchdog
      this.watchdog.start();
      
      this.active = true;
      this.logger.log('Acey Engine started successfully');
      
      // Save initial snapshot
      await this.rollbackManager.saveSnapshot();
      
    } catch (error) {
      this.logger.error(`Failed to start Acey: ${error.message}`);
      await this.emergencyStop();
      throw error;
    }
  }

  // Stop Acey Engine gracefully
  async stop(): Promise<void> {
    if (!this.active) {
      this.logger.warn('Acey already stopped');
      return;
    }

    this.logger.log('Stopping Acey Engine...');

    try {
      // Stop scheduler first
      this.scheduler.stop();
      
      // Stop watchdog
      this.watchdog.stop();
      
      // Stop all skills gracefully
      for (const skill of this.skills) {
        await this.stopSkill(skill);
      }
      
      // Stop resource monitoring
      this.resourceMonitor.stop();
      
      // Save final snapshot
      await this.rollbackManager.saveSnapshot();
      
      this.active = false;
      this.logger.log('Acey Engine stopped successfully');
      
    } catch (error) {
      this.logger.error(`Error during shutdown: ${error.message}`);
      throw error;
    }
  }

  // Emergency stop for critical situations
  async emergencyStop(): Promise<void> {
    if (this.emergencyMode) {
      return; // Already in emergency mode
    }

    this.emergencyMode = true;
    this.logger.error('EMERGENCY STOP INITIATED');

    try {
      // Force stop all components
      this.scheduler.forceStop();
      this.watchdog.forceStop();
      
      // Force stop all skills
      for (const skill of this.skills) {
        await skill.forceStop();
      }
      
      this.resourceMonitor.stop();
      this.active = false;
      
      this.logger.error('Emergency stop completed');
      
    } catch (error) {
      this.logger.error(`Emergency stop failed: ${error.message}`);
    }
  }

  // Start individual skill
  private async startSkill(skill: SkillModule): Promise<void> {
    try {
      await skill.start();
      this.logger.log(`Skill started: ${skill.name}`);
    } catch (error) {
      this.logger.error(`Failed to start skill ${skill.name}: ${error.message}`);
      throw error;
    }
  }

  // Stop individual skill
  private async stopSkill(skill: SkillModule): Promise<void> {
    try {
      await skill.stop();
      this.logger.log(`Skill stopped: ${skill.name}`);
    } catch (error) {
      this.logger.error(`Failed to stop skill ${skill.name}: ${error.message}`);
    }
  }

  // Check health of all skills
  async checkSkillsHealth(): Promise<void> {
    for (const skill of this.skills) {
      try {
        if (!skill.isHealthy()) {
          this.logger.warn(`Skill ${skill.name} unhealthy, attempting restart...`);
          await skill.restart();
        }
      } catch (error) {
        this.logger.error(`Failed to restart skill ${skill.name}: ${error.message}`);
      }
    }
  }

  // Approve LLM output for learning
  async approveOutput(skillName: string, outputId: string): Promise<void> {
    const skill = this.skills.find(s => s.name === skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    try {
      const output = skill.getOutputById(outputId);
      if (!output) {
        throw new Error(`Output not found: ${outputId}`);
      }

      if (this.llmValidator.validate(output)) {
        await this.rollbackManager.storeApprovedOutput(output);
        this.logger.log(`Output ${outputId} approved for learning`);
      } else {
        this.logger.warn(`Output ${outputId} failed validation`);
        throw new Error('Output validation failed');
      }
    } catch (error) {
      this.logger.error(`Failed to approve output ${outputId}: ${error.message}`);
      throw error;
    }
  }

  // Get current system status
  getStatus(): SystemStatus {
    return {
      active: this.active,
      uptime: this.active ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
      resources: this.resourceMonitor.getCurrentUsage(),
      skills: this.skills.map(skill => ({
        name: skill.name,
        healthy: skill.isHealthy(),
        uptime: skill.getUptime(),
        lastError: skill.getLastError()
      })),
      llmConnections: this.skills.filter(s => s.isLLMConnected()).length,
      lastSnapshot: this.rollbackManager.getLastSnapshotTime()
    };
  }

  // Handle resource threshold exceeded
  async handleResourceThresholdExceeded(resources: any): Promise<void> {
    this.logger.warn(`Resource thresholds exceeded: CPU ${resources.cpu}%, RAM ${resources.ram}%`);
    
    if (this.config.autoThrottleEnabled) {
      // Throttle non-critical skills
      const nonCriticalSkills = this.skills.filter(s => !s.isCritical());
      for (const skill of nonCriticalSkills) {
        await skill.throttle();
      }
    }

    // Check if emergency shutdown is needed
    if (resources.cpu > this.config.emergencyShutdownThreshold || 
        resources.ram > this.config.emergencyShutdownThreshold) {
      await this.emergencyStop();
    }
  }

  // Restart specific skill
  async restartSkill(skillName: string): Promise<void> {
    const skill = this.skills.find(s => s.name === skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    try {
      await skill.restart();
      this.logger.log(`Skill ${skillName} restarted successfully`);
    } catch (error) {
      this.logger.error(`Failed to restart skill ${skillName}: ${error.message}`);
      throw error;
    }
  }

  // Get available skills for mobile API
  getAvailableSkills(): Array<{name: string, tier: string, description: string}> {
    return this.skills.map(skill => ({
      name: skill.name,
      tier: skill.getRequiredTier(),
      description: skill.getDescription()
    }));
  }

  // Install new skill
  async installSkill(skillName: string): Promise<void> {
    // Implementation would load and install skill dynamically
    this.logger.log(`Skill installation requested: ${skillName}`);
    // This would integrate with skill loading system
  }

  // Remove skill
  async removeSkill(skillName: string): Promise<void> {
    const skillIndex = this.skills.findIndex(s => s.name === skillName);
    if (skillIndex === -1) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const skill = this.skills[skillIndex];
    try {
      await skill.stop();
      this.skills.splice(skillIndex, 1);
      this.logger.log(`Skill ${skillName} removed successfully`);
    } catch (error) {
      this.logger.error(`Failed to remove skill ${skillName}: ${error.message}`);
      throw error;
    }
  }

  // Get pending approvals
  getPendingApprovals(): Array<{skillName: string, outputId: string, timestamp: number}> {
    const pending: Array<{skillName: string, outputId: string, timestamp: number}> = [];
    
    for (const skill of this.skills) {
      const outputs = skill.getPendingOutputs();
      for (const output of outputs) {
        pending.push({
          skillName: skill.name,
          outputId: output.id,
          timestamp: output.timestamp
        });
      }
    }
    
    return pending;
  }

  // Get financial summary
  getFinancialSummary(): any {
    // This would integrate with financial ops module
    return {
      totalRevenue: 0, // Would come from financial ops
      pendingPayouts: 0,
      forecast: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Check if system is healthy
  isSystemHealthy(): boolean {
    if (!this.active) return true; // Inactive system is "healthy"
    
    const resourceStatus = this.resourceMonitor.getCurrentUsage();
    const skillsHealthy = this.skills.every(skill => skill.isHealthy());
    
    return !resourceStatus.exceedsThresholds && skillsHealthy;
  }

  // Get logger instance
  getLogger(): Logger {
    return this.logger;
  }

  // Get rollback manager
  getRollbackManager(): RollbackManager {
    return this.rollbackManager;
  }
}
