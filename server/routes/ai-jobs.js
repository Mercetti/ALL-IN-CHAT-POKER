/**
 * AI Jobs API Routes
 * Handles submitting and managing AI processing jobs
 */

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

function createAIJobsRouter({ db, auth }) {
  const router = Router();

  // Submit new AI job
  router.post('/jobs', auth.requireUser, async (req, res) => {
    try {
      const { job_type, parameters } = req.body;
      const userId = auth.extractUserLogin(req);

      // Validate job type
      const validJobTypes = ['cosmetic_generation', 'card_design', 'chip_style', 'avatar_creation'];
      if (!validJobTypes.includes(job_type)) {
        return res.status(400).json({ error: 'Invalid job type' });
      }

      // Create job
      const jobId = uuidv4();
      const query = `
        INSERT INTO ai_jobs (id, user_id, job_type, parameters, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `;

      const result = await db.query(query, [jobId, userId, job_type, JSON.stringify(parameters)]);

      logger.info('AI job submitted', { jobId, userId, job_type });

      res.json({
        success: true,
        job: result.rows[0]
      });

    } catch (error) {
      logger.error('Failed to submit AI job', { error: error.message });
      res.status(500).json({ error: 'Failed to submit job' });
    }
  });

  // Get user's AI jobs
  router.get('/jobs', auth.requireUser, async (req, res) => {
    try {
      const userId = auth.extractUserLogin(req);
      const { status, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT * FROM ai_jobs 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        success: true,
        jobs: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      logger.error('Failed to get AI jobs', { error: error.message });
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  });

  // Get job status
  router.get('/jobs/:jobId', auth.requireUser, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = auth.extractUserLogin(req);

      const query = `
        SELECT * FROM ai_jobs 
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [jobId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        success: true,
        job: result.rows[0]
      });

    } catch (error) {
      logger.error('Failed to get AI job', { error: error.message });
      res.status(500).json({ error: 'Failed to get job' });
    }
  });

  // Get AI generated assets
  router.get('/assets', auth.requireUser, async (req, res) => {
    try {
      const userId = auth.extractUserLogin(req);
      const { asset_type, limit = 20 } = req.query;

      let query = `
        SELECT * FROM ai_generated_assets 
        WHERE created_by = $1
      `;
      const params = [userId];

      if (asset_type) {
        query += ' AND asset_type = $2';
        params.push(asset_type);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await db.query(query, params);

      res.json({
        success: true,
        assets: result.rows
      });

    } catch (error) {
      logger.error('Failed to get AI assets', { error: error.message });
      res.status(500).json({ error: 'Failed to get assets' });
    }
  });

  // Cancel pending job
  router.delete('/jobs/:jobId', auth.requireUser, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = auth.extractUserLogin(req);

      const query = `
        UPDATE ai_jobs 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'pending'
        RETURNING *
      `;

      const result = await db.query(query, [jobId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
      }

      logger.info('AI job cancelled', { jobId, userId });

      res.json({
        success: true,
        job: result.rows[0]
      });

    } catch (error) {
      logger.error('Failed to cancel AI job', { error: error.message });
      res.status(500).json({ error: 'Failed to cancel job' });
    }
  });

  // Get AI worker status
  router.get('/worker/status', auth.requireAdmin, async (req, res) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_jobs,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs
        FROM ai_jobs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `;

      const result = await db.query(query);

      res.json({
        success: true,
        status: result.rows[0],
        worker_active: true
      });

    } catch (error) {
      logger.error('Failed to get worker status', { error: error.message });
      res.status(500).json({ error: 'Failed to get worker status' });
    }
  });

  return router;
}

module.exports = { createAIJobsRouter };
