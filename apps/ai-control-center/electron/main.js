/* eslint-env node */
const { app, BrowserWindow, ipcMain, nativeTheme, Notification, shell } = require('electron');
const { spawn } = require('child_process');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
let mainWindow;
let runtimeProcess = null;
const runtimeLogs = [];
const MAX_LOGS = 500;
const runtimeCwd = process.env.AI_RUNTIME_CWD
  || (app.isPackaged
    ? path.join(app.getPath('documents'), 'poker-game')
    : path.resolve(__dirname, '..', '..', '..'));

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#050c16',
    title: 'All-In AI Control Center',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const rendererPath = path.join(__dirname, '..', 'dist', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function ensureUserShortcuts() {
  if (!app.isPackaged) return;
  try {
    const desktopDir = app.getPath('desktop');
    const shortcutPath = path.join(desktopDir, 'AI Control Center.lnk');
    if (!fs.existsSync(shortcutPath)) {
      shell.writeShortcutLink(shortcutPath, 'create', {
        target: process.execPath,
        description: 'AI Control Center – unified cockpit for every AI system',
        icon: process.execPath,
        appUserModelId: 'com.allin.chatpoker.ai-control-center'
      });
    }

    const startMenuDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const startMenuShortcut = path.join(startMenuDir, 'AI Control Center.lnk');
    if (!fs.existsSync(startMenuShortcut)) {
      shell.writeShortcutLink(startMenuShortcut, 'create', {
        target: process.execPath,
        description: 'AI Control Center',
        icon: process.execPath,
        appUserModelId: 'com.allin.chatpoker.ai-control-center'
      });
    }
  } catch (err) {
    appendRuntimeLog(`Failed to ensure shortcuts: ${err.message}`, 'warn');
  }
}

app.whenReady().then(() => {
  ensureUserShortcuts();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('theme:get', () => ({
  shouldUseDarkColors: nativeTheme.shouldUseDarkColors
}));

ipcMain.handle('notify', (_event, payload) => {
  const notification = new Notification({
    title: payload?.title || 'AI Control Center',
    body: payload?.body || 'New event',
    silent: false
  });
  notification.show();
});

function appendRuntimeLog(message, level = 'info') {
  const entry = {
    id: randomUUID(),
    timestamp: Date.now(),
    level,
    message: typeof message === 'string' ? message : String(message)
  };
  runtimeLogs.push(entry);
  if (runtimeLogs.length > MAX_LOGS) {
    runtimeLogs.splice(0, runtimeLogs.length - MAX_LOGS);
  }
  if (mainWindow) {
    mainWindow.webContents.send('runtime:log', entry);
  }
  return entry;
}

function getRuntimeStatus() {
  return {
    running: Boolean(runtimeProcess),
    pid: runtimeProcess?.pid || null,
    lastLog: runtimeLogs[runtimeLogs.length - 1] || null
  };
}

ipcMain.handle('runtime:status', () => ({
  ...getRuntimeStatus(),
  logs: runtimeLogs.slice(-200)
}));

ipcMain.handle('runtime:getLogs', () => runtimeLogs.slice(-200));

ipcMain.handle('runtime:start', async () => {
  if (runtimeProcess) {
    appendRuntimeLog('Local AI runtime is already running.');
    return { ...getRuntimeStatus(), logs: runtimeLogs.slice(-200) };
  }

  const runtimeCmd = process.env.AI_RUNTIME_CMD || 'node';
  const runtimeArgs = process.env.AI_RUNTIME_ARGS
    ? process.env.AI_RUNTIME_ARGS.split(' ').filter(Boolean)
    : ['server.js'];

  const dbFile = process.env.DB_FILE || path.join(runtimeCwd, 'data', 'data.db');
  const dbDir = path.dirname(dbFile);

  try {
    if (!fs.existsSync(runtimeCwd)) {
      fs.mkdirSync(runtimeCwd, { recursive: true });
    }
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (err) {
    appendRuntimeLog(`Failed to prepare runtime directories: ${err.message}`, 'error');
    return { ...getRuntimeStatus(), logs: runtimeLogs.slice(-200) };
  }

  appendRuntimeLog(`Starting local AI runtime: ${runtimeCmd} ${runtimeArgs.join(' ')} (cwd=${runtimeCwd})`);

  runtimeProcess = spawn(runtimeCmd, runtimeArgs, {
    cwd: runtimeCwd,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      DB_FILE: dbFile,
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  runtimeProcess.stdout.on('data', (data) => {
    appendRuntimeLog(data.toString().trim(), 'stdout');
  });

  runtimeProcess.stderr.on('data', (data) => {
    appendRuntimeLog(data.toString().trim(), 'stderr');
  });

  runtimeProcess.on('error', (err) => {
    appendRuntimeLog(`Runtime error: ${err.message}`, 'error');
  });

  runtimeProcess.on('exit', (code, signal) => {
    appendRuntimeLog(`Runtime exited (code ${code ?? 'null'}, signal ${signal ?? 'null'})`, 'info');
    runtimeProcess = null;
  });

  return { ...getRuntimeStatus(), logs: runtimeLogs.slice(-200) };
});

ipcMain.handle('runtime:stop', () => {
  if (!runtimeProcess) {
    appendRuntimeLog('Local AI runtime is not running.');
    return { ...getRuntimeStatus(), logs: runtimeLogs.slice(-200) };
  }
  appendRuntimeLog('Stopping local AI runtime...');
  runtimeProcess.kill();
  runtimeProcess = null;
  return { ...getRuntimeStatus(), logs: runtimeLogs.slice(-200) };
});
