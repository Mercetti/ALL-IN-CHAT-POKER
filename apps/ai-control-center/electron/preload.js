/* eslint-env node */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aiBridge', {
  getTheme: () => ipcRenderer.invoke('theme:get'),
  notify: (payload) => ipcRenderer.invoke('notify', payload || {}),
  runtime: {
    status: () => ipcRenderer.invoke('runtime:status'),
    getLogs: () => ipcRenderer.invoke('runtime:getLogs'),
    start: () => ipcRenderer.invoke('runtime:start'),
    stop: () => ipcRenderer.invoke('runtime:stop'),
    onLog: (callback) => {
      const listener = (_event, log) => {
        if (typeof callback === 'function') {
          callback(log);
        }
      };
      ipcRenderer.on('runtime:log', listener);
      return () => ipcRenderer.removeListener('runtime:log', listener);
    }
  }
});
