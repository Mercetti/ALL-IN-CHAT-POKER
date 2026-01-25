/**
 * Database Module for Helm Control
 * Simplified version for deployment
 */

const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    
    try {
      this.db = new Database(path.join(__dirname, '../data/helm.db'), { 
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined 
      });
      this.createTables();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  createTables() {
    // Basic tables for Helm functionality
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE NOT NULL,
        display_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'active',
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        login TEXT NOT NULL,
        expires_at DATETIME,
        consumed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Basic methods
  getProfile(login) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('SELECT * FROM profiles WHERE login = ?');
    return stmt.get(login);
  }

  createProfile(login, displayName = null) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('INSERT INTO profiles (login, display_name) VALUES (?, ?)');
    return stmt.run(login, displayName);
  }

  getToken(token) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('SELECT * FROM tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP AND consumed = 0');
    return stmt.get(token);
  }

  createToken(login, expiresIn = 3600) {
    if (!this.db) this.initialize();
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    const stmt = this.db.prepare('INSERT INTO tokens (token, login, expires_at) VALUES (?, ?, ?)');
    stmt.run(token, login, expiresAt);
    
    return token;
  }

  logEvent(level, message) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('INSERT INTO system_logs (level, message) VALUES (?, ?)');
    stmt.run(level, message);
  }

  getRecentLogs(limit = 50) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  }

  // Admin user methods
  getAdminUser(login) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('SELECT * FROM admin_users WHERE login = ?');
    return stmt.get(login);
  }

  createAdminUser(userData) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('INSERT INTO admin_users (login, password_hash, email, status, role) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(userData.login, userData.password_hash, userData.email || null, userData.status || 'active', userData.role || 'admin');
  }

  updateAdminUser(login, updates) {
    if (!this.db) this.initialize();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(login);
    
    const stmt = this.db.prepare(`UPDATE admin_users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE login = ?`);
    return stmt.run(...values);
  }

  listAdminUsers() {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare('SELECT * FROM admin_users ORDER BY created_at DESC');
    return stmt.all();
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

module.exports = new DatabaseManager();
