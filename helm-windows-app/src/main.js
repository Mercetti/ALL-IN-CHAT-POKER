/**
 * Helm Control Windows App - Main Electron Process
 * Professional AI Control Center
 */

const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const isDev = true; // Force development mode for npm run dev
const Store = require('electron-store');

// Initialize store for settings
const store = new Store();

// Keep a global reference of the window object
let mainWindow;
let helmConnection = null;

// Helm Engine connection
const helmAPI = {
  baseURL: 'http://localhost:3000',
  connected: false,
  
  async connect() {
    // Try multiple common ports - prioritize 3001 where Helm server is running
    const ports = [3001, 8080, 3000, 8000, 5000];
    
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/helm/status`);
        const status = await response.json();
        if (status.running) {
          this.baseURL = `http://localhost:${port}`;
          this.connected = true;
          console.log(`Connected to Helm on port ${port}`);
          return true;
        }
      } catch (error) {
        // Try next port
        continue;
      }
    }
    
    // Don't fail - just run in demo mode
    this.connected = false;
    console.log('Helm not found - running in demo mode');
    return true; // Return true so app doesn't exit
  },
  
  async executeSkill(skillId, params = {}) {
    try {
      const response = await fetch(`${this.baseURL}/helm/skill/${skillId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, sessionId: 'windows-app' })
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to execute skill: ${error.message}`);
    }
  },
  
  async getStatus() {
    try {
      const response = await fetch(`${this.baseURL}/helm/status`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  },
  
  async getAuditLog() {
    try {
      const response = await fetch(`${this.baseURL}/helm/audit`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get audit log: ${error.message}`);
    }
  }
};

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Load the app - use development server
  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  console.log('Development mode:', isDev);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('argv:', process.argv);
  console.log('Loading app from:', startUrl);
  
  mainWindow.loadURL(startUrl);

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    console.log('Attempting to load fallback...');
    // Try loading the index.html directly as fallback
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Connect to Helm',
          accelerator: 'CmdOrCtrl+H',
          click: async () => {
            try {
              await helmAPI.connect();
              mainWindow.webContents.send('helm-status-changed', helmAPI.connected);
              if (helmAPI.connected) {
                mainWindow.webContents.send('notification', { 
                  type: 'success', 
                  message: 'Connected to Helm Engine' 
                });
              } else {
                mainWindow.webContents.send('notification', { 
                  type: 'error', 
                  message: 'Failed to connect to Helm Engine' 
                });
              }
            } catch (error) {
              mainWindow.webContents.send('notification', { 
                type: 'error', 
                message: `Connection error: ${error.message}` 
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Control',
      submenu: [
        {
          label: 'Start All Services',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            try {
              const result = await helmAPI.executeSkill('system_start');
              mainWindow.webContents.send('skill-executed', result);
              mainWindow.webContents.send('notification', { 
                type: 'success', 
                message: 'All services started' 
              });
            } catch (error) {
              mainWindow.webContents.send('notification', { 
                type: 'error', 
                message: `Failed to start services: ${error.message}` 
              });
            }
          }
        },
        {
          label: 'Stop All Services',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Cancel', 'Stop All'],
              defaultId: 1,
              title: 'Stop All Services',
              message: 'Are you sure you want to stop all AI services?'
            });
            
            if (result.response === 1) {
              try {
                const skillResult = await helmAPI.executeSkill('system_stop');
                mainWindow.webContents.send('skill-executed', skillResult);
                mainWindow.webContents.send('notification', { 
                  type: 'warning', 
                  message: 'All services stopped' 
                });
              } catch (error) {
                mainWindow.webContents.send('notification', { 
                  type: 'error', 
                  message: `Failed to stop services: ${error.message}` 
                });
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Emergency Shutdown',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Cancel', 'Emergency Shutdown'],
              defaultId: 0,
              title: 'Emergency Shutdown',
              message: 'EMERGENCY: This will immediately stop all AI services and preserve critical data. Continue?'
            });
            
            if (result.response === 1) {
              try {
                const skillResult = await helmAPI.executeSkill('emergency_shutdown');
                mainWindow.webContents.send('skill-executed', skillResult);
                mainWindow.webContents.send('notification', { 
                  type: 'error', 
                  message: 'Emergency shutdown completed' 
                });
              } catch (error) {
                mainWindow.webContents.send('notification', { 
                  type: 'error', 
                  message: `Emergency shutdown failed: ${error.message}` 
                });
              }
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Helm Control',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Helm Control',
              message: 'Helm Control v1.0.0',
              detail: 'Professional AI Control Center\n\nHumans control AI, not the other way around.\n\n© 2026 Helm Control Team'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('helm-connect', async () => {
  return await helmAPI.connect();
});

ipcMain.handle('helm-get-status', async () => {
  return await helmAPI.getStatus();
});

ipcMain.handle('helm-execute-skill', async (event, skillId, params) => {
  return await helmAPI.executeSkill(skillId, params);
});

ipcMain.handle('helm-get-audit-log', async () => {
  return await helmAPI.getAuditLog();
});

ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('save-setting', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();
  
  // Try to connect to Helm on startup
  setTimeout(async () => {
    try {
      await helmAPI.connect();
      if (mainWindow) {
        mainWindow.webContents.send('helm-status-changed', helmAPI.connected);
      }
    } catch (error) {
      console.log('Helm not available on startup');
    }
  }, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationURL);
  });
});

// Auto-updater (for production)
if (!isDev) {
  const { autoUpdater } = require('electron-updater');
  
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version of Helm Control is available.',
      detail: 'The update will be downloaded in the background.'
    });
  });
  
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}
