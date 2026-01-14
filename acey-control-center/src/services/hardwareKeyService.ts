/**
 * Hardware Key (WebAuthn/FIDO2) Verification Service
 * Physical proof of ownership for critical operations
 */

export interface HardwareKeyChallenge {
  challenge: string;
  userVerification: 'required' | 'preferred' | 'discouraged';
  timeout: number;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
}

export interface HardwareKeyResponse {
  id: string;
  rawId: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
  };
  type: 'public-key';
}

export interface HardwareKeyVerification {
  deviceId: string;
  challenge: string;
  signedResponse: HardwareKeyResponse;
  timestamp: number;
  verified: boolean;
  deviceInfo: {
    name: string;
    type: string;
    manufacturer?: string;
  };
}

export interface HardwareKeyConfig {
  enabled: boolean;
  requiredForActions: string[];
  timeoutMs: number;
  rpId: string;
  rpName: string;
}

export interface AuditLogEntry {
  action: string;
  hardwareKey: boolean;
  device: string;
  timestamp: number;
  userId: string;
  success: boolean;
  error?: string;
}

class HardwareKeyService {
  private config: HardwareKeyConfig;
  private auditLogs: AuditLogEntry[] = [];
  
  constructor() {
    this.config = {
      enabled: true,
      requiredForActions: [
        'MODEL_DEPLOY',
        'EMERGENCY_UNLOCK',
        'GOVERNANCE_CHANGE',
        'SKILL_PUBLISH',
        'TENANT_CREATE',
        'CRITICAL_CONFIG_CHANGE'
      ],
      timeoutMs: 300000, // 5 minutes
      rpId: 'acey-control-center.com',
      rpName: 'Acey Control Center'
    };
  }

  /**
   * Generate WebAuthn challenge for hardware key verification
   */
  async generateChallenge(userId: string, userName: string): Promise<HardwareKeyChallenge> {
    const challenge = this.generateRandomChallenge();
    
    return {
      challenge,
      userVerification: 'required',
      timeout: this.config.timeoutMs,
      rpId: this.config.rpId,
      rpName: this.config.rpName,
      userId,
      userName
    };
  }

  /**
   * Verify hardware key response
   */
  async verifyHardwareKey(
    action: string,
    challenge: HardwareKeyChallenge,
    response: HardwareKeyResponse,
    userId: string
  ): Promise<HardwareKeyVerification> {
    const timestamp = Date.now();
    let verified = false;
    let error: string | undefined;

    try {
      // Verify the response
      verified = await this.verifyWebAuthnResponse(challenge, response);
      
      // Extract device info
      const deviceInfo = await this.extractDeviceInfo(response);
      
      // Create verification record
      const verification: HardwareKeyVerification = {
        deviceId: response.id,
        challenge: challenge.challenge,
        signedResponse: response,
        timestamp,
        verified,
        deviceInfo
      };

      // Log to audit trail
      this.logAuditEntry({
        action,
        hardwareKey: true,
        device: deviceInfo.name,
        timestamp,
        userId,
        success: verified,
        error: verified ? undefined : 'Hardware key verification failed'
      });

      return verification;
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      
      this.logAuditEntry({
        action,
        hardwareKey: true,
        device: 'Unknown',
        timestamp,
        userId,
        success: false,
        error
      });
      
      throw new Error(`Hardware key verification failed: ${error}`);
    }
  }

  /**
   * Check if hardware key is required for action
   */
  isHardwareKeyRequired(action: string): boolean {
    return this.config.enabled && this.config.requiredForActions.includes(action);
  }

  /**
   * Get risk level for action
   */
  getActionRiskLevel(action: string): 'LOW' | 'HIGH' | 'CRITICAL' {
    const criticalActions = ['MODEL_DEPLOY', 'EMERGENCY_UNLOCK', 'GOVERNANCE_CHANGE'];
    const highRiskActions = ['SKILL_PUBLISH', 'TENANT_CREATE', 'CRITICAL_CONFIG_CHANGE'];
    
    if (criticalActions.includes(action)) return 'CRITICAL';
    if (highRiskActions.includes(action)) return 'HIGH';
    return 'LOW';
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit?: number): AuditLogEntry[] {
    const logs = [...this.auditLogs].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get hardware key usage statistics
   */
  getUsageStats(): {
    totalVerifications: number;
    successRate: number;
    mostUsedDevice: string;
    recentActivity: AuditLogEntry[];
  } {
    const logs = this.auditLogs.filter(log => log.hardwareKey);
    const totalVerifications = logs.length;
    const successfulVerifications = logs.filter(log => log.success).length;
    const successRate = totalVerifications > 0 ? (successfulVerifications / totalVerifications) * 100 : 0;
    
    // Find most used device
    const deviceCounts = logs.reduce((acc, log) => {
      acc[log.device] = (acc[log.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedDevice = Object.entries(deviceCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    
    // Get recent activity (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentActivity = logs.filter(log => log.timestamp > oneDayAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalVerifications,
      successRate: Math.round(successRate * 100) / 100,
      mostUsedDevice,
      recentActivity
    };
  }

  /**
   * Create WebAuthn credential registration challenge
   */
  async createRegistrationChallenge(userId: string, userName: string): Promise<any> {
    const challenge = this.generateRandomChallenge();
    
    return {
      publicKey: {
        challenge: this.base64UrlEncode(challenge),
        rp: {
          name: this.config.rpName,
          id: this.config.rpId
        },
        user: {
          id: this.base64UrlEncode(userId),
          name: userName,
          displayName: userName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          userVerification: 'required',
          authenticatorAttachment: 'cross-platform'
        },
        timeout: this.config.timeoutMs
      }
    };
  }

  /**
   * Private helper methods
   */
  private generateRandomChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private base64UrlEncode(data: string): string {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(data: string): string {
    data = data.replace(/-/g, '+').replace(/_/g, '/');
    while (data.length % 4) {
      data += '=';
    }
    return atob(data);
  }

  private async verifyWebAuthnResponse(
    challenge: HardwareKeyChallenge,
    response: HardwareKeyResponse
  ): Promise<boolean> {
    try {
      // In a real implementation, this would perform full WebAuthn verification
      // For demo purposes, we'll simulate verification with basic checks
      
      // Verify challenge matches
      const clientData = JSON.parse(this.base64UrlDecode(response.response.clientDataJSON));
      if (clientData.challenge !== challenge.challenge) {
        return false;
      }
      
      // Verify origin
      if (clientData.origin !== `https://${challenge.rpId}`) {
        return false;
      }
      
      // Verify timestamp is recent
      const now = Date.now();
      if (clientData.challengeTime && (now - clientData.challengeTime) > challenge.timeout) {
        return false;
      }
      
      // In production, verify the signature against the public key
      // For demo, we'll assume it's valid if basic checks pass
      return true;
      
    } catch (error) {
      console.error('WebAuthn verification error:', error);
      return false;
    }
  }

  private async extractDeviceInfo(response: HardwareKeyResponse): Promise<{name: string, type: string, manufacturer?: string}> {
    // In a real implementation, extract device info from authenticator data
    // For demo purposes, return simulated device info
    return {
      name: 'YubiKey 5C',
      type: 'USB',
      manufacturer: 'Yubico'
    };
  }

  private logAuditEntry(entry: AuditLogEntry): void {
    this.auditLogs.push(entry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }
}

export const hardwareKeyService = new HardwareKeyService();
