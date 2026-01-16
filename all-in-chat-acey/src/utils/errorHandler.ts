import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { EnvironmentService } from '../config/environment';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  body?: any;
  query?: any;
  headers?: Record<string, string>;
  timestamp: Date;
  environment: string;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: ErrorContext;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp?: string;
    requestId?: string;
    details?: any;
  };
  metadata: {
    environment: string;
    version: string;
    correlationId?: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: ErrorContext,
    metadata?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any, context?: ErrorContext) {
    super(message, 400, 'VALIDATION_ERROR', true, context, { details });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: ErrorContext) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: ErrorContext) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: ErrorContext) {
    super(message, 404, 'NOT_FOUND_ERROR', true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 409, 'CONFLICT_ERROR', true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error, context?: ErrorContext) {
    super(message, 500, 'DATABASE_ERROR', true, context, { originalError: originalError?.message });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: ErrorContext) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, context, { service });
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  private environmentService: EnvironmentService;

  private constructor() {
    this.logger = new Logger();
    this.environmentService = EnvironmentService.getInstance();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error, context?: ErrorContext): ErrorDetails {
    const errorDetails: ErrorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      isOperational: false,
      context: context || this.createDefaultContext(),
    };

    // Handle known error types
    if (error instanceof AppError) {
      errorDetails.code = error.code;
      errorDetails.statusCode = error.statusCode;
      errorDetails.isOperational = error.isOperational;
      errorDetails.context = error.context || context;
      errorDetails.metadata = error.metadata;
    } else {
      // Handle unknown errors
      errorDetails.code = this.classifyError(error);
      errorDetails.isOperational = false;
    }

    // Log the error
    this.logError(errorDetails);

    return errorDetails;
  }

  public handleAsyncError(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        const context = this.createRequestContext(req);
        const errorDetails = this.handleError(error, context);
        next(errorDetails);
      });
    };
  }

  public createRequestContext(req: Request): ErrorContext {
    return {
      userId: (req as any).user?.id,
      requestId: (req as any).requestId || this.generateRequestId(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      body: this.sanitizeBody(req.body),
      query: req.query,
      headers: this.sanitizeHeaders(req.headers as Record<string, string>),
      timestamp: new Date(),
      environment: this.environmentService.getAppConfig().environment,
    };
  }

  public createDefaultContext(): ErrorContext {
    return {
      timestamp: new Date(),
      environment: this.environmentService.getAppConfig().environment,
    };
  }

  private classifyError(error: Error): string {
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'CastError') return 'CAST_ERROR';
    if (error.name === 'MongoError') return 'MONGODB_ERROR';
    if (error.name === 'PostgresError') return 'POSTGRES_ERROR';
    if (error.name === 'RedisError') return 'REDIS_ERROR';
    if (error.name === 'NetworkError') return 'NETWORK_ERROR';
    if (error.name === 'TimeoutError') return 'TIMEOUT_ERROR';
    if (error.name === 'SyntaxError') return 'SYNTAX_ERROR';
    if (error.name === 'ReferenceError') return 'REFERENCE_ERROR';
    if (error.name === 'TypeError') return 'TYPE_ERROR';
    return 'UNKNOWN_ERROR';
  }

  private logError(errorDetails: ErrorDetails): void {
    const logData = {
      name: errorDetails.name,
      message: errorDetails.message,
      code: errorDetails.code,
      statusCode: errorDetails.statusCode,
      isOperational: errorDetails.isOperational,
      context: errorDetails.context,
      metadata: errorDetails.metadata,
      stack: errorDetails.stack,
    };

    if (errorDetails.isOperational) {
      this.logger.warn(`Operational error: ${errorDetails.message}`, logData);
    } else {
      this.logger.error(`Unexpected error: ${errorDetails.message}`, logData);
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }
    
    return sanitized;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***';
      }
    }
    
    return sanitized;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public createErrorResponse(errorDetails: ErrorDetails): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: errorDetails.code,
        message: errorDetails.message,
        timestamp: (errorDetails.context?.timestamp || new Date()).toISOString(),
        requestId: errorDetails.context?.requestId,
      },
      metadata: {
        environment: errorDetails.context?.environment || 'unknown',
        version: process.env.APP_VERSION || '1.0.0',
        correlationId: errorDetails.context?.requestId,
      },
    };

    // Include details only in development or for operational errors
    if (this.environmentService.isDevelopment() || errorDetails.isOperational) {
      response.error.details = errorDetails.metadata;
    }

    return response;
  }

  public isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    
    // Check for common operational errors
    const operationalErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
      'ConflictError',
      'RateLimitError',
    ];
    
    return operationalErrors.includes(error.name);
  }

  public getErrorStats(): {
    total: number;
    operational: number;
    nonOperational: number;
    byCode: Record<string, number>;
    recent: Array<ErrorDetails>;
  } {
    // This would typically integrate with a metrics service
    return {
      total: 0,
      operational: 0,
      nonOperational: 0,
      byCode: {},
      recent: [],
    };
  }
}

export default ErrorHandler;
