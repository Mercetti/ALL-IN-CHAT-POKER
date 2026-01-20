/**
 * Secure API Key Flow for Helm Control
 * Validates client API keys and returns Helm instance configuration
 */

/* global require, console */

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Mock database for demonstration (replace with actual DB implementation)
const db = {
  clients: {
    findOne: async (query) => {
      // Mock implementation - replace with actual database query
      return Promise.resolve(null);
    },
    findById: async (id) => {
      // Mock implementation - replace with actual database query
      return Promise.resolve(null);
    },
    updateOne: async (query, update) => {
      // Mock implementation - replace with actual database update
      return Promise.resolve();
    }
  },
  apiKeys: {
    create: async (data) => {
      // Mock implementation - replace with actual database insert
      return Promise.resolve();
    },
    updateOne: async (query, update) => {
      // Mock implementation - replace with actual database update
      return Promise.resolve();
    }
  },
  usageLogs: {
    count: async (query) => {
      // Mock implementation - replace with actual database count
      return Promise.resolve(0);
    }
  },
  securityLogs: {
    create: async (data) => {
      // Mock implementation - replace with actual database insert
      return Promise.resolve();
    }
  },
  accessLogs: {
    create: async (data) => {
      // Mock implementation - replace with actual database insert
      return Promise.resolve();
    }
  }
};

// Mock skill registry function
function getHelmSkillRegistry() {
  return [
    { id: 'basic_monitoring', name: 'Basic Monitoring', isActive: true, permissions: ['free', 'creator', 'creator+', 'enterprise'] },
    { id: 'logs', name: 'Logs', isActive: true, permissions: ['free', 'creator', 'creator+', 'enterprise'] },
    { id: 'simple_alerts', name: 'Simple Alerts', isActive: true, permissions: ['free', 'creator', 'creator+', 'enterprise'] },
    { id: 'full_analytics', name: 'Full Analytics', isActive: true, permissions: ['creator', 'creator+', 'enterprise'] },
    { id: 'auto_content', name: 'Auto Content', isActive: true, permissions: ['creator', 'creator+', 'enterprise'] },
    { id: 'code_fix', name: 'Code Fix', isActive: true, permissions: ['creator', 'creator+', 'enterprise'] },
    { id: 'advanced_analytics', name: 'Advanced Analytics', isActive: true, permissions: ['creator+', 'enterprise'] },
    { id: 'custom_integrations', name: 'Custom Integrations', isActive: true, permissions: ['creator+', 'enterprise'] },
    { id: 'self_hosted', name: 'Self Hosted', isActive: true, permissions: ['enterprise'] },
    { id: 'all_skills', name: 'All Skills', isActive: true, permissions: ['enterprise'] },
    { id: 'integrations', name: 'Integrations', isActive: true, permissions: ['enterprise'] }
  ];
}

// Initialize Express app
const app = express();

// Rate limiting for API key validation
const keyValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 API key validations per windowMs
  message: {
    success: false,
    message: 'Too many API key validation attempts, please try again later.'
  }
});

// API Key validation endpoint
app.post("/init", keyValidationLimiter, async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        message: "API key required" 
      });
    }

    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid API key format" 
      });
    }

    // Look up client in database
    const client = await db.clients.findOne({ 
      apiKey: hashApiKey(apiKey),
      isActive: true 
    });

    if (!client) {
      // Log failed attempt for security monitoring
      await logFailedApiKeyAttempt(req.ip, apiKey);
      return res.status(403).json({ 
        success: false, 
        message: "Invalid or inactive API key" 
      });
    }

    // Check if client has exceeded usage limits
    if (await hasExceededUsageLimits(client._id)) {
      return res.status(429).json({ 
        success: false, 
        message: "Usage limits exceeded" 
      });
    }

    // Get allowed skills for client tier
    const allowedSkills = await getAllowedSkills(client.tier);
    
    // Update last access timestamp
    await updateClientAccess(client._id);

    // Return Helm instance configuration
    const helmInstance = {
      clientId: client._id,
      clientName: client.name,
      tier: client.tier,
      allowedSkills: allowedSkills,
      permissions: {
        maxConcurrentSkills: client.maxConcurrentSkills || 3,
        allowedOperations: getAllowedOperations(client.tier),
        rateLimit: client.rateLimit || 1000 // requests per hour
      },
      endpoints: {
        execute: `${req.protocol}://${req.get('host')}/execute`,
        log: `${req.protocol}://${req.get('host')}/log`,
        status: `${req.protocol}://${req.get('host')}/status`
      },
      initialized: new Date().toISOString()
    };

    // Log successful initialization
    await logClientInitialization(client._id, req.ip, allowedSkills.length);

    res.json({ 
      success: true, 
      helmInstance: helmInstance 
    });

  } catch (error) {
    console.error("API key validation error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Helper functions

function isValidApiKeyFormat(apiKey) {
  // API keys should be 32+ character alphanumeric strings
  const apiKeyRegex = /^[A-Za-z0-9]{32,}$/;
  return apiKeyRegex.test(apiKey);
}

function hashApiKey(apiKey) {
  // Hash API key for secure storage
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function logFailedApiKeyAttempt(ip, apiKey) {
  // Log security events for monitoring
  await db.securityLogs.create({
    timestamp: new Date(),
    ip: ip,
    event: 'FAILED_API_KEY_ATTEMPT',
    details: {
      apiKeyHash: hashApiKey(apiKey),
      userAgent: req.headers['user-agent']
    }
  });
}

async function hasExceededUsageLimits(clientId) {
  const client = await db.clients.findById(clientId);
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  
  // Count requests in the last hour
  const recentRequests = await db.usageLogs.count({
    clientId: clientId,
    timestamp: { $gte: oneHourAgo }
  });
  
  return recentRequests >= client.rateLimit;
}

async function updateClientAccess(clientId) {
  await db.clients.updateOne(
    { _id: clientId },
    { 
      $set: { 
        lastAccess: new Date(),
        $inc: { totalRequests: 1 }
      }
    }
  );
}

async function logClientInitialization(clientId, ip, skillCount) {
  await db.accessLogs.create({
    timestamp: new Date(),
    clientId: clientId,
    ip: ip,
    event: 'HELM_INITIALIZED',
    details: {
      skillsLoaded: skillCount,
      userAgent: req.headers['user-agent']
    }
  });
}

// Skill access management & tier enforcement
function getAllowedSkills(clientTier) {
  const skillRegistry = getHelmSkillRegistry();
  
  const tierPermissions = {
    'free': ['basic_monitoring', 'logs', 'simple_alerts'],
    'creator': ['full_analytics', 'auto_content', 'code_fix', 'basic_monitoring', 'logs', 'simple_alerts'],
    'creator+': ['full_analytics', 'auto_content', 'code_fix', 'advanced_analytics', 'custom_integrations', 'basic_monitoring', 'logs', 'simple_alerts'],
    'enterprise': ['self_hosted', 'all_skills', 'integrations', 'full_analytics', 'auto_content', 'code_fix', 'advanced_analytics', 'custom_integrations', 'basic_monitoring', 'logs', 'simple_alerts']
  };

  const allowedSkillIds = tierPermissions[clientTier] || [];
  
  return skillRegistry.filter(skill => 
    allowedSkillIds.includes(skill.id) && skill.isActive !== false
  ).map(skill => ({
    id: skill.id,
    name: skill.name,
    version: skill.version,
    permissions: skill.permissions,
    description: skill.description,
    category: skill.category
  }));
}

function getAllowedOperations(clientTier) {
  const operations = {
    'free': ['read', 'monitor'],
    'creator': ['read', 'monitor', 'execute', 'create'],
    'creator+': ['read', 'monitor', 'execute', 'create', 'integrate'],
    'enterprise': ['read', 'monitor', 'execute', 'create', 'integrate', 'admin', 'self_host']
  };
  
  return operations[clientTier] || [];
}

// API Key management endpoints
app.post("/admin/keys/generate", async (req, res) => {
  try {
    const { clientId, tier, name } = req.body;
    
    // Generate new API key
    const apiKey = generateSecureApiKey();
    const hashedKey = hashApiKey(apiKey);
    
    // Store in database
    await db.apiKeys.create({
      clientId: clientId,
      name: name,
      tier: tier,
      apiKey: hashedKey,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });
    
    res.json({
      success: true,
      apiKey: apiKey, // Only returned once
      message: "API key generated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate API key"
    });
  }
});

app.post("/admin/keys/revoke", async (req, res) => {
  try {
    const { keyId } = req.body;
    
    await db.apiKeys.updateOne(
      { _id: keyId },
      { $set: { isActive: false, revokedAt: new Date() } }
    );
    
    res.json({
      success: true,
      message: "API key revoked successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to revoke API key"
    });
  }
});

function generateSecureApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  initEndpoint: app,
  getAllowedSkills,
  getAllowedOperations
};
