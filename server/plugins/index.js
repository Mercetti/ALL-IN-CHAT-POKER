/**
 * Plugins Index
 * Central export point for all plugin system components
 */

const PluginManager = require('./plugin-manager');
const BasePlugin = require('./base-plugin');
const PluginAPI = require('./plugin-api');
const PluginSystem = require('./plugin-system');

module.exports = {
  PluginManager,
  BasePlugin,
  PluginAPI,
  PluginSystem
};
