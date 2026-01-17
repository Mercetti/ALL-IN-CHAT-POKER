/**
 * Database Backup Manager
 * Provides automated backup functionality for the SQLite database
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseBackupManager {
  constructor(config = {}) {
    this.config = {
      dbPath: config.dbPath || process.env.DB_FILE || '/data/data.db',
      backupDir: config.backupDir || '/data/backups',
      maxBackups: config.maxBackups || 10,
      backupInterval: config.backupInterval || 6 * 60 * 60 * 1000, // 6 hours
      ...config
    };
    
    this.isRunning = false;
    this.backupTimer = null;
    this.lastBackup = null;
  }

  async initialize() {
    console.log('[BACKUP] Initializing database backup manager');
    
    // Ensure backup directory exists
    await this.ensureBackupDirectory();
    
    // Start automatic backups
    this.startAutomaticBackups();
    
    this.isRunning = true;
    console.log('[BACKUP] Database backup manager initialized');
    return true;
  }

  async ensureBackupDirectory() {
    try {
      await fs.promises.mkdir(this.config.backupDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  startAutomaticBackups() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('[BACKUP] Automatic backup failed:', error);
      }
    }, this.config.backupInterval);
    
    console.log(`[BACKUP] Automatic backups started (interval: ${this.config.backupInterval / 1000 / 60} minutes)`);
  }

  stopAutomaticBackups() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('[BACKUP] Automatic backups stopped');
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `backup_${timestamp}.db`;
    const backupFilePath = path.join(this.config.backupDir, backupFileName);
    
    try {
      // Check if database file exists
      await fs.promises.access(this.config.dbPath);
      
      // Create backup
      await fs.promises.copyFile(this.config.dbPath, backupFilePath);
      
      // Get file stats
      const stats = await fs.promises.stat(backupFilePath);
      const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB
      
      // Create backup metadata
      const backupInfo = {
        filename: backupFileName,
        timestamp: new Date().toISOString(),
        size: fileSize,
        checksum: await this.calculateChecksum(backupFilePath)
      };
      
      // Save backup metadata
      await this.saveBackupMetadata(backupInfo);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      this.lastBackup = backupInfo;
      console.log(`[BACKUP] Backup created: ${backupFileName} (${fileSize} MB)`);
      
      return backupInfo;
      
    } catch (error) {
      console.error(`[BACKUP] Backup failed: ${error.message}`);
      throw error;
    }
  }

  async calculateChecksum(filePath) {
    try {
      const data = await fs.promises.readFile(filePath);
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      console.error('[BACKUP] Checksum calculation failed:', error.message);
      return null;
    }
  }

  async saveBackupMetadata(backupInfo) {
    const metadataFile = path.join(this.config.backupDir, 'backup_metadata.json');
    
    try {
      let metadata = [];
      
      // Read existing metadata
      if (fs.existsSync(metadataFile)) {
        const data = await fs.promises.readFile(metadataFile, 'utf8');
        metadata = JSON.parse(data);
      }
      
      // Add new backup
      metadata.push(backupInfo);
      
      // Keep only last 50 entries in metadata
      if (metadata.length > 50) {
        metadata = metadata.slice(-50);
      }
      
      // Write metadata
      await fs.promises.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
      
    } catch (error) {
      console.error('[BACKUP] Failed to save metadata:', error.message);
    }
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.promises.readdir(this.config.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupDir, file),
          mtime: fs.statSync(path.join(this.config.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      // Remove excess backups
      if (backupFiles.length > this.config.maxBackups) {
        const filesToRemove = backupFiles.slice(this.config.maxBackups);
        
        for (const file of filesToRemove) {
          await fs.promises.unlink(file.path);
          console.log(`[BACKUP] Removed old backup: ${file.name}`);
        }
      }
      
    } catch (error) {
      console.error('[BACKUP] Cleanup failed:', error.message);
    }
  }

  async getBackupList() {
    try {
      const metadataFile = path.join(this.config.backupDir, 'backup_metadata.json');
      
      if (!fs.existsSync(metadataFile)) {
        return [];
      }
      
      const data = await fs.promises.readFile(metadataFile, 'utf8');
      return JSON.parse(data);
      
    } catch (error) {
      console.error('[BACKUP] Failed to get backup list:', error.message);
      return [];
    }
  }

  async restoreBackup(backupFileName) {
    const backupFilePath = path.join(this.config.backupDir, backupFileName);
    
    try {
      await fs.promises.access(backupFilePath);
      
      // Create backup of current database before restore
      const preRestoreBackup = `pre_restore_${Date.now()}.db`;
      await fs.promises.copyFile(this.config.dbPath, path.join(this.config.backupDir, preRestoreBackup));
      
      // Restore backup
      await fs.promises.copyFile(backupFilePath, this.config.dbPath);
      
      console.log(`[BACKUP] Restored backup: ${backupFileName}`);
      return true;
      
    } catch (error) {
      console.error(`[BACKUP] Restore failed: ${error.message}`);
      return false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastBackup: this.lastBackup,
      config: this.config,
      backupCount: this.lastBackup ? 1 : 0
    };
  }

  async shutdown() {
    console.log('[BACKUP] Shutting down database backup manager');
    this.stopAutomaticBackups();
    this.isRunning = false;
  }
}

module.exports = { DatabaseBackupManager };
