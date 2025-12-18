const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApi', {
  startBot: () => ipcRenderer.invoke('bot-start'),
  stopBot: () => ipcRenderer.invoke('bot-stop'),
  getBotStatus: () => ipcRenderer.invoke('bot-status'),
  openChat: () => ipcRenderer.invoke('open-chat'),
  openCode: () => ipcRenderer.invoke('open-code'),
  runTests: () => ipcRenderer.invoke('run-tests'),
});

ipcRenderer.on('bot-status', (_event, status) => {
  window.dispatchEvent(new CustomEvent('bot-status', { detail: status }));
});
