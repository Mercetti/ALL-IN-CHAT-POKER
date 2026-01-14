/**
 * Permission-Gated Acey Skill Store
 * Modular AI platform with secure skill management
 */

export interface PermissionScope {
  id: string;
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
}

export interface AceySkill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  capabilities: PermissionScope[];
  trustRequired: number; // 1-10 scale
  sandboxed: boolean;
  status: 'PENDING' | 'APPROVED' | 'INSTALLED' | 'DISABLED' | 'REVOKED';
  createdAt: number;
  updatedAt: number;
  installCount: number;
  rating: number;
  metadata: {
    category: string;
    tags: string[];
    dependencies: string[];
    fileSize: number;
    lastUsed?: number;
  };
}

export interface SkillInstallation {
  skillId: string;
  tenantId: string;
  installedAt: number;
  installedBy: string;
  configuration: Record<string, any>;
  permissions: string[];
  usage: {
    totalUses: number;
    lastUsed: number;
    averageExecutionTime: number;
  };
}

export interface SkillReview {
  id: string;
  skillId: string;
  reviewer: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string;
  securityScore: number;
  performanceScore: number;
  reviewedAt: number;
}

export interface SkillExecution {
  skillId: string;
  tenantId: string;
  userId: string;
  input: any;
  output: any;
  executionTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
  permissions: string[];
}

class SkillStoreService {
  private skills = new Map<string, AceySkill>();
  private installations = new Map<string, SkillInstallation>();
  private reviews = new Map<string, SkillReview>();
  private executions: SkillExecution[] = [];
  
  // Predefined permission scopes
  private permissionScopes: PermissionScope[] = [
    {
      id: 'AUDIO_GENERATION',
      name: 'Audio Generation',
      description: 'Generate audio content',
      riskLevel: 'MEDIUM',
      requiresApproval: true
    },
    {
      id: 'FILE_WRITE',
      name: 'File Write Access',
      description: 'Write files to system',
      riskLevel: 'HIGH',
      requiresApproval: true
    },
    {
      id: 'NETWORK_ACCESS',
      name: 'Network Access',
      description: 'Access external networks',
      riskLevel: 'CRITICAL',
      requiresApproval: true
    },
    {
      id: 'USER_DATA_READ',
      name: 'User Data Read',
      description: 'Read user data',
      riskLevel: 'MEDIUM',
      requiresApproval: true
    },
    {
      id: 'SYSTEM_CONFIG',
      name: 'System Configuration',
      description: 'Modify system settings',
      riskLevel: 'CRITICAL',
      requiresApproval: true
    },
    {
      id: 'API_ACCESS',
      name: 'API Access',
      description: 'Access external APIs',
      riskLevel: 'HIGH',
      requiresApproval: true
    }
  ];

  constructor() {
    this.initializeDefaultSkills();
  }

  /**
   * Initialize default skills
   */
  private initializeDefaultSkills(): void {
    const defaultSkills: Omit<AceySkill, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Twitch Hype Engine',
        description: 'Generate hype content for Twitch streams',
        version: '1.0.0',
        author: 'Acey Team',
        capabilities: [
          this.permissionScopes.find(s => s.id === 'AUDIO_GENERATION')!,
          this.permissionScopes.find(s => s.id === 'USER_DATA_READ')!
        ],
        trustRequired: 3,
        sandboxed: true,
        status: 'APPROVED',
        installCount: 0,
        rating: 4.5,
        metadata: {
          category: 'Entertainment',
          tags: ['twitch', 'hype', 'audio'],
          dependencies: [],
          fileSize: 1024 * 1024 // 1MB
        }
      },
      {
        name: 'Audio Stinger Generator',
        description: 'Create audio stingers for stream transitions',
        version: '1.2.0',
        author: 'AudioDev',
        capabilities: [
          this.permissionScopes.find(s => s.id === 'AUDIO_GENERATION')!,
          this.permissionScopes.find(s => s.id === 'FILE_WRITE')!
        ],
        trustRequired: 4,
        sandboxed: true,
        status: 'APPROVED',
        installCount: 0,
        rating: 4.8,
        metadata: {
          category: 'Audio',
          tags: ['audio', 'stinger', 'transition'],
          dependencies: [],
          fileSize: 2 * 1024 * 1024 // 2MB
        }
      },
      {
        name: 'UI Auto-Fixer',
        description: 'Automatically fix common UI issues',
        version: '2.0.0',
        author: 'UI Solutions',
        capabilities: [
          this.permissionScopes.find(s => s.id === 'SYSTEM_CONFIG')!
        ],
        trustRequired: 6,
        sandboxed: true,
        status: 'APPROVED',
        installCount: 0,
        rating: 4.2,
        metadata: {
          category: 'Development',
          tags: ['ui', 'fix', 'automation'],
          dependencies: [],
          fileSize: 512 * 1024 // 512KB
        }
      },
      {
        name: 'Moderation Assistant',
        description: 'AI-powered content moderation',
        version: '1.5.0',
        author: 'SafetyFirst',
        capabilities: [
          this.permissionScopes.find(s => s.id === 'USER_DATA_READ')!,
          this.permissionScopes.find(s => s.id === 'API_ACCESS')!
        ],
        trustRequired: 7,
        sandboxed: true,
        status: 'APPROVED',
        installCount: 0,
        rating: 4.6,
        metadata: {
          category: 'Safety',
          tags: ['moderation', 'safety', 'ai'],
          dependencies: [],
          fileSize: 3 * 1024 * 1024 // 3MB
        }
      }
    ];

    defaultSkills.forEach(skillData => {
      const skill: AceySkill = {
        ...skillData,
        id: this.generateSkillId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.skills.set(skill.id, skill);
    });
  }

  /**
   * Upload new skill
   */
  async uploadSkill(skillData: Omit<AceySkill, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'installCount' | 'rating'>): Promise<AceySkill> {
    const skillId = this.generateSkillId();
    
    // Validate skill
    this.validateSkill(skillData);
    
    const skill: AceySkill = {
      ...skillData,
      id: skillId,
      status: 'PENDING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      installCount: 0,
      rating: 0
    };

    this.skills.set(skillId, skill);
    
    // Create review request
    await this.createReviewRequest(skillId);
    
    return skill;
  }

  /**
   * Validate skill data
   */
  private validateSkill(skillData: Omit<AceySkill, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'installCount' | 'rating'>): void {
    if (!skillData.name || skillData.name.trim().length === 0) {
      throw new Error('Skill name is required');
    }
    
    if (!skillData.description || skillData.description.trim().length === 0) {
      throw new Error('Skill description is required');
    }
    
    if (!skillData.capabilities || skillData.capabilities.length === 0) {
      throw new Error('Skill must have at least one capability');
    }
    
    if (skillData.trustRequired < 1 || skillData.trustRequired > 10) {
      throw new Error('Trust level must be between 1 and 10');
    }
    
    // Check for critical permissions
    const hasCriticalPermissions = skillData.capabilities.some(cap => cap.riskLevel === 'CRITICAL');
    if (hasCriticalPermissions && skillData.trustRequired < 8) {
      throw new Error('Skills with critical permissions require trust level 8 or higher');
    }
  }

  /**
   * Create review request for skill
   */
  private async createReviewRequest(skillId: string): Promise<void> {
    const review: SkillReview = {
      id: this.generateReviewId(),
      skillId,
      reviewer: 'system',
      status: 'PENDING',
      comments: 'Awaiting security and performance review',
      securityScore: 0,
      performanceScore: 0,
      reviewedAt: Date.now()
    };
    
    this.reviews.set(review.id, review);
  }

  /**
   * Review skill
   */
  async reviewSkill(reviewId: string, reviewer: string, status: 'APPROVED' | 'REJECTED', comments: string, securityScore: number, performanceScore: number): Promise<SkillReview> {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    const updatedReview: SkillReview = {
      ...review,
      reviewer,
      status,
      comments,
      securityScore,
      performanceScore,
      reviewedAt: Date.now()
    };
    
    this.reviews.set(reviewId, updatedReview);
    
    // Update skill status based on review
    const skill = this.skills.get(review.skillId);
    if (skill) {
      skill.status = status === 'APPROVED' ? 'APPROVED' : 'PENDING';
      skill.updatedAt = Date.now();
      this.skills.set(review.skillId, skill);
    }
    
    return updatedReview;
  }

  /**
   * Install skill for tenant
   */
  async installSkill(skillId: string, tenantId: string, userId: string, configuration: Record<string, any> = {}): Promise<SkillInstallation> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    if (skill.status !== 'APPROVED') {
      throw new Error('Skill must be approved before installation');
    }
    
    // Check tenant trust level
    const tenantTrustLevel = this.getTenantTrustLevel(tenantId);
    if (tenantTrustLevel < skill.trustRequired) {
      throw new Error(`Tenant trust level ${tenantTrustLevel} is insufficient for skill requiring level ${skill.trustRequired}`);
    }
    
    const installationId = `${skillId}_${tenantId}`;
    const installation: SkillInstallation = {
      skillId,
      tenantId,
      installedAt: Date.now(),
      installedBy: userId,
      configuration,
      permissions: skill.capabilities.map(cap => cap.id),
      usage: {
        totalUses: 0,
        lastUsed: 0,
        averageExecutionTime: 0
      }
    };
    
    this.installations.set(installationId, installation);
    
    // Update skill install count
    skill.installCount++;
    skill.updatedAt = Date.now();
    this.skills.set(skillId, skill);
    
    return installation;
  }

  /**
   * Execute skill
   */
  async executeSkill(skillId: string, tenantId: string, userId: string, input: any): Promise<SkillExecution> {
    const installationId = `${skillId}_${tenantId}`;
    const installation = this.installations.get(installationId);
    
    if (!installation) {
      throw new Error('Skill not installed for this tenant');
    }
    
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    if (skill.status !== 'APPROVED') {
      throw new Error('Skill is not approved for execution');
    }
    
    const startTime = Date.now();
    let success = false;
    let output: any;
    let error: string | undefined;
    
    try {
      // In a real implementation, this would execute the actual skill
      // For demo purposes, we'll simulate execution
      output = await this.simulateSkillExecution(skill, input, installation);
      success = true;
      
      // Update usage statistics
      installation.usage.totalUses++;
      installation.usage.lastUsed = Date.now();
      installation.usage.averageExecutionTime = 
        (installation.usage.averageExecutionTime * (installation.usage.totalUses - 1) + (Date.now() - startTime)) / 
        installation.usage.totalUses;
      
      this.installations.set(installationId, installation);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      success = false;
    }
    
    const execution: SkillExecution = {
      skillId,
      tenantId,
      userId,
      input,
      output,
      executionTime: Date.now() - startTime,
      success,
      error,
      timestamp: Date.now(),
      permissions: installation.permissions
    };
    
    this.executions.push(execution);
    
    // Keep only last 1000 executions
    if (this.executions.length > 1000) {
      this.executions = this.executions.slice(-1000);
    }
    
    return execution;
  }

  /**
   * Get available skills
   */
  getAvailableSkills(tenantId?: string): AceySkill[] {
    const skills = Array.from(this.skills.values()).filter(skill => skill.status === 'APPROVED');
    
    if (!tenantId) {
      return skills;
    }
    
    const tenantTrustLevel = this.getTenantTrustLevel(tenantId);
    return skills.filter(skill => skill.trustRequired <= tenantTrustLevel);
  }

  /**
   * Get installed skills for tenant
   */
  getInstalledSkills(tenantId: string): (SkillInstallation & { skill: AceySkill })[] {
    const installedSkills: (SkillInstallation & { skill: AceySkill })[] = [];
    
    for (const installation of this.installations.values()) {
      if (installation.tenantId === tenantId) {
        const skill = this.skills.get(installation.skillId);
        if (skill) {
          installedSkills.push({ ...installation, skill });
        }
      }
    }
    
    return installedSkills;
  }

  /**
   * Get skill execution history
   */
  getExecutionHistory(skillId?: string, tenantId?: string, limit?: number): SkillExecution[] {
    let executions = [...this.executions];
    
    if (skillId) {
      executions = executions.filter(exec => exec.skillId === skillId);
    }
    
    if (tenantId) {
      executions = executions.filter(exec => exec.tenantId === tenantId);
    }
    
    executions.sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? executions.slice(0, limit) : executions;
  }

  /**
   * Get skill statistics
   */
  getSkillStats(skillId: string): {
    totalInstalls: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    lastUsed: number;
  } | null {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return null;
    }
    
    const executions = this.executions.filter(exec => exec.skillId === skillId);
    const successfulExecutions = executions.filter(exec => exec.success);
    
    const totalInstalls = skill.installCount;
    const totalExecutions = executions.length;
    const successRate = totalExecutions > 0 ? (successfulExecutions.length / totalExecutions) * 100 : 0;
    const averageExecutionTime = totalExecutions > 0 
      ? executions.reduce((sum, exec) => sum + exec.executionTime, 0) / totalExecutions 
      : 0;
    const lastUsed = executions.length > 0 ? Math.max(...executions.map(exec => exec.timestamp)) : 0;
    
    return {
      totalInstalls,
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      lastUsed
    };
  }

  /**
   * Get permission scopes
   */
  getPermissionScopes(): PermissionScope[] {
    return [...this.permissionScopes];
  }

  /**
   * Private helper methods
   */
  private generateSkillId(): string {
    return `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTenantTrustLevel(tenantId: string): number {
    // In a real implementation, this would fetch from tenant service
    // For demo, return a default trust level
    return 5;
  }

  private async simulateSkillExecution(skill: AceySkill, input: any, installation: SkillInstallation): Promise<any> {
    // Simulate skill execution based on capabilities
    const result: any = {
      success: true,
      message: `${skill.name} executed successfully`,
      data: input
    };
    
    // Add capability-specific results
    for (const capability of skill.capabilities) {
      switch (capability.id) {
        case 'AUDIO_GENERATION':
          result.audioGenerated = true;
          result.duration = '5 seconds';
          break;
        case 'FILE_WRITE':
          result.fileWritten = true;
          result.filePath = `/tmp/${skill.name}_${Date.now()}.txt`;
          break;
        case 'USER_DATA_READ':
          result.userDataAccessed = true;
          result.recordsCount = 10;
          break;
      }
    }
    
    return result;
  }
}

export const skillStoreService = new SkillStoreService();
