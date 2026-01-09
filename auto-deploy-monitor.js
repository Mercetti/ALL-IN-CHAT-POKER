/**
 * Automated Deployment Monitor with Health Checks
 * Monitors production health and auto-reverts if issues detected
 */

const https = require('https');
const { execSync } = require('child_process');

class AutoDeployMonitor {
  constructor() {
    this.productionUrl = 'https://all-in-chat-poker.fly.dev';
    this.healthCheckInterval = 30000; // 30 seconds
    this.maxFailures = 3;
    this.failureCount = 0;
    this.isMonitoring = false;
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.get(`${this.productionUrl}/`, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date().toISOString()
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async rollbackDeployment() {
    try {
      console.log('🔄 Rolling back deployment...');
      
      // Get previous deployment
      const deployments = execSync('fly deployments list -a all-in-chat-poker', { encoding: 'utf8' });
      const lines = deployments.split('\n').filter(line => line.trim());
      
      if (lines.length > 2) {
        const previousDeployment = lines[1].split(' ')[0];
        console.log(`📦 Rolling back to deployment: ${previousDeployment}`);
        
        execSync(`fly deploy rollback -a all-in-chat-poker ${previousDeployment}`, { stdio: 'inherit' });
        console.log('✅ Rollback completed');
        return true;
      } else {
        console.log('❌ No previous deployment found');
        return false;
      }
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      return false;
    }
  }

  async startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log('👁️  Starting deployment monitoring...');
    console.log(`🌐 Monitoring: ${this.productionUrl}`);
    console.log(`⏱️  Check interval: ${this.healthCheckInterval/1000}s`);
    console.log(`🚨 Max failures before rollback: ${this.maxFailures}\n`);
    
    this.isMonitoring = true;
    this.failureCount = 0;
    
    const monitor = async () => {
      if (!this.isMonitoring) return;
      
      const health = await this.checkHealth();
      
      if (health.success) {
        this.failureCount = 0;
        console.log(`✅ Health check passed (${health.responseTime}ms) - ${new Date().toLocaleTimeString()}`);
      } else {
        this.failureCount++;
        console.log(`❌ Health check failed (${this.failureCount}/${this.maxFailures}) - ${health.error || health.statusCode}`);
        
        if (this.failureCount >= this.maxFailures) {
          console.log('🚨 Maximum failures reached - Initiating rollback...');
          const rollbackSuccess = await this.rollbackDeployment();
          
          if (rollbackSuccess) {
            this.failureCount = 0;
            console.log('🔄 Rollback successful - Monitoring continues...');
          } else {
            console.log('❌ Rollback failed - Manual intervention required');
            this.stopMonitoring();
          }
        }
      }
      
      setTimeout(monitor, this.healthCheckInterval);
    };
    
    // Start monitoring
    monitor();
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping deployment monitor...');
      this.stopMonitoring();
      process.exit(0);
    });
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('✅ Deployment monitoring stopped');
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new AutoDeployMonitor();
  monitor.startMonitoring();
}

module.exports = AutoDeployMonitor;
