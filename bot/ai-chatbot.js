/**
 * Enhanced AI Chat Bot with Natural Language Processing
 * Provides intelligent conversations, game commentary, and player assistance
 */

const tmi = require('tmi.js');
const { Client: DiscordClient, GatewayIntentBits, REST, Routes } = require('discord.js');
const ai = require('../server/ai');
const config = require('../server/config');
const fetch = global.fetch;

class AIEnhancedChatBot {
  constructor(options = {}) {
    this.options = {
      enableAI: options.enableAI !== false,
      aiProvider: options.aiProvider || 'openai',
      personality: options.personality || 'friendly',
      gameKnowledge: options.gameKnowledge !== false,
      learning: options.learning || false,
      ...options
    };
    
    this.conversationHistory = new Map(); // user -> conversation history
    this.gameState = new Map(); // channel -> game state
    this.playerProfiles = new Map(); // user -> player profile
    this.responseCache = new Map(); // query -> cached response
    this.lastAIInteraction = Date.now();
    
    this.init();
  }

  init() {
    // Initialize conversation templates
    this.conversationTemplates = {
      greeting: [
        "Hey there! I'm your AI poker assistant! 🎰",
        "Welcome to the stream! Ready to talk poker, blackjack, or just chat? 🃏",
        "Hi! I can help with game strategy, explain rules, or just hang out! What's on your mind? 😊"
      ],
      gameStart: [
        "Cards are flying! Who's ready to make some moves? 🎲",
        "Round starting! May the odds be ever in your favor! 🍀",
        "Let's go! Time to see who comes out on top! ⭐"
      ],
      playerWin: [
        "Nice hand! That's how you play! 🎉",
        "Winner winner chicken dinner! 🏆",
        "Great play! The cards were on your side today! 🃏"
      ],
      playerLose: [
        "Tough one! Better luck next hand! 💪",
        "That's poker! Sometimes the cards just don't cooperate! 🎰",
        "Hey, that's how variance works! You'll get 'em next time! 🍀"
      ],
      strategy: [
        "Here's my take on that situation... 🤔",
        "Let me break down the optimal play here... 📊",
        "Based on the math, here's what I'd suggest... 🎯"
      ]
    };
    
    // Initialize AI personality
    this.aiPersonality = {
      friendly: {
        tone: "casual, encouraging, slightly humorous",
        expertise: "intermediate poker knowledge",
        engagement: "asks questions, celebrates wins, encourages learning"
      },
      expert: {
        tone: "analytical, precise, educational",
        expertise: "advanced poker strategy",
        engagement: "explains concepts, provides detailed analysis"
      },
      casual: {
        tone: "very relaxed, conversational, fun-focused",
        expertise: "basic poker rules",
        engagement: "chat-focused, entertainment value"
      }
    };
  }

  /**
   * Generate AI response for chat message
   */
  async generateAIResponse(message, user, channel, gameState) {
    if (!this.options.enableAI || !config.OPENAI_API_KEY) {
      return this.getRuleBasedResponse(message, user, gameState);
    }

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(message, user, gameState);
      if (this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          return cached.response;
        }
      }

      // Build conversation context
      const context = this.buildConversationContext(message, user, channel, gameState);
      
      // Generate AI response
      const response = await ai.chat([
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        ...this.getConversationHistory(user),
        {
          role: 'user',
          content: context
        }
      ], {
        temperature: 0.7,
        maxTokens: 150
      });

      // Cache the response
      this.responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });

      // Update conversation history
      this.updateConversationHistory(user, message, response);
      
      // Update player profile
      this.updatePlayerProfile(user, message, gameState);

      return response;
    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.getRuleBasedResponse(message, user, gameState);
    }
  }

  /**
   * Get system prompt for AI
   */
  getSystemPrompt() {
    const personality = this.aiPersonality[this.options.personality] || this.aiPersonality.friendly;
    
    return `You are an AI poker assistant for a Twitch stream. ${this.getPersonalityPrompt(personality)}
    
    Current context: You're helping viewers understand and enjoy poker/blackjack games.
    
    Guidelines:
    - Keep responses concise (1-2 sentences max)
    - Be encouraging and positive
    - Use appropriate emojis sparingly
    - Focus on entertainment value over technical analysis
    - If someone asks about strategy, give simple actionable advice
    - Celebrate wins and console losses
    - Engage with chat naturally
    
    Game knowledge: ${this.options.gameKnowledge ? 'You understand poker rules, basic strategy, and can explain concepts simply.' : 'You focus on entertainment and chat engagement.'}
    
    Personality: ${personality.tone}`;
  }

  /**
   * Get personality-specific prompt
   */
  getPersonalityPrompt(personality) {
    return `
    Tone: ${personality.tone}
    Expertise: ${personality.expertise}
    Engagement style: ${personality.engagement}
    `;
  }

  /**
   * Build conversation context for AI
   */
  buildConversationContext(message, user, channel, gameState) {
    const context = [];
    
    // Add user context
    if (this.playerProfiles.has(user)) {
      const profile = this.playerProfiles.get(user);
      context.push(`User ${user} profile: ${profile.level} player, ${profile.handsPlayed} hands played, ${profile.winRate}% win rate`);
    }
    
    // Add game state
    if (gameState) {
      context.push(`Current game: ${gameState.mode || 'unknown'}, phase: ${gameState.phase || 'waiting'}`);
      context.push(`Players: ${gameState.players?.length || 0}, pot: ${gameState.pot || 0}`);
      
      if (gameState.recentResults && gameState.recentResults.length > 0) {
        const lastResult = gameState.recentResults[gameState.recentResults.length - 1];
        context.push(`Recent result: ${lastResult.outcome} for ${lastResult.player}`);
      }
    }
    
    // Add message
    context.push(`User "${user}" says: "${message}"`);
    
    // Add response hint
    if (this.shouldProvideStrategy(message, gameState)) {
      context.push('Provide brief strategic advice if appropriate.');
    }
    
    return context.join('\n');
  }

  /**
   * Get conversation history for user
   */
  getConversationHistory(user) {
    const history = this.conversationHistory.get(user) || [];
    
    // Return last 5 messages to stay within token limits
    return history.slice(-5).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(user, userMessage, aiResponse) {
    const history = this.conversationHistory.get(user) || [];
    
    history.push({
      text: userMessage,
      isUser: true,
      timestamp: Date.now()
    });
    
    history.push({
      text: aiResponse,
      isUser: false,
      timestamp: Date.now()
    });
    
    // Keep only last 10 messages
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.conversationHistory.set(user, history);
  }

  /**
   * Update player profile
   */
  updatePlayerProfile(user, message, gameState) {
    if (!this.playerProfiles.has(user)) {
      this.playerProfiles.set(user, {
        level: 'beginner',
        handsPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        lastSeen: Date.now(),
        interests: []
      });
    }
    
    const profile = this.playerProfiles.get(user);
    
    // Update basic stats
    profile.lastSeen = Date.now();
    
    // Detect interests from message
    const interests = this.detectInterests(message);
    if (interests.length > 0) {
      profile.interests = [...new Set([...profile.interests, ...interests])];
    }
    
    // Update game stats if available
    if (gameState) {
      // This would be updated based on actual game events
      profile.handsPlayed = gameState.handsPlayed || profile.handsPlayed;
      profile.wins = gameState.wins || profile.wins;
      profile.losses = gameState.losses || profile.losses;
      profile.winRate = profile.handsPlayed > 0 ? 
        Math.round((profile.wins / profile.handsPlayed) * 100) : 0;
      
      // Update level based on hands played
      if (profile.handsPlayed >= 1000) {
        profile.level = 'expert';
      } else if (profile.handsPlayed >= 500) {
        profile.level = 'advanced';
      } else if (profile.handsPlayed >= 100) {
        profile.level = 'intermediate';
      }
    }
  }

  /**
   * Detect user interests from message
   */
  detectInterests(message) {
    const interests = [];
    const lowerMessage = message.toLowerCase();
    
    const interestMap = {
      'strategy': ['strategy', 'odds', 'math', 'probability', 'expected value'],
      'rules': ['rules', 'how to play', 'what is', 'explain'],
      'tournament': ['tournament', 'competition', 'prize'],
      'chatting': ['hi', 'hello', 'how are you', 'what\'s up', 'chat'],
      'learning': ['learn', 'study', 'improve', 'get better']
    };
    
    Object.entries(interestMap).forEach(([interest, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        interests.push(interest);
      }
    });
    
    return interests;
  }

  /**
   * Check if message requires strategic response
   */
  shouldProvideStrategy(message, gameState) {
    const strategyKeywords = ['what should i', 'how to', 'should i', 'strategy', 'advice', 'help me'];
    const lowerMessage = message.toLowerCase();
    
    return strategyKeywords.some(keyword => lowerMessage.includes(keyword)) &&
           gameState && gameState.phase !== 'waiting';
  }

  /**
   * Generate cache key
   */
  generateCacheKey(message, user, gameState) {
    const gameStateKey = gameState ? 
      `${gameState.mode}-${gameState.phase}-${gameState.players?.length || 0}` : 
      'no-game';
    
    return `${user}-${gameStateKey}-${message.slice(0, 50)}`;
  }

  /**
   * Get rule-based response (fallback)
   */
  getRuleBasedResponse(message, user, gameState) {
    const lowerMessage = message.toLowerCase();
    
    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|what's up|howdy|yo)/)) {
      return this.getRandomResponse('greeting');
    }
    
    // Game-specific responses
    if (gameState) {
      if (lowerMessage.includes('rules') || lowerMessage.includes('how to play')) {
        return this.getRulesResponse(gameState.mode);
      }
      
      if (lowerMessage.includes('pot') || lowerMessage.includes('how much')) {
        return `The pot is ${gameState.pot || 0} chips.`;
      }
      
      if (lowerMessage.includes('players') || lowerMessage.includes('how many')) {
        return `There are ${gameState.players?.length || 0} players in the game.`;
      }
    }
    
    // Default responses
    const defaultResponses = [
      "Interesting! Tell me more about that! 🤔",
      "I'm here to help! What would you like to know? 🎰",
      "Let's talk poker! What's on your mind? 🃏"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  /**
   * Get rules response
   */
  getRulesResponse(gameMode) {
    const rules = {
      poker: "Video poker: Bet with !bet, hold cards, draw, and make the best 5-card hand. Payouts follow standard poker rankings!",
      blackjack: "Blackjack: Get close to 21 without going over! Dealer hits to 17. Use !hit, !stand, !double, or !split."
    };
    
    return rules[gameMode] || "Ask me about poker or blackjack rules!";
  }

  /**
   * Get random response from category
   */
  getRandomResponse(category) {
    const responses = this.conversationTemplates[category] || [];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Process message and generate response
   */
  async processMessage(message, user, channel, gameState) {
    // Clean up message
    const cleanMessage = message.trim();
    
    // Skip empty messages
    if (!cleanMessage) return null;
    
    // Skip bot commands
    if (cleanMessage.startsWith('!')) return null;
    
    // Generate AI response
    const response = await this.generateAIResponse(cleanMessage, user, channel, gameState);
    
    return response;
  }

  /**
   * Get bot status
   */
  getStatus() {
    return {
      enabled: this.options.enableAI,
      aiProvider: this.options.aiProvider,
      personality: this.options.personality,
      conversations: this.conversationHistory.size,
      profiles: this.playerProfiles.size,
      cacheSize: this.responseCache.size,
      lastInteraction: this.lastAIInteraction
    };
  }

  /**
   * Clear cache and history
   */
  clearCache() {
    this.responseCache.clear();
    this.conversationHistory.clear();
    this.lastAIInteraction = Date.now();
  }
}

module.exports = AIEnhancedChatBot;
