/**
 * Enhanced WebSocket Error Handling for Poker Game
 * Provides robust connection management and recovery strategies
 */

class PokerWebSocketManager {
  constructor(options = {}) {
    this.options = {
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      reconnectBackoffMultiplier: 1.5,
      maxReconnectDelay: 30000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      enableAutoReconnect: true,
      enableHeartbeat: true,
      debugMode: false,
      ...options
    };
    
    this.socket = null;
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastConnected: null,
      lastError: null,
      connectionId: this.generateConnectionId()
    };
    
    this.eventHandlers = new Map();
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    
    this.init();
  }

  init() {
    // Setup global WebSocket error handling
    this.setupGlobalErrorHandling();
    
    // Enhanced Socket.IO configuration
    this.enhanceSocketIO();
    
    // Setup connection monitoring
    this.setupConnectionMonitoring();
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  setupGlobalErrorHandling() {
    // Override window.io to add error handling
    if (window.io) {
      const originalIO = window.io;
      
      window.io = function(...args) {
        const socket = originalIO.apply(this, args);
        
        // Add our error handling
        window.pokerWebSocketManager.enhanceSocket(socket);
        
        return socket;
      };
    }
  }

  enhanceSocketIO() {
    // Enhance existing Socket.IO instance if present
    if (window.socket) {
      this.enhanceSocket(window.socket);
    }
    
    // Monitor for new socket connections
    const checkInterval = setInterval(() => {
      if (window.socket && window.socket !== this.socket) {
        this.enhanceSocket(window.socket);
        clearInterval(checkInterval);
      }
    }, 1000);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  enhanceSocket(socket) {
    if (this.socket === socket) return; // Already enhanced
    
    this.socket = socket;
    this.setupSocketErrorHandling(socket);
    this.setupSocketReconnection(socket);
    this.setupSocketHeartbeat(socket);
    
    if (this.options.debugMode) {
      console.log('WebSocket enhanced with error handling');
    }
  }

  setupSocketErrorHandling(socket) {
    // Connection errors
    socket.on('connect_error', (error) => {
      this.handleConnectionError(error);
    });
    
    // Disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(reason);
    });
    
    // General errors
    socket.on('error', (error) => {
      this.handleSocketError(error);
    });
    
    // Connection timeout
    socket.on('connect_timeout', () => {
      this.handleConnectionTimeout();
    });
    
    // Reconnection attempts
    socket.on('reconnect_attempt', (attemptNumber) => {
      this.handleReconnectAttempt(attemptNumber);
    });
    
    // Reconnection failed
    socket.on('reconnect_failed', () => {
      this.handleReconnectFailed();
    });
    
    // Reconnection successful
    socket.on('reconnect', (attemptNumber) => {
      this.handleReconnectSuccess(attemptNumber);
    });
  }

  setupSocketReconnection(socket) {
    // Custom reconnection logic
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        this.connectionState.reconnectAttempts = 0;
      } else {
        // Network error or other - attempt reconnection
        if (this.options.enableAutoReconnect) {
          this.scheduleReconnect();
        }
      }
    });
  }

  setupSocketHeartbeat(socket) {
    if (!this.options.enableHeartbeat) return;
    
    // Start heartbeat when connected
    socket.on('connect', () => {
      this.startHeartbeat();
    });
    
    socket.on('disconnect', () => {
      this.stopHeartbeat();
    });
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing timer
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        // Send ping message
        this.socket.emit('ping', {
          timestamp: Date.now(),
          connectionId: this.connectionState.connectionId
        });
        
        // Wait for pong response
        const pongTimeout = setTimeout(() => {
          if (this.options.debugMode) {
            console.warn('Heartbeat timeout - connection may be lost');
          }
          this.handleHeartbeatTimeout();
        }, 5000);
        
        // Listen for pong response
        const oncePong = (data) => {
          clearTimeout(pongTimeout);
          this.socket.off('pong', oncePong);
          
          if (this.options.debugMode) {
            console.log('Heartbeat successful');
          }
        };
        
        this.socket.once('pong', oncePong);
      }
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  handleHeartbeatTimeout() {
    // Heartbeat failed - treat as disconnection
    if (this.socket) {
      this.socket.disconnect();
      this.handleDisconnection('heartbeat timeout');
    }
  }

  handleConnectionError(error) {
    this.connectionState.lastError = error;
    this.connectionState.isConnecting = false;
    
    if (this.options.debugMode) {
      console.error('WebSocket connection error:', error);
    }
    
    // Notify users
    this.notifyConnectionError(error);
    
    // Attempt reconnection
    if (this.options.enableAutoReconnect) {
      this.scheduleReconnect();
    }
  }

  handleDisconnection(reason) {
    this.connectionState.isConnected = false;
    this.connectionState.lastError = new Error(`Disconnected: ${reason}`);
    
    if (this.options.debugMode) {
      console.log('WebSocket disconnected:', reason);
    }
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Notify users
    this.notifyDisconnection(reason);
    
    // Handle reconnection based on reason
    if (this.options.enableAutoReconnect && this.shouldReconnect(reason)) {
      this.scheduleReconnect();
    }
  }

  handleSocketError(error) {
    this.connectionState.lastError = error;
    
    if (this.options.debugMode) {
      console.error('WebSocket error:', error);
    }
    
    // Check if it's a critical error
    if (this.isCriticalError(error)) {
      this.handleCriticalError(error);
    }
  }

  handleConnectionTimeout() {
    this.connectionState.lastError = new Error('Connection timeout');
    this.connectionState.isConnecting = false;
    
    if (this.options.debugMode) {
      console.warn('WebSocket connection timeout');
    }
    
    this.notifyConnectionTimeout();
    
    if (this.options.enableAutoReconnect) {
      this.scheduleReconnect();
    }
  }

  handleReconnectAttempt(attemptNumber) {
    this.connectionState.reconnectAttempts = attemptNumber;
    
    if (this.options.debugMode) {
      console.log(`Reconnection attempt ${attemptNumber}`);
    }
    
    this.notifyReconnectAttempt(attemptNumber);
  }

  handleReconnectFailed() {
    this.connectionState.reconnectAttempts = 0;
    
    if (this.options.debugMode) {
      console.error('Reconnection failed after all attempts');
    }
    
    this.notifyReconnectFailed();
  }

  handleReconnectSuccess(attemptNumber) {
    this.connectionState.isConnected = true;
    this.connectionState.lastConnected = new Date();
    this.connectionState.reconnectAttempts = 0;
    this.connectionState.lastError = null;
    
    if (this.options.debugMode) {
      console.log(`Reconnected successfully after ${attemptNumber} attempts`);
    }
    
    this.notifyReconnectSuccess(attemptNumber);
    
    // Restart heartbeat
    this.startHeartbeat();
  }

  handleCriticalError(error) {
    if (this.options.debugMode) {
      console.error('Critical WebSocket error:', error);
    }
    
    // Show critical error notification
    this.showCriticalErrorNotification(error);
    
    // Attempt recovery
    this.attemptErrorRecovery(error);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.connectionState.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.handleReconnectFailed();
      return;
    }
    
    const delay = this.calculateReconnectDelay();
    
    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
    
    if (this.options.debugMode) {
      console.log(`Scheduling reconnection in ${delay}ms`);
    }
  }

  calculateReconnectDelay() {
    const baseDelay = this.options.reconnectDelay;
    const multiplier = this.options.reconnectBackoffMultiplier;
    const maxDelay = this.options.maxReconnectDelay;
    
    const delay = baseDelay * Math.pow(multiplier, this.connectionState.reconnectAttempts);
    return Math.min(delay, maxDelay);
  }

  attemptReconnect() {
    if (this.socket) {
      this.connectionState.isConnecting = true;
      
      // Force reconnection
      this.socket.connect();
    }
  }

  shouldReconnect(reason) {
    // Don't reconnect for certain reasons
    const noReconnectReasons = [
      'io server disconnect',
      'client disconnect',
      'forced disconnect'
    ];
    
    return !noReconnectReasons.includes(reason);
  }

  isCriticalError(error) {
    // Define critical error patterns
    const criticalPatterns = [
      'authentication failed',
      'unauthorized',
      'forbidden',
      'invalid token',
      'session expired'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return criticalPatterns.some(pattern => errorMessage.includes(pattern));
  }

  attemptErrorRecovery(error) {
    // Try different recovery strategies based on error type
    if (error.message?.includes('authentication')) {
      this.attemptAuthRecovery();
    } else if (error.message?.includes('network')) {
      this.attemptNetworkRecovery();
    } else {
      this.attemptGeneralRecovery();
    }
  }

  attemptAuthRecovery() {
    if (this.options.debugMode) {
      console.log('Attempting authentication recovery');
    }
    
    // Clear auth tokens and force re-authentication
    if (window.authManager && window.authManager.clearTokens) {
      window.authManager.clearTokens();
    }
    
    // Show login prompt
    this.showAuthRecoveryPrompt();
  }

  attemptNetworkRecovery() {
    if (this.options.debugMode) {
      console.log('Attempting network recovery');
    }
    
    // Check network connectivity
    this.checkNetworkConnectivity()
      .then(isOnline => {
        if (isOnline) {
          // Network is available, try reconnecting
          this.scheduleReconnect();
        } else {
          // Network is down, wait for it to come back
          this.waitForNetwork();
        }
      });
  }

  attemptGeneralRecovery() {
    if (this.options.debugMode) {
      console.log('Attempting general recovery');
    }
    
    // Reset connection state
    this.resetConnectionState();
    
    // Try reconnecting with a fresh connection
    this.createFreshConnection();
  }

  checkNetworkConnectivity() {
    return fetch('/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
    .then(() => true)
    .catch(() => false);
  }

  waitForNetwork() {
    const checkInterval = setInterval(() => {
      this.checkNetworkConnectivity()
        .then(isOnline => {
          if (isOnline) {
            clearInterval(checkInterval);
            this.scheduleReconnect();
          }
        });
    }, 5000);
    
    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 300000);
  }

  resetConnectionState() {
    this.connectionState.reconnectAttempts = 0;
    this.connectionState.lastError = null;
    this.connectionState.isConnecting = false;
  }

  createFreshConnection() {
    // Disconnect existing socket
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Create new socket connection
    if (window.io && window.getSocketUrl) {
      this.socket = window.io(window.getSocketUrl(), {
        transports: ['websocket', 'polling'],
        timeout: this.options.connectionTimeout,
        reconnection: false, // We handle reconnection ourselves
      });
      
      this.enhanceSocket(this.socket);
    }
  }

  // Notification methods
  notifyConnectionError(error) {
    const message = `Connection error: ${error.message}`;
    this.showNotification(message, 'error');
    
    // Announce to screen readers
    this.announceToScreenReader(message);
  }

  notifyDisconnection(reason) {
    const message = `Disconnected: ${reason}`;
    this.showNotification(message, 'warning');
    
    this.announceToScreenReader(message);
  }

  notifyConnectionTimeout() {
    const message = 'Connection timeout - retrying...';
    this.showNotification(message, 'warning');
    
    this.announceToScreenReader(message);
  }

  notifyReconnectAttempt(attempt) {
    const message = `Reconnecting... (attempt ${attempt})`;
    this.showNotification(message, 'info');
    
    this.announceToScreenReader(message);
  }

  notifyReconnectFailed() {
    const message = 'Failed to reconnect. Please check your connection.';
    this.showNotification(message, 'error');
    
    this.announceToScreenReader(message);
  }

  notifyReconnectSuccess(attempt) {
    const message = `Reconnected successfully!`;
    this.showNotification(message, 'success');
    
    this.announceToScreenReader(message);
  }

  showNotification(message, type = 'info') {
    if (window.Toast) {
      switch (type) {
        case 'error':
          window.Toast.error(message);
          break;
        case 'warning':
          window.Toast.warning(message);
          break;
        case 'success':
          window.Toast.success(message);
          break;
        default:
          window.Toast.info(message);
      }
    }
  }

  announceToScreenReader(message) {
    if (window.pokerKeyboardNavigation) {
      window.pokerKeyboardNavigation.announce(message);
    } else if (window.accessibilityManager) {
      window.accessibilityManager.announce(message);
    }
  }

  showCriticalErrorNotification(error) {
    // Create critical error modal
    const modal = document.createElement('div');
    modal.className = 'critical-error-modal';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-labelledby', 'critical-error-title');
    modal.innerHTML = `
      <div class="critical-error-content">
        <h2 id="critical-error-title">Connection Error</h2>
        <p>A critical error occurred with the game connection.</p>
        <div class="error-details">
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="error-actions">
          <button class="retry-btn" onclick="window.pokerWebSocketManager.retryConnection()">
            Retry Connection
          </button>
          <button class="refresh-btn" onclick="window.location.reload()">
            Refresh Page
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles if needed
    this.addCriticalErrorStyles();
    
    // Focus management
    const retryBtn = modal.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.focus();
    }
  }

  addCriticalErrorStyles() {
    if (document.querySelector('#critical-error-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'critical-error-styles';
    style.textContent = `
      .critical-error-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .critical-error-content {
        background: linear-gradient(135deg, #2d1b69 0%, #0f3460 100%);
        border: 2px solid #e94560;
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: white;
      }
      
      .critical-error-content h2 {
        color: #e94560;
        margin: 0 0 1rem 0;
      }
      
      .error-details {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        text-align: left;
        font-size: 0.9rem;
      }
      
      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
      }
      
      .retry-btn,
      .refresh-btn {
        background: linear-gradient(135deg, #e94560 0%, #c23652 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .retry-btn:hover,
      .refresh-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(233, 69, 96, 0.3);
      }
      
      .refresh-btn {
        background: linear-gradient(135deg, #5f27cd 0%, #341f97 100%);
      }
    `;
    document.head.appendChild(style);
  }

  showAuthRecoveryPrompt() {
    // Show authentication recovery prompt
    if (window.authManager && window.authManager.showLoginPrompt) {
      window.authManager.showLoginPrompt();
    }
  }

  setupConnectionMonitoring() {
    // Monitor connection state changes
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000); // Check every 30 seconds
  }

  checkConnectionHealth() {
    if (!this.socket || !this.socket.connected) {
      return;
    }
    
    // Send health check
    this.socket.emit('health_check', {
      timestamp: Date.now(),
      connectionId: this.connectionState.connectionId
    });
  }

  setupEventHandlers() {
    // Custom event handlers
    this.eventHandlers.set('connectionStateChange', []);
    this.eventHandlers.set('error', []);
    this.eventHandlers.set('reconnect', []);
  }

  // Public API
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  getConnectionState() {
    return { ...this.connectionState };
  }

  isConnected() {
    return this.connectionState.isConnected && this.socket?.connected;
  }

  retryConnection() {
    // Remove critical error modal if present
    const modal = document.querySelector('.critical-error-modal');
    if (modal) {
      modal.remove();
    }
    
    // Reset connection state and retry
    this.resetConnectionState();
    this.attemptReconnect();
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  generateConnectionId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Create global instance
window.pokerWebSocketManager = new PokerWebSocketManager({
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  reconnectBackoffMultiplier: 1.5,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  enableAutoReconnect: true,
  enableHeartbeat: true,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerWebSocketManager;
}
