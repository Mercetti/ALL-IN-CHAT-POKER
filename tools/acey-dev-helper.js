#!/usr/bin/env node
/* eslint-env node */
/* global require, process, console */
/**
 * Local helper service that exposes a minimal HTTP API for starting
 * `npm run acey:dev`. Meant for use on the developer workstation only.
 *
 * Usage:
 *   ACEY_HELPER_TOKEN=secret npm run acey:helper
 *   (or) node tools/acey-dev-helper.js
 */
"use strict";
const express = require('express');
const { spawn } = require('child_process');
const os = require('os');

const PORT = Number(process.env.ACEY_HELPER_PORT || 7123);
const TOKEN = process.env.ACEY_HELPER_TOKEN || 'dev-only-token';

let proc = null;

function buildStatus() {
  return {
    running: !!proc,
    pid: proc?.pid || null,
    platform: os.platform(),
    startedAt: proc?._aceyStartedAt || null,
  };
}

function startProcess(res) {
  if (proc) {
    return res.json({ success: true, message: 'acey:dev already running', status: buildStatus() });
  }

  const child = spawn('npm', ['run', 'acey:dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  child._aceyStartedAt = new Date().toISOString();
  proc = child;

  child.on('exit', () => {
    proc = null;
  });

  return res.json({ success: true, message: 'acey:dev started', status: buildStatus() });
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && origin.startsWith('http://localhost:')) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Acey-Token');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  const headerToken = req.get('x-acey-token');
  if (!headerToken || headerToken !== TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
});

app.get('/acey-dev/status', (req, res) => {
  res.json({ success: true, status: buildStatus() });
});

app.post('/acey-dev/start', (req, res) => {
  startProcess(res);
});

app.listen(PORT, () => {
  console.log(`[AceyHelper] listening on http://127.0.0.1:${PORT}`);
});
