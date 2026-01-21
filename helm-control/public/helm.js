/**
 * Helm Control - Hosted JS Loader
 * Zero-backend integration for web applications
 */

(function(global) {
  'use strict';

  // Helm Control SDK - Public Interface
  class HelmControl {
    constructor(config) {
      this.config = config || {};
      this.apiKey = config.apiKey;
      this.endpoint = config.endpoint || 'https://api.helmcontrol.ai/v1';
      this.mode = config.mode || 'observer';
      this.events = new Map();
      this.sessionId = null;
      this.initialized = false;
    }

    // Initialize Helm Control
    async initialize() {
      if (this.initialized) return;

      try {
        // Validate API key
        if (!this.apiKey) {
          throw new Error('API key required');
        }

        // Start session
        const response = await this._makeRequest('/session/start', {
          domain: 'web',
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        });

        this.sessionId = response.sessionId;
        this.initialized = true;

        this._emit('initialized', { sessionId: this.sessionId });
        console.log('Helm Control initialized successfully');

      } catch (error) {
        this._emit('error', { type: 'initialization_failed', error });
        throw error;
      }
    }

    // Send message to Helm
    async send(message, options = {}) {
      if (!this.initialized) {
        await this.initialize();
      }

      try {
        const response = await this._makeRequest('/session/message', {
          sessionId: this.sessionId,
          message: message,
          mode: this.mode,
          options: options,
          timestamp: Date.now()
        });

        this._emit('response', response);
        return response;

      } catch (error) {
        this._emit('error', { type: 'message_failed', error, message });
        throw error;
      }
    }

    // Enable skill
    async enableSkill(skillId, config = {}) {
      try {
        const response = await this._makeRequest('/skill/enable', {
          sessionId: this.sessionId,
          skillId: skillId,
          config: config
        });

        this._emit('skill_enabled', { skillId, response });
        return response;

      } catch (error) {
        this._emit('error', { type: 'skill_enable_failed', error, skillId });
        throw error;
      }
    }

    // Disable skill
    async disableSkill(skillId) {
      try {
        const response = await this._makeRequest('/skill/disable', {
          sessionId: this.sessionId,
          skillId: skillId
        });

        this._emit('skill_disabled', { skillId, response });
        return response;

      } catch (error) {
        this._emit('error', { type: 'skill_disable_failed', error, skillId });
        throw error;
      }
    }

    // List available skills
    async listSkills() {
      try {
        const response = await this._makeRequest('/skills/list', {
          sessionId: this.sessionId
        });

        this._emit('skills_listed', response);
        return response;

      } catch (error) {
        this._emit('error', { type: 'skills_list_failed', error });
        throw error;
      }
    }

    // Get status
    async getStatus() {
      try {
        const response = await this._makeRequest('/status', {
          sessionId: this.sessionId
        });

        this._emit('status_received', response);
        return response;

      } catch (error) {
        this._emit('error', { type: 'status_failed', error });
        throw error;
      }
    }

    // Event handling
    on(event, handler) {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      this.events.get(event).push(handler);
    }

    off(event, handler) {
      const handlers = this.events.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    // Emergency shutdown
    async emergencyShutdown(reason = 'User requested') {
      try {
        await this._makeRequest('/session/emergency-shutdown', {
          sessionId: this.sessionId,
          reason: reason
        });

        this._emit('emergency_shutdown', { reason });
        this._cleanup();

      } catch (error) {
        this._emit('error', { type: 'shutdown_failed', error });
      }
    }

    // Set mode
    setMode(mode) {
      this.mode = mode;
      this._emit('mode_changed', { mode });
    }

    // Private methods
    async _makeRequest(endpoint, data) {
      const url = this.endpoint + endpoint;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Helm-Session': this.sessionId || ''
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Helm API error: ${response.status} - ${error}`);
      }

      return await response.json();
    }

    _emit(event, data) {
      const handlers = this.events.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Event handler error:', error);
          }
        });
      }
    }

    _cleanup() {
      this.sessionId = null;
      this.initialized = false;
      this.events.clear();
    }
  }

  // Global Helm instance
  let helmInstance = null;

  // Auto-initialize from script attributes
  function autoInitialize() {
    const script = document.querySelector('script[src*="helm.js"]');
    if (!script) return;

    const apiKey = script.getAttribute('data-api-key');
    const mode = script.getAttribute('data-mode') || 'observer';
    const endpoint = script.getAttribute('data-endpoint');

    if (apiKey) {
      helmInstance = new HelmControl({
        apiKey: apiKey,
        mode: mode,
        endpoint: endpoint
      });

      // Auto-initialize
      helmInstance.initialize().catch(error => {
        console.error('Helm auto-initialization failed:', error);
      });
    }
  }

  // Export to global scope
  global.Helm = {
    // Create new instance
    create: function(config) {
      return new HelmControl(config);
    },

    // Get global instance
    getInstance: function() {
      return helmInstance;
    },

    // Quick methods for common operations
    send: function(message, options) {
      if (!helmInstance) {
        throw new Error('Helm not initialized. Call Helm.create() first.');
      }
      return helmInstance.send(message, options);
    },

    enableSkill: function(skillId, config) {
      if (!helmInstance) {
        throw new Error('Helm not initialized. Call Helm.create() first.');
      }
      return helmInstance.enableSkill(skillId, config);
    },

    on: function(event, handler) {
      if (!helmInstance) {
        throw new Error('Helm not initialized. Call Helm.create() first.');
      }
      return helmInstance.on(event, handler);
    },

    // Utility methods
    version: '1.0.0',
    initialized: function() {
      return helmInstance && helmInstance.initialized;
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    if (helmInstance) {
      helmInstance.emergencyShutdown('Page unload');
    }
  });

})(typeof window !== 'undefined' ? window : global);
