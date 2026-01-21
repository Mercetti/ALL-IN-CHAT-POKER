/**
 * Helm Security Module - Core Security and Policy Enforcement
 * Provides security, permissions, and audit logging for the Helm Control engine
 */

export interface User {
  id: string;
  username: string;
  role: 'owner' | 'admin' | 'user' | 'guest';
  permissions: string[];
  tier: string;
  isActive: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  isActive: boolean;
}

export interface SecurityRule {
  type: 'permission' | 'rate_limit' | 'content_filter' | 'resource_limit';
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'escalate';
  parameters?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityContext {
  user: User;
  request: {
    id: string;
    path: string;
    method: string;
    timestamp: number;
    ipAddress?: string;
    userAgent?: string;
  };
  permissions: string[];
  policies: SecurityPolicy[];
}

export class HelmSecurity {
  private users: Map<string, User> = new Map();
  private policies: Map<string, SecurityPolicy> = new Map();
  private auditLogs: AuditLog[] = [];
  private rateLimits: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
    this.initializeDefaultUsers();
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'basic_access',
        name: 'Basic Access Control',
        description: 'Controls basic access to system resources',
        rules: [
          {
            type: 'permission',
            condition: 'user.isActive == true',
            action: 'allow'
          },
          {
            type: 'permission',
            condition: 'user.role == "guest"',
            action: 'deny',
            parameters: { resources: ['admin', 'user_management'] }
          }
        ],
        isActive: true
      },
      {
        id: 'rate_limiting',
        name: 'Rate Limiting',
        description: 'Prevents abuse through rate limiting',
        rules: [
          {
            type: 'rate_limit',
            condition: 'user.role == "guest"',
            action: 'deny',
            parameters: { maxRequests: 10, windowMs: 60000 } // 10 requests per minute
          },
          {
            type: 'rate_limit',
            condition: 'user.role == "user"',
            action: 'deny',
            parameters: { maxRequests: 100, windowMs: 60000 } // 100 requests per minute
          }
        ],
        isActive: true
      },
      {
        id: 'content_filter',
        name: 'Content Filtering',
        description: 'Filters inappropriate content',
        rules: [
          {
            type: 'content_filter',
            condition: 'request.path.includes("admin")',
            action: 'escalate',
            parameters: { requiredRole: 'admin' }
          }
        ],
        isActive: true
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  private initializeDefaultUsers(): void {
    const defaultUsers: User[] = [
      {
        id: 'owner-001',
        username: 'owner',
        role: 'owner',
        permissions: ['*'], // All permissions
        tier: 'enterprise',
        isActive: true
      },
      {
        id: 'admin-001',
        username: 'admin',
        role: 'admin',
        permissions: ['admin', 'user_management', 'analytics', 'system_monitor'],
        tier: 'enterprise',
        isActive: true
      },
      {
        id: 'user-001',
        username: 'user',
        role: 'user',
        permissions: ['chat', 'game_control', 'audio_control'],
        tier: 'creator',
        isActive: true
      },
      {
        id: 'guest-001',
        username: 'guest',
        role: 'guest',
        permissions: ['chat', 'read_only'],
        tier: 'free',
        isActive: true
      }
    ];

    defaultUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  // User Management
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  createUser(user: Omit<User, 'id'>): string {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return id;
  }

  updateUser(id: string, updates: Partial<User>): boolean {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, updates);
      return true;
    }
    return false;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // Permission Management
  hasPermission(userId: string, permission: string): boolean {
    const user = this.getUser(userId);
    if (!user || !user.isActive) {
      return false;
    }

    // Owner has all permissions
    if (user.role === 'owner' || user.permissions.includes('*')) {
      return true;
    }

    return user.permissions.includes(permission);
  }

  checkPermissions(userId: string, requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => this.hasPermission(userId, permission));
  }

  // Rate Limiting
  checkRateLimit(userId: string, windowMs: number = 60000, maxRequests: number = 100): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimits.has(userId)) {
      this.rateLimits.set(userId, []);
    }

    const requests = this.rateLimits.get(userId)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.rateLimits.set(userId, validRequests);

    // Check if under limit
    if (validRequests.length < maxRequests) {
      validRequests.push(now);
      return true;
    }

    return false;
  }

  // Policy Enforcement
  evaluateSecurityPolicy(context: SecurityContext): {
    allowed: boolean;
    action: string;
    reason?: string;
  } {
    for (const policy of context.policies) {
      if (!policy.isActive) continue;

      for (const rule of policy.rules) {
        const result = this.evaluateRule(rule, context);
        if (!result.allowed) {
          return result;
        }
      }
    }

    return { allowed: true, action: 'allow' };
  }

  private evaluateRule(rule: SecurityRule, context: SecurityContext): {
    allowed: boolean;
    action: string;
    reason?: string;
  } {
    switch (rule.type) {
      case 'permission':
        return this.evaluatePermissionRule(rule, context);
      case 'rate_limit':
        return this.evaluateRateLimitRule(rule, context);
      case 'content_filter':
        return this.evaluateContentFilterRule(rule, context);
      case 'resource_limit':
        return this.evaluateResourceLimitRule(rule, context);
      default:
        return { allowed: true, action: 'allow' };
    }
  }

  private evaluatePermissionRule(rule: SecurityRule, context: SecurityContext): {
    allowed: boolean;
    action: string;
    reason?: string;
  } {
    // Simple permission evaluation - in real implementation, this would be more sophisticated
    if (rule.condition.includes('guest') && context.user.role === 'guest') {
      return {
        allowed: false,
        action: 'deny',
        reason: 'Guest users cannot access admin resources'
      };
    }

    return { allowed: true, action: 'allow' };
  }

  private evaluateRateLimitRule(rule: SecurityRule, context: SecurityContext): {
    allowed: boolean;
    action: string;
    reason?: string;
  } {
    const maxRequests = rule.parameters?.maxRequests || 100;
    const windowMs = rule.parameters?.windowMs || 60000;

    const allowed = this.checkRateLimit(context.user.id, windowMs, maxRequests);
    
    return {
      allowed,
      action: allowed ? 'allow' : 'deny',
      reason: allowed ? undefined : 'Rate limit exceeded'
    };
  }

  private evaluateContentFilterRule(rule: SecurityRule, context: SecurityContext): {
    allowed: boolean;
    action: string;
    reason?: string;
  } {
    // Simple content filtering - in real implementation, this would be more sophisticated
    if (rule.condition.includes('admin') && context.request.path.includes('admin')) {
      const requiredRole = rule.parameters?.requiredRole || 'admin';
      
      if (context.user.role !== requiredRole) {
        return {
          allowed: false,
          action: 'deny',
          reason: `Admin access requires ${requiredRole} role`
        };
      }
    }

    return { allowed: true, action: 'allow' };
  }

  private evaluateResourceLimitRule(rule: SecurityRule, context: SecurityContext): {
    allowed: boolean;
    action: string;
    reason?: string;
  } {
    // Resource limit evaluation - placeholder for implementation
    return { allowed: true, action: 'allow' };
  }

  // Audit Logging
  logAudit(entry: {
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'blocked';
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    const auditEntry: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.auditLogs.push(auditEntry);

    // Keep only last 10000 audit logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  getAuditLogs(userId?: string, limit: number = 100): AuditLog[] {
    let logs = this.auditLogs;
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    return logs.slice(-limit);
  }

  // Security Context Creation
  createSecurityContext(userId: string, request: {
    path: string;
    method: string;
    ipAddress?: string;
    userAgent?: string;
  }): SecurityContext | null {
    const user = this.getUser(userId);
    if (!user) {
      return null;
    }

    const activePolicies = Array.from(this.policies.values()).filter(policy => policy.isActive);

    return {
      user,
      request: {
        ...request,
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      },
      permissions: user.permissions,
      policies: activePolicies
    };
  }

  // Security Middleware
  async enforceSecurity(context: SecurityContext): Promise<{
    allowed: boolean;
    reason?: string;
    auditId?: string;
  }> {
    // Evaluate security policies
    const policyResult = this.evaluateSecurityPolicy(context);
    
    if (!policyResult.allowed) {
      this.logAudit({
        userId: context.user.id,
        action: 'security_block',
        resource: context.request.path,
        result: 'blocked',
        details: { reason: policyResult.reason, action: policyResult.action },
        ipAddress: context.request.ipAddress,
        userAgent: context.request.userAgent
      });

      return {
        allowed: false,
        reason: policyResult.reason
      };
    }

    // Log successful access
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logAudit({
      userId: context.user.id,
      action: 'security_allow',
      resource: context.request.path,
      result: 'success',
      details: { action: policyResult.action },
      ipAddress: context.request.ipAddress,
      userAgent: context.request.userAgent
    });

    return { allowed: true, auditId };
  }

  // Health and Diagnostics
  getSecurityStats(): {
    totalUsers: number;
    activeUsers: number;
    totalPolicies: number;
    activePolicies: number;
    totalAuditLogs: number;
    rateLimitEntries: number;
  } {
    const users = Array.from(this.users.values());
    const activeUsers = users.filter(user => user.isActive);
    const policies = Array.from(this.policies.values());
    const activePolicies = policies.filter(policy => policy.isActive);

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      totalAuditLogs: this.auditLogs.length,
      rateLimitEntries: this.rateLimits.size
    };
  }

  // Cleanup and Maintenance
  cleanup(): void {
    // Clean up old rate limit entries
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [userId, timestamps] of this.rateLimits.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > cutoffTime);
      
      if (validTimestamps.length === 0) {
        this.rateLimits.delete(userId);
      } else {
        this.rateLimits.set(userId, validTimestamps);
      }
    }

    // Clean up old audit logs (keep last 30 days)
    const auditCutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > auditCutoffTime);
  }
}

// Export singleton instance
export const helmSecurity = new HelmSecurity();

// Compatibility alias for migration
export const AceySecurity = HelmSecurity;
