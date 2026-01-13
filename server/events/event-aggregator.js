/**
 * Event Aggregator
 * Aggregates and processes events for analytics and reporting
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class EventAggregator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableRealTime: options.enableRealTime !== false,
      enableBatching: options.enableBatching !== false,
      batchSize: options.batchSize || 100,
      batchTimeout: options.batchTimeout || 5000, // 5 seconds
      enablePersistence: options.enablePersistence !== false,
      persistencePath: options.persistencePath || './data/aggregations',
      enableCompression: options.enableCompression !== false,
      retentionPeriod: options.retentionPeriod || 30 * 24 * 60 * 60 * 1000, // 30 days
      enableMetrics: options.enableMetrics !== false,
      metricsInterval: options.metricsInterval || 60000 // 1 minute
    };
    
    this.logger = new Logger('event-aggregator');
    
    // Aggregation data structures
    this.aggregations = new Map(); // aggregationKey -> aggregationData
    this.realTimeAggregations = new Map(); // real-time aggregations
    this.batchedEvents = [];
    this.batchTimer = null;
    
    // Metrics
    this.metrics = {
      totalEvents: 0,
      aggregationsProcessed: 0,
      averageProcessingTime: 0,
      errorCount: 0,
      startTime: Date.now()
    };
    
    this.initialize();
  }

  /**
   * Initialize the event aggregator
   */
  initialize() {
    this.logger.info('Initializing event aggregator');
    
    if (this.options.enablePersistence) {
      this.loadPersistedAggregations();
    }
    
    if (this.options.enableBatching) {
      this.setupBatching();
    }
    
    if (this.options.enableMetrics) {
      this.setupMetrics();
    }
    
    // Set up aggregation processors
    this.setupAggregationProcessors();
  }

  /**
   * Setup aggregation processors
   */
  setupAggregationProcessors() {
    // Game event aggregations
    this.registerAggregation('game.events.per_hour', {
      type: 'time_series',
      window: '1h',
      groupBy: ['eventType'],
      processor: this.processGameEventsPerHour.bind(this)
    });
    
    this.registerAggregation('game.players.active', {
      type: 'real_time',
      window: '5m',
      processor: this.processActivePlayers.bind(this)
    });
    
    this.registerAggregation('game.pots.average', {
      type: 'statistical',
      window: '24h',
      processor: this.processAveragePotSize.bind(this)
    });
    
    this.registerAggregation('game.hands.per_session', {
      type: 'session',
      window: 'session',
      processor: this.processHandsPerSession.bind(this)
    });
    
    // User event aggregations
    this.registerAggregation('user.sessions.duration', {
      type: 'statistical',
      window: '24h',
      processor: this.processSessionDuration.bind(this)
    });
    
    this.registerAggregation('user.bets.frequency', {
      type: 'frequency',
      window: '1h',
      processor: this.processBetFrequency.bind(this)
    });
    
    // System event aggregations
    this.registerAggregation('system.performance.latency', {
      type: 'performance',
      window: '5m',
      processor: this.processLatencyMetrics.bind(this)
    });
    
    this.registerAggregation('system.errors.rate', {
      type: 'rate',
      window: '1h',
      processor: this.processErrorRate.bind(this)
    });
  }

  /**
   * Register an aggregation
   */
  registerAggregation(key, config) {
    this.aggregations.set(key, {
      key,
      config,
      data: this.initializeAggregationData(config),
      lastUpdated: Date.now(),
      processingCount: 0
    });
    
    this.logger.info('Aggregation registered', { key, type: config.type });
  }

  /**
   * Initialize aggregation data based on type
   */
  initializeAggregationData(config) {
    switch (config.type) {
      case 'time_series':
        return {
          series: new Map(),
          total: 0,
          min: Infinity,
          max: -Infinity
        };
        
      case 'real_time':
        return {
          current: 0,
          peak: 0,
          trend: [],
          lastReset: Date.now()
        };
        
      case 'statistical':
        return {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          values: []
        };
        
      case 'frequency':
        return {
          frequencies: new Map(),
          total: 0
        };
        
      case 'session':
        return {
          sessions: new Map(),
          active: 0,
          total: 0
        };
        
      case 'performance':
        return {
          measurements: [],
          average: 0,
          p50: 0,
          p95: 0,
          p99: 0
        };
        
      case 'rate':
        return {
          count: 0,
          windowStart: Date.now(),
          rate: 0
        };
        
      default:
        return {};
    }
  }

  /**
   * Process an event
   */
  async processEvent(event) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalEvents++;
      
      // Add to batch if batching is enabled
      if (this.options.enableBatching) {
        this.batchedEvents.push(event);
        
        if (this.batchedEvents.length >= this.options.batchSize) {
          await this.processBatch();
        }
      } else {
        // Process immediately
        await this.processEventImmediately(event);
      }
      
      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);
      
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error('Failed to process event', {
        eventId: event.id,
        error: error.message
      });
      
      this.emit('processingError', { event, error });
    }
  }

  /**
   * Process event immediately
   */
  async processEventImmediately(event) {
    for (const [key, aggregation] of this.aggregations) {
      try {
        await aggregation.config.processor(event, aggregation);
        aggregation.lastUpdated = Date.now();
        aggregation.processingCount++;
        
        this.metrics.aggregationsProcessed++;
        
      } catch (error) {
        this.logger.error('Aggregation processing failed', {
          aggregationKey: key,
          eventId: event.id,
          error: error.message
        });
      }
    }
    
    // Emit processed event
    this.emit('eventProcessed', { event, timestamp: Date.now() });
  }

  /**
   * Setup batching
   */
  setupBatching() {
    this.batchTimer = setInterval(() => {
      if (this.batchedEvents.length > 0) {
        this.processBatch();
      }
    }, this.options.batchTimeout);
  }

  /**
   * Process batch of events
   */
  async processBatch() {
    if (this.batchedEvents.length === 0) {
      return;
    }
    
    const batch = this.batchedEvents.splice(0, this.options.batchSize);
    
    this.logger.debug('Processing event batch', {
      batchSize: batch.length,
      totalBatches: Math.ceil(this.metrics.totalEvents / this.options.batchSize)
    });
    
    try {
      // Group events by type for efficient processing
      const eventsByType = new Map();
      
      for (const event of batch) {
        const type = event.name || 'unknown';
        if (!eventsByType.has(type)) {
          eventsByType.set(type, []);
        }
        eventsByType.get(type).push(event);
      }
      
      // Process each group
      for (const [eventType, events] of eventsByType) {
        await this.processEventGroup(eventType, events);
      }
      
      // Persist aggregations if enabled
      if (this.options.enablePersistence) {
        await this.persistAggregations();
      }
      
      this.emit('batchProcessed', {
        batchSize: batch.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.logger.error('Batch processing failed', {
        batchSize: batch.length,
        error: error.message
      });
      
      this.emit('batchError', { batch, error });
    }
  }

  /**
   * Process group of events of the same type
   */
  async processEventGroup(eventType, events) {
    for (const [key, aggregation] of this.aggregations) {
      try {
        // Check if aggregation should process this event type
        if (this.shouldProcessEventType(aggregation, eventType)) {
          for (const event of events) {
            await aggregation.config.processor(event, aggregation);
          }
          
          aggregation.lastUpdated = Date.now();
          aggregation.processingCount += events.length;
          this.metrics.aggregationsProcessed += events.length;
        }
        
      } catch (error) {
        this.logger.error('Group processing failed', {
          aggregationKey: key,
          eventType,
          eventCount: events.length,
          error: error.message
        });
      }
    }
  }

  /**
   * Check if aggregation should process event type
   */
  shouldProcessEventType(aggregation, eventType) {
    // Default to processing all events
    // Override in specific aggregation configs if needed
    return true;
  }

  // Aggregation processors

  /**
   * Process game events per hour
   */
  async processGameEventsPerHour(event, aggregation) {
    const hour = this.getHourKey(event.timestamp);
    const eventType = event.name || 'unknown';
    
    if (!aggregation.data.series.has(hour)) {
      aggregation.data.series.set(hour, new Map());
    }
    
    const hourData = aggregation.data.series.get(hour);
    hourData.set(eventType, (hourData.get(eventType) || 0) + 1);
    
    aggregation.data.total++;
  }

  /**
   * Process active players
   */
  async processActivePlayers(event, aggregation) {
    if (event.name === 'game.player.joined') {
      aggregation.data.current++;
      aggregation.data.peak = Math.max(aggregation.data.peak, aggregation.data.current);
    } else if (event.name === 'game.player.left') {
      aggregation.data.current = Math.max(0, aggregation.data.current - 1);
    }
    
    // Update trend
    aggregation.data.trend.push({
      timestamp: Date.now(),
      count: aggregation.data.current
    });
    
    // Keep only last hour of trend data
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    aggregation.data.trend = aggregation.data.trend.filter(
      point => point.timestamp > oneHourAgo
    );
  }

  /**
   * Process average pot size
   */
  async processAveragePotSize(event, aggregation) {
    if (event.name === 'game.pot.created') {
      const potSize = event.data?.potSize || 0;
      
      aggregation.data.count++;
      aggregation.data.sum += potSize;
      aggregation.data.min = Math.min(aggregation.data.min, potSize);
      aggregation.data.max = Math.max(aggregation.data.max, potSize);
      
      aggregation.data.values.push({
        timestamp: event.timestamp,
        value: potSize
      });
      
      // Keep only last 1000 values
      if (aggregation.data.values.length > 1000) {
        aggregation.data.values = aggregation.data.values.slice(-1000);
      }
    }
  }

  /**
   * Process hands per session
   */
  async processHandsPerSession(event, aggregation) {
    if (event.name === 'game.session.started') {
      const sessionId = event.data?.sessionId;
      if (sessionId) {
        aggregation.data.sessions.set(sessionId, {
          startTime: event.timestamp,
          handCount: 0
        });
        aggregation.data.active++;
      }
    } else if (event.name === 'game.hand.completed') {
      const sessionId = event.data?.sessionId;
      if (sessionId && aggregation.data.sessions.has(sessionId)) {
        const session = aggregation.data.sessions.get(sessionId);
        session.handCount++;
      }
    } else if (event.name === 'game.session.ended') {
      const sessionId = event.data?.sessionId;
      if (sessionId && aggregation.data.sessions.has(sessionId)) {
        aggregation.data.sessions.delete(sessionId);
        aggregation.data.active = Math.max(0, aggregation.data.active - 1);
        aggregation.data.total++;
      }
    }
  }

  /**
   * Process session duration
   */
  async processSessionDuration(event, aggregation) {
    if (event.name === 'user.session.started') {
      const userId = event.data?.userId;
      if (userId) {
        aggregation.data.values.push({
          userId,
          startTime: event.timestamp,
          endTime: null
        });
      }
    } else if (event.name === 'user.session.ended') {
      const userId = event.data?.userId;
      if (userId) {
        const sessionIndex = aggregation.data.values.findIndex(
          s => s.userId === userId && s.endTime === null
        );
        
        if (sessionIndex !== -1) {
          const session = aggregation.data.values[sessionIndex];
          session.endTime = event.timestamp;
          
          const duration = event.timestamp - session.startTime;
          
          aggregation.data.count++;
          aggregation.data.sum += duration;
          aggregation.data.min = Math.min(aggregation.data.min, duration);
          aggregation.data.max = Math.max(aggregation.data.max, duration);
        }
      }
    }
  }

  /**
   * Process bet frequency
   */
  async processBetFrequency(event, aggregation) {
    if (event.name === 'game.player.bet') {
      const userId = event.data?.userId;
      if (userId) {
        const count = aggregation.data.frequencies.get(userId) || 0;
        aggregation.data.frequencies.set(userId, count + 1);
        aggregation.data.total++;
      }
    }
  }

  /**
   * Process latency metrics
   */
  async processLatencyMetrics(event, aggregation) {
    if (event.name === 'system.performance.latency') {
      const latency = event.data?.latency || 0;
      
      aggregation.data.measurements.push({
        timestamp: event.timestamp,
        value: latency
      });
      
      // Keep only last 1000 measurements
      if (aggregation.data.measurements.length > 1000) {
        aggregation.data.measurements = aggregation.data.measurements.slice(-1000);
      }
      
      // Calculate percentiles
      const values = aggregation.data.measurements.map(m => m.value).sort((a, b) => a - b);
      
      aggregation.data.average = values.reduce((sum, val) => sum + val, 0) / values.length;
      aggregation.data.p50 = this.percentile(values, 50);
      aggregation.data.p95 = this.percentile(values, 95);
      aggregation.data.p99 = this.percentile(values, 99);
    }
  }

  /**
   * Process error rate
   */
  async processErrorRate(event, aggregation) {
    const now = Date.now();
    
    // Reset window if needed
    if (now - aggregation.data.windowStart > 60 * 60 * 1000) { // 1 hour
      aggregation.data.count = 0;
      aggregation.data.windowStart = now;
    }
    
    if (event.name === 'system.error') {
      aggregation.data.count++;
    }
    
    // Calculate rate
    const windowDuration = now - aggregation.data.windowStart;
    aggregation.data.rate = (aggregation.data.count / windowDuration) * 1000 * 60; // per minute
  }

  /**
   * Get aggregation data
   */
  getAggregation(key) {
    const aggregation = this.aggregations.get(key);
    if (!aggregation) {
      return null;
    }
    
    return {
      key,
      config: aggregation.config,
      data: aggregation.data,
      lastUpdated: aggregation.lastUpdated,
      processingCount: aggregation.processingCount
    };
  }

  /**
   * Get all aggregations
   */
  getAllAggregations() {
    const result = {};
    
    for (const [key, aggregation] of this.aggregations) {
      result[key] = this.getAggregation(key);
    }
    
    return result;
  }

  /**
   * Get aggregation summary
   */
  getAggregationSummary(key) {
    const aggregation = this.aggregations.get(key);
    if (!aggregation) {
      return null;
    }
    
    const summary = {
      key,
      type: aggregation.config.type,
      lastUpdated: aggregation.lastUpdated,
      processingCount: aggregation.processingCount
    };
    
    // Add type-specific summary data
    switch (aggregation.config.type) {
      case 'statistical':
        if (aggregation.data.count > 0) {
          summary.average = aggregation.data.sum / aggregation.data.count;
          summary.min = aggregation.data.min;
          summary.max = aggregation.data.max;
          summary.count = aggregation.data.count;
        }
        break;
        
      case 'real_time':
        summary.current = aggregation.data.current;
        summary.peak = aggregation.data.peak;
        break;
        
      case 'frequency':
        summary.total = aggregation.data.total;
        summary.topItems = Array.from(aggregation.data.frequencies.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        break;
        
      case 'performance':
        summary.average = aggregation.data.average;
        summary.p50 = aggregation.data.p50;
        summary.p95 = aggregation.data.p95;
        summary.p99 = aggregation.data.p99;
        break;
        
      case 'rate':
        summary.rate = aggregation.data.rate;
        summary.count = aggregation.data.count;
        break;
    }
    
    return summary;
  }

  /**
   * Get all aggregation summaries
   */
  getAllAggregationSummaries() {
    const summaries = {};
    
    for (const [key] of this.aggregations) {
      summaries[key] = this.getAggregationSummary(key);
    }
    
    return summaries;
  }

  /**
   * Reset aggregation
   */
  resetAggregation(key) {
    const aggregation = this.aggregations.get(key);
    if (aggregation) {
      aggregation.data = this.initializeAggregationData(aggregation.config);
      aggregation.lastUpdated = Date.now();
      aggregation.processingCount = 0;
      
      this.logger.info('Aggregation reset', { key });
    }
  }

  /**
   * Reset all aggregations
   */
  resetAllAggregations() {
    for (const [key, aggregation] of this.aggregations) {
      aggregation.data = this.initializeAggregationData(aggregation.config);
      aggregation.lastUpdated = Date.now();
      aggregation.processingCount = 0;
    }
    
    this.logger.info('All aggregations reset');
  }

  /**
   * Persist aggregations
   */
  async persistAggregations() {
    if (!this.options.enablePersistence) {
      return;
    }
    
    try {
      const data = {
        timestamp: Date.now(),
        aggregations: this.getAllAggregations(),
        metrics: this.metrics
      };
      
      const filePath = path.join(this.options.persistencePath, 'aggregations.json');
      
      if (!fs.existsSync(this.options.persistencePath)) {
        fs.mkdirSync(this.options.persistencePath, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
    } catch (error) {
      this.logger.error('Failed to persist aggregations', { error: error.message });
    }
  }

  /**
   * Load persisted aggregations
   */
  loadPersistedAggregations() {
    try {
      const filePath = path.join(this.options.persistencePath, 'aggregations.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Restore aggregation data
        for (const [key, persistedAggregation] of Object.entries(data.aggregations)) {
          const aggregation = this.aggregations.get(key);
          if (aggregation) {
            aggregation.data = persistedAggregation.data;
            aggregation.lastUpdated = persistedAggregation.lastUpdated;
            aggregation.processingCount = persistedAggregation.processingCount;
          }
        }
        
        this.logger.info('Persisted aggregations loaded');
      }
      
    } catch (error) {
      this.logger.error('Failed to load persisted aggregations', { error: error.message });
    }
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, this.options.metricsInterval);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      ...this.metrics,
      uptime,
      averageProcessingTime: Math.round(this.metrics.averageProcessingTime),
      aggregationsCount: this.aggregations.size,
      batchedEventsCount: this.batchedEvents.length,
      errorRate: this.metrics.totalEvents > 0 
        ? (this.metrics.errorCount / this.metrics.totalEvents * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Update average processing time
   */
  updateAverageProcessingTime(processingTime) {
    if (this.metrics.aggregationsProcessed === 1) {
      this.metrics.averageProcessingTime = processingTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (this.metrics.aggregationsProcessed - 1) + processingTime) / 
        this.metrics.aggregationsProcessed;
    }
  }

  /**
   * Helper methods
   */
  getHourKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  }

  percentile(values, p) {
    if (values.length === 0) return 0;
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const metrics = this.getMetrics();
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        aggregations: {
          count: this.aggregations.size,
          processingCount: metrics.aggregationsProcessed,
          errorRate: parseFloat(metrics.errorRate)
        },
        batching: {
          enabled: this.options.enableBatching,
          batchSize: this.batchedEvents.length,
          maxBatchSize: this.options.batchSize
        },
        metrics: {
          totalEvents: metrics.totalEvents,
          averageProcessingTime: metrics.averageProcessingTime,
          uptime: metrics.uptime
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Shutdown event aggregator
   */
  async shutdown() {
    this.logger.info('Shutting down event aggregator');
    
    try {
      // Process remaining batch
      if (this.batchedEvents.length > 0) {
        await this.processBatch();
      }
      
      // Clear batch timer
      if (this.batchTimer) {
        clearInterval(this.batchTimer);
      }
      
      // Persist aggregations
      if (this.options.enablePersistence) {
        await this.persistAggregations();
      }
      
      this.logger.info('Event aggregator shutdown complete');
      
    } catch (error) {
      this.logger.error('Failed to shutdown event aggregator', { error: error.message });
    }
  }
}

module.exports = EventAggregator;
