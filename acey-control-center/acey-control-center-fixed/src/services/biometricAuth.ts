import * as LocalAuthentication from 'expo-local-authentication';
import { getStoredDeviceId } from './api';

export type ApprovalRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
  timestamp: number;
}

export interface BiometricRequirement {
  risk: ApprovalRisk;
  requiresBiometric: boolean;
  requiresCooldown?: boolean;
  cooldownPeriod?: number; // milliseconds
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private lastVerification: number | null = null;
  private readonly VERIFICATION_TIMEOUT = 30 * 1000; // 30 seconds
  private readonly HIGH_RISK_COOLDOWN = 5 * 60 * 1000; // 5 minutes for HIGH risk
  private readonly CRITICAL_RISK_COOLDOWN = 15 * 60 * 1000; // 15 minutes for CRITICAL risk

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  getBiometricRequirement(risk: ApprovalRisk): BiometricRequirement {
    switch (risk) {
      case 'LOW':
        return { risk, requiresBiometric: false };
      case 'MEDIUM':
        return { risk, requiresBiometric: false };
      case 'HIGH':
        return { 
          risk, 
          requiresBiometric: true, 
          requiresCooldown: true,
          cooldownPeriod: this.HIGH_RISK_COOLDOWN 
        };
      case 'CRITICAL':
        return { 
          risk, 
          requiresBiometric: true, 
          requiresCooldown: true,
          cooldownPeriod: this.CRITICAL_RISK_COOLDOWN 
        };
      default:
        return { risk, requiresBiometric: false };
    }
  }

  async authenticateForApproval(
    action: string,
    risk: ApprovalRisk
  ): Promise<BiometricAuthResult> {
    const requirement = this.getBiometricRequirement(risk);
    
    if (!requirement.requiresBiometric) {
      return {
        success: true,
        timestamp: Date.now(),
      };
    }

    // Check cooldown for HIGH and CRITICAL risk actions
    if (requirement.requiresCooldown && this.isInCooldown(requirement.cooldownPeriod!)) {
      return {
        success: false,
        error: `Action requires cooldown period. Please wait ${this.getRemainingCooldown(requirement.cooldownPeriod!)} before proceeding.`,
        timestamp: Date.now(),
      };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirm Acey approval: ${action}`,
        fallbackLabel: 'Use device unlock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        this.lastVerification = Date.now();
        return {
          success: true,
          biometricType: result.type,
          timestamp: Date.now(),
        };
      } else {
        return {
          success: false,
          error: 'Biometric authentication failed',
          timestamp: Date.now(),
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Biometric authentication error',
        timestamp: Date.now(),
      };
    }
  }

  async verifyBiometricFreshness(timestamp: number): Promise<boolean> {
    const now = Date.now();
    const age = now - timestamp;
    
    return age <= this.VERIFICATION_TIMEOUT;
  }

  async confirmApprovalWithServer(
    actionId: string,
    biometricResult: BiometricAuthResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = await getStoredDeviceId();
      
      const response = await fetch('/approval/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          action_id: actionId,
          biometric_verified: biometricResult.success,
          device_id: deviceId,
          timestamp: biometricResult.timestamp,
          biometric_type: biometricResult.biometricType,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Server verification failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  }

  private isInCooldown(cooldownPeriod: number): boolean {
    if (!this.lastVerification) return false;
    
    const now = Date.now();
    const timeSinceLastVerification = now - this.lastVerification;
    
    return timeSinceLastVerification < cooldownPeriod;
  }

  private getRemainingCooldown(cooldownPeriod: number): string {
    if (!this.lastVerification) return '0s';
    
    const now = Date.now();
    const timeSinceLastVerification = now - this.lastVerification;
    const remaining = cooldownPeriod - timeSinceLastVerification;
    
    if (remaining <= 0) return '0s';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  private getAuthToken(): string {
    // Get auth token from storage
    return localStorage.getItem('acey_mobile_token') || '';
  }

  getCooldownStatus(risk: ApprovalRisk): {
    isInCooldown: boolean;
    remainingTime: string;
    nextAvailable: Date | null;
  } {
    const requirement = this.getBiometricRequirement(risk);
    
    if (!requirement.requiresCooldown) {
      return {
        isInCooldown: false,
        remainingTime: '0s',
        nextAvailable: null,
      };
    }

    const isInCooldown = this.isInCooldown(requirement.cooldownPeriod!);
    const remainingTime = this.getRemainingCooldown(requirement.cooldownPeriod!);
    
    let nextAvailable: Date | null = null;
    if (this.lastVerification && isInCooldown) {
      nextAvailable = new Date(this.lastVerification + requirement.cooldownPeriod!);
    }

    return {
      isInCooldown,
      remainingTime,
      nextAvailable,
    };
  }

  async getAvailableBiometricTypes(): Promise<string[]> {
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return supportedTypes.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris Scan';
          default:
            return 'Unknown';
        }
      });
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  async isDeviceSecure(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return hasHardware && isEnrolled && supportedTypes.length > 0;
    } catch (error) {
      console.error('Error checking device security:', error);
      return false;
    }
  }
}

export default BiometricAuthService.getInstance();
