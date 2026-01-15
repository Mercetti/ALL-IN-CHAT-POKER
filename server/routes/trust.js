/**
 * Trust Score API Routes
 * Provides endpoints for partner trust scoring and analytics
 */

const express = require('express');
const trustEngine = require('../trust');
const auth = require('../auth');
const logger = require('../logger');

function createTrustRouter({ db, logger: loggerParam }) {
  const router = express.Router();

  // Calculate trust score for a partner
  router.post('/calculate/:partnerId', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.params;
      
      const result = await trustEngine.calculateTrustScore(partnerId);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Trust score calculation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get trust score for a partner
  router.get('/score/:partnerId', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.params;
      
      const result = await trustEngine.getTrustScore(partnerId);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Trust score retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all trust scores
  router.get('/scores', auth.requireAdmin, async (req, res) => {
    try {
      const result = await trustEngine.getAllTrustScores();

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Trust scores retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get trust score history for a partner
  router.get('/history/:partnerId', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.params;
      
      const history = db.prepare(`
        SELECT 
          score,
          factors,
          change_reason,
          created_at
        FROM trust_score_history 
        WHERE partner_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(partnerId);

      res.json({
        success: true,
        data: {
          partnerId,
          history: history.map(h => ({
            ...h,
            factors: JSON.parse(h.factors || '{}')
          }))
        }
      });
    } catch (error) {
      logger.error('Trust history retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get trust factors breakdown
  router.get('/factors/:partnerId', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.params;
      
      // Get detailed factor analysis
      const factors = await trustEngine.calculateFactors(partnerId);
      
      res.json({
        success: true,
        data: {
          partnerId,
          factors,
          factorWeights: trustEngine.factorWeights,
          calculatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Trust factors retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = { createTrustRouter };
