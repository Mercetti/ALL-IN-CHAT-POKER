/**
 * WebP Server
 * Dedicated server for WebP image conversion and serving
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const Logger = require('./utils/logger');
const WebPMiddleware = require('./utils/webp-middleware');
const WebPConverter = require('./utils/webp-converter');

const logger = new Logger('webp-server');

class WebPServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 8083,
      host: options.host || '0.0.0.0',
      root: options.root || path.join(process.cwd(), 'public'),
      
      // WebP settings
      enableConversion: options.enableConversion !== false,
      quality: options.quality || 80,
      method: options.method || 4,
      lossless: options.lossless || false,
      
      // Cache settings
      enableCache: options.enableCache !== false,
      cacheDir: options.cacheDir || path.join(process.cwd(), '.cache/webp'),
      cacheMaxAge: options.cacheMaxAge || 86400000, // 24 hours
      
      // Performance
      concurrentConversions: options.concurrentConversions || 4,
      conversionTimeout: options.conversionTimeout || 30000,
      
      // Security
      enableSecurity: options.enableSecurity !== false,
      enableCORS: options.enableCORS !== false,
      
      // Monitoring
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      
      // API endpoints
      enableAPI: options.enableAPI !== false,
      apiPrefix: options.apiPrefix || '/api/webp'
    };
    
    this.app = express();
    this.server = null;
    this.webpMiddleware = null;
    this.converter = null;
    this.stats = {
      startTime: Date.now(),
      totalRequests: 0,
      webpRequests: 0,
      conversions: 0,
      cacheHits: 0,
      errors: 0,
      bandwidthSaved: 0
    };
    
    this.initialize();
  }

  /**
   * Initialize server components
   */
  initialize() {
    this.setupMiddleware();
    this.setupWebPMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup base middleware
   */
  setupMiddleware() {
    // Security middleware
    if (this.options.enableSecurity) {
      this.app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"]
          }
        }
      }));
    }
    
    // CORS middleware
    if (this.options.enableCORS) {
      this.app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Accept, User-Agent, Cache-Control');
        next();
      });
    }
    
    // Request logging
    this.app.use((req, res, next) => {
      this.stats.totalRequests++;
      
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        logger.debug('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers['user-agent']
        });
      
      next();
    });
  }

  /**
   * Setup WebP middleware
   */
  setupWebPMiddleware() {
    this.webpMiddleware = new WebPMiddleware({
      enableConversion: this.options.enableConversion,
      quality: this.options.quality,
      method: this.options.method,
      lossless: this.options.lossless,
      enableCache: this.options.enableCache,
      cacheDir: this.options.cacheDir,
      cacheMaxAge: this.options.cacheMaxAge,
      concurrentConversions: this.options.concurrentConversions,
      conversionTimeout: this.options.conversionTimeout,
      enableMetrics: this.options.enableMetrics
    });
    
    this.converter = this.webpMiddleware.converter;
    
    // Apply WebP middleware to all routes
    this.app.use(this.webpMiddleware.middleware());
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Static file serving with WebP support
    this.app.use(express.static(this.options.root, {
      maxAge: 0, // We handle caching ourselves
      etag: false, // We handle ETags ourselves
      lastModified: false // We handle Last-Modified ourselves
    }));
    
    // API routes
    if (this.options.enableAPI) {
      this.setupAPIRoutes();
    }
    
    // Health check
    if (this.options.enableHealthCheck) {
      this.app.get('/health', async (req, res) => {
        try {
          const health = await this.healthCheck();
          res.json(health);
        } catch (error) {
          res.status(500).json({
            status: 'unhealthy',
            error: error.message
          });
        }
      });
    }
    
    // Metrics endpoint
    if (this.options.enableMetrics) {
      this.app.get('/metrics', (req, res) => {
        res.json(this.getStats());
    }
    
    // WebP info endpoint
    this.app.get('/webp-info', (req, res) => {
      res.json({
        webpSupported: this.webpMiddleware.supportsWebP(req),
        conversionEnabled: this.options.enableConversion,
        cacheEnabled: this.options.enableCache,
        supportedFormats: this.webpMiddleware.options.supportedFormats
      });
  }

  /**
   * Setup API routes
   */
  setupAPIRoutes() {
    const apiRouter = express.Router();
    
    // Convert single image
    apiRouter.post('/convert', async (req, res) => {
      try {
        const { inputPath, outputPath, quality, method, lossless } = req.body;
        
        if (!inputPath) {
          return res.status(400).json({ error: 'inputPath is required' });
        }
        
        const result = await this.converter.convertImage(inputPath, outputPath, {
          quality: quality || this.options.quality,
          method: method || this.options.method,
          lossless: lossless || this.options.lossless
        });
        
        res.json(result);
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Convert directory
    apiRouter.post('/convert-directory', async (req, res) => {
      try {
        const { inputDir, outputDir, options } = req.body;
        
        if (!inputDir) {
          return res.status(400).json({ error: 'inputDir is required' });
        }
        
        const results = await this.converter.convertDirectory(inputDir, outputDir, options);
        res.json(results);
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Optimize WebP file
    apiRouter.post('/optimize', async (req, res) => {
      try {
        const { inputPath, outputPath, quality } = req.body;
        
        if (!inputPath) {
          return res.status(400).json({ error: 'inputPath is required' });
        }
        
        const result = await this.converter.optimizeWebP(inputPath, outputPath, quality);
        res.json(result);
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Validate WebP file
    apiRouter.get('/validate/:filePath(*)', async (req, res) => {
      try {
        const filePath = req.params.filePath;
        const result = await this.converter.validateWebP(filePath);
        res.json(result);
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get WebP file info
    apiRouter.get('/info/:filePath(*)', async (req, res) => {
      try {
        const filePath = req.params.filePath;
        const result = await this.converter.getWebPInfo(filePath);
        res.json(result);
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Clear cache
    apiRouter.post('/clear-cache', (req, res) => {
      try {
        this.webpMiddleware.clearCache();
        res.json({ success: true, message: 'Cache cleared' });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Warm up cache
    apiRouter.post('/warm-up', async (req, res) => {
      try {
        const { filePaths } = req.body;
        await this.webpMiddleware.warmUpCache(filePaths);
        res.json({ success: true, message: 'Cache warm-up completed' });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get converter stats
    apiRouter.get('/stats', (req, res) => {
      res.json({
        server: this.getStats(),
        middleware: this.webpMiddleware.getStats(),
        converter: this.converter.getStats()
      });
    
    this.app.use(this.options.apiPrefix, apiRouter);
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.path
      });
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      this.stats.errors++;
      
      logger.error('WebP server error', {
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
  }

  /**
   * Start server
   */
  start() {
    try {
      this.server = this.app.listen(this.options.port, this.options.host, () => {
        const uptime = Date.now() - this.stats.startTime;
        
        logger.info('WebP server started', {
          host: this.options.host,
          port: this.options.port,
          root: this.options.root,
          conversion: this.options.enableConversion,
          cache: this.options.enableCache,
          quality: this.options.quality,
          uptime
        });
        
        console.log(`
🖼️  WebP Server Started
📍 Host: ${this.options.host}
🌐 Port: ${this.options.port}
📁 Root: ${this.options.root}
🔄 Conversion: ${this.options.enableConversion ? 'Enabled' : 'Disabled'}
💾 Cache: ${this.options.enableCache ? 'Enabled' : 'Disabled'}
🎨 Quality: ${this.options.quality}
⏱️ Uptime: ${uptime}ms
        `);
      
      // Handle server errors
      this.server.on('error', (error) => {
        logger.error('WebP server error', { error: error.message });
      
      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('Received SIGTERM, shutting down gracefully');
        this.server.close(() => {
          process.exit(0);
      });
      
      process.on('SIGINT', () => {
        logger.info('Received SIGINT, shutting down gracefully');
        this.server.close(() => {
          process.exit(0);
      });
      
    } catch (error) {
      logger.error('Failed to start WebP server', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const middlewareStats = this.webpMiddleware.getStats();
    const converterStats = this.converter.getStats();
    
    return {
      ...this.stats,
      uptime,
      requestsPerSecond: this.stats.totalRequests / (uptime / 1000),
      webpRequestRate: this.stats.totalRequests > 0 
        ? (this.stats.webpRequests / this.stats.totalRequests * 100).toFixed(2)
        : 0,
      conversionRate: this.stats.webpRequests > 0 
        ? (this.stats.conversions / this.stats.webpRequests * 100).toFixed(2)
        : 0,
      cacheHitRate: this.stats.webpRequests > 0 
        ? (this.stats.cacheHits / this.stats.webpRequests * 100).toFixed(2)
        : 0,
      bandwidthSaved: middlewareStats.spaceSaved || 0,
      memoryUsage: process.memoryUsage(),
      middleware: middlewareStats,
      converter: converterStats
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      startTime: Date.now(),
      totalRequests: 0,
      webpRequests: 0,
      conversions: 0,
      cacheHits: 0,
      errors: 0,
      bandwidthSaved: 0
    };
    
    this.webpMiddleware.resetStats();
    this.converter.resetStats();
    
    logger.info('WebP server statistics reset');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const middlewareHealth = await this.webpMiddleware.healthCheck();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: stats.uptime,
        stats,
        components: {
          middleware: middlewareHealth,
          converter: {
            available: true,
            stats: stats.converter
          }
        }
      };
      
      // Check for issues
      if (stats.errors > 10) {
        health.status = 'degraded';
        health.issues = ['High error rate detected'];
      }
      
      if (stats.conversionRate < 50 && stats.webpRequests > 100) {
        health.status = 'degraded';
        health.issues = health.issues || [];
        health.issues.push('Low conversion rate detected');
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
   * Warm up cache with common images
   */
  async warmUpCache(filePaths = []) {
    await this.webpMiddleware.warmUpCache(filePaths);
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.webpMiddleware.clearCache();
  }

  /**
   * Convert image to WebP
   */
  async convertImage(inputPath, outputPath, options = {}) {
    return this.converter.convertImage(inputPath, outputPath, options);
  }

  /**
   * Convert directory to WebP
   */
  async convertDirectory(inputDir, outputDir, options = {}) {
    return this.converter.convertDirectory(inputDir, outputDir, options);
  }

  /**
   * Optimize WebP file
   */
  async optimizeWebP(inputPath, outputPath, quality) {
    return this.converter.optimizeWebP(inputPath, outputPath, quality);
  }

  /**
   * Validate WebP file
   */
  async validateWebP(filePath) {
    return this.converter.validateWebP(filePath);
  }

  /**
   * Get WebP file info
   */
  async getWebPInfo(filePath) {
    return this.converter.getWebPInfo(filePath);
  }

  /**
   * Stop server
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('WebP server stopped');
    }
  }
}

module.exports = WebPServer;
