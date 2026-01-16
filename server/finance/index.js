/**
 * Finance Module Core
 * Handles revenue tracking, payouts, forecasts, and financial operations
 */

const db = require('../db');
const logger = require('../logger');

class FinanceModule {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize finance tables if they don't exist
      await this.ensureFinanceTables();
      this.initialized = true;
      logger.info('Finance module initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize finance module:', error);
      throw error;
    }
  }

  async ensureFinanceTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS partner_revenue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'USD',
        revenue_source TEXT NOT NULL,
        game_mode TEXT,
        feature_used TEXT,
        hour_of_day INTEGER,
        day_of_week INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS payouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        scheduled_for DATETIME,
        processed_at DATETIME,
        approved_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS revenue_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id TEXT,
        forecast_month TEXT NOT NULL,
        predicted_revenue_cents INTEGER,
        confidence_score REAL DEFAULT 0.5,
        model_version TEXT DEFAULT 'v1.0',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      db.db.prepare(table).run();
    }
  }

  // Revenue tracking
  async recordRevenue(partnerId, amountCents, source, metadata = {}) {
    try {
      const stmt = db.db.prepare(`
        INSERT INTO partner_revenue (
          partner_id, amount_cents, revenue_source, game_mode, 
          feature_used, hour_of_day, day_of_week
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const hour = new Date().getHours();
      const day = new Date().getDay();
      
      stmt.run(
        partnerId,
        amountCents,
        source,
        metadata.gameMode || null,
        metadata.featureUsed || null,
        hour,
        day
      );
      
      logger.info(`Revenue recorded: ${partnerId} - ${amountCents/100} USD from ${source}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to record revenue:', error);
      return { success: false, error: error.message };
    }
  }

  // Payout preparation
  async preparePayout(partnerId, amountCents, currency = 'USD') {
    try {
      const stmt = db.db.prepare(`
        INSERT INTO payouts (partner_id, amount_cents, currency, scheduled_for)
        VALUES (?, ?, ?, datetime('now', '+7 days'))
      `);
      
      const result = stmt.run(partnerId, amountCents, currency);
      
      logger.info(`Payout prepared: ${partnerId} - ${amountCents/100} ${currency}`);
      return { 
        success: true, 
        payoutId: result.lastInsertRowid,
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      logger.error('Failed to prepare payout:', error);
      return { success: false, error: error.message };
    }
  }

  // Approve payout (owner action)
  async approvePayout(payoutId, approvedBy) {
    try {
      const stmt = db.db.prepare(`
        UPDATE payouts 
        SET status = 'approved', processed_at = CURRENT_TIMESTAMP, approved_by = ?
        WHERE id = ? AND status = 'pending'
      `);
      
      const result = stmt.run(approvedBy, payoutId);
      
      if (result.changes === 0) {
        return { success: false, error: 'Payout not found or already processed' };
      }
      
      logger.info(`Payout approved: ${payoutId} by ${approvedBy}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to approve payout:', error);
      return { success: false, error: error.message };
    }
  }

  // Revenue forecasting
  async generateForecast(partnerId, month) {
    try {
      // Get historical data for the same month in previous years
      const historicalData = db.db.prepare(`
        SELECT 
          SUM(amount_cents) as total_revenue,
          COUNT(*) as transaction_count,
          AVG(amount_cents) as avg_transaction
        FROM partner_revenue 
        WHERE partner_id = ? 
          AND strftime('%m', timestamp) = strftime('%m', ?)
          AND strftime('%Y', timestamp) < strftime('%Y', ?)
      `).all(partnerId, month, month);

      // Get recent trend (last 30 days)
      const recentTrend = db.db.prepare(`
        SELECT 
          DATE(timestamp) as date,
          SUM(amount_cents) as daily_revenue
        FROM partner_revenue 
        WHERE partner_id = ? 
          AND timestamp >= datetime('now', '-30 days')
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `).all(partnerId);

      // Simple forecast model (can be enhanced with ML)
      let predictedRevenue = 0;
      let confidence = 0.5;

      if (historicalData.length > 0) {
        const avgHistorical = historicalData[0].total_revenue / historicalData.length;
        const avgRecent = recentTrend.reduce((sum, day) => sum + day.daily_revenue, 0) / recentTrend.length;
        
        // Weight recent data more heavily
        predictedRevenue = Math.round(avgHistorical * 0.3 + avgRecent * 0.7);
        confidence = Math.min(0.8, 0.5 + (recentTrend.length / 30) * 0.3);
      }

      // Store forecast
      const stmt = db.db.prepare(`
        INSERT OR REPLACE INTO revenue_forecasts 
        (partner_id, forecast_month, predicted_revenue_cents, confidence_score)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(partnerId, month, predictedRevenue, confidence);
      
      return {
        success: true,
        forecast: {
          partnerId,
          month,
          predictedRevenue: predictedRevenue / 100,
          confidence,
          modelVersion: 'v1.0'
        }
      };
    } catch (error) {
      logger.error('Failed to generate forecast:', error);
      return { success: false, error: error.message };
    }
  }

  // Get partner revenue summary
  async getPartnerRevenueSummary(partnerId, period = '30days') {
    try {
      let dateFilter = '';
      if (period === '30days') {
        dateFilter = "AND timestamp >= datetime('now', '-30 days')";
      } else if (period === '90days') {
        dateFilter = "AND timestamp >= datetime('now', '-90 days')";
      } else if (period === '1year') {
        dateFilter = "AND timestamp >= datetime('now', '-1 year')";
      }

      const summary = db.db.prepare(`
        SELECT 
          SUM(amount_cents) as total_revenue_cents,
          COUNT(*) as transaction_count,
          AVG(amount_cents) as avg_transaction_cents,
          MIN(timestamp) as first_transaction,
          MAX(timestamp) as last_transaction
        FROM partner_revenue 
        WHERE partner_id = ? ${dateFilter}
      `).get(partnerId);

      return {
        success: true,
        summary: {
          totalRevenue: (summary?.total_revenue_cents || 0) / 100,
          transactionCount: summary?.transaction_count || 0,
          avgTransaction: (summary?.avg_transaction_cents || 0) / 100,
          firstTransaction: summary?.first_transaction,
          lastTransaction: summary?.last_transaction
        }
      };
    } catch (error) {
      logger.error('Failed to get revenue summary:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FinanceModule();
