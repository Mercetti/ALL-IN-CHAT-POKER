/**
 * Mobile API Routes
 * Secure API endpoints for the Android Control Center app
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');

const router = express.Router();

// Rate limiting for mobile endpoints
const mobileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from mobile device',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all mobile routes
router.use(mobileLimiter);

// Trusted device storage (in production, use database)
const trustedDevices = new Map();

// JWT secret for mobile tokens
const MOBILE_JWT_SECRET = process.env.MOBILE_JWT_SECRET || 'mobile-secret-change-in-production';

// Mobile token expiration (15-30 minutes)
const MOBILE_TOKEN_EXPIRY = 15 * 60; // 15 minutes

// Validation schemas
const loginSchema = Joi.object({
  deviceId: Joi.string().uuid().required(),
  pin: Joi.string().pattern(/^\d{6}$/).required()
});

const commandSchema = Joi.object({
  intent: Joi.string().required(),
  params: Joi.object().default({})
});

const approvalSchema = Joi.object({
  approvalId: Joi.string().required(),
  approved: Joi.boolean().required()
});

// Helper functions
function generateMobileToken(deviceId, permissions) {
  return jwt.sign(
    { 
      deviceId, 
      permissions,
      type: 'mobile',
      iat: Math.floor(Date.now() / 1000)
    },
    MOBILE_JWT_SECRET,
    { expiresIn: `${MOBILE_TOKEN_EXPIRY}s` }
  );
}

function verifyMobileToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, MOBILE_JWT_SECRET);
    
    if (decoded.type !== 'mobile') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    
    // Check if device is still trusted
    const device = trustedDevices.get(decoded.deviceId);
    if (!device || device.revoked) {
      return res.status(401).json({ error: 'Device not trusted' });
    }
    
    req.device = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.device.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// WebSocket for live updates
const mobileClients = new Map();

function broadcastToMobile(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  
  for (const [deviceId, ws] of mobileClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

// Routes

/**
 * POST /mobile/auth/login
 * Authenticate mobile device with PIN
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { deviceId, pin } = value;
    
    // Check if device is trusted and PIN matches
    const device = trustedDevices.get(deviceId);
    if (!device || device.pin !== pin || device.revoked) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last seen
    device.lastSeen = Date.now();
    trustedDevices.set(deviceId, device);
    
    // Generate token
    const token = generateMobileToken(deviceId, device.permissions);
    
    res.json({
      token,
      permissions: device.permissions,
      expiresAt: Math.floor(Date.now() / 1000) + MOBILE_TOKEN_EXPIRY
    });
    
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /mobile/status
 * Get current Acey status
 */
router.get('/status', verifyMobileToken, checkPermission('read'), async (req, res) => {
  try {
    // Get Acey status from your existing system
    const aceyStatus = await getAceyStatus();
    
    res.json({
      aceyOnline: aceyStatus.online,
      currentTask: aceyStatus.currentTask,
      cognitiveLoad: aceyStatus.cognitiveLoad,
      activeModel: aceyStatus.activeModel,
      lastHeartbeat: aceyStatus.lastHeartbeat
    });
    
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * GET /mobile/logs
 * Get system logs
 */
router.get('/logs', verifyMobileToken, checkPermission('read'), async (req, res) => {
  try {
    const { type = 'system', limit = 100 } = req.query;
    
    // Get logs from your existing logging system
    const logs = await getSystemLogs(type, parseInt(limit));
    
    res.json({
      logs: logs.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        timestamp: log.timestamp
      }))
    });
    
  } catch (error) {
    console.error('Logs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /mobile/approvals
 * Get pending approvals
 */
router.get('/approvals', verifyMobileToken, checkPermission('approve'), async (req, res) => {
  try {
    // Get pending approvals from your governance system
    const pendingApprovals = await getPendingApprovals();
    
    res.json({
      pending: pendingApprovals.map(approval => ({
        approvalId: approval.id,
        action: approval.action,
        risk: approval.risk,
        reason: approval.reason,
        timestamp: approval.timestamp
      }))
    });
    
  } catch (error) {
    console.error('Approvals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

/**
 * POST /mobile/approve
 * Approve or deny pending action
 */
router.post('/approve', verifyMobileToken, checkPermission('approve'), async (req, res) => {
  try {
    const { error, value } = approvalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { approvalId, approved } = value;
    
    // Process approval through your governance system
    const result = await processApproval(approvalId, approved, req.device.deviceId);
    
    if (result.success) {
      // Broadcast approval result to other mobile clients
      broadcastToMobile('approval_processed', {
        approvalId,
        approved,
        processedBy: req.device.deviceId,
        timestamp: Date.now()
      });
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('Approval processing error:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

/**
 * POST /mobile/command
 * Send intent-based command
 */
router.post('/command', verifyMobileToken, checkPermission('command'), async (req, res) => {
  try {
    const { error, value } = commandSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { intent, params } = value;
    
    // Process intent through your governance system
    const result = await processIntent(intent, params, req.device.deviceId);
    
    if (result.requiresApproval) {
      // Broadcast approval request to all mobile clients
      broadcastToMobile('approval_required', {
        approvalId: result.approvalId,
        action: result.action,
        risk: result.risk,
        reason: result.reason,
        requestedBy: req.device.deviceId
      });
      
      res.json({ 
        requiresApproval: true,
        approvalId: result.approvalId,
        message: 'Command requires approval'
      });
    } else if (result.success) {
      res.json({ 
        success: true,
        message: 'Command executed successfully'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('Command processing error:', error);
    res.status(500).json({ error: 'Failed to process command' });
  }
});

/**
 * WebSocket endpoint for live updates
 */
router.ws('/live', (ws, req) => {
  // Extract token from query params or headers
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ws.close(1008, 'No token provided');
    return;
  }
  
  try {
    const decoded = jwt.verify(token, MOBILE_JWT_SECRET);
    
    if (decoded.type !== 'mobile') {
      ws.close(1008, 'Invalid token type');
      return;
    }
    
    const device = trustedDevices.get(decoded.deviceId);
    if (!device || device.revoked) {
      ws.close(1008, 'Device not trusted');
      return;
    }
    
    // Add to connected clients
    mobileClients.set(decoded.deviceId, ws);
    
    // Send initial status
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { deviceId: decoded.deviceId },
      timestamp: Date.now()
    }));
    
    ws.on('close', () => {
      mobileClients.delete(decoded.deviceId);
    
    ws.on('error', (error) => {
      console.error('Mobile WebSocket error:', error);
      mobileClients.delete(decoded.deviceId);
    
  } catch (error) {
    ws.close(1008, 'Invalid token');
  }
});

// Helper functions to integrate with your existing system
async function getAceyStatus() {
  // Integrate with your existing Acey status monitoring
  return {
    online: true, // Check actual Acey status
    currentTask: 'audio_generation',
    cognitiveLoad: 'standard',
    activeModel: 'acey-v4',
    lastHeartbeat: Date.now()
  };
}

async function getSystemLogs(type, limit) {
  // Integrate with your existing logging system
  return [
    {
      id: 'log_123',
      level: 'warn',
      message: 'Hallucination risk detected',
      timestamp: Date.now() - 60000
    },
    {
      id: 'log_124',
      level: 'info',
      message: 'Dataset updated',
      timestamp: Date.now() - 120000
    }
  ];
}

async function getPendingApprovals() {
  // Integrate with your existing governance system
  return [
    {
      id: 'appr_456',
      action: 'auto_fix_website',
      risk: 0.6,
      reason: 'Detected missing asset',
      timestamp: Date.now() - 30000
    }
  ];
}

async function processApproval(approvalId, approved, deviceId) {
  // Integrate with your existing approval system
  console.log(`Processing approval ${approvalId}: ${approved} by device ${deviceId}`);
  
  // This would call your existing governance system
  return { success: true };
}

async function processIntent(intent, params, deviceId) {
  // Integrate with your existing intent processing system
  console.log(`Processing intent ${intent} from device ${deviceId}`, params);
  
  // This would call your existing governance/intent system
  // For demo, let's say some intents require approval
  if (intent === 'run_simulation' && params.scope === 'governance') {
    return {
      requiresApproval: true,
      approvalId: `appr_${Date.now()}`,
      action: intent,
      risk: 0.4,
      reason: 'Governance simulation requires oversight'
    };
  }
  
  return { success: true };
}

// Device management utilities (for admin setup)
function addTrustedDevice(deviceId, nickname, pin, permissions = ['read']) {
  trustedDevices.set(deviceId, {
    deviceId,
    nickname,
    pin,
    permissions,
    lastSeen: null,
    revoked: false,
    createdAt: Date.now()
  });
}

function revokeDevice(deviceId) {
  const device = trustedDevices.get(deviceId);
  if (device) {
    device.revoked = true;
    trustedDevices.set(deviceId, device);
    
    // Disconnect any active WebSocket connections
    const ws = mobileClients.get(deviceId);
    if (ws) {
      ws.close(1008, 'Device revoked');
    }
  }
}

// Export for use in main app
module.exports = router;
module.exports.addTrustedDevice = addTrustedDevice;
module.exports.revokeDevice = revokeDevice;
module.exports.broadcastToMobile = broadcastToMobile;
