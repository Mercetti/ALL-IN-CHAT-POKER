/**
 * Helm Control Windows App - Preload Script
 * Secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to renderer process
contextBridge.exposeInMainWorld('helmAPI', {
  // Connection management
  connect: () => ipcRenderer.invoke('helm-connect'),
  getStatus: () => ipcRenderer.invoke('helm-get-status'),
  
  // Skill execution
  executeSkill: (skillId, params) => ipcRenderer.invoke('helm-execute-skill', skillId, params),
  
  // Audit and logging
  getAuditLog: () => ipcRenderer.invoke('helm-get-audit-log'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value),
  
  // Utilities
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// Event listeners for real-time updates
contextBridge.exposeInMainWorld('helmEvents', {
  onStatusChanged: (callback) => {
    ipcRenderer.on('helm-status-changed', (event, status) => callback(status));
  },
  
  onSkillExecuted: (callback) => {
    ipcRenderer.on('skill-executed', (event, result) => callback(result));
  },
  
  onNotification: (callback) => {
    ipcRenderer.on('notification', (event, notification) => callback(notification));
  },
  
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('helm-status-changed');
    ipcRenderer.removeAllListeners('skill-executed');
    ipcRenderer.removeAllListeners('notification');
  }
});

// Expose Node.js versions and platform info
contextBridge.exposeInMainWorld('nodeAPI', {
  versions: process.versions,
  platform: process.platform
});
