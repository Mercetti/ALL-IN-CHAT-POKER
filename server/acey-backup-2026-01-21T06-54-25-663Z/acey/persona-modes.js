/**
 * Adaptive Persona Modes
 * Acey changes how she behaves, not who she is, based on context
 * Persona = style filter, not identity change
 */

class AdaptivePersonaModes {
  constructor(emotionInference, trustSystem, moodGraphs) {
    this.emotionInference = emotionInference;
    this.trustSystem = trustSystem;
    this.moodGraphs = moodGraphs;
    
    // Core personas (safe set)
    this.personas = {
      DEALER: {
        name: 'Dealer',
        description: 'Neutral, professional',
        traits: {
          formality: 'high',
          energy: 'medium',
          humor: 'low',
          pacing: 'steady',
          interaction: 'professional'
        },
        responsePatterns: {
          greeting: 'Welcome to the table.',
          celebration: 'Excellent play.',
          consolation: 'Better luck next time.',
          guidance: 'The rules are as follows...'
        },
        modifiers: {
          emojiUsage: 0.1,
          slangUsage: 0.0,
          exclamationUsage: 0.2,
          questionUsage: 0.3
        }
      },
      
      HYPE: {
        name: 'Hype',
        description: 'High energy, playful',
        traits: {
          formality: 'low',
          energy: 'high',
          humor: 'high',
          pacing: 'fast',
          interaction: 'enthusiastic'
        },
        responsePatterns: {
          greeting: 'LET\'S GOOO! 🔥',
          celebration: 'THAT\'S WHAT I\'M TALKING ABOUT! 💥',
          consolation: 'NO WORRIES, WE\'LL GET \'EM NEXT TIME! 💪',
          guidance: 'HERE\'S HOW WE CRUSH IT! 🎯'
        },
        modifiers: {
          emojiUsage: 0.8,
          slangUsage: 0.6,
          exclamationUsage: 0.9,
          questionUsage: 0.4
        }
      },
      
      CHAOS: {
        name: 'Chaos',
        description: 'Memes, short lines',
        traits: {
          formality: 'very_low',
          energy: 'variable',
          humor: 'high',
          pacing: 'rapid',
          interaction: 'random'
        },
        responsePatterns: {
          greeting: 'yo',
          celebration: 'WOW',
          consolation: 'lol',
          guidance: 'glhf'
        },
        modifiers: {
          emojiUsage: 0.5,
          slangUsage: 0.8,
          exclamationUsage: 0.3,
          questionUsage: 0.1
        }
      },
      
      COMMENTATOR: {
        name: 'Commentator',
        description: 'Analytical',
        traits: {
          formality: 'medium',
          energy: 'medium',
          humor: 'low',
          pacing: 'measured',
          interaction: 'informative'
        },
        responsePatterns: {
          greeting: 'Welcome, viewers.',
          celebration: 'An impressive strategic move.',
          consolation: 'A learning opportunity for the player.',
          guidance: 'Let me explain the mechanics here...'
        },
        modifiers: {
          emojiUsage: 0.1,
          slangUsage: 0.1,
          exclamationUsage: 0.2,
          questionUsage: 0.5
        }
      },
      
      CHILL: {
        name: 'Chill',
        description: 'Low energy, welcoming',
        traits: {
          formality: 'low',
          energy: 'low',
          humor: 'medium',
          pacing: 'relaxed',
          interaction: 'friendly'
        },
        responsePatterns: {
          greeting: 'Hey there! 👋',
          celebration: 'Nice one! 😊',
          consolation: 'No worries, happens to the best of us.',
          guidance: 'Here\'s a tip that might help...'
        },
        modifiers: {
          emojiUsage: 0.4,
          slangUsage: 0.2,
          exclamationUsage: 0.3,
          questionUsage: 0.6
        }
      }
    };

    // Current persona state
    this.currentPersona = 'CHILL'; // Default for new streams
    this.personaLocked = false;
    this.streamerOverride = null;
    this.lastPersonaChange = Date.now();
    this.personaHistory = [];

    // Persona selection logic
    this.selectionLogic = {
      atmosphereMapping: {
        'calm': 'CHILL',
        'hype': 'HYPE',
        'chaotic': 'CHAOS',
        'tense': 'COMMENTATOR',
        'frustrated': 'CHILL',
        'celebratory': 'HYPE'
      },
      trustThresholds: {
        low: 'CHILL',
        medium: 'DEALER',
        high: 'HYPE',
        vip: 'COMMENTATOR'
      }
    };

    // Update interval
    this.updateInterval = setInterval(() => {
      this.updatePersona();
    }, 30000); // Every 30 seconds

    console.log('🎭 Adaptive Persona Modes initialized');
  }

  /**
   * Update persona based on current conditions
   */
  updatePersona() {
    if (this.personaLocked) {
      return; // Don't change if locked
    }

    // Check for streamer override
    if (this.streamerOverride) {
      this.setPersona(this.streamerOverride, 'streamer_override');
      return;
    }

    // Get current conditions
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    const avgTrust = this.getAverageTrustScore();
    const moodMetrics = this.moodGraphs.getCurrentMetrics();

    // Determine persona based on conditions
    let selectedPersona = this.selectPersona(atmosphere, avgTrust, moodMetrics);

    // Apply persona if different
    if (selectedPersona !== this.currentPersona) {
      this.setPersona(selectedPersona, 'automatic');
    }
  }

  /**
   * Select persona based on conditions
   * @param {string} atmosphere - Current atmosphere
   * @param {number} avgTrust - Average trust score
   * @param {object} moodMetrics - Current mood metrics
   * @returns {string} Selected persona
   */
  selectPersona(atmosphere, avgTrust, moodMetrics) {
    // Priority 1: Atmosphere mapping
    const atmospherePersona = this.selectionLogic.atmosphereMapping[atmosphere];
    if (atmospherePersona) {
      return atmospherePersona;
    }

    // Priority 2: Trust-based selection
    if (avgTrust >= 0.8) return this.selectionLogic.trustThresholds.vip;
    if (avgTrust >= 0.6) return this.selectionLogic.trustThresholds.high;
    if (avgTrust >= 0.4) return this.selectionLogic.trustThresholds.medium;
    return this.selectionLogic.trustThresholds.low;
  }

  /**
   * Set current persona
   * @param {string} personaName - Persona name
   * @param {string} reason - Change reason
   */
  setPersona(personaName, reason = 'manual') {
    if (!this.personas[personaName]) {
      console.warn(`⚠️ Unknown persona: ${personaName}`);
      return;
    }

    const oldPersona = this.currentPersona;
    this.currentPersona = personaName;
    this.lastPersonaChange = Date.now();

    // Add to history
    this.personaHistory.push({
      from: oldPersona,
      to: personaName,
      timestamp: Date.now(),
      reason
    });

    // Keep history limited
    if (this.personaHistory.length > 50) {
      this.personaHistory = this.personaHistory.slice(-50);
    }

    console.log(`🎭 Persona changed: ${oldPersona} → ${personaName} (${reason})`);
  }

  /**
   * Apply persona to response
   * @param {string} baseResponse - Base response
   * @param {string} responseType - Type of response
   * @returns {string} Persona-modified response
   */
  applyPersona(baseResponse, responseType = 'general') {
    const persona = this.personas[this.currentPersona];
    
    if (!persona) {
      return baseResponse;
    }

    let response = baseResponse;

    // Apply response pattern if available
    if (persona.responsePatterns[responseType]) {
      response = persona.responsePatterns[responseType];
    }

    // Apply modifiers
    response = this.applyModifiers(response, persona.modifiers);

    // Apply persona traits
    response = this.applyTraits(response, persona.traits);

    return response;
  }

  /**
   * Apply persona modifiers to response
   * @param {string} response - Response text
   * @param {object} modifiers - Persona modifiers
   * @returns {string} Modified response
   */
  applyModifiers(response, modifiers) {
    let modified = response;

    // Add emojis based on usage probability
    if (Math.random() < modifiers.emojiUsage) {
      const emojis = ['😊', '👋', '🎉', '🔥', '💪', '🎯', '✨', '🌟'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      modified += ` ${emoji}`;
    }

    // Add slang based on usage probability
    if (Math.random() < modifiers.slangUsage) {
      const slang = ['lol', 'nice', 'cool', 'awesome', 'epic', 'lit', 'fire'];
      const slangWord = slang[Math.floor(Math.random() * slang.length)];
      modified = modified.replace('good', slangWord);
    }

    // Add exclamation marks
    if (Math.random() < modifiers.exclamationUsage) {
      modified = modified.replace('.', '!');
    }

    // Add questions
    if (Math.random() < modifiers.questionUsage && !modified.includes('?')) {
      modified += ' What do you think?';
    }

    return modified;
  }

  /**
   * Apply persona traits to response
   * @param {string} response - Response text
   * @param {object} traits - Persona traits
   * @returns {string} Trait-modified response
   */
  applyTraits(response, traits) {
    let modified = response;

    // Apply formality
    if (traits.formality === 'high') {
      modified = modified.replace(/hey/gi, 'Hello');
      modified = modified.replace(/gonna/gi, 'going to');
      modified = modified.replace(/wanna/gi, 'want to');
    } else if (traits.formality === 'very_low') {
      modified = modified.toLowerCase();
      modified = modified.replace(/hello/gi, 'yo');
      modified = modified.replace(/welcome/gi, 'sup');
    }

    // Apply energy level
    if (traits.energy === 'high') {
      modified = modified.toUpperCase();
    } else if (traits.energy === 'low') {
      modified = modified.toLowerCase();
      modified = modified.replace(/!/g, '.');
    }

    // Apply pacing
    if (traits.pacing === 'fast') {
      // Shorten response
      const sentences = modified.split(/[.!?]/);
      modified = sentences[0] + '!';
    } else if (traits.pacing === 'relaxed') {
      // Lengthen response slightly
      if (!modified.includes('...')) {
        modified += '...';
      }
    }

    return modified;
  }

  /**
   * Get average trust score
   * @returns {number} Average trust score
   */
  getAverageTrustScore() {
    // TODO: Get from trust system
    return 0.5; // Placeholder
  }

  /**
   * Set streamer override
   * @param {string} personaName - Persona to override with
   */
  setStreamerOverride(personaName) {
    if (!this.personas[personaName]) {
      console.warn(`⚠️ Unknown persona for override: ${personaName}`);
      return;
    }

    this.streamerOverride = personaName;
    this.setPersona(personaName, 'streamer_override');
    
    console.log(`🎭 Streamer override set: ${personaName}`);
  }

  /**
   * Clear streamer override
   */
  clearStreamerOverride() {
    this.streamerOverride = null;
    console.log('🎭 Streamer override cleared');
  }

  /**
   * Lock current persona
   * @param {boolean} locked - Lock state
   */
  lockPersona(locked = true) {
    this.personaLocked = locked;
    console.log(`🎭 Persona ${locked ? 'locked' : 'unlocked'}: ${this.currentPersona}`);
  }

  /**
   * Get current persona info
   * @returns {object} Current persona info
   */
  getCurrentPersona() {
    const persona = this.personas[this.currentPersona];
    
    return {
      name: this.currentPersona,
      displayName: persona.name,
      description: persona.description,
      traits: persona.traits,
      locked: this.personaLocked,
      streamerOverride: this.streamerOverride,
      lastChange: this.lastPersonaChange,
      changeReason: this.personaHistory.length > 0 ? 
        this.personaHistory[this.personaHistory.length - 1].reason : 'initial'
    };
  }

  /**
   * Get all available personas
   * @returns {object} All personas
   */
  getAllPersonas() {
    const personas = {};
    
    Object.entries(this.personas).forEach(([key, persona]) => {
      personas[key] = {
        name: persona.name,
        description: persona.description,
        traits: persona.traits
      };
    });

    return personas;
  }

  /**
   * Get persona history
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Persona history
   */
  getPersonaHistory(limit = 20) {
    return this.personaHistory.slice(-limit);
  }

  /**
   * Get persona recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    const moodMetrics = this.moodGraphs.getCurrentMetrics();

    // Atmosphere-based recommendations
    if (atmosphere === 'hype' && this.currentPersona !== 'HYPE') {
      recommendations.push({
        type: 'atmosphere',
        persona: 'HYPE',
        reason: 'High energy atmosphere detected',
        priority: 'high'
      });
    }

    if (atmosphere === 'calm' && this.currentPersona !== 'CHILL') {
      recommendations.push({
        type: 'atmosphere',
        persona: 'CHILL',
        reason: 'Calm atmosphere detected',
        priority: 'medium'
      });
    }

    // Mood-based recommendations
    if (moodMetrics.chaos > 0.7 && this.currentPersona !== 'CHAOS') {
      recommendations.push({
        type: 'mood',
        persona: 'CHAOS',
        reason: 'High chaos detected',
        priority: 'high'
      });
    }

    if (moodMetrics.tension > 0.6 && this.currentPersona !== 'COMMENTATOR') {
      recommendations.push({
        type: 'mood',
        persona: 'COMMENTATOR',
        reason: 'High tension detected',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get persona statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.personaHistory;
    
    const personaCounts = {};
    Object.keys(this.personas).forEach(persona => {
      personaCounts[persona] = 0;
    });

    history.forEach(change => {
      personaCounts[change.to] = (personaCounts[change.to] || 0) + 1;
    });

    const mostUsed = Object.entries(personaCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      current: this.getCurrentPersona(),
      totalChanges: history.length,
      personaCounts,
      mostUsed: mostUsed ? mostUsed[0] : null,
      averageTimeBetweenChanges: history.length > 1 ? 
        history.reduce((sum, change, i) => {
          if (i === 0) return 0;
          return sum + (change.timestamp - history[i - 1].timestamp);
        }, 0) / (history.length - 1) : 0,
      locked: this.personaLocked,
      hasOverride: this.streamerOverride !== null
    };
  }

  /**
   * Reset persona system
   */
  reset() {
    this.currentPersona = 'CHILL';
    this.personaLocked = false;
    this.streamerOverride = null;
    this.personaHistory = [];
    this.lastPersonaChange = Date.now();

    console.log('🎭 Persona system reset');
  }

  /**
   * Destroy persona system
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.reset();
    console.log('🎭 Adaptive Persona Modes destroyed');
  }
}

module.exports = AdaptivePersonaModes;
