import { SkillModule } from './skillModule';
import { SecurityModule } from './security';
import { DatasetManager } from './dataset';
import { LLMController } from './llmController';
import { MonetizationManager } from './monetization';
import { Logger } from '../utils/logger';

export interface User {
  id: string;
  role: 'owner' | 'dev' | 'user' | 'partner' | 'investor';
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  permissions: string[];
  trustScore: number;
}

export interface ExecutionContext {
  user: User;
  skill: SkillModule;
  input: any;
  dryRun?: boolean;
  timestamp: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  requiresApproval: boolean;
  logged: boolean;
}

export class Orchestrator {
  private skills: Map<string, SkillModule> = new Map();
  private security: SecurityModule;
  private dataset: DatasetManager;
  private llm: LLMController;
  private monetization: MonetizationManager;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    this.security = new SecurityModule(this.logger);
    this.dataset = new DatasetManager(this.logger);
    this.llm = new LLMController(this.dataset, this.logger);
    this.monetization = new MonetizationManager(this);
  }

  /**
   * Register a new skill module
   */
  registerSkill(skill: SkillModule): void {
    this.skills.set(skill.name, skill);
    this.logger.log(`Skill registered: ${skill.name}`);
  }

  /**
   * Get list of available skills for user role
   */
  listSkills(role: string): SkillModule[] {
    return Array.from(this.skills.values()).filter(skill => {
      // Filter skills based on role and tier
      if (role === 'user') {
        return skill.name !== 'Partner Payout' && skill.name !== 'Analytics & Reporting';
      }
      return true;
    });
  }

  /**
   * Execute a skill with full security and approval workflow
   */
  async executeSkill(skillName: string, input: any, userRole: string, dryRun = false): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validate skill exists
      const skill = this.skills.get(skillName);
      if (!skill) {
        throw new Error(`Skill not found: ${skillName}`);
      }

      // 2. Create execution context
      const context: ExecutionContext = {
        user: { id: 'temp', role: userRole as any, tier: 'Free', permissions: [], trustScore: 100 },
        skill,
        input,
        dryRun,
        timestamp: new Date().toISOString()
      };

      // 3. Security validation
      this.security.monitorAction(`execute_skill:${skillName}`, userRole);

      // 4. Monetization check
      if (!this.monetization.canAccessSkill(context.user.tier, skill)) {
        throw new Error(`Skill ${skillName} requires tier upgrade`);
      }

      // 5. Generate LLM prompt and execute
      const prompt = await this.llm.generatePrompt(skill, input, userRole);
      
      let output;
      if (dryRun) {
        output = { type: 'simulation', message: 'Dry run - no actual execution', prompt };
      } else {
        output = await skill.run(input);
        
        // 6. Log to dataset for continuous learning
        this.dataset.add({
          skill: skill.name,
          input,
          output,
          userRole,
          timestamp: context.timestamp,
          approved: true
        });
      }

      const executionTime = Date.now() - startTime;

      // 7. Check if approval is required
      const requiresApproval = skill.name === 'Partner Payout' || 
                           skill.name === 'Code Helper' && 
                           context.user.role !== 'owner';

      const result: ExecutionResult = {
        success: true,
        output,
        executionTime,
        requiresApproval,
        logged: true
      };

      this.logger.log(`Skill executed: ${skillName} by ${userRole} in ${executionTime}ms`);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Skill execution failed: ${skillName}`, error);
      
      return {
        success: false,
        error: (error as Error).message,
        executionTime,
        requiresApproval: false,
        logged: true
      };
    }
  }

  /**
   * Get system status and metrics
   */
  getSystemStatus() {
    return {
      securityMode: this.security.getMode(),
      registeredSkills: this.skills.size,
      datasetSize: this.dataset.getAll().length,
      lastFineTune: this.dataset.getLastTrainingDate(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Trigger continuous learning if ready
   */
  async triggerLearningIfReady(): Promise<void> {
    await this.llm.fineTuneIfReady();
  }

  /**
   * Emergency lockdown
   */
  emergencyLockdown(reason: string): void {
    this.security.setMode('Red');
    this.logger.warn(`EMERGENCY LOCKDOWN: ${reason}`);
  }

  /**
   * Resume normal operations
   */
  resumeOperations(): void {
    this.security.setMode('Green');
    this.logger.log('Operations resumed to normal mode');
  }
}
