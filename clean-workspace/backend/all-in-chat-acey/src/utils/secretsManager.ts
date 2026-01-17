import { Logger } from '../utils/logger';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SecretConfig {
  name: string;
  value: string;
  encrypted: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretsManagerConfig {
  encryptionKey: string;
  secretsFile: string;
  backupEnabled: boolean;
  backupFile: string;
  rotationInterval: number; // in days
}

export class SecretsManager {
  private static instance: SecretsManager;
  private logger: Logger;
  private config: SecretsManagerConfig;
  private secrets: Map<string, SecretConfig> = new Map();
  private encryptionKey: Buffer;

  private constructor(config: SecretsManagerConfig) {
    this.logger = new Logger();
    this.config = config;
    this.encryptionKey = Buffer.from(config.encryptionKey, 'hex');
    this.loadSecrets();
  }

  public static getInstance(config?: SecretsManagerConfig): SecretsManager {
    if (!SecretsManager.instance) {
      const defaultConfig: SecretsManagerConfig = {
        encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
        secretsFile: process.env.SECRETS_FILE || './secrets.json',
        backupEnabled: process.env.SECRETS_BACKUP_ENABLED === 'true',
        backupFile: process.env.SECRETS_BACKUP_FILE || './secrets.backup.json',
        rotationInterval: parseInt(process.env.SECRETS_ROTATION_INTERVAL || '90', 10),
      };

      SecretsManager.instance = new SecretsManager(config || defaultConfig);
    }
    return SecretsManager.instance;
  }

  private loadSecrets(): void {
    try {
      if (fs.existsSync(this.config.secretsFile)) {
        const data = fs.readFileSync(this.config.secretsFile, 'utf8');
        const secretsData = JSON.parse(data);
        
        for (const [name, secret] of Object.entries(secretsData)) {
          this.secrets.set(name, secret as SecretConfig);
        }
        
        this.logger.log(`Loaded ${this.secrets.size} secrets from file`);
      } else {
        this.logger.log('No secrets file found, starting with empty secrets');
        this.saveSecrets();
      }
    } catch (error) {
      this.logger.error('Failed to load secrets:', error);
      throw new Error('Failed to load secrets');
    }
  }

  private saveSecrets(): void {
    try {
      const secretsData: Record<string, SecretConfig> = {};
      
      for (const [name, secret] of this.secrets) {
        secretsData[name] = secret;
      }
      
      const data = JSON.stringify(secretsData, null, 2);
      fs.writeFileSync(this.config.secretsFile, data, 'utf8');
      
      if (this.config.backupEnabled) {
        this.createBackup();
      }
      
      this.logger.log('Secrets saved successfully');
    } catch (error) {
      this.logger.error('Failed to save secrets:', error);
      throw new Error('Failed to save secrets');
    }
  }

  private createBackup(): void {
    try {
      const backupData = fs.readFileSync(this.config.secretsFile, 'utf8');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = this.config.backupFile.replace('.json', `.${timestamp}.json`);
      fs.writeFileSync(backupFile, backupData, 'utf8');
      this.logger.log(`Backup created: ${backupFile}`);
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public setSecret(name: string, value: string, encrypt: boolean = true): void {
    const now = new Date();
    const existingSecret = this.secrets.get(name);
    
    const secretConfig: SecretConfig = {
      name,
      value: encrypt ? this.encrypt(value) : value,
      encrypted: encrypt,
      version: existingSecret ? existingSecret.version + 1 : 1,
      createdAt: existingSecret ? existingSecret.createdAt : now,
      updatedAt: now,
    };
    
    this.secrets.set(name, secretConfig);
    this.saveSecrets();
    
    this.logger.log(`Secret '${name}' set successfully (version ${secretConfig.version})`);
  }

  public getSecret(name: string): string | null {
    const secret = this.secrets.get(name);
    
    if (!secret) {
      this.logger.warn(`Secret '${name}' not found`);
      return null;
    }
    
    const value = secret.encrypted ? this.decrypt(secret.value) : secret.value;
    
    // Check if secret needs rotation
    const daysSinceUpdate = Math.floor((Date.now() - secret.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > this.config.rotationInterval) {
      this.logger.warn(`Secret '${name}' needs rotation (last updated ${daysSinceUpdate} days ago)`);
    }
    
    return value;
  }

  public deleteSecret(name: string): boolean {
    const deleted = this.secrets.delete(name);
    
    if (deleted) {
      this.saveSecrets();
      this.logger.log(`Secret '${name}' deleted successfully`);
    } else {
      this.logger.warn(`Secret '${name}' not found for deletion`);
    }
    
    return deleted;
  }

  public listSecrets(): Array<{ name: string; encrypted: boolean; version: number; updatedAt: Date }> {
    const secretsList: Array<{ name: string; encrypted: boolean; version: number; updatedAt: Date }> = [];
    
    for (const [name, secret] of this.secrets) {
      secretsList.push({
        name,
        encrypted: secret.encrypted,
        version: secret.version,
        updatedAt: secret.updatedAt,
      });
    }
    
    return secretsList.sort((a, b) => a.name.localeCompare(b.name));
  }

  public rotateSecret(name: string, newValue?: string): boolean {
    const secret = this.secrets.get(name);
    
    if (!secret) {
      this.logger.warn(`Secret '${name}' not found for rotation`);
      return false;
    }
    
    const currentValue = secret.encrypted ? this.decrypt(secret.value) : secret.value;
    const value = newValue || crypto.randomBytes(32).toString('hex');
    
    this.setSecret(name, value, secret.encrypted);
    
    this.logger.log(`Secret '${name}' rotated successfully`);
    return true;
  }

  public rotateAllSecrets(): void {
    const secretsToRotate = Array.from(this.secrets.keys());
    
    for (const secretName of secretsToRotate) {
      this.rotateSecret(secretName);
    }
    
    this.logger.log(`Rotated ${secretsToRotate.length} secrets`);
  }

  public validateSecret(name: string): boolean {
    const secret = this.secrets.get(name);
    
    if (!secret) {
      return false;
    }
    
    try {
      if (secret.encrypted) {
        this.decrypt(secret.value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Secret '${name}' validation failed:`, error);
      return false;
    }
  }

  public validateAllSecrets(): Array<{ name: string; valid: boolean; error?: string }> {
    const results: Array<{ name: string; valid: boolean; error?: string }> = [];
    
    for (const [name, secret] of this.secrets) {
      try {
        if (secret.encrypted) {
          this.decrypt(secret.value);
        }
        results.push({ name, valid: true });
      } catch (error) {
        results.push({ name, valid: false, error: (error as Error).message });
      }
    }
    
    return results;
  }

  public exportSecrets(includeValues: boolean = false): string {
    const exportData: Record<string, any> = {};
    
    for (const [name, secret] of this.secrets) {
      exportData[name] = {
        encrypted: secret.encrypted,
        version: secret.version,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      };
      
      if (includeValues) {
        exportData[name].value = secret.encrypted ? this.decrypt(secret.value) : secret.value;
      }
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  public importSecrets(data: string, overwrite: boolean = false): void {
    try {
      const importData = JSON.parse(data);
      let importedCount = 0;
      
      for (const [name, secretData] of Object.entries(importData)) {
        if (!overwrite && this.secrets.has(name)) {
          this.logger.warn(`Secret '${name}' already exists, skipping import`);
          continue;
        }
        
        const secret = secretData as SecretConfig;
        this.secrets.set(name, secret);
        importedCount++;
      }
      
      this.saveSecrets();
      this.logger.log(`Imported ${importedCount} secrets`);
    } catch (error) {
      this.logger.error('Failed to import secrets:', error);
      throw new Error('Failed to import secrets');
    }
  }

  public getSecretStats(): {
    total: number;
    encrypted: number;
    unencrypted: number;
    needRotation: number;
  } {
    let encrypted = 0;
    let unencrypted = 0;
    let needRotation = 0;
    
    for (const secret of this.secrets.values()) {
      if (secret.encrypted) {
        encrypted++;
      } else {
        unencrypted++;
      }
      
      const daysSinceUpdate = Math.floor((Date.now() - secret.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > this.config.rotationInterval) {
        needRotation++;
      }
    }
    
    return {
      total: this.secrets.size,
      encrypted,
      unencrypted,
      needRotation,
    };
  }
}

export default SecretsManager;
