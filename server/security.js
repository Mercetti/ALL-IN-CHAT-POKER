/**
 * Production security enhancements
 * Rate limiting, security headers, and advanced authentication
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createHash } = require('crypto');
const middleware = require('./middleware');

class SecurityManager {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    this.failedAttempts = new Map();
    this.suspiciousIPs = new Set();
    
    this.init();
  }

  init() {
    this.setupSecurityHeaders();
    this.setupRateLimiting();
    this.setupAdvancedRateLimiting();
    this.setupIPBlocking();
    this.setupCSRFProtection();
    this.setupContentSecurityPolicy();
  }

  setupSecurityHeaders() {
    // Basic security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

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

  setupRateLimiting() {
    // General rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logSuspiciousActivity(req.ip, 'rate_limit_exceeded');
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: '15 minutes'
        });
      }
    });

    this.app.use(limiter);
  }

  setupAdvancedRateLimiting() {
    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 auth requests per windowMs
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

  logSuspiciousActivity(ip, reason) {
    console.warn(`[SECURITY] Suspicious activity from ${ip}: ${reason}`);
    
    // In production, you'd send this to a security monitoring service
    if (this.config.IS_PRODUCTION) {
      // TODO: Send to security monitoring service
    }
  }

  clearFailedAttempts(ip) {
    this.failedAttempts.delete(ip);
  }

  unblockIP(ip) {
    this.suspiciousIPs.delete(ip);
    this.failedAttempts.delete(ip);
  }
}

module.exports = SecurityManager;
