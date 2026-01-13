/**
 * Cross-Stream Memory Boundaries
 * Prevents Acey from becoming creepy or "too aware" across streams
 * Memory scopes: SESSION → STREAM → GLOBAL
 */

class CrossStreamMemoryBoundaries {
  constructor(memorySystem, trustSystem) {
    this.memorySystem = memorySystem;
    this.trustSystem = trustSystem;
    
    // Memory scope configuration
    this.scopes = {
      SESSION: {
        duration: 'stream_end',
        crossStream: false,
        persistence: false,
        approvalRequired: false
      },
      STREAM: {
        duration: 'permanent',
        crossStream: false,
        persistence: true,
        approvalRequired: false
      },
      GLOBAL: {
        duration: 'permanent',
        crossStream: true,
        persistence: true,
        approvalRequired: true
      }
    };

    // Current stream context
    this.currentStream = {
      id: null,
      channel: null,
      startedAt: null,
      isLive: false
    };

    // Stream boundaries
    this.streamBoundaries = new Map(); // streamId -> boundary data
    
    // Memory isolation rules
    this.isolationRules = {
      // T1 never crosses streams
      T1: {
        allowedScopes: ['SESSION'],
        crossStreamAllowed: false,
        isolationLevel: 'strict'
      },
      
      // T2 user summaries are channel-scoped
      T2: {
        allowedScopes: ['STREAM'],
        crossStreamAllowed: false,
        isolationLevel: 'channel'
      },
      
      // T3 global memories require approval
      T3: {
        allowedScopes: ['GLOBAL'],
        crossStreamAllowed: true,
        isolationLevel: 'approved'
      }
    };

    // Cross-stream prevention rules
    this.preventionRules = {
      // Never allow personal data to cross streams
      personalData: {
        patterns: [
          /user.*behavior/gi,
          /personal.*trait/gi,
          /individual.*pattern/gi,
          /specific.*user/gi
        ],
        action: 'block'
      },
      
      // Never allow time-based patterns to cross streams
      timePatterns: {
        patterns: [
          /always.*at.*night/gi,
          /never.*on.*mondays/gi,
          /usually.*when.*tired/gi
        ],
        action: 'sanitize'
      },
      
      // Never allow channel-specific references to cross
      channelReferences: {
        patterns: [
          /in.*this.*channel/gi,
          /our.*chat/gi,
          /this.*community/gi
        ],
        action: 'generalize'
      }
    };

    console.log('🚫 Cross-Stream Memory Boundaries initialized');
  }

  /**
   * Set current stream context
   * @param {string} streamId - Stream ID
   * @param {string} channel - Channel name
   */
  setStreamContext(streamId, channel) {
    this.currentStream = {
      id: streamId,
      channel: channel,
      startedAt: Date.now(),
      isLive: true
    };

    // Initialize stream boundary
    if (!this.streamBoundaries.has(streamId)) {
      this.streamBoundaries.set(streamId, {
        id: streamId,
        channel: channel,
        startedAt: Date.now(),
        memories: {
          T1: [],
          T2: new Map(),
          T3: []
        },
        isolation: {
          userCount: 0,
          messageCount: 0,
          trustDistribution: {}
        }
      });
    }

    console.log(`🚫 Stream context set: ${streamId} (${channel})`);
  }

  /**
   * Check if memory write is allowed across boundaries
   * @param {string} memoryType - Memory type (T1, T2, T3)
   * @param {object} memoryData - Memory data
   * @param {string} targetScope - Target scope
   * @returns {object} Boundary check result
   */
  checkMemoryBoundary(memoryType, memoryData, targetScope = 'STREAM') {
    const rule = this.isolationRules[memoryType];
    
    if (!rule) {
      return {
        allowed: false,
        reason: 'unknown_memory_type',
        sanitizedData: null
      };
    }

    // Check if scope is allowed for this memory type
    if (!rule.allowedScopes.includes(targetScope)) {
      return {
        allowed: false,
        reason: 'scope_not_allowed',
        sanitizedData: null
      };
    }

    // Check cross-stream rules
    if (targetScope === 'GLOBAL' && !rule.crossStreamAllowed) {
      return {
        allowed: false,
        reason: 'cross_stream_not_allowed',
        sanitizedData: null
      };
    }

    // Apply prevention rules
    const sanitizedData = this.applyPreventionRules(memoryData, memoryType);
    
    // Check if data was blocked
    if (sanitizedData === null) {
      return {
        allowed: false,
        reason: 'blocked_by_prevention_rules',
        sanitizedData: null
      };
    }

    // Check if approval required for global memories
    if (targetScope === 'GLOBAL' && rule.isolationLevel === 'approved') {
      return {
        allowed: false,
        reason: 'approval_required',
        sanitizedData,
        requiresApproval: true
      };
    }

    return {
      allowed: true,
      reason: 'boundary_check_passed',
      sanitizedData
    };
  }

  /**
   * Apply prevention rules to memory data
   * @param {object} memoryData - Memory data
   * @param {string} memoryType - Memory type
   * @returns {object|null} Sanitized data or null if blocked
   */
  applyPreventionRules(memoryData, memoryType) {
    let sanitized = { ...memoryData };
    
    // Apply personal data prevention
    const personalDataResult = this.applyPreventionRule(
      sanitized, 
      this.preventionRules.personalData
    );
    
    if (personalDataResult === null) {
      return null; // Blocked
    }
    
    sanitized = personalDataResult;

    // Apply time pattern prevention
    const timePatternResult = this.applyPreventionRule(
      sanitized,
      this.preventionRules.timePatterns
    );
    
    if (timePatternResult === null) {
      return null; // Blocked
    }
    
    sanitized = timePatternResult;

    // Apply channel reference prevention
    const channelRefResult = this.applyPreventionRule(
      sanitized,
      this.preventionRules.channelReferences
    );
    
    if (channelRefResult === null) {
      return null; // Blocked
    }
    
    sanitized = channelRefResult;

    // Additional T2-specific checks
    if (memoryType === 'T2') {
      sanitized = this.sanitizeT2Memory(sanitized);
    }

    // Additional T3-specific checks
    if (memoryType === 'T3') {
      sanitized = this.sanitizeT3Memory(sanitized);
    }

    return sanitized;
  }

  /**
   * Apply specific prevention rule
   * @param {object} data - Data to check
   * @param {object} rule - Prevention rule
   * @returns {object|null} Sanitized data or null if blocked
   */
  applyPreventionRule(data, rule) {
    let sanitized = { ...data };
    let hasViolation = false;

    // Check all string fields for patterns
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        rule.patterns.forEach(pattern => {
          if (pattern.test(sanitized[key])) {
            hasViolation = true;
            
            switch (rule.action) {
              case 'block':
                return null; // Block entire memory
              
              case 'sanitize':
                // Remove violating content
                sanitized[key] = sanitized[key].replace(pattern, '[REDACTED]');
                break;
              
              case 'generalize':
                // Make content generic
                sanitized[key] = this.generalizeContent(sanitized[key], pattern);
                break;
            }
          }
        });
      }
    });

    return hasViolation && rule.action === 'block' ? null : sanitized;
  }

  /**
   * Generalize content to remove specific references
   * @param {string} content - Content to generalize
   * @param {RegExp} pattern - Pattern that matched
   * @returns {string} Generalized content
   */
  generalizeContent(content, pattern) {
    // Replace specific references with generic ones
    return content
      .replace(/jamie/gi, 'someone')
      .replace(/this.*channel/gi, 'the community')
      .replace(/our.*chat/gi, 'chat')
      .replace(/in.*this.*stream/gi, 'in streams')
      .replace(/always.*at.*night/gi, 'sometimes')
      .replace(/never.*on.*mondays/gi, 'rarely');
  }

  /**
   * Sanitize T2 memory data
   * @param {object} memoryData - T2 memory data
   * @returns {object} Sanitized T2 memory
   */
  sanitizeT2Memory(memoryData) {
    const sanitized = { ...memoryData };

    // Remove any cross-stream user identifiers
    if (sanitized.user_id) {
      // Hash user ID to prevent cross-stream tracking
      sanitized.user_id = this.hashUserId(sanitized.user_id, this.currentStream.channel);
    }

    // Remove any channel-specific notes
    if (sanitized.notes && Array.isArray(sanitized.notes)) {
      sanitized.notes = sanitized.notes.map(note => 
        this.removeChannelReferences(note)
      );
    }

    // Ensure behavioral patterns are channel-scoped
    if (sanitized.behavior_patterns) {
      sanitized.behavior_patterns = this.scopeBehaviorPatterns(
        sanitized.behavior_patterns,
        this.currentStream.channel
      );
    }

    return sanitized;
  }

  /**
   * Sanitize T3 memory data
   * @param {object} memoryData - T3 memory data
   * @returns {object} Sanitized T3 memory
   */
  sanitizeT3Memory(memoryData) {
    const sanitized = { ...memoryData };

    // Ensure T3 memories are truly global and community-approved
    if (sanitized.type === 'community_moment') {
      // Remove any user-specific references
      sanitized.event = this.removeUserReferences(sanitized.event);
      
      // Ensure it's community-approved
      if (!sanitized.approved_by_chat) {
        return null; // Block non-approved community memories
      }
    }

    // Add stream boundary metadata
    sanitized.created_in_stream = this.currentStream.id;
    sanitized.created_in_channel = this.currentStream.channel;

    return sanitized;
  }

  /**
   * Hash user ID for channel scoping
   * @param {string} userId - User ID
   * @param {string} channel - Channel name
   * @returns {string} Hashed user ID
   */
  hashUserId(userId, channel) {
    // Simple hash for demo - in production, use proper crypto
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${userId}_${channel}`)
      .digest('hex')
      .substring(0, 16);
    
    return `channel_${hash}`;
  }

  /**
   * Remove channel references from text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  removeChannelReferences(text) {
    return text
      .replace(/in.*this.*channel/gi, 'in the community')
      .replace(/our.*chat/gi, 'chat')
      .replace(/this.*stream/gi, 'streams')
      .replace(/here/gi, 'in the community');
  }

  /**
   * Remove user references from text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  removeUserReferences(text) {
    return text
      .replace(/\b[A-Z][a-z]+\b/g, 'someone') // Remove proper names
      .replace(/user.*\w+/gi, 'a user')
      .replace(/player.*\w+/gi, 'a player');
  }

  /**
   * Scope behavior patterns to channel
   * @param {object} patterns - Behavior patterns
   * @param {string} channel - Channel name
   * @returns {object} Scoped patterns
   */
  scopeBehaviorPatterns(patterns, channel) {
    const scoped = { ...patterns };
    
    // Add channel scope to all patterns
    Object.keys(scoped).forEach(key => {
      if (typeof scoped[key] === 'object' && scoped[key] !== null) {
        scoped[key].channel_scope = channel;
      }
    });

    return scoped;
  }

  /**
   * End current stream session
   * @returns {object} Stream summary
   */
  endStreamSession() {
    if (!this.currentStream.isLive) {
      return { error: 'No active stream' };
    }

    const streamId = this.currentStream.id;
    const boundary = this.streamBoundaries.get(streamId);
    
    if (!boundary) {
      return { error: 'Stream boundary not found' };
    }

    // Update boundary with end time
    boundary.endedAt = Date.now();
    boundary.duration = boundary.endedAt - boundary.startedAt;

    // Clear T1 memories (session-only)
    boundary.memories.T1 = [];

    // Mark stream as ended
    this.currentStream.isLive = false;

    console.log(`🚫 Stream session ended: ${streamId}`);

    return {
      streamId,
      channel: boundary.channel,
      duration: boundary.duration,
      memoryCounts: {
        T1: boundary.memories.T1.length,
        T2: boundary.memories.T2.size,
        T3: boundary.memories.T3.length
      }
    };
  }

  /**
   * Get stream boundary information
   * @param {string} streamId - Stream ID
   * @returns {object} Stream boundary info
   */
  getStreamBoundary(streamId) {
    return this.streamBoundaries.get(streamId);
  }

  /**
   * Get all stream boundaries
   * @returns {Array} All stream boundaries
   */
  getAllStreamBoundaries() {
    const boundaries = [];
    
    for (const [id, boundary] of this.streamBoundaries) {
      boundaries.push({
        id: boundary.id,
        channel: boundary.channel,
        startedAt: boundary.startedAt,
        endedAt: boundary.endedAt,
        duration: boundary.duration,
        memoryCounts: {
          T1: boundary.memories.T1.length,
          T2: boundary.memories.T2.size,
          T3: boundary.memories.T3.length
        },
        isolation: boundary.isolation
      });
    }

    return boundaries.sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Check if user data can cross streams
   * @param {string} userId - User ID
   * @param {string} fromChannel - Source channel
   * @param {string} toChannel - Target channel
   * @returns {boolean} Cross-stream allowed
   */
  canCrossUserData(userId, fromChannel, toChannel) {
    // Never allow personal data to cross streams
    return false;
  }

  /**
   * Get memory isolation statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const boundaries = this.getAllStreamBoundaries();
    const activeStreams = boundaries.filter(b => !b.endedAt).length;
    const totalStreams = boundaries.length;
    
    const memoryCounts = boundaries.reduce((acc, boundary) => {
      acc.T1 += boundary.memoryCounts.T1;
      acc.T2 += boundary.memoryCounts.T2;
      acc.T3 += boundary.memoryCounts.T3;
      return acc;
    }, { T1: 0, T2: 0, T3: 0 });

    return {
      currentStream: this.currentStream,
      activeStreams,
      totalStreams,
      memoryCounts,
      isolationRules: Object.keys(this.isolationRules).length,
      preventionRules: Object.keys(this.preventionRules).length
    };
  }

  /**
   * Reset all boundaries
   */
  reset() {
    this.streamBoundaries.clear();
    this.currentStream = {
      id: null,
      channel: null,
      startedAt: null,
      isLive: false
    };

    console.log('🚫 Cross-stream boundaries reset');
  }

  /**
   * Destroy boundary system
   */
  destroy() {
    this.reset();
    console.log('🚫 Cross-Stream Memory Boundaries destroyed');
  }
}

module.exports = CrossStreamMemoryBoundaries;
