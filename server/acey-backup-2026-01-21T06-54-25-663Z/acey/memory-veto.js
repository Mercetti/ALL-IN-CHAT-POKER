/**
 * Streamer-Controlled Memory Veto System
 * Gives streamer absolute authority over what Acey remembers
 * Human > AI. Always.
 */

class MemoryVetoSystem {
  constructor(memorySystem, io) {
    this.memorySystem = memorySystem;
    this.io = io;
    
    // Veto configuration
    this.config = {
      allowSessionMemories: true,
      allowCommunityMemories: true,
      requireManualApproval: false,
      vetoTimeout: 300000, // 5 minutes to respond
      maxPendingProposals: 10
    };

    // Pending memory proposals
    this.pendingProposals = new Map(); // proposalId -> proposal data
    
    // Veto history
    this.vetoHistory = [];
    
    // Streamer commands
    this.streamerCommands = {
      '!acey forget last': 'forgetLastMemory',
      '!acey forget session': 'forgetSessionMemories',
      '!acey lock memory': 'lockMemorySystem',
      '!acey unlock memory': 'unlockMemorySystem',
      '!acey approve all': 'approveAllPending',
      '!acey deny all': 'denyAllPending'
    };

    // Memory lock state
    this.memoryLocked = false;

    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredProposals();
    }, 60000); // Every minute

    console.log('🔒 Memory Veto System initialized');
  }

  /**
   * Check if memory write is allowed
   * @param {string} memoryType - Memory type (T1, T3)
   * @param {object} memoryData - Memory data
   * @returns {object} Veto result
   */
  checkMemoryWrite(memoryType, memoryData) {
    // Check if memory is locked
    if (this.memoryLocked) {
      return {
        allowed: false,
        reason: 'memory_system_locked',
        proposalId: null
      };
    }

    // Check memory type permissions
    if (memoryType === 'T1' && !this.config.allowSessionMemories) {
      return {
        allowed: false,
        reason: 'session_memories_disabled',
        proposalId: null
      };
    }

    if (memoryType === 'T3' && !this.config.allowCommunityMemories) {
      return {
        allowed: false,
        reason: 'community_memories_disabled',
        proposalId: null
      };
    }

    // If manual approval required, create proposal
    if (this.config.requireManualApproval) {
      return this.createMemoryProposal(memoryType, memoryData);
    }

    // Auto-approve if no manual approval required
    return {
      allowed: true,
      reason: 'auto_approved',
      proposalId: null
    };
  }

  /**
   * Create memory proposal for streamer approval
   * @param {string} memoryType - Memory type
   * @param {object} memoryData - Memory data
   * @returns {object} Proposal result
   */
  createMemoryProposal(memoryType, memoryData) {
    // Check proposal limit
    if (this.pendingProposals.size >= this.config.maxPendingProposals) {
      return {
        allowed: false,
        reason: 'too_many_pending_proposals',
        proposalId: null
      };
    }

    const proposalId = this.generateProposalId();
    const proposal = {
      id: proposalId,
      type: memoryType,
      data: memoryData,
      proposedAt: Date.now(),
      expiresAt: Date.now() + this.config.vetoTimeout,
      status: 'pending',
      streamerNotified: false
    };

    this.pendingProposals.set(proposalId, proposal);

    // Notify streamer
    this.notifyStreamer(proposal);

    console.log(`📝 Memory proposal created: ${memoryType} - ${proposalId}`);

    return {
      allowed: false,
      reason: 'awaiting_streamer_approval',
      proposalId
    };
  }

  /**
   * Notify streamer of pending proposal
   * @param {object} proposal - Proposal data
   */
  notifyStreamer(proposal) {
    const notification = {
      type: 'memory_proposal',
      proposalId: proposal.id,
      memoryType: proposal.type,
      summary: this.summarizeMemory(proposal.data),
      expiresAt: proposal.expiresAt,
      message: `Memory proposal: ${this.summarizeMemory(proposal.data)}`
    };

    // Send to streamer dashboard
    this.io.emit('streamer_notification', notification);
    
    proposal.streamerNotified = true;
  }

  /**
   * Summarize memory for streamer display
   * @param {object} memoryData - Memory data
   * @returns {string} Memory summary
   */
  summarizeMemory(memoryData) {
    if (memoryData.event) {
      return memoryData.event;
    }
    
    if (memoryData.tone) {
      return `Session tone: ${memoryData.tone}`;
    }
    
    if (memoryData.running_bits && memoryData.running_bits.length > 0) {
      return `Running bit: ${memoryData.running_bits[0]}`;
    }
    
    return 'Memory proposal';
  }

  /**
   * Handle streamer response to proposal
   * @param {string} proposalId - Proposal ID
   * @param {boolean} approved - Streamer decision
   * @param {string} reason - Optional reason
   * @returns {object} Response result
   */
  handleStreamerResponse(proposalId, approved, reason = '') {
    const proposal = this.pendingProposals.get(proposalId);
    
    if (!proposal) {
      return {
        success: false,
        error: 'Proposal not found or expired'
      };
    }

    // Update proposal status
    proposal.status = approved ? 'approved' : 'denied';
    proposal.streamerResponse = approved;
    proposal.responseReason = reason;
    proposal.respondedAt = Date.now();

    // Add to history
    this.vetoHistory.push({
      ...proposal,
      action: approved ? 'approved' : 'denied'
    });

    // Execute memory write if approved
    if (approved) {
      this.executeMemoryWrite(proposal);
    }

    // Remove from pending
    this.pendingProposals.delete(proposalId);

    // Notify streamer of result
    this.io.emit('memory_proposal_result', {
      proposalId,
      approved,
      reason,
      memoryType: proposal.type
    });

    console.log(`🔒 Memory proposal ${approved ? 'approved' : 'denied'}: ${proposalId}`);

    return {
      success: true,
      proposalId,
      approved,
      reason
    };
  }

  /**
   * Execute approved memory write
   * @param {object} proposal - Approved proposal
   */
  executeMemoryWrite(proposal) {
    try {
      if (proposal.type === 'T1') {
        // Write to session memory
        this.memorySystem.addSessionEvent(proposal.data.event || 'Memory write');
      } else if (proposal.type === 'T3') {
        // Write to global memory
        const globalMemory = this.memorySystem.getT3Global();
        if (!globalMemory.community_moments) {
          globalMemory.community_moments = [];
        }
        globalMemory.community_moments.push(proposal.data);
      }

      console.log(`💾 Memory write executed: ${proposal.id}`);
    } catch (error) {
      console.error('❌ Memory write execution failed:', error);
    }
  }

  /**
   * Handle streamer command
   * @param {string} command - Streamer command
   * @param {string} userId - User ID (for authorization)
   * @returns {object} Command result
   */
  handleStreamerCommand(command, userId) {
    // TODO: Add streamer authorization check
    const commandFunction = this.streamerCommands[command];
    
    if (!commandFunction) {
      return {
        success: false,
        error: 'Unknown command'
      };
    }

    return this[commandFunction](userId);
  }

  /**
   * Forget last memory
   * @param {string} userId - User ID
   * @returns {object} Result
   */
  forgetLastMemory(userId) {
    // Get most recent memory write
    const recentWrites = this.vetoHistory
      .filter(h => h.action === 'approved')
      .sort((a, b) => b.respondedAt - a.respondedAt);

    if (recentWrites.length === 0) {
      return {
        success: false,
        error: 'No recent memories to forget'
      };
    }

    const lastMemory = recentWrites[0];
    
    // Mark as forgotten
    lastMemory.forgotten = true;
    lastMemory.forgottenAt = Date.now();
    lastMemory.forgottenBy = userId;

    // TODO: Actually remove from memory system
    console.log(`🗑️ Last memory forgotten: ${lastMemory.id}`);

    return {
      success: true,
      forgottenMemory: lastMemory.id
    };
  }

  /**
   * Forget session memories
   * @param {string} userId - User ID
   * @returns {object} Result
   */
  forgetSessionMemories(userId) {
    // Clear T1 session memory
    if (this.memorySystem.t1Session) {
      this.memorySystem.t1Session = {
        session_id: this.memorySystem.t1Session.session_id,
        tone: 'neutral',
        running_bits: [],
        events: [],
        started_at: Date.now()
      };
    }

    console.log(`🗑️ Session memories forgotten by: ${userId}`);

    return {
      success: true,
      message: 'Session memories cleared'
    };
  }

  /**
   * Lock memory system
   * @param {string} userId - User ID
   * @returns {object} Result
   */
  lockMemorySystem(userId) {
    this.memoryLocked = true;
    
    // Deny all pending proposals
    const pendingIds = Array.from(this.pendingProposals.keys());
    pendingIds.forEach(id => {
      this.handleStreamerResponse(id, false, 'Memory system locked');

    console.log(`🔒 Memory system locked by: ${userId}`);

    return {
      success: true,
      message: 'Memory system locked'
    };
  }

  /**
   * Unlock memory system
   * @param {string} userId - User ID
   * @returns {object} Result
   */
  unlockMemorySystem(userId) {
    this.memoryLocked = false;
    
    console.log(`🔓 Memory system unlocked by: ${userId}`);

    return {
      success: true,
      message: 'Memory system unlocked'
    };
  }

  /**
   * Approve all pending proposals
   * @param {string} userId - User ID
   * @returns {object} Result
   */
  approveAllPending(userId) {
    const pendingIds = Array.from(this.pendingProposals.keys());
    const results = [];

    pendingIds.forEach(id => {
      const result = this.handleStreamerResponse(id, true, 'Bulk approval');
      results.push(result);

    console.log(`✅ All pending proposals approved by: ${userId}`);

    return {
      success: true,
      approvedCount: results.length,
      results
    };
  }

  /**
   * Deny all pending proposals
   * @param {string} userId - User ID
   * @returns {object} Result
   */
  denyAllPending(userId) {
    const pendingIds = Array.from(this.pendingProposals.keys());
    const results = [];

    pendingIds.forEach(id => {
      const result = this.handleStreamerResponse(id, false, 'Bulk denial');
      results.push(result);

    console.log(`❌ All pending proposals denied by: ${userId}`);

    return {
      success: true,
      deniedCount: results.length,
      results
    };
  }

  /**
   * Update veto configuration
   * @param {object} newConfig - New configuration
   * @returns {object} Update result
   */
  updateConfiguration(newConfig) {
    const oldConfig = { ...this.config };
    
    // Merge new configuration
    Object.assign(this.config, newConfig);

    // Handle configuration changes
    if (!this.config.allowSessionMemories && !this.config.allowCommunityMemories) {
      // Deny all pending if both disabled
      const pendingIds = Array.from(this.pendingProposals.keys());
      pendingIds.forEach(id => {
        this.handleStreamerResponse(id, false, 'Memory type disabled');
    }

    console.log('⚙️ Memory veto configuration updated');

    return {
      success: true,
      oldConfig,
      newConfig: this.config
    };
  }

  /**
   * Get current configuration
   * @returns {object} Current configuration
   */
  getConfiguration() {
    return {
      ...this.config,
      memoryLocked: this.memoryLocked,
      pendingProposals: this.pendingProposals.size,
      vetoHistory: this.vetoHistory.length
    };
  }

  /**
   * Get pending proposals
   * @returns {Array} Pending proposals
   */
  getPendingProposals() {
    const proposals = [];
    
    for (const [id, proposal] of this.pendingProposals) {
      proposals.push({
        id: proposal.id,
        type: proposal.type,
        summary: this.summarizeMemory(proposal.data),
        proposedAt: proposal.proposedAt,
        expiresAt: proposal.expiresAt,
        timeRemaining: Math.max(0, proposal.expiresAt - Date.now())
      });
    }

    return proposals.sort((a, b) => a.proposedAt - b.proposedAt);
  }

  /**
   * Get veto history
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Veto history
   */
  getVetoHistory(limit = 50) {
    return this.vetoHistory
      .sort((a, b) => b.respondedAt - a.respondedAt)
      .slice(0, limit)
      .map(h => ({
        id: h.id,
        type: h.type,
        action: h.action,
        summary: this.summarizeMemory(h.data),
        respondedAt: h.respondedAt,
        reason: h.responseReason,
        forgotten: h.forgotten
      }));
  }

  /**
   * Generate unique proposal ID
   * @returns {string} Proposal ID
   */
  generateProposalId() {
    return `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup expired proposals
   */
  cleanupExpiredProposals() {
    const now = Date.now();
    const expired = [];

    for (const [id, proposal] of this.pendingProposals) {
      if (now > proposal.expiresAt) {
        expired.push(id);
      }
    }

    expired.forEach(id => {
      const proposal = this.pendingProposals.get(id);
      
      // Add to history as expired
      this.vetoHistory.push({
        ...proposal,
        action: 'expired',
        respondedAt: now
      });

      this.pendingProposals.delete(id);

    if (expired.length > 0) {
      console.log(`🧹 Cleaned up ${expired.length} expired proposals`);
    }
  }

  /**
   * Get veto system statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.vetoHistory;
    const approved = history.filter(h => h.action === 'approved').length;
    const denied = history.filter(h => h.action === 'denied').length;
    const expired = history.filter(h => h.action === 'expired').length;
    const forgotten = history.filter(h => h.forgotten).length;

    return {
      configuration: this.getConfiguration(),
      pendingProposals: this.pendingProposals.size,
      totalDecisions: history.length,
      approved,
      denied,
      expired,
      forgotten,
      approvalRate: history.length > 0 ? approved / history.length : 0,
      averageResponseTime: history.length > 0 ? 
        history.reduce((sum, h) => sum + (h.respondedAt - h.proposedAt), 0) / history.length : 0
    };
  }

  /**
   * Destroy the veto system
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Deny all pending proposals
    const pendingIds = Array.from(this.pendingProposals.keys());
    pendingIds.forEach(id => {
      this.handleStreamerResponse(id, false, 'System shutdown');

    this.pendingProposals.clear();
    this.vetoHistory = [];
    this.memoryLocked = false;

    console.log('🔒 Memory Veto System destroyed');
  }
}

module.exports = MemoryVetoSystem;
