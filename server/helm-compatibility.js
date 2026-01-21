/**
 * Helm Compatibility Layer
 * Provides backward compatibility during migration from Acey to Helm
 */

// Import Helm components
const { helmEngine, processHelmRequest, HelmEngine } = require('./helm/index');
const { helmPersonaLoader } = require('./personas/helmPersonaLoader');

// Export compatibility aliases
module.exports = {
  // Engine compatibility
  AceyEngine: HelmEngine,
  aceyEngine: helmEngine,
  processAceyRequest: processHelmRequest,
  
  // Persona compatibility
  aceyPersonaLoader: helmPersonaLoader,
  
  // Direct Helm exports (for new code)
  helmEngine,
  processHelmRequest,
  HelmEngine,
  helmPersonaLoader
};

// Also export as ES6 modules for TypeScript compatibility
exports.AceyEngine = HelmEngine;
exports.aceyEngine = helmEngine;
exports.processAceyRequest = processHelmRequest;
exports.aceyPersonaLoader = helmPersonaLoader;
exports.helmEngine = helmEngine;
exports.processHelmRequest = processHelmRequest;
exports.HelmEngine = HelmEngine;
exports.helmPersonaLoader = helmPersonaLoader;
