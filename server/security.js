/**
 * Security Module for Helm Control
 * Handles authentication, authorization, and security middleware
 */

const rateLimit = require('express-rate-limit');
const { createHash } = require('crypto');
const middleware = require('../middleware/csrfMiddleware');

class SecurityManager {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    this.failedAttempts = new Map();
    this.suspiciousIPs = new Set();
    
    this.setupSecurity();
  }

  setupSecurity() {
    this.setupRateLimiting();
    this.setupAdvancedRateLimiting();
    this.setupIPBlocking();
    this.setupCSRFProtection();
    this.setupContentSecurityPolicy();
    this.setupSecurityHeaders();
  }

  setupRateLimiting() {
    // General rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs (was 100)
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    this.app.use(limiter);
  }

  setupAdvancedRateLimiting() {
    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // limit each IP to 50 auth requests per windowMs (was 5)
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${req.ip}:${req.path}`
    });

    // Apply to auth routes
    this.app.use('/login', authLimiter);
    this.app.use('/admin', authLimiter);
    this.app.use('/api/auth', authLimiter);
  }

  setupIPBlocking() {
    this.app.use((req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      // Check if IP is blocked
      if (this.suspiciousIPs.has(clientIP)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been blocked due to suspicious activity'
        });
      }
      
      // Check failed attempts
      const attempts = this.failedAttempts.get(clientIP) || 0;
      if (attempts > 10) {
        this.suspiciousIPs.add(clientIP);
        this.logSuspiciousActivity(clientIP, 'ip_blocked');
        return res.status(403).json({
          error: 'Access denied',
          message: 'Too many failed attempts'
        });
      }
      
      next();
    });
  }

  setupCSRFProtection() {
    if (!this.config.ENFORCE_ADMIN_CSRF) {
      return;
    }

    this.app.use(middleware.createCsrfMiddleware({ config: this.config }));

    this.app.get('/api/csrf-token', (req, res) => {
      const token = middleware.issueCsrfCookie(res, {
        auth: this.config.auth,
        config: this.config,
      });
      res.json({ csrfToken: token });
    });
  }

  setupContentSecurityPolicy() {
    this.app.use((req, res, next) => {
      // Add nonce for inline scripts if needed
      const nonce = this.generateNonce();
      res.locals.nonce = nonce;
      
      const csp = [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://cdn.socket.io`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' data: https: blob:`,
        `connect-src 'self' wss: ws:`,
        `font-src 'self' https://fonts.gstatic.com`,
        `object-src 'none'`,
        `media-src 'self'`,
        `frame-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`
      ].join('; ');
      
      res.setHeader('Content-Security-Policy', csp);
      next();
    });
  }

  setupSecurityHeaders() {
    // Custom security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      next();
    });
  }

  generateNonce() {
    return createHash('sha256')
      .update(Date.now() + Math.random().toString())
      .digest('base64');
  }

  recordFailedAttempt(ip) {
    const current = this.failedAttempts.get(ip) || 0;
    this.failedAttempts.set(ip, current + 1);
    
    // Reset after 1 hour
    setTimeout(() => {
      this.failedAttempts.delete(ip);
    }, 60 * 60 * 1000);
  }

  logSuspiciousActivity(ip, activity) {
    console.log(`[SECURITY] Suspicious activity from ${ip}: ${activity}`);
    // In production, this would log to a secure audit system
  }

  // Middleware for checking admin access
  requireAdminAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Admin access requires authentication'
      });
    }

    // Verify token (implement proper JWT verification)
    try {
      const decoded = this.verifyAdminToken(token);
      req.admin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid authentication',
        message: 'Admin token is invalid or expired'
      });
    }
  }

  verifyAdminToken(token) {
    // Implement proper JWT verification
    // This is a placeholder - implement proper verification
    return { userId: 'admin', role: 'admin' };
  }

  // Middleware for API rate limiting
  requireAPIAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'API access requires valid API key'
      });
    }

    // Verify API key
    if (this.config.apiKeys && !this.config.apiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'Provided API key is not valid'
      });
    }

    req.apiKey = apiKey;
    next();
  }
}

module.exports = SecurityManager;
