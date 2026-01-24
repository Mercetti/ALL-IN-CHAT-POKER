/**
 * Simple stub for StabilityWatchdog
 * Monitors system health and stability
 */

class StabilityWatchdog {
  constructor(config = {}) {
    this.config = config;
    this.isRunning = false;
    this.checkInterval = null;
    this.healthStatus = 'unknown';
  }

  async start() {
    // Only skip in test environment, keep running in production for Helm diagnostics
    if (process.env.NODE_ENV === 'test') {
      console.log('[WATCHDOG] Skipping stability watchdog in test mode');
      return true;
    }
    
    console.log('[WATCHDOG] Starting stability watchdog');
    this.isRunning = true;
    
    // Start health checks every 2 minutes instead of 30 seconds to reduce overhead
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 120000); // 2 minutes
    
    return true;
  }

  async stop() {
    console.log('[WATCHDOG] Stopping stability watchdog');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    return true;
  }

  async performHealthCheck() {
    try {
      // Basic health checks
      const memory = process.memoryUsage();
      const uptime = process.uptime();
      
      // Simple health logic
      if (memory.heapUsed > 500 * 1024 * 1024) { // 500MB
        this.healthStatus = 'warning';
      } else {
        this.healthStatus = 'healthy';
      }
      
      console.log(`[WATCHDOG] Health check: ${this.healthStatus} (memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB)`);
    } catch (error) {
      console.error('[WATCHDOG] Health check failed:', error.message);
      this.healthStatus = 'error';
    }
  }

  getHealthStatus() {
    return {
      status: this.healthStatus,
      isRunning: this.isRunning,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}

module.exports = { StabilityWatchdog };
