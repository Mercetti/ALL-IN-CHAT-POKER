/**
 * ACEY FINANCIAL OPERATIONS SYSTEM - API Routes
 * Core Safety Rules: Acey CANNOT send money or trigger payouts
 * Only collect revenue data, calculate payouts, prepare batches, detect anomalies
 */

const express = require('express');
const { auth } = require('../auth-contract');
const Logger = require('../logger');
const PayoutEngine = require('./payout-engine');

const logger = new Logger('financial-api');

function createFinancialAPIRoutes() {
  const router = express.Router();
  const payoutEngine = new PayoutEngine();

  // Middleware to ensure financial operations are owner-only
  function requireOwner(req, res, next) {
    if (!auth.requireOwner) {
      return res.status(500).json({ error: 'Owner authentication not available' });
    }
    return auth.requireOwner(req, res, next);
  }

  // Get financial dashboard statistics
  router.get('/dashboard', requireOwner, async (req, res) => {
    try {
      const stats = payoutEngine.getBatchStatistics();
      const flags = payoutEngine.getActiveFlags();
      
      res.json({
        success: true,
        data: {
          batch_stats: stats,
          active_flags: flags,
          system_health: {
            database: 'healthy',
            last_calculation: new Date().toISOString(),
            pending_approvals: stats.pending_batches || 0
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to get financial dashboard', { error: error.message });
      res.status(500).json({ error: 'Failed to get financial dashboard' });
    }
  });

  // Calculate monthly ledgers
  router.post('/ledgers/calculate', requireOwner, async (req, res) => {
    try {
      const { month } = req.body;
      
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
      }
      
      const result = await payoutEngine.calculateMonthlyLedgers(month);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Failed to calculate monthly ledgers', { error: error.message });
      res.status(500).json({ error: 'Failed to calculate monthly ledgers' });
    }
  });

  // Get monthly ledgers
  router.get('/ledgers/:month', requireOwner, async (req, res) => {
    try {
      const { month } = req.params;
      
      const ledgers = db.prepare(`
        SELECT ml.*, pp.partner_name, pp.partner_email, pp.partner_type
        FROM monthly_ledgers ml
        JOIN partner_profiles pp ON ml.partner_id = pp.partner_id
        WHERE ml.ledger_month = ?
        ORDER BY pp.partner_name
      `).all(month);
      
      res.json({
        success: true,
        data: {
          month,
          ledgers: ledgers.map(l => ({
            ...l,
            total_revenue: l.total_revenue_cents / 100,
            total_expenses: l.total_expenses_cents / 100,
            net_revenue: l.net_revenue_cents / 100,
            payout_amount: l.payout_cents / 100
          }))
        }
      });
      
    } catch (error) {
      logger.error('Failed to get monthly ledgers', { error: error.message });
      res.status(500).json({ error: 'Failed to get monthly ledgers' });
    }
  });

  // Create payout batch
  router.post('/batches/create', requireOwner, async (req, res) => {
    try {
      const { month } = req.body;
      
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
      }
      
      const batch = await payoutEngine.createPayoutBatch(month, req.user.id);
      
      res.json({
        success: true,
        data: {
          ...batch,
          total_amount: batch.total_amount_cents / 100,
          ledgers: batch.ledgers.map(l => ({
            ...l,
            total_revenue: l.total_revenue_cents / 100,
            total_expenses: l.total_expenses_cents / 100,
            net_revenue: l.net_revenue_cents / 100,
            payout_amount: l.payout_cents / 100
          }))
        }
      });
      
    } catch (error) {
      logger.error('Failed to create payout batch', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Get payout batches
  router.get('/batches', requireOwner, async (req, res) => {
    try {
      const { status, limit = 50 } = req.query;
      
      let query = 'SELECT * FROM payout_batches ORDER BY created_at DESC';
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
      }
      
      const batches = db.prepare(query).all(...params);
      
      res.json({
        success: true,
        data: {
          batches: batches.map(b => ({
            ...b,
            total_amount: b.total_amount_cents / 100,
            created_at: new Date(b.created_at).toISOString(),
            updated_at: new Date(b.updated_at).toISOString()
          }))
        }
      });
      
    } catch (error) {
      logger.error('Failed to get payout batches', { error: error.message });
      res.status(500).json({ error: 'Failed to get payout batches' });
    }
  });

  // Get specific batch details
  router.get('/batches/:batchId', requireOwner, async (req, res) => {
    try {
      const { batchId } = req.params;
      
      const batch = db.prepare('SELECT * FROM payout_batches WHERE batch_id = ?').get(batchId);
      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      const ledgers = db.prepare(`
        SELECT ml.*, pp.partner_name, pp.partner_email, pp.partner_type
        FROM monthly_ledgers ml
        JOIN partner_profiles pp ON ml.partner_id = pp.partner_id
        WHERE ml.ledger_month = ?
        ORDER BY pp.partner_name
      `).all(batch.batch_month);
      
      res.json({
        success: true,
        data: {
          ...batch,
          total_amount: batch.total_amount_cents / 100,
          created_at: new Date(batch.created_at).toISOString(),
          updated_at: new Date(batch.updated_at).toISOString(),
          ledgers: ledgers.map(l => ({
            ...l,
            total_revenue: l.total_revenue_cents / 100,
            total_expenses: l.total_expenses_cents / 100,
            net_revenue: l.net_revenue_cents / 100,
            payout_amount: l.payout_cents / 100
          }))
        }
      });
      
    } catch (error) {
      logger.error(`Failed to get batch ${req.params.batchId}`, { error: error.message });
      res.status(500).json({ error: 'Failed to get batch details' });
    }
  });

  // Approve payout batch (founder approval)
  router.post('/batches/:batchId/approve', requireOwner, async (req, res) => {
    try {
      const { batchId } = req.params;
      
      const batch = await payoutEngine.approvePayoutBatch(batchId, req.user.id);
      
      res.json({
        success: true,
        data: {
          ...batch,
          total_amount: batch.total_amount_cents / 100,
          approved_at: new Date(batch.approved_at).toISOString()
        },
        message: `Batch ${batchId} approved successfully`
      });
      
    } catch (error) {
      logger.error(`Failed to approve batch ${req.params.batchId}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Reject payout batch
  router.post('/batches/:batchId/reject', requireOwner, async (req, res) => {
    try {
      const { batchId } = req.params;
      const { rejection_reason } = req.body;
      
      if (!rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      
      // Update batch status
      db.prepare(`
        UPDATE payout_batches 
        SET status = 'rejected', rejection_reason = ?, updated_at = ?
        WHERE batch_id = ?
      `).run(rejection_reason, Date.now(), batchId);
      
      // Update ledger statuses
      db.prepare(`
        UPDATE monthly_ledgers 
        SET payout_status = 'rejected', updated_at = ?
        WHERE ledger_month = (SELECT batch_month FROM payout_batches WHERE batch_id = ?)
      `).run(Date.now(), batchId);
      
      logger.info(`Rejected payout batch ${batchId}: ${rejection_reason}`);
      
      res.json({
        success: true,
        message: `Batch ${batchId} rejected`
      });
      
    } catch (error) {
      logger.error(`Failed to reject batch ${req.params.batchId}`, { error: error.message });
      res.status(500).json({ error: 'Failed to reject batch' });
    }
  });

  // Generate PayPal CSV export
  router.get('/batches/:batchId/export/paypal', requireOwner, async (req, res) => {
    try {
      const { batchId } = req.params;
      
      const csvContent = await payoutEngine.generatePayPalCSV(batchId);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payout_batch_${batchId}.csv"`);
      res.send(csvContent);
      
    } catch (error) {
      logger.error(`Failed to generate PayPal CSV for batch ${req.params.batchId}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Get active flags
  router.get('/flags', requireOwner, async (req, res) => {
    try {
      const flags = payoutEngine.getActiveFlags();
      
      res.json({
        success: true,
        data: {
          flags: flags,
          count: flags.length,
          high_priority: flags.filter(f => f.flag_severity === 'high').length,
          medium_priority: flags.filter(f => f.flag_severity === 'medium').length,
          low_priority: flags.filter(f => f.flag_severity === 'low').length
        }
      });
      
    } catch (error) {
      logger.error('Failed to get active flags', { error: error.message });
      res.status(500).json({ error: 'Failed to get active flags' });
    }
  });

  // Resolve flag
  router.post('/flags/:flagId/resolve', requireOwner, async (req, res) => {
    try {
      const { flagId } = req.params;
      const { resolution_notes } = req.body;
      
      if (!resolution_notes) {
        return res.status(400).json({ error: 'Resolution notes are required' });
      }
      
      // Update flag status
      db.prepare(`
        UPDATE financial_flags 
        SET flag_status = 'resolved', resolution_notes = ?, resolved_at = ?, resolved_by = ?
        WHERE flag_id = ?
      `).run(resolution_notes, Date.now(), req.user.id, flagId);
      
      logger.info(`Resolved flag ${flagId}: ${resolution_notes}`);
      
      res.json({
        success: true,
        message: `Flag ${flagId} resolved`
      });
      
    } catch (error) {
      logger.error(`Failed to resolve flag ${req.params.flagId}`, { error: error.message });
      res.status(500).json({ error: 'Failed to resolve flag' });
    }
  });

  // Get partner profiles
  router.get('/partners', requireOwner, async (req, res) => {
    try {
      const { status } = req.query;
      
      let query = 'SELECT * FROM partner_profiles ORDER BY partner_name';
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      const partners = db.prepare(query).all(...params);
      
      res.json({
        success: true,
        data: {
          partners: partners.map(p => ({
            ...p,
            minimum_payout: (p.minimum_payout_cents || 10000) / 100,
            created_at: new Date(p.created_at).toISOString(),
            updated_at: new Date(p.updated_at).toISOString()
          }))
        }
      });
      
    } catch (error) {
      logger.error('Failed to get partner profiles', { error: error.message });
      res.status(500).json({ error: 'Failed to get partner profiles' });
    }
  });

  // Add financial event
  router.post('/events', requireOwner, async (req, res) => {
    try {
      const {
        event_type,
        event_category,
        amount_cents,
        currency = 'USD',
        partner_id,
        partner_name,
        description,
        source_system,
        reference_id,
        metadata = '{}'
      } = req.body;
      
      // Validation
      if (!event_type || !event_category || !amount_cents || !description || !source_system) {
        return res.status(400).json({ 
          error: 'Missing required fields: event_type, event_category, amount_cents, description, source_system' 
        });
      }
      
      if (amount_cents < 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }
      
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const eventDate = Date.now();
      
      const event = {
        id: eventId,
        event_type,
        event_category,
        amount_cents,
        currency,
        partner_id: partner_id || null,
        partner_name: partner_name || null,
        event_date: eventDate,
        event_date_iso: new Date(eventDate).toISOString(),
        description,
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
        source_system,
        reference_id: reference_id || null,
        status: 'confirmed',
        created_at: eventDate,
        created_by: req.user.id,
        audit_hash: crypto.createHash('sha256').update(JSON.stringify({
          event_type,
          event_category,
          amount_cents,
          description,
          source_system,
          reference_id,
          created_at: eventDate,
          created_by: req.user.id
        })).digest('hex'),
        audit_version: 1
      };
      
      // Store event
      db.prepare(`
        INSERT INTO financial_events (
          id, event_type, event_category, amount_cents, currency, partner_id,
          partner_name, event_date, event_date_iso, description, metadata,
          source_system, reference_id, status, created_at, created_by,
          audit_hash, audit_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id,
        event.event_type,
        event.event_category,
        event.amount_cents,
        event.currency,
        event.partner_id,
        event.partner_name,
        event.event_date,
        event.event_date_iso,
        event.description,
        event.metadata,
        event.source_system,
        event.reference_id,
        event.status,
        event.created_at,
        event.created_by,
        event.audit_hash,
        event.audit_version
      );
      
      logger.info(`Financial event recorded: ${event.event_type} - $${event.amount_cents / 100} - ${event.description}`);
      
      res.json({
        success: true,
        data: {
          ...event,
          amount: event.amount_cents / 100
        }
      });
      
    } catch (error) {
      logger.error('Failed to add financial event', { error: error.message });
      res.status(500).json({ error: 'Failed to add financial event' });
    }
  });

  // Get financial events
  router.get('/events', requireOwner, async (req, res) => {
    try {
      const { 
        partner_id, 
        event_type, 
        event_category, 
        limit = 100, 
        offset = 0 
      } = req.query;
      
      let query = 'SELECT * FROM financial_events WHERE 1=1';
      const params = [];
      
      if (partner_id) {
        query += ' AND partner_id = ?';
        params.push(partner_id);
      }
      
      if (event_type) {
        query += ' AND event_type = ?';
        params.push(event_type);
      }
      
      if (event_category) {
        query += ' AND event_category = ?';
        params.push(event_category);
      }
      
      query += ' ORDER BY event_date DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const events = db.prepare(query).all(...params);
      
      res.json({
        success: true,
        data: {
          events: events.map(e => ({
            ...e,
            amount: e.amount_cents / 100,
            event_date: new Date(e.event_date).toISOString()
          }))
        }
      });
      
    } catch (error) {
      logger.error('Failed to get financial events', { error: error.message });
      res.status(500).json({ error: 'Failed to get financial events' });
    }
  });

  // System health check
  router.get('/health', requireOwner, async (req, res) => {
    try {
      // Test database connection
      const dbTest = db.prepare('SELECT 1').get();
      
      // Test payout engine
      const engineStats = payoutEngine.getBatchStatistics();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: dbTest ? 'connected' : 'disconnected',
          payout_engine: 'operational',
          batch_stats: engineStats,
          last_check: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Financial system health check failed', { error: error.message });
      res.status(500).json({ 
        success: false, 
        error: 'Financial system health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

module.exports = { createFinancialAPIRoutes };
