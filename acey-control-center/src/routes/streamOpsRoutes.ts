/**
 * Stream Ops Pro API Routes
 * Backend endpoints for the monetized skill
 */

import express from 'express';
import { streamOpsProSkill } from '../services/streamOpsProSkill';
import { monetizationService } from '../services/monetizationService';

const router = express.Router();

/**
 * GET /stream-ops/manifest
 * Get skill manifest and store listing
 */
router.get('/manifest', (req, res) => {
  try {
    const manifest = streamOpsProSkill.getManifest();
    const listing = streamOpsProSkill.getSkillStoreListing();
    
    res.json({
      success: true,
      data: {
        manifest,
        listing
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get skill manifest'
    });
  }
});

/**
 * POST /stream-ops/simulation
 * Run install simulation
 */
router.post('/simulation', async (req, res) => {
  try {
    const { tenantId, historicalData } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }
    
    const simulationResult = await streamOpsProSkill.runInstallSimulation(
      tenantId,
      historicalData || []
    );
    
    res.json({
      success: true,
      data: simulationResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Simulation failed'
    });
  }
});

/**
 * POST /stream-ops/subscribe
 * Subscribe to Stream Ops Pro
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { tenantId, planId } = req.body;
    
    if (!tenantId || !planId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and plan ID required'
      });
    }
    
    // Check if tenant can install skill
    const canInstall = monetizationService.canPerformAction(tenantId, 'install_skill');
    if (!canInstall.allowed) {
      return res.status(403).json({
        success: false,
        error: canInstall.reason
      });
    }
    
    // Create subscription for the skill
    const subscription = await monetizationService.createSubscription(tenantId, planId);
    
    // Record usage
    monetizationService.recordUsage(tenantId, {
      skillsInstalled: 1
    });
    
    res.json({
      success: true,
      data: {
        subscription,
        skillId: streamOpsProSkill.getManifest().id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Subscription failed'
    });
  }
});

/**
 * POST /stream-ops/monitor/start
 * Start monitoring a stream
 */
router.post('/monitor/start', async (req, res) => {
  try {
    const { tenantId, streamId } = req.body;
    
    if (!tenantId || !streamId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and stream ID required'
      });
    }
    
    // Check subscription
    const subscription = monetizationService.getSubscription(tenantId);
    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required'
      });
    }
    
    await streamOpsProSkill.startStreamMonitoring(streamId, tenantId);
    
    res.json({
      success: true,
      data: { message: 'Stream monitoring started' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring'
    });
  }
});

/**
 * POST /stream-ops/monitor/detect
 * Detect issues in stream
 */
router.post('/monitor/detect', async (req, res) => {
  try {
    const { tenantId, streamId, systemStatus, logs } = req.body;
    
    if (!tenantId || !streamId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and stream ID required'
      });
    }
    
    const issues = await streamOpsProSkill.detectIssues(
      streamId,
      systemStatus || {},
      logs || []
    );
    
    // Send alerts for critical issues
    for (const issue of issues) {
      if (issue.severity === 'HIGH' || issue.severity === 'CRITICAL') {
        await streamOpsProSkill.sendAlert(tenantId, issue);
      }
    }
    
    res.json({
      success: true,
      data: { issues }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Issue detection failed'
    });
  }
});

/**
 * GET /stream-ops/issues/:issueId/suggestions
 * Get fix suggestions for an issue
 */
router.get('/issues/:issueId/suggestions', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { issueId } = req.params;
    
    if (!tenantId || !issueId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and issue ID required'
      });
    }
    
    const suggestions = await streamOpsProSkill.suggestFixes(tenantId as string, issueId);
    
    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

/**
 * POST /stream-ops/issues/:issueId/fix
 * Execute a fix for an issue
 */
router.post('/issues/:issueId/fix', async (req, res) => {
  try {
    const { tenantId, fixIndex, approvalToken } = req.body;
    const { issueId } = req.params;
    
    if (!tenantId || !issueId || fixIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID, issue ID, and fix index required'
      });
    }
    
    const success = await streamOpsProSkill.executeFix(
      tenantId,
      issueId,
      fixIndex,
      approvalToken
    );
    
    // Record usage
    monetizationService.recordUsage(tenantId, {
      actionsUsed: 1
    });
    
    res.json({
      success: true,
      data: { success }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Fix execution failed'
    });
  }
});

/**
 * GET /stream-ops/report/:streamId
 * Generate post-stream report
 */
router.get('/report/:streamId', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { streamId } = req.params;
    
    if (!tenantId || !streamId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and stream ID required'
      });
    }
    
    const report = await streamOpsProSkill.generateStreamReport(
      streamId,
      tenantId as string
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Report generation failed'
    });
  }
});

/**
 * GET /stream-ops/metrics
 * Get skill metrics for investors
 */
router.get('/metrics', async (req, res) => {
  try {
    const { tenantId, period } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }
    
    const metrics = await streamOpsProSkill.getSkillMetrics(
      tenantId as string,
      period as string
    );
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

/**
 * GET /stream-ops/health
 * Health check for the skill service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      skill: streamOpsProSkill.getManifest().name,
      version: streamOpsProSkill.getManifest().version,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
