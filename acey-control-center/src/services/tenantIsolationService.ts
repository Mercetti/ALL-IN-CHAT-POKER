/**
 * Enterprise Tenant Isolation Middleware
 * Multi-org ready with hard isolation boundaries
 */

export interface Tenant {
  id: string;
  name: string;
  isolatedMemory: boolean;
  isolatedModels: boolean;
  isolatedRules: boolean;
  createdAt: number;
  settings: {
    maxMemoryMB: number;
    allowedModels: string[];
    dataRetentionDays: number;
    enableAuditLogging: boolean;
  };
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  permissions: string[];
  isolationLevel: 'strict' | 'moderate' | 'minimal';
}

export interface IsolationRule {
  resource: string;
  isolation: 'hard' | 'soft' | 'none';
  filter: (tenantId: string, data: any) => any;
}

export interface TenantAuditLog {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

class TenantIsolationService {
  private tenants = new Map<string, Tenant>();
  private isolationRules = new Map<string, IsolationRule>();
  private auditLogs: TenantAuditLog[] = [];
  
  constructor() {
    this.initializeDefaultTenants();
    this.initializeIsolationRules();
  }

  /**
   * Initialize default tenants
   */
  private initializeDefaultTenants(): void {
    const defaultTenant: Tenant = {
      id: 'default',
      name: 'Default Organization',
      isolatedMemory: true,
      isolatedModels: false,
      isolatedRules: true,
      createdAt: Date.now(),
      settings: {
        maxMemoryMB: 1024,
        allowedModels: ['acey-v4', 'acey-v3'],
        dataRetentionDays: 30,
        enableAuditLogging: true
      }
    };

    this.tenants.set('default', defaultTenant);
  }

  /**
   * Initialize isolation rules
   */
  private initializeIsolationRules(): void {
    // Memory isolation - Hard separation
    this.isolationRules.set('memory', {
      resource: 'memory',
      isolation: 'hard',
      filter: (tenantId, data) => {
        // Create tenant-specific memory namespace
        return {
          ...data,
          namespace: `tenant_${tenantId}`,
          isolated: true
        };
      }
    });

    // Models isolation - Optional per tenant
    this.isolationRules.set('models', {
      resource: 'models',
      isolation: 'soft',
      filter: (tenantId, data) => {
        const tenant = this.tenants.get(tenantId);
        if (!tenant || !tenant.isolatedModels) {
          return data;
        }
        
        return {
          ...data,
          tenantId,
          namespace: `models_${tenantId}`
        };
      }
    });

    // Logs isolation - Hard separation
    this.isolationRules.set('logs', {
      resource: 'logs',
      isolation: 'hard',
      filter: (tenantId, data) => {
        return {
          ...data,
          tenantId,
          namespace: `logs_${tenantId}`,
          isolated: true
        };
      }
    });

    // Skills isolation - Scoped access
    this.isolationRules.set('skills', {
      resource: 'skills',
      isolation: 'soft',
      filter: (tenantId, data) => {
        return {
          ...data,
          tenantId,
          scope: 'tenant_scoped'
        };
      }
    });

    // Trust graph isolation - Per tenant
    this.isolationRules.set('trust', {
      resource: 'trust',
      isolation: 'hard',
      filter: (tenantId, data) => {
        return {
          ...data,
          tenantId,
          namespace: `trust_${tenantId}`,
          isolated: true
        };
      }
    });
  }

  /**
   * Create new tenant
   */
  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt'>): Promise<Tenant> {
    const tenantId = this.generateTenantId();
    const tenant: Tenant = {
      ...tenantData,
      id: tenantId,
      createdAt: Date.now()
    };

    this.tenants.set(tenantId, tenant);
    
    this.logAudit({
      tenantId,
      userId: 'system',
      action: 'CREATE_TENANT',
      resource: 'tenant',
      timestamp: Date.now(),
      success: true,
      metadata: { tenantName: tenant.name }
    });

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | null {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get all tenants
   */
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Update tenant settings
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = { ...tenant, ...updates };
    this.tenants.set(tenantId, updatedTenant);

    this.logAudit({
      tenantId,
      userId: 'system',
      action: 'UPDATE_TENANT',
      resource: 'tenant',
      timestamp: Date.now(),
      success: true,
      metadata: { updates }
    });

    return updatedTenant;
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    this.tenants.delete(tenantId);

    this.logAudit({
      tenantId,
      userId: 'system',
      action: 'DELETE_TENANT',
      resource: 'tenant',
      timestamp: Date.now(),
      success: true,
      metadata: { tenantName: tenant.name }
    });
  }

  /**
   * Apply tenant isolation to data
   */
  applyIsolation(tenantId: string, resourceType: string, data: any): any {
    const rule = this.isolationRules.get(resourceType);
    if (!rule) {
      return data;
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Apply isolation based on tenant settings
    if (resourceType === 'memory' && !tenant.isolatedMemory) {
      return data;
    }
    
    if (resourceType === 'models' && !tenant.isolatedModels) {
      return data;
    }
    
    if (resourceType === 'rules' && !tenant.isolatedRules) {
      return data;
    }

    return rule.filter(tenantId, data);
  }

  /**
   * Check tenant permission for resource
   */
  hasPermission(tenantId: string, permission: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    // Check tenant-specific permissions
    const tenantPermissions = this.getTenantPermissions(tenant);
    return tenantPermissions.includes(permission);
  }

  /**
   * Get tenant permissions
   */
  private getTenantPermissions(tenant: Tenant): string[] {
    const basePermissions = [
      'READ_OWN_DATA',
      'WRITE_OWN_DATA',
      'MANAGE_SKILLS'
    ];

    if (tenant.isolatedMemory) {
      basePermissions.push('ISOLATE_MEMORY');
    }

    if (tenant.isolatedModels) {
      basePermissions.push('ISOLATE_MODELS');
    }

    if (tenant.isolatedRules) {
      basePermissions.push('ISOLATE_RULES');
    }

    return basePermissions;
  }

  /**
   * Get tenant statistics
   */
  getTenantStats(tenantId: string): {
    memoryUsage: number;
    modelCount: number;
    skillCount: number;
    logCount: number;
    lastActivity: number;
  } | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return null;
    }

    // In a real implementation, these would be actual metrics
    return {
      memoryUsage: Math.floor(Math.random() * tenant.settings.maxMemoryMB),
      modelCount: tenant.settings.allowedModels.length,
      skillCount: Math.floor(Math.random() * 10),
      logCount: Math.floor(Math.random() * 1000),
      lastActivity: Date.now() - Math.floor(Math.random() * 86400000)
    };
  }

  /**
   * Get tenant audit logs
   */
  getTenantAuditLogs(tenantId: string, limit?: number): TenantAuditLog[] {
    const logs = this.auditLogs
      .filter(log => log.tenantId === tenantId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Export tenant data for compliance
   */
  async exportTenantData(tenantId: string): Promise<{
    tenant: Tenant;
    auditLogs: TenantAuditLog[];
    stats: any;
    exportDate: number;
  }> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const auditLogs = this.getTenantAuditLogs(tenantId);
    const stats = this.getTenantStats(tenantId);

    this.logAudit({
      tenantId,
      userId: 'system',
      action: 'EXPORT_DATA',
      resource: 'tenant',
      timestamp: Date.now(),
      success: true,
      metadata: { exportSize: auditLogs.length }
    });

    return {
      tenant,
      auditLogs,
      stats,
      exportDate: Date.now()
    };
  }

  /**
   * Middleware for Express.js
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'X-Tenant-ID header required' });
      }

      const tenant = this.tenants.get(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Add tenant context to request
      req.tenant = tenant;
      req.tenantId = tenantId;
      
      // Log the request
      this.logAudit({
        tenantId,
        userId: req.user?.id || 'anonymous',
        action: 'API_REQUEST',
        resource: req.path,
        timestamp: Date.now(),
        success: true,
        metadata: {
          method: req.method,
          userAgent: req.get('User-Agent')
        }
      });

      next();
    };
  }

  /**
   * Private helper methods
   */
  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logAudit(entry: Omit<TenantAuditLog, 'timestamp'>): void {
    const auditEntry: TenantAuditLog = {
      ...entry,
      timestamp: Date.now()
    };

    this.auditLogs.push(auditEntry);

    // Keep only last 10000 entries
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }
}

export const tenantIsolationService = new TenantIsolationService();
