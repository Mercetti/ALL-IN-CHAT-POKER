/**
 * Example Plugin
 * Demonstrates how to create a plugin for the poker game system
 */

const BasePlugin = require('../base-plugin');

class ExamplePlugin extends BasePlugin {
  constructor(config) {
    super({
      name: 'example-plugin',
      version: '1.0.0',
      description: 'An example plugin for the poker game system',
      author: 'System',
      dependencies: [],
      permissions: ['read', 'write'],
      ...config
    });
    
    this.data = new Map();
    this.counters = new Map();
  }

  /**
   * Initialize the plugin
   */
  async onInitialize() {
    this.logActivity('info', 'Example plugin initializing');
    
    // Initialize plugin data
    this.data.set('initialized_at', Date.now());
    this.counters.set('events_processed', 0);
    
    this.logActivity('info', 'Example plugin initialized');
  }

  /**
   * Start the plugin
   */
  async onStart() {
    this.logActivity('info', 'Example plugin starting');
    
    // Start any background processes
    this.startEventProcessor();
    
    this.logActivity('info', 'Example plugin started');
  }

  /**
   * Stop the plugin
   */
  async onStop() {
    this.logActivity('info', 'Example plugin stopping');
    
    // Stop background processes
    if (this.eventProcessorInterval) {
      clearInterval(this.eventProcessorInterval);
    }
    
    this.logActivity('info', 'Example plugin stopped');
  }

  /**
   * Cleanup the plugin
   */
  async onCleanup() {
    this.logActivity('info', 'Example plugin cleaning up');
    
    // Clean up resources
    this.data.clear();
    this.counters.clear();
    
    this.logActivity('info', 'Example plugin cleaned up');
  }

  /**
   * Health check
   */
  async onHealthCheck() {
    return {
      status: 'healthy',
      message: 'Example plugin is operational',
      details: {
        dataCount: this.data.size,
        counters: Object.fromEntries(this.counters)
      }
    };
  }

  /**
   * Get event listeners
   */
  getEventListeners() {
    return {
      'game.hand.completed': this.handleGameHandCompleted.bind(this),
      'user.session.started': this.handleUserSessionStarted.bind(this),
      'system.performance.latency': this.handleSystemLatency.bind(this)
    };
  }

  /**
   * Get API methods
   */
  getAPI() {
    return {
      getData: this.getData.bind(this),
      setData: this.setData.bind(this),
      getCounter: this.getCounter.bind(this),
      incrementCounter: this.incrementCounter.bind(this),
      processCustomEvent: this.processCustomEvent.bind(this)
    };
  }

  /**
   * Start event processor
   */
  startEventProcessor() {
    this.eventProcessorInterval = setInterval(() => {
      this.processEvents();
    }, 5000); // Every 5 seconds
  }

  /**
   * Process events
   */
  async processEvents() {
    try {
      const events = await this.events.getHistory(null, 10);
      
      for (const event of events) {
        await this.processEvent(event);
      }
      
      this.logActivity('debug', `Processed ${events.length} events`);
      
    } catch (error) {
      this.logActivity('error', 'Failed to process events', { error: error.message });
    }
  }

  /**
   * Process a single event
   */
  async processEvent(event) {
    this.counters.set('events_processed', (this.counters.get('events_processed') || 0) + 1);
    
    // Store event data
    this.data.set(`last_event_${event.name}`, {
      timestamp: event.timestamp,
      data: event.data
    });
    
    // Emit plugin-specific event
    this.emitPluginEvent('eventProcessed', {
      originalEvent: event.name,
      processedAt: Date.now()
    });
  }

  /**
   * Handle game hand completed event
   */
  async handleGameHandCompleted(event, api) {
    this.logActivity('info', 'Game hand completed', { 
      gameId: event.data.gameId,
      winner: event.data.winner 
    });
    
    // Store hand statistics
    const handStats = this.data.get('hand_stats') || {
      totalHands: 0,
      totalPot: 0,
      winners: {}
    };
    
    handStats.totalHands++;
    handStats.totalPot += event.data.potSize || 0;
    
    const winner = event.data.winner;
    if (winner) {
      handStats.winners[winner] = (handStats.winners[winner] || 0) + 1;
    }
    
    this.data.set('hand_stats', handStats);
    
    // Update database via API
    try {
      await api.database.run(
        'INSERT INTO plugin_hand_stats (plugin_name, game_id, winner, pot_size, timestamp) VALUES (?, ?, ?, ?, ?)',
        [this.config.name, event.data.gameId, event.data.winner, event.data.potSize, Date.now()]
      );
    } catch (error) {
      this.logActivity('error', 'Failed to store hand stats', { error: error.message });
    }
  }

  /**
   * Handle user session started event
   */
  async handleUserSessionStarted(event, api) {
    this.logActivity('info', 'User session started', { 
      sessionId: event.data.sessionId,
      userId: event.data.userId 
    });
    
    // Track active sessions
    const activeSessions = this.data.get('active_sessions') || new Set();
    activeSessions.add(event.data.sessionId);
    this.data.set('active_sessions', activeSessions);
    
    // Send welcome message via WebSocket
    try {
      await api.websocket.sendToSession(event.data.sessionId, {
        type: 'welcome',
        message: 'Welcome to the poker game!',
        plugin: this.config.name
      });
    } catch (error) {
      this.logActivity('error', 'Failed to send welcome message', { error: error.message });
    }
  }

  /**
   * Handle system latency event
   */
  async handleSystemLatency(event, api) {
    const latency = event.data.latency;
    
    // Track latency statistics
    const latencyStats = this.data.get('latency_stats') || {
      samples: [],
      average: 0,
      min: Infinity,
      max: -Infinity
    };
    
    latencyStats.samples.push({
      timestamp: event.timestamp,
      latency
    });
    
    // Keep only last 100 samples
    if (latencyStats.samples.length > 100) {
      latencyStats.samples = latencyStats.samples.slice(-100);
    }
    
    // Calculate statistics
    const values = latencyStats.samples.map(s => s.latency);
    latencyStats.average = values.reduce((sum, val) => sum + val, 0) / values.length;
    latencyStats.min = Math.min(...values);
    latencyStats.max = Math.max(...values);
    
    this.data.set('latency_stats', latencyStats);
    
    // Alert if latency is high
    if (latency > 1000) {
      this.logActivity('warn', 'High latency detected', { latency });
      
      // Send alert via WebSocket
      try {
        await api.broadcast({
          type: 'alert',
          message: 'High system latency detected',
          latency,
          plugin: this.config.name
        });
      } catch (error) {
        this.logActivity('error', 'Failed to send latency alert', { error: error.message });
      }
    }
  }

  /**
   * Get plugin data
   */
  async getData(key = null) {
    if (key) {
      return this.data.get(key);
    }
    
    return Object.fromEntries(this.data);
  }

  /**
   * Set plugin data
   */
  async setData(key, value) {
    this.data.set(key, value);
    
    this.emitPluginEvent('dataUpdated', { key, value });
    
    return true;
  }

  /**
   * Get counter value
   */
  async getCounter(name) {
    return this.counters.get(name) || 0;
  }

  /**
   * Increment counter
   */
  async incrementCounter(name, increment = 1) {
    const current = this.counters.get(name) || 0;
    const newValue = current + increment;
    this.counters.set(name, newValue);
    
    this.emitPluginEvent('counterIncremented', { name, increment, newValue });
    
    return newValue;
  }

  /**
   * Process custom event
   */
  async processCustomEvent(eventData) {
    this.validateParams(eventData, {
      type: { required: true, type: 'string' },
      data: { required: false, type: 'object' }
    });
    
    // Create custom event
    const event = {
      id: this.generateId(),
      name: eventData.type,
      data: eventData.data || {},
      timestamp: Date.now(),
      source: this.config.name
    };
    
    // Emit the event
    this.emit(event.name, event);
    
    this.logActivity('info', 'Custom event processed', { 
      type: eventData.type,
      eventId: event.id 
    });
    
    return {
      success: true,
      eventId: event.id,
      timestamp: event.timestamp
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${this.config.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get plugin statistics
   */
  getStatistics() {
    return {
      dataCount: this.data.size,
      counters: Object.fromEntries(this.counters),
      uptime: this.getUptime(),
      state: this.state,
      lastActivity: this.metrics.lastActivity
    };
  }
}

module.exports = ExamplePlugin;
