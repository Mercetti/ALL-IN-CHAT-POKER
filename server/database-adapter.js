/**
 * Database Adapter - Supports both SQLite and PostgreSQL
 * Automatically detects which database to use based on environment
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

class DatabaseAdapter {
  constructor() {
    this.db = null;
    this.pool = null;
    this.type = null;
    this.isPostgres = !!process.env.DATABASE_URL;
    this.isSQLite = !this.isPostgres;
  }

  async initialize() {
    if (this.isPostgres) {
      await this.initializePostgres();
    } else {
      await this.initializeSQLite();
    }
  }

  async initializePostgres() {
    console.log('[DATABASE] Initializing PostgreSQL...');
    this.type = 'postgresql';
    
    if (!process.env.DATABASE_URL) {
      console.log('[DATABASE] DATABASE_URL not available, falling back to SQLite');
      await this.initializeSQLite();
      return;
    }
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection and create tables
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      
      // Create profiles table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id SERIAL PRIMARY KEY,
          login VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          password_hash VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          chips INTEGER DEFAULT 1000,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          settings TEXT,
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `);
      
      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_login ON profiles(login)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)');
      
      client.release();
      console.log('[DATABASE] PostgreSQL connected and tables created successfully');
    } catch (error) {
      console.error('[DATABASE] PostgreSQL connection failed, falling back to SQLite:', error.message);
      await this.initializeSQLite();
    }
  }

  async initializeSQLite() {
    console.log('[DATABASE] Initializing SQLite...');
    this.type = 'sqlite';
    
    const dbPath = process.env.DB_FILE || './data/data.db';
    const dbDir = path.dirname(dbPath);
    
    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('[DATABASE] SQLite connection failed:', err);
          reject(err);
        } else {
          console.log('[DATABASE] SQLite connected successfully');
          resolve();
        }
      });
    });
  }

  async query(sql, params = []) {
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return { 
          changes: result.rowCount || 0,
          lastID: result.rows[0]?.id || null
        };
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              changes: this.changes || 0,
              lastID: this.lastID || null
            });
          }
        });
      });
    }
  }

  async close() {
    if (this.isPostgres && this.pool) {
      await this.pool.end();
    } else if (this.isSQLite && this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  getDatabaseType() {
    return this.type;
  }

  getCatalog() {
    // Return the cosmetic catalog data
    const { COSMETIC_CATALOG } = require('./cosmetic-catalog');
    return COSMETIC_CATALOG;
  }

  getProfile(login) {
    if (!login) return null;
    const normalizedLogin = login.toLowerCase();
    
    if (this.isPostgres) {
      // For PostgreSQL, we'll use async query
      return this.query('SELECT * FROM profiles WHERE login = $1', [normalizedLogin])
        .then(result => result.rows[0] || null)
        .catch(err => {
          console.error('[DATABASE] Profile query error:', err);
          return null;
        });
    } else {
      // For SQLite
      if (!this.db) this.initialize();
      try {
        const stmt = this.db.prepare('SELECT * FROM profiles WHERE login = ?');
        return stmt.get(normalizedLogin) || null;
      } catch (err) {
        console.error('[DATABASE] Profile query error:', err);
        return null;
      }
    }
  }

  createLocalUser({ login, email, password_hash }) {
    const normalizedLogin = login.toLowerCase();
    
    if (this.isPostgres) {
      // For PostgreSQL
      return this.query(
        'INSERT INTO profiles (login, email, password_hash, role, chips, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [normalizedLogin, email, password_hash, 'user', 1000]
      )
      .then(result => result.rows[0])
      .catch(err => {
        console.error('[DATABASE] Create user error:', err);
        throw err;
      });
    } else {
      // For SQLite
      if (!this.db) this.initialize();
      try {
        const stmt = this.db.prepare(`
          INSERT INTO profiles (login, email, password_hash, role, chips, created_at) 
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `);
        return stmt.run(normalizedLogin, email, password_hash, 'user', 1000);
      } catch (err) {
        console.error('[DATABASE] Create user error:', err);
        throw err;
      }
    }
  }
}

module.exports = DatabaseAdapter;
