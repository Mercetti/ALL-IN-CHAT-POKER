/**
 * Standardized Event Handler System
 * Provides consistent event handling across the application
 */

class StandardizedEventHandler {
  constructor(options = {}) {
    this.options = {
      enableDelegation: true,
      enableThrottling: false,
      throttleDelay: 100,
      enableDebouncing: false,
      debounceDelay: 300,
      debugMode: false,
      ...options
    };
    
    this.eventListeners = new Map();
    this.delegatedListeners = new Map();
    this.throttledHandlers = new Map();
    this.debouncedHandlers = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.isInitialized = true;
  }

  /**
   * Add event listener with consistent API
   */
  addEventListener(element, eventType, handler, options = {}) {
    if (!element || !eventType || typeof handler !== 'function') {
      console.warn('Invalid parameters for addEventListener');
      return null;
    }

    const listenerId = this.generateListenerId();
    const wrappedHandler = this.wrapHandler(handler, options);
    
    // Add actual event listener
    element.addEventListener(eventType, wrappedHandler, options);
    
    // Store reference for removal
    const listenerInfo = {
      id: listenerId,
      element,
      eventType,
      handler: wrappedHandler,
      originalHandler: handler,
      options
    };
    
    this.eventListeners.set(listenerId, listenerInfo);
    
    if (this.options.debugMode) {
      console.log(`Added event listener: ${listenerId} (${eventType})`);
    }
    
    return listenerId;
  }

  /**
   * Remove event listener by ID
   */
  removeEventListener(listenerId) {
    const listenerInfo = this.eventListeners.get(listenerId);
    
    if (!listenerInfo) {
      console.warn(`Event listener not found: ${listenerId}`);
      return false;
    }
    
    const { element, eventType, handler } = listenerInfo;
    element.removeEventListener(eventType, handler);
    this.eventListeners.delete(listenerId);
    
    if (this.options.debugMode) {
      console.log(`Removed event listener: ${listenerId}`);
    }
    
    return true;
  }

  /**
   * Add delegated event listener
   */
  addDelegatedEventListener(parentElement, eventType, selector, handler, options = {}) {
    if (!this.options.enableDelegation) {
      return this.addEventListener(parentElement, eventType, handler, options);
    }

    const delegationId = this.generateListenerId();
    const delegatedHandler = (event) => {
      const target = event.target.closest(selector);
      if (target && parentElement.contains(target)) {
        event.delegatedTarget = target;
        handler.call(target, event);
      }
    };
    
    const wrappedHandler = this.wrapHandler(delegatedHandler, options);
    parentElement.addEventListener(eventType, wrappedHandler, options);
    
    const delegationInfo = {
      id: delegationId,
      element: parentElement,
      eventType,
      selector,
      handler: wrappedHandler,
      originalHandler: handler,
      options
    };
    
    this.delegatedListeners.set(delegationId, delegationInfo);
    
    if (this.options.debugMode) {
      console.log(`Added delegated event listener: ${delegationId} (${eventType} -> ${selector})`);
    }
    
    return delegationId;
  }

  /**
   * Remove delegated event listener
   */
  removeDelegatedEventListener(delegationId) {
    const delegationInfo = this.delegatedListeners.get(delegationId);
    
    if (!delegationInfo) {
      console.warn(`Delegated event listener not found: ${delegationId}`);
      return false;
    }
    
    const { element, eventType, handler } = delegationInfo;
    element.removeEventListener(eventType, handler);
    this.delegatedListeners.delete(delegationId);
    
    if (this.options.debugMode) {
      console.log(`Removed delegated event listener: ${delegationId}`);
    }
    
    return true;
  }

  /**
   * Wrap handler with additional functionality
   */
  wrapHandler(handler, options = {}) {
    let wrappedHandler = handler;
    
    // Add throttling
    if (options.throttle || this.options.enableThrottling) {
      wrappedHandler = this.throttle(wrappedHandler, options.throttleDelay || this.options.throttleDelay);
    }
    
    // Add debouncing
    if (options.debounce || this.options.enableDebouncing) {
      wrappedHandler = this.debounce(wrappedHandler, options.debounceDelay || this.options.debounceDelay);
    }
    
    // Add error handling
    wrappedHandler = this.addErrorHandling(wrappedHandler, options);
    
    // Add debugging
    if (options.debug || this.options.debugMode) {
      wrappedHandler = this.addDebugging(wrappedHandler, options);
    }
    
    return wrappedHandler;
  }

  /**
   * Throttle function
   */
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Debounce function
   */
  debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Add error handling to handler
   */
  addErrorHandling(handler, options) {
    return function (...args) {
      try {
        return handler.apply(this, args);
      } catch (error) {
        console.error('Event handler error:', error);
        
        if (options.onError && typeof options.onError === 'function') {
          options.onError(error, args);
        }
        
        // Prevent error from propagating
        if (options.preventPropagate !== false) {
          return false;
        }
      }
    };
  }

  /**
   * Add debugging to handler
   */
  addDebugging(handler, options) {
    return function (...args) {
      const startTime = performance.now();
      const eventType = args[0]?.type || 'unknown';
      
      console.log(`Event triggered: ${eventType}`, {
        target: args[0]?.target,
        timestamp: Date.now(),
        args: args
      });
      
      const result = handler.apply(this, args);
      
      const endTime = performance.now();
      console.log(`Event handled: ${eventType} (${(endTime - startTime).toFixed(2)}ms)`);
      
      return result;
    };
  }

  /**
   * Generate unique listener ID
   */
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all event listeners
   */
  getEventListeners() {
    return Array.from(this.eventListeners.values());
  }

  /**
   * Get all delegated listeners
   */
  getDelegatedListeners() {
    return Array.from(this.delegatedListeners.values());
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners() {
    this.eventListeners.forEach((listenerInfo, id) => {
      this.removeEventListener(id);
    });
    
    this.delegatedListeners.forEach((delegationInfo, id) => {
      this.removeDelegatedEventListener(id);
    });
    
    if (this.options.debugMode) {
      console.log('Removed all event listeners');
    }
  }

  /**
   * Add click handler with standard options
   */
  addClickHandler(element, handler, options = {}) {
    return this.addEventListener(element, 'click', handler, {
      preventDefault: options.preventDefault !== false,
      stopPropagation: options.stopPropagation !== false,
      ...options
    });
  }

  /**
   * Add key handler with standard options
   */
  addKeyHandler(element, handler, options = {}) {
    return this.addEventListener(element, 'keydown', handler, {
      ...options
    });
  }

  /**
   * Add form submit handler
   */
  addSubmitHandler(form, handler, options = {}) {
    return this.addEventListener(form, 'submit', (event) => {
      event.preventDefault();
      handler(event);
    }, options);
  }

  /**
   * Add scroll handler with throttling
   */
  addScrollHandler(element, handler, options = {}) {
    return this.addEventListener(element, 'scroll', handler, {
      throttle: true,
      throttleDelay: options.throttleDelay || 100,
      ...options
    });
  }

  /**
   * Add resize handler with throttling
   */
  addResizeHandler(element, handler, options = {}) {
    return this.addEventListener(element, 'resize', handler, {
      throttle: true,
      throttleDelay: options.throttleDelay || 100,
      ...options
    });
  }

  /**
   * Add input handler with debouncing
   */
  addInputHandler(element, handler, options = {}) {
    return this.addEventListener(element, 'input', handler, {
      debounce: true,
      debounceDelay: options.debounceDelay || 300,
      ...options
    });
  }

  /**
   * Add hover handlers
   */
  addHoverHandlers(element, enterHandler, leaveHandler, options = {}) {
    const enterId = this.addEventListener(element, 'mouseenter', enterHandler, options);
    const leaveId = this.addEventListener(element, 'mouseleave', leaveHandler, options);
    
    return { enterId, leaveId };
  }

  /**
   * Add focus handlers
   */
  addFocusHandlers(element, focusHandler, blurHandler, options = {}) {
    const focusId = this.addEventListener(element, 'focus', focusHandler, options);
    const blurId = this.addEventListener(element, 'blur', blurHandler, options);
    
    return { focusId, blurId };
  }

  /**
   * Add touch handlers
   */
  addTouchHandlers(element, startHandler, moveHandler, endHandler, options = {}) {
    const handlers = {};
    
    if (startHandler) {
      handlers.startId = this.addEventListener(element, 'touchstart', startHandler, options);
    }
    
    if (moveHandler) {
      handlers.moveId = this.addEventListener(element, 'touchmove', moveHandler, options);
    }
    
    if (endHandler) {
      handlers.endId = this.addEventListener(element, 'touchend', endHandler, options);
    }
    
    return handlers;
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.removeAllEventListeners();
    this.eventListeners.clear();
    this.delegatedListeners.clear();
    this.throttledHandlers.clear();
    this.debouncedHandlers.clear();
  }
}

// Create global instance
window.standardizedEventHandler = new StandardizedEventHandler({
  enableDelegation: true,
  enableThrottling: false,
  enableDebouncing: false,
  debugMode: false
});

// Global convenience methods
window.addEventListener = function(element, eventType, handler, options) {
  return window.standardizedEventHandler.addEventListener(element, eventType, handler, options);
};

window.removeEventById = function(listenerId) {
  return window.standardizedEventHandler.removeEventListener(listenerId);
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StandardizedEventHandler;
}
