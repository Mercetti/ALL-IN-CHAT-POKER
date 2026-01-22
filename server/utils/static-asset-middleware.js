/**
 * Static Asset Middleware
 * Enhanced static file serving with comprehensive caching
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./logger');

const logger = new Logger('static-asset-middleware');

class StaticAssetMiddleware {
  constructor(options = {}) {
    this.options = {
      root: options.root || path.join(process.cwd(), 'public'),
      maxAge: options.maxAge || 86400000, // 24 hours
      immutableMaxAge: options.immutableMaxAge || 31536000000, // 1 year
      enableETag: options.enableETag !== false,
      enableLastModified: options.enableLastModified !== false,
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024,
      enableBrotli: options.enableBrotli !== false,
      cacheControl: options.cacheControl || 'public',
      serveIndex: options.serveIndex !== false,
      dotfiles: options.dotfiles || 'ignore',
      fallthrough: options.fallthrough !== false
    };
    
    this.cache = new Map();
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      compressed: 0,
      bypasses: 0
    };
  }

  /**
   * Generate ETag for file
   */
  generateETag(stats) {
    if (!this.options.enableETag) return null;
    
    // Use file size and modification time for ETag
    const hash = crypto.createHash('md5');
    hash.update(`${stats.size}-${stats.mtime.getTime()}`);
    return `"${hash.digest('hex')}"`;
  }

  /**
   * Get file type configuration
   */
  getFileConfig(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    // File type specific caching rules
    const fileTypes = {
      // Images - long cache, immutable
      '.jpg': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.jpeg': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.png': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.gif': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.webp': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.svg': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.ico': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      
      // Scripts and styles - long cache
      '.js': { maxAge: this.options.immutableMaxAge, immutable: true, compress: true },
      '.css': { maxAge: this.options.immutableMaxAge, immutable: true, compress: true },
      '.json': { maxAge: this.options.maxAge, immutable: false, compress: true },
      
      // Fonts - very long cache, immutable
      '.woff': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.woff2': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.ttf': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      '.eot': { maxAge: this.options.immutableMaxAge, immutable: true, compress: false },
      
      // Audio - moderate cache
      '.mp3': { maxAge: this.options.maxAge, immutable: false, compress: false },
      '.wav': { maxAge: this.options.maxAge, immutable: false, compress: false },
      '.ogg': { maxAge: this.options.maxAge, immutable: false, compress: false },
      
      // Video - moderate cache
      '.mp4': { maxAge: this.options.maxAge, immutable: false, compress: false },
      '.webm': { maxAge: this.options.maxAge, immutable: false, compress: false },
      
      // Documents - short cache
      '.html': { maxAge: 3600000, immutable: false, compress: true }, // 1 hour
      '.htm': { maxAge: 3600000, immutable: false, compress: true },
      '.pdf': { maxAge: 3600000, immutable: false, compress: false },
      '.txt': { maxAge: 3600000, immutable: false, compress: true }
    };
    
    return fileTypes[ext] || { 
      maxAge: this.options.maxAge, 
      immutable: false, 
      compress: true 
    };
  }

  /**
   * Get appropriate content type
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.xml': 'application/xml; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Set caching headers
   */
  setCachingHeaders(res, filePath, stats, fileConfig) {
    // Cache-Control header
    let cacheControl = `${this.options.cacheControl}, max-age=${Math.floor(fileConfig.maxAge / 1000)}`;
    
    if (fileConfig.immutable) {
      cacheControl += ', immutable';
    }
    
    res.setHeader('Cache-Control', cacheControl);
    
    // ETag header
    if (this.options.enableETag) {
      const etag = this.generateETag(stats);
      if (etag) {
        res.setHeader('ETag', etag);
      }
    }
    
    // Last-Modified header
    if (this.options.enableLastModified) {
      const lastModified = stats.mtime.toUTCString();
      res.setHeader('Last-Modified', lastModified);
    }
    
    // Content-Type header
    res.setHeader('Content-Type', this.getContentType(filePath));
    
    // Content-Length header
    res.setHeader('Content-Length', stats.size);
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Accept-Ranges for large files
    if (stats.size > 1024) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }

  /**
   * Handle conditional requests
   */
  handleConditionalRequest(req, res, filePath, stats, fileConfig) {
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
    if (this.options.enableLastModified && req.headers['if-modified-since']) {
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
   * Check if file should be served
   */
  shouldServeFile(filePath) {
    // Skip dotfiles based on configuration
    if (this.options.dotfiles === 'ignore' && path.basename(filePath).startsWith('.')) {
      return false;
    }
    
    // Skip certain file patterns
    const skipPatterns = [
      /\/node_modules\//,
      /\.log$/,
      /\.env$/,
      /\.tmp$/
    ];
    
    return !skipPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Get file from cache or disk
   */
  async getFile(filePath) {
    const fullPath = path.resolve(this.options.root, filePath);
    
    // Check if file should be served
    if (!this.shouldServeFile(filePath)) {
      return null;
    }
    
    // Check cache first
    const cacheKey = fullPath;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      this.stats.hits++;
      return cached;
    }
    
    // Read file from disk
    try {
      const stats = fs.statSync(fullPath);
      
      if (!stats.isFile()) {
        return null;
      }
      
      const fileConfig = this.getFileConfig(fullPath);
      const etag = this.generateETag(stats);
      
      const fileData = {
        data: fs.readFileSync(fullPath),
        stats,
        etag,
        config: fileConfig,
        fullPath
      };
      
      // Cache the file
      this.cache.set(cacheKey, {
        ...fileData,
        expires: Date.now() + fileConfig.maxAge
      });
      
      this.stats.misses++;
      return fileData;
      
    } catch (error) {
      logger.error('Failed to read file', { 
        filePath, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Create Express middleware
   */
  middleware() {
    const compression = require('compression');
    
    return (req, res, next) => {
      this.stats.requests++;
      
      try {
        const filePath = req.path === '/' ? '/index.html' : req.path;
        
        // Try to get file
        const fileData = this.getFile(filePath);
        
        if (!fileData) {
          this.stats.bypasses++;
          return next();
        }
        
        // Handle conditional requests
        if (this.handleConditionalRequest(req, res, filePath, fileData.stats, fileData.config)) {
          return;
        }
        
        // Set caching headers
        this.setCachingHeaders(res, filePath, fileData.stats, fileData.config);
        
        // Apply compression if enabled and file should be compressed
        if (this.options.enableCompression && fileData.config.compress) {
          const compress = compression({
            threshold: this.options.compressionThreshold,
            level: 6,
            memLevel: 8
          });
          
          compress(req, res, () => {
            res.send(fileData.data);
            this.stats.compressed++;
          });
        } else {
          res.send(fileData.data);
        }
        
      } catch (error) {
        logger.error('Static asset middleware error', { 
          filePath: req.path, 
          error: error.message 
        });
        next(error);
      }
    };
  }

  /**
   * Create enhanced static file server
   */
  createServer() {
    const express = require('express');
    const app = express();
    
    // Add compression middleware globally
    if (this.options.enableCompression) {
      const compression = require('compression');
      app.use(compression({
        threshold: this.options.compressionThreshold,
        level: 6,
        memLevel: 8
      }));
    }
    
    // Add static asset middleware
    app.use(this.middleware());
    
    // Handle directory index
    if (this.options.serveIndex) {
      app.get('*', (req, res, next) => {
        if (req.path.endsWith('/')) {
          req.path = req.path + 'index.html';
        }
        next();
    }
    
    return app;
  }

  /**
   * Get caching statistics
   */
  getStats() {
    const hitRate = this.stats.requests > 0 
      ? (this.stats.hits / this.stats.requests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: parseFloat(hitRate),
      cacheSize: this.cache.size,
      compressionRate: this.stats.requests > 0 
        ? (this.stats.compressed / this.stats.requests * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      compressed: 0,
      bypasses: 0
    };
    
    logger.info('Static asset statistics reset');
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.resetStats();
    logger.info('Static asset cache cleared');
  }

  /**
   * Warm up cache with common files
   */
  async warmUpCache(filePaths = []) {
    const defaultFiles = [
      '/index.html',
      '/css/main.css',
      '/js/main.js',
      '/assets/logo.png',
      '/favicon.ico'
    ];
    
    const filesToWarm = [...defaultFiles, ...filePaths];
    
    logger.info('Starting static asset cache warm-up', { 
      fileCount: filesToWarm.length 
    });
    
    for (const filePath of filesToWarm) {
      await this.getFile(filePath);
    }
    
    logger.info('Static asset cache warm-up completed');
  }

  /**
   * Export cache data
   */
  exportCache() {
    const cacheData = {
      timestamp: Date.now(),
      stats: this.getStats(),
      cache: Array.from(this.cache.entries()),
      options: this.options
    };
    
    return cacheData;
  }
}

module.exports = StaticAssetMiddleware;
