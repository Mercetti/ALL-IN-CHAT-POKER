/**
 * File Security and Compression Utilities
 * Provides safe file handling with compression and basic security scanning
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

const execAsync = promisify(exec);

class FileSecurityManager {
  constructor(options = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 50 * 1024 * 1024, // 50MB
      allowedExtensions: options.allowedExtensions || [
        '.txt', '.js', '.ts', '.json', '.md', '.py', '.java', '.cpp', '.c',
        '.h', '.css', '.html', '.xml', '.csv', '.log', '.sql', '.sh', '.bat',
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
        '.mp3', '.wav', '.ogg', '.flac', '.m4a',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
      ],
      blockedExtensions: options.blockedExtensions || [
        '.exe', '.msi', '.dmg', '.app', '.deb', '.rpm', '.pkg',
        '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar',
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'
      ],
      scanDirectory: options.scanDirectory || path.join(process.cwd(), 'uploads'),
      quarantineDirectory: options.quarantineDirectory || path.join(process.cwd(), 'quarantine'),
      enableVirusScan: options.enableVirusScan || false,
      virusScanCommand: options.virusScanCommand || 'clamscan', // ClamAV if available
      ...options
    };

    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.options.scanDirectory, this.options.quarantineDirectory].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created security directory', { dir });
      }
    });
  }

  /**
   * Validate file before processing
   */
  async validateFile(filePath, originalName = null) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(originalName || filePath).toLowerCase();
    
    // Check file size
    if (stats.size > this.options.maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${this.options.maxFileSize})`);
    }

    // Check extension
    if (this.options.blockedExtensions.includes(ext)) {
      throw new Error(`Blocked file type: ${ext}`);
    }

    if (!this.options.allowedExtensions.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    // Basic content validation
    await this.validateFileContent(filePath, ext);

    return { valid: true, size: stats.size, extension: ext };
  }

  /**
   * Validate file content for suspicious patterns
   */
  async validateFileContent(filePath, extension) {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length)); // First 1KB

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi,
      /shell_exec\s*\(/gi,
      /passthru\s*\(/gi,
      /<script[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new Error(`Suspicious content detected in file`);
      }
    }

    // Check for binary executables in text files
    if (['.txt', '.js', '.ts', '.json', '.md', '.py', '.java'].includes(extension)) {
      const nullBytes = (buffer.match(/\0/g) || []).length;
      if (nullBytes > buffer.length * 0.1) { // More than 10% null bytes
        throw new Error(`File appears to be binary despite text extension`);
      }
    }
  }

  /**
   * Scan file for viruses (if ClamAV is available)
   */
  async scanForMalware(filePath) {
    if (!this.options.enableVirusScan) {
      return { clean: true, method: 'disabled' };
    }

    try {
      // Try to use ClamAV
      const { stdout } = await execAsync(`${this.options.virusScanCommand} "${filePath}"`, {
        timeout: 30000
      });

      if (stdout.includes('FOUND')) {
        // Move to quarantine
        const quarantinePath = path.join(this.options.quarantineDirectory, path.basename(filePath));
        fs.renameSync(filePath, quarantinePath);
        
        logger.warn('Malware detected and quarantined', {
          originalPath: filePath,
          quarantinePath,
          scanResult: stdout
        });

        return { clean: false, method: 'clamav', result: stdout, quarantined: true };
      }

      return { clean: true, method: 'clamav', result: stdout };
    } catch (error) {
      logger.warn('Virus scan failed', { error: error.message, filePath });
      return { clean: true, method: 'failed', error: error.message };
    }
  }

  /**
   * Create ZIP archive of files
   */
  async createArchive(files, outputPath, options = {}) {
    const archiveOptions = {
      format: options.format || 'zip',
      compression: options.compression || 6,
      password: options.password || null,
      ...options
    };

    try {
      if (archiveOptions.format === 'zip') {
        return await this.createZipArchive(files, outputPath, archiveOptions);
      } else if (archiveOptions.format === 'tar') {
        return await this.createTarArchive(files, outputPath, archiveOptions);
      } else {
        throw new Error(`Unsupported archive format: ${archiveOptions.format}`);
      }
    } catch (error) {
      logger.error('Archive creation failed', { error: error.message, outputPath });
      throw error;
    }
  }

  /**
   * Create ZIP archive using Node.js built-in tools
   */
  async createZipArchive(files, outputPath, options) {
    const tempDir = path.join(path.dirname(outputPath), `temp_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Copy files to temp directory
      for (const file of files) {
        const targetPath = path.join(tempDir, path.basename(file));
        fs.copyFileSync(file, targetPath);
      }

      // Create ZIP using system command (more reliable than pure JS)
      const command = options.password 
        ? `cd "${tempDir}" && zip -r -P "${options.password}" "${outputPath}" .`
        : `cd "${tempDir}" && zip -r "${outputPath}" .`;

      await execAsync(command, { timeout: 60000 });

      // Verify archive was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Archive creation failed - no output file');
      }

      const stats = fs.statSync(outputPath);
      
      return {
        success: true,
        outputPath,
        size: stats.size,
        fileCount: files.length,
        format: 'zip',
        compressed: true
      };
    } finally {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Create TAR archive
   */
  async createTarArchive(files, outputPath, options) {
    const tempDir = path.join(path.dirname(outputPath), `temp_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Copy files to temp directory
      for (const file of files) {
        const targetPath = path.join(tempDir, path.basename(file));
        fs.copyFileSync(file, targetPath);
      }

      // Create TAR
      const command = options.compression 
        ? `cd "${tempDir}" && tar -czf "${outputPath}" .`
        : `cd "${tempDir}" && tar -cf "${outputPath}" .`;

      await execAsync(command, { timeout: 60000 });

      // Verify archive was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Archive creation failed - no output file');
      }

      const stats = fs.statSync(outputPath);
      
      return {
        success: true,
        outputPath,
        size: stats.size,
        fileCount: files.length,
        format: 'tar',
        compressed: !!options.compression
      };
    } finally {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Extract archive safely
   */
  async extractArchive(archivePath, extractTo, options = {}) {
    const ext = path.extname(archivePath).toLowerCase();
    
    // Validate archive
    await this.validateFile(archivePath);
    
    // Scan for malware
    const malwareScan = await this.scanForMalware(archivePath);
    if (!malwareScan.clean) {
      throw new Error('Archive contains malware and cannot be extracted');
    }

    try {
      if (ext === '.zip') {
        return await this.extractZip(archivePath, extractTo, options);
      } else if (['.tar', '.gz', '.bz2'].some(e => archivePath.endsWith(e))) {
        return await this.extractTar(archivePath, extractTo, options);
      } else {
        throw new Error(`Unsupported archive format: ${ext}`);
      }
    } catch (error) {
      logger.error('Archive extraction failed', { error: error.message, archivePath });
      throw error;
    }
  }

  /**
   * Extract ZIP archive
   */
  async extractZip(zipPath, extractTo, options) {
    const command = options.password
      ? `unzip -P "${options.password}" "${zipPath}" -d "${extractTo}"`
      : `unzip "${zipPath}" -d "${extractTo}"`;

    await execAsync(command, { timeout: 60000 });

    // Validate extracted files
    const extractedFiles = this.scanDirectory(extractTo);
    for (const file of extractedFiles) {
      await this.validateFile(file);
    }

    return {
      success: true,
      extractTo,
      fileCount: extractedFiles.length,
      files: extractedFiles
    };
  }

  /**
   * Extract TAR archive
   */
  async extractTar(tarPath, extractTo, options) {
    const command = tarPath.endsWith('.gz') || tarPath.endsWith('.bz2')
      ? `tar -xzf "${tarPath}" -C "${extractTo}"`
      : `tar -xf "${tarPath}" -C "${extractTo}"`;

    await execAsync(command, { timeout: 60000 });

    // Validate extracted files
    const extractedFiles = this.scanDirectory(extractTo);
    for (const file of extractedFiles) {
      await this.validateFile(file);
    }

    return {
      success: true,
      extractTo,
      fileCount: extractedFiles.length,
      files: extractedFiles
    };
  }

  /**
   * Scan directory for files
   */
  scanDirectory(dir) {
    const files = [];
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          scan(itemPath);
        } else {
          files.push(itemPath);
        }
      }
    };
    
    scan(dir);
    return files;
  }

  /**
   * Generate file hash for integrity checking
   */
  generateFileHash(filePath, algorithm = 'sha256') {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash(algorithm).update(fileBuffer).digest('hex');
  }

  /**
   * Get file security report
   */
  async getSecurityReport(filePath) {
    const stats = fs.statSync(filePath);
    const hash = this.generateFileHash(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      filePath,
      size: stats.size,
      extension: ext,
      hash,
      allowed: this.options.allowedExtensions.includes(ext),
      blocked: this.options.blockedExtensions.includes(ext),
      scanned: false,
      clean: null
    };
  }
}

module.exports = FileSecurityManager;
