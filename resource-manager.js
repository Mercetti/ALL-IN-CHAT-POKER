/**
 * Resource Manager - Controls AI and PC resource usage
 * Monitors CPU, memory, and AI system status
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ResourceManager {
  constructor() {
    this.isAIRunning = false;
    this.aiProcesses = [];
    this.systemMetrics = {
      cpu: 0,
      memory: 0,
      disk: 0
    };
    this.monitoringInterval = null;
  }

  /**
   * Start resource monitoring
   */
  startMonitoring() {
    console.log('📊 Starting resource monitoring...');
    
    // Start monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.checkSystemResources();
    }, 5000); // Check every 5 seconds
    
    console.log('✅ Resource monitoring started');
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Resource monitoring stopped');
    }
  }

  /**
   * Check system resources
   */
  checkSystemResources() {
    try {
      // Get CPU usage (Windows)
      const cpuUsage = this.getCPUUsage();
      
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      
      // Get disk usage
      const diskUsage = this.getDiskUsage();
      
      this.systemMetrics = {
        cpu: cpuUsage,
        memory: {
          used: memoryUsage.heapUsed / 1024 / 1024, // MB
          total: memoryUsage.heapTotal / 1024 / 1024, // MB
          external: memoryUsage.external / 1024 / 1024, // MB
          rss: memoryUsage.rss / 1024 / 1024 // MB
        },
        disk: diskUsage
      };
      
      // Log if resources are high
      this.checkResourceThresholds();
    } catch (error) {
      console.error('❌ Failed to check system resources:', error.message);
    }
  }

  /**
   * Get CPU usage (Windows)
   */
  getCPUUsage() {
    try {
      // Use Windows performance counters
      const { execSync } = require('child_process');
      
      // Get CPU usage via PowerShell
      const result = execSync('powershell "Get-Counter \\'\\Processor(_Total)\\% Processor Time\\\' -SampleInterval 1 | Select-Object -Property PercentProcessorTime | ForEach-Object { $_.PercentProcessorTime }"');
      
      if (result.stdout) {
        const cpuUsage = parseFloat(result.stdout.trim()) || 0;
        return Math.round(cpuUsage * 100) / 100; // Convert to percentage
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Failed to get CPU usage:', error.message);
      return 0;
    }
  }

  /**
   * Get disk usage
   */
  getDiskUsage() {
    try {
      const stats = fs.statSync(process.cwd());
      return {
        free: 'N/A', // Would need more complex calculation
        used: 'N/A'
      };
    } catch (error) {
      return {
        free: 'N/A',
        used: 'N/A'
      };
    }
  }

  /**
   * Check if resources exceed thresholds
   */
  checkResourceThresholds() {
    const { cpu, memory } = this.systemMetrics;
    
    // CPU threshold (80%)
    if (cpu > 80) {
      console.log(`⚠️ HIGH CPU USAGE: ${cpu}%`);
    }
    
    // Memory threshold (80%)
    const memoryUsagePercent = (memory.used / memory.total) * 100;
    if (memoryUsagePercent > 80) {
      console.log(`⚠️ HIGH MEMORY USAGE: ${memoryUsagePercent.toFixed(1)}%`);
    }
    
    // AI processes threshold (5)
    if (this.aiProcesses.length > 5) {
      console.log(`⚠️ TOO MANY AI PROCESSES: ${this.aiProcesses.length}`);
    }
  }

  /**
   * Turn off AI system
   */
  async turnOffAI() {
    console.log('🛑 Turning off AI system...');
    
    try {
      // Stop Ollama
      await this.stopOllama();
      
      // Stop any AI-related processes
      await this.stopAIProcesses();
      
      // Clear AI cache
      await this.clearAICache();
      
      this.isAIRunning = false;
      console.log('✅ AI system turned off');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to turn off AI:', error.message);
      return false;
    }
  }

  /**
   * Turn on AI system
   */
  async turnOnAI() {
    console.log('🤖 Turning on AI system...');
    
    try {
      // Start Ollama
      await this.startOllama();
      
      this.isAIRunning = true;
      console.log('✅ AI system turned on');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to turn on AI:', error.message);
      return false;
    }
  }

  /**
   * Stop Ollama
   */
  async stopOllama() {
    return new Promise((resolve) => {
      console.log('🛑 Stopping Ollama...');
      
      // Kill Ollama processes
      exec('taskkill /F /IM ollama.exe /T', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to kill Ollama:', error);
          resolve(false);
        } else {
          console.log('✅ Ollama stopped');
          resolve(true);
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Start Ollama
   */
  async startOllama() {
    return new Promise((resolve) => {
      console.log('🤖 Starting Ollama...');
      
      const ollama = spawn('ollama', ['serve'], {
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      ollama.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ollama.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      ollama.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Ollama started');
          resolve(true);
        } else {
          console.log('❌ Ollama failed to start');
          console.log('Output:', output);
          resolve(false);
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        ollama.kill();
        resolve(false);
      }, 10000);
    });
  }

  /**
   * Stop AI processes
   */
  async stopAIProcesses() {
    console.log('🛑 Stopping AI processes...');
    
    return new Promise((resolve) => {
      // Kill any remaining AI processes
      exec('taskkill /F /IM node.exe /FI "IMAGENAME eq node.exe" /T', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to stop AI processes:', error);
        } else {
          console.log('✅ AI processes stopped');
          resolve(true);
        }
      });
      
      setTimeout(resolve, 2000);
    });
  }

  /**
   * Clear AI cache
   */
  async clearAICache() {
    console.log('🗑️ Clearing AI cache...');
    
    try {
      // Clear any AI cache directories
      const cacheDirs = [
        path.join(__dirname, 'data', 'ai-cache'),
        path.join(__dirname, 'data', 'generated-audio'),
        path.join(__dirname, 'data', 'generated-cosmetics')
      ];
      
      for (const dir of cacheDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            fs.unlinkSync(filePath);
          }
          console.log(`🗑️ Cleared cache directory: ${dir}`);
        }
      }
      
      console.log('✅ AI cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear AI cache:', error.message);
      return false;
    }
  }

  /**
   * Optimize system for gaming
   */
  async optimizeForGaming() {
    console.log('🎮 Optimizing system for gaming...');
    
    try {
      // Set process priority to high
      if (process.platform === 'win32') {
        exec(`powershell "Get-Process -Id $PID | Set-ProcessPriority -Priority 64"`, (error, stdout, stderr) => {
          if (!error) {
            console.log('✅ Process priority set to high');
          }
        });
      }
      
      // Clear any unnecessary processes
      await this.clearUnnecessaryProcesses();
      
      // Optimize memory
      if (global.gc) {
        global.gc();
        console.log('🗑️ Garbage collection triggered');
      }
      
      console.log('✅ System optimized for gaming');
      return true;
    } catch (error) {
      console.error('❌ Failed to optimize system:', error.message);
      return false;
    }
  }

  /**
   * Clear unnecessary processes
   */
  async clearUnnecessaryProcesses() {
    const unnecessaryProcesses = [
      'chrome.exe',
      'firefox.exe',
      'msedge.exe',
      'discord.exe',
      'slack.exe',
      'spotify.exe'
    ];
    
    for (const process of unnecessaryProcesses) {
      exec(`taskkill /F /IM "${process}" /T`, (error, stdout, stderr) => {
        if (!error) {
          console.log(`🗑️ Terminated: ${process}`);
        }
      });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      aiRunning: this.isAIRunning,
      systemMetrics: this.systemMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate resource report
   */
  generateReport() {
    const status = this.getStatus();
    
    return {
      summary: {
        aiStatus: status.aiRunning ? '🟢 RUNNING' : '🔴 STOPPED',
        cpuUsage: `${status.systemMetrics.cpu}%`,
        memoryUsage: `${((status.systemMetrics.memory.used / status.systemMetrics.memory.total) * 100).toFixed(1)}%`,
        diskUsage: status.systemMetrics.disk.used === 'N/A' ? 'Unknown' : 'Normal'
      },
      recommendations: this.generateRecommendations(status),
      actions: this.getAvailableActions(status)
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(status) {
    const recommendations = [];
    
    if (!status.aiRunning) {
      recommendations.push({
        type: 'ai',
        priority: 'high',
        message: 'Turn on AI system for enhanced features',
        action: 'turnOnAI'
      });
    }
    
    if (status.systemMetrics.cpu > 70) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'High CPU usage detected',
        action: 'optimizeForGaming'
      });
    }
    
    if ((status.systemMetrics.memory.used / status.systemMetrics.memory.total) * 100) > 75) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'High memory usage detected',
        action: 'optimizeForGaming'
      });
    }
    
    return recommendations;
  }

  /**
   * Get available actions
   */
  getAvailableActions(status) {
    const actions = [];
    
    if (!status.aiRunning) {
      actions.push({
        name: 'Turn On AI',
        command: 'turnOnAI',
        description: 'Start AI system for enhanced features'
      });
    }
    
    if (status.aiRunning) {
      actions.push({
        name: 'Turn Off AI',
        command: 'turnOffAI',
        description: 'Stop AI to free up resources'
      });
    }
    
    actions.push({
      name: 'Optimize System',
      command: 'optimizeForGaming',
      description: 'Optimize PC for gaming performance'
    });
    
    actions.push({
      name: 'Clear Cache',
      command: 'clearAICache',
      description: 'Clear AI cache to free up space'
    });
    
    actions.push({
      name: 'Resource Report',
      command: 'generateReport',
      description: 'Generate detailed resource usage report'
    });
    
    return actions;
  }
}

module.exports = ResourceManager;
