/**
 * AI Service Manager
 * Controls local AI services like Ollama and Cloudflare tunnels
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger('service-manager');

class AIServiceManager {
  constructor() {
    // Only initialize service management if running locally
    this.isLocal = process.env.NODE_ENV !== 'production' || 
                   process.env.FLY_APP_NAME === undefined ||
                   (process.env.FLY_APP_NAME && process.env.FLY_REGION === 'local');
    
    if (!this.isLocal) {
      logger.info('Service management disabled - running on Fly.io');
      return;
    }
    
    this.services = {
      ollama: {
        process: null,
        status: 'stopped',
        pid: null,
        port: 11434,
        lastCheck: null
      },
      tunnel: {
        process: null,
        status: 'stopped',
        pid: null,
        url: null,
        lastCheck: null
      }
    };
    
    // Start monitoring services
    this.startHealthMonitoring();
  }

  /**
   * Start Ollama service
   */
  async startOllama() {
    if (!this.isLocal) {
      return { success: false, message: 'Service management only available when running locally' };
    }
    
    if (this.services.ollama.status === 'running') {
      return { success: false, message: 'Ollama is already running' };
    }

    try {
      const ollama = spawn('ollama', ['serve'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      this.services.ollama.process = ollama;
      this.services.ollama.pid = ollama.pid;
      this.services.ollama.status = 'starting';
      this.services.ollama.lastCheck = Date.now();

      ollama.stdout.on('data', (data) => {
        logger.debug('Ollama stdout', { data: data.toString().trim() });
      });

      ollama.stderr.on('data', (data) => {
        logger.debug('Ollama stderr', { data: data.toString().trim() });
      });

      ollama.on('close', (code) => {
        logger.info('Ollama process exited', { code });
        this.services.ollama.status = 'stopped';
        this.services.ollama.process = null;
        this.services.ollama.pid = null;
      });

      ollama.on('error', (err) => {
        logger.error('Ollama process error', { error: err.message });
        this.services.ollama.status = 'error';
        this.services.ollama.process = null;
        this.services.ollama.pid = null;
      });

      // Wait a moment for startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if it's actually running
      const isRunning = await this.checkOllamaHealth();
      this.services.ollama.status = isRunning ? 'running' : 'error';

      return {
        success: isRunning,
        message: isRunning ? 'Ollama started successfully' : 'Failed to start Ollama',
        pid: ollama.pid
      };

    } catch (error) {
      logger.error('Failed to start Ollama', { error: error.message });
      this.services.ollama.status = 'error';
      return { success: false, message: error.message };
    }
  }

  /**
   * Stop Ollama service
   */
  async stopOllama() {
    if (!this.isLocal) {
      return { success: false, message: 'Service management only available when running locally' };
    }
    
    if (this.services.ollama.status !== 'running' && this.services.ollama.status !== 'starting') {
      return { success: false, message: 'Ollama is not running' };
    }

    try {
      if (this.services.ollama.process) {
        this.services.ollama.process.kill('SIGTERM');
        
        // Force kill if it doesn't stop gracefully
        setTimeout(() => {
          if (this.services.ollama.process) {
            this.services.ollama.process.kill('SIGKILL');
          }
        }, 5000);
      }

      this.services.ollama.status = 'stopping';
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.services.ollama.status = 'stopped';
      this.services.ollama.process = null;
      this.services.ollama.pid = null;

      return { success: true, message: 'Ollama stopped successfully' };

    } catch (error) {
      logger.error('Failed to stop Ollama', { error: error.message });
      return { success: false, message: error.message };
    }
  }

  /**
   * Start Cloudflare tunnel
   */
  async startTunnel() {
    if (!this.isLocal) {
      return { success: false, message: 'Service management only available when running locally' };
    }
    
    if (this.services.tunnel.status === 'running') {
      return { success: false, message: 'Tunnel is already running' };
    }

    try {
      const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:11434'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      this.services.tunnel.process = tunnel;
      this.services.tunnel.pid = tunnel.pid;
      this.services.tunnel.status = 'starting';
      this.services.tunnel.lastCheck = Date.now();

      let tunnelUrl = null;

      tunnel.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logger.debug('Tunnel stdout', { data: output });
        
        // Extract tunnel URL from output
        const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !tunnelUrl) {
          tunnelUrl = urlMatch[0];
          this.services.tunnel.url = tunnelUrl;
          logger.info('Tunnel URL detected', { url: tunnelUrl });
        }
      });

      tunnel.stderr.on('data', (data) => {
        logger.debug('Tunnel stderr', { data: data.toString().trim() });
      });

      tunnel.on('close', (code) => {
        logger.info('Tunnel process exited', { code });
        this.services.tunnel.status = 'stopped';
        this.services.tunnel.process = null;
        this.services.tunnel.pid = null;
        this.services.tunnel.url = null;
      });

      tunnel.on('error', (err) => {
        logger.error('Tunnel process error', { error: err.message });
        this.services.tunnel.status = 'error';
        this.services.tunnel.process = null;
        this.services.tunnel.pid = null;
        this.services.tunnel.url = null;
      });

      // Wait for tunnel to establish
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if we got a URL
      if (this.services.tunnel.url) {
        this.services.tunnel.status = 'running';
        return {
          success: true,
          message: 'Tunnel started successfully',
          url: this.services.tunnel.url,
          pid: tunnel.pid
        };
      } else {
        this.services.tunnel.status = 'error';
        return { success: false, message: 'Failed to establish tunnel' };
      }

    } catch (error) {
      logger.error('Failed to start tunnel', { error: error.message });
      this.services.tunnel.status = 'error';
      return { success: false, message: error.message };
    }
  }

  /**
   * Stop Cloudflare tunnel
   */
  async stopTunnel() {
    if (!this.isLocal) {
      return { success: false, message: 'Service management only available when running locally' };
    }
    
    if (this.services.tunnel.status !== 'running' && this.services.tunnel.status !== 'starting') {
      return { success: false, message: 'Tunnel is not running' };
    }

    try {
      if (this.services.tunnel.process) {
        this.services.tunnel.process.kill('SIGTERM');
        
        // Force kill if it doesn't stop gracefully
        setTimeout(() => {
          if (this.services.tunnel.process) {
            this.services.tunnel.process.kill('SIGKILL');
          }
        }, 5000);
      }

      this.services.tunnel.status = 'stopping';
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.services.tunnel.status = 'stopped';
      this.services.tunnel.process = null;
      this.services.tunnel.pid = null;
      this.services.tunnel.url = null;

      return { success: true, message: 'Tunnel stopped successfully' };

    } catch (error) {
      logger.error('Failed to stop tunnel', { error: error.message });
      return { success: false, message: error.message };
    }
  }

  /**
   * Get status of all services
   */
  async getServicesStatus() {
    if (!this.isLocal) {
      return {
        ollama: {
          status: 'unavailable',
          pid: null,
          port: 11434,
          lastCheck: null,
          message: 'Service management only available when running locally'
        },
        tunnel: {
          status: 'unavailable',
          pid: null,
          url: null,
          lastCheck: null,
          message: 'Service management only available when running locally'
        }
      };
    }
    
    // Update health status
    await this.checkOllamaHealth();
    await this.checkTunnelHealth();

    return {
      ollama: {
        status: this.services.ollama.status,
        pid: this.services.ollama.pid,
        port: this.services.ollama.port,
        lastCheck: this.services.ollama.lastCheck
      },
      tunnel: {
        status: this.services.tunnel.status,
        pid: this.services.tunnel.pid,
        url: this.services.tunnel.url,
        lastCheck: this.services.tunnel.lastCheck
      }
    };
  }

  /**
   * Check Ollama health
   */
  async checkOllamaHealth() {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        timeout: 2000
      });
      
      if (response.ok) {
        if (this.services.ollama.status === 'starting') {
          this.services.ollama.status = 'running';
        }
        return true;
      } else {
        if (this.services.ollama.status === 'running') {
          this.services.ollama.status = 'error';
        }
        return false;
      }
    } catch (error) {
      if (this.services.ollama.status === 'running') {
        this.services.ollama.status = 'error';
      }
      return false;
    } finally {
      this.services.ollama.lastCheck = Date.now();
    }
  }

  /**
   * Check tunnel health
   */
  async checkTunnelHealth() {
    if (!this.services.tunnel.url) {
      if (this.services.tunnel.status === 'running') {
        this.services.tunnel.status = 'error';
      }
      return false;
    }

    try {
      const response = await fetch(`${this.services.tunnel.url}/api/tags`, {
        timeout: 2000
      });
      
      if (response.ok) {
        if (this.services.tunnel.status === 'starting') {
          this.services.tunnel.status = 'running';
        }
        return true;
      } else {
        if (this.services.tunnel.status === 'running') {
          this.services.tunnel.status = 'error';
        }
        return false;
      }
    } catch (error) {
      if (this.services.tunnel.status === 'running') {
        this.services.tunnel.status = 'error';
      }
      return false;
    } finally {
      this.services.tunnel.lastCheck = Date.now();
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Skip intervals in test environment
    if (process.env.NODE_ENV !== 'test') {
      // Check services every 30 seconds
      setInterval(async () => {
        await this.checkOllamaHealth();
        await this.checkTunnelHealth();
      }, 30000);
    }
  }

  /**
   * Get Ollama models
   */
  async getOllamaModels() {
    if (!this.isLocal) {
      return [];
    }
    
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        return data.models || [];
      }
      return [];
    } catch (error) {
      logger.error('Failed to fetch Ollama models', { error: error.message });
      return [];
    }
  }
}

// Singleton instance
const serviceManager = new AIServiceManager();

module.exports = serviceManager;
