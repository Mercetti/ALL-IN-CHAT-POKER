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
      
      // Get previous deployment with JSON output for reliability
      let deployments;
      try {
        deployments = execSync('fly deployments list -a all-in-chat-poker --format json', { encoding: 'utf8' });
      } catch (cliError) {
        console.error('Failed to get deployments:', cliError.message);
        // Fallback to basic parsing
        deployments = execSync('fly deployments list -a all-in-chat-poker', { encoding: 'utf8' });
      }
      
      if (!deployments || typeof deployments !== 'string') {
        console.log('❌ No deployments found');
        return false;
      }
      
      // Parse JSON response
      let deploymentList;
      try {
        deploymentList = JSON.parse(deployments);
      } catch (parseError) {
        console.error('Failed to parse deployments JSON:', parseError.message);
        return false;
      }
      
      // Find the most recent successful deployment
      const successfulDeployments = deploymentList.filter(d => 
        d.status === 'successful' || d.status === 'deployed'
      );
      
      if (successfulDeployments.length === 0) {
        console.log('❌ No successful deployments found to rollback');
        return false;
      }
      
      // Sort by creation time and get the most recent
      successfulDeployments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const previousDeployment = successfulDeployments[0];
      
      if (!previousDeployment || !previousDeployment.id) {
        console.log('❌ Invalid deployment data');
        return false;
      }
      
      console.log(`📦 Rolling back to deployment: ${previousDeployment.id} (${previousDeployment.created_at})`);
      
      // Execute rollback with better error handling
      const rollbackResult = execSync(`fly deploy rollback -a all-in-chat-poker ${previousDeployment.id}`, { 
        stdio: 'inherit',
        timeout: 30000,
        encoding: 'utf8'
      });
      
      // Check rollback success
      if (rollbackResult.includes('successfully') || rollbackResult.includes('rolled back')) {
        console.log('✅ Rollback completed');
        return true;
      } else {
        console.error('❌ Rollback command output:', rollbackResult);
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
