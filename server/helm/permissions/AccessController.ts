/**
 * Helm Access Controller
 * Manages permissions and access control for Helm operations
 */

export interface AccessLevel {
    level: 'owner' | 'admin' | 'user' | 'guest';
    permissions: string[];
}

export interface PermissionContext {
    userId: string;
    sessionId: string;
    role: string;
    tier: 'free' | 'pro' | 'enterprise';
}

export interface TierLevel {
    name: string;
    maxUsers: number;
    maxPersonas: number;
    maxSkills: number;
    features: string[];
    permissions: string[];
}

export class AccessController {
    private permissions: Map<string, AccessLevel> = new Map();
    private tiers: Map<string, TierLevel> = new Map();
    
    constructor() {
        this.initializePermissions();
        this.initializeTiers();
    }
    
    private initializePermissions() {
        const defaultPermissions: AccessLevel[] = [
            {
                level: 'owner',
                permissions: [
                    'system:admin',
                    'user:manage',
                    'skill:manage',
                    'persona:manage',
                    'data:access',
                    'audit:view'
                ]
            },
            {
                level: 'admin',
                permissions: [
                    'user:view',
                    'skill:view',
                    'persona:view',
                    'data:access',
                    'audit:view'
                ]
            },
            {
                level: 'user',
                permissions: [
                    'skill:use',
                    'persona:interact',
                    'data:own'
                ]
            },
            {
                level: 'guest',
                permissions: [
                    'persona:view',
                    'skill:view'
                ]
            }
        ];
        
        defaultPermissions.forEach(permission => {
            this.permissions.set(permission.level, permission);
        });
    }
    
    private initializeTiers() {
        const defaultTiers: TierLevel[] = [
            {
                name: 'free',
                maxUsers: 1,
                maxPersonas: 1,
                maxSkills: 3,
                features: ['basic_skills', 'single_persona'],
                permissions: ['skill:use', 'persona:interact']
            },
            {
                name: 'pro',
                maxUsers: 5,
                maxPersonas: 3,
                maxSkills: 10,
                features: ['advanced_skills', 'multiple_personas', 'analytics'],
                permissions: ['skill:use', 'persona:interact', 'analytics:view']
            },
            {
                name: 'enterprise',
                maxUsers: 50,
                maxPersonas: 10,
                maxSkills: 50,
                features: ['all_skills', 'custom_personas', 'advanced_analytics', 'api_access'],
                permissions: ['skill:use', 'persona:interact', 'analytics:view', 'api:access']
            }
        ];
        
        defaultTiers.forEach(tier => {
            this.tiers.set(tier.name, tier);
        });
    }
    
    hasPermission(context: PermissionContext, permission: string): boolean {
        const accessLevel = this.permissions.get(context.role);
        if (!accessLevel) {
            return false;
        }
        
        return accessLevel.permissions.includes(permission);
    }
    
    canAccessSkill(context: PermissionContext, skillId: string): boolean {
        // Check basic permission
        if (!this.hasPermission(context, 'skill:use')) {
            return false;
        }
        
        // Check tier limits
        const tier = this.tiers.get(context.tier);
        if (!tier) {
            return false;
        }
        
        // Additional skill-specific checks can be added here
        return true;
    }
    
    canManagePersona(context: PermissionContext): boolean {
        return this.hasPermission(context, 'persona:manage');
    }
    
    canViewAuditLogs(context: PermissionContext): boolean {
        return this.hasPermission(context, 'audit:view');
    }
    
    getTierLimits(tierName: string): TierLevel | null {
        return this.tiers.get(tierName) || null;
    }
    
    validateAccess(context: PermissionContext, requiredPermissions: string[]): boolean {
        return requiredPermissions.every(permission => 
            this.hasPermission(context, permission)
        );
    }
}

// Singleton instance
export const accessController = new AccessController();