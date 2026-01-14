export type MobilePermission = 
  | 'read'
  | 'approve'
  | 'command'
  | 'deploy'
  | 'admin';

export interface PermissionLevel {
  level: number;
  permissions: MobilePermission[];
  description: string;
}

export const PERMISSION_LEVELS: Record<string, PermissionLevel> = {
  viewer: {
    level: 1,
    permissions: ['read'],
    description: 'Read-only access to status and logs',
  },
  operator: {
    level: 2,
    permissions: ['read', 'approve'],
    description: 'Can approve actions and view all data',
  },
  controller: {
    level: 3,
    permissions: ['read', 'approve', 'command'],
    description: 'Can send commands and approve actions',
  },
  deployer: {
    level: 4,
    permissions: ['read', 'approve', 'command', 'deploy'],
    description: 'Can deploy models and manage system',
  },
  admin: {
    level: 5,
    permissions: ['read', 'approve', 'command', 'deploy', 'admin'],
    description: 'Full administrative access',
  },
};

export function getPermissionLevel(permissions: MobilePermission[]): string {
  for (const [levelName, levelData] of Object.entries(PERMISSION_LEVELS)) {
    if (levelData.permissions.every(p => permissions.includes(p))) {
      return levelName;
    }
  }
  return 'viewer';
}

export function hasPermission(
  userPermissions: MobilePermission[], 
  requiredPermission: MobilePermission
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function requirePermission(
  userPermissions: MobilePermission[], 
  requiredPermission: MobilePermission
): void {
  if (!hasPermission(userPermissions, requiredPermission)) {
    throw new Error(`Permission denied: ${requiredPermission}`);
  }
}

export function validatePermissions(permissions: string[]): MobilePermission[] {
  const validPermissions: MobilePermission[] = [];
  
  for (const permission of permissions) {
    if (isMobilePermission(permission)) {
      validPermissions.push(permission);
    }
  }
  
  return validPermissions;
}

function isMobilePermission(permission: string): permission is MobilePermission {
  return ['read', 'approve', 'command', 'deploy', 'admin'].includes(permission);
}

export function getPermissionDescription(permission: MobilePermission): string {
  const descriptions: Record<MobilePermission, string> = {
    read: 'View system status, logs, and data',
    approve: 'Approve or reject pending actions',
    command: 'Send commands to the system',
    deploy: 'Deploy models and system updates',
    admin: 'Full administrative control',
  };
  
  return descriptions[permission] || 'Unknown permission';
}

export default {
  PERMISSION_LEVELS,
  getPermissionLevel,
  hasPermission,
  requirePermission,
  validatePermissions,
  getPermissionDescription,
};
