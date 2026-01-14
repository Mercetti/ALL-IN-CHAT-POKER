import fs from 'fs';
import path from 'path';
import { ACEY_STORAGE_PATHS } from './storageConfig';
import { getStorageHealth } from './storageHealth';
import { compressToZip, compressToGzip, COMPRESSION_POLICIES } from './coldStorage';
import { evaluateStoragePolicy, StorageContext, explainStorageDecision } from './storagePolicyEngine';

/**
 * Acey Library Manager
 * Centralized file management for all Acey assets
 */

interface LibraryStats {
  audio: number;
  datasets: number;
  images: number;
  models: number;
  logs: number;
  archive: number;
}

interface ArchiveConfig {
  audio: number;    // days
  images: number;   // days
  datasets: number; // days
  models: number;   // days
}

class AceyLibraryManager {
  private static readonly BASE_PATH = ACEY_STORAGE_PATHS.base;
  private static readonly ARCHIVE_CONFIG: ArchiveConfig = {
    audio: 30,      // Archive audio after 30 days
    images: 30,     // Archive images after 30 days
    datasets: 90,   // Archive datasets after 90 days
    models: 180     // Archive models after 180 days
  };

  static get paths() {
    return ACEY_STORAGE_PATHS;
  }

  /**
   * Initialize the library directory structure
   */
  static initLibrary(): void {
    const paths = this.paths;
    
    // Create all directories
    Object.values(paths).forEach(folderPath => {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`📁 Created directory: ${folderPath}`);
      }
    });

    console.log('📚 Acey Library structure initialized');
  }

  /**
   * Archive old files based on configuration
   */
  static archiveOldFiles(): void {
    const paths = this.paths;
    const currentTime = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Archive audio files
    this.archiveFilesByAge(paths.audio, paths.archive, this.ARCHIVE_CONFIG.audio * dayMs, 'audio');
    
    // Archive image files
    this.archiveFilesByAge(paths.images, paths.archive, this.ARCHIVE_CONFIG.images * dayMs, 'images');
    
    // Archive dataset files
    this.archiveFilesByAge(paths.datasets, paths.archive, this.ARCHIVE_CONFIG.datasets * dayMs, 'datasets');
    
    // Archive model files
    this.archiveFilesByAge(paths.models, paths.archive, this.ARCHIVE_CONFIG.models * dayMs, 'models');
  }

  /**
   * Archive files older than specified age
   */
  private static archiveFilesByAge(sourceDir: string, archiveDir: string, maxAge: number, type: string): void {
    if (!fs.existsSync(sourceDir)) return;

    const files = fs.readdirSync(sourceDir);
    const archiveSubDir = path.join(archiveDir, type);
    
    if (!fs.existsSync(archiveSubDir)) {
      fs.mkdirSync(archiveSubDir, { recursive: true });
    }

    files.forEach(file => {
      const filePath = path.join(sourceDir, file);
      const stats = fs.statSync(filePath);
      
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        const archivePath = path.join(archiveSubDir, file);
        fs.renameSync(filePath, archivePath);
        console.log(`📦 Archived ${type} file: ${file}`);
      }
    });
  }

  /**
   * Get library statistics including storage health
   */
  static async getLibraryStats(): Promise<LibraryStats & { storageHealth: any }> {
    const paths = this.paths;
    const stats: LibraryStats = {
      audio: 0,
      datasets: 0,
      images: 0,
      models: 0,
      logs: 0,
      archive: 0
    };

    // Count files in each directory
    Object.entries(paths).forEach(([key, dirPath]) => {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        stats[key as keyof LibraryStats] = files.length;
      }
    });

    // Get storage health
    const storageHealth = await getStorageHealth(paths.base);

    return {
      ...stats,
      storageHealth
    };
  }

  /**
   * Save file to library
   */
  static saveFile(type: keyof Omit<LibraryStats, 'archive'>, filename: string, data: Buffer | string): string {
    const paths = this.paths;
    const targetPath = path.join(paths[type], filename);
    
    // Ensure directory exists
    if (!fs.existsSync(paths[type])) {
      fs.mkdirSync(paths[type], { recursive: true });
    }
    
    // Write file
    if (typeof data === 'string') {
      fs.writeFileSync(targetPath, data, 'utf-8');
    } else {
      fs.writeFileSync(targetPath, data);
    }
    
    return targetPath;
  }

  /**
   * Read file from library
   */
  static readFile(type: keyof Omit<LibraryStats, 'archive'>, filename: string): Buffer | string {
    const paths = this.paths;
    const filePath = path.join(paths[type], filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return fs.readFileSync(filePath);
  }

  /**
   * Delete file from library
   */
  static deleteFile(type: keyof Omit<LibraryStats, 'archive'>, filename: string): void {
    const paths = this.paths;
    const filePath = path.join(paths[type], filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Validate library structure
   */
  static validateLibrary(): { isValid: boolean; issues: string[] } {
    const paths = this.paths;
    const issues: string[] = [];

    // Check if base directory exists
    if (!fs.existsSync(paths.base)) {
      issues.push(`Base directory missing: ${paths.base}`);
    }

    // Check all subdirectories
    Object.entries(paths).forEach(([key, dirPath]) => {
      if (key !== 'base' && !fs.existsSync(dirPath)) {
        issues.push(`${key} directory missing: ${dirPath}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Intelligent archiving using policy engine
   */
  static async intelligentArchive(): Promise<{ actions: string[]; totalProcessed: number }> {
    const paths = this.paths;
    const actions: string[] = [];
    let totalProcessed = 0;

    // Process each asset type
    const assetTypes: (keyof Omit<LibraryStats, 'archive'>)[] = ['audio', 'images', 'datasets', 'models'];
    
    for (const assetType of assetTypes) {
      const dirPath = paths[assetType];
      if (!fs.existsSync(dirPath)) continue;

      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        // Create context for policy evaluation
        const context: StorageContext = {
          assetType: assetType as 'audio' | 'image' | 'dataset' | 'model',
          ageDays: (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24),
          usageCount: 0, // TODO: Track usage from logs
          trustScore: 0.5, // TODO: Get from metadata
          fineTuneWeight: 0.3 // TODO: Get from training data
        };

        const decision = evaluateStoragePolicy(context);
        const explanation = explainStorageDecision(decision);
        
        if (decision.action === 'ARCHIVE') {
          const archivePath = path.join(paths.archive, assetType, file);
          if (!fs.existsSync(path.dirname(archivePath))) {
            fs.mkdirSync(path.dirname(archivePath), { recursive: true });
          }
          fs.renameSync(filePath, archivePath);
          actions.push(`📦 Archived ${file}: ${explanation}`);
          totalProcessed++;
        } else if (decision.action === 'COMPRESS') {
          // Handle compression based on asset type
          const policy = COMPRESSION_POLICIES[assetType as keyof typeof COMPRESSION_POLICIES];
          if (policy && context.ageDays > policy.ageDays) {
            if (policy.action === 'zip') {
              const zipPath = path.join(paths.archive, `${assetType}_${file}.zip`);
              await compressToZip(dirPath, zipPath);
              actions.push(`🗜️ Compressed ${file}: ${explanation}`);
              totalProcessed++;
            } else if (policy.action === 'gzip') {
              const gzipPath = path.join(paths.archive, `${file}.gz`);
              await compressToGzip(filePath, gzipPath);
              actions.push(`🗜️ Compressed ${file}: ${explanation}`);
              totalProcessed++;
            }
          }
        }
      }
    }

    return { actions, totalProcessed };
  }

  /**
   * Create backup of library
   */
  static createBackup(): string {
    const paths = this.paths;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(paths.base, `backup-${timestamp}`);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Copy all directories (excluding archive)
    const dirsToBackup = ['datasets', 'audio', 'images', 'models', 'logs'];
    
    dirsToBackup.forEach(dir => {
      const sourceDir = path.join(paths.base, dir);
      const targetDir = path.join(backupPath, dir);
      
      if (fs.existsSync(sourceDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        
        const files = fs.readdirSync(sourceDir);
        files.forEach(file => {
          const sourceFile = path.join(sourceDir, file);
          const targetFile = path.join(targetDir, file);
          fs.copyFileSync(sourceFile, targetFile);
        });
      }
    });

    return backupPath;
  }
}

export default AceyLibraryManager;
