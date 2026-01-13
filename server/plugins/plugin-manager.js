/**
 * Plugin Manager
 * Manages loading, unloading, and coordination of plugins
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

class PluginManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      pluginsDir: options.pluginsDir || './plugins',
      enableHotReload: options.enableHotReload !== false,
      enableSandboxing: options.enableSandboxing !== false,
      enablePermissions: options.enablePermissions !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      maxPlugins: options.maxPlugins || 50,
      pluginTimeout: options.pluginTimeout || 30000,
      healthCheckInterval: options.healthCheckInterval || 60000
    };
    
    this.logger = new Logger('plugin-manager');
    
    this.plugins = new Map(); // pluginName -> pluginInstance
    this.pluginConfigs = new Map(); // pluginName -> config
    this.pluginStates = new Map(); // pluginName -> state
    this.pluginDependencies = new Map(); // pluginName -> dependencies
    this.pluginPermissions = new Map(); // pluginName -> permissions
    
    this.metrics = {
      totalPlugins: 0,
      activePlugins: 0,
      failedPlugins: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.initialize();
  }

  /**
   * Initialize the plugin manager
   */
  initialize() {
    this.logger.info('Initializing plugin manager');
    
    try {
      // Create plugins directory if it doesn't exist
      if (!fs.existsSync(this.options.pluginsDir)) {
        fs.mkdirSync(this.options.pluginsDir, { recursive: true });
      }
      
      // Set up hot reload if enabled
      if (this.options.enableHotReload) {
        this.setupHotReload();
      }
      
      // Set up health monitoring
      if (this.options.enableHealthCheck) {
        this.setupHealthMonitoring();
      }
      
      // Set up metrics collection
      if (this.options.enableMetrics) {
        this.setupMetrics();
      }
      
      this.logger.info('Plugin manager initialized', {
        pluginsDir: this.options.pluginsDir,
        hotReload: this.options.enableHotReload,
        sandboxing: this.options.enableSandboxing
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize plugin manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginName, config = {}) {
    try {
      if (this.plugins.has(pluginName)) {
        throw new Error(`Plugin ${pluginName} is already loaded`);
      }
      
      if (this.plugins.size >= this.options.maxPlugins) {
        throw new Error('Maximum number of plugins reached');
      }
      
      this.logger.info(`Loading plugin: ${pluginName}`);
      
      // Load plugin configuration
      const pluginConfig = await this.loadPluginConfig(pluginName, config);
      
      // Check dependencies
      await this.checkDependencies(pluginName, pluginConfig.dependencies || []);
      
      // Check permissions
      if (this.options.enablePermissions) {
        await this.checkPermissions(pluginName, pluginConfig.permissions || []);
      }
      
      // Load plugin module
      const PluginClass = await this.loadPluginModule(pluginName);
      
      // Create plugin instance
      const plugin = this.createPluginInstance(PluginClass, pluginConfig);
      
      // Initialize plugin
      await this.initializePlugin(plugin, pluginConfig);
      
      // Store plugin
      this.plugins.set(pluginName, plugin);
      this.pluginConfigs.set(pluginName, pluginConfig);
      this.pluginStates.set(pluginName, 'loaded');
      this.pluginDependencies.set(pluginName, pluginConfig.dependencies || []);
      this.pluginPermissions.set(pluginName, pluginConfig.permissions || []);
      
      this.metrics.totalPlugins++;
      this.metrics.activePlugins++;
      
      this.logger.info(`Plugin loaded successfully: ${pluginName}`);
      this.emit('pluginLoaded', { pluginName, plugin });
      
      return plugin;
      
    } catch (error) {
      this.metrics.failedPlugins++;
      this.metrics.errors.push({
        timestamp: Date.now(),
        pluginName,
        error: error.message,
        action: 'load'
      });
      
      this.logger.error(`Failed to load plugin: ${pluginName}`, { error: error.message });
      this.emit('pluginError', { pluginName, error, action: 'load' });
      throw error;
    }
  }

  /**
   * Load plugin configuration
   */
  async loadPluginConfig(pluginName, userConfig = {}) {
    const configPath = path.join(this.options.pluginsDir, pluginName, 'config.json');
    
    let defaultConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        defaultConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        this.logger.warn(`Failed to load plugin config: ${pluginName}`, { error: error.message });
      }
    }
    
    // Merge with user config
    return {
      ...defaultConfig,
      ...userConfig,
      name: pluginName,
      version: defaultConfig.version || '1.0.0',
      description: defaultConfig.description || '',
      author: defaultConfig.author || 'Unknown',
      dependencies: defaultConfig.dependencies || [],
      permissions: defaultConfig.permissions || [],
      enabled: userConfig.enabled !== false
    };
  }

  /**
   * Load plugin module
   */
  async loadPluginModule(pluginName) {
    const pluginPath = path.join(this.options.pluginsDir, pluginName);
    const entryPoint = path.join(pluginPath, 'index.js');
    
    if (!fs.existsSync(entryPoint)) {
      throw new Error(`Plugin entry point not found: ${entryPoint}`);
    }
    
    try {
      // Clear require cache for hot reload
      if (this.options.enableHotReload) {
        delete require.cache[require.resolve(entryPoint)];
      }
      
      const PluginClass = require(entryPoint);
      
      if (typeof PluginClass !== 'function') {
        throw new Error('Plugin must export a class');
      }
      
      return PluginClass;
      
    } catch (error) {
      throw new Error(`Failed to load plugin module: ${error.message}`);
    }
  }

  /**
   * Create plugin instance
   */
  createPluginInstance(PluginClass, config) {
    try {
      if (this.options.enableSandboxing) {
        return this.createSandboxedPlugin(PluginClass, config);
      } else {
        return new PluginClass(config);
      }
    } catch (error) {
      throw new Error(`Failed to create plugin instance: ${error.message}`);
    }
  }

  /**
   * Create sandboxed plugin instance
   */
  createSandboxedPlugin(PluginClass, config) {
    // Create a sandboxed environment
    const sandbox = {
      console: {
        log: (...args) => this.logger.info(`[${config.name}]`, ...args),
        warn: (...args) => this.logger.warn(`[${config.name}]`, ...args),
        error: (...args) => this.logger.error(`[${config.name}]`, ...args)
      },
      require: (moduleName) => {
        // Restrict require to safe modules only
        const safeModules = ['lodash', 'moment', 'uuid'];
        if (safeModules.includes(moduleName)) {
          return require(moduleName);
        }
        throw new Error(`Module ${moduleName} is not allowed in plugin sandbox`);
      },
      // Add other safe globals
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Date,
      Math,
      JSON,
      Buffer
    };
    
    // Create plugin in sandbox
    const vm = require('vm');
    const context = vm.createContext(sandbox);
    
    // Execute plugin code in sandbox
    const pluginCode = `
      (function(${Object.keys(sandbox).join(', ')}) {
        ${PluginClass.toString()}
        return PluginClass;
      })(${Object.keys(sandbox).join(', ')})
    `;
    
    const SandboxedPluginClass = vm.runInContext(pluginCode, context);
    
    return new SandboxedPluginClass(config);
  }

  /**
   * Initialize plugin
   */
  async initializePlugin(plugin, config) {
    if (typeof plugin.initialize === 'function') {
      await this.executeWithTimeout(
        plugin.initialize.bind(plugin),
        this.options.pluginTimeout,
        'Plugin initialization timeout'
      );
    }
    
    // Set up plugin event listeners
    if (typeof plugin.getEventListeners === 'function') {
      const listeners = plugin.getEventListeners();
      
      for (const [eventName, handler] of Object.entries(listeners)) {
        this.on(eventName, async (...args) => {
          await this.executePluginMethod(plugin, handler, ...args);
        });
      }
    }
    
    // Set up plugin API methods
    if (typeof plugin.getAPI === 'function') {
      const api = plugin.getAPI();
      
      for (const [methodName, method] of Object.entries(api)) {
        plugin[methodName] = async (...args) => {
          return this.executePluginMethod(plugin, method, ...args);
        };
      }
    }
  }

  /**
   * Execute plugin method with timeout and error handling
   */
  async executePluginMethod(plugin, method, ...args) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalRequests++;
      
      const result = await this.executeWithTimeout(
        () => method.apply(plugin, args),
        this.options.pluginTimeout,
        `Plugin method timeout: ${method.name || 'anonymous'}`
      );
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.metrics.errors.push({
        timestamp: Date.now(),
        plugin: plugin.name || 'unknown',
        method: method.name || 'anonymous',
        error: error.message,
        responseTime
      });
      
      this.logger.error('Plugin method execution failed', {
        plugin: plugin.name,
        method: method.name,
        error: error.message
      });
      
      this.emit('pluginError', { plugin: plugin.name, error, method: method.name });
      
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout, timeoutMessage) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeout);
      })
    ]);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginName) {
    try {
      const plugin = this.plugins.get(pluginName);
      
      if (!plugin) {
        throw new Error(`Plugin ${pluginName} is not loaded`);
      }
      
      this.logger.info(`Unloading plugin: ${pluginName}`);
      
      // Check if other plugins depend on this one
      const dependents = this.getPluginDependents(pluginName);
      if (dependents.length > 0) {
        throw new Error(`Cannot unload plugin ${pluginName}. Required by: ${dependents.join(', ')}`);
      }
      
      // Call plugin cleanup
      if (typeof plugin.cleanup === 'function') {
        await this.executeWithTimeout(
          plugin.cleanup.bind(plugin),
          this.options.pluginTimeout,
          'Plugin cleanup timeout'
        );
      }
      
      // Remove plugin
      this.plugins.delete(pluginName);
      this.pluginConfigs.delete(pluginName);
      this.pluginStates.set(pluginName, 'unloaded');
      this.pluginDependencies.delete(pluginName);
      this.pluginPermissions.delete(pluginName);
      
      this.metrics.activePlugins--;
      
      this.logger.info(`Plugin unloaded successfully: ${pluginName}`);
      this.emit('pluginUnloaded', { pluginName });
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to unload plugin: ${pluginName}`, { error: error.message });
      this.emit('pluginError', { pluginName, error, action: 'unload' });
      throw error;
    }
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginName, config = {}) {
    this.logger.info(`Reloading plugin: ${pluginName}`);
    
    await this.unloadPlugin(pluginName);
    await this.loadPlugin(pluginName, config);
    
    this.emit('pluginReloaded', { pluginName });
  }

  /**
   * Check plugin dependencies
   */
  async checkDependencies(pluginName, dependencies) {
    for (const dependency of dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new Error(`Plugin ${pluginName} requires dependency: ${dependency}`);
      }
      
      const dependencyState = this.pluginStates.get(dependency);
      if (dependencyState !== 'loaded' && dependencyState !== 'active') {
        throw new Error(`Dependency ${dependency} is not active`);
      }
    }
  }

  /**
   * Check plugin permissions
   */
  async checkPermissions(pluginName, permissions) {
    // This would implement permission checking logic
    // For now, we'll just log it
    if (permissions.length > 0) {
      this.logger.debug(`Plugin permissions checked: ${pluginName}`, { permissions });
    }
  }

  /**
   * Get plugins that depend on a given plugin
   */
  getPluginDependents(pluginName) {
    const dependents = [];
    
    for (const [name, dependencies] of this.pluginDependencies) {
      if (dependencies.includes(pluginName)) {
        dependents.push(name);
      }
    }
    
    return dependents;
  }

  /**
   * Get plugin
   */
  getPlugin(pluginName) {
    return this.plugins.get(pluginName);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    const plugins = {};
    
    for (const [name, plugin] of this.plugins) {
      plugins[name] = {
        name,
        state: this.pluginStates.get(name),
        config: this.pluginConfigs.get(name),
        dependencies: this.pluginDependencies.get(name),
        permissions: this.pluginPermissions.get(name),
        instance: plugin
      };
    }
    
    return plugins;
  }

  /**
   * Get plugin state
   */
  getPluginState(pluginName) {
    return this.pluginStates.get(pluginName);
  }

  /**
   * Set plugin state
   */
  setPluginState(pluginName, state) {
    this.pluginStates.set(pluginName, state);
    this.emit('pluginStateChanged', { pluginName, state });
  }

  /**
   * Enable/disable plugin
   */
  async setPluginEnabled(pluginName, enabled) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }
    
    if (enabled) {
      await this.startPlugin(pluginName);
    } else {
      await this.stopPlugin(pluginName);
    }
    
    const config = this.pluginConfigs.get(pluginName);
    config.enabled = enabled;
    
    this.emit('pluginEnabledChanged', { pluginName, enabled });
  }

  /**
   * Start plugin
   */
  async startPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }
    
    if (typeof plugin.start === 'function') {
      await this.executePluginMethod(plugin, plugin.start);
    }
    
    this.setPluginState(pluginName, 'active');
  }

  /**
   * Stop plugin
   */
  async stopPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }
    
    if (typeof plugin.stop === 'function') {
      await this.executePluginMethod(plugin, plugin.stop);
    }
    
    this.setPluginState(pluginName, 'stopped');
  }

  /**
   * Setup hot reload
   */
  setupHotReload() {
    const fs = require('fs');
    
    // Watch for changes in plugins directory
    fs.watch(this.options.pluginsDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        this.handleFileChange(filename);
      }
    });
  }

  /**
   * Handle file change for hot reload
   */
  async handleFileChange(filename) {
    try {
      // Extract plugin name from file path
      const pluginName = path.dirname(filename).split(path.sep).pop();
      
      if (this.plugins.has(pluginName)) {
        this.logger.info(`Plugin file changed, reloading: ${pluginName}`);
        await this.reloadPlugin(pluginName);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle file change', { filename, error: error.message });
    }
  }

  /**
   * Setup health monitoring
   */
  setupHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.options.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const healthChecks = {};
    
    for (const [pluginName, plugin] of this.plugins) {
      try {
        if (typeof plugin.healthCheck === 'function') {
          const health = await this.executePluginMethod(plugin, plugin.healthCheck);
          healthChecks[pluginName] = health;
        } else {
          healthChecks[pluginName] = {
            status: 'healthy',
            message: 'No health check implemented'
          };
        }
      } catch (error) {
        healthChecks[pluginName] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    this.emit('healthCheck', healthChecks);
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 60000); // Every minute
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    if (this.metrics.totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
        this.metrics.totalRequests;
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const errorRate = this.metrics.totalRequests > 0 
      ? (this.metrics.errors.length / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.metrics,
      uptime,
      errorRate: parseFloat(errorRate),
      pluginsCount: this.plugins.size,
      activePlugins: this.metrics.activePlugins,
      failedPlugins: this.metrics.failedPlugins
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    const checks = {};
    let overallStatus = 'healthy';
    
    // Check plugin manager
    checks.pluginManager = {
      status: 'healthy',
      message: 'Plugin manager is operational'
    };
    
    // Check plugins
    for (const [pluginName, plugin] of this.plugins) {
      try {
        if (typeof plugin.healthCheck === 'function') {
          const health = await this.executePluginMethod(plugin, plugin.healthCheck);
          checks[pluginName] = health;
          
          if (health.status !== 'healthy') {
            overallStatus = 'degraded';
          }
        } else {
          checks[pluginName] = {
            status: 'healthy',
            message: 'No health check implemented'
          };
        }
      } catch (error) {
        checks[pluginName] = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks,
      metrics: this.getMetrics()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalPlugins: this.plugins.size,
      activePlugins: this.metrics.activePlugins,
      failedPlugins: this.metrics.failedPlugins,
      totalRequests: 0,
      averageResponseTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.logger.info('Plugin manager metrics reset');
  }

  /**
   * Shutdown plugin manager
   */
  async shutdown() {
    this.logger.info('Shutting down plugin manager');
    
    try {
      // Stop all plugins
      for (const [pluginName] of this.plugins) {
        try {
          await this.unloadPlugin(pluginName);
        } catch (error) {
          this.logger.error(`Failed to unload plugin during shutdown: ${pluginName}`, { error: error.message });
        }
      }
      
      this.logger.info('Plugin manager shutdown complete');
      
    } catch (error) {
      this.logger.error('Failed to shutdown plugin manager', { error: error.message });
    }
  }
}

module.exports = PluginManager;
