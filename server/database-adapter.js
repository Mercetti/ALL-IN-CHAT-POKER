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
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('[DATABASE] PostgreSQL connected successfully');
    } catch (error) {
      console.error('[DATABASE] PostgreSQL connection failed:', error);
      throw error;
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
}

module.exports = DatabaseAdapter;
