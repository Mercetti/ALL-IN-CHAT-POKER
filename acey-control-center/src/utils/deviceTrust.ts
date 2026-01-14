import { Platform } from 'react-native';

export function generateDeviceId(): string {
  // Generate a unique device identifier based on platform and random data
  const platform = Platform.OS;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  return `${platform}_${timestamp}_${random}`;
}

export function validateDeviceId(deviceId: string): boolean {
  // Basic validation for device ID format
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }
  
  const parts = deviceId.split('_');
  if (parts.length !== 3) {
    return false;
  }
  
  const [platform, timestamp, random] = parts;
  
  // Check platform
  if (!['ios', 'android', 'web'].includes(platform)) {
    return false;
  }
  
  // Check timestamp (should be a number)
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum) || timestampNum < 0) {
    return false;
  }
  
  // Check random part (should be alphanumeric)
  if (!/^[a-z0-9]+$/i.test(random)) {
    return false;
  }
  
  return true;
}

export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isPad: Platform.OS === 'ios' ? (Platform as any).isPad : false,
    isTV: Platform.isTV,
    constants: Platform.constants,
  };
}

export function isTrustedDevice(deviceId: string): boolean {
  // In a real implementation, this would check against a backend
  // For now, just validate the format
  return validateDeviceId(deviceId);
}

export function getDevicePermissions(deviceId: string): string[] {
  // In a real implementation, this would fetch permissions from backend
  // For now, return basic permissions for trusted devices
  if (isTrustedDevice(deviceId)) {
    return ['read', 'approve', 'command'];
  }
  
  return ['read']; // Untrusted devices only get read permissions
}

export function requirePermission(deviceId: string, permission: string): void {
  const permissions = getDevicePermissions(deviceId);
  
  if (!permissions.includes(permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export default {
  generateDeviceId,
  validateDeviceId,
  getDeviceInfo,
  isTrustedDevice,
  getDevicePermissions,
  requirePermission,
};
