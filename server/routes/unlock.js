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
        return res.status(404).json({ error: 'Device not found or not trusted' });
      }

      // Create unlock request
      const request_id = crypto.randomUUID();
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      db.prepare(`
        INSERT INTO unlock_requests (request_id, device_id, owner_id, reason, status, created_at, expires_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `).run(request_id, device_id, owner_id, reason, new Date().toISOString(), expires_at.toISOString());

      res.json({
        request_id,
        status: 'pending',
        expires_at: expires_at.toISOString()
      });

    } catch (error) {
      logger.error('Unlock request failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stage 2: Approve unlock (owner confirmation)
  router.post('/approve', auth.requireOwner, async (req, res) => {
    try {
      const { request_id, approved } = req.body;
      
      if (typeof approved !== 'boolean') {
        return res.status(400).json({ error: 'approved field must be boolean' });
      }

      // Update request status
      const result = db.prepare(`
        UPDATE unlock_requests 
        SET status = ?, approved_at = ?, approved_by = ?
        WHERE request_id = ? AND status = 'pending'
      `).run(approved ? 'approved' : 'rejected', new Date().toISOString(), req.user.id, request_id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Request not found or already processed' });
      }

      res.json({
        request_id,
        status: approved ? 'approved' : 'rejected'
      });

    } catch (error) {
      logger.error('Unlock approval failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stage 3: Execute unlock
  router.post('/execute', async (req, res) => {
    try {
      const { request_id, device_signature } = req.body;
      
      if (!request_id || !device_signature) {
        return res.status(400).json({ error: 'Request ID and device signature required' });
      }

      // Verify request is approved and not expired
      const request = db.prepare(`
        SELECT * FROM unlock_requests 
        WHERE request_id = ? AND status = 'approved' AND expires_at > datetime('now')
      `).get(request_id);

      if (!request) {
        return res.status(404).json({ error: 'Invalid or expired unlock request' });
      }

      // Verify device signature
      const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(request.device_id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // TODO: Implement proper signature verification
      // For now, just check if signature exists
      if (!device_signature) {
        return res.status(400).json({ error: 'Invalid device signature' });
      }

      // Perform unlock
      const unlock_token = crypto.randomUUID();
      const unlock_expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      db.prepare(`
        UPDATE devices 
        SET unlock_token = ?, unlock_expires = ?, last_unlocked_at = ?
        WHERE device_id = ?
      `).run(unlock_token, unlock_expires.toISOString(), new Date().toISOString(), request.device_id);

      // Mark request as completed
      db.prepare(`
        UPDATE unlock_requests 
        SET status = 'completed', completed_at = ?
        WHERE request_id = ?
      `).run(new Date().toISOString(), request_id);

      res.json({
        unlock_token,
        expires_at: unlock_expires.toISOString()
      });

    } catch (error) {
      logger.error('Unlock execution failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Check unlock status
  router.get('/status/:device_id', async (req, res) => {
    try {
      const { device_id } = req.params;
      
      const device = db.prepare('SELECT unlock_token, unlock_expires FROM devices WHERE device_id = ?').get(device_id);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const is_unlocked = device.unlock_token && new Date(device.unlock_expires) > new Date();
      
      res.json({
        device_id,
        is_unlocked,
        unlock_expires: device.unlock_expires
      });

    } catch (error) {
      logger.error('Unlock status check failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

async function performIntegrityChecks(db) {
  const checks = [];

  // Check memory corruption
  try {
    const memoryCheck = db.prepare('SELECT COUNT(*) as count FROM memory WHERE corrupted = 1').get();
    checks.push({
      name: 'memory_corruption',
      status: memoryCheck.count === 0 ? 'pass' : 'fail',
      details: `${memoryCheck.count} corrupted memory entries found`
    });
  } catch (error) {
    checks.push({
      name: 'memory_corruption',
      status: 'error',
      details: error.message
    });
  }

  // Check database consistency
  try {
    const dbCheck = db.prepare('PRAGMA integrity_check').get();
    checks.push({
      name: 'database_integrity',
      status: dbCheck.integrity_check === 'ok' ? 'pass' : 'fail',
      details: dbCheck.integrity_check
    });
  } catch (error) {
    checks.push({
      name: 'database_integrity',
      status: 'error',
      details: error.message
    });
  }

  // Check device trust status
  try {
    const deviceCheck = db.prepare('SELECT COUNT(*) as count FROM devices WHERE is_trusted = 0').get();
    checks.push({
      name: 'untrusted_devices',
      status: 'pass', // Always pass, just informational
      details: `${deviceCheck.count} untrusted devices`
    });
  } catch (error) {
    checks.push({
      name: 'untrusted_devices',
      status: 'error',
      details: error.message
    });
  }

  return checks;
}

module.exports = {
  createUnlockRouter,
  performIntegrityChecks
};
