/**
 * Enterprise Tenant System
 * Isolated Acey instances for enterprise customers
 */

export interface TenantConfig {
  id: string;
  name: string;
  mode: 'solo' | 'enterprise';
  permissions: TenantPermissions;
  billing: TenantBilling;
  audit: TenantAudit;
  createdAt: number;
  settings: TenantSettings;
}

export interface TenantPermissions {
  skillAccess: string[];
  apiKeys: string[];
  rateLimits: Record<string, number>;
  approvalQuorum: number; // Number of approvals required
  dataIsolation: boolean;
}

export interface TenantBilling {
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  billingCycle: 'monthly' | 'annual';
  customPricing?: boolean;
  spendLimit?: number;
  autoApproveThreshold?: number;
}

export interface TenantAudit {
  logLevel: 'basic' | 'detailed' | 'comprehensive';
  retentionDays: number;
  alertThresholds: {
    failedLogins: number;
    dataAccess: number;
    costOverruns: number;
  };
  complianceMode: 'none' | 'gdpr' | 'hipaa' | 'soc2';
}

export interface TenantSettings {
  crossTenantMemory: boolean;
  sharedDatasets: boolean;
  publicApiAccess: boolean;
  customModels: boolean;
  whiteLabel: boolean;
  domain: string;
}

class EnterpriseTenantManager {
  private tenants: Map<string, TenantConfig> = new Map();
  private currentTenant: string | null = null;
  
  /**
   * Initialize tenant system
   */
  async initialize(tenantId: string): Promise<TenantConfig> {
    let tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      tenant = await this.createTenant(tenantId);
      this.tenants.set(tenantId, tenant);
    }
    
    this.currentTenant = tenantId;
    console.log(`🏢 Tenant initialized: ${tenant.name} (${tenant.mode})`);
    
    return tenant;
  }
  
  /**
   * Create new tenant
   */
  private async createTenant(tenantId: string): Promise<TenantConfig> {
    const isEnterprise = tenantId.startsWith('ent_');
    
    const tenant: TenantConfig = {
      id: tenantId,
      name: isEnterprise ? `Enterprise ${tenantId}` : `Solo ${tenantId}`,
      mode: isEnterprise ? 'enterprise' : 'solo',
      permissions: {
        skillAccess: isEnterprise ? 
          ['code_helper', 'graphics_wizard', 'audio_maestro', 'link_review', 'stream_ops', 'ai_cohost_games'] :
          ['code_helper', 'link_review'], // Limited for solo
        apiKeys: [],
        rateLimits: {
          'api_requests_per_hour': isEnterprise ? 10000 : 1000,
          'skill_uses_per_day': isEnterprise ? 1000 : 100,
          'storage_gb': isEnterprise ? 100 : 10
        },
        approvalQuorum: isEnterprise ? 3 : 1,
        dataIsolation: isEnterprise
      },
      billing: {
        tier: isEnterprise ? 'Enterprise' : 'Free',
        billingCycle: 'monthly',
        customPricing: isEnterprise,
        spendLimit: isEnterprise ? 10000 : 100,
        autoApproveThreshold: isEnterprise ? 1000 : 50
      },
      audit: {
        logLevel: isEnterprise ? 'comprehensive' : 'basic',
        retentionDays: isEnterprise ? 365 : 30,
        alertThresholds: {
          failedLogins: isEnterprise ? 5 : 10,
          dataAccess: isEnterprise ? 1000 : 100,
          costOverruns: isEnterprise ? 1000 : 100
        },
        complianceMode: isEnterprise ? 'soc2' : 'none'
      },
      settings: {
        crossTenantMemory: false, // Never shared
        sharedDatasets: false, // Never shared
        publicApiAccess: isEnterprise,
        customModels: isEnterprise,
        whiteLabel: isEnterprise,
        domain: isEnterprise ? `${tenantId}.acey.ai` : 'acey.ai'
      },
      createdAt: Date.now()
    };
    
    console.log(`🏢 Created tenant: ${tenant.name}`);
    return tenant;
  }
  
  /**
   * Get current tenant
   */
  getCurrentTenant(): TenantConfig | null {
    return this.currentTenant ? this.tenants.get(this.currentTenant) : null;
  }
  
  /**
   * Check tenant permission
   */
  hasPermission(permission: string): boolean {
    const tenant = this.getCurrentTenant();
    if (!tenant) return false;
    
    return tenant.permissions.skillAccess.includes(permission);
  }
  
  /**
   * Check rate limit
   */
  checkRateLimit(action: string, current: number): boolean {
    const tenant = this.getCurrentTenant();
    if (!tenant) return false;
    
    const limit = tenant.permissions.rateLimits[action] || 0;
    return current <= limit;
  }
  
  /**
   * Log audit event
   */
  async logAuditEvent(event: {
    action: string;
    userId?: string;
    resource?: string;
    result: 'success' | 'failure' | 'warning';
    metadata?: Record<string, any>;
  }): Promise<void> {
    const tenant = this.getCurrentTenant();
    if (!tenant) return;
    
    const auditLog = {
      timestamp: Date.now(),
      tenantId: tenant.id,
      ...event
    };
    
    console.log(`🔍 Audit: ${tenant.name} - ${event.action} (${event.result})`);
    
    // In production, this would write to secure audit storage
    // await this.writeAuditLog(auditLog);
  }
  
  /**
   * Get tenant metrics
   */
  getTenantMetrics(): any {
    const tenant = this.getCurrentTenant();
    if (!tenant) return null;
    
    return {
      tenantId: tenant.id,
      mode: tenant.mode,
      skillAccess: tenant.permissions.skillAccess.length,
      rateLimitUsage: Object.values(tenant.permissions.rateLimits),
      auditLevel: tenant.audit.logLevel,
      dataIsolation: tenant.permissions.dataIsolation,
      apiAccess: tenant.settings.publicApiAccess
    };
  }
  
  /**
   * Switch tenant context
   */
  async switchTenant(tenantId: string): Promise<TenantConfig> {
    await this.logAuditEvent({
      action: 'tenant_switch',
      resource: tenantId,
      result: 'success'
    });
    
    return this.initialize(tenantId);
  }
  
  /**
   * Create tenant API key
   */
  async createApiKey(scopes: string[]): Promise<string> {
    const tenant = this.getCurrentTenant();
    if (!tenant) throw new Error('No active tenant');
    
    if (!tenant.settings.publicApiAccess) {
      throw new Error('API access not enabled for this tenant');
    }
    
    const apiKey = `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.logAuditEvent({
      action: 'api_key_created',
      metadata: { scopes, apiKey: apiKey.substr(0, 10) + '...' }
    });
    
    return apiKey;
  }
  
  /**
   * Validate enterprise feature access
   */
  validateEnterpriseAccess(feature: string): boolean {
    const tenant = this.getCurrentTenant();
    if (!tenant) return false;
    
    if (tenant.mode !== 'enterprise') {
      console.warn(`🚫 Enterprise feature ${feature} blocked for ${tenant.mode} tenant`);
      return false;
    }
    
    return true;
  }
}

// Singleton instance
export const tenantManager = new EnterpriseTenantManager();

// Context flag for enterprise mode
export function setTenantMode(mode: 'solo' | 'enterprise'): void {
  // This would be set at app startup based on configuration
  console.log(`🏢 Setting tenant mode: ${mode}`);
}

export function getTenantMode(): 'solo' | 'enterprise' {
  const tenant = tenantManager.getCurrentTenant();
  return tenant?.mode || 'solo';
}

export default {
  EnterpriseTenantManager,
  tenantManager,
  setTenantMode,
  getTenantMode
};
