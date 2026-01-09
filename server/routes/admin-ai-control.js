const crypto = require('crypto');

/**
 * Registers the Admin AI Control Center routes.
 * @param {import('express').Application} app
 * @param {object} deps
 * @param {object} deps.auth
 * @param {object} deps.performanceMonitor
 * @param {Function} deps.collectAiOverviewPanels
 * @param {object} deps.unifiedAI
 * @param {Function} deps.sendMonitorAlert
 * @param {object} deps.logger
 */
function registerAdminAiControlRoutes(app, deps) {
  if (!app) throw new Error('app is required');
  const {
    auth,
    performanceMonitor,
    collectAiOverviewPanels,
    unifiedAI,
    sendMonitorAlert,
    logger,
  } = deps;

  if (!auth || !auth.requireAdmin || !auth.extractUserLogin) {
    throw new Error('auth with requireAdmin and extractUserLogin is required');
  }

  if (!collectAiOverviewPanels) {
    throw new Error('collectAiOverviewPanels is required');
  }

  if (!unifiedAI) {
    throw new Error('unifiedAI instance is required');
  }

  /**
   * AI Control Center overview panels (admin only)
   */
  app.get('/admin/ai/overview', auth.requireAdmin, (req, res) => {
    const actor = auth.extractUserLogin(req) || 'admin';
    const stopTimer = performanceMonitor?.startTimer?.('admin.ai.overview', {
      method: req.method,
      actor,
      endpoint: req.originalUrl,
    });

    try {
      const panels = collectAiOverviewPanels();
      logger.info?.('Admin AI overview requested', { actor, panelCount: panels.length });
      stopTimer?.({ success: true });
      res.json({
        panels,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      stopTimer?.({ success: false, error: error.message });
      logger.error?.('Failed to build admin AI overview', { error: error.message });
      sendMonitorAlert?.('Admin AI overview failed', {
        severity: 'warning',
        description: error.message,
      })?.catch?.(() => {});
      res.status(500).json({ error: 'ai_overview_failed' });
    }
  });

  /**
   * Admin AI chat proxy for Control Center
   */
  app.post('/admin/ai-tools/chat', auth.requireAdmin, async (req, res) => {
    const actor = auth.extractUserLogin(req) || 'admin';
    const stopTimer = performanceMonitor?.startTimer?.('admin.ai.chat', {
      method: req.method,
      actor,
      endpoint: req.originalUrl,
    });

    try {
      const message = String(req.body?.message || '').trim();
      if (!message) {
        stopTimer?.({ success: false, error: 'missing_message' });
        return res.status(400).json({ error: 'message_required' });
      }

      const response = await unifiedAI.processChatMessage(message, { login: actor }, null, null);
      const content = typeof response === 'string'
        ? response
        : response?.content || 'AI did not return a message.';

      logger.info?.('Admin AI chat processed', { actor, length: message.length });
      stopTimer?.({ success: true });
      return res.json({
        id: crypto.randomUUID(),
        content,
      });
    } catch (error) {
      stopTimer?.({ success: false, error: error.message });
      logger.error?.('Admin AI chat failed', { error: error.message });
      sendMonitorAlert?.('Admin AI chat endpoint failed', {
        severity: 'warning',
        description: error.message,
      })?.catch?.(() => {});
      return res.status(500).json({ error: 'ai_chat_failed' });
    }
  });

  /**
   * Admin AI cosmetic generation proxy for Control Center
   */
  app.post('/admin/ai-tools/generate-cosmetic', auth.requireAdmin, async (req, res) => {
    const actor = auth.extractUserLogin(req) || 'admin';
    const stopTimer = performanceMonitor?.startTimer?.('admin.ai.generate_cosmetic', {
      method: req.method,
      actor,
      endpoint: req.originalUrl,
    });

    try {
      const prompt = String(req.body?.prompt || '').trim();
      if (!prompt) {
        stopTimer?.({ success: false, error: 'missing_prompt' });
        return res.status(400).json({ error: 'prompt_required' });
      }

      const cosmeticTypes = Array.isArray(req.body?.cosmeticTypes) && req.body.cosmeticTypes.length
        ? req.body.cosmeticTypes
        : ['cardBack'];

      const options = {
        userId: actor,
        login: actor,
        preset: req.body?.preset || 'neon',
        theme: prompt,
        cosmeticTypes,
        style: req.body?.style || 'detailed',
        useCache: req.body?.useCache !== false,
        palette: req.body?.palette ?? null,
      };

      const result = await unifiedAI.generateCosmetic(options);
      logger.info?.('Admin AI cosmetic generation completed', { actor, types: cosmeticTypes.length });
      stopTimer?.({ success: true });
      return res.json({
        success: true,
        result,
      });
    } catch (error) {
      stopTimer?.({ success: false, error: error.message });
      logger.error?.('Admin AI cosmetic generation failed', { error: error.message });
      sendMonitorAlert?.('Admin AI cosmetic generation failed', {
        severity: 'warning',
        description: error.message,
      })?.catch?.(() => {});
      return res.status(500).json({ error: 'ai_cosmetic_generation_failed' });
    }
  });

  /**
   * AI Performance monitoring endpoint (admin only)
   */
  app.get('/admin/ai/performance', auth.requireAdmin, (req, res) => {
    const actor = auth.extractUserLogin(req) || 'admin';
    const stopTimer = performanceMonitor?.startTimer?.('admin.ai.performance', {
      method: req.method,
      actor,
      endpoint: req.originalUrl,
    });

    try {
      // Get AI performance data from the ai module
      const ai = require('../ai');
      const performanceReport = ai.getAIPerformanceReport();
      const cacheStats = ai.getAICacheStats();
      const tunnelStatus = ai.getTunnelStatus();
      
      logger.info?.('Admin AI performance requested', { actor });
      
      res.json({
        success: true,
        data: {
          performance: performanceReport,
          cache: cacheStats,
          tunnel: tunnelStatus,
          timestamp: Date.now()
        }
      });
      
      stopTimer?.({ success: true });
    } catch (error) {
      logger.error?.('Admin AI performance request failed', { 
        actor, 
        error: error.message 
      });
      
      sendMonitorAlert?.('Admin AI performance request failed', {
        severity: 'warning',
        description: error.message,
      })?.catch?.(() => {});
      
      res.status(500).json({ error: 'performance_data_failed' });
      stopTimer?.({ success: false, error: error.message });
    }
  });

  /**
   * Clear AI cache endpoint (admin only)
   */
  app.post('/admin/ai/cache/clear', auth.requireAdmin, (req, res) => {
    const actor = auth.extractUserLogin(req) || 'admin';
    const stopTimer = performanceMonitor?.startTimer?.('admin.ai.cache.clear', {
      method: req.method,
      actor,
      endpoint: req.originalUrl,
    });

    try {
      const ai = require('../ai');
      ai.clearAICache();
      
      logger.info?.('Admin AI cache cleared', { actor });
      
      res.json({
        success: true,
        message: 'AI cache cleared successfully'
      });
      
      stopTimer?.({ success: true });
    } catch (error) {
      logger.error?.('Admin AI cache clear failed', { 
        actor, 
        error: error.message 
      });
      
      res.status(500).json({ error: 'cache_clear_failed' });
      stopTimer?.({ success: false, error: error.message });
    }
  });

  /**
   * Reset AI performance metrics endpoint (admin only)
   */
  app.post('/admin/ai/performance/reset', auth.requireAdmin, (req, res) => {
    const actor = auth.extractUserLogin(req) || 'admin';
    const stopTimer = performanceMonitor?.startTimer?.('admin.ai.performance.reset', {
      method: req.method,
      actor,
      endpoint: req.originalUrl,
    });

    try {
      const ai = require('../ai');
      ai.resetAIPerformanceMetrics();
      
      logger.info?.('Admin AI performance metrics reset', { actor });
      
      res.json({
        success: true,
        message: 'AI performance metrics reset successfully'
      });
      
      stopTimer?.({ success: true });
    } catch (error) {
      logger.error?.('Admin AI performance reset failed', { 
        actor, 
        error: error.message 
      });
      
      res.status(500).json({ error: 'performance_reset_failed' });
      stopTimer?.({ success: false, error: error.message });
    }
  });
}

module.exports = {
  registerAdminAiControlRoutes,
};
