/**
 * Trust Score Engine
 * Calculates and manages partner trust scores based on multiple factors
 */

const db = require('../db');
const logger = require('../logger');

class TrustEngine {
  constructor() {
    this.initialized = false;
    this.factorWeights = {
      disputeRate: 0.30,      // 30% weight
      revenueConsistency: 0.25,  // 25% weight
      refundRatio: 0.25,        // 25% weight
      payoutHistory: 0.20        // 20% weight
    };
  }

  async initialize() {
    try {
      await this.ensureTrustTables();
      this.initialized = true;
      logger.info('Trust engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize trust engine:', error);
      throw error;
    }
  }

  async ensureTrustTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS partner_trust_scores (
        partner_id TEXT PRIMARY KEY,
        score INTEGER DEFAULT 50,
        dispute_rate REAL DEFAULT 0,
        revenue_consistency REAL DEFAULT 0,
        refund_ratio REAL DEFAULT 0,
        payout_history REAL DEFAULT 0,
        factor_breakdown TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS trust_score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        factors TEXT,
        change_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      db.db.prepare(table).run();
    }
  }

  // Calculate trust score for a partner
  async calculateTrustScore(partnerId) {
    try {
      const factors = await this.calculateFactors(partnerId);
      const score = this.computeScore(factors);
      
      // Store the score
      await this.updateTrustScore(partnerId, score, factors);
      
      return {
        success: true,
        trustScore: {
          partnerId,
          score,
          factors,
          calculatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to calculate trust score:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateFactors(partnerId) {
    // 1. Dispute Rate (0-100 scale, lower is better)
    const disputeRate = await this.calculateDisputeRate(partnerId);
    
    // 2. Revenue Consistency (0-100 scale, higher is better)
    const revenueConsistency = await this.calculateRevenueConsistency(partnerId);
    
    // 3. Refund Ratio (0-100 scale, lower is better)
    const refundRatio = await this.calculateRefundRatio(partnerId);
    
    // 4. Payout History (0-100 scale, higher is better)
    const payoutHistory = await this.calculatePayoutHistory(partnerId);

    return {
      disputeRate,
      revenueConsistency,
      refundRatio,
      payoutHistory
    };
  }

  async calculateDisputeRate(partnerId) {
    try {
      // Get total disputes in last 90 days
      const disputes = db.db.prepare(`
        SELECT COUNT(*) as dispute_count
        FROM disputes 
        WHERE partner_id = ? 
          AND created_at >= datetime('now', '-90 days')
      `).get(partnerId);

      // Get total transactions in last 90 days
      const transactions = db.db.prepare(`
        SELECT COUNT(*) as transaction_count
        FROM partner_revenue 
        WHERE partner_id = ? 
          AND timestamp >= datetime('now', '-90 days')
      `).get(partnerId);

      const disputeCount = disputes?.dispute_count || 0;
      const transactionCount = transactions?.transaction_count || 1;
      
      // Dispute rate = (disputes / transactions) * 100
      const disputeRate = Math.min(100, (disputeCount / transactionCount) * 100);
      
      // Convert to 0-100 scale (lower dispute rate = higher score)
      return Math.max(0, 100 - disputeRate);
    } catch (error) {
      logger.error('Failed to calculate dispute rate:', error);
      return 50; // Default middle score
    }
  }

  async calculateRevenueConsistency(partnerId) {
    try {
      // Get daily revenue for last 30 days
      const dailyRevenue = db.db.prepare(`
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

      if (dailyRevenue.length < 7) {
        return 50; // Not enough data
      }

      // Calculate coefficient of variation (CV)
      const revenues = dailyRevenue.map(d => d.daily_revenue);
      const mean = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
      const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - mean, 2), 0) / revenues.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? (stdDev / mean) : 1;

      // Convert CV to 0-100 scale (lower CV = higher score)
      const consistency = Math.max(0, Math.min(100, 100 - (cv * 100)));
      
      return consistency;
    } catch (error) {
      logger.error('Failed to calculate revenue consistency:', error);
      return 50;
    }
  }

  async calculateRefundRatio(partnerId) {
    try {
      // Get total revenue and refunds in last 90 days
      const revenue = db.db.prepare(`
        SELECT SUM(amount_cents) as total_revenue
        FROM partner_revenue 
        WHERE partner_id = ? 
          AND timestamp >= datetime('now', '-90 days')
      `).get(partnerId);

      const refunds = db.db.prepare(`
        SELECT COALESCE(SUM(amount_cents), 0) as total_refunds
        FROM refunds 
        WHERE partner_id = ? 
          AND created_at >= datetime('now', '-90 days')
      `).get(partnerId);

      const totalRevenue = revenue?.total_revenue || 0;
      const totalRefunds = refunds?.total_refunds || 0;

      if (totalRevenue === 0) {
        return 50; // No revenue data
      }

      // Refund ratio = (refunds / revenue) * 100
      const refundRatio = Math.min(100, (totalRefunds / totalRevenue) * 100);
      
      // Convert to 0-100 scale (lower refund ratio = higher score)
      return Math.max(0, 100 - refundRatio);
    } catch (error) {
      logger.error('Failed to calculate refund ratio:', error);
      return 50;
    }
  }

  async calculatePayoutHistory(partnerId) {
    try {
      // Get payout history for last 6 months
      const payouts = db.db.prepare(`
        SELECT 
          COUNT(*) as total_payouts,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_payouts,
          AVG(CASE WHEN processed_at IS NOT NULL THEN 
            julianday(processed_at) - julianday(scheduled_for)
          ELSE NULL END) as avg_processing_days
        FROM payouts 
        WHERE partner_id = ? 
          AND created_at >= datetime('now', '-6 months')
      `).get(partnerId);

      const totalPayouts = payouts?.total_payouts || 0;
      const approvedPayouts = payouts?.approved_payouts || 0;
      const avgProcessingDays = payouts?.avg_processing_days || 0;

      if (totalPayouts === 0) {
        return 50; // No payout history
      }

      // Calculate based on approval rate and processing time
      const approvalRate = (approvedPayouts / totalPayouts) * 100;
      const processingScore = Math.max(0, 100 - (avgProcessingDays * 10)); // 10 points per day
      
      // Combine scores
      const payoutHistoryScore = (approvalRate * 0.7) + (processingScore * 0.3);
      
      return Math.min(100, Math.max(0, payoutHistoryScore));
    } catch (error) {
      logger.error('Failed to calculate payout history:', error);
      return 50;
    }
  }

  computeScore(factors) {
    const weightedScore = 
      (factors.disputeRate * this.factorWeights.disputeRate) +
      (factors.revenueConsistency * this.factorWeights.revenueConsistency) +
      (factors.refundRatio * this.factorWeights.refundRatio) +
      (factors.payoutHistory * this.factorWeights.payoutHistory);

    return Math.round(weightedScore);
  }

  async updateTrustScore(partnerId, score, factors) {
    try {
      const factorBreakdown = JSON.stringify({
        disputeRate: { value: factors.disputeRate, weight: this.factorWeights.disputeRate },
        revenueConsistency: { value: factors.revenueConsistency, weight: this.factorWeights.revenueConsistency },
        refundRatio: { value: factors.refundRatio, weight: this.factorWeights.refundRatio },
        payoutHistory: { value: factors.payoutHistory, weight: this.factorWeights.payoutHistory }
      });

      // Update current score
      const updateStmt = db.db.prepare(`
        INSERT OR REPLACE INTO partner_trust_scores 
        (partner_id, score, dispute_rate, revenue_consistency, refund_ratio, payout_history, factor_breakdown)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      updateStmt.run(
        partnerId,
        score,
        factors.disputeRate,
        factors.revenueConsistency,
        factors.refundRatio,
        factors.payoutHistory,
        factorBreakdown
      );

      // Add to history
      const historyStmt = db.db.prepare(`
        INSERT INTO trust_score_history 
        (partner_id, score, factors, change_reason)
        VALUES (?, ?, ?, ?)
      `);
      
      historyStmt.run(
        partnerId,
        score,
        factorBreakdown,
        'Automated recalculation'
      );

      logger.info(`Trust score updated: ${partnerId} - ${score}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to update trust score:', error);
      return { success: false, error: error.message };
    }
  }

  // Get trust score for a partner
  async getTrustScore(partnerId) {
    try {
      const score = db.db.prepare(`
        SELECT 
          score,
          dispute_rate,
          revenue_consistency,
          refund_ratio,
          payout_history,
          factor_breakdown,
          updated_at
        FROM partner_trust_scores 
        WHERE partner_id = ?
      `).get(partnerId);

      if (!score) {
        // Calculate if not exists
        return await this.calculateTrustScore(partnerId);
      }

      return {
        success: true,
        trustScore: {
          partnerId,
          score: score.score,
          factors: score.factor_breakdown ? JSON.parse(score.factor_breakdown) : null,
          updatedAt: score.updated_at
        }
      };
    } catch (error) {
      logger.error('Failed to get trust score:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all partners with trust scores
  async getAllTrustScores() {
    try {
      const scores = db.db.prepare(`
        SELECT 
          partner_id,
          score,
          dispute_rate,
          revenue_consistency,
          refund_ratio,
          payout_history,
          updated_at
        FROM partner_trust_scores 
        ORDER BY score DESC
      `).all();

      return {
        success: true,
        trustScores: scores.map(row => ({
          partnerId: row.partner_id,
          score: row.score,
          factors: {
            disputeRate: row.dispute_rate,
            revenueConsistency: row.revenue_consistency,
            refundRatio: row.refund_ratio,
            payoutHistory: row.payout_history
          },
          updatedAt: row.updated_at
        }))
      };
    } catch (error) {
      logger.error('Failed to get all trust scores:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TrustEngine();
