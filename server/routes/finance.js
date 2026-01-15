/**
 * Finance API Routes
 * Provides endpoints for revenue tracking, payouts, and forecasts
 */

const express = require('express');
const finance = require('../finance');
const auth = require('../auth');
const logger = require('../logger');

function createFinanceRouter({ db, logger: loggerParam }) {
  const router = express.Router();

  // Record revenue
  router.post('/revenue', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, amount, source, metadata } = req.body;
      
      if (!partnerId || !amount || !source) {
        return res.status(400).json({ 
          error: 'Partner ID, amount, and source are required' 
        });
      }

      const result = await finance.recordRevenue(
        partnerId, 
        Math.round(amount * 100), // Convert to cents
        source,
        metadata || {}
      );

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Revenue recording failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Prepare payout
  router.post('/payout/prepare', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, amount, currency } = req.body;
      
      if (!partnerId || !amount) {
        return res.status(400).json({ 
          error: 'Partner ID and amount are required' 
        });
      }

      const result = await finance.preparePayout(
        partnerId,
        Math.round(amount * 100), // Convert to cents
        currency || 'USD'
      );

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Payout preparation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Approve payout
  router.post('/payout/approve', auth.requireAdmin, async (req, res) => {
    try {
      const { payoutId } = req.body;
      const approvedBy = req.user?.id || 'system';
      
      if (!payoutId) {
        return res.status(400).json({ 
          error: 'Payout ID is required' 
        });
      }

      const result = await finance.approvePayout(payoutId, approvedBy);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Payout approval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get revenue forecast
  router.get('/forecast', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, month } = req.query;
      
      if (!partnerId || !month) {
        return res.status(400).json({ 
          error: 'Partner ID and month are required' 
        });
      }

      const result = await finance.generateForecast(partnerId, month);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Forecast generation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get partner revenue summary
  router.get('/revenue/summary', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, period } = req.query;
      
      if (!partnerId) {
        return res.status(400).json({ 
          error: 'Partner ID is required' 
        });
      }

      const result = await finance.getPartnerRevenueSummary(partnerId, period);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Revenue summary failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get ledger data
  router.get('/ledger', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, startDate, endDate, limit = 100 } = req.query;
      
      let query = `
        SELECT 
          id,
          partner_id,
          amount_cents,
          currency,
          revenue_source,
          game_mode,
          feature_used,
          hour_of_day,
          day_of_week,
          timestamp
        FROM partner_revenue 
        WHERE 1=1
      `;
      const params = [];

      if (partnerId) {
        query += ' AND partner_id = ?';
        params.push(partnerId);
      }

      if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(parseInt(limit));

      const ledger = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: {
          entries: ledger.map(entry => ({
            ...entry,
            amount: entry.amount_cents / 100
          })),
          total: ledger.length
        }
      });
    } catch (error) {
      logger.error('Ledger retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = { createFinanceRouter };
