/**
 * Community Memory Voting System
 * Lets the community collectively decide what's worth remembering
 * Only session-level moments, never personal data
 */

class CommunityVoting {
  constructor(memorySystem, io) {
    this.memorySystem = memorySystem;
    this.io = io;
    
    // Active voting sessions
    this.activeVotes = new Map(); // voteId -> vote session
    
    // Voting configuration
    this.config = {
      voteDuration: 30000, // 30 seconds
      minVotes: 3, // Minimum votes to count
      threshold: 0.6, // 60% majority needed
      maxActiveVotes: 3 // Max concurrent votes
    };

    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredVotes();
    }, 10000);
  }

  /**
   * Propose a community memory vote
   * @param {string} moment - Moment description
   * @param {string} type - Moment type
   * @param {object} context - Additional context
   * @returns {string} Vote ID
   */
  proposeVote(moment, type = 'community_moment', context = {}) {
    // Validate moment (session-level only)
    if (!this.isValidMoment(moment)) {
      console.warn('⚠️ Invalid moment for community vote:', moment);
      return null;
    }

    // Check vote limit
    if (this.activeVotes.size >= this.config.maxActiveVotes) {
      console.warn('⚠️ Too many active votes, rejecting proposal');
      return null;
    }

    const voteId = this.generateVoteId();
    const voteSession = {
      id: voteId,
      moment,
      type,
      context,
      proposedAt: Date.now(),
      expiresAt: Date.now() + this.config.voteDuration,
      votes: {
        remember: 0,
        forget: 0
      },
      voters: new Set(),
      status: 'active'
    };

    this.activeVotes.set(voteId, voteSession);

    // Announce vote to chat
    this.announceVote(voteSession);

    console.log(`🗳️ Community vote proposed: ${moment}`);

    // Auto-cleanup
    setTimeout(() => {
      this.resolveVote(voteId);
    }, this.config.voteDuration);

    return voteId;
  }

  /**
   * Validate moment for community voting
   * @param {string} moment - Moment description
   * @returns {boolean} Valid moment
   */
  isValidMoment(moment) {
    const disallowedPatterns = [
      /user.*behavior/i,
      /personal.*trait/i,
      /negative.*label/i,
      /emotional.*state/i,
      /mental.*health/i,
      /diagnosis/i,
      /judgment/i
    ];

    const momentLower = moment.toLowerCase();
    
    // Check for disallowed patterns
    for (const pattern of disallowedPatterns) {
      if (pattern.test(momentLower)) {
        return false;
      }
    }

    // Check length
    if (moment.length < 5 || moment.length > 200) {
      return false;
    }

    // Must be session-level (not person-specific)
    const personPatterns = [
      /\b(username|user|player)\b.*\b(is|was|has|said)\b/i,
      /\b(he|she|they)\b.*\b(always|never|usually)\b/i
    ];

    for (const pattern of personPatterns) {
      if (pattern.test(momentLower)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate unique vote ID
   * @returns {string} Vote ID
   */
  generateVoteId() {
    return `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Announce vote to chat
   * @param {object} voteSession - Vote session
   */
  announceVote(voteSession) {
    const message = `🗳️ Community Vote: "${voteSession.moment}"\n👍 Remember | 👎 Forget (30 seconds)`;
    
    // Send to all connected clients
    this.io.emit('community_vote', {
      type: 'proposal',
      voteId: voteSession.id,
      moment: voteSession.moment,
      message,
      duration: this.config.voteDuration / 1000
    });
  }

  /**
   * Handle vote from user
   * @param {string} voteId - Vote ID
   * @param {string} userId - User ID
   * @param {string} voteType - Vote type ('remember' or 'forget')
   * @returns {object} Vote result
   */
  handleVote(voteId, userId, voteType) {
    const voteSession = this.activeVotes.get(voteId);
    
    if (!voteSession) {
      return { error: 'Vote not found or expired' };
    }

    if (voteSession.status !== 'active') {
      return { error: 'Vote is no longer active' };
    }

    if (Date.now() > voteSession.expiresAt) {
      return { error: 'Vote has expired' };
    }

    // Check if user already voted
    if (voteSession.voters.has(userId)) {
      return { error: 'You have already voted' };
    }

    // Validate vote type
    if (!['remember', 'forget'].includes(voteType)) {
      return { error: 'Invalid vote type' };
    }

    // Record vote
    voteSession.votes[voteType]++;
    voteSession.voters.add(userId);

    // Update vote status
    this.updateVoteStatus(voteSession);

    // Send vote update
    this.io.emit('vote_update', {
      voteId,
      votes: voteSession.votes,
      totalVoters: voteSession.voters.size,
      status: voteSession.status
    });

    return {
      success: true,
      voteId,
      voteType,
      totalVotes: voteSession.votes[voteType],
      totalVoters: voteSession.voters.size
    };
  }

  /**
   * Update vote status based on current votes
   * @param {object} voteSession - Vote session
   */
  updateVoteStatus(voteSession) {
    const totalVotes = voteSession.votes.remember + voteSession.votes.forget;
    
    if (totalVotes >= this.config.minVotes) {
      const rememberRatio = voteSession.votes.remember / totalVotes;
      
      if (rememberRatio >= this.config.threshold) {
        voteSession.status = 'approved';
      } else if ((1 - rememberRatio) >= this.config.threshold) {
        voteSession.status = 'rejected';
      } else {
        voteSession.status = 'pending';
      }
    } else {
      voteSession.status = 'pending';
    }
  }

  /**
   * Resolve vote and store result if approved
   * @param {string} voteId - Vote ID
   */
  resolveVote(voteId) {
    const voteSession = this.activeVotes.get(voteId);
    
    if (!voteSession) {
      return;
    }

    const finalStatus = voteSession.status;
    const totalVotes = voteSession.votes.remember + voteSession.votes.forget;

    // Announce result
    this.io.emit('vote_result', {
      voteId,
      moment: voteSession.moment,
      status: finalStatus,
      votes: voteSession.votes,
      totalVotes,
      totalVoters: voteSession.voters.size
    });

    // Store in T3 global memory if approved
    if (finalStatus === 'approved') {
      this.storeCommunityMemory(voteSession);
    }

    // Log result
    console.log(`🗳️ Vote resolved: ${voteSession.moment} → ${finalStatus} (${totalVotes} votes)`);

    // Remove from active votes
    this.activeVotes.delete(voteId);
  }

  /**
   * Store approved community memory in T3
   * @param {object} voteSession - Vote session
   */
  storeCommunityMemory(voteSession) {
    const memory = {
      event: voteSession.moment,
      type: voteSession.type,
      approved_by_chat: true,
      approved_at: new Date().toISOString(),
      vote_data: {
        remember_votes: voteSession.votes.remember,
        forget_votes: voteSession.votes.forget,
        total_voters: voteSession.voters.size,
        vote_id: voteSession.id
      }
    };

    // Store in T3 global memory
    const globalMemory = this.memorySystem.getT3Global();
    
    if (!globalMemory.community_moments) {
      globalMemory.community_moments = [];
    }

    globalMemory.community_moments.push(memory);

    // Keep only last 50 community memories
    if (globalMemory.community_moments.length > 50) {
      globalMemory.community_moments = globalMemory.community_moments.slice(-50);
    }

    console.log(`💾 Community memory stored: ${voteSession.moment}`);
  }

  /**
   * Get active votes
   * @returns {Array} Active vote sessions
   */
  getActiveVotes() {
    const votes = [];
    
    for (const [id, session] of this.activeVotes) {
      votes.push({
        id: session.id,
        moment: session.moment,
        type: session.type,
        votes: session.votes,
        totalVoters: session.voters.size,
        status: session.status,
        timeRemaining: Math.max(0, session.expiresAt - Date.now()),
        proposedAt: session.proposedAt
      });
    }

    return votes;
  }

  /**
   * Get community memories
   * @param {number} limit - Maximum memories to return
   * @returns {Array} Community memories
   */
  getCommunityMemories(limit = 20) {
    const globalMemory = this.memorySystem.getT3Global();
    const memories = globalMemory.community_moments || [];
    
    return memories
      .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at))
      .slice(-limit);
  }

  /**
   * Cancel active vote
   * @param {string} voteId - Vote ID
   * @returns {boolean} Success status
   */
  cancelVote(voteId) {
    const voteSession = this.activeVotes.get(voteId);
    
    if (!voteSession) {
      return false;
    }

    voteSession.status = 'cancelled';
    
    // Announce cancellation
    this.io.emit('vote_cancelled', {
      voteId,
      moment: voteSession.moment,
      reason: 'Cancelled by host'
    });

    // Remove from active votes
    this.activeVotes.delete(voteId);

    console.log(`🗳️ Vote cancelled: ${voteSession.moment}`);
    return true;
  }

  /**
   * Cleanup expired votes
   */
  cleanupExpiredVotes() {
    const now = Date.now();
    const expired = [];

    for (const [id, session] of this.activeVotes) {
      if (now > session.expiresAt) {
        expired.push(id);
      }
    }

    expired.forEach(id => {
      this.resolveVote(id);

    if (expired.length > 0) {
      console.log(`🧹 Cleaned up ${expired.length} expired votes`);
    }
  }

  /**
   * Get voting statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const globalMemory = this.memorySystem.getT3Global();
    const memories = globalMemory.community_moments || [];

    return {
      activeVotes: this.activeVotes.size,
      totalMemories: memories.length,
      recentMemories: memories.filter(m => {
        const approved = new Date(m.approved_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return approved > weekAgo;
      }).length,
      totalVotesCast: memories.reduce((sum, m) => {
        return sum + (m.vote_data?.total_voters || 0);
      }, 0),
      approvalRate: memories.length > 0 ? 
        memories.filter(m => m.approved_by_chat).length / memories.length : 0
    };
  }

  /**
   * Test vote creation (for debugging)
   * @param {string} moment - Test moment
   * @returns {string} Vote ID
   */
  testVote(moment) {
    return this.proposeVote(moment, 'test_moment', { test: true });
  }

  /**
   * Destroy the voting system
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Cancel all active votes
    for (const voteId of this.activeVotes.keys()) {
      this.cancelVote(voteId);
    }

    this.activeVotes.clear();
    console.log('🗳️ Community voting system destroyed');
  }
}

module.exports = CommunityVoting;
