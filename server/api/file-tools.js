/**
 * File Tools API for Acey
 * Provides secure file operations with compression and security scanning
 */

const express = require('express');
const path = require('path');
const FileSecurityManager = require('../utils/fileSecurity');
const logger = require('../utils/logger');
const { requireAdmin } = require('../auth-contract');

const router = express.Router();
const fileSecurity = new FileSecurityManager({
  maxFileSize: 100 * 1024 * 1024, // 100MB for admin operations
  enableVirusScan: false, // Set to true if ClamAV is installed
  scanDirectory: path.join(process.cwd(), 'secure-uploads'),
  quarantineDirectory: path.join(process.cwd(), 'quarantine')
});

/**
 * Create compressed archive of files
 * POST /api/file-tools/archive
 */
router.post('/archive', requireAdmin, async (req, res) => {
  try {
    const { files, format = 'zip', compression = 6, password } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Files array is required' 
      });
    }

    // Validate all files exist and are accessible
    const validFiles = [];
    for (const file of files) {
      const filePath = path.resolve(file);
      if (!filePath.startsWith(process.cwd())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Access denied - file outside project directory' 
        });
      }
      
      if (!require('fs').existsSync(filePath)) {
        return res.status(400).json({ 
          success: false, 
          error: `File not found: ${file}` 
        });
      }
      
      validFiles.push(filePath);
    }

    // Generate unique output path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `archive-${timestamp}.${format}`;
    const outputPath = path.join(process.cwd(), 'temp', archiveName);

    // Ensure temp directory exists
    const tempDir = path.dirname(outputPath);
    if (!require('fs').existsSync(tempDir)) {
      require('fs').mkdirSync(tempDir, { recursive: true });
    }

    // Create archive
    const result = await fileSecurity.createArchive(validFiles, outputPath, {
      format,
      compression,
      password
    });

    // Generate download URL
    const downloadUrl = `/api/file-tools/download/${path.basename(outputPath)}`;

    logger.info('Archive created', {
      fileCount: validFiles.length,
      format,
      size: result.size,
      outputPath
    });

    res.json({
      success: true,
      archive: {
        filename: path.basename(outputPath),
        size: result.size,
        fileCount: result.fileCount,
        format: result.format,
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    });

  } catch (error) {
    logger.error('Archive creation failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Download archived file
 * GET /api/file-tools/download/:filename
 */
router.get('/download/:filename', requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'temp', filename);
    
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Archive not found or expired' 
      });
    }

    // Check if file is older than 24 hours
    const stats = require('fs').statSync(filePath);
    const age = Date.now() - stats.mtime.getTime();
    if (age > 24 * 60 * 60 * 1000) {
      require('fs').unlinkSync(filePath);
      return res.status(404).json({ 
        success: false, 
        error: 'Archive expired' 
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

    logger.info('Archive downloaded', { filename, size: stats.size });

  } catch (error) {
    logger.error('Archive download failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Scan uploaded file for security
 * POST /api/file-tools/scan
 */
router.post('/scan', requireAdmin, async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ 
        success: false, 
        error: 'File path is required' 
      });
    }

    const resolvedPath = path.resolve(filePath);
    
    // Security check - ensure file is within project directory
    if (!resolvedPath.startsWith(process.cwd())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access denied - file outside project directory' 
      });
    }

    if (!require('fs').existsSync(resolvedPath)) {
      return res.status(400).json({ 
        success: false, 
        error: 'File not found' 
      });
    }

    // Validate file
    const validation = await fileSecurity.validateFile(resolvedPath);
    
    // Scan for malware
    const malwareScan = await fileSecurity.scanForMalware(resolvedPath);
    
    // Generate security report
    const report = await fileSecurity.getSecurityReport(resolvedPath);
    
    logger.info('File scan completed', {
      filePath,
      valid: validation.valid,
      clean: malwareScan.clean,
      scanMethod: malwareScan.method
    });

    res.json({
      success: true,
      report: {
        ...report,
        validation,
        malwareScan,
        scannedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('File scan failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get file security status
 * GET /api/file-tools/status/:filename
 */
router.get('/status/:filename', requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.resolve(filename);
    
    // Security check
    if (!filePath.startsWith(process.cwd())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }

    const report = await fileSecurity.getSecurityReport(filePath);
    
    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('File status check failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Clean up old temporary files
 * DELETE /api/file-tools/cleanup
 */
router.delete('/cleanup', requireAdmin, async (req, res) => {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    let deletedCount = 0;
    
    if (require('fs').existsSync(tempDir)) {
      const files = require('fs').readdirSync(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = require('fs').statSync(filePath);
        
        // Delete files older than 24 hours
        const age = Date.now() - stats.mtime.getTime();
        if (age > 24 * 60 * 60 * 1000) {
          require('fs').unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    logger.info('Temporary files cleanup completed', { deletedCount });

    res.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} old temporary files`
    });

  } catch (error) {
    logger.error('Cleanup failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get available file tools status
 * GET /api/file-tools/status
 */
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const status = {
      fileSecurity: {
        enabled: true,
        maxFileSize: fileSecurity.options.maxFileSize,
        allowedExtensions: fileSecurity.options.allowedExtensions,
        blockedExtensions: fileSecurity.options.blockedExtensions,
        virusScanning: {
          enabled: fileSecurity.options.enableVirusScan,
          command: fileSecurity.options.virusScanCommand
        }
      },
      system: {
        tempDirectory: path.join(process.cwd(), 'temp'),
        quarantineDirectory: fileSecurity.options.quarantineDirectory,
        scanDirectory: fileSecurity.options.scanDirectory
      }
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Status check failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
