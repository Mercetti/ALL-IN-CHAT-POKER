import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { EnvironmentService } from '../config/environment';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  connectTimeout?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: 4 | 6;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: 'high' | 'normal' | 'low';
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: number;
  uptime: number;
}

export class CacheService {
  private static instance: CacheService;
  private client!: RedisClientType;
  private logger: Logger;
  private environmentService: EnvironmentService;
  private config: CacheConfig;
  private stats: CacheStats;
  private ready: boolean = false;

  private constructor() {
    this.logger = new Logger();
    this.environmentService = EnvironmentService.getInstance();
    this.config = this.environmentService.getRedisConfig();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      keys: 0,
      memory: 0,
      uptime: 0,
    };
    
    this.initializeClient();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async initializeClient(): Promise<void> {
    try {
      const redisConfig = {
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: this.config.connectTimeout || 10000,
          keepAlive: this.config.keepAlive || 30000,
        },
        password: this.config.password,
        database: this.config.db,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        lazyConnect: this.config.lazyConnect,
      };

      this.client = createClient(redisConfig);

      this.client.on('error', (error) => {
        this.logger.error('Redis client error:', error);
        this.ready = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
        this.ready = true;
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
        this.ready = true;
      });

      this.client.on('end', () => {
        this.logger.log('Redis client disconnected');
        this.ready = false;
      });

      this.client.on('reconnecting', () => {
        this.logger.log('Redis client reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
      
      this.logger.log('Redis cache service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error);
      this.ready = false;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.ready) {
      this.logger.warn('Redis not ready, cache miss');
      this.stats.misses++;
      return null;
    }

    try {
      const fullKey = this.buildKey(key);
      const value = await this.client.get(fullKey);
      
      if (value) {
        this.stats.hits++;
        const parsed = JSON.parse(value);
        this.logger.debug(`Cache hit: ${key}`);
        return parsed;
      } else {
        this.stats.misses++;
        this.logger.debug(`Cache miss: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.ready) {
      this.logger.warn('Redis not ready, cache set skipped');
      return false;
    }

    try {
      const fullKey = this.buildKey(key);
      const serialized = JSON.stringify(value);
      
      let result: boolean;
      if (options.ttl) {
        result = await this.client.setEx(fullKey, options.ttl, serialized) === 'OK';
      } else {
        result = await this.client.set(fullKey, serialized) === 'OK';
      }

      // Add tags if provided
      if (options.tags && options.tags.length > 0) {
        await this.addTagsToKey(fullKey, options.tags);
      }

      // Update stats
      this.stats.keys++;
      this.logger.debug(`Cache set: ${key} (TTL: ${options.ttl || 'default'})`);
      
      return result;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.ready) {
      this.logger.warn('Redis not ready, cache delete skipped');
      return false;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.del(fullKey);
      
      if (result > 0) {
        this.stats.keys = Math.max(0, this.stats.keys - 1);
        this.logger.debug(`Cache delete: ${key}`);
      }
      
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.ready) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.ready) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.expire(fullKey, ttl);
      this.logger.debug(`Cache expire: ${key} (TTL: ${ttl})`);
      return result;
    } catch (error) {
      this.logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    if (!this.isReady) {
      return -1;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.ttl(fullKey);
      return result;
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  public async increment(key: string, value: number = 1): Promise<number> {
    if (!this.ready) {
      return 0;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.incrBy(fullKey, value);
      this.logger.debug(`Cache increment: ${key} by ${value}`);
      return result;
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  public async decrement(key: string, value: number = 1): Promise<number> {
    if (!this.ready) {
      return 0;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.decrBy(fullKey, value);
      this.logger.debug(`Cache decrement: ${key} by ${value}`);
      return result;
    } catch (error) {
      this.logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  public async flush(): Promise<boolean> {
    if (!this.ready) {
      return false;
    }

    try {
      const result = await this.client.flushDb();
      this.stats.keys = 0;
      this.logger.log('Cache flushed');
      return result === 'OK';
    } catch (error) {
      this.logger.error('Cache flush error:', error);
      return false;
    }
  }

  public async getKeysByPattern(pattern: string): Promise<string[]> {
    if (!this.ready) {
      return [];
    }

    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.client.keys(fullPattern);
      return keys.map(key => this.removeKeyPrefix(key));
    } catch (error) {
      this.logger.error(`Cache keys pattern error for pattern ${pattern}:`, error);
      return [];
    }
  }

  public async getKeysByTag(tag: string): Promise<string[]> {
    if (!this.ready) {
      return [];
    }

    try {
      const tagKey = this.buildTagKey(tag);
      const keys = await this.client.sMembers(tagKey);
      return keys.map(key => this.removeKeyPrefix(key));
    } catch (error) {
      this.logger.error(`Cache tag error for tag ${tag}:`, error);
      return [];
    }
  }

  public async invalidateByTag(tag: string): Promise<boolean> {
    if (!this.ready) {
      return false;
    }

    try {
      const keys = await this.getKeysByTag(tag);
      let success = true;
      
      for (const key of keys) {
        const result = await this.del(key);
        if (!result) {
          success = false;
        }
      }
      
      // Remove tag set
      const tagKey = this.buildTagKey(tag);
      await this.client.del(tagKey);
      
      this.logger.log(`Cache invalidated ${keys.length} keys by tag: ${tag}`);
      return success;
    } catch (error) {
      this.logger.error(`Cache invalidate by tag error for tag ${tag}:`, error);
      return false;
    }
  }

  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private buildTagKey(tag: string): string {
    return `${this.config.keyPrefix}tag:${tag}`;
  }

  private removeKeyPrefix(key: string): string {
    return key.replace(this.config.keyPrefix, '');
  }

  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.buildTagKey(tag);
      await this.client.sAdd(tagKey, key);
    }
  }

  public async getStats(): Promise<CacheStats> {
    if (!this.ready) {
      return this.stats;
    }

    try {
      const info = await this.client.info('memory');
      const uptime = await this.client.info('server');
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      
      // Parse uptime
      const uptimeMatch = uptime.match(/uptime_in_seconds:(\d+)/);
      const uptimeSeconds = uptimeMatch ? parseInt(uptimeMatch[1]) : 0;
      
      // Update hit rate
      const total = this.stats.hits + this.stats.misses;
      const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
      
      this.stats.memory = memory;
      this.stats.uptime = uptimeSeconds;
      this.stats.hitRate = hitRate;
      
      return { ...this.stats };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return this.stats;
    }
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      memory: number;
      keys: number;
      hitRate: number;
      uptime: number;
    };
  }> {
    const stats = await this.getStats();
    
    return {
      status: this.ready ? 'healthy' : 'unhealthy',
      details: {
        connected: this.ready,
        memory: stats.memory,
        keys: stats.keys,
        hitRate: stats.hitRate,
        uptime: stats.uptime,
      },
    };
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.ready = false;
      this.logger.log('Redis client disconnected');
    }
  }

  public isReady(): boolean {
    return this.ready;
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}

export default CacheService.getInstance();
