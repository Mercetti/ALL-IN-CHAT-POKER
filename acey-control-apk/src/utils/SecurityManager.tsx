/**
 * Security Manager
 * Provides enterprise-grade security features including token management and encryption
 */

import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Security types
interface SecurityConfig {
  encryptionKey: string;
  tokenRefreshInterval: number; // in minutes
  maxTokenAge: number; // in hours
  enableBiometric: boolean;
  sessionTimeout: number; // in minutes
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
  userId: string;
  deviceId: string;
}

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  timestamp: number;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      encryptionKey: 'acey-secure-key-2024',
      tokenRefreshInterval: 15, // 15 minutes
      maxTokenAge: 24, // 24 hours
      enableBiometric: false,
      sessionTimeout: 30, // 30 minutes
    };
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Token Management
  async storeTokens(tokenData: TokenData): Promise<boolean> {
    try {
      const encryptedTokens = await this.encryptData(JSON.stringify(tokenData));
      await AsyncStorage.setItem('acey_tokens', JSON.stringify(encryptedTokens));
      
      // Start token refresh timer
      this.startTokenRefreshTimer(tokenData.expiresAt);
      
      return true;
    } catch (error) {
      console.error('Failed to store tokens:', error);
      return false;
    }
  }

  async getTokens(): Promise<TokenData | null> {
    try {
      const encryptedTokensStr = await AsyncStorage.getItem('acey_tokens');
      if (!encryptedTokensStr) return null;

      const encryptedTokens = JSON.parse(encryptedTokensStr);
      const tokensStr = await this.decryptData(encryptedTokens);
      const tokens = JSON.parse(tokensStr);

      // Check if tokens are expired
      if (Date.now() > tokens.expiresAt) {
        await this.clearTokens();
        return null;
      }

      return tokens;
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  async clearTokens(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem('acey_tokens');
      this.stopTokenRefreshTimer();
      this.stopSessionTimer();
      return true;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData | null> {
    try {
      // Simulate token refresh API call
      const response = await fetch('https://all-in-chat-poker.fly.dev/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newTokens = await response.json();
      
      // Store new tokens
      await this.storeTokens(newTokens);
      
      return newTokens;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  // Encryption/Decryption
  async encryptData(data: string): Promise<EncryptedData> {
    try {
      const salt = CryptoJS.lib.WordArray.random(128/8).toString();
      const key = CryptoJS.PBKDF2(this.config.encryptionKey, salt, {
        keySize: 256/32,
        iterations: 10000,
      });

      const iv = CryptoJS.lib.WordArray.random(128/8).toString();
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return {
        data: encrypted.toString(),
        iv: iv,
        salt: salt,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw error;
    }
  }

  async decryptData(encryptedData: EncryptedData): Promise<string> {
    try {
      const key = CryptoJS.PBKDF2(this.config.encryptionKey, encryptedData.salt, {
        keySize: 256/32,
        iterations: 10000,
      });

      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key, {
        iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  }

  // Secure Storage
  async storeSecureData(key: string, data: any): Promise<boolean> {
    try {
      const encryptedData = await this.encryptData(JSON.stringify(data));
      await AsyncStorage.setItem(`secure_${key}`, JSON.stringify(encryptedData));
      return true;
    } catch (error) {
      console.error(`Failed to store secure data for ${key}:`, error);
      return false;
    }
  }

  async getSecureData(key: string): Promise<any> {
    try {
      const encryptedDataStr = await AsyncStorage.getItem(`secure_${key}`);
      if (!encryptedDataStr) return null;

      const encryptedData = JSON.parse(encryptedDataStr);
      const dataStr = await this.decryptData(encryptedData);
      return JSON.parse(dataStr);
    } catch (error) {
      console.error(`Failed to get secure data for ${key}:`, error);
      return null;
    }
  }

  async removeSecureData(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove secure data for ${key}:`, error);
      return false;
    }
  }

  // Session Management
  startSessionTimer(timeoutMinutes: number = this.config.sessionTimeout): void {
    this.stopSessionTimer();
    
    this.sessionTimer = setTimeout(() => {
      console.log('Session expired due to inactivity');
      this.clearTokens();
      // Emit session expired event
      this.emitSecurityEvent('SESSION_EXPIRED');
    }, timeoutMinutes * 60 * 1000);
  }

  stopSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  resetSessionTimer(): void {
    this.startSessionTimer();
  }

  // Token Refresh Management
  private startTokenRefreshTimer(expiresAt: number): void {
    this.stopTokenRefreshTimer();
    
    const refreshTime = expiresAt - (this.config.tokenRefreshInterval * 60 * 1000);
    const timeUntilRefresh = refreshTime - Date.now();
    
    if (timeUntilRefresh > 0) {
      this.tokenRefreshTimer = setTimeout(async () => {
        console.log('Automatically refreshing token');
        const tokens = await this.getTokens();
        if (tokens && tokens.refreshToken) {
          await this.refreshToken(tokens.refreshToken);
        }
      }, timeUntilRefresh);
    }
  }

  private stopTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  // Security Validation
  validateToken(token: string): boolean {
    try {
      // Basic token validation
      if (!token || token.length < 10) return false;
      
      // Check token format (JWT)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Security Events
  private emitSecurityEvent(event: string, data?: any): void {
    // Emit security event for app-wide handling
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('securityEvent', {
        detail: { event, data, timestamp: Date.now() }
      }));
    }
  }

  // Device Security
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('acey_device_id');
      
      if (!deviceId) {
        // Generate new device ID
        deviceId = CryptoJS.lib.WordArray.random(256/8).toString();
        await AsyncStorage.setItem('acey_device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      return 'unknown-device';
    }
  }

  // Security Audit
  async getSecurityAudit(): Promise<{
    lastTokenRefresh: number;
    sessionActive: boolean;
    encryptionEnabled: boolean;
    biometricEnabled: boolean;
    deviceTrusted: boolean;
  }> {
    const tokens = await this.getTokens();
    const deviceId = await this.getDeviceId();
    
    return {
      lastTokenRefresh: tokens?.issuedAt || 0,
      sessionActive: !!tokens && Date.now() < tokens.expiresAt,
      encryptionEnabled: true,
      biometricEnabled: this.config.enableBiometric,
      deviceTrusted: deviceId !== 'unknown-device',
    };
  }

  // Configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Cleanup
  cleanup(): void {
    this.stopTokenRefreshTimer();
    this.stopSessionTimer();
  }
}

// Security Hook for React
export const useSecurity = () => {
  const securityManager = SecurityManager.getInstance();
  
  return {
    // Token management
    storeTokens: securityManager.storeTokens.bind(securityManager),
    getTokens: securityManager.getTokens.bind(securityManager),
    clearTokens: securityManager.clearTokens.bind(securityManager),
    refreshToken: securityManager.refreshToken.bind(securityManager),
    
    // Encryption
    encryptData: securityManager.encryptData.bind(securityManager),
    decryptData: securityManager.decryptData.bind(securityManager),
    
    // Secure storage
    storeSecureData: securityManager.storeSecureData.bind(securityManager),
    getSecureData: securityManager.getSecureData.bind(securityManager),
    removeSecureData: securityManager.removeSecureData.bind(securityManager),
    
    // Session management
    startSessionTimer: securityManager.startSessionTimer.bind(securityManager),
    stopSessionTimer: securityManager.stopSessionTimer.bind(securityManager),
    resetSessionTimer: securityManager.resetSessionTimer.bind(securityManager),
    
    // Validation
    validateToken: securityManager.validateToken.bind(securityManager),
    
    // Device security
    getDeviceId: securityManager.getDeviceId.bind(securityManager),
    
    // Audit
    getSecurityAudit: securityManager.getSecurityAudit.bind(securityManager),
    
    // Configuration
    updateConfig: securityManager.updateConfig.bind(securityManager),
    getConfig: securityManager.getConfig.bind(securityManager),
  };
};

export default SecurityManager;
