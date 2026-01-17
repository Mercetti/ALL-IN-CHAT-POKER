import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/databaseService';
import { Logger } from '../utils/logger';

export interface DatabaseMiddlewareOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export class DatabaseMiddleware {
  private static instance: DatabaseMiddleware;
  private databaseService: DatabaseService;
  private logger: Logger;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.logger = new Logger();
  }

  public static getInstance(): DatabaseMiddleware {
    if (!DatabaseMiddleware.instance) {
      DatabaseMiddleware.instance = new DatabaseMiddleware();
    }
    return DatabaseMiddleware.instance;
  }

  public healthCheck() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const health = await this.databaseService.healthCheck();
        
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json({
          success: health.status !== 'unhealthy',
          status: health.status,
          database: health.details,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error('Database health check failed:', error);
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          error: {
            code: 'DATABASE_HEALTH_CHECK_ERROR',
            message: 'Database health check failed',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };
  }

  public stats() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const stats = await this.databaseService.getStats();
        
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error('Database stats failed:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_STATS_ERROR',
            message: 'Failed to get database stats',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };
  }

  public transaction() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        const result = await this.databaseService.transaction(async (client) => {
          // Store client in request for use in route handlers
          (req as any).dbClient = client;
          
          // Call the next middleware/route handler
          return new Promise((resolve, reject) => {
            const originalJson = res.json;
            const originalSend = res.send;
            
            let responseData: any;
            let hasResponded = false;
            
            res.json = (data: any) => {
              responseData = data;
              hasResponded = true;
              return originalJson.call(res, data);
            };
            
            res.send = (data: any) => {
              responseData = data;
              hasResponded = true;
              return originalSend.call(res, data);
            };
            
            const nextPromise = new Promise<any>((resolve, reject) => {
              const originalNext = next;
              next = (error?: any) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(undefined);
                }
              };
              originalNext();
            });
            
            nextPromise.then(() => {
              if (!hasResponded) {
                resolve(undefined);
              } else {
                resolve(responseData);
              }
            }).catch(reject);
          });
        });
        
        const queryTime = Date.now() - startTime;
        this.logger.debug(`Database transaction completed in ${queryTime}ms`);
        
        if (!res.headersSent) {
          res.json({
            success: true,
            data: result,
            queryTime,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.logger.error('Database transaction failed:', error);
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'DATABASE_TRANSACTION_ERROR',
              message: 'Database transaction failed',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    };
  }

  public query(options: DatabaseMiddlewareOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        // Add database service to request
        (req as any).db = this.databaseService;
        
        // Continue to next middleware
        next();
      } catch (error) {
        this.logger.error('Database middleware error:', error);
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'DATABASE_MIDDLEWARE_ERROR',
              message: 'Database middleware error',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    };
  }

  public connectionPool() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pool = this.databaseService.getPool();
        const stats = await this.databaseService.getStats();
        
        res.json({
          success: true,
          data: {
            pool: {
              totalCount: pool.totalCount,
              idleCount: pool.idleCount,
              waitingCount: pool.waitingCount,
            },
            stats,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error('Connection pool stats failed:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'CONNECTION_POOL_ERROR',
            message: 'Failed to get connection pool stats',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };
  }

  public resetStats() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.databaseService.resetStats();
        
        res.json({
          success: true,
          message: 'Database statistics reset successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error('Database stats reset failed:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_STATS_RESET_ERROR',
            message: 'Failed to reset database statistics',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };
  }

  public async close(): Promise<void> {
    await this.databaseService.close();
  }

  public isReady(): boolean {
    return this.databaseService.isReady();
  }
}

export default DatabaseMiddleware.getInstance();
