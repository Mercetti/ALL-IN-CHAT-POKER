/**
 * Trust System for Acey
 * Phase 2: Device Sync & Security
 * 
 * This module provides QR code generation, biometric verification,
 * and trust management for secure device pairing
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface TrustToken {
  tokenId: string;
  deviceId: string;
  userId: string;
  issuedAt: string;
  expiresAt: string;
  trustLevel: number;
  permissions: string[];
  signature: string;
}

export interface QRCodeData {
  type: string;
  version: string;
  deviceId: string;
  deviceName: string;
  publicKey: string;
  trustToken: string;
  timestamp: string;
  expiresAt: string;
  checksum: string;
}

export interface BiometricTemplate {
  deviceId: string;
  userId: string;
  biometricType: 'fingerprint' | 'face' | 'voice' | 'iris';
  templateHash: string;
  createdAt: string;
  lastUsed: string;
  trustLevel: number;
  isActive: boolean;
  attempts: number;
  maxAttempts: number;
}

export interface TrustConfig {
  tokenExpirationMinutes: number;
  maxBiometricAttempts: number;
  qrCodeSize: number;
  encryptionEnabled: boolean;
  biometricThreshold: number;
}

export class TrustSystem extends EventEmitter {
  private config: TrustConfig;
  private trustTokens: Map<string, TrustToken> = new Map();
  private biometricTemplates: Map<string, BiometricTemplate> = new Map();

  constructor(config: TrustConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize trust system
   */
  private initialize(): void {
    console.log('🔐 Initializing Trust System...');
    
    // Load existing trust tokens and biometric templates
    this.loadTrustData();
    
    console.log('✅ Trust System initialized');
    console.log(`🎫 Active tokens: ${this.trustTokens.size}`);
    console.log(`👆 Biometric templates: ${this.biometricTemplates.size}`);
  }

  /**
   * Generate trust token for device pairing
   */
  generateTrustToken(deviceId: string, userId: string, trustLevel: number, permissions: string[]): TrustToken {
    const tokenId = 'trust_' + crypto.randomBytes(16).toString('hex');
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.config.tokenExpirationMinutes * 60 * 1000).toISOString();
    
    const tokenData = {
      tokenId,
      deviceId,
      userId,
      issuedAt,
      expiresAt,
      trustLevel,
      permissions
    };
    
    const signature = this.signData(tokenData);
    
    const trustToken: TrustToken = {
      ...tokenData,
      signature
    };
    
    // Store token
    this.trustTokens.set(tokenId, trustToken);
    this.saveTrustData();
    
    console.log(`🎫 Generated trust token: ${tokenId}`);
    console.log(`📱 Device: ${deviceId}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🔐 Trust Level: ${trustLevel}`);
    console.log(`⏰ Expires: ${expiresAt}`);
    
    this.emit('trustTokenGenerated', trustToken);
    
    return trustToken;
  }

  /**
   * Verify trust token
   */
  verifyTrustToken(tokenId: string, deviceId: string): boolean {
    const token = this.trustTokens.get(tokenId);
    
    if (!token) {
      console.log(`❌ Trust token not found: ${tokenId}`);
      return false;
    }
    
    // Check expiration
    if (new Date() > new Date(token.expiresAt)) {
      console.log(`❌ Trust token expired: ${tokenId}`);
      this.trustTokens.delete(tokenId);
      this.saveTrustData();
      return false;
    }
    
    // Check device ID match
    if (token.deviceId !== deviceId) {
      console.log(`❌ Device ID mismatch: expected ${token.deviceId}, got ${deviceId}`);
      return false;
    }
    
    // Verify signature
    const tokenData = {
      tokenId: token.tokenId,
      deviceId: token.deviceId,
      userId: token.userId,
      issuedAt: token.issuedAt,
      expiresAt: token.expiresAt,
      trustLevel: token.trustLevel,
      permissions: token.permissions
    };
    
    const isValidSignature = this.verifySignature(tokenData, token.signature);
    
    if (!isValidSignature) {
      console.log(`❌ Invalid signature for token: ${tokenId}`);
      return false;
    }
    
    console.log(`✅ Trust token verified: ${tokenId}`);
    this.emit('trustTokenVerified', token);
    
    return true;
  }

  /**
   * Generate QR code for device pairing
   */
  generateQRCode(deviceId: string, deviceName: string, publicKey: string, trustToken: TrustToken): QRCodeData {
    const timestamp = new Date().toISOString();
    const checksum = this.generateChecksum({
      deviceId,
      deviceName,
      publicKey,
      trustToken: trustToken.tokenId,
      timestamp
    });
    
    const qrData: QRCodeData = {
      type: 'acey_device_pairing',
      version: '1.0',
      deviceId,
      deviceName,
      publicKey,
      trustToken: trustToken.tokenId,
      timestamp,
      expiresAt: trustToken.expiresAt,
      checksum
    };
    
    console.log(`📱 Generated QR code for device: ${deviceName}`);
    console.log(`🆔 Device ID: ${deviceId}`);
    console.log(`🎫 Trust Token: ${trustToken.tokenId}`);
    console.log(`🔐 Checksum: ${checksum}`);
    
    this.emit('qrCodeGenerated', qrData);
    
    return qrData;
  }

  /**
   * Verify QR code data
   */
  verifyQRCode(qrData: QRCodeData): boolean {
    // Check type and version
    if (qrData.type !== 'acey_device_pairing') {
      console.log(`❌ Invalid QR code type: ${qrData.type}`);
      return false;
    }
    
    if (qrData.version !== '1.0') {
      console.log(`❌ Unsupported QR code version: ${qrData.version}`);
      return false;
    }
    
    // Check expiration
    if (new Date() > new Date(qrData.expiresAt)) {
      console.log(`❌ QR code expired: ${qrData.expiresAt}`);
      return false;
    }
    
    // Verify checksum
    const expectedChecksum = this.generateChecksum({
      deviceId: qrData.deviceId,
      deviceName: qrData.deviceName,
      publicKey: qrData.publicKey,
      trustToken: qrData.trustToken,
      timestamp: qrData.timestamp
    });
    
    if (qrData.checksum !== expectedChecksum) {
      console.log(`❌ QR code checksum mismatch`);
      return false;
    }
    
    // Verify trust token exists
    const trustToken = this.trustTokens.get(qrData.trustToken);
    if (!trustToken) {
      console.log(`❌ Trust token not found in QR: ${qrData.trustToken}`);
      return false;
    }
    
    console.log(`✅ QR code verified for device: ${qrData.deviceName}`);
    this.emit('qrCodeVerified', qrData);
    
    return true;
  }

  /**
   * Create biometric template
   */
  createBiometricTemplate(deviceId: string, userId: string, biometricType: 'fingerprint' | 'face' | 'voice' | 'iris', biometricData: string): BiometricTemplate {
    const templateHash = this.hashBiometricData(biometricData);
    const createdAt = new Date().toISOString();
    
    const template: BiometricTemplate = {
      deviceId,
      userId,
      biometricType,
      templateHash,
      createdAt,
      lastUsed: createdAt,
      trustLevel: 3, // Highest trust level for biometrics
      isActive: true,
      attempts: 0,
      maxAttempts: this.config.maxBiometricAttempts
    };
    
    // Store template
    const templateKey = `${deviceId}_${userId}_${biometricType}`;
    this.biometricTemplates.set(templateKey, template);
    this.saveTrustData();
    
    console.log(`👆 Created biometric template: ${templateKey}`);
    console.log(`📱 Device: ${deviceId}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🔍 Type: ${biometricType}`);
    console.log(`🔐 Trust Level: ${template.trustLevel}`);
    
    this.emit('biometricTemplateCreated', template);
    
    return template;
  }

  /**
   * Verify biometric data
   */
  verifyBiometric(deviceId: string, userId: string, biometricType: 'fingerprint' | 'face' | 'voice' | 'iris', biometricData: string): boolean {
    const templateKey = `${deviceId}_${userId}_${biometricType}`;
    const template = this.biometricTemplates.get(templateKey);
    
    if (!template) {
      console.log(`❌ Biometric template not found: ${templateKey}`);
      return false;
    }
    
    if (!template.isActive) {
      console.log(`❌ Biometric template inactive: ${templateKey}`);
      return false;
    }
    
    if (template.attempts >= template.maxAttempts) {
      console.log(`❌ Biometric attempts exceeded: ${templateKey}`);
      return false;
    }
    
    // Increment attempts
    template.attempts++;
    template.lastUsed = new Date().toISOString();
    
    // Verify biometric data
    const inputHash = this.hashBiometricData(biometricData);
    const similarity = this.calculateBiometricSimilarity(template.templateHash, inputHash);
    
    const isVerified = similarity >= this.config.biometricThreshold;
    
    if (isVerified) {
      // Reset attempts on successful verification
      template.attempts = 0;
      console.log(`✅ Biometric verified: ${templateKey}`);
      console.log(`🎯 Similarity: ${similarity.toFixed(3)}`);
    } else {
      console.log(`❌ Biometric verification failed: ${templateKey}`);
      console.log(`🎯 Similarity: ${similarity.toFixed(3)} (threshold: ${this.config.biometricThreshold})`);
      
      if (template.attempts >= template.maxAttempts) {
        template.isActive = false;
        console.log(`🚫 Biometric template locked: ${templateKey}`);
        this.emit('biometricTemplateLocked', template);
      }
    }
    
    this.saveTrustData();
    this.emit('biometricVerificationAttempt', {
      templateKey,
      isVerified,
      similarity,
      attempts: template.attempts
    });
    
    return isVerified;
  }

  /**
   * Sign data with private key
   */
  private signData(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify data signature
   */
  private verifySignature(data: any, signature: string): boolean {
    const expectedSignature = this.signData(data);
    return signature === expectedSignature;
  }

  /**
   * Generate checksum for QR code data
   */
  private generateChecksum(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  /**
   * Hash biometric data
   */
  private hashBiometricData(biometricData: string): string {
    return crypto.createHash('sha256').update(biometricData).digest('hex');
  }

  /**
   * Calculate biometric similarity (simplified)
   */
  private calculateBiometricSimilarity(hash1: string, hash2: string): number {
    // Simple Hamming distance calculation
    let differences = 0;
    const minLength = Math.min(hash1.length, hash2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (hash1[i] !== hash2[i]) {
        differences++;
      }
    }
    
    const maxDifferences = minLength;
    const similarity = 1 - (differences / maxDifferences);
    
    return Math.max(0, similarity);
  }

  /**
   * Load trust data from storage
   */
  private loadTrustData(): void {
    try {
      const trustDataPath = './models/device_sync/keys/trust_data.json';
      
      if (fs.existsSync(trustDataPath)) {
        const data = JSON.parse(fs.readFileSync(trustDataPath, 'utf-8'));
        
        // Load trust tokens
        if (data.trustTokens) {
          Object.entries(data.trustTokens).forEach(([key, value]) => {
            this.trustTokens.set(key, value as TrustToken);
          });
        }
        
        // Load biometric templates
        if (data.biometricTemplates) {
          Object.entries(data.biometricTemplates).forEach(([key, value]) => {
            this.biometricTemplates.set(key, value as BiometricTemplate);
          });
        }
        
        console.log('📂 Loaded trust data from storage');
      }
    } catch (error) {
      console.error('❌ Error loading trust data:', error);
    }
  }

  /**
   * Save trust data to storage
   */
  private saveTrustData(): void {
    try {
      const trustDataPath = './models/device_sync/keys/trust_data.json';
      
      const data = {
        trustTokens: Object.fromEntries(this.trustTokens),
        biometricTemplates: Object.fromEntries(this.biometricTemplates),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(trustDataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving trust data:', error);
    }
  }

  /**
   * Get active trust tokens
   */
  getActiveTrustTokens(): TrustToken[] {
    const now = new Date();
    return Array.from(this.trustTokens.values()).filter(token => 
      new Date(token.expiresAt) > now
    );
  }

  /**
   * Get biometric templates for device
   */
  getBiometricTemplates(deviceId: string): BiometricTemplate[] {
    return Array.from(this.biometricTemplates.values()).filter(template =>
      template.deviceId === deviceId && template.isActive
    );
  }

  /**
   * Revoke trust token
   */
  revokeTrustToken(tokenId: string): boolean {
    const revoked = this.trustTokens.delete(tokenId);
    
    if (revoked) {
      this.saveTrustData();
      console.log(`🚫 Revoked trust token: ${tokenId}`);
      this.emit('trustTokenRevoked', tokenId);
    }
    
    return revoked;
  }

  /**
   * Deactivate biometric template
   */
  deactivateBiometricTemplate(deviceId: string, userId: string, biometricType: string): boolean {
    const templateKey = `${deviceId}_${userId}_${biometricType}`;
    const template = this.biometricTemplates.get(templateKey);
    
    if (template) {
      template.isActive = false;
      this.saveTrustData();
      console.log(`🚫 Deactivated biometric template: ${templateKey}`);
      this.emit('biometricTemplateDeactivated', template);
      return true;
    }
    
    return false;
  }

  /**
   * Get trust system statistics
   */
  getTrustStatistics(): any {
    const now = new Date();
    const activeTokens = Array.from(this.trustTokens.values()).filter(token => 
      new Date(token.expiresAt) > now
    );
    
    const activeTemplates = Array.from(this.biometricTemplates.values()).filter(template =>
      template.isActive
    );
    
    return {
      totalTrustTokens: this.trustTokens.size,
      activeTrustTokens: activeTokens.length,
      expiredTrustTokens: this.trustTokens.size - activeTokens.length,
      totalBiometricTemplates: this.biometricTemplates.size,
      activeBiometricTemplates: activeTemplates.length,
      inactiveBiometricTemplates: this.biometricTemplates.size - activeTemplates.length,
      tokenExpirationMinutes: this.config.tokenExpirationMinutes,
      maxBiometricAttempts: this.config.maxBiometricAttempts,
      biometricThreshold: this.config.biometricThreshold
    };
  }

  /**
   * Cleanup expired tokens and inactive templates
   */
  cleanup(): void {
    const now = new Date();
    let cleanedTokens = 0;
    let cleanedTemplates = 0;
    
    // Clean expired trust tokens
    for (const [tokenId, token] of this.trustTokens.entries()) {
      if (new Date(token.expiresAt) <= now) {
        this.trustTokens.delete(tokenId);
        cleanedTokens++;
      }
    }
    
    // Clean inactive biometric templates
    for (const [templateKey, template] of this.biometricTemplates.entries()) {
      if (!template.isActive || template.attempts >= template.maxAttempts) {
        this.biometricTemplates.delete(templateKey);
        cleanedTemplates++;
      }
    }
    
    if (cleanedTokens > 0 || cleanedTemplates > 0) {
      this.saveTrustData();
      console.log(`🧹 Cleanup: ${cleanedTokens} tokens, ${cleanedTemplates} templates`);
      this.emit('cleanup', { cleanedTokens, cleanedTemplates });
    }
  }

  /**
   * Generate QR code image data (simplified)
   */
  generateQRCodeImage(qrData: QRCodeData): string {
    // This is a simplified QR code generation
    // In production, you would use a library like 'qrcode'
    const qrString = JSON.stringify(qrData);
    
    // Simulate QR code generation
    const qrImage = `QR_CODE_IMAGE_DATA_${Buffer.from(qrString).toString('base64')}`;
    
    console.log(`📱 Generated QR code image for: ${qrData.deviceName}`);
    
    return qrImage;
  }
}

export default TrustSystem;
