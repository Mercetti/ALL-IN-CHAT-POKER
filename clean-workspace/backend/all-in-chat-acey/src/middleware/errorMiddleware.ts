import { Request, Response, NextFunction } from 'express';
import { ErrorHandler, ErrorDetails } from '../utils/errorHandler';
import { Logger } from '../utils/logger';

export class ErrorMiddleware {
  private static instance: ErrorMiddleware;
  private errorHandler: ErrorHandler;
  private logger: Logger;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.logger = new Logger();
  }

  public static getInstance(): ErrorMiddleware {
    if (!ErrorMiddleware.instance) {
      ErrorMiddleware.instance = new ErrorMiddleware();
    }
    return ErrorMiddleware.instance;
  }

  public globalErrorHandler() {
    return (error: ErrorDetails, req: Request, res: Response, next: NextFunction) => {
      // Create error response
      const errorResponse = this.errorHandler.createErrorResponse(error);

      // Set appropriate status code
      const statusCode = error.statusCode || 500;

      // Log the error
      this.logError(error, req);

      // Send error response
      res.status(statusCode).json(errorResponse);
    };
  }

  public notFoundHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
      const context = this.errorHandler.createRequestContext(req);
      const error = this.errorHandler.handleError(
        new Error(`Route ${req.method} ${req.path} not found`),
        context
      );

      const errorResponse = this.errorHandler.createErrorResponse(error);
      res.status(404).json(errorResponse);
    };
  }

  public asyncErrorHandler() {
    return (fn: Function) => {
      return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
          const context = this.errorHandler.createRequestContext(req);
          const errorDetails = this.errorHandler.handleError(error, context);
          next(errorDetails);
        });
      };
    };
  }

  public validationErrorHandler() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error.name === 'ValidationError') {
        const context = this.errorHandler.createRequestContext(req);
        const errorDetails = this.errorHandler.handleError(error, context);
        const errorResponse = this.errorHandler.createErrorResponse(errorDetails);
        
        res.status(400).json(errorResponse);
      } else {
        next(error);
      }
    };
  }

  public databaseErrorHandler() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error.name === 'DatabaseError' || error.code?.startsWith('DB_')) {
        const context = this.errorHandler.createRequestContext(req);
        const errorDetails = this.errorHandler.handleError(error, context);
        const errorResponse = this.errorHandler.createErrorResponse(errorDetails);
        
        res.status(500).json(errorResponse);
      } else {
        next(error);
      }
    };
  }

  public rateLimitErrorHandler() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error.name === 'RateLimitError' || error.status === 429) {
        const context = this.errorHandler.createRequestContext(req);
        const errorDetails = this.errorHandler.handleError(error, context);
        const errorResponse = this.errorHandler.createErrorResponse(errorDetails);
        
        res.status(429).json(errorResponse);
      } else {
        next(error);
      }
    };
  }

  public corsErrorHandler() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error.name === 'CORSError' || error.message?.includes('CORS')) {
        const context = this.errorHandler.createRequestContext(req);
        const errorDetails = this.errorHandler.handleError(error, context);
        const errorResponse = this.errorHandler.createErrorResponse(errorDetails);
        
        res.status(403).json(errorResponse);
      } else {
        next(error);
      }
    };
  }

  private logError(error: ErrorDetails, req: Request): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: (req as any).requestId,
      },
      context: error.context,
    };

    if (error.isOperational) {
      this.logger.warn(`Operational error: ${error.message}`, logData);
    } else {
      this.logger.error(`Unexpected error: ${error.message}`, logData);
    }
  }

  public setupGracefulShutdown(server: any): void {
    const shutdown = (signal: string) => {
      this.logger.log(`Received ${signal}, starting graceful shutdown...`);
      
      server.close((err: any) => {
        if (err) {
          this.logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        this.logger.log('Server closed successfully');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        this.logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
  }

  public setupUncaughtExceptionHandlers(): void {
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught Exception:', error);
      
      // Create error details without request context
      const errorDetails = this.errorHandler.handleError(error);
      
      // In production, we might want to exit the process
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('Uncaught exception in production, exiting...');
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('Unhandled Rejection:', { reason, promise });
      
      // Create error details without request context
      const error = new Error(`Unhandled Rejection: ${reason}`);
      const errorDetails = this.errorHandler.handleError(error);
      
      // In production, we might want to exit the process
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('Unhandled rejection in production, exiting...');
        process.exit(1);
      }
    });

    process.on('warning', (warning: Error) => {
      this.logger.warn('Process Warning:', warning);
    });
  }

  public getErrorMetrics(): {
    totalErrors: number;
    operationalErrors: number;
    nonOperationalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByStatusCode: Record<string, number>;
    recentErrors: Array<{
      timestamp: Date;
      code: string;
      message: string;
      statusCode: number;
    }>;
  } {
    // This would typically integrate with a metrics service like Prometheus
    return {
      totalErrors: 0,
      operationalErrors: 0,
      nonOperationalErrors: 0,
      errorsByCode: {},
      errorsByStatusCode: {},
      recentErrors: [],
    };
  }

  public healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    lastError?: Date;
    uptime: number;
  } {
    const metrics = this.getErrorMetrics();
    const errorRate = metrics.totalErrors > 0 ? metrics.nonOperationalErrors / metrics.totalErrors : 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 0.1) {
      status = 'unhealthy';
    } else if (errorRate > 0.05) {
      status = 'degraded';
    }
    
    return {
      status,
      errorRate,
      lastError: metrics.recentErrors[0]?.timestamp,
      uptime: process.uptime(),
    };
  }
}

export default ErrorMiddleware;
