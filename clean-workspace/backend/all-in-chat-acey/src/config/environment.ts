import { Logger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

export interface WebSocketConfig {
  port: number;
  path: string;
  allowedOrigins: string[];
  heartbeatInterval: number;
  maxConnections: number;
  timeout: number;
}

export interface NotificationConfig {
  fcm: {
    serverKey: string;
    projectId: string;
  };
  apns: {
    keyId: string;
    teamId: string;
    bundleId: string;
    privateKey: string;
  };
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiration: string;
  bcryptRounds: number;
  sessionSecret: string;
  encryptionKey: string;
}

export interface MonitoringConfig {
  prometheus: {
    enabled: boolean;
    port: number;
    path: string;
  };
  grafana: {
    enabled: boolean;
    port: number;
    adminPassword: string;
  };
  elasticsearch: {
    enabled: boolean;
    url: string;
    username?: string;
    password?: string;
  };
}

export interface AppConfig {
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  corsOrigins: string[];
  trustProxy: boolean;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export interface EnvironmentConfig {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  websocket: WebSocketConfig;
  notifications: NotificationConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export class EnvironmentService {
  private static instance: EnvironmentService;
  private logger: Logger;
  private config: EnvironmentConfig;

  private constructor() {
    this.logger = new Logger();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      app: {
        port: parseInt(process.env.PORT || '8080', 10),
        host: process.env.HOST || '0.0.0.0',
        environment: env as 'development' | 'staging' | 'production',
        logLevel: (process.env.LOG_LEVEL as any) || 'info',
        corsOrigins: this.parseCommaSeparated(process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173'),
        trustProxy: process.env.TRUST_PROXY === 'true',
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        },
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'acey_production',
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'acey:',
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      },
      websocket: {
        port: parseInt(process.env.WS_PORT || '8081', 10),
        path: process.env.WS_PATH || '/mesh/ws',
        allowedOrigins: this.parseCommaSeparated(process.env.WS_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://acey-control-center.com'),
        heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
        maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
        timeout: parseInt(process.env.WS_TIMEOUT || '5000', 10),
      },
      notifications: {
        fcm: {
          serverKey: process.env.FCM_SERVER_KEY || '',
          projectId: process.env.FCM_PROJECT_ID || '',
        },
        apns: {
          keyId: process.env.APNS_KEY_ID || '',
          teamId: process.env.APNS_TEAM_ID || '',
          bundleId: process.env.APNS_BUNDLE_ID || '',
          privateKey: process.env.APNS_PRIVATE_KEY || '',
        },
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || this.generateSecret(),
        jwtExpiration: process.env.JWT_EXPIRATION || '24h',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        sessionSecret: process.env.SESSION_SECRET || this.generateSecret(),
        encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecret(),
      },
      monitoring: {
        prometheus: {
          enabled: process.env.PROMETHEUS_ENABLED === 'true',
          port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
          path: process.env.PROMETHEUS_PATH || '/metrics',
        },
        grafana: {
          enabled: process.env.GRAFANA_ENABLED === 'true',
          port: parseInt(process.env.GRAFANA_PORT || '3001', 10),
          adminPassword: process.env.GRAFANA_ADMIN_PASSWORD || 'admin',
        },
        elasticsearch: {
          enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
          url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD,
        },
      },
    };
  }

  private validateConfiguration(): void {
    const requiredEnvVars = [
      'DB_HOST',
      'DB_NAME',
      'DB_USERNAME',
      'DB_PASSWORD',
      'JWT_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logger.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
      this.logger.warn('Using default values for development. Please set these variables in production.');
    }

    // Validate critical security configurations
    if (this.config.security.jwtSecret.length < 32) {
      this.logger.error('JWT_SECRET must be at least 32 characters long');
      throw new Error('Invalid JWT_SECRET configuration');
    }

    if (this.config.security.sessionSecret.length < 32) {
      this.logger.error('SESSION_SECRET must be at least 32 characters long');
      throw new Error('Invalid SESSION_SECRET configuration');
    }

    if (this.config.security.encryptionKey.length < 32) {
      this.logger.error('ENCRYPTION_KEY must be at least 32 characters long');
      throw new Error('Invalid ENCRYPTION_KEY configuration');
    }

    // Validate notification configurations
    if (this.config.app.environment === 'production') {
      if (!this.config.notifications.fcm.serverKey || !this.config.notifications.fcm.projectId) {
        this.logger.error('FCM configuration is required in production');
        throw new Error('Missing FCM configuration');
      }

      if (!this.config.notifications.apns.keyId || !this.config.notifications.apns.teamId || 
          !this.config.notifications.apns.bundleId || !this.config.notifications.apns.privateKey) {
        this.logger.error('APNS configuration is required in production');
        throw new Error('Missing APNS configuration');
      }
    }

    this.logger.log('Configuration validation completed');
  }

  private parseCommaSeparated(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  private generateSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getAppConfig(): AppConfig {
    return this.config.app;
  }

  public getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  public getRedisConfig(): RedisConfig {
    return this.config.redis;
  }

  public getWebSocketConfig(): WebSocketConfig {
    return this.config.websocket;
  }

  public getNotificationConfig(): NotificationConfig {
    return this.config.notifications;
  }

  public getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  public getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public isStaging(): boolean {
    return this.config.app.environment === 'staging';
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  public getDatabaseUrl(): string {
    const { host, port, database, username, password, ssl } = this.config.database;
    const sslMode = ssl ? '?sslmode=require' : '';
    return `postgresql://${username}:${password}@${host}:${port}/${database}${sslMode}`;
  }

  public getRedisUrl(): string {
    const { host, port, password, db } = this.config.redis;
    const auth = password ? `:${password}@` : '';
    return `redis://${auth}${host}:${port}/${db}`;
  }

  public updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration();
    this.logger.log('Configuration updated');
  }

  public exportConfig(): string {
    const exportConfig = { ...this.config };
    
    // Mask sensitive information
    if (exportConfig.database.password) {
      exportConfig.database.password = '***';
    }
    if (exportConfig.redis.password) {
      exportConfig.redis.password = '***';
    }
    if (exportConfig.notifications.fcm.serverKey) {
      exportConfig.notifications.fcm.serverKey = '***';
    }
    if (exportConfig.notifications.apns.privateKey) {
      exportConfig.notifications.apns.privateKey = '***';
    }
    if (exportConfig.security.jwtSecret) {
      exportConfig.security.jwtSecret = '***';
    }
    if (exportConfig.security.sessionSecret) {
      exportConfig.security.sessionSecret = '***';
    }
    if (exportConfig.security.encryptionKey) {
      exportConfig.security.encryptionKey = '***';
    }

    return JSON.stringify(exportConfig, null, 2);
  }
}

export default EnvironmentService;
