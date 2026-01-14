/**
 * Cross-Device Unlock Quorum System
 * Multi-key safety requiring multiple device confirmations
 */

export interface TrustedDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet' | 'hardware';
  lastSeen: number;
  trustLevel: number;
  biometricSupported: boolean;
  revoked: boolean;
}

export interface UnlockQuorum {
  required: number;
  devices: TrustedDevice[];
  timeout: number; // milliseconds
  createdAt: number;
  expiresAt: number;
}

export interface UnlockRequest {
  id: string;
  action: string;
  requester: string;
  quorum: UnlockQuorum;
  confirmations: DeviceConfirmation[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export interface DeviceConfirmation {
  deviceId: string;
  deviceName: string;
  confirmedAt: number;
  biometricVerified: boolean;
  ipAddress: string;
  userAgent: string;
}

class QuorumUnlockService {
  private activeRequests = new Map<string, UnlockRequest>();
  private trustedDevices = new Map<string, TrustedDevice>();
  
  constructor() {
    this.initializeDefaultDevices();
  }

  /**
   * Initialize default trusted devices
   */
  private initializeDefaultDevices(): void {
    const defaultDevices: TrustedDevice[] = [
      {
        id: 'pixel7',
        name: 'Pixel 7',
        type: 'mobile',
        lastSeen: Date.now(),
        trustLevel: 5,
        biometricSupported: true,
        revoked: false
      },
      {
        id: 'desktop',
        name: 'Desktop',
        type: 'desktop', 
        lastSeen: Date.now(),
        trustLevel: 4,
        biometricSupported: false,
        revoked: false
      },
      {
        id: 'tablet',
        name: 'Tablet',
        type: 'tablet',
        lastSeen: Date.now(),
        trustLevel: 3,
        biometricSupported: true,
        revoked: false
      }
    ];

    defaultDevices.forEach(device => {
      this.trustedDevices.set(device.id, device);
    });
  }

  /**
   * Create unlock request with quorum requirements
   */
  async createUnlockRequest(
    action: string,
    requester: string,
    requiredDevices: number = 2,
    timeoutMinutes: number = 5
  ): Promise<UnlockRequest> {
    const requestId = this.generateRequestId();
    const now = Date.now();
    const timeout = timeoutMinutes * 60 * 1000;
    
    // Get active trusted devices
    const activeDevices = Array.from(this.trustedDevices.values())
      .filter(device => !device.revoked && device.lastSeen > now - (24 * 60 * 60 * 1000)); // Active in last 24h
    
    if (activeDevices.length < requiredDevices) {
      throw new Error(`Insufficient trusted devices. Need ${requiredDevices}, have ${activeDevices.length}`);
    }

    const quorum: UnlockQuorum = {
      required: requiredDevices,
      devices: activeDevices,
      timeout,
      createdAt: now,
      expiresAt: now + timeout
    };

    const unlockRequest: UnlockRequest = {
      id: requestId,
      action,
      requester,
      quorum,
      confirmations: [],
      status: 'pending',
      createdAt: now,
      expiresAt: now + timeout
    };

    this.activeRequests.set(requestId, unlockRequest);
    
    // Auto-expire check
    setTimeout(() => {
      this.expireRequest(requestId);
    }, timeout);

    return unlockRequest;
  }

  /**
   * Confirm unlock request from a device
   */
  async confirmUnlock(
    requestId: string,
    deviceId: string,
    biometricToken?: string
  ): Promise<UnlockRequest> {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      throw new Error('Unlock request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is ${request.status}`);
    }

    const device = this.trustedDevices.get(deviceId);
    if (!device || device.revoked) {
      throw new Error('Device not trusted');
    }

    // Check if device already confirmed
    const existingConfirmation = request.confirmations.find(c => c.deviceId === deviceId);
    if (existingConfirmation) {
      throw new Error('Device already confirmed');
    }

    // Verify biometric if required
    let biometricVerified = false;
    if (device.biometricSupported) {
      biometricVerified = await this.verifyBiometric(biometricToken);
      if (!biometricVerified) {
        throw new Error('Biometric verification failed');
      }
    } else {
      biometricVerified = true; // Non-biometric devices auto-verify
    }

    // Add confirmation
    const confirmation: DeviceConfirmation = {
      deviceId,
      deviceName: device.name,
      confirmedAt: Date.now(),
      biometricVerified,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    };

    request.confirmations.push(confirmations);
    
    // Update device last seen
    device.lastSeen = Date.now();
    this.trustedDevices.set(deviceId, device);

    // Check if quorum is met
    if (request.confirmations.length >= request.quorum.required) {
      request.status = 'approved';
      this.activeRequests.set(requestId, request);
    }

    return request;
  }

  /**
   * Reject unlock request
   */
  async rejectUnlock(requestId: string, deviceId: string, reason?: string): Promise<UnlockRequest> {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      throw new Error('Unlock request not found');
    }

    const device = this.trustedDevices.get(deviceId);
    if (!device || device.revoked) {
      throw new Error('Device not trusted');
    }

    request.status = 'rejected';
    this.activeRequests.set(requestId, request);

    // Log rejection for audit
    console.log(`Unlock request ${requestId} rejected by device ${deviceId}`, reason);

    return request;
  }

  /**
   * Get pending unlock requests
   */
  getPendingRequests(): UnlockRequest[] {
    const now = Date.now();
    return Array.from(this.activeRequests.values())
      .filter(request => 
        request.status === 'pending' && 
        request.expiresAt > now
      );
  }

  /**
   * Get unlock request status
   */
  getUnlockRequest(requestId: string): UnlockRequest | null {
    const request = this.activeRequests.get(requestId);
    if (!request) return null;

    // Check if expired
    if (request.status === 'pending' && request.expiresAt < Date.now()) {
      request.status = 'expired';
      this.activeRequests.set(requestId, request);
    }

    return request;
  }

  /**
   * Add trusted device
   */
  addTrustedDevice(device: Omit<TrustedDevice, 'id'>): string {
    const deviceId = this.generateDeviceId();
    const newDevice: TrustedDevice = {
      ...device,
      id: deviceId
    };
    
    this.trustedDevices.set(deviceId, newDevice);
    return deviceId;
  }

  /**
   * Revoke trusted device
   */
  revokeDevice(deviceId: string): void {
    const device = this.trustedDevices.get(deviceId);
    if (device) {
      device.revoked = true;
      this.trustedDevices.set(deviceId, device);
      
      // Cancel any pending requests that rely on this device
      this.recalculateActiveRequests();
    }
  }

  /**
   * Get all trusted devices
   */
  getTrustedDevices(): TrustedDevice[] {
    return Array.from(this.trustedDevices.values());
  }

  /**
   * Get quorum status for UI
   */
  getQuorumStatus(requestId: string): {
    total: number;
    confirmed: number;
    required: number;
    remaining: number;
    confirmedDevices: string[];
    pendingDevices: string[];
    timeRemaining: number;
  } | null {
    const request = this.activeRequests.get(requestId);
    if (!request) return null;

    const now = Date.now();
    const timeRemaining = Math.max(0, request.expiresAt - now);
    
    return {
      total: request.quorum.devices.length,
      confirmed: request.confirmations.length,
      required: request.quorum.required,
      remaining: Math.max(0, request.quorum.required - request.confirmations.length),
      confirmedDevices: request.confirmations.map(c => c.deviceName),
      pendingDevices: request.quorum.devices
        .filter(d => !request.confirmations.some(c => c.deviceId === d.id))
        .map(d => d.name),
      timeRemaining
    };
  }

  /**
   * Private helper methods
   */
  private generateRequestId(): string {
    return `unlock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async verifyBiometric(token?: string): Promise<boolean> {
    // In a real implementation, this would verify the biometric token
    // For demo purposes, we'll simulate verification
    return !!token && token.length > 10;
  }

  private getClientIP(): string {
    // In a real implementation, get actual client IP
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    // In a real implementation, get actual user agent
    return 'Acey Control Center';
  }

  private expireRequest(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'expired';
      this.activeRequests.set(requestId, request);
    }
  }

  private recalculateActiveRequests(): void {
    const activeDevices = Array.from(this.trustedDevices.values())
      .filter(device => !device.revoked);

    for (const [requestId, request] of this.activeRequests) {
      if (request.status === 'pending') {
        // Check if we still have enough devices
        const availableDevices = request.quorum.devices.filter(
          device => !device.revoked
        );
        
        if (availableDevices.length < request.quorum.required) {
          request.status = 'rejected';
          this.activeRequests.set(requestId, request);
        }
      }
    }
  }
}

export const quorumUnlockService = new QuorumUnlockService();
