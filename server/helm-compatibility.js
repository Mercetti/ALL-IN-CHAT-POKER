/**
 * Helm Engine - Direct Exports
 * Use these imports for new code
 */

// Import Helm components
const { helmEngine, processHelmRequest, HelmEngine } = require('./helm/index');
const { helmPersonaLoader } = require('./personas/helmPersonaLoader');

// Export direct Helm components
module.exports = {
  helmEngine,
  processHelmRequest,
  HelmEngine,
  helmPersonaLoader
};

// Also export as ES6 modules for TypeScript compatibility
exports.helmEngine = helmEngine;
exports.processHelmRequest = processHelmRequest;
exports.HelmEngine = HelmEngine;
exports.helmPersonaLoader = helmPersonaLoader;
