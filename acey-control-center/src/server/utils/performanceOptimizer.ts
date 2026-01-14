// File: src/server/utils/performanceOptimizer.ts

/**
 * Performance Optimization System
 * Optimizes Acey's performance for production deployment
 */

export type PerformanceMetrics = {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  response: {
    avgTime: number;
    p95Time: number;
    p99Time: number;
    requestsPerSecond: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
  };
  database: {
    queryTime: number;
    connections: number;
    errors: number;
  };
};

export type OptimizationConfig = {
  enableCaching: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableCompression: boolean;
  compressionLevel: number;
  enableRateLimiting: boolean;
  rateLimit: number;
  enableMonitoring: boolean;
  monitoringInterval: number;
  enableAutoScaling: boolean;
  scalingThresholds: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
};

export type CacheEntry = {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
};

/**
 * Performance Optimizer
 */
export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private metrics: PerformanceMetrics;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private responseTimes: number[] = [];
  private requestCount: number = 0;
  private lastRequestReset: number = Date.now();

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableCaching: true,
      cacheSize: 1000,
      cacheTTL: 300000, // 5 minutes
      enableCompression: true,
      compressionLevel: 6,
      enableRateLimiting: true,
      rateLimit: 1000, // requests per minute
      enableMonitoring: true,
      monitoringInterval: 30000, // 30 seconds
      enableAutoScaling: false,
      scalingThresholds: {
        cpu: 0.8,
        memory: 0.85,
        responseTime: 5000
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: require('os').cpus().length
      },
      memory: {
        used: 0,
        total: require('os').totalmem(),
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      response: {
        avgTime: 0,
        p95Time: 0,
        p99Time: 0,
        requestsPerSecond: 0
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        size: 0,
        evictions: 0
      },
      database: {
        queryTime: 0,
        connections: 0,
        errors: 0
      }
    };
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    if (!this.config.enableMonitoring) return;

    this.monitoringTimer = setInterval(() => {
      this.updateMetrics();
      this.checkScalingTriggers();
      this.optimizeCache();
    }, this.config.monitoringInterval);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // CPU metrics
    const cpus = require('os').cpus();
    const loadAvg = require('os').loadavg();
    this.metrics.cpu = {
      usage: this.calculateCPUUsage(),
      loadAverage: loadAvg,
      cores: cpus.length
    };

    // Memory metrics
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      used: memUsage.rss,
      total: require('os').totalmem(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };

    // Response metrics
    this.updateResponseMetrics();

    // Cache metrics
    this.updateCacheMetrics();
  }

  /**
   * Calculate CPU usage
   */
  private calculateCPUUsage(): number {
    const cpus = require('os').cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu: any) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return Math.max(0, 1 - totalIdle / totalTick);
  }

  /**
   * Update response metrics
   */
  private updateResponseMetrics(): void {
    if (this.responseTimes.length === 0) return;

    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    
    // Filter recent response times
    const recentTimes = this.responseTimes.filter(time => now - time < timeWindow);
    
    if (recentTimes.length === 0) return;

    // Calculate metrics
    recentTimes.sort((a, b) => a - b);
    
    this.metrics.response.avgTime = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
    this.metrics.response.p95Time = recentTimes[Math.floor(recentTimes.length * 0.95)];
    this.metrics.response.p99Time = recentTimes[Math.floor(recentTimes.length * 0.99)];
    
    // Calculate requests per second
    const elapsedMinutes = (now - this.lastRequestReset) / 60000;
    this.metrics.response.requestsPerSecond = this.requestCount / (elapsedMinutes * 60);
    
    // Reset counters
    if (elapsedMinutes >= 1) {
      this.requestCount = 0;
      this.lastRequestReset = now;
      this.responseTimes = recentTimes;
    }
  }

  /**
   * Update cache metrics
   */
  private updateCacheMetrics(): void {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = totalHits + this.metrics.cache.evictions;
    
    this.metrics.cache = {
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.metrics.cache.evictions / totalRequests : 0,
      size: entries.length,
      evictions: this.metrics.cache.evictions
    };
  }

  /**
   * Check scaling triggers
   */
  private checkScalingTriggers(): void {
    if (!this.config.enableAutoScaling) return;

    const { cpu, memory, responseTime } = this.config.scalingThresholds;
    
    if (this.metrics.cpu.usage > cpu) {
      this.triggerScaling('cpu', this.metrics.cpu.usage);
    }
    
    if (this.metrics.memory.used / this.metrics.memory.total > memory) {
      this.triggerScaling('memory', this.metrics.memory.used / this.metrics.memory.total);
    }
    
    if (this.metrics.response.avgTime > responseTime) {
      this.triggerScaling('response_time', this.metrics.response.avgTime);
    }
  }

  /**
   * Trigger scaling action
   */
  private triggerScaling(trigger: string, value: number): void {
    console.log(`[PerformanceOptimizer] Scaling trigger: ${trigger} = ${value.toFixed(2)}`);
    
    // In a real implementation, this would trigger horizontal scaling
    // For now, just log and potentially optimize resources
    this.optimizeResources();
  }

  /**
   * Optimize resources
   */
  private optimizeResources(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear old cache entries
    this.optimizeCache();
    
    // Reduce non-essential operations
    this.reduceOperations();
  }

  /**
   * Optimize cache
   */
  private optimizeCache(): void {
    if (!this.config.enableCaching) return;
    
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.metrics.cache.evictions++;
      }
    }
    
    // Remove least recently used entries if cache is full
    if (this.cache.size > this.config.cacheSize) {
      const sortedEntries = entries
        .sort((a, b) => a[1].hits - b[1].hits)
        .slice(0, Math.floor(this.config.cacheSize * 0.1)); // Remove 10%
      
      for (const [key] of sortedEntries) {
        this.cache.delete(key);
        this.metrics.cache.evictions++;
      }
    }
  }

  /**
   * Reduce non-essential operations
   */
  private reduceOperations(): void {
    // In a real implementation, this would reduce background tasks
    // For now, just log the action
    console.log("[PerformanceOptimizer] Reducing non-essential operations");
  }

  /**
   * Get cached value
   */
  public get(key: string): any | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.cache.evictions++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.cache.evictions++;
      return null;
    }
    
    entry.hits++;
    return entry.value;
  }

  /**
   * Set cached value
   */
  public set(key: string, value: any, ttl?: number): void {
    if (!this.config.enableCaching) return;
    
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
      hits: 0,
      size: JSON.stringify(value).length
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Record response time
   */
  public recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    this.requestCount++;
    
    // Keep only recent response times
    if (this.responseTimes.length > 10000) {
      this.responseTimes = this.responseTimes.slice(-5000);
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get performance recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // CPU recommendations
    if (this.metrics.cpu.usage > 0.8) {
      recommendations.push("High CPU usage detected - consider scaling or optimizing algorithms");
    }
    
    // Memory recommendations
    const memoryUsage = this.metrics.memory.used / this.metrics.memory.total;
    if (memoryUsage > 0.85) {
      recommendations.push("High memory usage detected - consider adding more memory or optimizing memory usage");
    }
    
    // Response time recommendations
    if (this.metrics.response.avgTime > 3000) {
      recommendations.push("Slow response times detected - consider optimizing database queries or adding caching");
    }
    
    // Cache recommendations
    if (this.metrics.cache.hitRate < 0.7) {
      recommendations.push("Low cache hit rate - consider adjusting cache strategy or increasing cache size");
    }
    
    return recommendations;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.metrics.cache.evictions = 0;
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.clearCache();
    this.responseTimes = [];
    this.requestCount = 0;
  }
}

// LLM Rule Integration
export const PERFORMANCE_OPTIMIZATION_RULES = {
  MONITOR_CONTINUOUSLY: 'Monitor performance metrics continuously',
  OPTIMIZE_PROACTIVELY: 'Optimize resources proactively',
  CACHE_STRATEGICALLY: 'Cache frequently accessed data',
  SCALE_AUTOMATICALLY: 'Scale based on performance triggers',
  REDUCE_OVERHEAD: 'Minimize computational overhead'
};
