/**
 * Simulation and Replay System
 * Allows testing Acey behavior without affecting live system
 * Provides replay capabilities for debugging and training
 */

class SimulationReplaySystem {
  constructor(intentProcessor, memorySystem, trustSystem, io) {
    this.intentProcessor = intentProcessor;
    this.memorySystem = memorySystem;
    this.trustSystem = trustSystem;
    this.io = io;
    
    // Simulation state
    this.isSimulationMode = false;
    this.simulationHistory = [];
    this.currentSimulation = null;
    
    // Replay state
    this.replayBuffer = [];
    this.replayIndex = 0;
    this.isReplaying = false;
    
    // Comparison state
    this.comparisonResults = [];
    this.baselineResults = [];
    
    // Configuration
    this.config = {
      maxSimulationHistory: 1000,
      maxReplayBuffer: 500,
      autoSaveReplay: true,
      simulationTimeout: 300000 // 5 minutes
    };

    console.log('🎮 Simulation & Replay System initialized');
  }

  /**
   * Start simulation mode
   * @param {object} options - Simulation options
   * @returns {object} Simulation session
   */
  startSimulation(options = {}) {
    if (this.isSimulationMode) {
      throw new Error('Simulation already in progress');
    }

    this.isSimulationMode = true;
    
    this.currentSimulation = {
      id: this.generateSimulationId(),
      startedAt: Date.now(),
      options: {
        dryRun: options.dryRun || false,
        recordIntents: options.recordIntents !== false,
        compareWithBaseline: options.compareWithBaseline || false,
        ...options
      },
      intents: [],
      results: [],
      metrics: {
        totalIntents: 0,
        approved: 0,
        rejected: 0,
        errors: 0,
        simulated: 0
      }
    };

    // Create simulation snapshot
    this.createSimulationSnapshot();

    console.log(`🎮 Simulation started: ${this.currentSimulation.id}`);
    
    return this.currentSimulation;
  }

  /**
   * End simulation mode
   * @returns {object} Simulation results
   */
  endSimulation() {
    if (!this.isSimulationMode || !this.currentSimulation) {
      throw new Error('No simulation in progress');
    }

    // Calculate final metrics
    this.calculateSimulationMetrics();
    
    // Add to history
    this.simulationHistory.push(this.currentSimulation);
    
    // Keep history limited
    if (this.simulationHistory.length > this.config.maxSimulationHistory) {
      this.simulationHistory = this.simulationHistory.slice(-this.config.maxSimulationHistory);
    }

    // Restore system state if not dry run
    if (!this.currentSimulation.options.dryRun) {
      this.restoreSystemState();
    }

    const results = this.currentSimulation;
    
    this.isSimulationMode = false;
    this.currentSimulation = null;

    console.log(`🎮 Simulation ended: ${results.id}`);
    
    return results;
  }

  /**
   * Simulate intent execution
   * @param {object} intent - Intent to simulate
   * @returns {object} Simulation result
   */
  async simulateIntent(intent) {
    if (!this.isSimulationMode) {
      throw new Error('Not in simulation mode');
    }

    const startTime = Date.now();
    
    try {
      // Record intent
      if (this.currentSimulation.options.recordIntents) {
        this.currentSimulation.intents.push({
          ...intent.toJSON(),
          simulatedAt: startTime
        });
      }

      // Execute intent in simulation mode
      const result = await this.intentProcessor.simulateIntent(intent.id);
      
      // Record result
      this.currentSimulation.results.push({
        intentId: intent.id,
        result,
        simulatedAt: Date.now(),
        processingTime: Date.now() - startTime
      });

      // Update metrics
      this.currentSimulation.metrics.simulated++;
      this.currentSimulation.metrics.totalIntents++;

      return result;

    } catch (error) {
      console.error('❌ Simulation error:', error);
      
      this.currentSimulation.metrics.errors++;
      
      return {
        intentId: intent.id,
        error: error.message,
        simulatedAt: Date.now()
      };
    }
  }

  /**
   * Create simulation snapshot
   */
  createSimulationSnapshot() {
    this.simulationSnapshot = {
      memorySystem: {
        t0Context: { ...this.memorySystem.getT0Context() },
        t1Session: { ...this.memorySystem.t1Session },
        t2UserMemory: new Map(this.memorySystem.t2UserMemory),
        t3Global: { ...this.memorySystem.getT3Global() }
      },
      trustSystem: {
        scores: new Map(this.trustSystem.trustScores),
        decay: { ...this.trustSystem.decayConfig }
      },
      timestamp: Date.now()
    };
  }

  /**
   * Restore system state from snapshot
   */
  restoreSystemState() {
    if (!this.simulationSnapshot) {
      return;
    }

    // Restore memory system
    this.memorySystem.t0Context = this.simulationSnapshot.memorySystem.t0Context;
    this.memorySystem.t1Session = this.simulationSnapshot.memorySystem.t1Session;
    this.memorySystem.t2UserMemory = this.simulationSnapshot.memorySystem.t2UserMemory;
    this.memorySystem.t3Global = this.simulationSnapshot.memorySystem.t3Global;

    // Restore trust system
    this.trustSystem.trustScores = this.simulationSnapshot.trustSystem.scores;
    this.trustSystem.decayConfig = this.simulationSnapshot.trustSystem.decay;

    console.log('🔄 System state restored from simulation snapshot');
  }

  /**
   * Calculate simulation metrics
   */
  calculateSimulationMetrics() {
    const sim = this.currentSimulation;
    
    // Calculate approval rate
    sim.metrics.approvalRate = sim.metrics.totalIntents > 0 ? 
      sim.metrics.approved / sim.metrics.totalIntents : 0;

    // Calculate error rate
    sim.metrics.errorRate = sim.metrics.totalIntents > 0 ? 
      sim.metrics.errors / sim.metrics.totalIntents : 0;

    // Calculate average processing time
    const processingTimes = sim.results.map(r => r.processingTime || 0);
    sim.metrics.averageProcessingTime = processingTimes.length > 0 ? 
      processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0;

    // Calculate simulation duration
    sim.metrics.duration = Date.now() - sim.startedAt;
  }

  /**
   * Start recording replay
   * @param {object} options - Recording options
   */
  startReplayRecording(options = {}) {
    this.replayBuffer = [];
    this.replayIndex = 0;
    
    this.replayRecording = {
      startedAt: Date.now(),
      options: {
        recordLLMOutput: options.recordLLMOutput !== false,
        recordIntents: options.recordIntents !== false,
        recordResults: options.recordResults !== false,
        ...options
      },
      events: []
    };

    console.log('📹 Replay recording started');
  }

  /**
   * Stop recording replay
   * @returns {object} Recording data
   */
  stopReplayRecording() {
    if (!this.replayRecording) {
      throw new Error('No recording in progress');
    }

    this.replayRecording.endedAt = Date.now();
    this.replayRecording.duration = this.replayRecording.endedAt - this.replayRecording.startedAt;
    
    const recording = this.replayRecording;
    this.replayRecording = null;

    console.log('📹 Replay recording stopped');
    
    return recording;
  }

  /**
   * Record event for replay
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  recordReplayEvent(eventType, data) {
    if (!this.replayRecording) {
      return;
    }

    const event = {
      type: eventType,
      timestamp: Date.now(),
      data
    };

    this.replayRecording.events.push(event);
    this.replayBuffer.push(event);

    // Keep buffer limited
    if (this.replayBuffer.length > this.config.maxReplayBuffer) {
      this.replayBuffer = this.replayBuffer.slice(-this.config.maxReplayBuffer);
    }
  }

  /**
   * Start replay
   * @param {Array} events - Events to replay
   * @param {object} options - Replay options
   * @returns {object} Replay session
   */
  startReplay(events, options = {}) {
    if (this.isReplaying) {
      throw new Error('Replay already in progress');
    }

    this.isReplaying = true;
    this.replayIndex = 0;
    
    this.currentReplay = {
      id: this.generateReplayId(),
      startedAt: Date.now(),
      events: events,
      options: {
        speed: options.speed || 1.0,
        pauseOnError: options.pauseOnError || false,
        recordComparison: options.recordComparison || false,
        ...options
      },
      results: [],
      currentIndex: 0,
      completed: false,
      errors: []
    };

    console.log(`🔄 Replay started: ${this.currentReplay.id}`);
    
    return this.currentReplay;
  }

  /**
   * Process next replay event
   * @returns {object} Replay result
   */
  async processNextReplayEvent() {
    if (!this.isReplaying || !this.currentReplay) {
      throw new Error('No replay in progress');
    }

    if (this.replayIndex >= this.currentReplay.events.length) {
      this.currentReplay.completed = true;
      this.isReplaying = false;
      
      console.log(`🔄 Replay completed: ${this.currentReplay.id}`);
      
      return this.currentReplay;
    }

    const event = this.currentReplay.events[this.replayIndex];
    const startTime = Date.now();
    
    try {
      let result;

      switch (event.type) {
        case 'llm_output':
          result = await this.replayLLMOutput(event.data);
          break;
          
        case 'intent_processed':
          result = await this.replayIntentProcessed(event.data);
          break;
          
        case 'game_event':
          result = await this.replayGameEvent(event.data);
          break;
          
        default:
          console.warn(`Unknown replay event type: ${event.type}`);
          result = { skipped: true, type: event.type };
      }

      // Record result
      this.currentReplay.results.push({
        eventIndex: this.replayIndex,
        result,
        processedAt: Date.now(),
        processingTime: Date.now() - startTime
      });

      this.replayIndex++;

      return result;

    } catch (error) {
      console.error('❌ Replay error:', error);
      
      this.currentReplay.errors.push({
        eventIndex: this.replayIndex,
        error: error.message,
        timestamp: Date.now()
      });

      if (this.currentReplay.options.pauseOnError) {
        this.isReplaying = false;
        throw error;
      }

      this.replayIndex++;
      return { error: error.message };
    }
  }

  /**
   * Replay LLM output
   * @param {object} llmOutput - LLM output data
   * @returns {object} Replay result
   */
  async replayLLMOutput(llmOutput) {
    // Process LLM output through intent processor
    const result = await this.intentProcessor.processLLMOutput(llmOutput.output, llmOutput.context);
    
    // Record comparison if enabled
    if (this.currentReplay.options.recordComparison) {
      this.recordComparison('llm_output', llmOutput.originalResult, result);
    }

    return result;
  }

  /**
   * Replay intent processed event
   * @param {object} intentData - Intent data
   * @returns {object} Replay result
   */
  async replayIntentProcessed(intentData) {
    // Process intent
    const result = await this.intentProcessor.processIntent(intentData.intent, intentData.context);
    
    // Record comparison if enabled
    if (this.currentReplay.options.recordComparison) {
      this.recordComparison('intent_processed', intentData.originalResult, result);
    }

    return result;
  }

  /**
   * Replay game event
   * @param {object} gameEventData - Game event data
   * @returns {object} Replay result
   */
  async replayGameEvent(gameEventData) {
    // Emit game event
    this.io.emit('game_event', gameEventData.event);
    
    return { emitted: true, event: gameEventData.event };
  }

  /**
   * Record comparison between original and replay results
   * @param {string} type - Comparison type
   * @param {object} original - Original result
   * @param {object} replay - Replay result
   */
  recordComparison(type, original, replay) {
    const comparison = {
      type,
      timestamp: Date.now(),
      original,
      replay,
      differences: this.calculateDifferences(original, replay),
      similarity: this.calculateSimilarity(original, replay)
    };

    this.comparisonResults.push(comparison);

    // Keep results limited
    if (this.comparisonResults.length > 1000) {
      this.comparisonResults = this.comparisonResults.slice(-1000);
    }
  }

  /**
   * Calculate differences between original and replay
   * @param {object} original - Original result
   * @param {object} replay - Replay result
   * @returns {Array} Differences
   */
  calculateDifferences(original, replay) {
    const differences = [];
    
    // Simple field comparison
    const originalKeys = Object.keys(original);
    const replayKeys = Object.keys(replay);
    
    const allKeys = new Set([...originalKeys, ...replayKeys]);
    
    for (const key of allKeys) {
      const originalValue = original[key];
      const replayValue = replay[key];
      
      if (JSON.stringify(originalValue) !== JSON.stringify(replayValue)) {
        differences.push({
          key,
          original: originalValue,
          replay: replayValue,
          type: typeof originalValue !== typeof replayValue ? 'type_mismatch' : 'value_mismatch'
        });
      }
    }

    return differences;
  }

  /**
   * Calculate similarity score
   * @param {object} original - Original result
   * @param {object} replay - Replay result
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(original, replay) {
    const differences = this.calculateDifferences(original, replay);
    const totalKeys = new Set([...Object.keys(original), ...Object.keys(replay)]).size;
    
    return totalKeys > 0 ? (totalKeys - differences.length) / totalKeys : 1;
  }

  /**
   * Compare outputs
   * @param {object} baseline - Baseline results
   * @param {object} comparison - Comparison results
   * @returns {object} Comparison analysis
   */
  compareOutputs(baseline, comparison) {
    const analysis = {
      overallSimilarity: 0,
      intentSimilarity: 0,
      speechSimilarity: 0,
      differences: [],
      summary: {
        totalComparisons: 0,
        identical: 0,
        similar: 0,
        different: 0
      }
    };

    // Compare each result pair
    for (let i = 0; i < Math.min(baseline.length, comparison.length); i++) {
      const base = baseline[i];
      const comp = comparison[i];
      
      const similarity = this.calculateSimilarity(base, comp);
      const differences = this.calculateDifferences(base, comp);
      
      analysis.differences.push({
        index: i,
        similarity,
        differences
      });

      // Update summary
      analysis.summary.totalComparisons++;
      
      if (similarity === 1) {
        analysis.summary.identical++;
      } else if (similarity > 0.8) {
        analysis.summary.similar++;
      } else {
        analysis.summary.different++;
      }
    }

    // Calculate overall similarity
    analysis.overallSimilarity = analysis.summary.totalComparisons > 0 ? 
      (analysis.summary.identical + analysis.summary.similar) / analysis.summary.totalComparisons : 0;

    return analysis;
  }

  /**
   * Get simulation history
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Simulation history
   */
  getSimulationHistory(limit = 50) {
    return this.simulationHistory
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }

  /**
   * Get comparison results
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Comparison results
   */
  getComparisonResults(limit = 100) {
    return this.comparisonResults
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Export simulation data
   * @param {string} format - Export format
   * @returns {string} Exported data
   */
  exportSimulationData(format = 'json') {
    const data = {
      simulationHistory: this.simulationHistory,
      comparisonResults: this.comparisonResults,
      replayBuffer: this.replayBuffer,
      exportedAt: Date.now()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Generate simulation ID
   * @returns {string} Simulation ID
   */
  generateSimulationId() {
    return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate replay ID
   * @returns {string} Replay ID
   */
  generateReplayId() {
    return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get system statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      isSimulationMode: this.isSimulationMode,
      isReplaying: this.isReplaying,
      simulationHistory: this.simulationHistory.length,
      comparisonResults: this.comparisonResults.length,
      replayBufferSize: this.replayBuffer.length,
      currentSimulation: this.currentSimulation ? this.currentSimulation.id : null,
      currentReplay: this.currentReplay ? this.currentReplay.id : null
    };
  }

  /**
   * Reset simulation system
   */
  reset() {
    this.isSimulationMode = false;
    this.isReplaying = false;
    this.currentSimulation = null;
    this.currentReplay = null;
    this.replayRecording = null;
    this.simulationSnapshot = null;
    
    this.simulationHistory = [];
    this.replayBuffer = [];
    this.comparisonResults = [];
    
    console.log('🎮 Simulation & Replay System reset');
  }

  /**
   * Destroy simulation system
   */
  destroy() {
    this.reset();
    console.log('🎮 Simulation & Replay System destroyed');
  }
}

module.exports = SimulationReplaySystem;
