/**
 * ACEY Library Manager
 * Centralized library management for audio, images, datasets, and models
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LibraryStats {
  datasets: number;
  audio: number;
  images: number;
  models: number;
  logs: number;
  archive: number;
  totalSize: number;
}

export interface ArchiveResult {
  archived: number;
  errors: string[];
  folders: string[];
}

export interface ACEY_STORAGE_PATHS {
  audio: string;
  images: string;
  datasets: string;
  models: string;
  logs: string;
  archive: string;
}

export interface ACEY_ARCHIVE_CONFIG {
  audioOlderThanDays: number;
  imagesOlderThanDays: number;
  datasetsOlderThanDays: number;
  modelsOlderThanDays: number;
}

class AceyLibraryManager {
  static paths: ACEY_STORAGE_PATHS = {
    audio: './data/audio',
    images: './data/images', 
    datasets: './data/datasets',
    models: './data/models',
    logs: './data/logs',
    archive: './data/archive'
  };

  static config: ACEY_ARCHIVE_CONFIG = {
    audioOlderThanDays: 30,
    imagesOlderThanDays: 90,
    datasetsOlderThanDays: 180,
    modelsOlderThanDays: 365
  };

  /**
   * Initialize all library folders
   */
  static initLibrary(): void {
    Object.values(this.paths).forEach((folder) => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`Created library folder: ${folder}`);
      }
    });
  }

  /**
   * Archive old files based on configuration
   */
  static archiveOldFiles(): ArchiveResult {
    const now = Date.now();
    const archiveFolder = this.paths.archive;
    const result: ArchiveResult = {
      archived: 0,
      errors: [],
      folders: []
    };

    const archive = (folder: string, days: number, folderName: string) => {
      if (!fs.existsSync(folder)) {
        result.errors.push(`Folder does not exist: ${folder}`);
        return;
      }

      const archiveSubFolder = path.join(archiveFolder, folderName);
      if (!fs.existsSync(archiveSubFolder)) {
        fs.mkdirSync(archiveSubFolder, { recursive: true });
      }

      const files = fs.readdirSync(folder);
      let folderArchived = 0;
      const stagedFiles: string[] = [];

      files.forEach((file) => {
        const filePath = path.join(folder, file);
        const stats = fs.statSync(filePath);
        
        // Check if file is older than specified days
        const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > days) {
          try {
            // Stage file for archiving
            const archivePath = path.join(archiveSubFolder, file);
            const tempPath = `${archivePath}.tmp`;
            
            // Copy to temporary location first
            fs.copyFileSync(filePath, tempPath);
            
            // Verify copy succeeded before moving
            const tempStats = fs.statSync(tempPath);
            if (tempStats.size === stats.size) {
              // Atomic move - this is critical fix
              fs.renameSync(tempPath, archivePath);
              folderArchived++;
              result.archived++;
            } else {
              result.errors.push(`Failed to stage ${file}: size mismatch`);
              // Clean up temp file
              if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
              }
            }
          } catch (error) {
            result.errors.push(`Failed to archive ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      });

      if (folderArchived > 0) {
        result.folders.push(`${folderName}: ${folderArchived} files`);
      }
    };

    // Archive each folder type
    archive(this.paths.audio, this.config.audioOlderThanDays, 'audio');
    archive(this.paths.images, this.config.imagesOlderThanDays, 'images');
    archive(this.paths.datasets, this.config.datasetsOlderThanDays, 'datasets');
    archive(this.paths.models, this.config.modelsOlderThanDays, 'models');

    return result;
  }

  /**
   * Get library statistics including file counts and sizes
   */
  static getLibraryStats(): LibraryStats {
    const stats: LibraryStats = {
      datasets: 0,
      audio: 0,
      images: 0,
      models: 0,
      logs: 0,
      archive: 0,
      totalSize: 0
    };

    Object.entries(this.paths).forEach(([key, folder]) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder);
        stats[key as keyof LibraryStats] = files.length;
        
        // Calculate folder size
        files.forEach(file => {
          const filePath = path.join(folder, file);
          try {
            const fileStats = fs.statSync(filePath);
            if (fileStats.isFile()) {
              stats.totalSize += fileStats.size;
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        });
      }
    });

    return stats;
  }

  /**
   * Get detailed folder information
   */
  static getFolderDetails(folderName: keyof ACEY_STORAGE_PATHS): {
    path: string;
    exists: boolean;
    fileCount: number;
    size: number;
    files: Array<{ name: string; size: number; modified: Date }>;
  } {
    const folderPath = this.paths[folderName];
    const exists = fs.existsSync(folderPath);
    
    if (!exists) {
      return {
        path: folderPath,
        exists: false,
        fileCount: 0,
        size: 0,
        files: []
      };
    }

    const files = fs.readdirSync(folderPath);
    const fileDetails = files.map(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime
      };
    });

    const totalSize = fileDetails.reduce((sum, file) => sum + file.size, 0);

    return {
      path: folderPath,
      exists: true,
      fileCount: files.length,
      size: totalSize,
      files: fileDetails
    };
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  static sanitizeFileName(fileName: string): string {
    // Remove null bytes and control characters
    const sanitized = fileName
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\r\n]/g, '') // Remove newlines
      .replace(/[<>:"|?*]/g, '') // Remove special characters
      .replace(/^\.\.+/, '') // Remove leading dots
      .replace(/\.\./g, '.'); // Replace multiple dots with single
      .substring(0, 255); // Limit length
    
    // Ensure filename doesn't contain path traversal
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      throw new Error('Invalid filename: path traversal detected');
    }
    
    return sanitized;
  }

  /**
   * Validate path stays within allowed boundaries
   */
  static validatePath(filePath: string, allowedBase: string): void {
    const resolvedPath = path.resolve(filePath);
    const normalizedPath = path.normalize(resolvedPath);
    
    if (!normalizedPath.toLowerCase().startsWith(path.normalize(allowedBase).toLowerCase())) {
      throw new Error('Path traversal detected: access outside allowed directory');
    }
  }

  /**
   * Save file to appropriate library folder
   */
  static saveFile(
    folderName: keyof ACEY_STORAGE_PATHS,
    fileName: string,
    content: string | Buffer
  ): string {
    // Sanitize filename
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const folderPath = this.paths[folderName];
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, sanitizedFileName);
    
    // Validate final path
    this.validatePath(filePath, folderPath);
    
    if (typeof content === 'string') {
      fs.writeFileSync(filePath, content, 'utf8');
    } else {
      fs.writeFileSync(filePath, content);
    }

    return filePath;
  }

  /**
   * Read file from library
   */
  static readFile(
    folderName: keyof ACEY_STORAGE_PATHS,
    fileName: string
  ): Buffer | null {
    // Sanitize filename
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const folderPath = this.paths[folderName];
    
    if (!fs.existsSync(folderPath)) {
      return null;
    }

    const filePath = path.join(folderPath, sanitizedFileName);
    
    // Validate final path
    this.validatePath(filePath, folderPath);

    return fs.readFileSync(filePath);
  }

  /**
   * Delete file from library
   */
  static deleteFile(
    folderName: keyof ACEY_STORAGE_PATHS,
    fileName: string
  ): boolean {
    // Sanitize filename
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const filePath = path.join(this.paths[folderName], sanitizedFileName);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Validate final path
    this.validatePath(filePath, this.paths[folderName]);

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete file ${sanitizedFileName}:`, error);
      return false;
    }
  }

  /**
   * Get disk usage information
   */
  static getDiskUsage(): {
    total: number;
    free: number;
    used: number;
    librarySize: number;
  } {
    const stats = this.getLibraryStats();
    
    // Note: This is a simplified version. For actual disk usage,
    // you might need to use platform-specific commands
    return {
      total: 0, // Would need platform-specific implementation
      free: 0, // Would need platform-specific implementation
      used: 0, // Would need platform-specific implementation
      librarySize: stats.totalSize
    };
  }

  /**
   * Clean up empty folders
   */
  static cleanupEmptyFolders(): void {
    Object.values(this.paths).forEach(folder => {
      if (fs.existsSync(folder)) {
        this.cleanupEmptyFoldersRecursive(folder);
      }
    });
  }

  private static cleanupEmptyFoldersRecursive(folder: string): void {
    try {
      const files = fs.readdirSync(folder);
      
      if (files.length === 0) {
        fs.rmdirSync(folder);
        return;
      }

      files.forEach(file => {
        const filePath = path.join(folder, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          this.cleanupEmptyFoldersRecursive(filePath);
        }
      });

      // Check again after cleaning subfolders
      const remainingFiles = fs.readdirSync(folder);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(folder);
      }
    } catch (error) {
      // Skip folders that can't be accessed
    }
  }

  /**
   * Validate library structure
   */
  static validateLibrary(): {
    valid: boolean;
    issues: string[];
    missingFolders: string[];
  } {
    const issues: string[] = [];
    const missingFolders: string[] = [];

    Object.entries(this.paths).forEach(([name, path]) => {
      if (!fs.existsSync(path)) {
        missingFolders.push(name);
        issues.push(`Missing folder: ${name} at ${path}`);
      } else if (!fs.statSync(path).isDirectory()) {
        issues.push(`Path exists but is not a directory: ${name} at ${path}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      missingFolders
    };
  }

  /**
   * Create backup of library
   */
  static createBackup(backupPath?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupPath = path.join(this.paths.archive, `backup-${timestamp}`);
    const targetPath = backupPath || defaultBackupPath;

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // This is a simplified backup - in production you'd want more robust backup logic
    Object.entries(this.paths).forEach(([name, sourcePath]) => {
      if (name === 'archive') return; // Skip archive folder
      
      if (fs.existsSync(sourcePath)) {
        const backupFolderPath = path.join(targetPath, name);
        fs.mkdirSync(backupFolderPath, { recursive: true });
        
        // Copy files (simplified - would use proper copy logic in production)
        const files = fs.readdirSync(sourcePath);
        files.forEach(file => {
          const sourceFile = path.join(sourcePath, file);
          const targetFile = path.join(backupFolderPath, file);
          fs.copyFileSync(sourceFile, targetFile);
        });
      }
    });

    return targetPath;
  }
}

export default AceyLibraryManager;
