import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import WebSocketService from './websocketService';
import FCMService from './fcmService';
import APNSService from './apnsService';

// Add node-fetch for making HTTP requests
const fetch = require('node-fetch');

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  system: SystemHealth;
  metrics: HealthMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface HealthMetrics {
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  averageResponseTime: number;
  websocketConnections: number;
  meshInstances: number;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private logger: Logger;
  private startTime: Date;
  private wsService: any;

  private constructor() {
    this.logger = new Logger();
    this.startTime = new Date();
    this.wsService = (WebSocketService as any).getInstance();
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  public async performHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthResult = await this.getHealthStatus();
      
      // Set appropriate HTTP status based on health
      const statusCode = healthResult.status === 'healthy' ? 200 : 
                       healthResult.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthResult);
      
      this.logger.log(`Health check completed: ${healthResult.status}`, { 
        statusCode, 
        responseTime: healthResult.services.find(s => s.name === 'api')?.responseTime 
      });
    } catch (error) {
      this.logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: (error as any).message,
      });
    }
  }

  private async getHealthStatus(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Check all services
    const services = await Promise.all([
      this.checkAPIService(),
      this.checkDatabaseService(),
      this.checkRedisService(),
      this.checkWebSocketService(),
      this.checkFCMService(),
      this.checkAPNSService(),
    ]);

    const systemHealth = await this.getSystemHealth();
    const metrics = await this.getHealthMetrics();

    const overallStatus = this.determineOverallStatus(services, systemHealth);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      system: systemHealth,
      metrics,
    };
  }

  private async checkAPIService(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple API health check - would integrate with your actual API
      const response = await fetch('http://localhost:8080/api/apns/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      } as any);

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: 'api',
          status: 'healthy',
          responseTime,
          lastCheck: new Date(),
        };
      } else {
        return {
          name: 'api',
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date(),
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      return {
        name: 'api',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as Error).message,
      };
    }
  }

  private async checkDatabaseService(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Database health check - would integrate with your actual database
      const response = await fetch('http://localhost:8080/api/db/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      } as any);

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: 'database',
          status: 'healthy',
          responseTime,
          lastCheck: new Date(),
        };
      } else {
        return {
          name: 'database',
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date(),
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as any).message,
      };
    }
  }

  private async checkRedisService(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Redis health check - would integrate with your actual Redis
      const response = await fetch('http://localhost:8080/api/redis/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      } as any);

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: 'redis',
          status: 'healthy',
          responseTime,
          lastCheck: new Date(),
        };
      } else {
        return {
          name: 'redis',
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date(),
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as any).message,
      };
    }
  }

  private async checkWebSocketService(): Promise<ServiceHealth> {
    try {
      const stats = this.wsService.getClientStats();
      const responseTime = 0; // WebSocket is real-time, no response time

      return {
        name: 'websocket',
        status: stats.authenticated > 0 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
        details: {
          totalConnections: stats.total,
          authenticatedConnections: stats.authenticated,
          connectionsByRole: stats.byRole,
        },
      };
    } catch (error) {
      return {
        name: 'websocket',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as any).message,
      };
    }
  }

  private async checkFCMService(): Promise<ServiceHealth> {
    try {
      // FCM health check - would integrate with your actual FCM service
      const startTime = Date.now();
      
      // Simple check - try to validate a test token
      const isValid = await FCMService.validateDeviceToken('test-token');
      const responseTime = Date.now() - startTime;

      return {
        name: 'fcm',
        status: isValid ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
        details: {
          tokenValidation: isValid,
        },
      };
    } catch (error) {
      return {
        name: 'fcm',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as any).message,
      };
    }
  }

  private async checkAPNSService(): Promise<ServiceHealth> {
    try {
      // APNS health check - would integrate with your actual APNS service
      const startTime = Date.now();
      
      // Simple check - try to validate a test token
      const isValid = await APNSService.validateDeviceToken('test-token');
      const responseTime = Date.now() - startTime;

      return {
        name: 'apns',
        status: isValid ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
        details: {
          tokenValidation: isValid,
        },
      };
    } catch (error) {
      return {
        name: 'apns',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as any).message,
      };
    }
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Get disk usage (simplified)
      const diskUsage = await this.getDiskUsage();

      return {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
        cpu: {
          usage: cpuUsage.user,
        },
        disk: diskUsage,
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      throw error;
    }
  }

  private async getDiskUsage(): Promise<{ used: number; total: number; percentage: number }> {
    try {
      const fs = require('fs');
      const stats = fs.statSync('/');
      
      // This is a simplified disk usage check
      // In production, you'd want to check actual disk space
      return {
        used: 0, // Placeholder
        total: 100, // Placeholder
        percentage: 0, // Placeholder
      };
    } catch (error) {
      return {
        used: 0,
        total: 100,
        percentage: 0,
      };
    }
  }

  private async getHealthMetrics(): Promise<HealthMetrics> {
    try {
      const wsStats = this.wsService.getClientStats();
      
      // These would integrate with your actual metrics collection
      return {
        activeConnections: wsStats.total,
        requestsPerMinute: 0, // Would come from your API metrics
        errorRate: 0, // Would come from your API metrics
        averageResponseTime: 0, // Would come from your API metrics
        websocketConnections: wsStats.total,
        meshInstances: wsStats.authenticated, // Approximate mesh instances
      };
    } catch (error) {
      this.logger.error('Failed to get health metrics:', error);
      throw error;
    }
  }

  private determineOverallStatus(
    services: ServiceHealth[], 
    systemHealth: SystemHealth
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    if (unhealthyServices.length > 0) {
      return 'unhealthy';
    }

    if (degradedServices.length > 0 || 
        systemHealth.memory.percentage > 90 ||
        systemHealth.cpu.usage > 90 ||
        systemHealth.disk.percentage > 90) {
      return 'degraded';
    }

    return 'healthy';
  }
}

export default HealthCheckService.getInstance();
