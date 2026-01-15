/**
 * Investor Dashboard API Routes
 * Provides read-only investor metrics and dashboards
 */

const express = require('express');
const investor = require('../investor');
const auth = require('../auth');
const logger = require('../logger');

function createInvestorRouter({ db, logger: loggerParam }) {
  const router = express.Router();

  // Get monthly investor dashboard
  router.get('/dashboard', async (req, res) => {
    try {
      const { month } = req.query;
      
      // Validate read-only access token
      const tokenValidation = await validateInvestorAccess(req);
      if (!tokenValidation.success) {
        return res.status(401).json({ 
          error: 'Valid investor token required' 
        });
      }

      const result = await investor.getMonthlyDashboard(month);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Investor dashboard retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get Q&A summary for investors
  router.get('/qa-summary', async (req, res) => {
    try {
      const { month } = req.query;
      
      // Validate read-only access token
      const tokenValidation = await validateInvestorAccess(req);
      if (!tokenValidation.success) {
        return res.status(401).json({ 
          error: 'Valid investor token required' 
        });
      }

      const result = await investor.getQASummary(month);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Q&A summary retrieval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Log investor question (for clustering)
  router.post('/qa-log', auth.requireAdmin, async (req, res) => {
    try {
      const { question, answer } = req.body;
      
      if (!question || !answer) {
        return res.status(400).json({ 
          error: 'Question and answer are required' 
        });
      }

      const result = await investor.logInvestorQuestion(question, answer);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Q&A logging failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create investor access token
  router.post('/token/create', auth.requireAdmin, async (req, res) => {
    try {
      const { createdBy, expiresInDays = 30 } = req.body;
      
      if (!createdBy) {
        return res.status(400).json({ 
          error: 'Created by is required' 
        });
      }

      const result = await investor.createInvestorToken(createdBy, expiresInDays);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      logger.error('Investor token creation failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Validate investor token middleware helper
  async function validateInvestorAccess(req) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'No authorization header' };
      }

      const tokenHash = authHeader.replace('Bearer ', '').trim();
      const result = await investor.validateInvestorToken(tokenHash);

      if (result.success) {
        // Add token info to request for downstream use
        req.investorToken = result.token;
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Token validation failed' };
    }
  }

  return router;
}

module.exports = { createInvestorRouter };
