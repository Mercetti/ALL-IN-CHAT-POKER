/**
 * Main Express/Socket.IO server with game logic, auth, and Twitch integration
 */
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Import ConnectionHardener
const ConnectionHardener = require('./connection-hardener');
const connectionHardener = new ConnectionHardener();

// Mock dependencies for critical functions
const db = { db: null };
const aiErrorManager = null;

// Critical Functions for System Health
async function runSyntheticCheck() {
  try {
    console.log('Running synthetic health check...');
    
    // Test database connectivity
    const dbTest = db.db ? 'OK' : 'FAILED';
    
    // Test memory usage
    const memUsage = process.memoryUsage();
    const memStatus = memUsage.heapUsed < 500 * 1024 * 1024 ? 'OK' : 'HIGH';
    
    // Test AI systems
    const aiStatus = aiErrorManager ? 'OK' : 'FAILED';
    
    const results = {
      database: dbTest,
      memory: memStatus,
      ai: aiStatus,
      timestamp: new Date().toISOString()
    };
    
    console.log('Synthetic check completed', results);
    return results;
  } catch (error) {
    console.error('Synthetic check failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function runAssetCheck() {
  try {
    console.log('Running asset health check...');
    
    const publicDir = path.join(__dirname, 'public');
    const checks = {
      logoExists: fs.existsSync(path.join(publicDir, 'logo.png')),
      assetsDir: fs.existsSync(publicDir),
      cosmeticsDir: fs.existsSync(path.join(publicDir, 'assets', 'cosmetics'))
    };
    
    const results = {
      ...checks,
      status: Object.values(checks).every(Boolean) ? 'OK' : 'FAILED',
      timestamp: new Date().toISOString()
    };
    
    console.log('Asset check completed', results);
    return results;
  } catch (error) {
    console.error('Asset check failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function backupDb() {
  try {
    console.log('Starting database backup...');
    
    if (!db.db) {
      throw new Error('Database not available');
    }
    
    // Create backup timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, 'data', `backup-${timestamp}.db`);
    
    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Copy database file
    const dbPath = db.db.filename;
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      
      const stats = fs.statSync(backupPath);
      const results = {
        status: 'OK',
        backupPath,
        size: stats.size,
        timestamp: new Date().toISOString()
      };
      
      console.log('Database backup completed', results);
      return results;
    } else {
      throw new Error('Source database file not found');
    }
  } catch (error) {
    console.error('Database backup failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function vacuumDb() {
  try {
    console.log('Starting database vacuum...');
    
    if (!db.db) {
      throw new Error('Database not available');
    }
    
    // Run VACUUM command
    await new Promise((resolve, reject) => {
      db.db.run('VACUUM', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const results = {
      status: 'OK',
      timestamp: new Date().toISOString()
    };
    
    console.log('Database vacuum completed', results);
    return results;
  } catch (error) {
    console.error('Database vacuum failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

function getCriticalHashes() {
  try {
    const criticalFiles = [
      'server.js',
      'server/config.js',
      'server/auth.js',
      'server/db.js'
    ];
    
    const hashes = {};
    
    criticalFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        hashes[file] = crypto.createHash('sha256').update(content).digest('hex');
      } else {
        hashes[file] = 'MISSING';
      }
    });
    
    const results = {
      status: 'OK',
      hashes,
      timestamp: new Date().toISOString()
    };
    
    console.debug('Critical hashes generated', results);
    return results;
  } catch (error) {
    console.error('Failed to get critical hashes', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

// Export critical functions for health monitoring
module.exports = {
  runSyntheticCheck,
  runAssetCheck,
  backupDb,
  vacuumDb,
  getCriticalHashes,
  app,
  server,
  io
};

// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize connection hardener after server starts
  connectionHardener.initialize(app, server, io);
  connectionHardener.startMonitoring();
});
