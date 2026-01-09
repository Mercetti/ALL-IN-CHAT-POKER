/**
 * Queue Validation System for OBS Overlay
 * Handles overflow/queue validation and management
 */

export class QueueValidator {
  constructor(maxPlayers = 9, maxOverflow = 50) {
    this.maxPlayers = maxPlayers;
    this.maxOverflow = maxOverflow;
    this.waitingList = [];
    this.overflowList = [];
    this.validatedEntries = new Set();
  }

  /**
   * Validate and normalize queue entries
   */
  validateQueueEntries(entries = []) {
    const normalized = this.normalizeEntries(entries);
    const validated = this.filterValidEntries(normalized);
    const { seated, overflow } = this.separatePlayers(validated);
    
    return {
      seated: seated.slice(0, this.maxPlayers),
      overflow: overflow.slice(0, this.maxOverflow),
      total: validated.length,
      dropped: entries.length - validated.length
    };
  }

  /**
   * Normalize queue entries to consistent format
   */
  normalizeEntries(entries) {
    return entries.map(entry => {
      if (!entry) return null;
      
      if (typeof entry === 'string') {
        return {
          login: entry.toLowerCase().trim(),
          label: entry.trim(),
          source: 'string'
        };
      }
      
      if (typeof entry === 'object') {
        const login = this.extractLogin(entry);
        const label = this.extractLabel(entry);
        
        if (!login) return null;
        
        return {
          login: login.toLowerCase().trim(),
          label: label.trim(),
          avatar: entry.avatar || entry.profile?.avatar,
          source: 'object'
        };
      }
      
      return null;
    }).filter(Boolean);
  }

  /**
   * Extract login from various object formats
   */
  extractLogin(entry) {
    return entry.login ||
           entry.name ||
           entry.username ||
           entry.twitch ||
           entry.display_name?.toLowerCase() ||
           entry.alias?.toLowerCase();
  }

  /**
   * Extract display label from various object formats
   */
  extractLabel(entry) {
    return entry.display_name ||
           entry.name ||
           entry.login ||
           entry.alias ||
           entry.username ||
           entry.twitch ||
           'Player';
  }

  /**
   * Filter out invalid or duplicate entries
   */
  filterValidEntries(entries) {
    const seen = new Set();
    return entries.filter(entry => {
      if (!entry || !entry.login) return false;
      
      // Skip duplicates
      if (seen.has(entry.login)) return false;
      seen.add(entry.login);
      
      // Validate login format
      if (!this.isValidLogin(entry.login)) return false;
      
      // Mark as validated
      this.validatedEntries.add(entry.login);
      return true;
    });
  }

  /**
   * Check if login is valid format
   */
  isValidLogin(login) {
    if (!login || typeof login !== 'string') return false;
    
    // Basic validation: alphanumeric, underscores, hyphens
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(login) && login.length >= 2 && login.length <= 25;
  }

  /**
   * Separate seated players from overflow
   */
  separatePlayers(entries) {
    const seated = [];
    const overflow = [];
    
    entries.forEach((entry, index) => {
      if (index < this.maxPlayers) {
        seated.push(entry);
      } else {
        overflow.push(entry);
      }
    });
    
    return { seated, overflow };
  }

  /**
   * Update queue with new entries
   */
  updateQueue(newEntries = []) {
    const result = this.validateQueueEntries(newEntries);
    
    this.waitingList = result.seated;
    this.overflowList = result.overflow;
    
    return result;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      seated: this.waitingList.length,
      overflow: this.overflowList.length,
      total: this.waitingList.length + this.overflowList.length,
      capacity: this.maxPlayers,
      overflowCapacity: this.maxOverflow,
      utilization: (this.waitingList.length / this.maxPlayers * 100).toFixed(1)
    };
  }

  /**
   * Check if queue is full
   */
  isQueueFull() {
    return this.waitingList.length >= this.maxPlayers;
  }

  /**
   * Check if overflow is full
   */
  isOverflowFull() {
    return this.overflowList.length >= this.maxOverflow;
  }

  /**
   * Add player to queue
   */
  addToQueue(player) {
    if (this.isQueueFull() && this.isOverflowFull()) {
      return { success: false, reason: 'Queue and overflow are full' };
    }
    
    const normalized = this.normalizeEntries([player])[0];
    if (!normalized) {
      return { success: false, reason: 'Invalid player data' };
    }
    
    if (this.validatedEntries.has(normalized.login)) {
      return { success: false, reason: 'Player already in queue' };
    }
    
    if (this.isQueueFull()) {
      this.overflowList.push(normalized);
      return { success: true, position: 'overflow' };
    } else {
      this.waitingList.push(normalized);
      return { success: true, position: this.waitingList.length - 1 };
    }
  }

  /**
   * Remove player from queue
   */
  removeFromQueue(login) {
    const normalizedLogin = login.toLowerCase().trim();
    
    // Remove from seated
    const seatedIndex = this.waitingList.findIndex(p => p.login === normalizedLogin);
    if (seatedIndex !== -1) {
      this.waitingList.splice(seatedIndex, 1);
      this.validatedEntries.delete(normalizedLogin);
      
      // Move first overflow player to seated if available
      if (this.overflowList.length > 0) {
        const moved = this.overflowList.shift();
        this.waitingList.push(moved);
      }
      
      return { success: true, from: 'seated' };
    }
    
    // Remove from overflow
    const overflowIndex = this.overflowList.findIndex(p => p.login === normalizedLogin);
    if (overflowIndex !== -1) {
      this.overflowList.splice(overflowIndex, 1);
      this.validatedEntries.delete(normalizedLogin);
      return { success: true, from: 'overflow' };
    }
    
    return { success: false, reason: 'Player not found in queue' };
  }

  /**
   * Clear all queues
   */
  clearQueues() {
    this.waitingList = [];
    this.overflowList = [];
    this.validatedEntries.clear();
  }
}

// Export singleton instance
export const queueValidator = new QueueValidator();
