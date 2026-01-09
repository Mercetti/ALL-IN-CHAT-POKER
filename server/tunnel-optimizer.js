/**
 * Cloudflare Tunnel Optimizer
 * Handles tunnel-specific optimizations and health checks
 */

const fetch = global.fetch;
const config = require('./config');

class TunnelOptimizer {
  constructor() {
    this.isTunnel = config.OLLAMA_HOST?.includes('trycloudflare.com');
    this.tunnelHealth = 'unknown';
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 30000; // 30 seconds
    this.requestTimeout = this.isTunnel ? 3000 : 5000;
    this.retryAttempts = 2;
    this.retryDelay = 500;
  }

  /**
   * Optimized fetch for tunnel requests
   */
  async optimizedFetch(url, options = {}) {
    if (!this.isTunnel) {
      // Direct connection - use standard fetch
      return fetch(url, options);
    }

    // Tunnel connection - use optimized settings
    const optimizedOptions = {
      ...options,
      timeout: this.requestTimeout,
      signal: AbortSignal.timeout(this.requestTimeout),
      headers: {
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    };

    // Retry logic for tunnel
    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, optimizedOptions);
        if (response.ok) {
          this.tunnelHealth = 'healthy';
          return response;
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    this.tunnelHealth = 'degraded';
    throw lastError;
  }

  /**
   * Check tunnel health
   */
  async checkTunnelHealth() {
    if (!this.isTunnel) {
      this.tunnelHealth = 'not_tunnel';
      return true;
    }

    try {
      const response = await this.optimizedFetch(`${config.OLLAMA_HOST}/api/tags`, {
        method: 'GET'
      });
      
      this.tunnelHealth = response.ok ? 'healthy' : 'unhealthy';
      this.lastHealthCheck = Date.now();
      return response.ok;
    } catch (error) {
      this.tunnelHealth = 'unhealthy';
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  /**
   * Get tunnel status
   */
  getTunnelStatus() {
    return {
      isTunnel: this.isTunnel,
      health: this.tunnelHealth,
      lastCheck: this.lastHealthCheck,
      timeout: this.requestTimeout,
      retryAttempts: this.retryAttempts
    };
  }

  /**
   * Optimize AI request for tunnel
   */
  optimizeAIRequest(options = {}) {
    if (!this.isTunnel) {
      return options;
    }

    return {
      ...options,
      maxTokens: Math.min(options.maxTokens || 1000, 30), // Limit tokens for tunnel
      temperature: options.temperature || 0.7,
      stream: false, // Disable streaming for tunnel
      timeout: this.requestTimeout
    };
  }

  /**
   * Simple delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (!this.isTunnel) return;

    setInterval(async () => {
      await this.checkTunnelHealth();
    }, this.healthCheckInterval);
  }
}

module.exports = TunnelOptimizer;
