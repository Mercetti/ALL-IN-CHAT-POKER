/**
 * Simple stub for ModeManager
 * Handles operating modes for the system
 */

class ModeManager {
  constructor() {
    this.currentMode = 'NORMAL';
    this.modes = ['OFF', 'SAFE', 'MINIMAL', 'CREATOR', 'FULL', 'OFFLINE'];
  }

  getCurrentMode() {
    return this.currentMode;
  }

  setMode(mode) {
    if (!this.modes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    
    console.log(`[MODE] Switching from ${this.currentMode} to ${mode}`);
    this.currentMode = mode;
    return true;
  }

  getAvailableModes() {
    return this.modes;
  }

  getModeInfo(mode) {
    const modeInfo = {
      OFF: { description: 'System completely off', features: [] },
      SAFE: { description: 'Emergency safe mode', features: ['monitoring', 'alerts'] },
      MINIMAL: { description: 'Minimal functionality', features: ['basic-ops'] },
      CREATOR: { description: 'Creator mode', features: ['creation-tools', 'basic-ops'] },
      FULL: { description: 'Full functionality', features: ['all'] },
      OFFLINE: { description: 'Offline mode', features: ['local-only'] }
    };
    
    return modeInfo[mode] || null;
  }
}

module.exports = { ModeManager };
