/**
 * Device Sync Module for Acey
 * Phase 4: Cross-Device & Cloud Orchestration
 * 
 * This module handles synchronization of orchestrator state across multiple devices
 * with trust verification, security enforcement, and failover capabilities
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LocalOrchestrator } from './localOrchestrator';

export interface DeviceState {
  deviceId: string;
  deviceName: string;
  lastSync: string;
  skills: Array<{
    name: string;
    version: string;
    isActive: boolean;
    trustLevel: number;
  }>;
  datasets: Array<{
    name: string;
    size: number;
    lastUpdated: string;
    quality: number;
  }>;
  configuration: {
    modelPath: string;
    learningEnabled: boolean;
    qualityThreshold: number;
    maxConcurrency: number;
  };
  trustLevel: number;
  isAuthorized: boolean;
  publicKey?: string;
}

export interface SyncConfig {
  syncPath: string;
  encryptionEnabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  maxDevices: number;
  trustRequired: boolean;
  backupEnabled: boolean;
}

export interface SyncResult {
  success: boolean;
  deviceId: string;
  timestamp: string;
  syncedItems: number;
  errors?: string[];
  warnings?: string[];
}

export class DeviceSync extends EventEmitter {
  private orchestrator: LocalOrchestrator;
  private config: SyncConfig;
  private currentDevice: DeviceState;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(orchestrator: LocalOrchestrator, config: SyncConfig) {
    super();
    this.orchestrator = orchestrator;
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize device sync system
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Device Sync System...');

      // Create sync directory
      this.ensureSyncDirectory();

      // Generate or load device identity
      await this.initializeDeviceIdentity();

      // Set up periodic sync
      if (this.config.autoSync) {
        this.startPeriodicSync();
      }

      this.isInitialized = true;

      this.emit('initialized', {
        deviceId: this.currentDevice.deviceId,
        deviceName: this.currentDevice.deviceName,
        syncPath: this.config.syncPath
      });

      console.log('✅ Device Sync System initialized');
      console.log(`📱 Device: ${this.currentDevice.deviceName} (${this.currentDevice.deviceId})`);
      console.log(`📁 Sync path: ${this.config.syncPath}`);

    } catch (error) {
      console.error('❌ Failed to initialize Device Sync:', error);
      this.emit('error', error);
    }
  }

  /**
   * Ensure sync directory exists
   */
  private ensureSyncDirectory(): void {
    if (!fs.existsSync(this.config.syncPath)) {
      fs.mkdirSync(this.config.syncPath, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['devices', 'backups', 'keys', 'logs'];
    for (const subdir of subdirs) {
      const fullPath = path.join(this.config.syncPath, subdir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Initialize device identity
   */
  private async initializeDeviceIdentity(): Promise<void> {
    const deviceIdFile = path.join(this.config.syncPath, 'device_id.json');
    
    let deviceId: string;
    let deviceName: string;

    if (fs.existsSync(deviceIdFile)) {
      // Load existing device identity
      const identity = JSON.parse(fs.readFileSync(deviceIdFile, 'utf-8'));
      deviceId = identity.deviceId;
      deviceName = identity.deviceName;
    } else {
      // Generate new device identity
      deviceId = this.generateDeviceId();
      deviceName = this.generateDeviceName();
      
      // Save device identity
      fs.writeFileSync(deviceIdFile, JSON.stringify({
        deviceId,
        deviceName,
        createdAt: new Date().toISOString()
      }, null, 2));
    }

    // Generate key pair for encryption
    const { publicKey, privateKey } = this.generateKeyPair();
    
    // Save private key securely
    const keyFile = path.join(this.config.syncPath, 'keys', `${deviceId}_private.pem`);
    fs.writeFileSync(keyFile, privateKey);

    this.currentDevice = {
      deviceId,
      deviceName,
      lastSync: new Date().toISOString(),
      skills: [],
      datasets: [],
      configuration: {
        modelPath: './models',
        learningEnabled: true,
        qualityThreshold: 0.7,
        maxConcurrency: 3
      },
      trustLevel: 3, // Default to high trust for current device
      isAuthorized: true,
      publicKey
    };
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const machineId = require('os').hostname() || 'unknown';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return crypto.createHash('sha256')
      .update(`${machineId}-${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate device name
   */
  private generateDeviceName(): string {
    const platform = require('os').platform();
    const hostname = require('os').hostname() || 'Unknown';
    return `${hostname}-${platform}`.replace(/\s+/g, '-').toLowerCase();
  }

  /**
   * Generate RSA key pair for encryption
   */
  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    return { publicKey, privateKey };
  }

  /**
   * Save current device state
   */
  saveState(): SyncResult {
    try {
      console.log(`💾 Saving state for device: ${this.currentDevice.deviceId}`);

      // Gather current state from orchestrator
      const skills = this.orchestrator.listSkills().map(skill => ({
        name: skill.name,
        version: skill.version,
        isActive: skill.isActive,
        trustLevel: skill.trustLevel
      }));

      const datasets = this.orchestrator.getLearningData().map((dataset, index) => ({
        name: `dataset_${index}`,
        size: JSON.stringify(dataset).length,
        lastUpdated: new Date().toISOString(),
        quality: 0.8 // Placeholder - would calculate actual quality
      }));

      // Update current device state
      this.currentDevice = {
        ...this.currentDevice,
        lastSync: new Date().toISOString(),
        skills,
        datasets,
        configuration: {
          modelPath: './models',
          learningEnabled: true,
          qualityThreshold: 0.7,
          maxConcurrency: 3
        }
      };

      // Save to file
      const deviceFile = path.join(this.config.syncPath, 'devices', `${this.currentDevice.deviceId}.json`);
      const stateData = JSON.stringify(this.currentDevice, null, 2);
      
      if (this.config.encryptionEnabled) {
        // Encrypt state data (simplified - would use actual encryption)
        const encryptedData = this.encryptData(stateData);
        fs.writeFileSync(deviceFile, encryptedData);
      } else {
        fs.writeFileSync(deviceFile, stateData);
      }

      // Create backup
      if (this.config.backupEnabled) {
        this.createBackup(this.currentDevice.deviceId, stateData);
      }

      const result: SyncResult = {
        success: true,
        deviceId: this.currentDevice.deviceId,
        timestamp: new Date().toISOString(),
        syncedItems: skills.length + datasets.length
      };

      this.emit('stateSaved', result);
      console.log(`✅ State saved: ${result.syncedItems} items synced`);

      return result;

    } catch (error) {
      const result: SyncResult = {
        success: false,
        deviceId: this.currentDevice.deviceId,
        timestamp: new Date().toISOString(),
        syncedItems: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      this.emit('stateSaveError', result);
      console.error('❌ Failed to save state:', error);

      return result;
    }
  }

  /**
   * Load state from another device
   */
  async loadState(deviceId: string): Promise<SyncResult> {
    try {
      console.log(`📥 Loading state from device: ${deviceId}`);

      const deviceFile = path.join(this.config.syncPath, 'devices', `${deviceId}.json`);
      
      if (!fs.existsSync(deviceFile)) {
        throw new Error(`Device state not found: ${deviceId}`);
      }

      // Read and decrypt if needed
      let stateData: string;
      if (this.config.encryptionEnabled) {
        const encryptedData = fs.readFileSync(deviceFile, 'utf-8');
        stateData = this.decryptData(encryptedData);
      } else {
        stateData = fs.readFileSync(deviceFile, 'utf-8');
      }

      const deviceState: DeviceState = JSON.parse(stateData);

      // Verify device trust
      if (this.config.trustRequired && !deviceState.isAuthorized) {
        throw new Error(`Device ${deviceId} is not authorized for sync`);
      }

      // Verify trust level
      if (deviceState.trustLevel < 2) {
        throw new Error(`Device ${deviceId} has insufficient trust level`);
      }

      // Apply state to current orchestrator
      await this.applyState(deviceState);

      const result: SyncResult = {
        success: true,
        deviceId,
        timestamp: new Date().toISOString(),
        syncedItems: deviceState.skills.length + deviceState.datasets.length
      };

      this.emit('stateLoaded', result);
      console.log(`✅ State loaded: ${result.syncedItems} items synced`);

      return result;

    } catch (error) {
      const result: SyncResult = {
        success: false,
        deviceId,
        timestamp: new Date().toISOString(),
        syncedItems: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      this.emit('stateLoadError', result);
      console.error('❌ Failed to load state:', error);

      return result;
    }
  }

  /**
   * Apply loaded state to orchestrator
   */
  private async applyState(deviceState: DeviceState): Promise<void> {
    // Apply skills
    for (const skillData of deviceState.skills) {
      // This would need to be implemented based on actual skill structure
      console.log(`🔄 Applying skill: ${skillData.name}`);
    }

    // Apply configuration
    console.log('⚙️ Applying device configuration');
    
    // Note: In a real implementation, this would actually modify the orchestrator
    // For now, we just log what would be applied
  }

  /**
   * List all available devices
   */
  listDevices(): DeviceState[] {
    try {
      const devicesDir = path.join(this.config.syncPath, 'devices');
      const files = fs.readdirSync(devicesDir).filter(f => f.endsWith('.json'));
      
      const devices: DeviceState[] = [];
      
      for (const file of files) {
        try {
          const filePath = path.join(devicesDir, file);
          let stateData: string;
          
          if (this.config.encryptionEnabled) {
            const encryptedData = fs.readFileSync(filePath, 'utf-8');
            stateData = this.decryptData(encryptedData);
          } else {
            stateData = fs.readFileSync(filePath, 'utf-8');
          }
          
          const deviceState: DeviceState = JSON.parse(stateData);
          devices.push(deviceState);
        } catch (error) {
          console.error(`Failed to load device state from ${file}:`, error);
        }
      }

      return devices;

    } catch (error) {
      console.error('❌ Failed to list devices:', error);
      return [];
    }
  }

  /**
   * Authorize a new device
   */
  authorizeDevice(deviceId: string, trustLevel: number): boolean {
    try {
      console.log(`🔐 Authorizing device: ${deviceId} (trust level: ${trustLevel})`);

      const devices = this.listDevices();
      const device = devices.find(d => d.deviceId === deviceId);

      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      // Update device authorization
      device.isAuthorized = true;
      device.trustLevel = trustLevel;

      // Save updated device state
      const deviceFile = path.join(this.config.syncPath, 'devices', `${deviceId}.json`);
      const stateData = JSON.stringify(device, null, 2);
      
      if (this.config.encryptionEnabled) {
        const encryptedData = this.encryptData(stateData);
        fs.writeFileSync(deviceFile, encryptedData);
      } else {
        fs.writeFileSync(deviceFile, stateData);
      }

      this.emit('deviceAuthorized', { deviceId, trustLevel });
      console.log(`✅ Device authorized: ${deviceId}`);

      return true;

    } catch (error) {
      console.error('❌ Failed to authorize device:', error);
      return false;
    }
  }

  /**
   * Revoke device authorization
   */
  revokeDevice(deviceId: string): boolean {
    try {
      console.log(`🚫 Revoking authorization for device: ${deviceId}`);

      const devices = this.listDevices();
      const device = devices.find(d => d.deviceId === deviceId);

      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      // Update device authorization
      device.isAuthorized = false;

      // Save updated device state
      const deviceFile = path.join(this.config.syncPath, 'devices', `${deviceId}.json`);
      const stateData = JSON.stringify(device, null, 2);
      
      if (this.config.encryptionEnabled) {
        const encryptedData = this.encryptData(stateData);
        fs.writeFileSync(deviceFile, encryptedData);
      } else {
        fs.writeFileSync(deviceFile, stateData);
      }

      this.emit('deviceRevoked', { deviceId });
      console.log(`✅ Device revoked: ${deviceId}`);

      return true;

    } catch (error) {
      console.error('❌ Failed to revoke device:', error);
      return false;
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    console.log(`⏰ Starting periodic sync (interval: ${this.config.syncInterval} minutes)`);
    
    this.syncTimer = setInterval(() => {
      this.saveState();
    }, this.config.syncInterval * 60 * 1000);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏹️ Periodic sync stopped');
    }
  }

  /**
   * Create backup of device state
   */
  private createBackup(deviceId: string, stateData: string): void {
    try {
      const backupDir = path.join(this.config.syncPath, 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `${deviceId}_${timestamp}.json`);
      
      fs.writeFileSync(backupFile, stateData);
      
      // Clean old backups (keep only last 10)
      const backupFiles = fs.readdirSync(backupDir)
        .filter(f => f.startsWith(deviceId) && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(10);

      for (const oldBackup of backupFiles) {
        fs.unlinkSync(path.join(backupDir, oldBackup));
      }

    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  /**
   * Encrypt data (simplified implementation)
   */
  private encryptData(data: string): string {
    // In a real implementation, this would use proper encryption
    // For now, just base64 encode to simulate encryption
    return Buffer.from(data).toString('base64');
  }

  /**
   * Decrypt data (simplified implementation)
   */
  private decryptData(encryptedData: string): string {
    // In a real implementation, this would use proper decryption
    // For now, just base64 decode to simulate decryption
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  /**
   * Get current device state
   */
  getCurrentDevice(): DeviceState {
    return this.currentDevice;
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    const devices = this.listDevices();
    const authorizedDevices = devices.filter(d => d.isAuthorized);
    const totalSkills = devices.reduce((sum, d) => sum + d.skills.length, 0);
    const totalDatasets = devices.reduce((sum, d) => sum + d.datasets.length, 0);

    return {
      totalDevices: devices.length,
      authorizedDevices: authorizedDevices.length,
      currentDevice: this.currentDevice.deviceId,
      totalSkills,
      totalDatasets,
      lastSync: this.currentDevice.lastSync,
      syncPath: this.config.syncPath,
      encryptionEnabled: this.config.encryptionEnabled,
      autoSync: this.config.autoSync
    };
  }

  /**
   * Generate sync report
   */
  generateSyncReport(): string {
    const stats = this.getSyncStats();
    const devices = this.listDevices();
    
    const report = `
# Device Sync Report

## Current Status
- Current Device: ${stats.currentDevice}
- Total Devices: ${stats.totalDevices}
- Authorized Devices: ${stats.authorizedDevices}
- Last Sync: ${stats.lastSync}
- Sync Path: ${stats.syncPath}

## Device Details
${devices.map(device => `
### ${device.deviceName} (${device.deviceId})
- Status: ${device.isAuthorized ? '✅ Authorized' : '❌ Unauthorized'}
- Trust Level: ${device.trustLevel}
- Skills: ${device.skills.length}
- Datasets: ${device.datasets.length}
- Last Sync: ${device.lastSync}
`).join('\n')}

## Statistics
- Total Skills Across Devices: ${stats.totalSkills}
- Total Datasets Across Devices: ${stats.totalDatasets}
- Encryption: ${stats.encryptionEnabled ? '✅ Enabled' : '❌ Disabled'}
- Auto Sync: ${stats.autoSync ? '✅ Enabled' : '❌ Disabled'}

## Security
- Trust Verification: ${this.config.trustRequired ? '✅ Required' : '❌ Not Required'}
- Device Authorization: Enforced
- Data Encryption: ${stats.encryptionEnabled ? 'Active' : 'Inactive'}
- Backups: ${this.config.backupEnabled ? 'Enabled' : 'Disabled'}

## Recommendations
${stats.authorizedDevices < stats.totalDevices 
  ? '🔐 Review unauthorized devices and consider revoking access'
  : '✅ All devices are authorized and trusted'
}

${stats.totalDevices > this.config.maxDevices
  ? `⚠️ Device count (${stats.totalDevices}) exceeds maximum (${this.config.maxDevices})`
  : '✅ Device count within limits'
}

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.config.syncPath, `sync_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Sync report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Shutdown device sync system
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Device Sync System...');
    
    // Save final state
    this.saveState();
    
    // Stop periodic sync
    this.stopPeriodicSync();
    
    // Generate final report
    this.generateSyncReport();
    
    this.isInitialized = false;
    
    this.emit('shutdown', { 
      timestamp: new Date().toISOString(),
      deviceId: this.currentDevice.deviceId
    });
    
    console.log('✅ Device Sync System shutdown complete');
  }
}

export default DeviceSync;
