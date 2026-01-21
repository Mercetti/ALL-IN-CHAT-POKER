/**
 * File Tools Skill for Acey
 * Provides secure file compression, archiving, and security scanning capabilities
 */

class FileToolsSkill {
  constructor(aceyContext) {
    this.acey = aceyContext;
    this.name = 'FileTools';
    this.description = 'Secure file operations including compression, archiving, and security scanning';
    this.version = '1.0.0';
  }

  /**
   * Create compressed archive of multiple files
   */
  async createArchive(files, options = {}) {
    try {
      const response = await fetch(`${this.acey.config.backendUrl}/api/file-tools/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.acey.config.adminToken}`
        },
        body: JSON.stringify({
          files,
          format: options.format || 'zip',
          compression: options.compression || 6,
          password: options.password
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Archive creation failed');
      }

      return {
        success: true,
        archive: result.archive,
        message: `Created ${result.archive.format} archive with ${result.archive.fileCount} files (${this.formatBytes(result.archive.size)})`
      };
    } catch (error) {
      this.acey.logger.error('Archive creation failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        message: 'Failed to create archive'
      };
    }
  }

  /**
   * Scan file for security threats
   */
  async scanFile(filePath) {
    try {
      const response = await fetch(`${this.acey.config.backendUrl}/api/file-tools/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.acey.config.adminToken}`
        },
        body: JSON.stringify({ filePath })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'File scan failed');
      }

      const report = result.report;
      const status = report.malwareScan.clean ? '✅ Clean' : '🚨 THREAT DETECTED';
      
      return {
        success: true,
        status,
        report,
        message: `File scan complete: ${status} (${report.validation.valid ? 'Valid' : 'Invalid'} format)`
      };
    } catch (error) {
      this.acey.logger.error('File scan failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        message: 'Failed to scan file'
      };
    }
  }

  /**
   * Get file security status
   */
  async getFileStatus(filePath) {
    try {
      const response = await fetch(`${this.acey.config.backendUrl}/api/file-tools/status/${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.acey.config.adminToken}`
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Status check failed');
      }

      const report = result.report;
      const allowed = report.allowed ? '✅ Allowed' : '🚫 Blocked';
      
      return {
        success: true,
        report,
        message: `File status: ${allowed} (${this.formatBytes(report.size)}, ${report.extension})`
      };
    } catch (error) {
      this.acey.logger.error('File status check failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        message: 'Failed to get file status'
      };
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanup() {
    try {
      const response = await fetch(`${this.acey.config.backendUrl}/api/file-tools/cleanup`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.acey.config.adminToken}`
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Cleanup failed');
      }

      return {
        success: true,
        deletedCount: result.deletedCount,
        message: `Cleaned up ${result.deletedCount} old temporary files`
      };
    } catch (error) {
      this.acey.logger.error('Cleanup failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        message: 'Failed to cleanup temporary files'
      };
    }
  }

  /**
   * Get file tools system status
   */
  async getSystemStatus() {
    try {
      const response = await fetch(`${this.acey.config.backendUrl}/api/file-tools/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.acey.config.adminToken}`
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Status check failed');
      }

      const status = result.status;
      const virusStatus = status.fileSecurity.virusScanning.enabled ? '🛡️ Enabled' : '⚠️ Disabled';
      
      return {
        success: true,
        status,
        message: `File tools ready | Max file size: ${this.formatBytes(status.fileSecurity.maxFileSize)} | Virus scanning: ${virusStatus}`
      };
    } catch (error) {
      this.acey.logger.error('System status check failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        message: 'Failed to get system status'
      };
    }
  }

  /**
   * Process user request for file operations
   */
  async processRequest(request, context = {}) {
    const lowerRequest = request.toLowerCase();
    
    // Archive creation requests
    if (lowerRequest.includes('archive') || lowerRequest.includes('zip') || lowerRequest.includes('compress')) {
      const files = this.extractFilesFromContext(context);
      if (files.length === 0) {
        return {
          success: false,
          message: 'No files specified for archiving. Please provide file paths.'
        };
      }
      
      const format = lowerRequest.includes('tar') ? 'tar' : 'zip';
      return await this.createArchive(files, { format });
    }
    
    // File scanning requests
    if (lowerRequest.includes('scan') || lowerRequest.includes('check') || lowerRequest.includes('security')) {
      const filePath = this.extractFileFromContext(context);
      if (!filePath) {
        return {
          success: false,
          message: 'No file specified for scanning. Please provide a file path.'
        };
      }
      
      return await this.scanFile(filePath);
    }
    
    // Status requests
    if (lowerRequest.includes('status') || lowerRequest.includes('ready')) {
      return await this.getSystemStatus();
    }
    
    // Cleanup requests
    if (lowerRequest.includes('cleanup') || lowerRequest.includes('clean')) {
      return await this.cleanup();
    }
    
    return {
      success: false,
      message: 'Available commands: archive files, scan file, check status, cleanup'
    };
  }

  /**
   * Extract files from context
   */
  extractFilesFromContext(context) {
    const files = [];
    
    if (context.files && Array.isArray(context.files)) {
      files.push(...context.files);
    }
    
    if (context.attachments && Array.isArray(context.attachments)) {
      files.push(...context.attachments.map(a => a.localPath || a.path));
    }
    
    // Extract file paths from message content
    if (context.message) {
      const pathMatches = context.message.match(/[a-zA-Z]:\\[^\s\n\r]+|\/[^\s\n\r]+/g);
      if (pathMatches) {
        files.push(...pathMatches);
      }
    }
    
    return files.filter(f => f && f.trim());
  }

  /**
   * Extract single file from context
   */
  extractFileFromContext(context) {
    const files = this.extractFilesFromContext(context);
    return files.length > 0 ? files[0] : null;
  }

  /**
   * Format bytes for human readable output
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get skill information
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      capabilities: [
        'Create compressed archives (ZIP/TAR)',
        'Scan files for security threats',
        'Check file security status',
        'Clean up temporary files',
        'System status monitoring'
      ],
      commands: {
        'archive files': 'Create compressed archive of specified files',
        'scan file': 'Scan file for malware and security issues',
        'check status': 'Get file tools system status',
        'cleanup': 'Clean up old temporary files'
      }
    };
  }
}

module.exports = FileToolsSkill;
