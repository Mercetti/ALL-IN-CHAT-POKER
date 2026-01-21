
/**
 * Helm Engine Service
 * Integration service for All-In Chat Poker to use Helm Control engine
 */

class HelmEngineService {
  constructor() {
    this.baseURL = 'http://localhost:8080';
    this.apiKey = null;
    this.persona = 'acey';
    this.initialized = false;
  }

  /**
   * Initialize the Helm engine service
   */
  async initialize(apiKey = null) {
    try {
      this.apiKey = apiKey;
      
      // Test connection to Helm engine
      const response = await fetch(`${this.baseURL}/health`);
      if (response.ok) {
        this.initialized = true;
        console.log('✅ Helm engine service initialized');
        return true;
      } else {
        throw new Error('Helm engine not responding');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Helm engine:', error);
      return false;
    }
  }

  /**
   * Send a message to the Helm engine
   */
  async sendMessage(message, userId = 'default') {
    if (!this.initialized) {
      throw new Error('Helm engine service not initialized');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/helm/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          id: `mobile-${Date.now()}`,
          userId,
          persona: this.persona,
          message,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Helm engine error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Failed to send message to Helm engine:', error);
      throw error;
    }
  }

  /**
   * Get available personas
   */
  async getPersonas() {
    if (!this.initialized) {
      throw new Error('Helm engine service not initialized');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/helm/personas`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get personas: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get personas:', error);
      throw error;
    }
  }

  /**
   * Set active persona
   */
  setPersona(personaName) {
    this.persona = personaName;
    console.log(`🎭 Persona set to: ${personaName}`);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      baseURL: this.baseURL,
      persona: this.persona,
      hasApiKey: !!this.apiKey
    };
  }
}

// Export singleton instance
export const helmEngineService = new HelmEngineService();
export default helmEngineService;
