/**
 * Acey Memory Database Storage
 * Persistent storage for T2 user summary memory
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class AceyMemoryDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.init();
  }

  init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
      console.log('✅ Acey memory database initialized');
    } catch (error) {
      console.error('❌ Acey memory database initialization failed:', error.message);
      throw error;
    }
  }

  createTables() {
    // User memory table - T2 summary memory only
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_memory (
        user_id TEXT PRIMARY KEY,
        trust_score REAL NOT NULL DEFAULT 0.5,
        style TEXT DEFAULT 'unknown',
        risk_level TEXT DEFAULT 'medium',
        notes TEXT DEFAULT '[]',
        last_seen TEXT NOT NULL,
        session_count INTEGER DEFAULT 0,
        first_seen TEXT NOT NULL,
        behavior_patterns TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Session summary table - for T1 session summaries
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_summaries (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        duration INTEGER,
        tone TEXT,
        running_bits TEXT DEFAULT '[]',
        notable_events TEXT DEFAULT '[]',
        participant_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Memory write log - for audit trail
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_writes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        write_type TEXT NOT NULL,
        data TEXT NOT NULL,
        approved BOOLEAN NOT NULL DEFAULT 1,
        reason TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_memory_last_seen ON user_memory(last_seen);
      CREATE INDEX IF NOT EXISTS idx_user_memory_trust_score ON user_memory(trust_score);
      CREATE INDEX IF NOT EXISTS idx_session_summaries_user_id ON session_summaries(user_id);
      CREATE INDEX IF NOT EXISTS idx_memory_writes_user_id ON memory_writes(user_id);
    `);
  }

  /**
   * Get user memory record
   * @param {string} userId - User identifier
   * @returns {object|null} User memory record
   */
  getUserMemory(userId) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_memory WHERE user_id = ?
    `);

    const record = stmt.get(userId);
    
    if (!record) {
      return null;
    }

    // Parse JSON fields
    return {
      ...record,
      notes: JSON.parse(record.notes || '[]'),
      behavior_patterns: JSON.parse(record.behavior_patterns || '{}')
    };
  }

  /**
   * Create or update user memory
   * @param {string} userId - User identifier
   * @param {object} data - Memory data
   * @returns {object} Updated record
   */
  upsertUserMemory(userId, data) {
    const existing = this.getUserMemory(userId);
    const now = new Date().toISOString();
    
    const record = {
      user_id: userId,
      trust_score: data.trust_score || 0.5,
      style: data.style || 'unknown',
      risk_level: data.risk_level || 'medium',
      notes: JSON.stringify(data.notes || []),
      last_seen: now,
      session_count: (existing?.session_count || 0) + (data.session_count || 0),
      first_seen: existing?.first_seen || now,
      behavior_patterns: JSON.stringify(data.behavior_patterns || {}),
      updated_at: Math.floor(Date.now() / 1000)
    };

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_memory (
        user_id, trust_score, style, risk_level, notes, last_seen,
        session_count, first_seen, behavior_patterns, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.user_id,
      record.trust_score,
      record.style,
      record.risk_level,
      record.notes,
      record.last_seen,
      record.session_count,
      record.first_seen,
      record.behavior_patterns,
      record.updated_at
    );

    // Log the write
    this.logMemoryWrite(userId, 'user_memory', data, true, 'User memory update');

    return this.getUserMemory(userId);
  }

  /**
   * Add note to user memory
   * @param {string} userId - User identifier
   * @param {string} note - Note to add
   * @returns {object} Updated record
   */
  addUserNote(userId, note) {
    const memory = this.getUserMemory(userId) || {
      notes: [],
      behavior_patterns: {}
    };

    // Add new note
    const notes = [...memory.notes, note];
    
    // Keep only last 20 notes
    if (notes.length > 20) {
      notes.splice(0, notes.length - 20);
    }

    return this.upsertUserMemory(userId, { ...memory, notes });
  }

  /**
   * Update user trust score
   * @param {string} userId - User identifier
   * @param {number} trustScore - New trust score
   * @returns {object} Updated record
   */
  updateTrustScore(userId, trustScore) {
    const memory = this.getUserMemory(userId) || {};
    
    return this.upsertUserMemory(userId, {
      ...memory,
      trust_score: Math.max(0.0, Math.min(1.0, trustScore))
    });
  }

  /**
   * Update user style
   * @param {string} userId - User identifier
   * @param {string} style - User style
   * @returns {object} Updated record
   */
  updateUserStyle(userId, style) {
    const memory = this.getUserMemory(userId) || {};
    
    return this.upsertUserMemory(userId, {
      ...memory,
      style
    });
  }

  /**
   * Update user risk level
   * @param {string} userId - User identifier
   * @param {string} riskLevel - Risk level
   * @returns {object} Updated record
   */
  updateUserRiskLevel(userId, riskLevel) {
    const memory = this.getUserMemory(userId) || {};
    
    return this.upsertUserMemory(userId, {
      ...memory,
      risk_level: riskLevel
    });
  }

  /**
   * Store session summary
   * @param {string} sessionId - Session identifier
   * @param {object} summary - Session summary
   * @returns {object} Stored summary
   */
  storeSessionSummary(sessionId, summary) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO session_summaries (
        session_id, user_id, started_at, ended_at, duration, tone,
        running_bits, notable_events, participant_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sessionId,
      summary.user_id || 'system',
      summary.started_at || Math.floor(Date.now() / 1000),
      summary.ended_at || Math.floor(Date.now() / 1000),
      summary.duration || 0,
      summary.tone || 'neutral',
      JSON.stringify(summary.running_bits || []),
      JSON.stringify(summary.notable_events || []),
      summary.participant_count || 0
    );

    return this.getSessionSummary(sessionId);
  }

  /**
   * Get session summary
   * @param {string} sessionId - Session identifier
   * @returns {object|null} Session summary
   */
  getSessionSummary(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM session_summaries WHERE session_id = ?
    `);

    const record = stmt.get(sessionId);
    
    if (!record) {
      return null;
    }

    return {
      ...record,
      running_bits: JSON.parse(record.running_bits || '[]'),
      notable_events: JSON.parse(record.notable_events || '[]')
    };
  }

  /**
   * Get user session history
   * @param {string} userId - User identifier
   * @param {number} limit - Maximum sessions to return
   * @returns {Array} Session summaries
   */
  getUserSessionHistory(userId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM session_summaries 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `);

    const records = stmt.all(userId, limit);
    
    return records.map(record => ({
      ...record,
      running_bits: JSON.parse(record.running_bits || '[]'),
      notable_events: JSON.parse(record.notable_events || '[]')
    }));
  }

  /**
   * Apply trust decay to inactive users
   * @param {number} daysInactive - Days of inactivity to trigger decay
   * @param {number} decayAmount - Amount to decay trust score
   * @returns {number} Number of users updated
   */
  applyTrustDecay(daysInactive = 7, decayAmount = 0.01) {
    const cutoffTime = Math.floor((Date.now() - (daysInactive * 24 * 60 * 60 * 1000)) / 1000);
    
    const stmt = this.db.prepare(`
      UPDATE user_memory 
      SET trust_score = MAX(0.1, trust_score - ?),
          updated_at = ?
      WHERE last_seen < ? AND trust_score > 0.1
    `);

    const result = stmt.run(decayAmount, Math.floor(Date.now() / 1000), cutoffTime);
    
    if (result.changes > 0) {
      console.log(`🔄 Applied trust decay to ${result.changes} inactive users`);
    }
    
    return result.changes;
  }

  /**
   * Delete user data (GDPR compliance)
   * @param {string} userId - User identifier
   * @returns {boolean} Success status
   */
  deleteUserData(userId) {
    try {
      // Delete user memory
      const deleteMemoryStmt = this.db.prepare('DELETE FROM user_memory WHERE user_id = ?');
      deleteMemoryStmt.run(userId);

      // Delete session summaries (optional - keep for analytics)
      // const deleteSessionsStmt = this.db.prepare('DELETE FROM session_summaries WHERE user_id = ?');
      // deleteSessionsStmt.run(userId);

      // Log the deletion
      this.logMemoryWrite(userId, 'user_deletion', { deleted: true }, true, 'GDPR deletion request');

      console.log(`🗑️ Deleted user data for: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete user data:', error);
      return false;
    }
  }

  /**
   * Reset user trust score
   * @param {string} userId - User identifier
   * @returns {object} Updated record
   */
  resetUserTrust(userId) {
    return this.updateTrustScore(userId, 0.5);
  }

  /**
   * Clear user notes
   * @param {string} userId - User identifier
   * @returns {object} Updated record
   */
  clearUserNotes(userId) {
    const memory = this.getUserMemory(userId) || {};
    
    return this.upsertUserMemory(userId, {
      ...memory,
      notes: []
    });
  }

  /**
   * Get memory statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const totalUsers = this.db.prepare('SELECT COUNT(*) as count FROM user_memory').get();
    const avgTrust = this.db.prepare('SELECT AVG(trust_score) as avg FROM user_memory').get();
    const totalSessions = this.db.prepare('SELECT COUNT(*) as count FROM session_summaries').get();
    
    const trustDistribution = this.db.prepare(`
      SELECT 
        CASE 
          WHEN trust_score >= 0.8 THEN 'VIP'
          WHEN trust_score >= 0.6 THEN 'Trusted'
          WHEN trust_score >= 0.4 THEN 'Normal'
          WHEN trust_score >= 0.2 THEN 'Watched'
          ELSE 'Muted'
        END as level,
        COUNT(*) as count
      FROM user_memory
      GROUP BY level
    `).all();

    return {
      totalUsers: totalUsers.count,
      averageTrust: avgTrust.avg || 0,
      totalSessions: totalSessions.count,
      trustDistribution: trustDistribution.reduce((acc, row) => {
        acc[row.level] = row.count;
        return acc;
      }, {})
    };
  }

  /**
   * Log memory write for audit trail
   * @param {string} userId - User identifier
   * @param {string} writeType - Type of write
   * @param {object} data - Data being written
   * @param {boolean} approved - Whether write was approved
   * @param {string} reason - Reason for write
   */
  logMemoryWrite(userId, writeType, data, approved, reason) {
    const stmt = this.db.prepare(`
      INSERT INTO memory_writes (user_id, write_type, data, approved, reason)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      writeType,
      JSON.stringify(data),
      approved ? 1 : 0,
      reason
    );
  }

  /**
   * Cleanup old session summaries
   * @param {number} daysToKeep - Days to keep summaries
   * @returns {number} Number of records deleted
   */
  cleanupOldSessions(daysToKeep = 30) {
    const cutoffTime = Math.floor((Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)) / 1000);
    
    const stmt = this.db.prepare('DELETE FROM session_summaries WHERE started_at < ?');
    const result = stmt.run(cutoffTime);
    
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} old session summaries`);
    }
    
    return result.changes;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = AceyMemoryDB;
