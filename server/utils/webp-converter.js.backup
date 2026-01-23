/**
 * WebP Image Converter
 * Converts images to WebP format for better performance and compression
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const Logger = require('./logger');

const execAsync = promisify(exec);
const logger = new Logger('webp-converter');

class WebPConverter {
  constructor(options = {}) {
    this.options = {
      // Conversion settings
      quality: options.quality || 80, // WebP quality (0-100)
      method: options.method || 4, // Compression method (0-6, higher = slower but better)
      lossless: options.lossless || false, // Lossless compression
      
      // File handling
      preserveOriginal: options.preserveOriginal !== false,
      overwriteExisting: options.overwriteExisting !== false,
      createBackup: options.createBackup !== false,
      
      // Supported formats
      inputFormats: options.inputFormats || ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp'],
      outputFormat: options.outputFormat || '.webp',
      
      // Processing
      concurrent: options.concurrent || 4, // Number of concurrent conversions
      timeout: options.timeout || 30000, // Conversion timeout in ms
      
      // Optimization
      enableSmartResize: options.enableSmartResize !== false,
      maxDimensions: options.maxDimensions || { width: 2048, height: 2048 },
      enableColorOptimization: options.enableColorOptimization !== false,
      
      // Metadata
      preserveMetadata: options.preserveMetadata !== false,
      stripExif: options.stripExif !== false,
      
      // Logging
      enableLogging: options.enableLogging !== false,
      logLevel: options.logLevel || 'info'
    };
    
    this.stats = {
      totalFiles: 0,
      convertedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      totalOriginalSize: 0,
      totalConvertedSize: 0,
      compressionRatio: 0,
      averageProcessingTime: 0,
      startTime: Date.now()
    };
    
    this.conversionQueue = [];
    this.isProcessing = false;
    
    this.checkDependencies();
  }

  /**
   * Check if required dependencies are available
   */
  checkDependencies() {
    try {
      // Check for cwebp (WebP converter)
      execAsync('cwebp -version', { timeout: 5000 });
      logger.info('cwebp converter found');
    } catch (error) {
      logger.warn('cwebp converter not found, using fallback method');
      this.useFallback = true;
    }
    
    try {
      // Check for ImageMagick (alternative converter)
      execAsync('convert -version', { timeout: 5000 });
      logger.info('ImageMagick converter found');
      this.hasImageMagick = true;
    } catch (error) {
      logger.warn('ImageMagick not found');
      this.hasImageMagick = false;
    }
  }

  /**
   * Convert single image to WebP
   */
  async convertImage(inputPath, outputPath = null) {
    const startTime = Date.now();
    
    try {
      // Validate input file
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }
      
      const inputStats = fs.statSync(inputPath);
      const inputExt = path.extname(inputPath).toLowerCase();
      
      // Check if format is supported
      if (!this.options.inputFormats.includes(inputExt)) {
        throw new Error(`Unsupported input format: ${inputExt}`);
      }
      
      // Generate output path if not provided
      if (!outputPath) {
        outputPath = inputPath.replace(inputExt, this.options.outputFormat);
      }
      
      // Skip if output exists and overwrite is disabled
      if (!this.options.overwriteExisting && fs.existsSync(outputPath)) {
        logger.debug('Skipping existing file', { outputPath });
        this.stats.skippedFiles++;
        return { skipped: true, outputPath };
      }
      
      // Create backup if enabled
      if (this.options.createBackup && fs.existsSync(outputPath)) {
        const backupPath = outputPath + '.backup';
        fs.copyFileSync(outputPath, backupPath);
      }
      
      // Perform conversion
      await this.performConversion(inputPath, outputPath);
      
      // Verify output
      if (!fs.existsSync(outputPath)) {
        throw new Error('Conversion failed - output file not created');
      }
      
      const outputStats = fs.statSync(outputPath);
      const processingTime = Date.now() - startTime;
      
      // Update statistics
      this.stats.convertedFiles++;
      this.stats.totalOriginalSize += inputStats.size;
      this.stats.totalConvertedSize += outputStats.size;
      this.updateAverageProcessingTime(processingTime);
      
      const compressionRatio = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(2);
      
      logger.info('Image converted successfully', {
        inputPath,
        outputPath,
        originalSize: this.formatBytes(inputStats.size),
        convertedSize: this.formatBytes(outputStats.size),
        compressionRatio: `${compressionRatio}%`,
        processingTime: `${processingTime}ms`
      });
      
      return {
        success: true,
        inputPath,
        outputPath,
        originalSize: inputStats.size,
        convertedSize: outputStats.size,
        compressionRatio: parseFloat(compressionRatio),
        processingTime
      };
      
    } catch (error) {
      this.stats.errorFiles++;
      logger.error('Image conversion failed', {
        inputPath,
        error: error.message
      });
      
      return {
        success: false,
        inputPath,
        error: error.message
      };
    }
  }

  /**
   * Perform the actual conversion
   */
  async performConversion(inputPath, outputPath) {
    if (this.useFallback) {
      return this.convertWithFallback(inputPath, outputPath);
    }
    
    const command = this.buildConversionCommand(inputPath, outputPath);
    
    try {
      await execAsync(command, { timeout: this.options.timeout });
    } catch (error) {
      logger.warn('cwebp conversion failed, trying fallback', { error: error.message });
      return this.convertWithFallback(inputPath, outputPath);
    }
  }

  /**
   * Build cwebp conversion command
   */
  buildConversionCommand(inputPath, outputPath) {
    let command = `cwebp`;
    
    // Quality setting
    command += ` -q ${this.options.quality}`;
    
    // Compression method
    command += ` -m ${this.options.method}`;
    
    // Lossless mode
    if (this.options.lossless) {
      command += ' -lossless';
    }
    
    // Metadata handling
    if (!this.options.preserveMetadata) {
      command += ' -metadata none';
    } else if (this.options.stripExif) {
      command += ' -metadata exif';
    }
    
    // Smart resize if enabled
    if (this.options.enableSmartResize) {
      command += ` -resize ${this.options.maxDimensions.width} ${this.options.maxDimensions.height}`;
    }
    
    // Input and output files
    command += ` "${inputPath}" -o "${outputPath}"`;
    
    return command;
  }

  /**
   * Fallback conversion using ImageMagick or Node.js
   */
  async convertWithFallback(inputPath, outputPath) {
    if (this.hasImageMagick) {
      return this.convertWithImageMagick(inputPath, outputPath);
    } else {
      return this.convertWithNodeJS(inputPath, outputPath);
    }
  }

  /**
   * Convert using ImageMagick
   */
  async convertWithImageMagick(inputPath, outputPath) {
    const command = `convert "${inputPath}" -quality ${this.options.quality} "${outputPath}"`;
    
    await execAsync(command, { timeout: this.options.timeout });
  }

  /**
   * Convert using Node.js (basic implementation)
   */
  async convertWithNodeJS(inputPath, outputPath) {
    // This is a placeholder - in a real implementation, you would use
    // a Node.js WebP library like 'webp-converter' or 'sharp'
    throw new Error('Node.js WebP conversion not implemented. Please install cwebp or ImageMagick.');
  }

  /**
   * Convert directory recursively
   */
  async convertDirectory(inputDir, outputDir = null) {
    if (!fs.existsSync(inputDir)) {
      throw new Error(`Input directory not found: ${inputDir}`);
    }
    
    const files = this.findImageFiles(inputDir);
    this.stats.totalFiles = files.length;
    
    logger.info(`Starting directory conversion`, {
      inputDir,
      fileCount: files.length,
      outputDir: outputDir || 'same as input'
    });
    
    // Process files concurrently
    const results = await this.processFilesConcurrently(files, outputDir);
    
    // Calculate final statistics
    this.calculateFinalStats();
    
    logger.info('Directory conversion completed', {
      convertedFiles: this.stats.convertedFiles,
      skippedFiles: this.stats.skippedFiles,
      errorFiles: this.stats.errorFiles,
      compressionRatio: `${this.stats.compressionRatio.toFixed(2)}%`,
      spaceSaved: this.formatBytes(this.stats.totalOriginalSize - this.stats.totalConvertedSize)
    });
    
    return results;
  }

  /**
   * Find all image files in directory
   */
  findImageFiles(dir) {
    const files = [];
    
    const scanDirectory = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          scanDirectory(itemPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (this.options.inputFormats.includes(ext)) {
            files.push(itemPath);
          }
        }
      }
    };
    
    scanDirectory(dir);
    return files;
  }

  /**
   * Process files concurrently
   */
  async processFilesConcurrently(files, outputDir) {
    const results = [];
    const chunks = this.chunkArray(files, this.options.concurrent);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (filePath) => {
        const outputPath = outputDir 
          ? path.join(outputDir, path.relative(files[0].split(path.sep).slice(0, -1).join(path.sep), filePath))
              .replace(path.extname(filePath), this.options.outputFormat)
          : null;
        
        return this.convertImage(filePath, outputPath);
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Convert multiple files
   */
  async convertFiles(filePaths) {
    this.stats.totalFiles = filePaths.length;
    
    logger.info(`Starting batch conversion`, {
      fileCount: filePaths.length
    });
    
    const results = await this.processFilesConcurrently(filePaths);
    this.calculateFinalStats();
    
    return results;
  }

  /**
   * Get conversion statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      averageProcessingTime: this.stats.averageProcessingTime,
      compressionRatio: this.stats.compressionRatio,
      spaceSaved: this.stats.totalOriginalSize - this.stats.totalConvertedSize,
      successRate: this.stats.totalFiles > 0 
        ? (this.stats.convertedFiles / this.stats.totalFiles * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Calculate final statistics
   */
  calculateFinalStats() {
    if (this.stats.totalOriginalSize > 0) {
      this.stats.compressionRatio = 
        ((this.stats.totalOriginalSize - this.stats.totalConvertedSize) / this.stats.totalOriginalSize * 100);
    }
  }

  /**
   * Update average processing time
   */
  updateAverageProcessingTime(processingTime) {
    const totalProcessed = this.stats.convertedFiles;
    if (totalProcessed === 1) {
      this.stats.averageProcessingTime = processingTime;
    } else {
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime * (totalProcessed - 1) + processingTime) / totalProcessed;
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Chunk array into smaller pieces
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalFiles: 0,
      convertedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      totalOriginalSize: 0,
      totalConvertedSize: 0,
      compressionRatio: 0,
      averageProcessingTime: 0,
      startTime: Date.now()
    };
    
    logger.info('WebP converter statistics reset');
  }

  /**
   * Validate WebP file
   */
  async validateWebP(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      
      // Check WebP magic number
      const webpMagic = Buffer.from([0x52, 0x49, 0x46, 0x46]); // 'RIFF'
      const webpMagic2 = Buffer.from([0x57, 0x45, 0x42, 0x50]); // 'WEBP'
      
      if (buffer.length < 12) {
        return { valid: false, error: 'File too small' };
      }
      
      if (!buffer.slice(0, 4).equals(webpMagic) || 
          !buffer.slice(8, 12).equals(webpMagic2)) {
        return { valid: false, error: 'Invalid WebP magic number' };
      }
      
      return { 
        valid: true, 
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get WebP file info
   */
  async getWebPInfo(filePath) {
    const validation = await this.validateWebP(filePath);
    
    if (!validation.valid) {
      return validation;
    }
    
    try {
      // Use cwebp to get detailed info if available
      if (!this.useFallback) {
        const command = `webpmux -info "${filePath}"`;
        const { stdout } = await execAsync(command, { timeout: 5000 });
        
        return {
          ...validation,
          details: stdout
        };
      }
      
      return validation;
      
    } catch (error) {
      return {
        ...validation,
        error: `Failed to get detailed info: ${error.message}`
      };
    }
  }

  /**
   * Optimize existing WebP file
   */
  async optimizeWebP(inputPath, outputPath = null) {
    if (!outputPath) {
      outputPath = inputPath.replace('.webp', '.optimized.webp');
    }
    
    const command = `cwebp "${inputPath}" -q ${this.options.quality} -m ${this.options.method} -o "${outputPath}"`;
    
    try {
      await execAsync(command, { timeout: this.options.timeout });
      
      const originalStats = fs.statSync(inputPath);
      const optimizedStats = fs.statSync(outputPath);
      
      const compressionRatio = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(2);
      
      logger.info('WebP file optimized', {
        inputPath,
        outputPath,
        originalSize: this.formatBytes(originalStats.size),
        optimizedSize: this.formatBytes(optimizedStats.size),
        compressionRatio: `${compressionRatio}%`
      });
      
      return {
        success: true,
        inputPath,
        outputPath,
        originalSize: originalStats.size,
        optimizedSize: optimizedStats.size,
        compressionRatio: parseFloat(compressionRatio)
      };
      
    } catch (error) {
      logger.error('WebP optimization failed', {
        inputPath,
        error: error.message
      });
      
      return {
        success: false,
        inputPath,
        error: error.message
      };
    }
  }
}

module.exports = WebPConverter;
