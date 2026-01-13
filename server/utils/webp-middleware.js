/**
 * WebP Middleware
 * Express middleware for automatic WebP conversion and serving
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./logger');
const WebPConverter = require('./webp-converter');

const logger = new Logger('webp-middleware');

class WebPMiddleware {
  constructor(options = {}) {
    this.options = {
      // Conversion settings
      enableConversion: options.enableConversion !== false,
      quality: options.quality || 80,
      method: options.method || 4,
      lossless: options.lossless || false,
      
      // Cache settings
      enableCache: options.enableCache !== false,
      cacheDir: options.cacheDir || path.join(process.cwd(), '.cache/webp'),
      cacheMaxAge: options.cacheMaxAge || 86400000, // 24 hours
      enableETag: options.enableETag !== false,
      
      // Request handling
      enableFallback: options.enableFallback !== false,
      userAgentDetection: options.userAgentDetection !== false,
      enableAcceptHeader: options.enableAcceptHeader !== false,
      
      // File handling
      supportedFormats: options.supportedFormats || ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp'],
      excludePaths: options.excludePaths || ['/admin', '/api'],
      includePaths: options.includePaths || ['/assets', '/images', '/public'],
      
      // Performance
      concurrentConversions: options.concurrentConversions || 4,
      conversionTimeout: options.conversionTimeout || 30000,
      
      // Monitoring
      enableMetrics: options.enableMetrics !== false,
      metricsInterval: options.metricsInterval || 60000 // 1 minute
    };
    
    this.converter = new WebPConverter({
      quality: this.options.quality,
      method: this.options.method,
      lossless: this.options.lossless,
      concurrent: this.options.concurrentConversions,
      timeout: this.options.conversionTimeout
    });
    
    this.cache = new Map(); // In-memory cache
    this.stats = {
      totalRequests: 0,
      webpRequests: 0,
      convertedRequests: 0,
      cacheHits: 0,
      fallbackRequests: 0,
      errorRequests: 0,
      totalOriginalSize: 0,
      totalWebPSize: 0,
      averageProcessingTime: 0,
      startTime: Date.now()
    };
    
    this.initializeCache();
    this.startMetricsReporting();
  }

  /**
   * Initialize cache directory
   */
  initializeCache() {
    if (this.options.enableCache && !fs.existsSync(this.options.cacheDir)) {
      try {
        fs.mkdirSync(this.options.cacheDir, { recursive: true });
        logger.info('WebP cache directory created', { dir: this.options.cacheDir });
      } catch (error) {
        logger.error('Failed to create cache directory', { error: error.message });
        this.options.enableCache = false;
      }
    }
  }

  /**
   * Start metrics reporting
   */
  startMetricsReporting() {
    if (!this.options.enableMetrics) return;
    
    setInterval(() => {
      const stats = this.getStats();
      logger.debug('WebP middleware metrics', stats);
    }, this.options.metricsInterval);
  }

  /**
   * Check if client supports WebP
   */
  supportsWebP(req) {
    // Check Accept header
    if (this.options.enableAcceptHeader && req.headers.accept) {
      return req.headers.accept.includes('image/webp');
    }
    
    // Check User-Agent detection
    if (this.options.userAgentDetection && req.headers['user-agent']) {
      const userAgent = req.headers['user-agent'].toLowerCase();
      
      // Modern browsers that support WebP
      const webpBrowsers = [
        'chrome/', 'firefox/', 'edge/', 'opera/', 'safari/',
        'chromium/', 'brave/', 'vivaldi/'
      ];
      
      return webpBrowsers.some(browser => userAgent.includes(browser));
    }
    
    // Default to true if detection is disabled
    return !this.options.userAgentDetection && !this.options.enableAcceptHeader;
  }

  /**
   * Check if request should be processed
   */
  shouldProcessRequest(req) {
    const url = req.path;
    
    // Check excluded paths
    if (this.options.excludePaths.some(excludePath => url.startsWith(excludePath))) {
      return false;
    }
    
    // Check included paths
    if (this.options.includePaths.length > 0) {
      return this.options.includePaths.some(includePath => url.startsWith(includePath));
    }
    
    // Check file extension
    const ext = path.extname(url).toLowerCase();
    return this.options.supportedFormats.includes(ext);
  }

  /**
   * Get cache key for request
   */
  getCacheKey(req) {
    const url = req.path;
    const quality = this.options.quality;
    const method = this.options.method;
    const lossless = this.options.lossless;
    
    const key = `${url}:${quality}:${method}:${lossless}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Get cached WebP file path
   */
  getCachedFilePath(req) {
    if (!this.options.enableCache) return null;
    
    const cacheKey = this.getCacheKey(req);
    return path.join(this.options.cacheDir, `${cacheKey}.webp`);
  }

  /**
   * Check if cached file exists and is valid
   */
  async getCachedFile(req) {
    const cachedPath = this.getCachedFilePath(req);
    
    if (!cachedPath || !fs.existsSync(cachedPath)) {
      return null;
    }
    
    try {
      const stats = fs.statSync(cachedPath);
      const maxAge = this.options.cacheMaxAge;
      
      // Check if cache is expired
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(cachedPath);
        return null;
      }
      
      // Validate WebP file
      const validation = await this.converter.validateWebP(cachedPath);
      if (!validation.valid) {
        fs.unlinkSync(cachedPath);
        return null;
      }
      
      this.stats.cacheHits++;
      return { path: cachedPath, stats };
      
    } catch (error) {
      logger.error('Cache validation failed', { error: error.message });
      return null;
    }
  }

  /**
   * Convert image to WebP
   */
  async convertToWebP(req, res) {
    const startTime = Date.now();
    
    try {
      const originalPath = path.join(process.cwd(), 'public', req.path);
      
      if (!fs.existsSync(originalPath)) {
        return false;
      }
      
      // Get cached version
      const cached = await this.getCachedFile(req);
      if (cached) {
        return this.serveWebPFile(res, cached.path, cached.stats);
      }
      
      // Convert to WebP
      const outputPath = this.getCachedFilePath(req);
      const result = await this.converter.convertImage(originalPath, outputPath);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);
      this.stats.convertedRequests++;
      this.stats.totalOriginalSize += result.originalSize;
      this.stats.totalWebPSize += result.convertedSize;
      
      // Serve converted file
      return this.serveWebPFile(res, outputPath, fs.statSync(outputPath));
      
    } catch (error) {
      this.stats.errorRequests++;
      logger.error('WebP conversion failed', {
        path: req.path,
        error: error.message
      });
      
      return false;
    }
  }

  /**
   * Serve WebP file
   */
  serveWebPFile(res, filePath, stats) {
    try {
      // Set headers
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(this.options.cacheMaxAge / 1000)}`);
      
      // Set ETag if enabled
      if (this.options.enableETag) {
        const etag = this.generateETag(stats);
        res.setHeader('ETag', etag);
      }
      
      // Set Last-Modified
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      
      // Additional headers
      res.setHeader('X-WebP-Converted', 'true');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Send file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      this.stats.webpRequests++;
      return true;
      
    } catch (error) {
      logger.error('Failed to serve WebP file', {
        filePath,
        error: error.message
      });
      
      return false;
    }
  }

  /**
   * Generate ETag for file
   */
  generateETag(stats) {
    const hash = crypto.createHash('md5');
    hash.update(`${stats.size}-${stats.mtime.getTime()}`);
    return `"${hash.digest('hex')}"`;
  }

  /**
   * Handle conditional requests
   */
  handleConditionalRequest(req, res, stats) {
    // Check If-None-Match header
    if (this.options.enableETag && req.headers['if-none-match']) {
      const etag = this.generateETag(stats);
      if (etag && req.headers['if-none-match'] === etag) {
        res.statusCode = 304;
        res.end();
        return true;
      }
    }
    
    // Check If-Modified-Since header
    if (req.headers['if-modified-since']) {
      const lastModified = new Date(stats.mtime);
      const ifModifiedSince = new Date(req.headers['if-modified-since']);
      
      if (lastModified <= ifModifiedSince) {
        res.statusCode = 304;
        res.end();
        return true;
      }
    }
    
    return false;
  }

  /**
   * Serve original file (fallback)
   */
  serveOriginalFile(req, res) {
    const originalPath = path.join(process.cwd(), 'public', req.path);
    
    if (!fs.existsSync(originalPath)) {
      return false;
    }
    
    try {
      const stats = fs.statSync(originalPath);
      
      // Handle conditional requests
      if (this.handleConditionalRequest(req, res, stats)) {
        return true;
      }
      
      // Set headers
      const ext = path.extname(originalPath).toLowerCase();
      const mimeType = this.getMimeType(ext);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(this.options.cacheMaxAge / 1000)}`);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.setHeader('X-WebP-Converted', 'false');
      
      // Send file
      const fileStream = fs.createReadStream(originalPath);
      fileStream.pipe(res);
      
      this.stats.fallbackRequests++;
      return true;
      
    } catch (error) {
      logger.error('Failed to serve original file', {
        path: req.path,
        error: error.message
      });
      
      return false;
    }
  }

  /**
   * Get MIME type for file extension
   */
  getMimeType(ext) {
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.tiff': 'image/tiff',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Update average processing time
   */
  updateAverageProcessingTime(processingTime) {
    const totalProcessed = this.stats.convertedRequests;
    if (totalProcessed === 1) {
      this.stats.averageProcessingTime = processingTime;
    } else {
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime * (totalProcessed - 1) + processingTime) / totalProcessed;
    }
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return (req, res, next) => {
      this.stats.totalRequests++;
      
      try {
        // Check if request should be processed
        if (!this.shouldProcessRequest(req)) {
          return next();
        }
        
        // Check if client supports WebP
        if (!this.supportsWebP(req)) {
          return this.serveOriginalFile(req, res) || next();
        }
        
        // Try to serve WebP
        if (this.options.enableConversion) {
          this.convertToWebP(req, res).then(success => {
            if (!success && this.options.enableFallback) {
              this.serveOriginalFile(req, res) || next();
            } else if (!success) {
              next();
            }
          }).catch(error => {
            logger.error('WebP middleware error', {
              path: req.path,
              error: error.message
            });
            
            if (this.options.enableFallback) {
              this.serveOriginalFile(req, res) || next();
            } else {
              next();
            }
          });
        } else {
          next();
        }
        
      } catch (error) {
        this.stats.errorRequests++;
        logger.error('WebP middleware error', {
          path: req.path,
          error: error.message
        });
        
        next(error);
      }
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const compressionRatio = this.stats.totalOriginalSize > 0 
      ? ((this.stats.totalOriginalSize - this.stats.totalWebPSize) / this.stats.totalOriginalSize * 100)
      : 0;
    
    return {
      ...this.stats,
      uptime,
      webpRequestRate: this.stats.totalRequests > 0 
        ? (this.stats.webpRequests / this.stats.totalRequests * 100).toFixed(2)
        : 0,
      conversionRate: this.stats.webpRequests > 0 
        ? (this.stats.convertedRequests / this.stats.webpRequests * 100).toFixed(2)
        : 0,
      cacheHitRate: this.stats.webpRequests > 0 
        ? (this.stats.cacheHits / this.stats.webpRequests * 100).toFixed(2)
        : 0,
      compressionRatio: compressionRatio.toFixed(2),
      spaceSaved: this.stats.totalOriginalSize - this.stats.totalWebPSize
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      webpRequests: 0,
      convertedRequests: 0,
      cacheHits: 0,
      fallbackRequests: 0,
      errorRequests: 0,
      totalOriginalSize: 0,
      totalWebPSize: 0,
      averageProcessingTime: 0,
      startTime: Date.now()
    };
    
    logger.info('WebP middleware statistics reset');
  }

  /**
   * Clear cache
   */
  clearCache() {
    if (this.options.enableCache && fs.existsSync(this.options.cacheDir)) {
      try {
        const files = fs.readdirSync(this.options.cacheDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.options.cacheDir, file));
        }
        
        logger.info('WebP cache cleared');
      } catch (error) {
        logger.error('Failed to clear cache', { error: error.message });
      }
    }
    
    this.cache.clear();
  }

  /**
   * Warm up cache with common images
   */
  async warmUpCache(filePaths = []) {
    const commonPaths = [
      '/assets/logo.png',
      '/assets/logo-glow.png',
      '/assets/card-back.png',
      '/assets/all_in_chip_x1.png',
      '/assets/all_in_chip_x10.png',
      '/assets/all_in_chip_x100.png',
      '/assets/all_in_chip_x1000.png'
    ];
    
    const pathsToWarm = [...commonPaths, ...filePaths];
    
    logger.info('Starting WebP cache warm-up', { fileCount: pathsToWarm.length });
    
    for (const filePath of pathsToWarm) {
      try {
        const originalPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(originalPath)) {
          const cachedPath = this.getCachedFilePath({ path: filePath });
          await this.converter.convertImage(originalPath, cachedPath);
        }
      } catch (error) {
        logger.error('Failed to warm up cache for file', {
          filePath,
          error: error.message
        });
      }
    }
    
    logger.info('WebP cache warm-up completed');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const cacheHealth = await this.checkCacheHealth();
      const converterHealth = await this.checkConverterHealth();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats,
        cache: cacheHealth,
        converter: converterHealth
      };
      
      // Check for issues
      if (stats.errorRequests > 10) {
        health.status = 'degraded';
        health.issues = ['High error rate detected'];
      }
      
      if (stats.averageProcessingTime > 5000) {
        health.status = 'degraded';
        health.issues = health.issues || [];
        health.issues.push('High processing time detected');
      }
      
      return health;
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check cache health
   */
  async checkCacheHealth() {
    if (!this.options.enableCache) {
      return { enabled: false };
    }
    
    try {
      const stats = fs.statSync(this.options.cacheDir);
      const files = fs.readdirSync(this.options.cacheDir);
      
      return {
        enabled: true,
        size: stats.size,
        fileCount: files.length,
        lastModified: stats.mtime
      };
      
    } catch (error) {
      return {
        enabled: true,
        error: error.message
      };
    }
  }

  /**
   * Check converter health
   */
  async checkConverterHealth() {
    try {
      const converterStats = this.converter.getStats();
      
      return {
        available: true,
        stats: converterStats
      };
      
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = WebPMiddleware;
