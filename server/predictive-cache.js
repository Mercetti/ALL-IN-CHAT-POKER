/**
 * Predictive AI Response Caching
 * Pre-caches likely responses based on game patterns
 */

const Logger = require('./logger');
const { chat } = require('./ai');

const logger = new Logger('predictive-cache');

class PredictiveCache {
  constructor(options = {}) {
    this.maxPredictiveEntries = options.maxPredictiveEntries || 200;
    this.predictiveCache = new Map();
    this.patterns = new Map();
    this.gameContexts = new Map();
    
    this.initializePatterns();
  }

  /**
   * Initialize common poker patterns
   */
  initializePatterns() {
    // Common game events
    this.patterns.set('player_win', [
      { role: 'user', content: 'Player won the hand' },
      { role: 'system', content: 'You are Acey, a flirty poker dealer.' }
    ]);
    
    this.patterns.set('player_lose', [
      { role: 'user', content: 'Player lost the hand' },
      { role: 'system', content: 'You are Acey, a savage poker dealer.' }
    ]);
    
    this.patterns.set('special_card', [
      { role: 'user', content: 'Player got an Ace of Spades' },
      { role: 'system', content: 'You are Acey, a playful poker dealer.' }
    ]);
    
    this.patterns.set('big_pot', [
      { role: 'user', content: 'The pot is very large now' },
      { role: 'system', content: 'You are Acey, an excited poker dealer.' }
    ]);
    
    // Common coding help patterns
    this.patterns.set('debug_help', [
      { role: 'user', content: 'Help me debug this error' },
      { role: 'system', content: 'You are a helpful coding assistant.' }
    ]);
    
    // Common audio generation patterns
    this.patterns.set('win_music', [
      { role: 'user', content: 'Generate celebration music' },
      { role: 'system', content: 'You are an audio engineer.' }
    ]);
  }

  /**
   * Pre-cache responses for common patterns
   */
  async preCacheResponses() {
    logger.info('Starting predictive caching...');
    
    const cachePromises = [];
    
    for (const [patternName, messages] of this.patterns.entries()) {
      // Cache for different tones/contexts
      const contexts = ['flirty', 'savage', 'playful', 'coding', 'audio'];
      
      for (const context of contexts) {
        const options = {
          context,
          maxTokens: 25, // Shorter for predictive cache
          temperature: 0.8
        };
        
        cachePromises.push(
          this.cachePattern(patternName, messages, options)
            .catch(error => logger.warn(`Failed to cache ${patternName}-${context}`, error))
        );
      }
    }
    
    const results = await Promise.allSettled(cachePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    logger.info(`Predictive caching complete: ${successful}/${results.length} cached`);
    return { successful, total: results.length };
  }

  /**
   * Cache a specific pattern
   */
  async cachePattern(patternName, messages, options) {
    try {
      const response = await chat(messages, options);
      const key = this.generatePredictiveKey(patternName, options.context);
      
      this.predictiveCache.set(key, {
        response,
        patternName,
        context: options.context,
        timestamp: Date.now(),
        usage: 0
      });
      
      return { success: true, key };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate predictive cache key
   */
  generatePredictiveKey(patternName, context) {
    return `pred:${patternName}:${context}`;
  }

  /**
   * Get predictive cached response
   */
  getPredictiveResponse(patternName, context) {
    const key = this.generatePredictiveKey(patternName, context);
    const cached = this.predictiveCache.get(key);
    
    if (cached) {
      cached.usage++;
      logger.debug('Predictive cache hit', { patternName, context });
      return cached.response;
    }
    
    return null;
  }

  /**
   * Update game context for better predictions
   */
  updateGameContext(gameState) {
    const contextKey = `game_${gameState.sessionId}`;
    this.gameContexts.set(contextKey, {
      lastUpdate: Date.now(),
      state: gameState,
      recentEvents: gameState.recentEvents || []
    });
    
    // Trigger predictive caching based on game state
    this.predictFromGameState(gameState);
  }

  /**
   * Predict and cache based on current game state
   */
  async predictFromGameState(gameState) {
    const predictions = [];
    
    // Predict likely next events
    if (gameState.phase === 'betting') {
      predictions.push('big_pot', 'player_fold');
    }
    
    if (gameState.phase === 'showdown') {
      predictions.push('player_win', 'player_lose');
    }
    
    // Pre-cache predicted responses
    for (const prediction of predictions) {
      const cached = this.getPredictiveResponse(prediction, gameState.tone || 'playful');
      if (!cached) {
        // Cache this prediction
        const messages = this.patterns.get(prediction);
        if (messages) {
          await this.cachePattern(prediction, messages, { 
            context: gameState.tone || 'playful' 
          }).catch(() => {}); // Ignore errors in predictive caching
        }
      }
    }
  }

  /**
   * Get predictive cache statistics
   */
  getStats() {
    const stats = {
      totalEntries: this.predictiveCache.size,
      maxEntries: this.maxPredictiveEntries,
      patterns: this.patterns.size,
      gameContexts: this.gameContexts.size,
      usage: {
        totalUsage: 0,
        averageUsage: 0,
        mostUsed: null
      }
    };
    
    // Calculate usage statistics
    let totalUsage = 0;
    let mostUsed = null;
    let maxUsage = 0;
    
    for (const [key, entry] of this.predictiveCache.entries()) {
      totalUsage += entry.usage;
      if (entry.usage > maxUsage) {
        maxUsage = entry.usage;
        mostUsed = { key, patternName: entry.patternName, usage: entry.usage };
      }
    }
    
    stats.usage.totalUsage = totalUsage;
    stats.usage.averageUsage = this.predictiveCache.size > 0 ? totalUsage / this.predictiveCache.size : 0;
    stats.usage.mostUsed = mostUsed;
    
    return stats;
  }

  /**
   * Clear predictive cache
   */
  clearCache() {
    this.predictiveCache.clear();
    logger.info('Predictive cache cleared');
  }

  /**
   * Refresh predictive cache
   */
  async refreshCache() {
    this.clearCache();
    return await this.preCacheResponses();
  }
}

module.exports = PredictiveCache;
