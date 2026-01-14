/**
 * Error Boundary for Poker Game Overlay
 * Prevents crashes during live gameplay and provides recovery options
 */

class OverlayErrorBoundary {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      showUserNotifications: true,
      logToConsole: true,
      fallbackUI: true,
      ...options
    };
    
    this.retryCount = 0;
    this.isInitialized = false;
    this.lastError = null;
    this.errorHistory = [];
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Global error handlers
    this.setupGlobalErrorHandlers();
    
    // WebSocket error handling
    this.setupWebSocketErrorHandling();
    
    // Component error handling
    this.setupComponentErrorHandling();
    
    this.isInitialized = true;
  }

  setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'JavaScript Error'
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        error: event.reason,
        message: event.reason?.message || 'Unhandled Promise Rejection',
        type: 'Promise Rejection'
      });
    });
  }

  setupWebSocketErrorHandling() {
    // Enhanced WebSocket error handling
    if (window.io) {
      const originalSocket = window.io;
      
      window.io = function(...args) {
        const socket = originalSocket.apply(this, args);
        
        socket.on('connect_error', (error) => {
          this.handleError({
            error,
            message: 'WebSocket connection failed',
            type: 'WebSocket Error',
            critical: true
          });
        });
        
        socket.on('disconnect', (reason) => {
          if (reason === 'io server disconnect') {
            this.handleError({
              error: new Error('Server disconnected'),
              message: 'Lost connection to game server',
              type: 'WebSocket Disconnect',
              critical: true
            });
          }
        });
        
        socket.on('error', (error) => {
          this.handleError({
            error,
            message: 'WebSocket error occurred',
            type: 'WebSocket Error'
          });
        });
        
        return socket;
      };
    }
  }

  setupComponentErrorHandling() {
    // Monitor overlay components for errors
    const criticalComponents = [
      'overlay-state',
      'overlay-render', 
      'overlay-connection',
      'animation-manager',
      'loading-manager'
    ];
    
    criticalComponents.forEach(componentName => {
      this.monitorComponent(componentName);
    });
  }

  monitorComponent(componentName) {
    // Check if component exists and monitor for errors
    const checkInterval = setInterval(() => {
      try {
        if (window[componentName]) {
          clearInterval(checkInterval);
          
          // Wrap component methods with error handling
          this.wrapComponentMethods(window[componentName], componentName);
        }
      } catch (error) {
        this.handleError({
          error,
          message: `Error in component ${componentName}`,
          type: 'Component Error',
          component: componentName
        });
      }
    }, 1000);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  wrapComponentMethods(component, componentName) {
    Object.getOwnPropertyNames(component).forEach(methodName => {
      const method = component[methodName];
      
      if (typeof method === 'function' && methodName !== 'constructor') {
        const originalMethod = method;
        
        component[methodName] = function(...args) {
          try {
            return originalMethod.apply(this, args);
          } catch (error) {
            window.overlayErrorBoundary.handleError({
              error,
              message: `Error in ${componentName}.${methodName}`,
              type: 'Component Method Error',
              component: componentName,
              method: methodName
            });
            
            // Return safe default
            return null;
          }
        };
      }
    });
  }

  handleError(errorInfo) {
    // Add timestamp and metadata
    const enhancedError = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      gamePhase: window.overlayState?.currentPhase || 'unknown',
      retryCount: this.retryCount
    };
    
    // Store error
    this.lastError = enhancedError;
    this.errorHistory.push(enhancedError);
    
    // Keep only last 10 errors
    if (this.errorHistory.length > 10) {
      this.errorHistory = this.errorHistory.slice(-10);
    }
    
    // Log error
    if (this.options.logToConsole) {
      console.error('Overlay Error Boundary:', enhancedError);
    }
    
    // Handle critical errors differently
    if (enhancedError.critical) {
      this.handleCriticalError(enhancedError);
    } else {
      this.handleNonCriticalError(enhancedError);
    }
    
    // Show user notification
    if (this.options.showUserNotifications) {
      this.showUserNotification(enhancedError);
    }
  }

  handleCriticalError(errorInfo) {
    // Attempt recovery for critical errors
    if (this.retryCount < this.options.maxRetries) {
      this.attemptRecovery(errorInfo);
    } else {
      // Max retries reached, show fallback UI
      this.showFallbackUI(errorInfo);
    }
  }

  handleNonCriticalError(errorInfo) {
    // Log and continue for non-critical errors
    if (window.Toast) {
      Toast.warning('Game experience may be affected. Attempting to recover...');
    }
  }

  attemptRecovery(errorInfo) {
    this.retryCount++;
    
    console.log(`Attempting recovery ${this.retryCount}/${this.options.maxRetries}`);
    
    // Show recovery message
    if (window.Toast) {
      Toast.info(`Recovering from error... Attempt ${this.retryCount}`);
    }
    
    // Recovery strategies based on error type
    setTimeout(() => {
      switch (errorInfo.type) {
        case 'WebSocket Error':
        case 'WebSocket Disconnect':
          this.recoverWebSocket();
          break;
          
        case 'Component Error':
        case 'Component Method Error':
          this.recoverComponent(errorInfo.component);
          break;
          
        default:
          this.generalRecovery();
      }
    }, this.options.retryDelay);
  }

  recoverWebSocket() {
    // Attempt to reconnect WebSocket
    if (window.socket) {
      try {
        window.socket.connect();
      } catch (error) {
        console.error('Failed to reconnect WebSocket:', error);
      }
    }
  }

  recoverComponent(componentName) {
    // Attempt to reinitialize component
    if (window[componentName] && typeof window[componentName].init === 'function') {
      try {
        window[componentName].init();
      } catch (error) {
        console.error(`Failed to recover component ${componentName}:`, error);
      }
    }
  }

  generalRecovery() {
    // General recovery strategy
    try {
      // Refresh overlay state
      if (window.overlayState && typeof window.overlayState.reset === 'function') {
        window.overlayState.reset();
      }
      
      // Reinitialize critical systems
      if (window.updateUI) {
        window.updateUI();
      }
    } catch (error) {
      console.error('General recovery failed:', error);
    }
  }

  showUserNotification(errorInfo) {
    const message = this.getUserFriendlyMessage(errorInfo);
    
    if (window.Toast) {
      if (errorInfo.critical) {
        Toast.error(message);
      } else {
        Toast.warning(message);
      }
    }
  }

  getUserFriendlyMessage(errorInfo) {
    const messages = {
      'WebSocket Error': 'Connection to game server lost. Attempting to reconnect...',
      'WebSocket Disconnect': 'Disconnected from game server. Reconnecting...',
      'Component Error': 'Game component error. Attempting to recover...',
      'JavaScript Error': 'Game encountered an error. Attempting to recover...',
      'Promise Rejection': 'Game operation failed. Attempting to recover...'
    };
    
    return messages[errorInfo.type] || 'Game encountered an issue. Attempting to recover...';
  }

  showFallbackUI(errorInfo) {
    if (!this.options.fallbackUI) return;
    
    // Create fallback UI
    const fallback = document.createElement('div');
    fallback.className = 'overlay-error-fallback';
    fallback.innerHTML = `
      <div class="overlay-error-content">
        <div class="error-icon">🎰</div>
        <h2>Game Overlay Error</h2>
        <p>The poker game overlay encountered a critical error and needs to restart.</p>
        <div class="error-actions">
          <button class="error-restart-btn" onclick="window.location.reload()">
            🔄 Restart Overlay
          </button>
          <button class="error-report-btn" onclick="window.overlayErrorBoundary.reportError()">
            📝 Report Issue
          </button>
        </div>
        <div class="error-details">
          <p><strong>Error:</strong> ${errorInfo.message}</p>
          <p><strong>Time:</strong> ${new Date(errorInfo.timestamp).toLocaleString()}</p>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(fallback);
    
    // Add styles if not present
    this.addFallbackStyles();
    
    // Show with animation
    requestAnimationFrame(() => {
      fallback.classList.add('overlay-error-fallback--visible');
    });
  }

  addFallbackStyles() {
    if (document.querySelector('#overlay-error-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'overlay-error-styles';
    style.textContent = `
      .overlay-error-fallback {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .overlay-error-fallback--visible {
        opacity: 1;
      }
      
      .overlay-error-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #e94560;
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: #fff;
        box-shadow: 0 20px 40px rgba(233, 69, 96, 0.3);
      }
      
      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        animation: error-pulse 2s ease-in-out infinite;
      }
      
      @keyframes error-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      .overlay-error-content h2 {
        margin: 0 0 1rem 0;
        color: #e94560;
        font-size: 1.5rem;
      }
      
      .overlay-error-content p {
        margin: 0 0 1.5rem 0;
        color: #b8bcc8;
        line-height: 1.5;
      }
      
      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 1.5rem;
      }
      
      .error-restart-btn,
      .error-report-btn {
        background: linear-gradient(135deg, #e94560 0%, #c23652 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .error-restart-btn:hover,
      .error-report-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(233, 69, 96, 0.4);
      }
      
      .error-report-btn {
        background: linear-gradient(135deg, #5f27cd 0%, #341f97 100%);
      }
      
      .error-details {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 1rem;
        text-align: left;
        font-size: 0.8rem;
        color: #8892b0;
      }
      
      .error-details strong {
        color: #ccd6f6;
      }
    `;
    
    document.head.appendChild(style);
  }

  reportError() {
    if (this.lastError) {
      const errorDetails = JSON.stringify(this.lastError, null, 2);
      const subject = encodeURIComponent('Poker Game Overlay Error Report');
      const body = encodeURIComponent(`Error Details:\n\n${errorDetails}\n\nPlease describe what happened:\n`);
      window.open(`mailto:support@allinchatpoker.com?subject=${subject}&body=${body}`);
    }
  }

  // Public API
  getErrorHistory() {
    return this.errorHistory;
  }

  getLastError() {
    return this.lastError;
  }

  clearErrors() {
    this.errorHistory = [];
    this.lastError = null;
    this.retryCount = 0;
  }

  manualRetry() {
    this.retryCount = 0;
    if (this.lastError) {
      this.attemptRecovery(this.lastError);
    }
  }
}

// Create global instance
window.overlayErrorBoundary = new OverlayErrorBoundary({
  maxRetries: 3,
  retryDelay: 1000,
  showUserNotifications: true,
  logToConsole: true,
  fallbackUI: true
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OverlayErrorBoundary;
}
