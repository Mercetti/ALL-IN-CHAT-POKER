import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cacheService';
import { Logger } from '../utils/logger';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  tags?: string[];
  condition?: (req: Request) => boolean;
  invalidateOn?: string[];
  priority?: 'high' | 'normal' | 'low';
}

export class CacheMiddleware {
  private static instance: CacheMiddleware;
  private cacheService: CacheService;
  private logger: Logger;

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.logger = new Logger();
  }

  public static getInstance(): CacheMiddleware {
    if (!CacheMiddleware.instance) {
      CacheMiddleware.instance = new CacheMiddleware();
    }
    return CacheMiddleware.instance;
  }

  public cache(options: CacheMiddlewareOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if caching should be applied
        if (options.condition && !options.condition(req)) {
          return next();
        }

        // Generate cache key
        const key = options.keyGenerator 
          ? options.keyGenerator(req)
          : this.generateKey(req);

        // Try to get from cache
        const cached = await this.cacheService.get(key);
        
        if (cached) {
          this.logger.debug(`Cache hit: ${key}`);
          return res.json(cached);
        }

        // Store original res.json
        const originalJson = res.json;
        const cacheService = this.cacheService;
        const logger = this.logger;
        
        // Override res.json to cache the response
        res.json = function(data: any) {
          // Cache the response
          cacheService.set(key, data, {
            ttl: options.ttl,
            tags: options.tags,
            priority: options.priority,
          }).catch((error: any) => {
            logger.error(`Failed to cache response for key ${key}:`, error);
          });

          // Send the response
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        this.logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  public invalidate(patterns: string[] = []) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const keys = [];
        
        for (const pattern of patterns) {
          const matchedKeys = await this.cacheService.getKeysByPattern(pattern);
          keys.push(...matchedKeys);
        }

        let success = true;
        for (const key of keys) {
          const result = await this.cacheService.del(key);
          if (!result) {
            success = false;
          }
        }

        this.logger.log(`Invalidated ${keys.length} cache keys`);
        
        if (!success) {
          return res.status(500).json({
            success: false,
            error: {
              code: 'CACHE_INVALIDATION_ERROR',
              message: 'Failed to invalidate cache',
              timestamp: new Date().toISOString(),
            },
          });
        }

        next();
      } catch (error) {
        this.logger.error('Cache invalidation error:', error);
        next();
      }
    };
  }

  public invalidateByTag(tags: string[] = []) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let success = true;
        
        for (const tag of tags) {
          const result = await this.cacheService.invalidateByTag(tag);
          if (!result) {
            success = false;
          }
        }

        this.logger.log(`Invalidated cache by tags: ${tags.join(', ')}`);
        
        if (!success) {
          return res.status(500).json({
            success: false,
            error: {
              code: 'CACHE_INVALIDATION_ERROR',
              message: 'Failed to invalidate cache by tags',
              timestamp: new Date().toISOString(),
            },
          });
        }

        next();
      } catch (error) {
        this.logger.error('Cache tag invalidation error:', error);
        next();
      }
    };
  }

  private generateKey(req: Request): string {
    const method = req.method.toLowerCase();
    const path = req.path;
    const query = JSON.stringify(req.query);
    const userId = (req as any).user?.id || 'anonymous';
    
    return `${method}:${path}:${query}:${userId}`;
  }

  public static createKeyGenerator(...parts: string[]): (req: Request) => string {
    return (req: Request) => {
      const values = parts.map(part => {
        if (part.startsWith(':')) {
          // Extract dynamic value from request
          const path = part.substring(1);
          return this.extractValue(req, path);
        }
        return part;
      });
      
      return values.join(':');
    };
  }

  private static extractValue(req: Request, path: string): string {
    const parts = path.split('.');
    let value: any = req;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return 'unknown';
      }
    }
    
    return String(value);
  }

  public static createCondition(...conditions: Array<(req: Request) => boolean>): (req: Request) => boolean {
    return (req: Request) => {
      return conditions.every(condition => condition(req));
    };
  }

  public static userAuthenticated(): (req: Request) => boolean {
    return (req: Request) => {
      return !!(req as any).user;
    };
  }

  public static methodAllowed(...methods: string[]): (req: Request) => boolean {
    return (req: Request) => {
      return methods.includes(req.method.toLowerCase());
    };
  }

  public static pathMatches(pattern: string | RegExp): (req: Request) => boolean {
    return (req: Request) => {
      if (typeof pattern === 'string') {
        return req.path === pattern;
      } else {
        return pattern.test(req.path);
      }
    };
  }

  public static queryExists(...keys: string[]): (req: Request) => boolean {
    return (req: Request) => {
      return keys.every(key => req.query[key] !== undefined);
    };
  }

  public static headerExists(...headers: string[]): (req: Request) => boolean {
    return (req: Request) => {
      return headers.every(header => req.get(header) !== undefined);
    };
  }

  public async getCacheStats() {
    return await this.cacheService.getStats();
  }

  public async healthCheck() {
    return await this.cacheService.healthCheck();
  }

  public async flushCache() {
    return await this.cacheService.flush();
  }
}

export default CacheMiddleware.getInstance();
