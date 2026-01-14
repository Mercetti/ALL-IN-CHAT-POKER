const express = require('express');
const { auth } = require('../auth-contract');
const logger = require('../logger');
const db = require('../db');

function createUnlockRouter({ db: dbParam, logger: loggerParam }) {
  const router = express.Router();

  // Stage 1: Request unlock ceremony
  router.post('/request', auth.requireOwner, async (req, res) => {
    try {
      const { device_id, owner_id, reason } = req.body;
      
      if (!device_id || !owner_id) {
        return res.status(400).json({ error: 'Device ID and owner ID required' });
      }

      // Verify device is paired and trusted
      const device = db.prepare('SELECT * FROM devices WHERE device_id = ? AND is_trusted = 1').get(device_id);
      if (!device) {
        return res.status(403).json({ error: 'Device not paired or not trusted' });
      }

      // Verify owner authority
      const owner = db.prepare('SELECT * FROM users WHERE id = ? AND role = "owner"').get(owner_id);
      if (!owner) {
        return res.status(403).json({ error: 'Owner authority required' });
      }

      // Create unlock request
      const unlockId = `unlock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const unlockRequest = {
        id: unlockId,
        device_id,
        owner_id,
        reason: reason || 'Manual unlock request',
        stage: 'BIOMETRIC_PENDING',
        created_at: Date.now(),
        expires_at: Date.now() + (5 * 60 * 1000), // 5 minutes expiry
        status: 'PENDING'
      };

      db.prepare(`
        INSERT INTO unlock_requests (
          id, device_id, owner_id, reason, stage, created_at, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        unlockRequest.id,
        unlockRequest.device_id,
        unlockRequest.owner_id,
        unlockRequest.reason,
        unlockRequest.stage,
        unlockRequest.created_at,
        unlockRequest.expires_at,
        unlockRequest.status
      );

      logger.info('Unlock ceremony requested', { unlockId, device_id, owner_id, reason });

      res.json({
        success: true,
        unlock_id: unlockId,
        stage: 'BIOMETRIC_PENDING',
        expires_at: unlockRequest.expires_at
      });

    } catch (error) {
      logger.error('Failed to request unlock ceremony', { error: error.message });
      res.status(500).json({ error: 'Failed to request unlock ceremony' });
    }
  });

  // Stage 2: Biometric confirmation
  router.post('/biometric-confirm', auth.requireOwner, async (req, res) => {
    try {
      const { unlock_id, biometric_verified, device_id, timestamp } = req.body;

      if (!unlock_id || !biometric_verified || !device_id || !timestamp) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify unlock request exists and is valid
      const request = db.prepare('SELECT * FROM unlock_requests WHERE id = ? AND status = "PENDING"').get(unlock_id);
      if (!request) {
        return res.status(404).json({ error: 'Invalid or expired unlock request' });
      }

      // Verify biometric freshness (within 30 seconds)
      const now = Date.now();
      const biometricAge = now - timestamp;
      if (biometricAge > 30000) {
        return res.status(400).json({ error: 'Biometric verification expired' });
      }

      // Verify device matches request
      if (request.device_id !== device_id) {
        return res.status(403).json({ error: 'Device mismatch' });
      }

      // Update request stage
      db.prepare('UPDATE unlock_requests SET stage = ?, status = ? WHERE id = ?')
        .run('TIME_DELAY_PENDING', 'PENDING', unlock_id);

      // Start 60-second time delay
      setTimeout(() => {
        db.prepare('UPDATE unlock_requests SET stage = ?, status = ? WHERE id = ?')
          .run('DESKTOP_CONFIRMATION_PENDING', 'PENDING', unlock_id);
        
        logger.info('Unlock ceremony ready for desktop confirmation', { unlock_id });
      }, 60000);

      logger.info('Biometric confirmed for unlock ceremony', { unlock_id });

      res.json({
        success: true,
        stage: 'TIME_DELAY_PENDING',
        message: 'Biometric confirmed. Waiting for time delay...'
      });

    } catch (error) {
      logger.error('Failed to confirm biometric', { error: error.message });
      res.status(500).json({ error: 'Failed to confirm biometric' });
    }
  });

  // Stage 3: Desktop confirmation
  router.post('/desktop-confirm', auth.requireOwner, async (req, res) => {
    try {
      const { unlock_id, confirmed } = req.body;

      if (!unlock_id) {
        return res.status(400).json({ error: 'Unlock ID required' });
      }

      const request = db.prepare('SELECT * FROM unlock_requests WHERE id = ? AND status = "PENDING"').get(unlock_id);
      if (!request) {
        return res.status(404).json({ error: 'Invalid or expired unlock request' });
      }

      if (!confirmed) {
        // Cancel the unlock request
        db.prepare('UPDATE unlock_requests SET status = ? WHERE id = ?')
          .run('CANCELLED', unlock_id);
        
        return res.json({ success: false, message: 'Unlock request cancelled' });
      }

      // Move to integrity check stage
      db.prepare('UPDATE unlock_requests SET stage = ?, status = ? WHERE id = ?')
        .run('INTEGRITY_CHECK_PENDING', 'PENDING', unlock_id);

      logger.info('Desktop confirmation received for unlock ceremony', { unlock_id });

      res.json({
        success: true,
        stage: 'INTEGRITY_CHECK_PENDING',
        message: 'Desktop confirmed. Running integrity checks...'
      });

    } catch (error) {
      logger.error('Failed to confirm desktop', { error: error.message });
      res.status(500).json({ error: 'Failed to confirm desktop' });
    }
  });

  // Stage 4: Integrity check
  router.post('/integrity-check', auth.requireOwner, async (req, res) => {
    try {
      const { unlock_id } = req.body;

      if (!unlock_id) {
        return res.status(400).json({ error: 'Unlock ID required' });
      }

      const request = db.prepare('SELECT * FROM unlock_requests WHERE id = ? AND status = "PENDING"').get(unlock_id);
      if (!request) {
        return res.status(404).json({ error: 'Invalid or expired unlock request' });
      }

      // Run integrity checks
      const integrityResults = await performIntegrityChecks(db);

      const allChecksPassed = integrityResults.every(result => result.passed);

      if (!allChecksPassed) {
        // Mark unlock as failed
        db.prepare('UPDATE unlock_requests SET status = ?, stage = ?, results = ? WHERE id = ?')
          .run('FAILED', 'INTEGRITY_CHECK_FAILED', JSON.stringify(integrityResults), unlock_id);
        
        logger.error('Integrity checks failed for unlock ceremony', { unlock_id, results: integrityResults });
        
        return res.json({
          success: false,
          stage: 'INTEGRITY_CHECK_FAILED',
          results: integrityResults,
          message: 'Integrity checks failed. Unlock denied.'
        });
      }

      // Move to rehydration stage
      db.prepare('UPDATE unlock_requests SET stage = ?, status = ?, results = ? WHERE id = ?')
        .run('REHYDRATION_PENDING', 'PENDING', JSON.stringify(integrityResults), unlock_id);

      logger.info('Integrity checks passed for unlock ceremony', { unlock_id });

      res.json({
        success: true,
        stage: 'REHYDRATION_PENDING',
        results: integrityResults,
        message: 'Integrity checks passed. Starting rehydration...'
      });

    } catch (error) {
      logger.error('Failed to perform integrity checks', { error: error.message });
      res.status(500).json({ error: 'Failed to perform integrity checks' });
    }
  });

  // Stage 5: Complete unlock
  router.post('/complete', auth.requireOwner, async (req, res) => {
    try {
      const { unlock_id, rehydration_mode } = req.body;

      if (!unlock_id) {
        return res.status(400).json({ error: 'Unlock ID required' });
      }

      const request = db.prepare('SELECT * FROM unlock_requests WHERE id = ? AND status = "PENDING"').get(unlock_id);
      if (!request) {
        return res.status(404).json({ error: 'Invalid or expired unlock request' });
      }

      // Perform gradual rehydration
      const rehydrationResult = await performRehydration(db, rehydration_mode || 'SAFE');

      // Mark unlock as completed
      db.prepare('UPDATE unlock_requests SET status = ?, stage = ?, completed_at = ?, rehydration_result = ? WHERE id = ?')
        .run('COMPLETED', 'COMPLETED', Date.now(), JSON.stringify(rehydrationResult), unlock_id);

      // Log the unlock event
      const unlockEvent = {
        type: 'OWNER_UNLOCK',
        method: ['biometric', 'desktop'],
        result: 'SUCCESS',
        timestamp: Date.now(),
        unlock_id,
        device_id: request.device_id,
        owner_id: request.owner_id,
        reason: request.reason,
        rehydration_mode,
        integrity_checks: JSON.parse(request.results || '[]'),
        rehydration_result: rehydrationResult
      };

      db.prepare(`
        INSERT INTO audit_events (id, time, type, summary, trust_impact, metadata, severity, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `unlock_${Date.now()}`,
        unlockEvent.timestamp,
        unlockEvent.type,
        'Owner unlock ceremony completed',
        0.1, // Positive trust impact
        JSON.stringify(unlockEvent),
        'LOW',
        'SECURITY'
      );

      logger.info('Unlock ceremony completed successfully', { unlock_id, rehydrationResult });

      res.json({
        success: true,
        stage: 'COMPLETED',
        rehydration_result,
        message: 'Unlock ceremony completed. System is now online.'
      });

    } catch (error) {
      logger.error('Failed to complete unlock ceremony', { error: error.message });
      res.status(500).json({ error: 'Failed to complete unlock ceremony' });
    }
  });

  // Get unlock request status
  router.get('/status/:unlock_id', auth.requireOwner, async (req, res) => {
    try {
      const { unlock_id } = req.params;

      const request = db.prepare('SELECT * FROM unlock_requests WHERE id = ?').get(unlock_id);
      if (!request) {
        return res.status(404).json({ error: 'Unlock request not found' });
      }

      res.json({
        success: true,
        request: {
          id: request.id,
          stage: request.stage,
          status: request.status,
          created_at: request.created_at,
          expires_at: request.expires_at,
          reason: request.reason,
          results: request.results ? JSON.parse(request.results) : null
        }
      });

    } catch (error) {
      logger.error('Failed to get unlock status', { error: error.message });
      res.status(500).json({ error: 'Failed to get unlock status' });
    }
  });

  // Cancel unlock request
  router.post('/cancel/:unlock_id', auth.requireOwner, async (req, res) => {
    try {
      const { unlock_id } = req.params;

      const request = db.prepare('SELECT * FROM unlock_requests WHERE id = ? AND status = "PENDING"').get(unlock_id);
      if (!request) {
        return res.status(404).json({ error: 'Unlock request not found or already processed' });
      }

      db.prepare('UPDATE unlock_requests SET status = ? WHERE id = ?')
        .run('CANCELLED', unlock_id);

      logger.info('Unlock ceremony cancelled', { unlock_id });

      res.json({
        success: true,
        message: 'Unlock request cancelled'
      });

    } catch (error) {
      logger.error('Failed to cancel unlock request', { error: error.message });
      res.status(500).json({ error: 'Failed to cancel unlock request' });
    }
  });

  return router;
}

async function performIntegrityChecks(db: any) {
  const checks = [];

  // Check memory corruption
  try {
    const memoryCheck = db.prepare('SELECT COUNT(*) as count FROM memory WHERE corrupted = 1').get();
    checks.push({
      name: 'memory_corruption',
      passed: memoryCheck.count === 0,
      details: memoryCheck.count === 0 ? 'No corrupted memory entries' : `Found ${memoryCheck.count} corrupted entries`
    });
  } catch (error) {
    checks.push({
      name: 'memory_corruption',
      passed: false,
      details: `Error checking memory: ${error.message}`
    });
  }

  // Check rule validation
  try {
    const ruleCheck = db.prepare('SELECT COUNT(*) as count FROM rules WHERE is_valid = 0').get();
    checks.push({
      name: 'rule_validation',
      passed: ruleCheck.count === 0,
      details: ruleCheck.count === 0 ? 'All rules are valid' : `Found ${ruleCheck.count} invalid rules`
    });
  } catch (error) {
    checks.push({
      name: 'rule_validation',
      passed: false,
      details: `Error checking rules: ${error.message}`
    });
  }

  // Check trust graph integrity
  try {
    const trustCheck = db.prepare('SELECT COUNT(*) as count FROM trust_graph WHERE integrity_score < 0.5').get();
    checks.push({
      name: 'trust_graph_integrity',
      passed: trustCheck.count === 0,
      details: trustCheck.count === 0 ? 'Trust graph integrity is good' : `Found ${trustCheck.count} low-integrity nodes`
    });
  } catch (error) {
    checks.push({
      name: 'trust_graph_integrity',
      passed: false,
      details: `Error checking trust graph: ${error.message}`
    });
  }

  // Check database schema integrity
  try {
    const schemaCheck = db.prepare('SELECT name FROM sqlite_master WHERE type = "table"').all();
    const requiredTables = ['users', 'devices', 'memory', 'rules', 'trust_graph', 'audit_events', 'unlock_requests'];
    const missingTables = requiredTables.filter(table => !schemaCheck.some(row => row.name === table));
    
    checks.push({
      name: 'database_schema',
      passed: missingTables.length === 0,
      details: missingTables.length === 0 ? 'Database schema is complete' : `Missing tables: ${missingTables.join(', ')}`
    });
  } catch (error) {
    checks.push({
      name: 'database_schema',
      passed: false,
      details: `Error checking database schema: ${error.message}`
    });
  }

  return checks;
}

async function performRehydration(db: any, mode: string = 'SAFE') {
  const result = {
    mode,
    timestamp: Date.now(),
    actions: [],
    warnings: [],
    errors: []
  };

  try {
    // Restore limited permissions
    if (mode === 'SAFE' || mode === 'LIMITED') {
      db.prepare('UPDATE user_permissions SET status = "LIMITED" WHERE scope != "READ_ONLY"').run();
      result.actions.push('Limited user permissions to safe operations');
    }

    // Disable auto-rules temporarily
    db.prepare('UPDATE rules SET enabled = 0 WHERE auto_execute = 1').run();
    result.actions.push('Disabled auto-rules during rehydration');

    // Reset trust scores to baseline
    db.prepare('UPDATE trust_graph SET integrity_score = MAX(0.5, integrity_score * 0.8)').run();
    result.actions.push('Reduced trust scores to safe baseline');

    // Clear any pending high-risk operations
    db.prepare('DELETE FROM pending_operations WHERE risk_level IN ("HIGH", "CRITICAL")').run();
    result.actions.push('Cleared pending high-risk operations');

    // Set system to safe mode
    db.prepare('INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)').run('mode', mode);
    result.actions.push(`Set system mode to ${mode}`);

    logger.info('System rehydration completed', { mode, result });

  } catch (error) {
    result.errors.push(`Rehydration error: ${error.message}`);
    logger.error('Failed to perform system rehydration', { error: error.message });
  }

  return result;
}

module.exports = { createUnlockRouter };
