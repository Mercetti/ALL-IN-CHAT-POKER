/**
 * Helm Control Skill Registry v2 Implementation
 * Core orchestration engine for skill management, permissions, and execution
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SkillRegistry,
  SkillMetadata,
  SkillExecutionRequest,
  SkillExecutionResult,
  PermissionPolicy,
  SkillHealth,
  SkillAnalytics,
  AuditEntry,
  ResourceUsage,
  SKILL_CATEGORIES,
  PERMISSION_LEVELS,
  USER_TIERS,
  EXECUTION_CONTEXTS
} from '../interfaces/skill-registry-v2';

export class HelmControlSkillRegistry extends EventEmitter implements SkillRegistry {
  private skills: Map<string, SkillMetadata> = new Map();
  private permissions: Map<string, PermissionPolicy[]> = new Map();
  private executionHistory: Map<string, SkillExecutionResult[]> = new Map();
  private healthStatus: Map<string, SkillHealth> = new Map();
  private auditLog: AuditEntry[] = [];
  private resourceUsage: Map<string, ResourceUsage> = new Map();
  
  private readonly dataPath: string;
  private readonly auditPath: string;
  private readonly skillsPath: string;
  private readonly permissionsPath: string;

  constructor(dataPath: string = './helm-control-data') {
    super();
    this.dataPath = dataPath;
    this.auditPath = path.join(dataPath, 'audit.json');
    this.skillsPath = path.join(dataPath, 'skills.json');
    this.permissionsPath = path.join(dataPath, 'permissions.json');
    
    this.initializeDataDirectories();
    this.loadExistingData();
  }

  // ===== CORE REGISTRY METHODS =====

  async registerSkill(skill: SkillMetadata): Promise<boolean> {
    try {
      // Validate skill metadata
      const validation = this.validateSkillMetadata(skill);
      if (!validation.valid) {
        this.emit('error', { type: 'validation', errors: validation.errors });
        return false;
      }

      // Check for conflicts
      const conflicts = this.skills.get(skill.id);
      if (conflicts) {
        this.emit('error', { type: 'conflict', skillId: skill.id });
        return false;
      }

      // Register skill
      this.skills.set(skill.id, skill);
      
      // Initialize health tracking
      this.healthStatus.set(skill.id, {
        skillId: skill.id,
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        consecutiveFailures: 0,
        uptime: 0,
        averageResponseTime: 0,
        errorRate: 0
      });

      // Initialize resource tracking
      this.resourceUsage.set(skill.id, {
        memory: { average: 0, peak: 0, limit: skill.execution.resourceLimits.memory },
        cpu: { average: 0, peak: 0, limit: skill.execution.resourceLimits.cpu },
        network: { requests: 0, bandwidth: 0 }
      });

      // Save to disk
      await this.saveSkills();
      
      // Log registration
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'skill_registered',
        userId: 'system',
        skillId: skill.id,
        details: { version: skill.version, category: skill.category }
      });

      this.emit('skillRegistered', skill);
      return true;

    } catch (error) {
      this.emit('error', { type: 'registration', skillId: skill.id, error });
      return false;
    }
  }

  async unregisterSkill(skillId: string): Promise<boolean> {
    try {
      const skill = this.skills.get(skillId);
      if (!skill) {
        return false;
      }

      // Remove from registry
      this.skills.delete(skillId);
      this.healthStatus.delete(skillId);
      this.resourceUsage.delete(skillId);

      // Save changes
      await this.saveSkills();
      
      // Log unregistration
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'skill_unregistered',
        userId: 'system',
        skillId,
        details: { name: skill.name }
      });

      this.emit('skillUnregistered', skillId);
      return true;

    } catch (error) {
      this.emit('error', { type: 'unregistration', skillId, error });
      return false;
    }
  }

  async getSkill(skillId: string): Promise<SkillMetadata | null> {
    return this.skills.get(skillId) || null;
  }

  async listSkills(category?: string, userTier?: string): Promise<SkillMetadata[]> {
    let skills = Array.from(this.skills.values());

    // Filter by category
    if (category) {
      skills = skills.filter(skill => skill.category.id === category);
    }

    // Filter by user tier permissions
    if (userTier) {
      skills = skills.filter(skill => {
        const permissions = skill.permissions;
        if (userTier === USER_TIERS.FREE) return permissions.user;
        if (userTier === USER_TIERS.PRO) return permissions.admin || permissions.user;
        if (userTier === USER_TIERS.ENTERPRISE) return permissions.owner || permissions.admin || permissions.user;
        return false;
      });
    }

    return skills;
  }

  // ===== PERMISSION MANAGEMENT =====

  async checkPermission(skillId: string, userId: string, userTier: string): Promise<boolean> {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Check basic permission level
    const permissions = skill.permissions;
    let hasPermission = false;

    switch (userTier) {
      case USER_TIERS.ENTERPRISE:
        hasPermission = permissions.owner || permissions.admin || permissions.user;
        break;
      case USER_TIERS.PRO:
        hasPermission = permissions.admin || permissions.user;
        break;
      case USER_TIERS.FREE:
        hasPermission = permissions.user;
        break;
      default:
        hasPermission = false;
    }

    // Check specific user permissions
    const userPermissions = this.permissions.get(userId) || [];
    const specificPermission = userPermissions.find(p => p.skillId === skillId);
    
    if (specificPermission) {
      hasPermission = specificPermission.grantedPermissions.length > 0;
    }

    return hasPermission;
  }

  async grantPermission(policy: PermissionPolicy): Promise<boolean> {
    try {
      const userPermissions = this.permissions.get(policy.userId) || [];
      userPermissions.push(policy);
      this.permissions.set(policy.userId, userPermissions);
      
      await this.savePermissions();
      
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'permission_granted',
        userId: policy.grantedBy,
        skillId: policy.skillId,
        details: { 
          targetUser: policy.userId,
          permissions: policy.grantedPermissions,
          tier: policy.userTier 
        }
      });

      this.emit('permissionGranted', policy);
      return true;

    } catch (error) {
      this.emit('error', { type: 'permission_grant', policy, error });
      return false;
    }
  }

  async revokePermission(skillId: string, userId: string): Promise<boolean> {
    try {
      const userPermissions = this.permissions.get(userId) || [];
      const filteredPermissions = userPermissions.filter(p => p.skillId !== skillId);
      this.permissions.set(userId, filteredPermissions);
      
      await this.savePermissions();
      
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'permission_revoked',
        userId: 'system',
        skillId,
        details: { targetUser: userId }
      });

      this.emit('permissionRevoked', { skillId, userId });
      return true;

    } catch (error) {
      this.emit('error', { type: 'permission_revoke', skillId, userId, error });
      return false;
    }
  }

  // ===== EXECUTION MANAGEMENT =====

  async executeSkill(request: SkillExecutionRequest): Promise<SkillExecutionResult> {
    const startTime = Date.now();
    const requestId = request.requestId || crypto.randomUUID();
    
    try {
      // Check permissions
      const hasPermission = await this.checkPermission(
        request.skillId, 
        request.userId, 
        request.userTier
      );
      
      if (!hasPermission) {
        return this.createErrorResult(request, requestId, 'Permission denied', startTime);
      }

      // Get skill metadata
      const skill = await this.getSkill(request.skillId);
      if (!skill) {
        return this.createErrorResult(request, requestId, 'Skill not found', startTime);
      }

      // Check execution context
      if (!skill.execution.allowedIn.includes(request.context.executionContext as any)) {
        return this.createErrorResult(request, requestId, 'Invalid execution context', startTime);
      }

      // Update health status
      this.updateHealthStatus(request.skillId, 'executing');

      // Execute skill (placeholder - actual implementation would load and execute skill)
      const result = await this.executeSkillInternal(request, skill);
      
      const executionTime = Date.now() - startTime;
      
      // Create execution result
      const executionResult: SkillExecutionResult = {
        success: true,
        skillId: request.skillId,
        requestId,
        result: result,
        executionTime,
        resourcesUsed: {
          memory: Math.random() * 100, // Placeholder
          cpu: Math.random() * 50, // Placeholder
          duration: executionTime
        },
        auditLog: [{
          timestamp: new Date().toISOString(),
          level: skill.logging.priority,
          action: 'skill_executed',
          userId: request.userId,
          skillId: request.skillId,
          details: { executionTime, success: true }
        }]
      };

      // Update history
      const history = this.executionHistory.get(request.skillId) || [];
      history.push(executionResult);
      this.executionHistory.set(request.skillId, history);

      // Update health status
      this.updateHealthStatus(request.skillId, 'healthy');

      // Log execution
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: skill.logging.priority,
        action: 'skill_executed',
        userId: request.userId,
        skillId: request.skillId,
        details: { 
          requestId, 
          executionTime, 
          success: true,
          context: request.context 
        }
      });

      this.emit('skillExecuted', executionResult);
      return executionResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Update health status
      this.updateHealthStatus(request.skillId, 'failed');

      const errorResult = this.createErrorResult(
        request, 
        requestId, 
        error instanceof Error ? error.message : 'Unknown error', 
        startTime
      );

      // Log error
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: 'critical',
        action: 'skill_execution_failed',
        userId: request.userId,
        skillId: request.skillId,
        details: { 
          requestId, 
          executionTime, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      this.emit('skillExecutionFailed', { request, error });
      return errorResult;
    }
  }

  async getExecutionHistory(skillId: string, userId?: string): Promise<SkillExecutionResult[]> {
    const history = this.executionHistory.get(skillId) || [];
    
    if (userId) {
      return history.filter(result => 
        result.auditLog.some(entry => entry.userId === userId)
      );
    }
    
    return history;
  }

  // ===== HEALTH AND MONITORING =====

  async getSkillHealth(skillId: string): Promise<SkillHealth> {
    return this.healthStatus.get(skillId) || {
      skillId,
      status: 'failed',
      lastHeartbeat: new Date().toISOString(),
      consecutiveFailures: 999,
      uptime: 0,
      averageResponseTime: 0,
      errorRate: 1.0
    };
  }

  async getAllHealth(): Promise<Record<string, SkillHealth>> {
    const health: Record<string, SkillHealth> = {};
    for (const [skillId, status] of this.healthStatus) {
      health[skillId] = status;
    }
    return health;
  }

  // ===== LEARNING AND UPDATES =====

  async updateSkill(skillId: string, updates: Partial<SkillMetadata>): Promise<boolean> {
    try {
      const skill = this.skills.get(skillId);
      if (!skill) return false;

      const updatedSkill = { ...skill, ...updates, lastUpdated: new Date().toISOString() };
      this.skills.set(skillId, updatedSkill);
      
      await this.saveSkills();
      
      this.logAudit({
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'skill_updated',
        userId: 'system',
        skillId,
        details: { updates: Object.keys(updates) }
      });

      this.emit('skillUpdated', updatedSkill);
      return true;

    } catch (error) {
      this.emit('error', { type: 'skill_update', skillId, error });
      return false;
    }
  }

  async getSkillAnalytics(skillId: string): Promise<SkillAnalytics> {
    const history = this.executionHistory.get(skillId) || [];
    const skill = this.skills.get(skillId);
    const resourceUsage = this.resourceUsage.get(skillId);

    if (!skill || !resourceUsage) {
      throw new Error(`Skill ${skillId} not found or no resource data available`);
    }

    const totalExecutions = history.length;
    const successfulExecutions = history.filter(h => h.success).length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
    const averageExecutionTime = totalExecutions > 0 
      ? history.reduce((sum, h) => sum + h.executionTime, 0) / totalExecutions 
      : 0;

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    history.forEach(h => {
      if (!h.success && h.error) {
        errorBreakdown[h.error] = (errorBreakdown[h.error] || 0) + 1;
      }
    });

    // User analysis
    const uniqueUsers = new Set(
      history.flatMap(h => h.auditLog.map(entry => entry.userId))
    ).size;

    const userTiers: Record<string, number> = {};
    const mostActiveUsers: string[] = [];

    return {
      skillId,
      usage: {
        totalExecutions,
        successRate,
        averageExecutionTime,
        errorBreakdown
      },
      users: {
        uniqueUsers,
        userTiers,
        mostActiveUsers
      },
      performance: {
        resourceUsage,
        bottlenecks: [], // Would be calculated based on performance metrics
        recommendations: [] // Would be generated based on analytics
      }
    };
  }

  // ===== PRIVATE METHODS =====

  private validateSkillMetadata(skill: SkillMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!skill.id || skill.id.trim() === '') {
      errors.push('Skill ID is required');
    }

    if (!skill.name || skill.name.trim() === '') {
      errors.push('Skill name is required');
    }

    if (!skill.version || skill.version.trim() === '') {
      errors.push('Version is required');
    }

    if (!skill.category || !SKILL_CATEGORIES.find(cat => cat.id === skill.category.id)) {
      errors.push('Valid category is required');
    }

    if (!skill.execution.allowedIn || skill.execution.allowedIn.length === 0) {
      errors.push('At least one execution context must be specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private createErrorResult(
    request: SkillExecutionRequest, 
    requestId: string, 
    error: string, 
    startTime: number
  ): SkillExecutionResult {
    return {
      success: false,
      skillId: request.skillId,
      requestId,
      result: null,
      error,
      executionTime: Date.now() - startTime,
      resourcesUsed: {
        memory: 0,
        cpu: 0,
        duration: Date.now() - startTime
      },
      auditLog: [{
        timestamp: new Date().toISOString(),
        level: 'critical',
        action: 'skill_execution_failed',
        userId: request.userId,
        skillId: request.skillId,
        details: { requestId, error }
      }]
    };
  }

  private async executeSkillInternal(request: SkillExecutionRequest, skill: SkillMetadata): Promise<any> {
    // Placeholder implementation
    // In a real system, this would load the skill module and execute it
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Skill ${skill.name} executed successfully`,
          parameters: request.parameters,
          context: request.context
        });
      }, Math.random() * 1000 + 500); // Simulate execution time
    });
  }

  private updateHealthStatus(skillId: string, status: 'healthy' | 'degraded' | 'failed' | 'executing'): void {
    const current = this.healthStatus.get(skillId);
    if (!current) return;

    if (status === 'failed') {
      current.consecutiveFailures++;
      current.errorRate = Math.min(1.0, current.errorRate + 0.1);
    } else if (status === 'healthy') {
      current.consecutiveFailures = 0;
      current.errorRate = Math.max(0, current.errorRate - 0.05);
    }

    current.status = status;
    current.lastHeartbeat = new Date().toISOString();
    this.healthStatus.set(skillId, current);
  }

  private logAudit(entry: AuditEntry): void {
    this.auditLog.push(entry);
    
    // Keep audit log manageable (last 10000 entries)
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  private async initializeDataDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
      await fs.mkdir(path.dirname(this.auditPath), { recursive: true });
      await fs.mkdir(path.dirname(this.skillsPath), { recursive: true });
      await fs.mkdir(path.dirname(this.permissionsPath), { recursive: true });
    } catch (error) {
      console.error('Failed to initialize data directories:', error);
    }
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load skills
      const skillsData = await fs.readFile(this.skillsPath, 'utf-8').catch(() => '[]');
      const skills = JSON.parse(skillsData);
      skills.forEach((skill: SkillMetadata) => {
        this.skills.set(skill.id, skill);
      });

      // Load permissions
      const permissionsData = await fs.readFile(this.permissionsPath, 'utf-8').catch(() => '[]');
      const permissions = JSON.parse(permissionsData);
      permissions.forEach((policy: PermissionPolicy) => {
        const userPermissions = this.permissions.get(policy.userId) || [];
        userPermissions.push(policy);
        this.permissions.set(policy.userId, userPermissions);
      });

      // Load audit log
      const auditData = await fs.readFile(this.auditPath, 'utf-8').catch(() => '[]');
      this.auditLog = JSON.parse(auditData);

      console.log(`Loaded ${this.skills.size} skills and ${this.permissions.size} permission policies`);
    } catch (error) {
      console.error('Failed to load existing data:', error);
    }
  }

  private async saveSkills(): Promise<void> {
    try {
      const skills = Array.from(this.skills.values());
      await fs.writeFile(this.skillsPath, JSON.stringify(skills, null, 2));
    } catch (error) {
      console.error('Failed to save skills:', error);
    }
  }

  private async savePermissions(): Promise<void> {
    try {
      const allPermissions: PermissionPolicy[] = [];
      for (const permissions of this.permissions.values()) {
        allPermissions.push(...permissions);
      }
      await fs.writeFile(this.permissionsPath, JSON.stringify(allPermissions, null, 2));
    } catch (error) {
      console.error('Failed to save permissions:', error);
    }
  }
}
