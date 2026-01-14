import { getStoredToken, setStoredToken, clearStoredToken, mobileLogin } from './api';
import { generateDeviceId } from '../utils/deviceTrust';

export interface AuthState {
  isAuthenticated: boolean;
  deviceId: string | null;
  permissions: string[];
  expiresAt: number | null;
}

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  async authenticate(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = await this.getOrCreateDeviceId();
      
      const response = await mobileLogin(deviceId, pin);
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        const { token, permissions, expiresAt } = response.data;
        
        // Store authentication data
        setStoredToken(token);
        
        return {
          success: true,
        };
      }
      
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('Auth error:', error);
      return { success: false, error: 'Authentication error' };
    }
  }
  
  async logout(): Promise<void> {
    clearStoredToken();
  }
  
  async getAuthState(): Promise<AuthState> {
    const token = getStoredToken();
    const deviceId = await this.getOrCreateDeviceId();
    
    if (!token) {
      return {
        isAuthenticated: false,
        deviceId,
        permissions: [],
        expiresAt: null,
      };
    }
    
    // TODO: Validate token with backend
    // For now, assume token is valid if it exists
    return {
      isAuthenticated: true,
      deviceId,
      permissions: ['read', 'approve', 'command'], // Default permissions
      expiresAt: null,
    };
  }
  
  private async getOrCreateDeviceId(): Promise<string> {
    const storedDeviceId = await this.getStoredDeviceId();
    
    if (storedDeviceId) {
      return storedDeviceId;
    }
    
    const newDeviceId = generateDeviceId();
    await this.setStoredDeviceId(newDeviceId);
    return newDeviceId;
  }
  
  private async getStoredDeviceId(): Promise<string | null> {
    try {
      // In a real app, use AsyncStorage
      return localStorage.getItem('acey_mobile_device_id');
    } catch (error) {
      console.error('Device ID read error:', error);
      return null;
    }
  }
  
  private async setStoredDeviceId(deviceId: string): Promise<void> {
    try {
      // In a real app, use AsyncStorage
      localStorage.setItem('acey_mobile_device_id', deviceId);
    } catch (error) {
      console.error('Device ID write error:', error);
    }
  }
  
  hasPermission(permission: string): boolean {
    // TODO: Check actual permissions from token
    // For now, return true for basic permissions
    const basicPermissions = ['read', 'approve', 'command'];
    return basicPermissions.includes(permission);
  }
  
  requirePermission(permission: string): void {
    if (!this.hasPermission(permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }
}

export default AuthService.getInstance();
