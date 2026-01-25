#!/usr/bin/env node

/**
 * Comprehensive Health Check Script
 * Checks all service endpoints and system health
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: 'unknown'
    };
  }

  async checkHttpEndpoint(url, name, timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, { timeout }, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          name,
          url,
          status: 'healthy',
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        });
      });

      req.on('error', (err) => {
        resolve({
          name,
          url,
          status: 'unhealthy',
          error: err.message,
          responseTime: `${Date.now() - startTime}ms`,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          name,
          url,
          status: 'timeout',
          error: 'Request timeout',
          responseTime: `${Date.now() - startTime}ms`,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async checkService(port, path = '/', name = null) {
    const serviceName = name || `Service-${port}`;
    const url = `http://localhost:${port}${path}`;
    return this.checkHttpEndpoint(url, serviceName);
  }

  async checkDatabase() {
    try {
      const db = require('./server/db');
      const startTime = Date.now();
      
      // Test database connection
      const result = db.getProfile('health-check-test') || null;
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Database',
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkWebSocket(port = 8081) {
    return new Promise((resolve) => {
      const WebSocket = require('ws');
      const startTime = Date.now();
      
      try {
        const ws = new WebSocket(`ws://localhost:${port}/helm-ws`);
        
        const timeout = setTimeout(() => {
          ws.terminate();
          resolve({
            name: 'WebSocket',
            status: 'timeout',
            error: 'Connection timeout',
            responseTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString()
          });
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            name: 'WebSocket',
            status: 'healthy',
            responseTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString()
          });
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          resolve({
            name: 'WebSocket',
            status: 'unhealthy',
            error: err.message,
            responseTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString()
          });
        });
      } catch (error) {
        resolve({
          name: 'WebSocket',
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  async checkMobileApp() {
    try {
      // Check if mobile app can be built
      const startTime = Date.now();
      execSync('cd mobile && npm run test:ci', { stdio: 'pipe', timeout: 30000 });
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Mobile App',
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'Mobile App',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkSystemResources() {
    try {
      const os = require('os');
      const startTime = Date.now();
      
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      const memoryUsage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);
      
      const cpus = os.cpus();
      const loadAverage = os.loadavg();
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'System Resources',
        status: 'healthy',
        memoryUsage: `${memoryUsage}%`,
        cpuCount: cpus.length,
        loadAverage: loadAverage.map(load => load.toFixed(2)),
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'System Resources',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runAllChecks() {
    console.log('🔍 Starting comprehensive health checks...\n');

    // Check main services
    const services = [
      { port: 8080, path: '/health', name: 'Main Server' },
      { port: 3001, path: '/', name: 'AI Control Center' },
      { port: 5173, path: '/', name: 'Control Center UI' }
    ];

    const serviceChecks = services.map(service => 
      this.checkService(service.port, service.path, service.name)
    );

    // Check all components
    const allChecks = [
      ...serviceChecks,
      this.checkDatabase(),
      this.checkWebSocket(),
      this.checkSystemResources()
    ];

    // Execute all checks
    const results = await Promise.all(allChecks);
    
    // Store results
    results.forEach(result => {
      this.results.services[result.name] = result;
    });

    // Calculate overall status
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    const healthPercentage = (healthyCount / totalCount * 100).toFixed(1);

    if (healthPercentage >= 80) {
      this.results.overall = 'healthy';
    } else if (healthPercentage >= 50) {
      this.results.overall = 'degraded';
    } else {
      this.results.overall = 'unhealthy';
    }

    this.results.healthPercentage = healthPercentage;
    this.results.totalChecks = totalCount;
    this.results.healthyChecks = healthyCount;

    return this.results;
  }

  printResults() {
    console.log('📊 HEALTH CHECK RESULTS');
    console.log('========================\n');

    console.log(`Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`Health Score: ${this.results.healthPercentage}% (${this.results.healthyChecks}/${this.results.totalChecks})\n`);

    console.log('Service Details:');
    Object.entries(this.results.services).forEach(([name, result]) => {
      const status = result.status.toUpperCase();
      const statusIcon = result.status === 'healthy' ? '✅' : result.status === 'timeout' ? '⏰' : '❌';
      
      console.log(`${statusIcon} ${name}: ${status}`);
      if (result.responseTime) {
        console.log(`   Response Time: ${result.responseTime}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.memoryUsage) {
        console.log(`   Memory Usage: ${result.memoryUsage}`);
      }
      console.log('');
    });

    console.log(`Check completed at: ${this.results.timestamp}`);
  }

  async generateReport() {
    const reportData = {
      ...this.results,
      summary: {
        status: this.results.overall,
        healthScore: `${this.results.healthPercentage}%`,
        totalServices: this.results.totalChecks,
        healthyServices: this.results.healthyChecks,
        timestamp: this.results.timestamp
      }
    };

    // Save report to file
    const fs = require('fs');
    const reportPath = './health-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    return reportPath;
  }
}

// Main execution
async function main() {
  const checker = new HealthChecker();
  
  try {
    await checker.runAllChecks();
    checker.printResults();
    await checker.generateReport();
    
    // Exit with appropriate code
    process.exit(checker.results.overall === 'healthy' ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = HealthChecker;
