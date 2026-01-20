/**
 * ACEY FINANCIAL OPERATIONS SYSTEM - Payout Preparation Engine
 * Core Safety Rules: Acey CANNOT send money or trigger payouts
 * Only collect revenue data, calculate payouts, prepare batches, detect anomalies
 */

const db = require('../db');
const Logger = require('../logger');
const crypto = require('crypto');

const logger = new Logger('payout-engine');

class PayoutEngine {
  constructor() {
    this.minimumPayoutCents = 10000; // $100 minimum
    this.anomalyThresholdMultiplier = 2.0;
  }

  /**
   * Calculate monthly ledgers for all active partners
   * @param {string} month - YYYY-MM format
   * @returns {Object} - Calculation results
   */
  async calculateMonthlyLedgers(month) {
    try {
      logger.info(`Calculating monthly ledgers for ${month}`);
      
      // Get all active partners
      const partners = db.prepare('SELECT * FROM partner_profiles WHERE status = ?').all('active');
      
      const ledgers = [];
      const flags = [];
      
      for (const partner of partners) {
        const ledger = await this.calculatePartnerLedger(partner, month);
        
        if (ledger) {
          ledgers.push(ledger);
          
          // Check for anomalies
          const anomalyFlags = this.detectAnomalies(ledger, partner);
          flags.push(...anomalyFlags);
        }
      }
      
      // Store ledgers
      for (const ledger of ledgers) {
        await this.storeLedger(ledger);
      }
      
      // Store flags
      for (const flag of flags) {
        await this.storeFlag(flag);
      }
      
      logger.info(`Calculated ${ledgers.length} monthly ledgers with ${flags.length} flags`);
      
      return {
        month,
        ledgers,
        flags,
        totalRevenue: ledgers.reduce((sum, l) => sum + l.total_revenue_cents, 0),
        totalExpenses: ledgers.reduce((sum, l) => sum + l.total_expenses_cents, 0),
        totalPayouts: ledgers.reduce((sum, l) => sum + l.payout_cents, 0)
      };
      
    } catch (error) {
      logger.error('Failed to calculate monthly ledgers', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate individual partner ledger
   * @param {Object} partner - Partner profile
   * @param {string} month - YYYY-MM format
   * @returns {Object} - Ledger data
   */
  async calculatePartnerLedger(partner, month) {
    try {
      // Get financial events for the month
      const events = db.prepare(`
        SELECT * FROM financial_events 
        WHERE partner_id = ? AND strftime('%Y-%m', datetime(event_date, 'unixepoch')) = ?
        ORDER BY event_date
      `).all(partner.partner_id, month);
      
      if (events.length === 0) {
        return null; // No activity this month
      }
      
      // Calculate totals
      const totalRevenue = events
        .filter(e => e.event_type === 'revenue')
        .reduce((sum, e) => sum + e.amount_cents, 0);
      
      const totalExpenses = events
        .filter(e => e.event_type === 'expense')
        .reduce((sum, e) => sum + e.amount_cents, 0);
      
      const netRevenue = totalRevenue - totalExpenses;
      
      // Calculate payout based on revenue share
      const payoutCents = Math.floor(netRevenue * (partner.revenue_share_percent / 100));
      
      // Check minimum payout threshold
      const minimumPayoutMet = payoutCents >= (partner.minimum_payout_cents || this.minimumPayoutCents);
      
      const ledger = {
        id: `ledger_${partner.partner_id}_${month}`,
        ledger_month: month,
        partner_id: partner.partner_id,
        total_revenue_cents: totalRevenue,
        total_expenses_cents: totalExpenses,
        net_revenue_cents: netRevenue,
        payout_cents: minimumPayoutMet ? payoutCents : 0,
        payout_status: minimumPayoutMet ? 'pending' : 'below_threshold',
        events_count: events.length,
        revenue_share_percent: partner.revenue_share_percent,
        minimum_payout_met: minimumPayoutMet ? 1 : 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        calculation_hash: this.calculateLedgerHash({
          partner_id: partner.partner_id,
          month,
          totalRevenue,
          totalExpenses,
          netRevenue,
          payoutCents,
          revenueSharePercent: partner.revenue_share_percent
        }),
        calculation_version: 1,
        created_by: 'system'
      };
      
      return ledger;
      
    } catch (error) {
      logger.error(`Failed to calculate ledger for partner ${partner.partner_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Detect anomalies in ledger data
   * @param {Object} ledger - Ledger data
   * @param {Object} partner - Partner profile
   * @returns {Array} - Array of anomaly flags
   */
  detectAnomalies(ledger, partner) {
    const flags = [];
    
    // Anomaly 1: Revenue spike detection
    const avgRevenue = this.getAverageRevenue(partner.partner_id);
    if (avgRevenue > 0 && ledger.total_revenue_cents > avgRevenue * this.anomalyThresholdMultiplier) {
      flags.push({
        flag_id: `anomaly_revenue_spike_${ledger.id}`,
        flag_type: 'anomaly',
        flag_severity: 'high',
        flag_title: 'Revenue Spike Detected',
        flag_description: `Revenue of $${ledger.total_revenue_cents / 100} is ${this.anomalyThresholdMultiplier}x higher than average of $${avgRevenue / 100}`,
        affected_entity_type: 'ledger',
        affected_entity_id: ledger.id,
        flag_date: Date.now(),
        flag_status: 'active',
        detection_rule: 'revenue_spike_threshold',
        detection_threshold: `${this.anomalyThresholdMultiplier}x average`,
        actual_value: ledger.total_revenue_cents.toString(),
        expected_value: `<= ${avgRevenue * this.anomalyThresholdMultiplier}`,
        created_at: Date.now(),
        created_by: 'system'
      });
    }
    
    // Anomaly 2: Negative net revenue
    if (ledger.net_revenue_cents < 0) {
      flags.push({
        flag_id: `anomaly_negative_revenue_${ledger.id}`,
        flag_type: 'anomaly',
        flag_severity: 'medium',
        flag_title: 'Negative Net Revenue',
        flag_description: `Net revenue is -$${Math.abs(ledger.net_revenue_cents) / 100} (expenses exceed revenue)`,
        affected_entity_type: 'ledger',
        affected_entity_id: ledger.id,
        flag_date: Date.now(),
        flag_status: 'active',
        detection_rule: 'negative_net_revenue',
        detection_threshold: '>= 0',
        actual_value: ledger.net_revenue_cents.toString(),
        expected_value: '>= 0',
        created_at: Date.now(),
        created_by: 'system'
      });
    }
    
    // Anomaly 3: Unusual expense ratio
    const expenseRatio = ledger.total_revenue_cents > 0 ? ledger.total_expenses_cents / ledger.total_revenue_cents : 0;
    if (expenseRatio > 0.5) { // Expenses > 50% of revenue
      flags.push({
        flag_id: `anomaly_high_expenses_${ledger.id}`,
        flag_type: 'anomaly',
        flag_severity: 'medium',
        flag_title: 'High Expense Ratio',
        flag_description: `Expenses are ${Math.round(expenseRatio * 100)}% of revenue`,
        affected_entity_type: 'ledger',
        affected_entity_id: ledger.id,
        flag_date: Date.now(),
        flag_status: 'active',
        detection_rule: 'expense_ratio_threshold',
        detection_threshold: '<= 0.5',
        actual_value: expenseRatio.toString(),
        expected_value: '<= 0.5',
        created_at: Date.now(),
        created_by: 'system'
      });
    }
    
    return flags;
  }

  /**
   * Get average revenue for a partner
   * @param {string} partnerId - Partner ID
   * @returns {number} - Average revenue in cents
   */
  getAverageRevenue(partnerId) {
    try {
      const result = db.prepare(`
        SELECT AVG(
          CASE WHEN event_type = 'revenue' THEN amount_cents ELSE 0 END
        ) as avg_revenue
        FROM financial_events 
        WHERE partner_id = ? 
        AND event_date >= strftime('%s', datetime('now', '-6 months'))
      `).get(partnerId);
      
      return result ? Math.floor(result.avg_revenue) : 0;
      
    } catch (error) {
      logger.error(`Failed to get average revenue for partner ${partnerId}`, { error: error.message });
      return 0;
    }
  }

  /**
   * Store ledger in database
   * @param {Object} ledger - Ledger data
   */
  async storeLedger(ledger) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO monthly_ledgers (
          id, ledger_month, partner_id, total_revenue_cents, total_expenses_cents,
          net_revenue_cents, payout_cents, payout_status, events_count,
          revenue_share_percent, minimum_payout_met, created_at, updated_at,
          calculation_hash, calculation_version, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ledger.id,
        ledger.ledger_month,
        ledger.partner_id,
        ledger.total_revenue_cents,
        ledger.total_expenses_cents,
        ledger.net_revenue_cents,
        ledger.payout_cents,
        ledger.payout_status,
        ledger.events_count,
        ledger.revenue_share_percent,
        ledger.minimum_payout_met,
        ledger.created_at,
        ledger.updated_at,
        ledger.calculation_hash,
        ledger.calculation_version,
        ledger.created_by
      );
      
      logger.info(`Stored ledger for partner ${ledger.partner_id} month ${ledger.ledger_month}`);
      
    } catch (error) {
      logger.error(`Failed to store ledger ${ledger.id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Store flag in database
   * @param {Object} flag - Flag data
   */
  async storeFlag(flag) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO financial_flags (
          flag_id, flag_type, flag_severity, flag_title, flag_description,
          affected_entity_type, affected_entity_id, flag_date, flag_status,
          detection_rule, detection_threshold, actual_value, expected_value,
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        flag.flag_id,
        flag.flag_type,
        flag.flag_severity,
        flag.flag_title,
        flag.flag_description,
        flag.affected_entity_type,
        flag.affected_entity_id,
        flag.flag_date,
        flag.flag_status,
        flag.detection_rule,
        flag.detection_threshold,
        flag.actual_value,
        flag.expected_value,
        flag.created_at,
        flag.created_by
      );
      
      logger.info(`Stored flag: ${flag.flag_title} for ${flag.affected_entity_id}`);
      
    } catch (error) {
      logger.error(`Failed to store flag ${flag.flag_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Create payout batch for approval
   * @param {string} month - YYYY-MM format
   * @param {string} requestedBy - User requesting the batch
   * @returns {Object} - Batch data
   */
  async createPayoutBatch(month, requestedBy) {
    try {
      logger.info(`Creating payout batch for ${month} by ${requestedBy}`);
      
      // Get all pending ledgers for the month
      const ledgers = db.prepare(`
        SELECT * FROM monthly_ledgers 
        WHERE ledger_month = ? AND payout_status = 'pending' AND payout_cents > 0
        ORDER BY partner_id
      `).all(month);
      
      if (ledgers.length === 0) {
        throw new Error('No pending payouts found for this month');
      }
      
      // Calculate batch totals
      const totalAmount = ledgers.reduce((sum, l) => sum + l.payout_cents, 0);
      
      const batch = {
        batch_id: `batch_${month}_${Date.now()}`,
        batch_name: `Payout Batch - ${month}`,
        batch_month: month,
        total_partners: ledgers.length,
        total_amount_cents: totalAmount,
        currency: 'USD',
        status: 'pending',
        created_at: Date.now(),
        updated_at: Date.now(),
        requested_by: requestedBy,
        batch_hash: this.calculateBatchHash(ledgers),
        created_by: 'system'
      };
      
      // Store batch
      db.prepare(`
        INSERT INTO payout_batches (
          batch_id, batch_name, batch_month, total_partners, total_amount_cents,
          currency, status, created_at, updated_at, requested_by,
          batch_hash, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        batch.batch_id,
        batch.batch_name,
        batch.batch_month,
        batch.total_partners,
        batch.total_amount_cents,
        batch.currency,
        batch.status,
        batch.created_at,
        batch.updated_at,
        batch.requested_by,
        batch.batch_hash,
        batch.created_by
      );
      
      logger.info(`Created payout batch ${batch.batch_id} with ${batch.total_partners} partners totaling $${batch.total_amount_cents / 100}`);
      
      return {
        ...batch,
        ledgers
      };
      
    } catch (error) {
      logger.error('Failed to create payout batch', { error: error.message });
      throw error;
    }
  }

  /**
   * Approve payout batch (founder approval required)
   * @param {string} batchId - Batch ID
   * @param {string} approvedBy - Approving user
   * @returns {Object} - Updated batch data
   */
  async approvePayoutBatch(batchId, approvedBy) {
    try {
      logger.info(`Approving payout batch ${batchId} by ${approvedBy}`);
      
      // Get batch details
      const batch = db.prepare('SELECT * FROM payout_batches WHERE batch_id = ?').get(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }
      
      if (batch.status !== 'pending') {
        throw new Error(`Batch is not pending (current status: ${batch.status})`);
      }
      
      // Update batch status
      db.prepare(`
        UPDATE payout_batches 
        SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
        WHERE batch_id = ?
      `).run(approvedBy, Date.now(), Date.now(), batchId);
      
      // Update ledger statuses
      db.prepare(`
        UPDATE monthly_ledgers 
        SET payout_status = 'approved', updated_at = ?
        WHERE ledger_month = ? AND payout_status = 'pending'
      `).run(Date.now(), batch.batch_month);
      
      logger.info(`Approved payout batch ${batchId} - $${batch.total_amount_cents / 100} ready for processing`);
      
      return {
        ...batch,
        status: 'approved',
        approved_by,
        approved_at: Date.now()
      };
      
    } catch (error) {
      logger.error(`Failed to approve batch ${batchId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Generate PayPal CSV export for approved batch
   * @param {string} batchId - Batch ID
   * @returns {string} - CSV content
   */
  async generatePayPalCSV(batchId) {
    try {
      logger.info(`Generating PayPal CSV for batch ${batchId}`);
      
      // Get batch and ledgers
      const batch = db.prepare('SELECT * FROM payout_batches WHERE batch_id = ?').get(batchId);
      if (!batch || batch.status !== 'approved') {
        throw new Error('Batch not found or not approved');
      }
      
      const ledgers = db.prepare(`
        SELECT ml.*, pp.partner_name, pp.partner_email
        FROM monthly_ledgers ml
        JOIN partner_profiles pp ON ml.partner_id = pp.partner_id
        WHERE ml.ledger_month = ? AND ml.payout_status = 'approved'
        ORDER BY pp.partner_name
      `).all(batch.batch_month);
      
      if (ledgers.length === 0) {
        throw new Error('No approved ledgers found for this batch');
      }
      
      // Generate CSV content
      const csvHeaders = [
        'Email',
        'Amount',
        'Currency',
        'Note',
        'Reference'
      ];
      
      const csvRows = ledgers.map(ledger => [
        ledger.partner_email || `${ledger.partner_id}@example.com`,
        (ledger.payout_cents / 100).toFixed(2),
        batch.currency,
        `Payout for ${batch.batch_month} - ${ledger.partner_name}`,
        ledger.id
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');
      
      // Update batch processing info
      db.prepare(`
        UPDATE payout_batches 
        SET processing_reference = ?, updated_at = ?
        WHERE batch_id = ?
      `).run(`paypal_export_${Date.now()}`, Date.now(), batchId);
      
      logger.info(`Generated PayPal CSV for batch ${batchId} with ${ledgers.length} rows`);
      
      return csvContent;
      
    } catch (error) {
      logger.error(`Failed to generate PayPal CSV for batch ${batchId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate hash for ledger integrity
   * @param {Object} data - Data to hash
   * @returns {string} - SHA-256 hash
   */
  calculateLedgerHash(data) {
    const hashInput = JSON.stringify({
      partner_id: data.partner_id,
      month: data.month,
      totalRevenue: data.totalRevenue,
      totalExpenses: data.totalExpenses,
      netRevenue: data.netRevenue,
      payoutCents: data.payoutCents,
      revenueSharePercent: data.revenueSharePercent
    });
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Calculate hash for batch integrity
   * @param {Array} ledgers - Array of ledgers
   * @returns {string} - SHA-256 hash
   */
  calculateBatchHash(ledgers) {
    const hashInput = JSON.stringify(ledgers.map(l => ({
      id: l.id,
      partner_id: l.partner_id,
      payout_cents: l.payout_cents
    })));
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Get batch statistics
   * @returns {Object} - Statistics
   */
  getBatchStatistics() {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_batches,
          SUM(total_amount_cents) as total_amount_cents,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_batches,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_batches,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_batches,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_batches
        FROM payout_batches
      `).get();
      
      return {
        ...stats,
        total_amount: stats.total_amount_cents / 100,
        pending_amount: db.prepare(`
          SELECT COALESCE(SUM(total_amount_cents), 0) as amount
          FROM payout_batches 
          WHERE status = 'pending'
        `).get().amount / 100,
        approved_amount: db.prepare(`
          SELECT COALESCE(SUM(total_amount_cents), 0) as amount
          FROM payout_batches 
          WHERE status = 'approved'
        `).get().amount / 100
      };
      
    } catch (error) {
      logger.error('Failed to get batch statistics', { error: error.message });
      return {};
    }
  }

  /**
   * Get active flags
   * @returns {Array} - Array of active flags
   */
  getActiveFlags() {
    try {
      return db.prepare(`
        SELECT * FROM financial_flags 
        WHERE flag_status = 'active'
        ORDER BY flag_severity DESC, flag_date DESC
      `).all();
      
    } catch (error) {
      logger.error('Failed to get active flags', { error: error.message });
      return [];
    }
  }
}

module.exports = PayoutEngine;
