/**
 * Web Integration Example - Helm Control SDK
 * Demonstrates browser-based integration
 */

// Include the Helm Control SDK in your HTML
// <script src="https://cdn.helm.ai/helm.min.js"></script>

// Web integration example
class WebIntegration {
  constructor() {
    this.helm = null;
    this.session = null;
  }

  async initialize() {
    // Initialize Helm with configuration
    this.helm = new HelmClient({
      apiKey: 'pk_live_your_api_key_here',
      environment: 'hosted',
      telemetry: true
    });

    // Start session
    this.session = this.helm.startSession({
      domain: 'web',
      userId: this.getUserId(),
      sessionId: this.generateSessionId()
    });

    console.log('Helm initialized successfully');
  }

  async sendMessage(message) {
    if (!this.session) {
      throw new Error('Helm not initialized');
    }

    try {
      const response = await this.session.send(message);
      return response;
    } catch (error) {
      console.error('Message failed:', error);
      throw error;
    }
  }

  async executeSkill(skillId, params = {}) {
    const skillCommand = `!${skillId} ${JSON.stringify(params)}`;
    return await this.sendMessage(skillCommand);
  }

  async shutdown() {
    if (this.session) {
      this.session.end();
    }
    if (this.helm) {
      this.helm.shutdown();
    }
    console.log('Helm shutdown complete');
  }

  // Helper methods
  getUserId() {
    return localStorage.getItem('userId') || 'anonymous';
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Usage example
const webHelm = new WebIntegration();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await webHelm.initialize();
    
    // Set up message handler
    window.sendHelmMessage = async (message) => {
      return await webHelm.sendMessage(message);
    };
    
    // Set up skill handler
    window.executeHelmSkill = async (skillId, params) => {
      return await webHelm.executeSkill(skillId, params);
    };
    
    console.log('Helm web integration ready');
  } catch (error) {
    console.error('Failed to initialize Helm:', error);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  webHelm.shutdown();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebIntegration;
}
