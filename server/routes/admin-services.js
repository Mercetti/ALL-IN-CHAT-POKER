/**
 * Admin Routes for AI Service Management
 */

const express = require('express');
const auth = require('../auth');
const serviceManager = require('../ai-service-manager');
const config = require('../config');
const Logger = require('../logger');

const logger = new Logger('admin-services');
const router = express.Router();

/**
 * Get all services status
 */
router.get('/status', auth.requireAdmin, async (req, res) => {
  try {
    const status = await serviceManager.getServicesStatus();
    
    logger.info('Admin requested services status', { ip: req.ip });
    
    res.json({
      success: true,
      data: {
        services: status,
        config: {
          aiProvider: config.AI_PROVIDER,
          ollamaHost: config.OLLAMA_HOST,
          ollamaModel: config.OLLAMA_MODEL
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get services status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get services status'
    });
  }
});

/**
 * Start Ollama service
 */
router.post('/ollama/start', auth.requireAdmin, async (req, res) => {
  try {
    logger.info('Admin requested Ollama start', { ip: req.ip });
    
    const result = await serviceManager.startOllama();
    
    if (result.success) {
      logger.info('Ollama started successfully', { pid: result.pid });
    } else {
      logger.warn('Failed to start Ollama', { message: result.message });
    }
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Failed to start Ollama', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start Ollama'
    });
  }
});

/**
 * Stop Ollama service
 */
router.post('/ollama/stop', auth.requireAdmin, async (req, res) => {
  try {
    logger.info('Admin requested Ollama stop', { ip: req.ip });
    
    const result = await serviceManager.stopOllama();
    
    if (result.success) {
      logger.info('Ollama stopped successfully');
    } else {
      logger.warn('Failed to stop Ollama', { message: result.message });
    }
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Failed to stop Ollama', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to stop Ollama'
    });
  }
});

/**
 * Start Cloudflare tunnel
 */
router.post('/tunnel/start', auth.requireAdmin, async (req, res) => {
  try {
    logger.info('Admin requested tunnel start', { ip: req.ip });
    
    const result = await serviceManager.startTunnel();
    
    if (result.success) {
      logger.info('Tunnel started successfully', { url: result.url, pid: result.pid });
      
      // Update config with new tunnel URL
      if (result.url) {
        // Note: This would require updating environment variables
        // For now, just return the URL for manual configuration
        result.configUpdate = {
          variable: 'OLLAMA_HOST',
          value: result.url,
          command: `fly secrets set OLLAMA_HOST=${result.url}`
        };
      }
    } else {
      logger.warn('Failed to start tunnel', { message: result.message });
    }
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Failed to start tunnel', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start tunnel'
    });
  }
});

/**
 * Stop Cloudflare tunnel
 */
router.post('/tunnel/stop', auth.requireAdmin, async (req, res) => {
  try {
    logger.info('Admin requested tunnel stop', { ip: req.ip });
    
    const result = await serviceManager.stopTunnel();
    
    if (result.success) {
      logger.info('Tunnel stopped successfully');
    } else {
      logger.warn('Failed to stop tunnel', { message: result.message });
    }
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Failed to stop tunnel', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to stop tunnel'
    });
  }
});

/**
 * Get Ollama models
 */
router.get('/ollama/models', auth.requireAdmin, async (req, res) => {
  try {
    // Try to get models from service manager first
    let models = await serviceManager.getOllamaModels();
    
    // If service manager is disabled (running on Fly.io), try direct fetch
    if (models.length === 0 && config.OLLAMA_HOST) {
      try {
        const response = await fetch(`${config.OLLAMA_HOST}/api/tags`, {
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json();
          models = data.models || [];
        }
      } catch (error) {
        logger.warn('Failed to fetch models directly', { error: error.message });
      }
    }
    
    logger.info('Admin requested Ollama models', { count: models.length, ip: req.ip });
    
    res.json({
      success: true,
      data: {
        models: models,
        current: config.OLLAMA_MODEL,
        count: models.length
      }
    });
  } catch (error) {
    logger.error('Failed to get Ollama models', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get Ollama models'
    });
  }
});

/**
 * Update AI provider configuration
 */
router.post('/config/update', auth.requireAdmin, async (req, res) => {
  try {
    const { provider, ollamaHost, ollamaModel } = req.body;
    
    logger.info('Admin requested config update', { 
      provider, 
      ollamaHost, 
      ollamaModel, 
      ip: req.ip 
    });
    
    const updates = [];
    const isLocal = process.env.NODE_ENV !== 'production' || !process.env.FLY_APP_NAME;
    
    // For local development, update the config directly
    if (isLocal) {
      if (provider && provider !== config.AI_PROVIDER) {
        config.AI_PROVIDER = provider;
        updates.push({
          variable: 'AI_PROVIDER',
          oldValue: config.AI_PROVIDER,
          newValue: provider,
          updated: true
        });
      }
      
      if (ollamaHost && ollamaHost !== config.OLLAMA_HOST) {
        config.OLLAMA_HOST = ollamaHost;
        updates.push({
          variable: 'OLLAMA_HOST',
          oldValue: config.OLLAMA_HOST,
          newValue: ollamaHost,
          updated: true
        });
      }
      
      if (ollamaModel && ollamaModel !== config.OLLAMA_MODEL) {
        config.OLLAMA_MODEL = ollamaModel;
        updates.push({
          variable: 'OLLAMA_MODEL',
          oldValue: config.OLLAMA_MODEL,
          newValue: ollamaModel,
          updated: true
        });
      }
      
      if (updates.length === 0) {
        return res.json({
          success: true,
          message: 'No configuration changes needed',
          data: { updates: [], requiresRestart: false }
        });
      }
      
      return res.json({
        success: true,
        message: `Updated ${updates.length} configuration values`,
        data: { 
          updates,
          requiresRestart: false,
          currentConfig: {
            aiProvider: config.AI_PROVIDER,
            ollamaHost: config.OLLAMA_HOST,
            ollamaModel: config.OLLAMA_MODEL
          }
        }
      });
    }
    
    // For Fly.io, return commands to update secrets
    if (provider && provider !== config.AI_PROVIDER) {
      updates.push({
        variable: 'AI_PROVIDER',
        currentValue: config.AI_PROVIDER,
        newValue: provider,
        command: `fly secrets set AI_PROVIDER=${provider}`
      });
    }
    
    if (ollamaHost && ollamaHost !== config.OLLAMA_HOST) {
      updates.push({
        variable: 'OLLAMA_HOST',
        currentValue: config.OLLAMA_HOST,
        newValue: ollamaHost,
        command: `fly secrets set OLLAMA_HOST=${ollamaHost}`
      });
    }
    
    if (ollamaModel && ollamaModel !== config.OLLAMA_MODEL) {
      updates.push({
        variable: 'OLLAMA_MODEL',
        currentValue: config.OLLAMA_MODEL,
        newValue: ollamaModel,
        command: `fly secrets set OLLAMA_MODEL=${ollamaModel}`
      });
    }
    
    // Note: Actual environment variable updates would require
    // restarting the server or using a configuration management system
    // For now, return the commands needed for manual updates
    res.json({
      success: true,
      message: 'Configuration update requires Fly.io secrets update',
      data: { 
        updates,
        requiresRestart: true
      }
    });
  } catch (error) {
    logger.error('Failed to update config', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

/**
 * Test AI provider connection
 */
router.post('/test-connection', auth.requireAdmin, async (req, res) => {
  try {
    const { provider } = req.body;
    
    logger.info('Admin requested connection test', { provider, ip: req.ip });
    
    let testResult = { success: false, message: 'Unknown provider' };
    
    if (provider === 'ollama') {
      try {
        const response = await fetch(`${config.OLLAMA_HOST}/api/tags`, {
          timeout: 5000
        });
        
        if (response.ok) {
          const models = await response.json();
          testResult = {
            success: true,
            message: `Connected to Ollama successfully`,
            data: {
              models: models.models?.length || 0,
              host: config.OLLAMA_HOST
            }
          };
        } else {
          testResult = {
            success: false,
            message: `Ollama returned status ${response.status}`
          };
        }
      } catch (error) {
        testResult = {
          success: false,
          message: `Failed to connect to Ollama: ${error.message}`
        };
      }
    } else if (provider === 'openai') {
      if (!config.OPENAI_API_KEY) {
        testResult = {
          success: false,
          message: 'OpenAI API key not configured'
        };
      } else {
        testResult = {
          success: true,
          message: 'OpenAI API key is configured',
          data: {
            model: config.AI_MODEL
          }
        };
      }
    }
    
    logger.info('Connection test result', { 
      provider, 
      success: testResult.success, 
      ip: req.ip 
    });
    
    res.json({
      success: true,
      data: testResult
    });
    
  } catch (error) {
    logger.error('Failed to test connection', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

// AI Performance monitoring endpoint
router.get('/ai/performance', (req, res) => {
  try {
    const ai = require('../ai');
    const performanceReport = ai.getAIPerformanceReport();
    const cacheStats = ai.getAICacheStats();
    const tunnelStatus = ai.getTunnelStatus();
    
    res.json({
      success: true,
      data: {
        performance: performanceReport,
        cache: cacheStats,
        tunnel: tunnelStatus,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear AI cache endpoint
router.post('/ai/cache/clear', (req, res) => {
  try {
    const ai = require('../ai');
    ai.clearAICache();
    
    res.json({
      success: true,
      message: 'AI cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset AI performance metrics endpoint
router.post('/ai/performance/reset', (req, res) => {
  try {
    const ai = require('../ai');
    ai.resetAIPerformanceMetrics();
    
    res.json({
      success: true,
      message: 'AI performance metrics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get resilience status
 */
router.get('/resilience-status', auth.requireAdmin, async (req, res) => {
  try {
    const resilienceManager = require('../resilience-manager');
    const status = resilienceManager.getResilienceStatus();
    const health = await resilienceManager.getAllHealthChecks();
    
    res.json({
      success: true,
      data: {
        resilience: status,
        health: health,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get resilience status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get resilience status'
    });
  }
});

/**
 * Reset circuit breakers
 */
router.post('/resilience/reset', auth.requireAdmin, async (req, res) => {
  try {
    const resilienceManager = require('../resilience-manager');
    
    // Reset all circuit breakers
    for (const [serviceName, breaker] of resilienceManager.circuitBreakers) {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      breaker.lastFailure = 0;
    }
    
    // Reset retry attempts
    resilienceManager.retryAttempts.clear();
    
    logger.info('Circuit breakers reset by admin', { ip: req.ip });
    
    res.json({
      success: true,
      message: 'All circuit breakers reset successfully'
    });
  } catch (error) {
    logger.error('Failed to reset circuit breakers', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to reset circuit breakers'
    });
  }
});

module.exports = router;
