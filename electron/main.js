const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
let mainWindow = null;
let chatWindow = null;
let codeWindow = null;
let botProcess = null;
let testWindow = null;

function parseEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    const lines = text.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
    return env;
  } catch (e) {
    return {};
  }
}

function startBot() {
  if (botProcess && !botProcess.killed) return { running: true, pid: botProcess.pid };
  const envFile = path.join(__dirname, '..', '.env');
  const envVars = parseEnvFile(envFile);
  botProcess = spawn(process.execPath, ['bot/bot.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, ...envVars },
    stdio: 'inherit',
  });
  botProcess.on('exit', (code, signal) => {
    botProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('bot-status', { running: false, code, signal });
    }
  });
  return { running: true, pid: botProcess.pid };
}

function stopBot() {
  if (botProcess && !botProcess.killed) {
    botProcess.kill();
    botProcess = null;
  }
  return { running: false };
}

function getBotStatus() {
  return {
    running: !!botProcess && !botProcess.killed,
    pid: botProcess ? botProcess.pid : null,
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'control.html'), {
    query: { baseUrl: BASE_URL },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openPage(page, target) {
  const url = `${BASE_URL}${page}`;
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadURL(url);
  win.on('closed', () => {
    if (target === 'chat') chatWindow = null;
    if (target === 'code') codeWindow = null;
    if (target === 'tests') testWindow = null;
  });
  return win;
}

ipcMain.handle('bot-start', () => startBot());
ipcMain.handle('bot-stop', () => stopBot());
ipcMain.handle('bot-status', () => getBotStatus());
ipcMain.handle('open-chat', () => {
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.focus();
    return { ok: true };
  }
  chatWindow = openPage('/admin-chat.html', 'chat');
  return { ok: true };
});
ipcMain.handle('open-code', () => {
  if (codeWindow && !codeWindow.isDestroyed()) {
    codeWindow.focus();
    return { ok: true };
  }
  codeWindow = openPage('/admin-code.html', 'code');
  return { ok: true };
});

ipcMain.handle('run-tests', () => {
  if (testWindow && !testWindow.isDestroyed()) {
    testWindow.focus();
    return { ok: true };
  }
  testWindow = openPage('/admin-code.html', 'tests');
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBot();
});
