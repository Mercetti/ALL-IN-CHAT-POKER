/**
 * Production health check and monitoring endpoints
 * Provides comprehensive health status and metrics
 */

class HealthCheckManager {
  constructor(app, config, logger, performanceMonitor) {
    this.app = app;
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.startTime = Date.now();
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Basic health check
    this.app.get('/health', (req, res) => {
      const health = this.getBasicHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Detailed health check
    this.app.get('/health/detailed', (req, res) => {
      const health = this.getDetailedHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Readiness probe
    this.app.get('/ready', (req, res) => {
      const ready = this.checkReadiness();
      res.status(ready ? 200 : 503).json({ ready });
    });

    // Liveness probe
    this.app.get('/live', (req, res) => {
      const alive = this.checkLiveness();
      res.status(alive ? 200 : 503).json({ alive });
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = this.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    });

    // Version info
    this.app.get('/version', (req, res) => {
      res.json(this.getVersionInfo());
    });
  }

  getBasicHealth() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Basic health checks
    const checks = {
      memory: memUsage.heapUsed < memUsage.heapTotal * 0.9,
      uptime: uptime > 10, // At least 10 seconds
      database: this.checkDatabase(),
      services: this.checkServices()
    };
    
    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      checks,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      }
    };
  }

  getDetailedHealth() {
    const basic = this.getBasicHealth();
    const memUsage = process.memoryUsage();
    
    return {
      ...basic,
      version: this.getVersionInfo(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuUsage: process.cpuUsage(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers || 0
        }
      },
      database: this.getDatabaseInfo(),
      performance: this.performanceMonitor ? this.performanceMonitor.getReport() : null,
      connections: this.getConnectionInfo(),
      lastErrors: this.getRecentErrors()
    };
  }

  checkReadiness() {
    // Check if application is ready to serve traffic
    const checks = [
      this.checkDatabase(),
      this.checkServices(),
      process.uptime() > 5
    ];
    
    return checks.every(check => check);
  }

  checkLiveness() {
    // Check if application is still alive
    return process.uptime() > 0 && !this.isShuttingDown;
  }

  checkDatabase() {
    try {
      // Basic database connectivity check
      const db = require('./database');
      const result = db.db.prepare('SELECT 1').get();
      return result !== undefined;
    } catch (error) {
      this.logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }

  checkServices() {
    // Check external services
    const services = {
      redis: this.checkRedis(),
      twitch: this.checkTwitch()
    };
    
    return Object.values(services).some(service => service); // At least one service working
  }

  checkRedis() {
    try {
      if (!this.config.REDIS_URL) return true; // Redis is optional
      // Redis connectivity check would go here
      return true;
    } catch (error) {
      return false;
    }
  }

  checkTwitch() {
    try {
      if (!this.config.TWITCH_CLIENT_ID) return true; // Twitch is optional
      // Twitch API connectivity check would go here
      return true;
    } catch (error) {
      return false;
    }
  }

  getDatabaseInfo() {
    try {
      const db = require('./database');
      
      return {
        connected: true,
        path: this.config.DB_FILE,
        size: this.getDatabaseSize(),
        tables: this.getDatabaseTables(),
        lastBackup: this.getLastBackupTime()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  getDatabaseSize() {
    try {
      const fs = require('fs');
      const stats = fs.statSync(this.config.DB_FILE);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  getDatabaseTables() {
    try {
      const db = require('./database');
      const tables = db.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      return tables.map(table => table.name);
    } catch (error) {
      return [];
    }
  }

  getLastBackupTime() {
    try {
      const fs = require('fs');
      const backupDir = './backups';
      if (!fs.existsSync(backupDir)) return null;
      
      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.db'))
        .map(file => ({
          name: file,
          mtime: fs.statSync(`${backupDir}/${file}`).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      return files.length > 0 ? files[0].mtime : null;
    } catch (error) {
      return null;
    }
  }

  getConnectionInfo() {
    // Get connection information (would be implemented with actual connection tracking)
    return {
      active: 0,
      total: 0,
      websocket: 0,
      http: 0
    };
  }

  getRecentErrors() {
    // Get recent errors from logs (would be implemented with log aggregation)
    return [];
  }

  getMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const metrics = [
      `# HELP nodejs_memory_usage_bytes Memory usage in bytes`,
      `# TYPE nodejs_memory_usage_bytes gauge`,
      `nodejs_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `nodejs_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`,
      `nodejs_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`,
      `nodejs_memory_usage_bytes{type="external"} ${memUsage.external}`,
      '',
      `# HELP nodejs_uptime_seconds Process uptime in seconds`,
      `# TYPE nodejs_uptime_seconds counter`,
      `nodejs_uptime_seconds ${uptime}`,
      '',
      `# HELP nodejs_process_start_time_seconds Process start time in seconds`,
      `# TYPE nodejs_process_start_time_seconds gauge`,
      `nodejs_process_start_time_seconds ${Math.floor(Date.now() / 1000 - uptime)}`,
      '',
      `# HELP application_health Application health status`,
      `# TYPE application_health gauge`,
      `application_health ${this.checkLiveness() ? 1 : 0}`
    ];

    // Add performance metrics if available
    if (this.performanceMonitor) {
      const report = this.performanceMonitor.getReport();
      metrics.push('');
      metrics.push('# HELP application_requests_total Total number of requests');
      metrics.push('# TYPE application_requests_total counter');
      metrics.push(`application_requests_total ${report.requests?.total || 0}`);
      
      metrics.push('');
      metrics.push('# HELP application_response_time_seconds Average response time');
      metrics.push('# TYPE application_response_time_seconds gauge');
      metrics.push(`application_response_time_seconds ${(report.requests?.avgResponseTime || 0) / 1000}`);
    }

    return metrics.join('\n') + '\n';
  }

  getVersionInfo() {
    try {
      const packageJson = require('../package.json');
      return {
        version: packageJson.version,
        name: packageJson.name,
        description: packageJson.description,
        environment: this.config.NODE_ENV,
        buildDate: process.env.BUILD_DATE || new Date().toISOString(),
        gitCommit: process.env.GIT_COMMIT || 'unknown'
      };
    } catch (error) {
      return {
        version: '1.0.0',
        name: 'poker-game',
        environment: this.config.NODE_ENV
      };
    }
  }

  // Graceful shutdown
  shutdown() {
    this.isShuttingDown = true;
    this.logger.info('Health check manager shutting down');
  }
}

module.exports = HealthCheckManager;
