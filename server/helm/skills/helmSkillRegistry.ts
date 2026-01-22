/**
 * Helm Skill Registry - Core Skill Management
 * Manages available skills and their metadata for the Helm Control engine
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  isActive: boolean;
  permissions?: string[];
  version?: string;
  dependencies?: string[];
}

export interface SkillExecution {
  skillId: string;
  parameters: Record<string, any>;
  userId: string;
  timestamp: number;
  requestId: string;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  metadata: Record<string, any>;
}

export class HelmSkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private executions: Map<string, SkillExecution> = new Map();
  private results: Map<string, SkillResult> = new Map();

  constructor() {
    this.initializeDefaultSkills();
  }

  private initializeDefaultSkills(): void {
    const defaultSkills: Skill[] = [
      {
        id: 'basic_chat',
        name: 'Basic Chat',
        description: 'Simple chat interaction and conversation',
        tier: 'free',
        category: 'communication',
        isActive: true,
        permissions: ['chat'],
        version: '1.0.0'
      },
      {
        id: 'poker_deal',
        name: 'Deal Cards',
        description: 'Deal poker hands and manage game state',
        tier: 'creator',
        category: 'gaming',
        isActive: true,
        permissions: ['game_control'],
        version: '1.0.0'
      },
      {
        id: 'poker_bet',
        name: 'Place Bet',
        description: 'Place poker bets and manage wagers',
        tier: 'creator',
        category: 'gaming',
        isActive: true,
        permissions: ['financial_readonly'],
        version: '1.0.0'
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'System analytics and performance monitoring',
        tier: 'creator+',
        category: 'monitoring',
        isActive: true,
        permissions: ['analytics_read'],
        version: '1.0.0'
      },
      {
        id: 'monitoring',
        name: 'System Monitoring',
        description: 'Real-time system monitoring and health checks',
        tier: 'enterprise',
        category: 'monitoring',
        isActive: true,
        permissions: ['system_monitor'],
        version: '1.0.0'
      },
      {
        id: 'audio_engine',
        name: 'Audio Engine',
        description: 'Audio processing and streaming capabilities',
        tier: 'creator',
        category: 'media',
        isActive: true,
        permissions: ['audio_control'],
        version: '1.0.0'
      },
      {
        id: 'stream_management',
        name: 'Stream Management',
        description: 'Live streaming control and configuration',
        tier: 'creator',
        category: 'streaming',
        isActive: true,
        permissions: ['stream_control'],
        version: '1.0.0'
      },
      {
        id: 'content_moderation',
        name: 'Content Moderation',
        description: 'AI-powered content moderation and filtering',
        tier: 'enterprise',
        category: 'safety',
        isActive: true,
        permissions: ['moderation_assist'],
        version: '1.0.0'
      },
      {
        id: 'user_management',
        name: 'User Management',
        description: 'User account management and permissions',
        tier: 'enterprise',
        category: 'admin',
        isActive: true,
        permissions: ['user_admin'],
        version: '1.0.0'
      },
      {
        id: 'data_export',
        name: 'Data Export',
        description: 'Export system data and analytics reports',
        tier: 'enterprise',
        category: 'data',
        isActive: true,
        permissions: ['data_export'],
        version: '1.0.0'
      }
    ];

    defaultSkills.forEach(skill => {
      this.skills.set(skill.id, skill);
  }

  // Skill Management
  listPublic(): Skill[] {
    return Array.from(this.skills.values()).filter(skill => skill.isActive);
  }

  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  unregisterSkill(id: string): boolean {
    return this.skills.delete(id);
  }

  updateSkill(id: string, updates: Partial<Skill>): boolean {
    const skill = this.skills.get(id);
    if (skill) {
      Object.assign(skill, updates);
      return true;
    }
    return false;
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.listPublic().filter(skill => skill.category === category);
  }

  getSkillsByTier(tier: string): Skill[] {
    return this.listPublic().filter(skill => skill.tier === tier);
  }

  getSkillsByPermission(permission: string): Skill[] {
    return this.listPublic().filter(skill => 
      skill.permissions && skill.permissions.includes(permission)
    );
  }

  // Skill Execution
  canExecuteSkill(skillId: string, userPermissions: string[]): boolean {
    const skill = this.getSkill(skillId);
    if (!skill || !skill.isActive) {
      return false;
    }

    if (!skill.permissions || skill.permissions.length === 0) {
      return true; // No permissions required
    }

    return skill.permissions.some(permission => userPermissions.includes(permission));
  }

  executeSkill(execution: SkillExecution): Promise<SkillResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Store execution record
      this.executions.set(execution.requestId, execution);

      // Simulate skill execution (in real implementation, this would call the actual skill)
      setTimeout(() => {
        const result: SkillResult = {
          success: true,
          data: { message: `Skill ${execution.skillId} executed successfully` },
          executionTime: Date.now() - startTime,
          metadata: {
            skillId: execution.skillId,
            userId: execution.userId,
            timestamp: execution.timestamp
          }
        };

        this.results.set(execution.requestId, result);
        resolve(result);
      }, 100);
  }

  // Analytics and Monitoring
  getExecution(requestId: string): SkillExecution | undefined {
    return this.executions.get(requestId);
  }

  getResult(requestId: string): SkillResult | undefined {
    return this.results.get(requestId);
  }

  getExecutionHistory(userId?: string): SkillExecution[] {
    const executions = Array.from(this.executions.values());
    return userId ? executions.filter(exec => exec.userId === userId) : executions;
  }

  getSkillUsageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    Array.from(this.executions.values()).forEach(execution => {
      stats[execution.skillId] = (stats[execution.skillId] || 0) + 1;
    });

    return stats;
  }

  // Health and Diagnostics
  getRegistryStats(): {
    totalSkills: number;
    activeSkills: number;
    totalExecutions: number;
    categories: string[];
    tiers: string[];
  } {
    const skills = Array.from(this.skills.values());
    const activeSkills = skills.filter(skill => skill.isActive);
    
    return {
      totalSkills: skills.length,
      activeSkills: activeSkills.length,
      totalExecutions: this.executions.size,
      categories: [...new Set(skills.map(skill => skill.category))],
      tiers: [...new Set(skills.map(skill => skill.tier))]
    };
  }

  validateSkill(skill: Skill): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!skill.id || skill.id.trim() === '') {
      errors.push('Skill ID is required');
    }

    if (!skill.name || skill.name.trim() === '') {
      errors.push('Skill name is required');
    }

    if (!skill.description || skill.description.trim() === '') {
      errors.push('Skill description is required');
    }

    if (!skill.tier || skill.tier.trim() === '') {
      errors.push('Skill tier is required');
    }

    if (!skill.category || skill.category.trim() === '') {
      errors.push('Skill category is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Cleanup and Maintenance
  cleanup(): void {
    // Remove executions older than 24 hours
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [requestId, execution] of this.executions.entries()) {
      if (execution.timestamp < cutoffTime) {
        this.executions.delete(requestId);
        this.results.delete(requestId);
      }
    }
  }
}

// Export singleton instance
export const helmSkillRegistry = new HelmSkillRegistry();

// Compatibility alias for migration
export const AceySkillRegistry = HelmSkillRegistry;
