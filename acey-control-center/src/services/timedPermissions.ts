import { apiPost } from './api';

export type PermissionScope = 
  | 'AUTO_FIX_UI'
  | 'AUDIO_GENERATION'
  | 'DEPLOY_CODE'
  | 'AUTO_RULE_APPROVAL'
  | 'SYSTEM_UNLOCK'
  | 'MODEL_FINE_TUNE'
  | 'CHAT_MODERATION'
  | 'CONTENT_GENERATION';

export interface TimedPermission {
  id: string;
  scope: PermissionScope;
  grantedBy: string;
  grantedAt: number;
  expiresAt: number;
  renewable: boolean;
  isActive: boolean;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PermissionGrant {
  scope: PermissionScope;
  expiresInHours: number;
  renewable?: boolean;
  reason?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  permission?: TimedPermission;
  reason?: string;
  expiredAt?: number;
}

export class TimedPermissionsService {
  private static instance: TimedPermissionsService;
  private permissions: Map<string, TimedPermission> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 30 * 1000; // 30 seconds

  private constructor() {
    this.startAutoRefresh();
  }

  static getInstance(): TimedPermissionsService {
    if (!TimedPermissionsService.instance) {
      TimedPermissionsService.instance = new TimedPermissionsService();
    }
    return TimedPermissionsService.instance;
  }

  async grantPermission(grant: PermissionGrant): Promise<TimedPermission | null> {
    try {
      const response = await apiPost<TimedPermission>('/permissions/grant', {
        scope: grant.scope,
        expires_in_hours: grant.expiresInHours,
        renewable: grant.renewable ?? false,
        reason: grant.reason,
      });

      if (response.data && !response.error) {
        const permission = response.data;
        this.permissions.set(permission.id, permission);
        return permission;
      }

      return null;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      return null;
    }
  }

  async revokePermission(permissionId: string): Promise<boolean> {
    try {
      const response = await apiPost(`/permissions/revoke/${permissionId}`, {});
      
      if (!response.error) {
        this.permissions.delete(permissionId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      return false;
    }
  }

  async checkPermission(scope: PermissionScope): Promise<PermissionCheckResult> {
    // Refresh permissions from server if needed
    await this.refreshPermissions();

    // Find active permission for scope
    const activePermissions = Array.from(this.permissions.values())
      .filter(p => p.scope === scope && p.isActive);

    if (activePermissions.length === 0) {
      return {
        allowed: false,
        reason: 'No active permission found for this scope',
      };
    }

    // Check if any permission is still valid
    const now = Date.now();
    const validPermission = activePermissions.find(p => p.expiresAt > now);

    if (!validPermission) {
      // Mark expired permissions as inactive
      activePermissions.forEach(p => {
        p.isActive = false;
      });
      
      return {
        allowed: false,
        reason: 'Permission has expired',
        expiredAt: Math.max(...activePermissions.map(p => p.expiresAt)),
      };
    }

    return {
      allowed: true,
      permission: validPermission,
    };
  }

  async getActivePermissions(): Promise<TimedPermission[]> {
    await this.refreshPermissions();
    
    const now = Date.now();
    return Array.from(this.permissions.values())
      .filter(p => p.isActive && p.expiresAt > now)
      .sort((a, b) => a.expiresAt - b.expiresAt);
  }

  async getPermissionHistory(limit: number = 50): Promise<TimedPermission[]> {
    try {
      const response = await apiPost<TimedPermission[]>('/permissions/history', { limit });
      
      if (response.data && !response.error) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get permission history:', error);
      return [];
    }
  }

  async renewPermission(permissionId: string, additionalHours: number): Promise<boolean> {
    try {
      const permission = this.permissions.get(permissionId);
      if (!permission || !permission.renewable) {
        return false;
      }

      const response = await apiPost(`/permissions/renew/${permissionId}`, {
        additional_hours: additionalHours,
      });

      if (response.data && !response.error) {
        const updatedPermission = response.data;
        this.permissions.set(updatedPermission.id, updatedPermission);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to renew permission:', error);
      return false;
    }
  }

  getPermissionDescription(scope: PermissionScope): string {
    const descriptions: Record<PermissionScope, string> = {
      AUTO_FIX_UI: 'Automatically fix UI errors and visual issues',
      AUDIO_GENERATION: 'Generate audio content and voice responses',
      DEPLOY_CODE: 'Deploy code changes to production',
      AUTO_RULE_APPROVAL: 'Auto-approve low-risk system rules',
      SYSTEM_UNLOCK: 'Unlock system-level administrative functions',
      MODEL_FINE_TUNE: 'Fine-tune AI model parameters',
      CHAT_MODERATION: 'Moderate chat content and user interactions',
      CONTENT_GENERATION: 'Generate new content and responses',
    };

    return descriptions[scope] || 'Unknown permission scope';
  }

  getPermissionRiskLevel(scope: PermissionScope): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const riskLevels: Record<PermissionScope, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      AUTO_FIX_UI: 'LOW',
      CHAT_MODERATION: 'LOW',
      CONTENT_GENERATION: 'MEDIUM',
      AUDIO_GENERATION: 'MEDIUM',
      AUTO_RULE_APPROVAL: 'HIGH',
      MODEL_FINE_TUNE: 'HIGH',
      DEPLOY_CODE: 'CRITICAL',
      SYSTEM_UNLOCK: 'CRITICAL',
    };

    return riskLevels[scope] || 'LOW';
  }

  getRemainingTime(permission: TimedPermission): string {
    const now = Date.now();
    const remaining = permission.expiresAt - now;
    
    if (remaining <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getTimeUntilExpiry(permission: TimedPermission): number {
    return Math.max(0, permission.expiresAt - Date.now());
  }

  isExpiringSoon(permission: TimedPermission, thresholdMinutes: number = 15): boolean {
    const threshold = thresholdMinutes * 60 * 1000;
    const remaining = this.getTimeUntilExpiry(permission);
    return remaining > 0 && remaining <= threshold;
  }

  private async refreshPermissions(): Promise<void> {
    try {
      const response = await apiPost<TimedPermission[]>('/permissions/active', {});
      
      if (response.data && !response.error) {
        this.permissions.clear();
        response.data.forEach(permission => {
          this.permissions.set(permission.id, permission);
        });
      }
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  }

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshPermissions();
    }, this.REFRESH_INTERVAL);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  cleanup(): void {
    this.stopAutoRefresh();
    this.permissions.clear();
  }

  // Permission templates for common use cases
  getPermissionTemplates(): Array<{
    scope: PermissionScope;
    name: string;
    description: string;
    defaultDuration: number; // hours
    riskLevel: string;
  }> {
    return [
      {
        scope: 'AUTO_FIX_UI',
        name: 'UI Auto-Fix',
        description: 'Let Acey automatically fix frontend errors',
        defaultDuration: 2,
        riskLevel: 'LOW',
      },
      {
        scope: 'AUDIO_GENERATION',
        name: 'Audio Generation',
        description: 'Generate voice responses and audio content',
        defaultDuration: 1,
        riskLevel: 'MEDIUM',
      },
      {
        scope: 'CONTENT_GENERATION',
        name: 'Content Generation',
        description: 'Generate chat responses and content',
        defaultDuration: 4,
        riskLevel: 'MEDIUM',
      },
      {
        scope: 'AUTO_RULE_APPROVAL',
        name: 'Auto-Rule Approval',
        description: 'Auto-approve low-risk system rules',
        defaultDuration: 6,
        riskLevel: 'HIGH',
      },
      {
        scope: 'MODEL_FINE_TUNE',
        name: 'Model Fine-Tuning',
        description: 'Fine-tune AI model parameters',
        defaultDuration: 3,
        riskLevel: 'HIGH',
      },
      {
        scope: 'DEPLOY_CODE',
        name: 'Code Deployment',
        description: 'Deploy code changes to production',
        defaultDuration: 1,
        riskLevel: 'CRITICAL',
      },
      {
        scope: 'SYSTEM_UNLOCK',
        name: 'System Unlock',
        description: 'Unlock system-level administrative functions',
        defaultDuration: 0.5,
        riskLevel: 'CRITICAL',
      },
    ];
  }
}

export default TimedPermissionsService.getInstance();
