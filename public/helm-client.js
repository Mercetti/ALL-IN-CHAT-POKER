/**
 * Helm Client - Frontend Integration
 * Connects to Local Helm Engine
 */

class HelmClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.sessionId = this.generateSessionId();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/helm/status`);
      const status = await response.json();
      this.isConnected = status.running;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async executeSkill(skillId, params = {}) {
    try {
      // Check connection first
      if (!this.isConnected) {
        await this.checkConnection();
      }

      const response = await fetch(`${this.baseUrl}/helm/skill/${skillId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId,
          params,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Reset reconnect attempts on success
      this.reconnectAttempts = 0;
      
      return result;
      
    } catch (error) {
      console.error('Helm skill execution failed:', error);
      
      // Try to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.checkConnection(), 1000 * this.reconnectAttempts);
      }
      
      throw error;
    }
  }

  // Poker Game Methods
  async dealCards(playerId, count = 5) {
    return await this.executeSkill('poker_deal', { playerId, count });
  }

  async placeBet(playerId, amount) {
    return await this.executeSkill('poker_bet', { playerId, amount });
  }

  async foldHand(playerId, reason = 'player_choice') {
    return await this.executeSkill('poker_fold', { playerId, reason });
  }

  // Chat Methods
  async getChatResponse(message, context = 'poker') {
    return await this.executeSkill('chat_response', { message, context });
  }

  // Analytics Methods
  async getAnalytics() {
    return await this.executeSkill('analytics');
  }

  async getPlayerStats(playerId) {
    return await this.executeSkill('player_stats', { playerId });
  }

  async getGameState() {
    return await this.executeSkill('game_state');
  }

  // System Methods
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/helm/status`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get Helm status:', error);
      return { running: false, error: error.message };
    }
  }

  async getAuditLog(limit = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/helm/audit?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get audit log:', error);
      return { auditLog: [], error: error.message };
    }
  }

  // Utility Methods
  async healthCheck() {
    return await this.executeSkill('health_check');
  }

  getSessionId() {
    return this.sessionId;
  }

  isHelmConnected() {
    return this.isConnected;
  }
}

// Initialize global Helm client
const helmClient = new HelmClient(window.location.origin);

// Auto-connect on page load
window.addEventListener('load', async () => {
  console.log('🔗 Connecting to Helm Engine...');
  
  try {
    const connected = await helmClient.checkConnection();
    if (connected) {
      console.log('✅ Helm Engine connected');
    } else {
      console.log('⚠️ Helm Engine not available');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Helm Engine:', error);
  }
});

// Export for global use
window.helmClient = helmClient;

// Also export as module for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelmClient;
}
