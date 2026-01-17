/**
 * Production Monitoring and Alerting System
 * Provides uptime monitoring, performance tracking, and alerting
 */

const fs = require('fs');
const path = require('path');

class ProductionMonitor {
  constructor(config = {}) {
    this.config = {
      alertThresholds: {
        memoryUsage: 80, // percentage
        cpuUsage: 85,    // percentage
        responseTime: 2000, // milliseconds
        errorRate: 5       // percentage
      },
      checkInterval: 30000, // 30 seconds
      alertCooldown: 300000, // 5 minutes between same alert type
      logFile: config.logFile || '/data/monitoring.log',
      ...config
    };
    
    this.isRunning = false;
    this.monitorTimer = null;
    this.metrics = {
      uptime: process.uptime(),
      startTime: Date.now(),
      totalRequests: 0,
      errorCount: 0,
      responseTimes: [],
      memorySnapshots: [],
      lastAlerts: {}
    };
  }

  async initialize() {
    console.log('[MONITOR] Initializing production monitoring');
    
    // Ensure log directory exists
    await this.ensureLogDirectory();
    
    // Start monitoring
    this.startMonitoring();
    
    this.isRunning = true;
    console.log('[MONITOR] Production monitoring initialized');
    return true;
  }

  async ensureLogDirectory() {
    const logDir = path.dirname(this.config.logFile);
    try {
      await fs.promises.mkdir(logDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  startMonitoring() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
    
    this.monitorTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('[MONITOR] Health check failed:', error);
      }
    }, this.config.checkInterval);
    
    console.log(`[MONITOR] Monitoring started (interval: ${this.config.checkInterval / 1000} seconds)`);
  }

  stopMonitoring() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
      console.log('[MONITOR] Monitoring stopped');
    }
  }

  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate memory usage percentage
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Store metrics
    this.metrics.memorySnapshots.push({
      timestamp,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      usagePercent: memoryUsagePercent
    });
    
    // Keep only last 100 snapshots
    if (this.metrics.memorySnapshots.length > 100) {
      this.metrics.memorySnapshots = this.metrics.memorySnapshots.slice(-100);
    }
    
    // Check thresholds and send alerts
    await this.checkThresholds({
      memoryUsage: memoryUsagePercent,
      timestamp
    });
    
    // Log health status
    await this.logHealthStatus({
      timestamp,
      memoryUsage: memoryUsagePercent,
      uptime: process.uptime(),
      totalRequests: this.metrics.totalRequests,
      errorCount: this.metrics.errorCount
    });
  }

  async checkThresholds(metrics) {
    const { memoryUsage, timestamp } = metrics;
    
    // Memory usage alert
    if (memoryUsage > this.config.alertThresholds.memoryUsage) {
      await this.sendAlert('memory', {
        level: 'warning',
        message: `High memory usage: ${memoryUsage.toFixed(1)}%`,
        value: memoryUsage,
        threshold: this.config.alertThresholds.memoryUsage,
        timestamp
      });
    }
    
    // Response time alert (if we have response times)
    if (this.metrics.responseTimes.length > 0) {
      const avgResponseTime = this.metrics.responseTimes.slice(-10).reduce((a, b) => a + b, 0) / this.metrics.responseTimes.slice(-10).length;
      
      if (avgResponseTime > this.config.alertThresholds.responseTime) {
        await this.sendAlert('response_time', {
          level: 'warning',
          message: `High average response time: ${avgResponseTime.toFixed(0)}ms`,
          value: avgResponseTime,
          threshold: this.config.alertThresholds.responseTime,
          timestamp
        });
      }
    }
    
    // Error rate alert
    if (this.metrics.totalRequests > 0) {
      const errorRate = (this.metrics.errorCount / this.metrics.totalRequests) * 100;
      
      if (errorRate > this.config.alertThresholds.errorRate) {
        await this.sendAlert('error_rate', {
          level: 'critical',
          message: `High error rate: ${errorRate.toFixed(1)}%`,
          value: errorRate,
          threshold: this.config.alertThresholds.errorRate,
          timestamp
        });
      }
    }
  }

  async sendAlert(type, alertData) {
    const now = Date.now();
    const lastAlert = this.metrics.lastAlerts[type];
    
    // Check cooldown
    if (lastAlert && (now - lastAlert.timestamp) < this.config.alertCooldown) {
      return; // Still in cooldown period
    }
    
    // Store alert
    this.metrics.lastAlerts[type] = {
      timestamp: now,
      ...alertData
    };
    
    // Log alert
    await this.logAlert(type, alertData);
    
    // Send to external monitoring (if configured)
    if (this.config.webhookUrl) {
      await this.sendWebhookAlert(type, alertData);
    }
    
    console.error(`[MONITOR] ALERT [${type.toUpperCase()}]: ${alertData.message}`);
  }

  async logAlert(type, alertData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'alert',
      alertType: type,
      level: alertData.level,
      message: alertData.message,
      metadata: alertData
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.promises.appendFile(this.config.logFile, logLine);
  }

  async logHealthStatus(status) {
    const logEntry = {
      timestamp: status.timestamp,
      type: 'health',
      memoryUsage: status.memoryUsage,
      uptime: status.uptime,
      totalRequests: status.totalRequests,
      errorCount: status.errorCount
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.promises.appendFile(this.config.logFile, logLine);
  }

  async sendWebhookAlert(type, alertData) {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'all-in-chat-poker',
          environment: process.env.NODE_ENV || 'production',
          timestamp: new Date().toISOString(),
          alert: {
            type,
            ...alertData
          }
        })
      });
      
      if (!response.ok) {
        console.error('[MONITOR] Failed to send webhook alert:', response.statusText);
      }
    } catch (error) {
      console.error('[MONITOR] Webhook alert failed:', error.message);
    }
  }

  // Public methods for manual tracking
  trackRequest(responseTime) {
    this.metrics.totalRequests++;
    this.metrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  trackError() {
    this.metrics.errorCount++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      currentMemory: process.memoryUsage(),
      averageResponseTime: this.metrics.responseTimes.length > 0 
        ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
        : 0,
      errorRate: this.metrics.totalRequests > 0 
        ? (this.metrics.errorCount / this.metrics.totalRequests) * 100
        : 0
    };
  }

  async getMonitoringLog(lines = 100) {
    try {
      const data = await fs.promises.readFile(this.config.logFile, 'utf8');
      const logLines = data.trim().split('\n').filter(line => line.length > 0);
      return logLines > 0 ? logLines.slice(-lines) : logLines;
    } catch (error) {
      console.error('[MONITOR] Failed to read monitoring log:', error.message);
      return [];
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      metrics: this.getMetrics(),
      config: this.config
    };
  }

  async shutdown() {
    console.log('[MONITOR] Shutting down production monitoring');
    this.stopMonitoring();
    this.isRunning = false;
    
    // Final status log
    await this.logHealthStatus({
      timestamp: new Date().toISOString(),
      memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      uptime: process.uptime(),
      totalRequests: this.metrics.totalRequests,
      errorCount: this.metrics.errorCount
    });
  }
}

module.exports = { ProductionMonitor };
