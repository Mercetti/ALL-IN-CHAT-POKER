import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import WebSocketService from '../services/websocketService';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
}

export interface SecurityConfig {
  enableCORS: boolean;
  enableHelmet: boolean;
  rateLimit?: RateLimitConfig;
  trustedOrigins: string[];
  ipWhitelist: string[];
  blockedIPs: string[];
}

export interface RateLimitData {
  count: number;
  resetTime: number;
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private logger: Logger;
  private wsService: any;
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitData> = new Map();

  private constructor(config?: SecurityConfig) {
    this.logger = new Logger();
    this.wsService = (WebSocketService as any).getInstance();
    this.config = config || {
      enableCORS: true,
      enableHelmet: true,
      trustedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://acey-control-center.com',
        'https://all-in-chat-poker.fly.dev',
      ],
      ipWhitelist: [],
      blockedIPs: [],
    };
  }

  public static getInstance(config?: SecurityConfig): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      const defaultConfig: SecurityConfig = {
        enableCORS: true,
        enableHelmet: true,
        rateLimit: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // requests per window
          message: 'Too many requests from this IP, please try again later.',
          standardHeaders: true,
        },
        trustedOrigins: [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://acey-control-center.com',
          'https://all-in-chat-poker.fly.dev',
        ],
        ipWhitelist: [],
        blockedIPs: [],
      };

      SecurityMiddleware.instance = new SecurityMiddleware(config || defaultConfig);
    }
    return SecurityMiddleware.instance;
  }

  public middleware() {
    const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

    // CORS middleware
    if (this.config.enableCORS) {
      middlewares.push(this.corsMiddleware());
    }

    // Helmet middleware
    if (this.config.enableHelmet) {
      middlewares.push(this.helmetMiddleware());
    }

    // Rate limiting middleware
    if (this.config.rateLimit) {
      middlewares.push(this.rateLimitMiddleware());
    }

    // IP filtering middleware
    middlewares.push(this.ipFilterMiddleware());

    // Security headers middleware
    middlewares.push(this.securityHeadersMiddleware());

    // Request logging middleware
    middlewares.push(this.requestLoggingMiddleware());

    return middlewares;
  }

  private corsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      const isAllowed = this.config.trustedOrigins.some(trusted => 
        origin && origin.toLowerCase().includes(trusted.toLowerCase())
      );

      if (isAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
      } else {
        this.logger.warn(`CORS blocked for origin: ${origin}`, { ip: req.ip });
        return res.status(403).json({ error: 'CORS policy violation' });
      }

      next();
    };
  }

  private helmetMiddleware() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'self'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xFrameOptions: 'DENY' as any,
      ieNoOpen: true,
    });
  }

  private rateLimitMiddleware() {
    const limiter = rateLimit({
      windowMs: this.config.rateLimit?.windowMs || 900000,
      max: this.config.rateLimit?.max || 100,
      message: this.config.rateLimit?.message || 'Too many requests',
      standardHeaders: this.config.rateLimit?.standardHeaders || true,
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `${ip}_${Date.now()}`;
      },
      skip: (req: Request) => {
        // Skip rate limiting for health checks and static assets
        const skipPaths = ['/health', '/metrics', '/favicon.ico', '/robots.txt'];
        return skipPaths.some(path => req.path?.startsWith(path));
      },
      handler: (req: Request, res: Response, next: NextFunction) => {
        // Custom rate limit handling
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = this.rateLimitStore.get(ip);
        
        if (key) {
          key.count++;
          if (key.count > (this.config.rateLimit?.max || 100)) {
            res.status(429).json({
              error: 'Too many requests',
              message: this.config.rateLimit?.message || 'Too many requests',
              retryAfter: (this.config.rateLimit?.windowMs || 900000) / 1000,
            });
            return;
          }
        } else {
          this.rateLimitStore.set(ip, {
            count: 1,
            resetTime: Date.now() + (this.config.rateLimit?.windowMs || 900000),
          });
        }
        
        next();
      },
    });

    return limiter;
  }

  private ipFilterMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Check IP whitelist
      if ((this.config.ipWhitelist?.length || 0) > 0 && !(this.config.ipWhitelist || []).includes(ip)) {
        this.logger.warn(`IP not whitelisted: ${ip}`, { ip });
        return res.status(403).json({ error: 'IP not authorized' });
      }

      // Check blocked IPs
      if ((this.config.blockedIPs || []).includes(ip)) {
        this.logger.warn(`Blocked IP attempted access: ${ip}`, { ip });
        return res.status(403).json({ error: 'IP blocked' });
      }

      next();
    };
  }

  private securityHeadersMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Remove server information
      res.removeHeader('Server');
      res.removeHeader('X-Powered-By');
      
      // Security headers
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Content Security Policy
      res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' https: data:; object-src 'self'; media-src 'self'; frame-src 'self';");
      
      next();
    };
  }

  private requestLoggingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Log request details
      this.logger.log('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      // Override res.json to include timing
      const originalJson = res.json;
      res.json = function(data: any) {
        const duration = Date.now() - startTime;
        const response = originalJson.call(this, data);
        
        // Add timing header
        res.set('X-Response-Time', `${duration}ms`);
        
        return response;
      };

      next();
    };
  }

  public getClientIPStats(): {
    totalRequests: number;
    uniqueIPs: number;
    topIPs: Array<{ ip: string; requests: number }>;
    rateLimitViolations: number;
  } {
    const stats = {
      totalRequests: this.rateLimitStore.size,
      uniqueIPs: this.rateLimitStore.size,
      topIPs: Array.from(this.rateLimitStore.entries())
        .map(([ip, data]) => ({ ip, requests: data.count }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10),
      rateLimitViolations: Array.from(this.rateLimitStore.values())
        .filter(data => data.count > (this.config.rateLimit?.max || 100))
        .length,
    };

    return stats;
  }

  public resetRateLimitStore(): void {
    this.rateLimitStore.clear();
    this.logger.log('Rate limit store reset');
  }

  public isIPBlocked(ip: string): boolean {
    return this.config.blockedIPs.includes(ip);
  }

  public isIPWhitelisted(ip: string): boolean {
    return this.config.ipWhitelist.includes(ip);
  }

  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log('Security config updated', this.config);
  }
}

export default SecurityMiddleware;
