/**
 * Static Asset Middleware - Simplified Version
 * Basic static asset serving functionality
 */

const logger = require('./logger');
const path = require('path');
const fs = require('fs');

class StaticAssetMiddleware {
  constructor(options = {}) {
    this.root = options.root || 'public';
    this.maxAge = options.maxAge || 86400000; // 24 hours
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return (req, res, next) => {
      this.stats.hits++;
      
      try {
        const filePath = path.join(process.cwd(), this.root, req.path);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          this.stats.misses++;
          return next();
        }
        
        // Set cache headers
        res.setHeader('Cache-Control', `public, max-age=${this.maxAge}`);
        res.setHeader('ETag', `"${Date.now()}"`);
        
        // Send file
        res.sendFile(filePath);
        
      } catch (error) {
        logger.error('Static asset middleware error', { error: error.message });
        next();
      }
    };
  }

  /**
   * Get middleware status
   */
  getStatus() {
    return {
      stats: this.stats,
      root: this.root,
      maxAge: this.maxAge,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = StaticAssetMiddleware;
