/**
 * Analytics API Routes
 * Provides endpoints for revenue heatmaps and pattern analysis
 */

const express = require('express');
const analytics = require('../analytics');
const auth = require('../auth');
const logger = require('../logger');

function createAnalyticsRouter({ db, logger: loggerParam }) {
  const router = express.Router();

  // Generate revenue heatmap
  router.get('/heatmap', auth.requireAdmin, async (req, res) => {
    try {
      const { dimension = 'hour', partnerId } = req.query;
      
      const result = await analytics.generateRevenueHeatmap(dimension, partnerId);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Heatmap generation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Detect peak windows
  router.get('/peaks', auth.requireAdmin, async (req, res) => {
    try {
      const { dimension = 'hour' } = req.query;
      
      const result = await analytics.detectPeakWindows(dimension);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Peak detection failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get feature-revenue correlation
  router.get('/correlation', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.query;
      
      const result = await analytics.getFeatureRevenueCorrelation(partnerId);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Correlation analysis failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get adjusted forecast
  router.get('/forecast', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, month } = req.query;
      
      if (!partnerId || !month) {
        return res.status(400).json({ 
          error: 'Partner ID and month are required' 
        });
      }

      const result = await analytics.getAdjustedForecast(partnerId, month);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Adjusted forecast retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get forecast adjustment history
  router.get('/adjustments', auth.requireAdmin, async (req, res) => {
    try {
      const adjustments = db.prepare(`
        SELECT 
          adjustment_reason,
          confidence_threshold,
          weight_adjustment,
          applied_at
        FROM forecast_adjustments 
        ORDER BY applied_at DESC
        LIMIT 20
      `).all();

      res.json({
        success: true,
        data: {
          adjustments,
          totalAdjustments: adjustments.length
        }
      });
    } catch (error) {
      logger.error('Adjustment history retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = { createAnalyticsRouter };
