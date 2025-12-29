/**
 * Unified AI System Manager
 * Integrates chat bot and cosmetic AI into a single cohesive system
 */

const AIEnhancedChatBot = require('../bot/ai-chatbot');
const EnhancedCosmeticAI = require('./enhanced-cosmetic-ai');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger();

class UnifiedAISystem {
  constructor(options = {}) {
    this.options = {
      enableChatBot: options.enableChatBot !== false,
      enableCosmeticAI: options.enableCosmeticAI !== false,
      chatBotOptions: options.chatBotOptions || {},
      cosmeticAIOptions: options.cosmeticAIOptions || {},
      sharedOptions: options.sharedOptions || {}
    };
    
    this.chatBot = null;
    this.cosmeticAI = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    // Initialize chat bot if enabled
    if (this.options.enableChatBot) {
      this.chatBot = new AIEnhancedChatBot({
        ...this.options.chatBotOptions,
        ...this.options.sharedOptions
      });
    }
    
    // Initialize cosmetic AI if enabled
    if (this.options.enableCosmeticAI) {
      this.cosmeticAI = new EnhancedCosmeticAI({
        ...this.options.cosmeticAIOptions,
        ...this.options.sharedOptions
      });
    }
    
    this.isInitialized = true;
    logger.info('Unified AI System initialized', {
      chatBot: !!this.chatBot,
      cosmeticAI: !!this.cosmeticAI
    });
  }

  /**
   * Process chat message with AI enhancement
   */
  async processChatMessage(message, user, channel, gameState) {
    if (!this.chatBot) {
      return null;
    }
    
    return await this.chatBot.processMessage(message, user, channel, gameState);
  }

  /**
   * Generate cosmetic with enhanced AI
   */
  async generateCosmetic(options) {
    if (!this.cosmeticAI) {
      throw new Error('Cosmetic AI is not enabled');
    }
    
    return await this.cosmeticAI.generateEnhancedCosmetic(options);
  }

  /**
   * Generate cosmetic variants
   */
  async generateCosmeticVariants(baseDesign, userId) {
    if (!this.cosmeticAI) {
      throw new Error('Cosmetic AI is not enabled');
    }
    
    return await this.cosmeticAI.generateVariants(baseDesign, userId);
  }

  /**
   * Generate themed cosmetic set
   */
  async generateThemedSet(theme, login, logoPath) {
    if (!this.cosmeticAI) {
      throw new Error('Cosmetic AI is not enabled');
    }
    
    return await this.cosmeticAI.generateThemedSet(theme, login, logoPath);
  }

  /**
   * Get AI status for both systems
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      chatBot: this.chatBot ? this.chatBot.getStatus() : null,
      cosmeticAI: this.cosmeticAI ? this.cosmeticAI.getStatus() : null,
      sharedOptions: this.options
    };
  }

  /**
   * Get available features
   */
  getAvailableFeatures() {
    const features = {};
    
    if (this.chatBot) {
      features.chatBot = {
        enabled: true,
        personality: this.chatBot.options.personality,
        gameKnowledge: this.chatBot.options.gameKnowledge,
        learning: this.chatBot.options.learning
      };
    }
    
    if (this.cosmeticAI) {
      features.cosmeticAI = {
        enabled: true,
        publicGeneration: this.cosmeticAI.options.enablePublicGeneration,
        maxConcurrent: this.cosmeticAI.options.maxConcurrentGenerations,
        availablePresets: this.cosmeticAI.getAvailablePresets(),
        availableTypes: this.cosmeticAI.getAvailableTypes()
      };
    }
    
    return features;
  }

  /**
   * Update configuration
   */
  updateConfig(newOptions) {
    // Update options
    Object.assign(this.options, newOptions);
    
    // Reinitialize if needed
    if (this.isInitialized) {
      this.init();
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    if (this.chatBot) {
      this.chatBot.clearCache();
    }
    
    if (this.cosmeticAI) {
      this.cosmeticAI.clearCache();
    }
  }

  /**
   * Get user profile (combines data from both systems)
   */
  getUserProfile(user) {
    const profile = {};
    
    if (this.chatBot) {
      const botProfile = this.chatBot.playerProfiles.get(user);
      if (botProfile) {
        profile.chat = {
          level: botProfile.level,
          handsPlayed: botProfile.handsPlayed,
          winRate: botProfile.winRate,
          interests: botProfile.interests,
          lastSeen: botProfile.lastSeen
        };
      }
    }
    
    if (this.cosmeticAI) {
      const cosmeticProfile = this.cosmeticAI.userCooldowns.get(user);
      if (cosmeticProfile) {
        profile.cosmetics = {
          lastGeneration: cosmeticProfile,
          canGenerate: this.cosmeticAI.canGenerate(user),
          cooldownRemaining: this.cosmeticAI.getGenerationStatus(user).cooldownRemaining
        };
      }
    }
    
    return profile;
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    const stats = {
      initialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
    
    if (this.chatBot) {
      stats.chatBot = {
        conversations: this.chatBot.conversationHistory.size,
        profiles: this.chatBot.playerProfiles.size,
        cacheSize: this.chatBot.responseCache.size
      };
    }
    
    if (this.cosmeticAI) {
      stats.cosmeticAI = {
        activeGenerations: this.cosmeticAI.activeGenerations.size,
        cacheSize: this.cosmeticAI.generationCache.size,
        userCooldowns: this.cosmeticAI.userCooldowns.size
      };
    }
    
    return stats;
  }

  /**
   * Health check for both AI systems
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      systems: {}
    };
    
    // Check chat bot health
    if (this.chatBot) {
      try {
        const status = this.chatBot.getStatus();
        health.systems.chatBot = {
          status: status.enabled ? 'healthy' : 'disabled',
          lastInteraction: status.lastInteraction,
          conversations: status.conversations
        };
      } catch (error) {
        health.systems.chatBot = {
          status: 'error',
          error: error.message
        };
        health.status = 'degraded';
      }
    }
    
    // Check cosmetic AI health
    if (this.cosmeticAI) {
      try {
        const status = this.cosmeticAI.getStatus();
        health.systems.cosmeticAI = {
          status: status.enabled ? 'healthy' : 'disabled',
          activeGenerations: status.activeGenerations,
          maxConcurrent: status.maxConcurrent
        };
      } catch (error) {
        health.systems.cosmeticAI = {
          status: 'error',
          error: error.message
        };
        health.status = 'degraded';
      }
    }
    
    return health;
  }

  /**
   * Shutdown gracefully
   */
  shutdown() {
    if (this.chatBot) {
      this.chatBot.clearCache();
    }
    
    if (this.cosmeticAI) {
      this.cosmeticAI.clearCache();
    }
    
    this.isInitialized = false;
    logger.info('Unified AI System shut down');
  }
}

module.exports = UnifiedAISystem;
