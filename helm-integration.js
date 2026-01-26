/**
 * Helm Integration - Server Integration
 * Integrates Local Helm Engine with existing server
 */

const LocalHelmEngine = require('./helm-local-engine');

class HelmIntegration {
  constructor() {
    this.helmEngine = new LocalHelmEngine();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Initialize Helm Engine
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    try {
      console.log('🚀 Initializing Helm Integration...');
      
      await this.helmEngine.initialize();
      
      this.isInitialized = true;
      console.log('✅ Helm Integration ready');
      
      return true;
    } catch (error) {
      console.error('❌ Helm Integration failed:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Get Helm Engine instance
   */
  getEngine() {
    return this.helmEngine;
  }

  /**
   * Execute skill with error handling
   */
  async executeSkill(skillId, params, sessionId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.helmEngine.executeSkill(skillId, params, sessionId);
  }

  /**
   * Get Helm status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      ...this.helmEngine.getStatus()
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit = 100) {
    const log = this.helmEngine.auditLog;
    return {
      auditLog: limit > 0 ? log.slice(-limit) : log,
      total: log.length
    };
  }
}

// Create singleton instance
const helmIntegration = new HelmIntegration();

/**
 * Express middleware for Helm integration
 */
function helmMiddleware(req, res, next) {
  req.helm = helmIntegration;
  next();
}

/**
 * Helm routes for Express
 */
function createHelmRoutes() {
  const express = require('express');
  const router = express.Router();

  // Execute skill
  router.post('/skill/:skillId', async (req, res) => {
    try {
      const { skillId } = req.params;
      const { params = {}, sessionId } = req.body;
      
      const result = await helmIntegration.executeSkill(skillId, params, sessionId);
      res.json(result);
      
    } catch (error) {
      console.error('Helm skill execution error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        skillId: req.params.skillId
      });
    }
  });

  // Get status
  router.get('/status', (req, res) => {
    try {
      const status = helmIntegration.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get audit log
  router.get('/audit', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const audit = helmIntegration.getAuditLog(limit);
      res.json(audit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  router.get('/health', (req, res) => {
    try {
      const status = helmIntegration.getStatus();
      const isHealthy = status.initialized && status.running;
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        helm: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

/**
 * Initialize Helm with existing Express app
 */
function initializeHelmWithApp(app) {
  // Add middleware
  app.use(helmMiddleware);

  // Add routes
  app.use('/helm', createHelmRoutes());

  // Initialize Helm
  helmIntegration.initialize().catch(error => {
    console.error('Failed to initialize Helm:', error);
  });

  console.log('🔗 Helm routes registered at /helm');
  return helmIntegration;
}

/**
 * Poker game integration helpers
 */
class PokerHelmIntegration {
  constructor(helmIntegration) {
    this.helm = helmIntegration;
  }

  async dealCards(playerId, count = 5) {
    return await this.helm.executeSkill('poker_deal', { playerId, count });
  }

  async placeBet(playerId, amount) {
    return await this.helm.executeSkill('poker_bet', { playerId, amount });
  }

  async foldHand(playerId, reason) {
    return await this.helm.executeSkill('poker_fold', { playerId, reason });
  }

  async getChatResponse(message) {
    return await this.helm.executeSkill('chat_response', { message });
  }

  async getGameAnalytics() {
    return await this.helm.executeSkill('analytics');
  }
}

/**
 * Discord bot integration helpers
 */
class DiscordHelmIntegration {
  constructor(helmIntegration) {
    this.helm = helmIntegration;
  }

  async handleDiscordMessage(message) {
    try {
      const result = await this.helm.executeSkill('chat_response', { 
        message: message.content,
        context: 'discord'
      });
      
      return result.result.response;
    } catch (error) {
      console.error('Discord Helm integration error:', error);
      return "I'm processing your request...";
    }
  }

  async getGameStatus() {
    try {
      return await this.helm.executeSkill('game_state');
    } catch (error) {
      console.error('Failed to get game status:', error);
      return { error: error.message };
    }
  }
}

module.exports = {
  HelmIntegration,
  helmIntegration,
  helmMiddleware,
  createHelmRoutes,
  initializeHelmWithApp,
  PokerHelmIntegration,
  DiscordHelmIntegration
};
