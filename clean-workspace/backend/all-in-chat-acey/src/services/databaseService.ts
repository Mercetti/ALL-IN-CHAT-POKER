import { Pool, PoolConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { Logger } from '../utils/logger';
import { EnvironmentService } from '../config/environment';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  statementTimeout?: number;
  queryTimeout?: number;
  application_name?: string;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  maxConnections: number;
  averageQueryTime: number;
  totalQueries: number;
  failedQueries: number;
  connectionErrors: number;
}

export interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private pool!: Pool;
  private logger: Logger;
  private environmentService: EnvironmentService;
  private config: DatabaseConfig;
  private stats: ConnectionPoolStats;
  private queryTimes: number[] = [];
  private isInitialized = false;

  private constructor() {
    this.logger = new Logger();
    this.environmentService = EnvironmentService.getInstance();
    this.config = this.environmentService.getDatabaseConfig();
    this.stats = {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingClients: 0,
      maxConnections: this.config.maxConnections,
      averageQueryTime: 0,
      totalQueries: 0,
      failedQueries: 0,
      connectionErrors: 0,
    };
    
    this.initializePool();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async initializePool(): Promise<void> {
    try {
      const poolConfig: PoolConfig = {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: this.config.maxConnections,
        min: 2,
        idleTimeoutMillis: this.config.idleTimeout,
        connectionTimeoutMillis: this.config.connectionTimeout,
        statement_timeout: this.config.statementTimeout,
        query_timeout: this.config.queryTimeout,
        application_name: this.config.application_name,
      };

      this.pool = new Pool(poolConfig);

      // Pool event listeners
      this.pool.on('connect', (client: PoolClient) => {
        this.logger.debug('New database client connected');
        this.stats.totalConnections++;
        this.stats.activeConnections++;
      });

      this.pool.on('acquire', (client: PoolClient) => {
        this.logger.debug('Database client acquired');
        this.stats.activeConnections++;
        this.stats.idleConnections--;
      });

      this.pool.on('release', (_err: Error, client: PoolClient) => {
        this.logger.debug('Database client released');
        this.stats.activeConnections--;
        this.stats.idleConnections++;
      });

      this.pool.on('remove', (client: PoolClient) => {
        this.logger.debug('Database client removed');
        this.stats.totalConnections--;
        this.stats.activeConnections--;
      });

      this.pool.on('error', (error: Error) => {
        this.logger.error('Database pool error:', error);
        this.stats.connectionErrors++;
      });

      // Test connection
      await this.pool.query('SELECT NOW()');
      this.isInitialized = true;
      
      this.logger.log('Database connection pool initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database pool:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  public async query<T extends QueryResultRow>(
    text: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      throw new Error('Database pool not initialized');
    }

    const startTime = Date.now();
    let retries = 0;
    const maxRetries = options.retries || 3;

    while (retries <= maxRetries) {
      try {
        const client = await this.pool.connect();
        
        try {
          // Set query timeout if specified
          if (options.timeout) {
            await client.query(`SET statement_timeout = ${options.timeout}`);
          }

          const result = await client.query<T>(text, params);
          
          // Record query statistics
          const queryTime = Date.now() - startTime;
          this.recordQueryTime(queryTime);
          this.stats.totalQueries++;
          
          this.logger.debug(`Query executed successfully (${queryTime}ms): ${text.substring(0, 100)}...`);
          
          return result;
        } finally {
          client.release();
        }
      } catch (error) {
        retries++;
        this.logger.warn(`Query failed (attempt ${retries}/${maxRetries}):`, error);
        
        if (retries > maxRetries) {
          this.stats.failedQueries++;
          throw error;
        }
        
        // Wait before retrying
        await this.delay(100 * retries);
      }
    }

    throw new Error('Query failed after maximum retries');
  }

  public async transaction<T = any>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      this.logger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction failed, rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async batch<T = any>(
    queries: Array<{ text: string; params?: any[] }>
  ): Promise<QueryResult<any>[]> {
    if (!this.isInitialized) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results: QueryResult<any>[] = [];
      
      for (const query of queries) {
        const result = await client.query<any>(query.text, query.params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      
      this.logger.debug(`Batch transaction completed successfully (${queries.length} queries)`);
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Batch transaction failed, rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details: {
      connected: boolean;
      totalConnections: number;
      activeConnections: number;
      idleConnections: number;
      waitingClients: number;
      maxConnections: number;
      averageQueryTime: number;
      totalQueries: number;
      failedQueries: number;
      connectionErrors: number;
      uptime: number;
    };
  }> {
    try {
      const startTime = Date.now();
      await this.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      const status = this.determineHealthStatus(responseTime);
      
      return {
        status,
        details: {
          connected: this.isInitialized,
          totalConnections: this.stats.totalConnections,
          activeConnections: this.stats.activeConnections,
          idleConnections: this.stats.idleConnections,
          waitingClients: this.stats.waitingClients,
          maxConnections: this.stats.maxConnections,
          averageQueryTime: this.stats.averageQueryTime,
          totalQueries: this.stats.totalQueries,
          failedQueries: this.stats.failedQueries,
          connectionErrors: this.stats.connectionErrors,
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          totalConnections: this.stats.totalConnections,
          activeConnections: this.stats.activeConnections,
          idleConnections: this.stats.idleConnections,
          waitingClients: this.stats.waitingClients,
          maxConnections: this.stats.maxConnections,
          averageQueryTime: this.stats.averageQueryTime,
          totalQueries: this.stats.totalQueries,
          failedQueries: this.stats.failedQueries,
          connectionErrors: this.stats.connectionErrors,
          uptime: process.uptime(),
        },
      };
    }
  }

  public async getStats(): Promise<ConnectionPoolStats> {
    if (!this.isInitialized) {
      return this.stats;
    }

    try {
      const poolStats = this.pool.totalCount;
      const idleCount = this.pool.idleCount;
      const waitingCount = this.pool.waitingCount;
      
      this.stats.totalConnections = poolStats;
      this.stats.idleConnections = idleCount;
      this.stats.activeConnections = poolStats - idleCount;
      this.stats.waitingClients = waitingCount;
      
      return { ...this.stats };
    } catch (error) {
      this.logger.error('Failed to get pool stats:', error);
      return this.stats;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isInitialized = false;
      this.logger.log('Database connection pool closed');
    }
  }

  public async resetStats(): Promise<void> {
    this.stats = {
      totalConnections: this.stats.totalConnections,
      idleConnections: this.stats.idleConnections,
      activeConnections: this.stats.activeConnections,
      waitingClients: this.stats.waitingClients,
      maxConnections: this.stats.maxConnections,
      averageQueryTime: 0,
      totalQueries: 0,
      failedQueries: 0,
      connectionErrors: 0,
    };
    this.queryTimes = [];
  }

  private recordQueryTime(queryTime: number): void {
    this.queryTimes.push(queryTime);
    
    // Keep only last 100 query times for average calculation
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
    
    // Calculate average query time
    const sum = this.queryTimes.reduce((acc, time) => acc + time, 0);
    this.stats.averageQueryTime = sum / this.queryTimes.length;
  }

  private determineHealthStatus(responseTime: number): 'healthy' | 'unhealthy' | 'degraded' {
    const errorRate = this.stats.totalQueries > 0 
      ? this.stats.failedQueries / this.stats.totalQueries 
      : 0;
    
    const connectionUtilization = this.stats.totalConnections / this.stats.maxConnections;
    
    if (!this.isInitialized || errorRate > 0.1 || responseTime > 5000) {
      return 'unhealthy';
    }
    
    if (errorRate > 0.05 || responseTime > 1000 || connectionUtilization > 0.8) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getPool(): Pool {
    return this.pool;
  }
}

export default DatabaseService.getInstance();
