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

/**
 * Get copy-paste friendly patch for error
 */
router.post('/error-manager/patch', auth.requireAdmin, async (req, res) => {
  try {
    const { errorId, includeAIFix } = req.body;
    const errorManager = require('../ai-error-manager');
    
    // Get error info (mock for now - would come from error history)
    const errorInfo = {
      id: errorId,
      type: 'syntax',
      severity: 'high',
      category: 'backend',
      message: 'Sample error message',
      likelyCause: 'Syntax error in code',
      suggestedFixes: ['Check syntax', 'Validate code']
    };
    
    // Generate fix plan
    const fixPlan = await errorManager.generateFixPlan(errorInfo);
    
    // Generate copy-paste patch
    const patch = errorManager.generateCopyPastePatch(errorInfo, fixPlan);
    
    // If AI fix requested, get AI solution
    let aiFix = null;
    if (includeAIFix) {
      aiFix = await errorManager.askAIToFix(errorInfo);
    }
    
    res.json({
      success: true,
      data: {
        patch,
        aiFix,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to generate patch', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to generate patch'
    });
  }
});

/**
 * Ask AI to fix error directly
 */
router.post('/error-manager/ai-fix', auth.requireAdmin, async (req, res) => {
  try {
    const { errorId, applyFix } = req.body;
    const errorManager = require('../ai-error-manager');
    
    // Get error info (mock for now)
    const errorInfo = {
      id: errorId,
      type: 'syntax',
      severity: 'high',
      category: 'backend',
      message: 'Sample error message',
      likelyCause: 'Syntax error in code',
      suggestedFixes: ['Check syntax', 'Validate code']
    };
    
    // Ask AI to fix
    const aiFix = await errorManager.askAIToFix(errorInfo);
    
    // Apply fix if requested
    let appliedFix = null;
    if (applyFix && aiFix.success) {
      appliedFix = await errorManager.applyAIFix(aiFix);
    }
    
    res.json({
      success: true,
      data: {
        aiFix,
        appliedFix,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get AI fix', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get AI fix'
    });
  }
});

/**
 * Detect duplicate cosmetics with image analysis
 */
router.post('/cosmetics/deduplicate', auth.requireAdmin, async (req, res) => {
  try {
    const { action, cosmetics } = req.body;
    const cosmeticDeduplicator = require('../cosmetic-deduplicator');
    
    let result;
    switch (action) {
      case 'detect':
        result = await cosmeticDeduplicator.detectDuplicates(cosmetics);
        break;
      case 'remove':
        result = await cosmeticDeduplicator.removeDuplicates(cosmetics);
        break;
      case 'merge':
        result = await cosmeticDeduplicator.mergeSimilar(cosmetics);
        break;
      case 'smart-cleanup':
        result = await cosmeticDeduplicator.smartCleanup(cosmetics);
        break;
      default:
        throw new Error('Invalid action. Use: detect, remove, merge, or smart-cleanup');
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Cosmetic deduplication failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * AI-powered cosmetic cleanup
 */
router.post('/cosmetics/ai-cleanup', auth.requireAdmin, async (req, res) => {
  try {
    const { cosmetics } = req.body;
    const cosmeticDeduplicator = require('../cosmetic-deduplicator');
    
    // Smart cleanup with AI assistance
    const result = await cosmeticDeduplicator.smartCleanup(cosmetics);
    
    // Generate cleanup report
    const report = cosmeticDeduplicator.generateCleanupReport(result.original, result.cleaned, result.duplicates);
    
    res.json({
      success: true,
      data: {
        result,
        report
      }
    });
  } catch (error) {
    logger.error('AI cosmetic cleanup failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Generate background music
 */
router.post('/audio/generate', auth.requireAdmin, async (req, res) => {
  try {
    const { type, mood, duration, effectType, description, character, gameState } = req.body;
    const audioAIManager = require('../audio-ai-manager');
    
    let result;
    switch (type) {
      case 'background_music':
        result = await audioAIManager.generateBackgroundMusic(mood, duration);
        break;
      case 'game_sound':
        result = await audioAIManager.generateGameSound(effectType, description);
        break;
      case 'voice_line':
        result = await audioAIManager.generateVoiceLine(text, character);
        break;
      case 'ambient_soundscape':
        result = await audioAIManager.generateAmbientSoundscape(gameState);
        break;
      case 'audio_package':
        result = await audioAIManager.generateAudioPackage(gameState);
        break;
      default:
        throw new Error('Invalid audio type. Use: background_music, game_sound, voice_line, ambient_soundscape, or audio_package');
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Audio generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get audio generation status
 */
router.get('/audio/status', auth.requireAdmin, async (req, res) => {
  try {
    const audioAIManager = require('../audio-ai-manager');
    const status = audioAIManager.getGenerationStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get audio status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Clear audio cache
 */
router.post('/audio/clear', auth.requireAdmin, async (req, res) => {
  try {
    const audioAIManager = require('../audio-ai-manager');
    audioAIManager.clearCache();
    
    res.json({
      success: true,
      message: 'Audio cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear audio cache', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get generated audio files
 */
router.get('/audio/files', auth.requireAdmin, async (req, res) => {
  try {
    const audioAIManager = require('../audio-ai-manager');
    const files = audioAIManager.getGeneratedFiles();
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error('Failed to get audio files', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Upload image for cosmetic
 */
router.post('/cosmetics/upload-image', auth.requireAdmin, async (req, res) => {
  try {
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = await cosmeticGenerator.uploadImage(req.file, req.body.type || 'item');
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to upload cosmetic image', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Create complete cosmetic set
 */
router.post('/cosmetics/create-set', auth.requireAdmin, async (req, res) => {
  try {
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = await cosmeticGenerator.createCosmeticSet(req.body);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to create cosmetic set', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get all cosmetic sets
 */
router.get('/cosmetics/sets', auth.requireAdmin, async (req, res) => {
  try {
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = cosmeticGenerator.getAllCosmeticSets();
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get cosmetic sets', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get cosmetic set by ID
 */
router.get('/cosmetics/set/:setId', auth.requireAdmin, async (req, res) => {
  try {
    const { setId } = req.params;
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = cosmeticGenerator.getCosmeticSet(setId);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get cosmetic set', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Update cosmetic set
 */
router.put('/cosmetics/set/:setId', auth.requireAdmin, async (req, res) => {
  try {
    const { setId } = req.params;
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = await cosmeticGenerator.updateCosmeticSet(setId, req.body);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to update cosmetic set', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Delete cosmetic set
 */
router.delete('/cosmetics/set/:setId', auth.requireAdmin, async (req, res) => {
  try {
    const { setId } = req.params;
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = await cosmeticGenerator.deleteCosmeticSet(setId);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to delete cosmetic set', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Generate cosmetic set from template
 */
router.post('/cosmetics/generate-from-template', auth.requireAdmin, async (req, res) => {
  try {
    const { template } = req.body;
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = await cosmeticGenerator.generateFromTemplate(template);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to generate from template', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get available templates
 */
router.get('/cosmetics/templates', auth.requireAdmin, async (req, res) => {
  try {
    const cosmeticGenerator = require('../enhanced-cosmetic-generator');
    const result = cosmeticGenerator.getAvailableTemplates();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get templates', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Resource Manager - Control AI and PC resources
 */
router.get('/resources/status', auth.requireAdmin, async (req, res) => {
  try {
    const ResourceManager = require('../resource-manager');
    const resourceManager = new ResourceManager();
    
    const status = resourceManager.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get resource status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Turn on AI system
 */
router.post('/resources/turn-on-ai', auth.requireAdmin, async (req, res) => {
  try {
    const ResourceManager = require('../resource-manager');
    const resourceManager = new ResourceManager();
    
    const result = await resourceManager.turnOnAI();
    
    res.json({
      success: result,
      message: result ? 'AI system turned on' : 'Failed to turn on AI system'
    });
  } catch (error) {
    logger.error('Failed to turn on AI', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Turn off AI system
 */
router.post('/resources/turn-off-ai', auth.requireAdmin, async (req, res) => {
  try {
    const ResourceManager = require('../resource-manager');
    const resourceManager = new ResourceManager();
    
    const result = await resourceManager.turnOffAI();
    
    res.json({
      success: result,
      message: result ? 'AI system turned off' : 'Failed to turn off AI system'
    });
  } catch (error) {
    logger.error('Failed to turn off AI', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Optimize system for gaming
 */
router.post('/resources/optimize-gaming', auth.requireAdmin, async (req, res) => {
  try {
    const ResourceManager = require('../resource-manager');
    const resourceManager = new ResourceManager();
    
    const result = await resourceManager.optimizeForGaming();
    
    res.json({
      success: result,
      message: result ? 'System optimized for gaming' : 'Failed to optimize system'
    });
  } catch (error) {
    logger.error('Failed to optimize system', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Clear AI cache
 */
router.post('/resources/clear-cache', auth.requireAdmin, async (req, res) => {
  try {
    const ResourceManager = require('../resource-manager');
    const resourceManager = new ResourceManager();
    
    const result = await resourceManager.clearAICache();
    
    res.json({
      success: result,
      message: result ? 'AI cache cleared' : 'Failed to clear AI cache'
    });
  } catch (error) {
    logger.error('Failed to clear AI cache', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Generate resource report
 */
router.get('/resources/report', auth.requireAdmin, async (req, res) => {
  try {
    const ResourceManager = require('../resource-manager');
    const resourceManager = new ResourceManager();
    
    const report = resourceManager.generateReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to generate resource report', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Admin: grant AIC to a user
 */
router.post('/coins/grant', auth.requireAdminOrRole(['admin', 'dev', 'owner']), (req, res) => {
  try {
    const actor = auth.extractUserLogin(req) || 'unknown';
    const { login, amount, reason } = req.body || {};
    
    if (!validation.validateUsername(login || '')) {
      return res.status(400).json({ error: 'invalid_login' });
    }
    
    const parsedAmount = typeof amount === 'string' ? Number(amount) : amount;
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({ error: 'invalid_amount' });
    }
    
    const roundedAmount = Math.round(parsedAmount);
    if (roundedAmount <= 0) {
      return res.status(400).json({ error: 'amount_must_be_positive' });
    }
    
    const MAX_GRANT = 1_000_000;
    const grantAmount = Math.min(MAX_GRANT, roundedAmount);
    const normalizedLogin = (login || '').toLowerCase();
    const profile = db.getProfile(normalizedLogin);
    
    if (!profile) {
      return res.status(404).json({ error: 'user_not_found' });
    }
    
    const targetLogin = (profile.login || normalizedLogin).toLowerCase();
    const currentBalance = db.getBalance(targetLogin) || 0;
    const newBalance = currentBalance + grantAmount;
    
    db.setBalance(targetLogin, newBalance);
    
    logger.info('Admin granted AIC', {
      actor,
      target: targetLogin,
      grantAmount,
      newBalance,
      reason,
    });
    
    return res.json({
      success: true,
      login: targetLogin,
      granted: grantAmount,
      balance: newBalance,
    });
  } catch (err) {
    logger.error('Admin grant AIC failed', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
