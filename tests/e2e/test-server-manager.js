/**
 * E2E Test Server Manager
 * Manages the lifecycle of the test server for E2E tests
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

class TestServerManager {
  constructor() {
    this.serverProcess = null;
    this.isRunning = false;
    this.startupTimeout = 30000; // 30 seconds
    this.healthCheckInterval = 2000; // 2 seconds
    this.maxRetries = 15;
    this.serverPort = process.env.TEST_SERVER_PORT || 8080;
    this.serverHost = process.env.TEST_SERVER_HOST || '0.0.0.0'; // Use 0.0.0.0 for server binding
    this.serverUrl = `http://localhost:${this.serverPort}`; // Use localhost for health checks
  }

  /**
   * Check if server is responding
   */
  async isServerHealthy() {
    return new Promise((resolve) => {
      const req = http.get(`${this.serverUrl}/health`, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Wait for server to be healthy
   */
  async waitForServer() {
    console.log(`⏳ Waiting for server at ${this.serverUrl} to be healthy...`);
    
    for (let i = 0; i < this.maxRetries; i++) {
      const isHealthy = await this.isServerHealthy();
      if (isHealthy) {
        console.log(`✅ Server is healthy at ${this.serverUrl}`);
        return true;
      }
      
      console.log(`⏳ Server not ready yet (attempt ${i + 1}/${this.maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, this.healthCheckInterval));
    }
    
    throw new Error(`Server failed to become healthy after ${this.maxRetries} attempts`);
  }

  /**
   * Start the test server
   */
  async start() {
    if (this.isRunning) {
      console.log('🔄 Server is already running');
      return;
    }

    console.log(`🚀 Starting E2E test server at ${this.serverUrl}...`);

    // Check if server is already running
    const alreadyRunning = await this.isServerHealthy();
    if (alreadyRunning) {
      console.log(`✅ Server is already running at ${this.serverUrl}`);
      this.isRunning = true;
      return;
    }

    // Start server process
    const serverArgs = [
      'server.js'
    ];

    // Set environment variables for test mode
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      PORT: this.serverPort,
      HOST: this.serverHost,
      TEST_MODE: 'true',
      LOG_LEVEL: 'warn', // Reduce log noise during tests
      // Disable Jest-dependent features
      DISABLE_AI_MONITORING: 'true',
      DISABLE_PERFORMANCE_MONITORING: 'true'
    };

    this.serverProcess = spawn('node', serverArgs, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '../..')
    });

    // Handle server output
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[SERVER] ${output}`);
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`[SERVER ERROR] ${output}`);
      }
    });

    // Handle server process exit
    this.serverProcess.on('close', (code) => {
      console.log(`📋 Server process exited with code ${code}`);
      this.isRunning = false;
      this.serverProcess = null;
    });

    this.serverProcess.on('error', (error) => {
      console.error(`❌ Server process error:`, error);
      this.isRunning = false;
      this.serverProcess = null;
    });

    // Wait for server to be healthy
    try {
      await Promise.race([
        this.waitForServer(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server startup timeout')), this.startupTimeout)
        )
      ]);
      
      this.isRunning = true;
      console.log(`✅ E2E test server started successfully at ${this.serverUrl}`);
    } catch (error) {
      console.error(`❌ Failed to start E2E test server:`, error.message);
      await this.stop();
      throw error;
    }
  }

  /**
   * Stop the test server
   */
  async stop() {
    if (!this.serverProcess) {
      console.log('📋 No server process to stop');
      return;
    }

    console.log('🛑 Stopping E2E test server...');

    // Try graceful shutdown first
    if (this.serverProcess.pid) {
      try {
        // Send SIGTERM for graceful shutdown
        process.kill(this.serverProcess.pid, 'SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve();
          }, 5000);

          this.serverProcess.on('close', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      } catch (error) {
        console.warn('⚠️ Graceful shutdown failed, forcing kill:', error.message);
      }
    }

    // Force kill if still running
    if (this.serverProcess && !this.serverProcess.killed) {
      try {
        this.serverProcess.kill('SIGKILL');
      } catch (error) {
        console.warn('⚠️ Force kill failed:', error.message);
      }
    }

    this.serverProcess = null;
    this.isRunning = false;
    
    console.log('✅ E2E test server stopped');
  }

  /**
   * Restart the test server
   */
  async restart() {
    await this.stop();
    await this.start();
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      url: this.serverUrl,
      pid: this.serverProcess?.pid || null,
      port: this.serverPort,
      host: this.serverHost
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.stop();
  }
}

// Export singleton instance
const testServerManager = new TestServerManager();

module.exports = {
  TestServerManager,
  testServerManager
};
