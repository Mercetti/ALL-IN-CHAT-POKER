/// <reference types="node" />
/* eslint-env node */
/* eslint-disable no-undef */
/* global process, __dirname */
const { app, BrowserWindow, ipcMain, nativeTheme, Notification, shell } = require('electron');
const { spawn } = require('child_process');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
let mainWindow;
let runtimeProcess = null;
const runtimeLogs = [];
const MAX_LOGS = 500;
const runtimeCwd = process.env.AI_RUNTIME_CWD
  || (app.isPackaged
    ? path.join(app.getPath('documents'), 'poker-game')
    : path.resolve(__dirname, '..', '..', '..'));
const chatDataDir = path.join(app.getPath('userData'), 'acey-chat');
const chatHistoryFile = path.join(chatDataDir, 'history.json');
const chatAttachmentsDir = path.join(chatDataDir, 'attachments');
const CHAT_HISTORY_LIMIT = 500;
const CHAT_ATTACHMENT_LIMIT_BYTES = 25 * 1024 * 1024; // 25 MB

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#050c16',
    title: 'All-In AI Control Center',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: false,
    }
  });

  if (isDev) {
    const url = new URL(devServerUrl);
    url.searchParams.set('VITE_BACKEND_BASE', 'https://all-in-chat-poker.fly.dev');
    mainWindow.loadURL(url.toString());
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
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
    if (!fs.existsSync(shortcutPath)) {
      shell.writeShortcutLink(shortcutPath, 'create', {
        target: process.execPath,
        description: 'AI Control Center – unified cockpit for every AI system',
        icon: iconPath,
        appUserModelId: 'com.allin.chatpoker.ai-control-center'
      });
    }

    const startMenuDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const startMenuShortcut = path.join(startMenuDir, 'AI Control Center.lnk');
    if (!fs.existsSync(startMenuShortcut)) {
      shell.writeShortcutLink(startMenuShortcut, 'create', {
        target: process.execPath,
        description: 'AI Control Center',
        icon: iconPath,
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

function ensureChatStorageDirs() {
  if (!fs.existsSync(chatDataDir)) {
    fs.mkdirSync(chatDataDir, { recursive: true });
  }
  if (!fs.existsSync(chatAttachmentsDir)) {
    fs.mkdirSync(chatAttachmentsDir, { recursive: true });
  }
}

function readChatHistoryFromDisk() {
  try {
    ensureChatStorageDirs();
    if (!fs.existsSync(chatHistoryFile)) {
      return [];
    }
    const raw = fs.readFileSync(chatHistoryFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(-CHAT_HISTORY_LIMIT);
    }
    return [];
  } catch (err) {
    appendRuntimeLog(`Failed to read chat history: ${err.message}`, 'warn');
    return [];
  }
}

function writeChatHistoryToDisk(history = []) {
  try {
    ensureChatStorageDirs();
    const limited = Array.isArray(history) ? history.slice(-CHAT_HISTORY_LIMIT) : [];
    fs.writeFileSync(chatHistoryFile, JSON.stringify(limited, null, 2), 'utf8');
    return { success: true, count: limited.length };
  } catch (err) {
    appendRuntimeLog(`Failed to write chat history: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

async function saveChatAttachmentToDisk(payload = {}) {
  if (!payload?.data || !payload?.name) {
    throw new Error('Attachment payload missing required fields');
  }
  const buffer = Buffer.from(payload.data, 'base64');
  if (!buffer.length) {
    throw new Error('Attachment payload empty');
  }
  if (buffer.length > CHAT_ATTACHMENT_LIMIT_BYTES) {
    throw new Error('Attachment exceeds 25MB limit');
  }

  ensureChatStorageDirs();
  const id = randomUUID();
  const safeName = path.basename(payload.name);
  const ext = path.extname(safeName);
  const targetPath = path.join(chatAttachmentsDir, `${id}${ext || ''}`);
  await fs.promises.writeFile(targetPath, buffer);

  return {
    id,
    name: safeName,
    mimeType: payload.mimeType || 'application/octet-stream',
    size: buffer.length,
    localPath: targetPath,
    savedAt: Date.now(),
    previewUrl: pathToFileURL(targetPath).toString(),
    type: payload.mimeType?.startsWith('image/') ? 'image'
      : payload.mimeType?.startsWith('audio/') ? 'audio'
        : 'file',
  };
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
      VITE_BACKEND_BASE: 'https://all-in-chat-poker.fly.dev',
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

ipcMain.handle('chat-history:read', () => readChatHistoryFromDisk());

ipcMain.handle('chat-history:write', (_event, history) => writeChatHistoryToDisk(history));

ipcMain.handle('chat-attachments:save', async (_event, payload) => {
  try {
    const saved = await saveChatAttachmentToDisk(payload);
    return { success: true, attachment: saved };
  } catch (err) {
    appendRuntimeLog(`Failed to save chat attachment: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('chat-attachments:open', async (_event, targetPath) => {
  if (!targetPath || typeof targetPath !== 'string') {
    return { success: false, error: 'Target path required' };
  }
  try {
    await shell.openPath(targetPath);
    return { success: true };
  } catch (err) {
    appendRuntimeLog(`Failed to open attachment: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
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
