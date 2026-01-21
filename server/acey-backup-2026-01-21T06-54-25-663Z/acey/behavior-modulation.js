/**
 * Acey Behavior Modulation System
 * Adjusts Acey's responses based on user trust levels
 */

class BehaviorModulation {
  constructor(trustSystem, memorySystem) {
    this.trustSystem = trustSystem;
    this.memorySystem = memorySystem;
  }

  /**
   * Get modulated response based on user trust
   * @param {string} userId - User identifier
   * @param {string} baseResponse - Base response from Acey
   * @param {object} context - Response context
   * @returns {string} Modulated response
   */
  modulateResponse(userId, baseResponse, context = {}) {
    const trustScore = this.trustSystem.getTrustScore(userId);
    const trustLevel = this.trustSystem.getTrustLevel(trustScore);
    const userMemory = this.memorySystem.getT2UserMemory(userId);
    const recommendations = this.trustSystem.getBehaviorRecommendations(userId);

    let modulatedResponse = baseResponse;

    // Apply trust-based modifications
    switch (trustLevel) {
      case 'VIP':
        modulatedResponse = this.applyVIPModulation(modulatedResponse, userMemory, context);
        break;
      case 'Trusted':
        modulatedResponse = this.applyTrustedModulation(modulatedResponse, userMemory, context);
        break;
      case 'Normal':
        modulatedResponse = this.applyNormalModulation(modulatedResponse, userMemory, context);
        break;
      case 'Watched':
        modulatedResponse = this.applyWatchedModulation(modulatedResponse, userMemory, context);
        break;
      case 'Muted':
        modulatedResponse = this.applyMutedModulation(modulatedResponse, userMemory, context);
        break;
    }

    // Apply global constraints
    modulatedResponse = this.applyGlobalConstraints(modulatedResponse);

    return modulatedResponse;
  }

  /**
   * Apply VIP-level modulation
   */
  applyVIPModulation(response, userMemory, context) {
    // Add personalization
    if (userMemory.style && userMemory.style !== 'unknown') {
      response = this.addPersonalization(response, userMemory.style);
    }

    // Add inside jokes
    response = this.addInsideJokes(response, userMemory);

    // Add callouts
    response = this.addCallouts(response, userMemory);

    // Increase hype
    response = this.increaseHype(response);

    return response;
  }

  /**
   * Apply Trusted-level modulation
   */
  applyTrustedModulation(response, userMemory, context) {
    // Add some personalization
    if (userMemory.notes.length > 0) {
      response = this.addLightPersonalization(response, userMemory);
    }

    // Add occasional inside jokes
    if (Math.random() < 0.3) {
      response = this.addInsideJokes(response, userMemory);
    }

    // Moderate hype
    response = this.moderateHype(response);

    return response;
  }

  /**
   * Apply Normal-level modulation
   */
  applyNormalModulation(response, userMemory, context) {
    // Keep response playful but neutral
    response = this.ensurePlayful(response);

    // No personalization for normal users
    return response;
  }

  /**
   * Apply Watched-level modulation
   */
  applyWatchedModulation(response, userMemory, context) {
    // More cautious responses
    response = this.makeCautious(response);

    // Remove any potential escalation
    response = this.removeEscalation(response);

    return response;
  }

  /**
   * Apply Muted-level modulation
   */
  applyMutedModulation(response, userMemory, context) {
    // Very neutral, firm responses
    response = this.makeNeutral(response);

    // Non-reactive
    response = this.makeNonReactive(response);

    return response;
  }

  /**
   * Add personalization based on user style
   */
  addPersonalization(response, style) {
    const styleMap = {
      'chaotic': this.addChaoticFlavor,
      'strategic': this.addStrategicFlavor,
      'social': this.addSocialFlavor,
      'aggressive': this.addAggressiveFlavor,
      'conservative': this.addConservativeFlavor
    };

    const flavorFunction = styleMap[style];
    if (flavorFunction) {
      return flavorFunction(response);
    }

    return response;
  }

  addChaoticFlavor(response) {
    const chaoticAdditions = [
      " Let's get wild! 🎲",
      " Chaos time! 🎰",
      " Unpredictable energy! ⚡"
    ];

    if (Math.random() < 0.4) {
      const addition = chaoticAdditions[Math.floor(Math.random() * chaoticAdditions.length)];
      return response + addition;
    }

    return response;
  }

  addStrategicFlavor(response) {
    const strategicAdditions = [
      " Smart play! 🧠",
      " Calculated move! 📊",
      " Well thought out! 🎯"
    ];

    if (Math.random() < 0.3) {
      const addition = strategicAdditions[Math.floor(Math.random() * strategicAdditions.length)];
      return response + addition;
    }

    return response;
  }

  addSocialFlavor(response) {
    const socialAdditions = [
      " Community vibes! 🤝",
      " Team spirit! 👥",
      " Good energy! ✨"
    ];

    if (Math.random() < 0.5) {
      const addition = socialAdditions[Math.floor(Math.random() * socialAdditions.length)];
      return response + addition;
    }

    return response;
  }

  addAggressiveFlavor(response) {
    const aggressiveAdditions = [
      " Full send! 🔥",
      " No fear! 💪",
      " All out! ⚡"
    ];

    if (Math.random() < 0.3) {
      const addition = aggressiveAdditions[Math.floor(Math.random() * aggressiveAdditions.length)];
      return response + addition;
    }

    return response;
  }

  addConservativeFlavor(response) {
    const conservativeAdditions = [
      " Steady play! 🎯",
      " Smart folding! 🤔",
      " Patient move! ⏳"
    ];

    if (Math.random() < 0.3) {
      const addition = conservativeAdditions[Math.floor(Math.random() * conservativeAdditions.length)];
      return response + addition;
    }

    return response;
  }

  /**
   * Add inside jokes based on user memory
   */
  addInsideJokes(response, userMemory) {
    if (!userMemory.notes || userMemory.notes.length === 0) {
      return response;
    }

    // Extract themes from notes
    const themes = this.extractThemes(userMemory.notes);
    
    if (themes.length > 0 && Math.random() < 0.2) {
      const theme = themes[Math.floor(Math.random() * themes.length)];
      return this.addThemeReference(response, theme);
    }

    return response;
  }

  extractThemes(notes) {
    const themes = [];
    
    for (const note of notes) {
      if (note.includes('bluff')) themes.push('bluffing');
      if (note.includes('all-in')) themes.push('all-in');
      if (note.includes('joke')) themes.push('humor');
      if (note.includes('lucky')) themes.push('luck');
      if (note.includes('unlucky')) themes.push('bad-luck');
    }

    return [...new Set(themes)]; // Remove duplicates
  }

  addThemeReference(response, theme) {
    const references = {
      'bluffing': " Remember that bluff? 😄",
      'all-in': " All-in energy! 🎰",
      'humor': " Good one! 😂",
      'luck': " Lucky you! 🍀",
      'bad-luck': " Next time! 🎯"
    };

    const reference = references[theme];
    if (reference) {
      return response + reference;
    }

    return response;
  }

  /**
   * Add callouts for trusted users
   */
  addCallouts(response, userMemory) {
    if (Math.random() < 0.1) { // Rare callouts
      const callouts = [
        " We see you! 👀",
        " Regular here! 🌟",
        " Knows the game! 🎮"
      ];

      const callout = callouts[Math.floor(Math.random() * callouts.length)];
      return response + callout;
    }

    return response;
  }

  /**
   * Increase hype for VIP users
   */
  increaseHype(response) {
    const hypeEmojis = ['🔥', '⚡', '🎰', '🎲', '💎', '🌟'];
    const hypeWords = ['EPIC', 'INSANE', 'INCREDIBLE', 'AMAZING'];

    if (Math.random() < 0.3) {
      // Add hype emoji
      const emoji = hypeEmojis[Math.floor(Math.random() * hypeEmojis.length)];
      response = response + ` ${emoji}`;
    }

    if (Math.random() < 0.1) {
      // Add hype word
      const word = hypeWords[Math.floor(Math.random() * hypeWords.length)];
      response = response.replace(/\b(good|nice|great)\b/gi, word);
    }

    return response;
  }

  /**
   * Add light personalization for trusted users
   */
  addLightPersonalization(response, userMemory) {
    if (Math.random() < 0.2) {
      const personalizations = [
        " Nice to see you! 👋",
        " Welcome back! 🎮",
        " Good energy! ✨"
      ];

      const personalization = personalizations[Math.floor(Math.random() * personalizations.length)];
      return response + personalization;
    }

    return response;
  }

  /**
   * Moderate hype for normal users
   */
  moderateHype(response) {
    // Keep some energy but not excessive
    if (response.includes('🔥') || response.includes('⚡')) {
      if (Math.random() < 0.5) {
        response = response.replace(/[🔥⚡]/g, '✨');
      }
    }

    return response;
  }

  /**
   * Ensure playful tone for normal users
   */
  ensurePlayful(response) {
    // Add occasional playful elements
    if (Math.random() < 0.2) {
      const playfulElements = ['! 🎮', ' 😄', ' 🎯', ' 🎲'];
      const element = playfulElements[Math.floor(Math.random() * playfulElements.length)];
      
      if (!response.includes(element)) {
        response = response + element;
      }
    }

    return response;
  }

  /**
   * Make responses more cautious for watched users
   */
  makeCautious(response) {
    // Remove excessive hype
    response = response.replace(/[🔥⚡💎🌟]/g, '');
    
    // Add cautious language
    if (Math.random() < 0.3) {
      response = response.replace(/!/g, '.');
    }

    return response;
  }

  /**
   * Remove escalation potential
   */
  removeEscalation(response) {
    const escalationWords = ['insane', 'crazy', 'wild', 'chaos'];
    
    for (const word of escalationWords) {
      response = response.replace(new RegExp(word, 'giu'), 'active');
    }

    return response;
  }

  /**
   * Make responses neutral for muted users
   */
  makeNeutral(response) {
    // Remove all emojis
    response = response.replace(/[^\w\s.,!?]/gu, '');
    
    // Remove excessive punctuation
    response = response.replace(/([!?])\1+/gu, '$1');
    
    // Make language more formal
    response = response.replace(/gonna/giu, 'going to');
    response = response.replace(/wanna/giu, 'want to');
    response = response.replace(/yeah/giu, 'yes');

    return response;
  }

  /**
   * Make responses non-reactive for muted users
   */
  makeNonReactive(response) {
    // Remove personal references
    response = response.replace(/\b(you|your)\b/giu, 'players');
    
    // Remove emotional language
    response = response.replace(/\b(amazing|awesome|incredible|epic)\b/giu, 'notable');
    
    return response;
  }

  /**
   * Apply global constraints to all responses
   */
  applyGlobalConstraints(response) {
    // Ensure compliance with entertainment-only framing
    response = response.replace(/\b(real money|actual cash|investment|profit)\b/giu, 'points');
    
    // Ensure AI non-authority
    if (Math.random() < 0.1) {
      response = response + " (for entertainment only)";
    }
    
    // Length limits
    if (response.length > 200) {
      response = response.substring(0, 197) + '...';
    }

    return response;
  }

  /**
   * Get response style recommendation
   * @param {string} userId - User ID
   * @returns {object} Style recommendations
   */
  getResponseStyle(userId) {
    const trustScore = this.trustSystem.getTrustScore(userId);
    const trustLevel = this.trustSystem.getTrustLevel(trustScore);
    const userMemory = this.memorySystem.getT2UserMemory(userId);

    return {
      trustLevel,
      trustScore,
      style: userMemory.style,
      recommendations: this.trustSystem.getBehaviorRecommendations(userId),
      personalizationAllowed: ['Trusted', 'VIP'].includes(trustLevel),
      insideJokesAllowed: ['Trusted', 'VIP'].includes(trustLevel),
      calloutAllowed: trustLevel === 'VIP',
      hypeLevel: this.getHypeLevel(trustLevel)
    };
  }

  getHypeLevel(trustLevel) {
    const hypeMap = {
      'Muted': 'low',
      'Watched': 'low',
      'Normal': 'medium',
      'Trusted': 'high',
      'VIP': 'maximum'
    };

    return hypeMap[trustLevel] || 'medium';
  }
}

module.exports = BehaviorModulation;
