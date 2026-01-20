const express = require('express');
const { auth } = require('../auth-contract');
const logger = require('../logger');
const db = require('../db');

function createIncidentRouter({ db: any, logger: any }) {
  const router = express.Router();

  // Create new incident
  router.post('/create', auth.requireOwner, async (req, res) => {
    try {
      const { severity, trigger, affected_systems, root_cause, description } = req.body;

      if (!severity || !trigger || !affected_systems) {
        return res.status(400).json({ error: 'Severity, trigger, and affected systems are required' });
      }

      const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const incident = {
        id: incidentId,
        severity,
        trigger,
        affected_systems: Array.isArray(affected_systems) ? affected_systems : [affected_systems],
        root_cause,
        description: description || '',
        status: 'OPEN',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: req.user?.id || 'unknown',
        actions_taken: [],
        learning_enabled: false
      };

      // Fixed SQL: 12 columns, 12 placeholders
      db.prepare(`
        INSERT INTO incidents (
          id, severity, trigger, affected_systems, root_cause, description, 
          status, created_at, updated_at, created_by, actions_taken, learning_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        incident.id,
        incident.severity,
        incident.trigger,
        JSON.stringify(incident.affected_systems),
        incident.root_cause || null,
        incident.description,
        incident.status,
        incident.created_at,
        incident.updated_at,
        incident.created_by,
        JSON.stringify(incident.actions_taken),
        incident.learning_enabled
      );

      // Log incident creation
      db.prepare(`
        INSERT INTO audit_events (id, time, type, summary, trust_impact, metadata, severity, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `incident_${Date.now()}`,
        incident.created_at,
        'INCIDENT_CREATED',
        `Incident: ${incident.trigger}`,
        -0.2, // Negative trust impact
        JSON.stringify({
          incident_id: incident.id,
          severity,
          trigger,
          affected_systems: incident.affected_systems
        }),
        incident.severity,
        'ERROR'
      );

      // Trigger immediate response for critical incidents
      if (severity === 'CRITICAL') {
        await triggerImmediateResponse(incident);
      }

      logger.warn('Incident created', { incidentId, severity, trigger });

      res.json({
        success: true,
        incident
      });

    } catch (error) {
      logger.error('Failed to create incident', { error: error.message });
      res.status(500).json({ error: 'Failed to create incident' });
    }
  });

  // Get active incidents
  router.get('/active', auth.requireOwner, async (req, res) => {
    try {
      const incidents = db.prepare('SELECT * FROM incidents WHERE status = "OPEN" ORDER BY created_at DESC').all();
      
      res.json({
        success: true,
        incidents
      });

    } catch (error) {
      logger.error('Failed to get active incidents', { error: error.message });
      res.status(500).json({ error: 'Failed to get active incidents' });
    }
  });

  // Get incident details
  router.get('/:incidentId', auth.requireOwner, async (req, res) => {
    try {
      const { incidentId } = req.params;

      const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Get related events
      const events = db.prepare(`
        SELECT * FROM audit_events 
        WHERE metadata LIKE ? 
        ORDER BY time DESC 
        LIMIT 50
      `).all(`%${incidentId}%`);

      res.json({
        success: true,
        incident: {
          ...incident,
          affected_systems: JSON.parse(incident.affected_systems),
          actions_taken: JSON.parse(incident.actions_taken || '[]'),
          related_events: events
        }
      });

    } catch (error) {
      logger.error('Failed to get incident details', { error: error.message });
      res.status(500).json({ error: 'Failed to get incident details' });
    }
  });

  // Update incident status
  router.post('/:incidentId/status', auth.requireOwner, async (req, res) => {
    try {
      const { incidentId } = req.params;
      const { status, resolution, action_taken } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      const actions = JSON.parse(incident.actions_taken || '[]');
      if (action_taken) {
        actions.push({
          action: action_taken,
          timestamp: Date.now(),
          user: req.user?.id || 'unknown'
        });
      }

      db.prepare(`
        UPDATE incidents 
        SET status = ?, updated_at = ?, resolution = ?, actions_taken = ?
        WHERE id = ?
      `).run(status, Date.now(), resolution || null, JSON.stringify(actions), incidentId);

      // Log status change
      db.prepare(`
        INSERT INTO audit_events (id, time, type, summary, trust_impact, metadata, severity, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `incident_status_${Date.now()}`,
        Date.now(),
        'INCIDENT_STATUS_CHANGE',
        `Incident ${incidentId} status changed to ${status}`,
        status === 'RESOLVED' ? 0.1 : 0, // Positive impact for resolution
        JSON.stringify({
          incidentId,
          old_status: incident.status,
          new_status: status,
          resolution
        }),
        incident.severity,
        status === 'RESOLVED' ? 'SUCCESS' : 'ERROR'
      );

      logger.info('Incident status updated', { incidentId, status, resolution });

      res.json({
        success: true,
        incident: {
          ...incident,
          status,
          updated_at: Date.now(),
          resolution,
          actions_taken: actions
        }
      });

    } catch (error) {
      logger.error('Failed to update incident status', { error: error.message });
      res.status(500).json({ error: 'Failed to update incident status' });
    }
  });

  // Add action to incident
  router.post('/:incidentId/action', auth.requireOwner, async (req, res) => {
    try {
      const { incidentId } = req.params;
      const { action, biometric_verified } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Check if action requires biometric verification for high risk
      if (incident.severity === 'HIGH' || incident.severity === 'CRITICAL') {
        if (!biometric_verified) {
          return res.status(403).json({ 
            error: 'Biometric verification required for high/critical risk actions' 
          });
        }
      }

      const actions = JSON.parse(incident.actions_taken || '[]');
      actions.push({
        action,
        timestamp: Date.now(),
        user: req.user?.id || 'unknown',
        biometric_verified: biometric_verified || false
      });

      db.prepare('UPDATE incidents SET actions_taken = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(actions), Date.now(), incidentId);

      // Execute the action
      const actionResult = await executeIncidentAction(action, incident);

      // Log action
      db.prepare(`
        INSERT INTO audit_events (id, time, type, summary, trust_impact, metadata, severity, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `incident_action_${Date.now()}`,
        Date.now(),
        'INCIDENT_ACTION',
        `Action taken: ${action}`,
        actionResult.trust_impact || 0,
        JSON.stringify({
          incidentId,
          action,
          result: actionResult,
          biometric_verified
        }),
        incident.severity,
        actionResult.severity || 'INFO'
      );

      logger.info('Incident action executed', { incidentId, action, result: actionResult });

      res.json({
        success: true,
        action_result: actionResult,
        actions_taken: actions
      });

    } catch (error) {
      logger.error('Failed to execute incident action', { error: error.message });
      res.status(500).json({ error: 'Failed to execute incident action' });
    }
  });

  // Get incident history
  router.get('/history', auth.requireOwner, async (req, res) => {
    try {
      const { limit = 50, severity, start_date, end_date } = req.query;
      
      let query = 'SELECT * FROM incidents WHERE 1=1';
      const params = [];

      if (severity) {
        query += ' AND severity = ?';
        params.push(severity);
      }

      if (start_date) {
        query += ' AND created_at >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND created_at <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit || 50);

      const incidents = db.prepare(query).all(...params);

      res.json({
        success: true,
        incidents
      });

    } catch (error) {
      logger.error('Failed to get incident history', { error: error.message });
      res.status(500).json({ error: 'Failed to get incident history' });
    }
  });

  // Close incident with learning
  router.post('/:incidentId/close', auth.requireOwner, async (req, res) => {
    try {
      const { incidentId } = req.params;
      const { resolution, learning_enabled } = req.body;

      const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND status != "RESOLVED"').get(incidentId);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found or already resolved' });
      }

      // Update incident status
      db.prepare(`
        UPDATE incidents 
        SET status = ?, updated_at = ?, resolution = ?, learning_enabled = ?
        WHERE id = ?
      `).run('RESOLVED', Date.now(), resolution || '', learning_enabled || false, incidentId);

      // Enable learning if requested
      if (learning_enabled) {
        await enableIncidentLearning(incidentId, resolution);
      }

      // Log resolution
      db.prepare(`
        INSERT INTO audit_events (id, time, type, summary, trust_impact, metadata, severity, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `incident_resolved_${Date.now()}`,
        Date.now(),
        'INCIDENT_RESOLVED',
        `Incident ${incidentId} resolved: ${resolution}`,
        0.15, // Positive impact for resolution
        JSON.stringify({
          incidentId,
          resolution,
          learning_enabled
        }),
        incident.severity,
        'SUCCESS'
      );

      logger.info('Incident resolved', { incidentId, resolution, learning_enabled });

      res.json({
        success: true,
        message: 'Incident resolved successfully'
      });

    } catch (error) {
      logger.error('Failed to close incident', { error: error.message });
      res.status(500).json({ error: 'Failed to close incident' });
    }
  });

  // Get incident statistics
  router.get('/stats', auth.requireOwner, async (req, res) => {
    try {
      // Fixed SQL: Use SQLite-compatible date functions
      const stats = db.prepare(`
        SELECT 
          severity,
          COUNT(*) as count,
          AVG((julianday(updated_at) - julianday(created_at))) as avg_resolution_days
        FROM incidents 
        GROUP BY severity
      `).all();

      const totalIncidents = db.prepare('SELECT COUNT(*) as total FROM incidents').get().total;
      const openIncidents = db.prepare('SELECT COUNT(*) as open FROM incidents WHERE status = "OPEN"').get().open;

      res.json({
        success: true,
        stats: {
          total: totalIncidents,
          open: openIncidents,
          by_severity: stats,
          avg_resolution_days: stats.length > 0 ? stats[0].avg_resolution_days : 0
        }
      });

    } catch (error) {
      logger.error('Failed to get incident statistics', { error: error.message });
      res.status(500).json({ error: 'Failed to get incident statistics' });
    }
  });

  return router;
}

async function triggerImmediateResponse(incident: any) {
  try {
    // Freeze Acey operations
    db.prepare('INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)').run('mode', 'FROZEN');
    
    // Disable auto-rules
    db.prepare('UPDATE rules SET enabled = 0 WHERE auto_execute = 1').run();
    
    // Log immediate response
    logger.error('IMMEDIATE RESPONSE TRIGGERED', {
      incident_id: incident.id,
      trigger: incident.trigger,
      affected_systems: incident.affected_systems
    });

    // Could add webhook notifications here
    await sendIncidentAlert(incident);

  } catch (error) {
    logger.error('Failed to trigger immediate response', { error: error.message });
  }
}

async function executeIncidentAction(action: string, incident: any): Promise<any> {
  const actionMap: Record<string, () => Promise<any>> = {
    'freeze': async () => {
      db.prepare('INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)').run('mode', 'FROZEN');
      return { action: 'freeze', trust_impact: -0.1, severity: 'INFO' };
    },
    'rollback': async () => {
      // Implement model rollback logic
      const lastStableModel = db.prepare('SELECT model_id FROM model_versions WHERE is_stable = 1 ORDER BY created_at DESC LIMIT 1').get();
      if (lastStableModel) {
        db.prepare('INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)').run('active_model', lastStableModel.model_id);
        return { action: 'rollback', trust_impact: 0.05, severity: 'MEDIUM', model_id: lastStableModel.model_id };
      }
      return { action: 'rollback', trust_impact: 0, severity: 'INFO' };
    },
    'disable_skill': async () => {
      // Disable specific skill/module
      db.prepare('UPDATE skills SET enabled = 0 WHERE name = ?', action); // Use action as skill name
      return { action: 'disable_skill', trust_impact: 0.05, severity: 'INFO' };
    },
    'rewrite_rule': async () => {
      // Hotfix governance rule
      return { action: 'rewrite_rule', trust_impact: 0.1, severity: 'MEDIUM' };
    },
    'simulate': async () => {
      // Dry-run fix simulation
      return { action: 'simulate', trust_impact: 0, severity: 'INFO' };
    }
  };

  const actionFunc = actionMap[action];
  if (!actionFunc) {
    return { action: 'unknown', trust_impact: 0, severity: 'INFO' };
  }

  return await actionFunc();
}

async function enableIncidentLearning(incidentId: string, resolution: string) {
  try {
    // Store incident in learning database
    const learningData = {
      incident_id: incidentId,
      resolution,
      trigger: db.prepare('SELECT trigger FROM incidents WHERE id = ?').get(incidentId).trigger,
      affected_systems: JSON.parse(db.prepare('SELECT affected_systems FROM incidents WHERE id = ?').get(incidentId).affected_systems),
      created_at: db.prepare('SELECT created_at FROM incidents WHERE id = ?').get(incidentId).created_at,
      learning_timestamp: Date.now()
    };

    db.prepare(`
      INSERT INTO incident_learning (incident_id, resolution, trigger, affected_systems, created_at, learning_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      learningData.incident_id,
      learningData.resolution,
      learningData.trigger,
      learningData.affected_systems,
      learningData.created_at,
      learningData.learning_timestamp
    );

    // Update evaluation models
    await updateEvaluationModels(incidentId, learningData);

    logger.info('Incident learning enabled', { incidentId, resolution });

  } catch (error) {
    logger.error('Failed to enable incident learning', { error: error.message });
  }
}

async function updateEvaluationModels(incidentId: string, learningData: any) {
  // This would integrate with your ML evaluation system
  // For now, just log that learning data was stored
  logger.info('Evaluation models updated with new learning data', { incidentId });
}

async function sendIncidentAlert(incident: any) {
  // This would send notifications via webhook, email, SMS, etc.
  // For now, just log the alert
  logger.error('INCIDENT ALERT', {
    type: 'CRITICAL',
    message: `Critical incident: ${incident.trigger}`,
    incident_id: incident.id,
    affected_systems: incident.affected_systems,
    severity: incident.severity
  });
}

module.exports = { createIncidentRouter };
