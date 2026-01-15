/**
 * Dispute API Routes
 * Provides endpoints for dispute management and resolution
 */

const express = require('express');
const disputeModule = require('../disputes');
const auth = require('../auth');
const logger = require('../logger');

function createDisputeRouter({ db, logger: loggerParam }) {
  const router = express.Router();

  // Create new dispute
  router.post('/', auth.requireAdmin, async (req, res) => {
    try {
      const { partnerId, month, reason, evidence } = req.body;
      
      if (!partnerId || !month || !reason) {
        return res.status(400).json({ 
          error: 'Partner ID, month, and reason are required' 
        });
      }

      const result = await disputeModule.createDispute(partnerId, month, reason, evidence || []);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Dispute creation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get disputes by status
  router.get('/', auth.requireAdmin, async (req, res) => {
    try {
      const { status = 'open' } = req.query;
      
      const result = await disputeModule.getDisputesByStatus(status);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Dispute retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get dispute details
  router.get('/:disputeId', auth.requireAdmin, async (req, res) => {
    try {
      const { disputeId } = req.params;
      
      const result = await disputeModule.getDisputeDetails(disputeId);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Dispute details retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Generate neutral summary
  router.post('/:disputeId/summary', auth.requireAdmin, async (req, res) => {
    try {
      const { disputeId } = req.params;
      
      const result = await disputeModule.generateNeutralSummary(disputeId);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Dispute summary generation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add evidence to dispute
  router.post('/:disputeId/evidence', auth.requireAdmin, async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { evidenceType, evidenceData } = req.body;
      const uploadedBy = req.user?.id || 'system';
      
      if (!evidenceType || !evidenceData) {
        return res.status(400).json({ 
          error: 'Evidence type and data are required' 
        });
      }

      const result = await disputeModule.addEvidence(disputeId, evidenceType, evidenceData, uploadedBy);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Evidence addition failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update dispute status (owner action)
  router.post('/:disputeId/resolve', auth.requireAdmin, async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { status, resolutionNote } = req.body;
      const updatedBy = req.user?.id || 'system';
      
      if (!status) {
        return res.status(400).json({ 
          error: 'Status is required' 
        });
      }

      const result = await disputeModule.updateDisputeStatus(disputeId, status, resolutionNote, updatedBy);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Dispute status update failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get dispute patterns
  router.get('/patterns', auth.requireAdmin, async (req, res) => {
    try {
      // Analyze dispute patterns across all partners
      const patterns = db.prepare(`
        SELECT 
          reason,
          COUNT(*) as dispute_count,
          COUNT(DISTINCT partner_id) as affected_partners,
          AVG(CASE 
            WHEN created_at >= datetime('now', '-7 days') THEN 1 
            WHEN created_at >= datetime('now', '-30 days') THEN 0.5 
            ELSE 0.1 
          END) as recency_score
        FROM disputes 
        WHERE created_at >= datetime('now', '-90 days')
        GROUP BY reason
        HAVING COUNT(*) >= 2
        ORDER BY dispute_count DESC, affected_partners DESC
      `).all();

      const formattedPatterns = patterns.map(pattern => ({
        patternId: `pattern_${pattern.reason.toLowerCase().replace(/\s+/g, '_')}`,
        description: pattern.reason,
        affectedPartners: pattern.affected_partners,
        severity: pattern.dispute_count > 5 ? 'high' : 
                  pattern.dispute_count > 2 ? 'medium' : 'low',
        firstSeen: this.getOldestDisputeDate(pattern.reason)
      }));

      res.json({
        success: true,
        data: {
          patterns: formattedPatterns,
          totalPatterns: formattedPatterns.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Dispute pattern analysis failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper function to get oldest dispute date for a reason
  function getOldestDisputeDate(reason) {
    try {
      const oldest = db.prepare(`
        SELECT MIN(created_at) as oldest_date
        FROM disputes 
        WHERE reason = ?
      `).get(reason);

      return oldest?.oldest_date || new Date().toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  return router;
}

module.exports = { createDisputeRouter };
