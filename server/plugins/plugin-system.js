/**
 * Plugin System
 * Main entry point for the plugin system
 */

const PluginManager = require('./plugin-manager');
const PluginAPI = require('./plugin-api');
const Logger = require('../utils/logger');

const logger = new Logger('plugin-system');

class PluginSystem {
  constructor(options = {}) {
    this.options = {
      pluginsDir: options.pluginsDir || './plugins',
      enableManager: options.enableManager !== false,
      enableAPI: options.enableAPI !== false,
      enableHotReload: options.enableHotReload !== false,
      enableSandboxing: options.enableSandboxing !== false,
      enablePermissions: options.enablePermissions !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      maxPlugins: options.maxPlugins || 50,
      gracefulShutdownTimeout: options.gracefulShutdownTimeout || 10000
    };
    
    this.pluginManager = null;
    this.pluginAPI = null;
    this.state = 'stopped';
    this.metrics = {
      startTime: null,
      totalPlugins: 0,
      activePlugins: 0,
      failedPlugins: 0,
      apiRequests: 0,
      averageResponseTime: 0,
      errors: []
    };
    
    this.initialize();
  }

  /**
   * Initialize the plugin system
   */
  initialize() {
    logger.info('Initializing plugin system');
    
    try {
      // Initialize plugin manager
      if (this.options.enableManager) {
        this.pluginManager = new PluginManager({
          pluginsDir: this.options.pluginsDir,
          enableHotReload: this.options.enableHotReload,
          enableSandboxing: this.options.enableSandboxing,
          enablePermissions: this.options.enablePermissions,
          enableMetrics: this.options.enableMetrics,
          enableHealthCheck: this.options.enableHealthCheck,
          maxPlugins: this.options.maxPlugins
        });
      }
      
      // Initialize plugin API
      if (this.options.enableAPI && this.pluginManager) {
        this.pluginAPI = new PluginAPI(this.pluginManager, {
          enableLogging: true,
          enableMetrics: this.options.enableMetrics,
          enableValidation: true,
          rateLimit: 100,
          timeout: 30000
        });
      }
      
      // Set up event handling
      this.setupEventHandling();
      
      // Set up health monitoring
      if (this.options.enableHealthCheck) {
        this.setupHealthMonitoring();
      }
      
      logger.info('Plugin system initialized', {
        manager: !!this.pluginManager,
        api: !!this.pluginAPI,
        pluginsDir: this.options.pluginsDir
      });
      
    } catch (error) {
      logger.error('Failed to initialize plugin system', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup event handling
   */
  setupEventHandling() {
    if (this.pluginManager) {
      // Forward plugin manager events
      this.pluginManager.on('pluginLoaded', ({ pluginName, plugin }) => {
        this.metrics.totalPlugins++;
        this.metrics.activePlugins++;
        this.emit('pluginLoaded', { pluginName, plugin });
      });
      
      this.pluginManager.on('pluginUnloaded', ({ pluginName }) => {
        this.metrics.activePlugins--;
        this.emit('pluginUnloaded', { pluginName });
      });
      
      this.pluginManager.on('pluginError', ({ pluginName, error, action }) => {
        this.metrics.failedPlugins++;
        this.metrics.errors.push({
          timestamp: Date.now(),
          pluginName,
          error: error.message,
          action
        });
        
        this.emit('pluginError', { pluginName, error, action });
      });
      
      this.pluginManager.on('metrics', (metrics) => {
        this.updateMetrics(metrics);
      });
      
      this.pluginManager.on('healthCheck', (healthChecks) => {
        this.emit('healthCheck', healthChecks);
      });
    }
    
    if (this.pluginAPI) {
      // Forward API events
      this.pluginAPI.on('error', (error) => {
        this.metrics.errors.push({
          timestamp: Date.now(),
          type: 'api',
          error: error.message
        });
        
        this.emit('apiError', error);
      });
    }
  }

  /**
   * Setup health monitoring
   */
  setupHealthMonitoring() {
    setInterval(async () => {
      const health = await this.getHealthStatus();
      this.emit('healthCheck', health);
    }, 60000); // Every minute
  }

  /**
   * Start the plugin system
   */
  async start() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    this.metrics.startTime = Date.now();
    
    try {
      logger.info('Starting plugin system');
      
      // Start plugin manager
      if (this.pluginManager) {
        await this.pluginManager.start();
      }
      
      this.state = 'running';
      this.emit('started');
      
      logger.info('Plugin system started successfully');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      logger.error('Failed to start plugin system', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the plugin system
   */
  async stop() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    try {
      logger.info('Stopping plugin system');
      
      // Stop plugin manager
      if (this.pluginManager) {
        await this.pluginManager.stop();
      }
      
      this.state = 'stopped';
      this.emit('stopped');
      
      logger.info('Plugin system stopped');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      logger.error('Failed to stop plugin system', { error: error.message });
      throw error;
    }
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginName, config = {}) {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not available');
    }
    
    return this.pluginManager.loadPlugin(pluginName, config);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginName) {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not available');
    }
    
    return this.pluginManager.unloadPlugin(pluginName);
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginName, config = {}) {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not available');
    }
    
    return this.pluginManager.reloadPlugin(pluginName, config);
  }

  /**
   * Get plugin
   */
  getPlugin(pluginName) {
    if (!this.pluginManager) {
      return null;
    }
    
    return this.pluginManager.getPlugin(pluginName);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    if (!this.pluginManager) {
      return {};
    }
    
    return this.pluginManager.getAllPlugins();
  }

  /**
   * Enable/disable plugin
   */
  async setPluginEnabled(pluginName, enabled) {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not available');
    }
    
    return this.pluginManager.setPluginEnabled(pluginName, enabled);
  }

  /**
   * Get plugin API for a specific plugin
   */
  getPluginAPI(pluginName) {
    if (!this.pluginAPI) {
      return null;
    }
    
    // Create a plugin-specific API wrapper
    const api = {};
    
    for (const [category, methods] of Object.entries(this.pluginAPI.setupAPI())) {
      api[category] = {};
      
      for (const [methodName, method] of Object.entries(methods)) {
        api[category][methodName] = async (...args) => {
          return this.pluginAPI.executeAPIMethod(pluginName, `${category}.${methodName}`, method, ...args);
        };
      }
    }
    
    return api;
  }

  /**
   * Execute plugin method with API access
   */
  async executePluginMethod(pluginName, methodName, ...args) {
    const plugin = this.getPlugin(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    // Create API for this plugin
    const api = this.getPluginAPI(pluginName);
    
    // Execute method with API context
    if (typeof plugin[methodName] === 'function') {
      return plugin[methodName].call(plugin, api, ...args);
    } else {
      throw new Error(`Method ${methodName} not found in plugin ${pluginName}`);
    }
  }

  /**
   * Discover plugins in directory
   */
  discoverPlugins() {
    if (!this.pluginManager) {
      return [];
    }
    
    const fs = require('fs');
    const path = require('path');
    
    const pluginsDir = this.options.pluginsDir;
    
    if (!fs.existsSync(pluginsDir)) {
      return [];
    }
    
    const items = fs.readdirSync(pluginsDir, { withFileTypes: true });
    const plugins = [];
    
    for (const item of items) {
      if (item.isDirectory()) {
        const pluginPath = path.join(pluginsDir, item.name);
        const configPath = path.join(pluginPath, 'config.json');
        const indexPath = path.join(pluginPath, 'index.js');
        
        if (fs.existsSync(indexPath)) {
          let config = {};
          
          if (fs.existsSync(configPath)) {
            try {
              config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (error) {
              logger.warn(`Failed to load plugin config: ${item.name}`, { error: error.message });
            }
          }
          
          plugins.push({
            name: item.name,
            path: pluginPath,
            config: {
              name: item.name,
              ...config
            },
            loaded: this.pluginManager.plugins.has(item.name)
          });
        }
      }
    }
    
    return plugins;
  }

  /**
   * Load all discovered plugins
   */
  async loadAllPlugins() {
    const plugins = this.discoverPlugins();
    const results = [];
    
    for (const plugin of plugins) {
      if (!plugin.loaded) {
        try {
          await this.loadPlugin(plugin.name, plugin.config);
          results.push({ name: plugin.name, status: 'loaded' });
        } catch (error) {
          results.push({ name: plugin.name, status: 'failed', error: error.message });
        }
      } else {
        results.push({ name: plugin.name, status: 'already_loaded' });
      }
    }
    
    return results;
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    const uptime = this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;
    
    const metrics = {
      ...this.metrics,
      uptime,
      state: this.state,
      components: {}
    };
    
    // Add plugin manager metrics
    if (this.pluginManager) {
      metrics.components.pluginManager = this.pluginManager.getMetrics();
    }
    
    // Add API metrics
    if (this.pluginAPI) {
      metrics.components.pluginAPI = this.pluginAPI.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Update metrics
   */
  updateMetrics(componentMetrics) {
    // Merge component metrics with system metrics
    if (componentMetrics.totalPlugins) {
      this.metrics.totalPlugins = componentMetrics.totalPlugins;
    }
    
    if (componentMetrics.activePlugins) {
      this.metrics.activePlugins = componentMetrics.activePlugins;
    }
    
    if (componentMetrics.averageResponseTime) {
      this.metrics.averageResponseTime = componentMetrics.averageResponseTime;
    }
    
    this.emit('metrics', this.getMetrics());
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    const checks = {};
    let overallStatus = 'healthy';
    
    // Check plugin manager
    if (this.pluginManager) {
      try {
        const managerHealth = await this.pluginManager.getHealthStatus();
        checks.pluginManager = managerHealth;
        
        if (managerHealth.status !== 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks.pluginManager = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    // Check plugin API
    if (this.pluginAPI) {
      try {
        const apiHealth = await this.pluginAPI.getHealthStatus();
        checks.pluginAPI = apiHealth;
        
        if (apiHealth.status !== 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks.pluginAPI = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      state: this.state,
      uptime: this.getMetrics().uptime,
      checks,
      metrics: this.getMetrics()
    };
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    const stats = {
      system: {
        state: this.state,
        uptime: this.getMetrics().uptime,
        totalPlugins: this.metrics.totalPlugins,
        activePlugins: this.metrics.activePlugins,
        failedPlugins: this.metrics.failedPlugins,
        apiRequests: this.metrics.apiRequests,
        averageResponseTime: this.metrics.averageResponseTime
      }
    };
    
    // Add component statistics
    if (this.pluginManager) {
      stats.pluginManager = this.pluginManager.getMetrics();
    }
    
    if (this.pluginAPI) {
      stats.pluginAPI = this.pluginAPI.getMetrics();
    }
    
    return stats;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      startTime: Date.now(),
      totalPlugins: this.metrics.totalPlugins,
      activePlugins: this.metrics.activePlugins,
      failedPlugins: 0,
      apiRequests: 0,
      averageResponseTime: 0,
      errors: []
    };
    
    if (this.pluginManager) {
      this.pluginManager.resetMetrics();
    }
    
    if (this.pluginAPI) {
      this.pluginAPI.resetMetrics();
    }
    
    logger.info('Plugin system metrics reset');
  }

  /**
   * Get configuration
   */
  getConfiguration() {
    return {
      ...this.options,
      components: {
        manager: !!this.pluginManager,
        api: !!this.pluginAPI
      },
      state: this.state
    };
  }

  /**
   * Create plugin system instance
   */
  static async create(options = {}) {
    const pluginSystem = new PluginSystem(options);
    await pluginSystem.start();
    return pluginSystem;
  }
}

module.exports = PluginSystem;
