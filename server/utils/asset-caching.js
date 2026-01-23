/**
 * Static Asset Caching Middleware
 * Comprehensive caching solution for static assets with proper HTTP headers
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./logger');

const logger = new Logger('asset-caching');

class AssetCaching {
  constructor(options = {}) {
    this.options = {
      // Cache control settings
      maxAge: options.maxAge || 86400000, // 24 hours default
      immutableMaxAge: options.immutableMaxAge || 31536000000, // 1 year for immutable assets
      etag: options.etag !== false,
      lastModified: options.lastModified !== false,
      
      // Compression settings
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // Only compress files > 1KB
      
      // Cache settings
      memoryCacheSize: options.memoryCacheSize || 100, // Number of files to cache in memory
      enableDiskCache: options.enableDiskCache !== false,
      diskCacheDir: options.diskCacheDir || path.join(process.cwd(), '.cache'),
      
      // File type specific settings
      fileTypes: {
        // Images - long cache, immutable
        'jpg': { maxAge: 31536000000, immutable: true },
        'jpeg': { maxAge: 31536000000, immutable: true },
        'png': { maxAge: 31536000000, immutable: true },
        'gif': { maxAge: 31536000000, immutable: true },
        'webp': { maxAge: 31536000000, immutable: true },
        'svg': { maxAge: 31536000000, immutable: true },
        'ico': { maxAge: 31536000000, immutable: true },
        
        // Scripts and styles - long cache with versioning
        'js': { maxAge: 31536000000, immutable: true },
        'css': { maxAge: 31536000000, immutable: true },
        'json': { maxAge: 86400000, immutable: false },
        
        // Fonts - very long cache, immutable
        'woff': { maxAge: 31536000000, immutable: true },
        'woff2': { maxAge: 31536000000, immutable: true },
        'ttf': { maxAge: 31536000000, immutable: true },
        'eot': { maxAge: 31536000000, immutable: true },
        
        // Audio - moderate cache
        'mp3': { maxAge: 86400000, immutable: false },
        'wav': { maxAge: 86400000, immutable: false },
        'ogg': { maxAge: 86400000, immutable: false },
        
        // Video - moderate cache
        'mp4': { maxAge: 86400000, immutable: false },
        'webm': { maxAge: 86400000, immutable: false },
        
        // Documents - short cache
        'html': { maxAge: 3600000, immutable: false }, // 1 hour
        'htm': { maxAge: 3600000, immutable: false },
        'pdf': { maxAge: 3600000, immutable: false },
        'txt': { maxAge: 3600000, immutable: false },
        
        // Default
        'default': { maxAge: 86400000, immutable: false }
      }
    };
    
    // In-memory cache
    this.memoryCache = new Map();
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      bypasses: 0,
      errors: 0,
      totalRequests: 0,
      cacheSize: 0,
      compressionSavings: 0
    };
    
    this.initializeCache();
  }

  /**
   * Initialize caching system
   */
  initializeCache() {
    // Ensure disk cache directory exists
    if (this.options.enableDiskCache) {
      try {
        if (!fs.existsSync(this.options.diskCacheDir)) {
          fs.mkdirSync(this.options.diskCacheDir, { recursive: true });
        }
        logger.info('Disk cache directory initialized', { 
          dir: this.options.diskCacheDir 
        });
      } catch (error) {
        logger.error('Failed to create disk cache directory', { 
          error: error.message 
        });
        this.options.enableDiskCache = false;
      }
    }
    
    // Clean up old cache entries periodically
    this.startCacheCleanup();
  }

  /**
   * Start periodic cache cleanup
   */
  startCacheCleanup() {
    // Clean up every hour
    setInterval(() => {
      this.cleanupCache();
    }, 3600000);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, entry] of this.memoryCache) {
      if (entry.expires && entry.expires < now) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clean disk cache
    if (this.options.enableDiskCache) {
      try {
        const files = fs.readdirSync(this.options.diskCacheDir);
        for (const file of files) {
          const filePath = path.join(this.options.diskCacheDir, file);
          const stats = fs.statSync(filePath);
          
          // Remove files older than 7 days
          if (now - stats.mtime.getTime() > 604800000) { // 7 days in ms
            fs.unlinkSync(filePath);
          }
        }
      } catch (error) {
        logger.error('Failed to cleanup disk cache', { error: error.message });
      }
    }
    
    logger.debug('Cache cleanup completed');
  }

  /**
   * Generate ETag for file
   */
  generateETag(filePath, stats) {
    if (!this.options.etag) return null;
    
    // Use file size and modification time for ETag
    const hash = crypto.createHash('md5');
    hash.update(`${stats.size}-${stats.mtime.getTime()}`);
    return hash.digest('hex');
  }

  /**
   * Get file type configuration
   */
  getFileTypeConfig(filePath) {
    const ext = path.extname(filePath).toLowerCase().substring(1);
    return this.options.fileTypes[ext] || this.options.fileTypes.default;
  }

  /**
   * Check if file should be cached
   */
  shouldCache(filePath) {
    // Don't cache certain patterns
    const noCachePatterns = [
      /\/\./, // Hidden files
      /\/node_modules\//,
      /\.tmp$/,
      /\.log$/,
      /\.env$/
    ];
    
    return !noCachePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Get from memory cache
   */
  getFromMemoryCache(key) {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (entry.expires && entry.expires < Date.now()) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry;
  }

  /**
   * Set in memory cache
   */
  setInMemoryCache(key, data, maxAge) {
    // Check cache size limit
    if (this.memoryCache.size >= this.options.memoryCacheSize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    
    this.memoryCache.set(key, {
      data,
      expires: maxAge ? Date.now() + maxAge : null,
      created: Date.now()
    });
  }

  /**
   * Get from disk cache
   */
  async getFromDiskCache(key) {
    if (!this.options.enableDiskCache) return null;
    
    try {
      const filePath = path.join(this.options.diskCacheDir, key);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const stats = fs.statSync(filePath);
      const data = fs.readFileSync(filePath);
      
      // Check if expired
      const maxAge = this.options.maxAge;
      if (stats.mtime.getTime() + maxAge < Date.now()) {
        fs.unlinkSync(filePath);
        return null;
      }
      
      this.stats.hits++;
      return { data, stats };
      
    } catch (error) {
      logger.error('Failed to read from disk cache', { 
        key, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Set in disk cache
   */
  async setInDiskCache(key, data) {
    if (!this.options.enableDiskCache) return;
    
    try {
      const filePath = path.join(this.options.diskCacheDir, key);
      fs.writeFileSync(filePath, data);
    } catch (error) {
      logger.error('Failed to write to disk cache', { 
        key, 
        error: error.message 
      });
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(filePath, stats) {
    const etag = this.generateETag(filePath, stats);
    return `${filePath}:${etag || stats.mtime.getTime()}`;
  }

  /**
   * Set caching headers
   */
  setCachingHeaders(res, filePath, stats, fileTypeConfig) {
    // Cache-Control header
    let cacheControl = `public, max-age=${Math.floor(fileTypeConfig.maxAge / 1000)}`;
    
    if (fileTypeConfig.immutable) {
      cacheControl += ', immutable';
    }
    
    res.setHeader('Cache-Control', cacheControl);
    
    // ETag header
    if (this.options.etag) {
      const etag = this.generateETag(filePath, stats);
      if (etag) {
        res.setHeader('ETag', etag);
      }
    }
    
    // Last-Modified header
    if (this.options.lastModified) {
      const lastModified = stats.mtime.toUTCString();
      res.setHeader('Last-Modified', lastModified);
    }
    
    // Additional headers for different file types
    this.setFileTypeSpecificHeaders(res, filePath, fileTypeConfig);
  }

  /**
   * Set file type specific headers
   */
  setFileTypeSpecificHeaders(res, filePath, fileTypeConfig) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.html':
      case '.htm':
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        break;
        
      case '.css':
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        break;
        
      case '.js':
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        break;
        
      case '.json':
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        break;
        
      case '.xml':
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        break;
        
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
        
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
        
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
        
      case '.webp':
        res.setHeader('Content-Type', 'image/webp');
        break;
        
      case '.svg':
        res.setHeader('Content-Type', 'image/svg+xml');
        break;
        
      case '.ico':
        res.setHeader('Content-Type', 'image/x-icon');
        break;
        
      case '.woff':
        res.setHeader('Content-Type', 'font/woff');
        break;
        
      case '.woff2':
        res.setHeader('Content-Type', 'font/woff2');
        break;
        
      case '.ttf':
        res.setHeader('Content-Type', 'font/ttf');
        break;
        
      case '.mp3':
        res.setHeader('Content-Type', 'audio/mpeg');
        break;
        
      case '.wav':
        res.setHeader('Content-Type', 'audio/wav');
        break;
        
      case '.ogg':
        res.setHeader('Content-Type', 'audio/ogg');
        break;
        
      case '.mp4':
        res.setHeader('Content-Type', 'video/mp4');
        break;
        
      case '.webm':
        res.setHeader('Content-Type', 'video/webm');
        break;
        
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  /**
   * Handle conditional requests
   */
  handleConditionalRequest(req, res, filePath, stats, fileTypeConfig) {
    // Check If-None-Match header
    if (this.options.etag && req.headers['if-none-match']) {
      const etag = this.generateETag(filePath, stats);
      if (etag && req.headers['if-none-match'] === etag) {
        res.statusCode = 304;
        res.end();
        return true; // Request handled
      }
    }
    
    // Check If-Modified-Since header
    if (this.options.lastModified && req.headers['if-modified-since']) {
      const lastModified = new Date(stats.mtime);
      const ifModifiedSince = new Date(req.headers['if-modified-since']);
      
      if (lastModified <= ifModifiedSince) {
        res.statusCode = 304;
        res.end();
        return true; // Request handled
      }
    }
    
    return false; // Continue with normal response
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      this.stats.totalRequests++;
      
      try {
        const filePath = req.path;
        
        // Skip if not a file request
        if (!this.shouldCache(filePath)) {
          this.stats.bypasses++;
          return next();
        }
        
        const fullPath = path.join(process.cwd(), 'public', filePath);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          this.stats.misses++;
          return next();
        }
        
        const stats = fs.statSync(fullPath);
        
        // Handle directories
        if (stats.isDirectory()) {
          this.stats.bypasses++;
          return next();
        }
        
        const fileTypeConfig = this.getFileTypeConfig(fullPath);
        const cacheKey = this.generateCacheKey(fullPath, stats);
        
        // Handle conditional requests
        if (this.handleConditionalRequest(req, res, fullPath, stats, fileTypeConfig)) {
          return; // Request already handled
        }
        
        // Try memory cache first
        const memoryEntry = this.getFromMemoryCache(cacheKey);
        if (memoryEntry) {
          this.setCachingHeaders(res, fullPath, stats, fileTypeConfig);
          res.send(memoryEntry.data);
          return;
        }
        
        // Try disk cache
        const diskEntry = await this.getFromDiskCache(cacheKey);
        if (diskEntry) {
          this.setCachingHeaders(res, fullPath, diskEntry.stats, fileTypeConfig);
          res.send(diskEntry.data);
          return;
        }
        
        // Read file from disk
        const fileData = fs.readFileSync(fullPath);
        
        // Cache the file data
        this.setInMemoryCache(cacheKey, fileData, fileTypeConfig.maxAge);
        await this.setInDiskCache(cacheKey, fileData);
        
        // Set headers and send response
        this.setCachingHeaders(res, fullPath, stats, fileTypeConfig);
        res.send(fileData);
        
      } catch (error) {
        this.stats.errors++;
        logger.error('Asset caching middleware error', { 
          filePath: req.path, 
          error: error.message 
        });
        next(error);
      }
    };
  }

  /**
   * Create static file server with caching
   */
  createStaticServer(rootDir) {
    const express = require('express');
    const compression = require('compression');
    
    const app = express();
    
    // Add compression middleware
    if (this.options.enableCompression) {
      app.use(compression({
        threshold: this.options.compressionThreshold,
        level: 6, // Balanced compression level
        memLevel: 8 // Memory usage level
      }));
    }
    
    // Add caching middleware
    app.use(this.middleware());
    
    // Serve static files
    app.use(express.static(rootDir, {
      maxAge: 0, // We handle caching ourselves
      etag: false, // We handle ETags ourselves
      lastModified: false, // We handle Last-Modified ourselves
      setHeaders: (res, filePath, stat) => {
        // Additional headers can be set here if needed
      }
    }));
    
    return app;
  }

  /**
   * Get caching statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: parseFloat(hitRate),
      cacheSize: this.memoryCache.size,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      bypasses: 0,
      errors: 0,
      totalRequests: 0,
      cacheSize: 0,
      compressionSavings: 0
    };
    
    logger.info('Asset caching statistics reset');
  }

  /**
   * Clear all caches
   */
  clearCache() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear disk cache
    if (this.options.enableDiskCache) {
      try {
        const files = fs.readdirSync(this.options.diskCacheDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.options.diskCacheDir, file));
        }
        
        logger.info('All caches cleared');
      } catch (error) {
        logger.error('Failed to clear disk cache', { error: error.message });
      }
    }
    
    this.resetStats();
  }

  /**
   * Warm up cache with commonly accessed files
   */
  async warmUpCache(filePaths = []) {
    logger.info('Starting cache warm-up', { fileCount: filePaths.length });
    
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          const fileData = fs.readFileSync(fullPath);
          const cacheKey = this.generateCacheKey(fullPath, stats);
          
          this.setInMemoryCache(cacheKey, fileData);
          await this.setInDiskCache(cacheKey, fileData);
        }
      } catch (error) {
        logger.error('Failed to warm up cache for file', { 
          filePath, 
          error: error.message 
        });
      }
    }
    
    logger.info('Cache warm-up completed');
  }

  /**
   * Export cache data for backup
   */
  async exportCache() {
    const cacheData = {
      timestamp: Date.now(),
      stats: this.getStats(),
      memoryCache: Array.from(this.memoryCache.entries()),
      options: this.options
    };
    
    const exportPath = path.join(this.options.diskCacheDir, 'cache-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(cacheData, null, 2));
    
    logger.info('Cache data exported', { exportPath });
    return exportPath;
  }
}

module.exports = AssetCaching;
