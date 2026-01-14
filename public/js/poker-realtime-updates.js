/**
 * Real-time WebSocket Updates for Poker Game
 * Provides live game state synchronization and instant updates
 */

class PokerRealtimeUpdates {
  constructor(options = {}) {
    this.options = {
      updateInterval: 1000, // 1 second
      maxRetries: 3,
      enableOptimisticUpdates: true,
      enableConflictResolution: true,
      debugMode: false,
      ...options
    };
    
    this.socket = null;
    this.isConnected = false;
    this.updateQueue = [];
    this.lastUpdateId = 0;
    this.pendingUpdates = new Map();
    this.subscribers = new Map();
    this.updateTimer = null;
    
    this.gameState = {
      players: new Map(),
      pot: 0,
      currentPhase: 'waiting',
      activePlayer: null,
      communityCards: [],
      deck: null,
      actions: []
    };
    
    this.init();
  }

  init() {
    // Setup WebSocket connection
    this.setupWebSocketConnection();
    
    // Setup update processing
    this.setupUpdateProcessing();
    
    // Setup conflict resolution
    this.setupConflictResolution();
    
    // Setup state synchronization
    this.setupStateSynchronization();
  }

  setupWebSocketConnection() {
    // Wait for socket to be available
    const checkSocket = () => {
      if (window.socket && window.socket.connected) {
        this.socket = window.socket;
        this.setupSocketListeners();
        this.isConnected = true;
        this.startRealtimeUpdates();
      } else if (window.socket) {
        // Socket exists but not connected
        this.socket = window.socket;
        this.setupSocketListeners();
      } else {
        // Socket not available yet, check again
        setTimeout(checkSocket, 100);
      }
    };
    
    checkSocket();
  }

  setupSocketListeners() {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.startRealtimeUpdates();
      this.notifySubscribers('connection', { connected: true });
    });
    
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.stopRealtimeUpdates();
      this.notifySubscribers('connection', { connected: false });
    });
    
    // Game state updates
    this.socket.on('gameStateUpdate', (data) => {
      this.handleGameStateUpdate(data);
    });
    
    // Player updates
    this.socket.on('playerUpdate', (data) => {
      this.handlePlayerUpdate(data);
    });
    
    // Action updates
    this.socket.on('actionUpdate', (data) => {
      this.handleActionUpdate(data);
    });
    
    // Pot updates
    this.socket.on('potUpdate', (data) => {
      this.handlePotUpdate(data);
    });
    
    // Phase updates
    this.socket.on('phaseUpdate', (data) => {
      this.handlePhaseUpdate(data);
    });
    
    // Card updates
    this.socket.on('cardUpdate', (data) => {
      this.handleCardUpdate(data);
    });
    
    // Batch updates
    this.socket.on('batchUpdate', (data) => {
      this.handleBatchUpdate(data);
    });
    
    // Conflict resolution
    this.socket.on('conflictResolution', (data) => {
      this.handleConflictResolution(data);
    });
  }

  setupUpdateProcessing() {
    // Process update queue
    setInterval(() => {
      this.processUpdateQueue();
    }, this.options.updateInterval);
  }

  setupConflictResolution() {
    // Handle update conflicts
    this.conflictResolver = {
      resolve: (localState, remoteState) => {
        // Simple conflict resolution: remote state wins
        return remoteState;
      },
      
      merge: (localState, remoteState) => {
        // Merge strategy for complex objects
        return { ...localState, ...remoteState };
      }
    };
  }

  setupStateSynchronization() {
    // Initial state sync
    this.socket?.on('connect', () => {
      this.requestFullStateSync();
    });
    
    // Periodic sync
    setInterval(() => {
      if (this.isConnected) {
        this.requestStateSync();
      }
    }, 30000); // Sync every 30 seconds
  }

  startRealtimeUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      if (this.isConnected) {
        this.requestUpdates();
      }
    }, this.options.updateInterval);
  }

  stopRealtimeUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  // Event handlers
  handleGameStateUpdate(data) {
    if (this.options.debugMode) {
      console.log('Game state update:', data);
    }
    
    const updateId = data.updateId || ++this.lastUpdateId;
    
    // Check for conflicts
    if (this.hasConflict(data)) {
      this.resolveConflict(data);
      return;
    }
    
    // Apply update
    this.applyGameStateUpdate(data);
    
    // Notify subscribers
    this.notifySubscribers('gameState', {
      type: 'gameState',
      data,
      updateId
    });
  }

  handlePlayerUpdate(data) {
    if (this.options.debugMode) {
      console.log('Player update:', data);
    }
    
    const { playerId, player, updateId } = data;
    
    // Update player in game state
    this.gameState.players.set(playerId, player);
    
    // Notify subscribers
    this.notifySubscribers('player', {
      type: 'player',
      playerId,
      player,
      updateId
    });
  }

  handleActionUpdate(data) {
    if (this.options.debugMode) {
      console.log('Action update:', data);
    }
    
    const { action, updateId } = data;
    
    // Add to actions history
    this.gameState.actions.push({
      ...action,
      timestamp: Date.now(),
      updateId
    });
    
    // Keep only last 50 actions
    if (this.gameState.actions.length > 50) {
      this.gameState.actions = this.gameState.actions.slice(-50);
    }
    
    // Notify subscribers
    this.notifySubscribers('action', {
      type: 'action',
      action,
      updateId
    });
  }

  handlePotUpdate(data) {
    if (this.options.debugMode) {
      console.log('Pot update:', data);
    }
    
    const { amount, updateId } = data;
    
    // Update pot
    this.gameState.pot = amount;
    
    // Notify subscribers
    this.notifySubscribers('pot', {
      type: 'pot',
      amount,
      updateId
    });
  }

  handlePhaseUpdate(data) {
    if (this.options.debugMode) {
      console.log('Phase update:', data);
    }
    
    const { phase, updateId } = data;
    
    // Update phase
    this.gameState.currentPhase = phase;
    
    // Notify subscribers
    this.notifySubscribers('phase', {
      type: 'phase',
      phase,
      updateId
    });
  }

  handleCardUpdate(data) {
    if (this.options.debugMode) {
      console.log('Card update:', data);
    }
    
    const { cards, updateId } = data;
    
    // Update community cards
    this.gameState.communityCards = cards;
    
    // Notify subscribers
    this.notifySubscribers('cards', {
      type: 'cards',
      cards,
      updateId
    });
  }

  handleBatchUpdate(data) {
    if (this.options.debugMode) {
      console.log('Batch update:', data);
    }
    
    const { updates, updateId } = data;
    
    // Process each update in batch
    updates.forEach(update => {
      this.processUpdate(update);
    });
    
    // Notify subscribers of batch completion
    this.notifySubscribers('batch', {
      type: 'batch',
      updates,
      updateId,
      count: updates.length
    });
  }

  handleConflictResolution(data) {
    if (this.options.debugMode) {
      console.log('Conflict resolution:', data);
    }
    
    const { conflictType, resolution, updateId } = data;
    
    // Apply resolution
    switch (conflictType) {
      case 'gameState':
        this.gameState = this.conflictResolver.merge(this.gameState, resolution);
        break;
      case 'player':
        this.gameState.players.set(resolution.playerId, resolution.player);
        break;
      default:
        console.warn('Unknown conflict type:', conflictType);
    }
    
    // Notify subscribers
    this.notifySubscribers('conflict', {
      type: 'conflict',
      conflictType,
      resolution,
      updateId
    });
  }

  // Update processing
  processUpdate(update) {
    switch (update.type) {
      case 'gameState':
        this.handleGameStateUpdate(update);
        break;
      case 'player':
        this.handlePlayerUpdate(update);
        break;
      case 'action':
        this.handleActionUpdate(update);
        break;
      case 'pot':
        this.handlePotUpdate(update);
        break;
      case 'phase':
        this.handlePhaseUpdate(update);
        break;
      case 'cards':
        this.handleCardUpdate(update);
        break;
      default:
        console.warn('Unknown update type:', update.type);
    }
  }

  processUpdateQueue() {
    if (this.updateQueue.length === 0) return;
    
    // Process updates in order
    const updates = [...this.updateQueue];
    this.updateQueue = [];
    
    updates.forEach(update => {
      this.processUpdate(update);
    });
  }

  // Conflict detection and resolution
  hasConflict(update) {
    switch (update.type) {
      case 'gameState':
        return this.hasGameStateConflict(update);
      case 'player':
        return this.hasPlayerConflict(update);
      default:
        return false;
    }
  }

  hasGameStateConflict(update) {
    // Check if update conflicts with local state
    // For now, assume no conflict detection
    return false;
  }

  hasPlayerConflict(update) {
    const localPlayer = this.gameState.players.get(update.playerId);
    if (!localPlayer) return false;
    
    // Check for version conflicts
    return localPlayer.version && update.player.version && 
           localPlayer.version > update.player.version;
  }

  resolveConflict(update) {
    // Request conflict resolution from server
    this.socket?.emit('requestConflictResolution', {
      type: update.type,
      localState: this.getLocalState(update.type),
      remoteState: update,
      updateId: update.updateId
    });
  }

  getLocalState(type) {
    switch (type) {
      case 'gameState':
        return this.gameState;
      case 'player':
        return Array.from(this.gameState.players.entries()).map(([id, player]) => ({ id, player }));
      default:
        return null;
    }
  }

  // State application
  applyGameStateUpdate(data) {
    // Update game state
    Object.assign(this.gameState, data);
    
    // Update players if provided
    if (data.players) {
      data.players.forEach(player => {
        this.gameState.players.set(player.id, player);
      });
    }
  }

  // WebSocket communication
  requestUpdates() {
    if (!this.isConnected) return;
    
    this.socket?.emit('requestUpdates', {
      lastUpdateId: this.lastUpdateId,
      timestamp: Date.now()
    });
  }

  requestFullStateSync() {
    if (!this.isConnected) return;
    
    this.socket?.emit('requestFullState', {
      timestamp: Date.now()
    });
  }

  requestStateSync() {
    if (!this.isConnected) return;
    
    this.socket?.emit('requestStateSync', {
      lastUpdateId: this.lastUpdateId,
      timestamp: Date.now()
    });
  }

  // Subscription management
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    
    this.subscribers.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event);
    if (!callbacks) return;
    
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in subscriber callback for ${event}:`, error);
      }
    });
  }

  // Optimistic updates
  performOptimisticUpdate(update) {
    if (!this.options.enableOptimisticUpdates) return;
    
    // Apply update immediately
    this.processUpdate(update);
    
    // Add to pending updates
    this.pendingUpdates.set(update.updateId, update);
    
    // Set timeout to remove pending update
    setTimeout(() => {
      this.pendingUpdates.delete(update.updateId);
    }, 5000);
  }

  // Public API
  getGameState() {
    return {
      ...this.gameState,
      players: Array.from(this.gameState.players.entries()).map(([id, player]) => ({ id, player }))
    };
  }

  getPlayer(playerId) {
    return this.gameState.players.get(playerId);
  }

  getPot() {
    return this.gameState.pot;
  }

  getCurrentPhase() {
    return this.gameState.currentPhase;
  }

  getCommunityCards() {
    return this.gameState.communityCards;
  }

  getActions(limit = 10) {
    return this.gameState.actions.slice(-limit);
  }

  isConnected() {
    return this.isConnected;
  }

  // Send actions
  sendAction(action) {
    if (!this.isConnected) {
      console.warn('Not connected, cannot send action');
      return false;
    }
    
    // Generate update ID
    const updateId = ++this.lastUpdateId;
    
    // Optimistic update
    this.performOptimisticUpdate({
      type: 'action',
      action: { ...action, updateId },
      updateId
    });
    
    // Send to server
    this.socket.emit('gameAction', {
      ...action,
      updateId,
      timestamp: Date.now()
    });
    
    return true;
  }

  // Utility methods
  formatGameState() {
    const state = this.getGameState();
    
    return {
      phase: state.currentPhase,
      pot: state.pot,
      playerCount: state.players.length,
      activePlayer: state.activePlayer,
      communityCards: state.communityCards.length,
      lastAction: state.actions[state.actions.length - 1]?.type || 'none',
      timestamp: Date.now()
    };
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      connected: this.isConnected,
      updateQueueSize: this.updateQueue.length,
      pendingUpdates: this.pendingUpdates.size,
      subscriberCount: Array.from(this.subscribers.values()).reduce((total, callbacks) => total + callbacks.length, 0),
      lastUpdateId: this.lastUpdateId,
      gameStateSize: JSON.stringify(this.gameState).length
    };
  }

  // Cleanup
  destroy() {
    this.stopRealtimeUpdates();
    
    // Clear subscribers
    this.subscribers.clear();
    
    // Clear pending updates
    this.pendingUpdates.clear();
    
    // Clear update queue
    this.updateQueue = [];
    
    // Reset state
    this.gameState = {
      players: new Map(),
      pot: 0,
      currentPhase: 'waiting',
      activePlayer: null,
      communityCards: [],
      deck: null,
      actions: []
    };
  }
}

// Create global instance
window.pokerRealtimeUpdates = new PokerRealtimeUpdates({
  updateInterval: 1000,
  maxRetries: 3,
  enableOptimisticUpdates: true,
  enableConflictResolution: true,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerRealtimeUpdates;
}
