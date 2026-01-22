/**
 * Enhanced Static Server
 * Production-ready static file server with comprehensive caching
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const Logger = require('./utils/logger');

const logger = new Logger('static-server-enhanced');

class EnhancedStaticServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 8080,
      host: options.host || '0.0.0.0',
      root: options.root || path.join(process.cwd(), 'public'),
      enableCompression: options.enableCompression !== false,
      enableBrotli: options.enableBrotli !== false,
      enableHTTP2: options.enableHTTP2 !== false,
      enableSPDY: options.enableSPDY !== false,
      enableCaching: options.enableCaching !== false,
      enableSecurity: options.enableSecurity !== false,
      enableMetrics: options.enableMetrics !== false,
      maxAge: options.maxAge || 86400000, // 24 hours
      immutableMaxAge: options.immutableMaxAge || 31536000000, // 1 year
      cacheSize: options.cacheSize || 1000,
      gzipLevel: options.gzipLevel || 6,
      brotliLevel: options.brotliLevel || 11
    };
    
    this.app = express();
    this.server = null;
    this.stats = {
      requests: 0,
      bandwidth: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    this.setupMiddleware();
  }

  /**
   * Setup all middleware
   */
  setupMiddleware() {
    // Security middleware
    if (this.options.enableSecurity) {
      this.setupSecurityMiddleware();
    }
    
    // Compression middleware
    if (this.options.enableCompression) {
      this.setupCompressionMiddleware();
    }
    
    // Caching middleware
    if (this.options.enableCaching) {
      this.setupCachingMiddleware();
    }
    
    // Metrics middleware
    if (this.options.enableMetrics) {
      this.setupMetricsMiddleware();
    }
    
    // Static file serving
    this.setupStaticFileMiddleware();
    
    // Error handling
    this.setupErrorHandling();
  }

  /**
   * Setup security middleware
   */
  setupSecurityMiddleware() {
    // Use helmet for security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    }));
    
    // Additional security headers
    this.app.use((req, res, next) => {
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions policy
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      next();
  }

  /**
   * Setup compression middleware
   */
  setupCompressionMiddleware() {
    const compression = require('compression');
    
    this.app.use(compression({
      threshold: 1024, // Only compress files > 1KB
      level: this.options.gzipLevel,
      memLevel: 8,
      filter: (req, res) => {
        // Don't compress already compressed files
        const contentType = res.getHeader('Content-Type');
        return contentType && !contentType.includes('image') && !contentType.includes('video');
      }
    }));
    
    // Brotli compression if available
    if (this.options.enableBrotli) {
      try {
        const brotli = require('brotli');
        this.app.use(brotli.compress({
          threshold: 1024,
          level: this.options.brotliLevel,
          filter: (req, res) => {
            const contentType = res.getHeader('Content-Type');
            return contentType && !contentType.includes('image') && !contentType.includes('video');
          }
        }));
      } catch (error) {
        logger.warn('Brotli compression not available', { error: error.message });
      }
    }
  }

  /**
   * Setup caching middleware
   */
  setupCachingMiddleware() {
    const StaticAssetMiddleware = require('./utils/static-asset-middleware');
    
    const staticMiddleware = new StaticAssetMiddleware({
      root: this.options.root,
      maxAge: this.options.maxAge,
      immutableMaxAge: this.options.immutableMaxAge,
      enableETag: true,
      enableLastModified: true,
      enableCompression: this.options.enableCompression,
      compressionThreshold: 1024,
      cacheSize: this.options.cacheSize
    });
    
    this.app.use(staticMiddleware.middleware());
    
    // Store reference for cache operations
    this.staticMiddleware = staticMiddleware;
  }

  /**
   * Setup metrics middleware
   */
  setupMetricsMiddleware() {
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      // Track response
      const originalSend = res.send;
      res.send = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const size = Buffer.byteLength(JSON.stringify(data));
        
        // Update stats
        this.stats.requests++;
        this.stats.bandwidth += size;
        
        // Log slow requests
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            url: req.url,
            method: req.method,
            duration,
            size
          });
        }
        
        originalSend.call(this, data);
      }.bind(this);
      
      next();
  }

  /**
   * Setup static file serving
   */
  setupStaticFileMiddleware() {
    const expressStatic = require('serve-static');
    
    this.app.use(expressStatic(this.options.root, {
      maxAge: 0, // We handle caching ourselves
      etag: false, // We handle ETags ourselves
      lastModified: false, // We handle Last-Modified ourselves
      setHeaders: (res, filePath, stat) => {
        // Additional headers can be set here
        const ext = path.extname(filePath).toLowerCase();
        
        // CORS headers for assets
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
        
        // Service Worker headers
        if (ext === '.js' || ext === '.css') {
          res.setHeader('Service-Worker-Allowed', '/sw.js');
        }
        
        // Preload hints for critical resources
        if (filePath.includes('index.html') || filePath.includes('main')) {
          res.setHeader('Link', '</css/main.css>; rel=preload; as=style, </js/main.js>; rel=preload; as=script');
        }
      }
    }));
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404);
      
      if (req.accepts('html')) {
        res.sendFile(path.join(this.options.root, '404.html'));
      } else {
        res.json({ 
          error: 'Not Found',
          message: 'The requested resource was not found',
          status: 404
        });
      }
    });
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      this.stats.errors++;
      
      logger.error('Static server error', {
        url: req.url,
        method: req.method,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500);
      
      if (req.accepts('html')) {
        res.sendFile(path.join(this.options.root, '500.html'));
      } else {
        res.json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          status: 500
        });
      }
    });
  }

  /**
   * Start the server
   */
  start() {
    try {
      // Create HTTP/2 server if enabled
      if (this.options.enableHTTP2) {
        const http2 = require('http2');
        const fs = require('fs');
        
        this.server = http2.createSecureServer({
          key: fs.readFileSync(path.join(__dirname, 'server.key')),
          cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
        }, this.app);
      } else {
        this.server = require('http').createServer(this.app);
      }
      
      this.server.listen(this.options.port, this.options.host, () => {
        const uptime = Date.now() - this.stats.startTime;
        
        logger.info('Enhanced static server started', {
          host: this.options.host,
          port: this.options.port,
          protocol: this.options.enableHTTP2 ? 'HTTP/2' : 'HTTP/1.1',
          compression: this.options.enableCompression,
          caching: this.options.enableCaching,
          security: this.options.enableSecurity,
          uptime
        });
        
        // Log server configuration
        console.log(`
🚀 Enhanced Static Server Started
📍 Host: ${this.options.host}
🌐 Port: ${this.options.port}
📁 Root: ${this.options.root}
🔒 Security: ${this.options.enableSecurity ? 'Enabled' : 'Disabled'}
🗜️ Compression: ${this.options.enableCompression ? 'Enabled' : 'Disabled'}
💾 Caching: ${this.options.enableCaching ? 'Enabled' : 'Disabled'}
📊 Metrics: ${this.options.enableMetrics ? 'Enabled' : 'Disabled'}
⏱️ Uptime: ${uptime}ms
        `);
      
      // Handle server errors
      this.server.on('error', (error) => {
        logger.error('Server error', { error: error.message });
      
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
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const memoryUsage = process.memoryUsage();
    
    return {
      ...this.stats,
      uptime,
      memoryUsage,
      requestsPerSecond: this.stats.requests / (uptime / 1000),
      averageRequestSize: this.stats.requests > 0 ? this.stats.bandwidth / this.stats.requests : 0,
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requests: 0,
      bandwidth: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    logger.info('Server statistics reset');
  }

  /**
   * Warm up cache with common files
   */
  async warmUpCache() {
    if (this.staticMiddleware) {
      const commonFiles = [
        '/index.html',
        '/css/main.css',
        '/js/main.js',
        '/assets/logo.png',
        '/favicon.ico',
        '/manifest.json'
      ];
      
      logger.info('Starting cache warm-up', { fileCount: commonFiles.length });
      
      for (const file of commonFiles) {
        await this.staticMiddleware.getFile(file);
      }
      
      logger.info('Cache warm-up completed');
    }
  }

  /**
   * Health check endpoint
   */
  setupHealthCheck() {
    this.app.get('/health', (req, res) => {
      const stats = this.getStats();
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: stats.uptime,
        memory: stats.memoryUsage,
        requests: stats.requests,
        cache: {
          hits: stats.cacheHits,
          misses: stats.cacheMisses,
          hitRate: stats.cacheHitRate
        },
        performance: {
          requestsPerSecond: stats.requestsPerSecond,
          averageRequestSize: stats.averageRequestSize,
          totalBandwidth: stats.bandwidth
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.json(health);
  }

  /**
   * Metrics endpoint
   */
  setupMetricsEndpoint() {
    this.app.get('/metrics', (req, res) => {
      const stats = this.getStats();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.json(stats);
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('Enhanced static server stopped');
    }
  }
}

module.exports = EnhancedStaticServer;
