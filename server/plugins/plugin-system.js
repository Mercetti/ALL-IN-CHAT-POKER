/**
 * Plugin System - Simplified Version
 * Basic plugin system functionality
 */

const logger = require('../utils/logger');

class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.isInitialized = false;
    this.stats = { plugins: 0, hooks: 0, executions: 0 };
  }

  /**
   * Initialize plugin system
   */
  async initialize() {
    logger.info('Plugin System initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Register plugin
   */
  registerPlugin(pluginName, plugin) {
    try {
      const pluginInfo = {
        name: pluginName,
        plugin: plugin,
        registeredAt: new Date(),
        isActive: true
      };

      this.plugins.set(pluginName, pluginInfo);
      this.stats.plugins++;

      logger.info('Plugin registered', { pluginName });

      return {
        success: true,
        plugin: pluginInfo
      };

    } catch (error) {
      logger.error('Failed to register plugin', { pluginName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unregister plugin
   */
  unregisterPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return { success: false, message: 'Plugin not found' };
    }

    try {
      this.plugins.delete(pluginName);
      this.stats.plugins--;

      logger.info('Plugin unregistered', { pluginName });

      return {
        success: true,
        message: 'Plugin unregistered successfully'
      };

    } catch (error) {
      logger.error('Failed to unregister plugin', { pluginName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register hook
   */
  registerHook(hookName, callback) {
    try {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      this.hooks.get(hookName).push({
        callback,
        registeredAt: new Date()
      });

      this.stats.hooks++;

      logger.debug('Hook registered', { hookName });

      return {
        success: true,
        hookName
      };

    } catch (error) {
      logger.error('Failed to register hook', { hookName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute hook
   */
  async executeHook(hookName, data = {}) {
    try {
      this.stats.executions++;

      const hooks = this.hooks.get(hookName) || [];
      const results = [];

      for (const hook of hooks) {
        try {
          const result = await hook.callback(data);
          results.push(result);
        } catch (error) {
          logger.error('Hook execution failed', { hookName, error: error.message });
          results.push({ error: error.message });
        }
      }

      return {
        success: true,
        results,
        hookName
      };

    } catch (error) {
      logger.error('Failed to execute hook', { hookName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
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
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin system status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      plugins: this.plugins.size,
      hooks: this.hooks.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enable/disable plugin
   */
  setPluginActive(pluginName, isActive) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return { success: false, message: 'Plugin not found' };
    }

    plugin.isActive = isActive;
    
    logger.info('Plugin status changed', { pluginName, isActive });

    return {
      success: true,
      pluginName,
      isActive
    };
  }
}

// Create singleton instance
const pluginSystem = new PluginSystem();

module.exports = pluginSystem;
