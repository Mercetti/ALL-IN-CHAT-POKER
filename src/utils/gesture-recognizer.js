/**
 * Gesture Recognizer
 * Touch gesture recognition system for mobile devices
 */

/* global window, console, CustomEvent */

class GestureRecognizer {
  constructor(options = {}) {
    this.options = {
      // Gesture thresholds
      swipeThreshold: options.swipeThreshold || 50,
      swipeVelocityThreshold: options.swipeVelocityThreshold || 0.3,
      tapThreshold: options.tapThreshold || 10,
      tapTimeout: options.tapTimeout || 300,
      doubleTapTimeout: options.doubleTapTimeout || 300,
      longPressThreshold: options.longPressThreshold || 500,
      pinchThreshold: options.pinchThreshold || 10,
      
      // Gesture recognition
      enableSwipe: options.enableSwipe !== false,
      enableTap: options.enableTap !== false,
      enableDoubleTap: options.enableDoubleTap !== false,
      enableLongPress: options.enableLongPress !== false,
      enablePinch: options.enablePinch !== false,
      enableRotate: options.enableRotate !== false,
      
      // Performance
      maxTouchPoints: options.maxTouchPoints || 10,
      throttleDelay: options.throttleDelay || 16,
      
      // Debugging
      enableLogging: options.enableLogging || false
    };
    
    this.gestures = new Map();
    this.activeTouches = new Map();
    this.gestureHistory = [];
    this.isTracking = false;
    
    this.bindEvents();
  }

  /**
   * Bind touch events
   */
  bindEvents() {
    if (typeof window !== 'undefined') {
      window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      window.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    }
  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    event.preventDefault();
    
    const timestamp = Date.now();
    const touches = Array.from(event.changedTouches);
    
    for (const touch of touches) {
      const touchData = {
        id: touch.identifier,
        startTime: timestamp,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        velocityX: 0,
        velocityY: 0,
        distance: 0,
        duration: 0
      };
      
      this.activeTouches.set(touch.identifier, touchData);
    }
    
    this.isTracking = true;
    
    if (this.options.enableLogging) {
      console.log('Touch start:', touches.length, 'touches');
    }
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    if (!this.isTracking) return;
    
    event.preventDefault();
    
    const timestamp = Date.now();
    const touches = Array.from(event.changedTouches);
    
    for (const touch of touches) {
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData) continue;
      
      const deltaX = touch.clientX - touchData.currentX;
      const deltaY = touch.clientY - touchData.currentY;
      const deltaTime = timestamp - touchData.lastTime || timestamp;
      
      // Update velocity
      touchData.velocityX = deltaX / deltaTime * 1000;
      touchData.velocityY = deltaY / deltaTime * 1000;
      
      // Update position
      touchData.currentX = touch.clientX;
      touchData.currentY = touch.clientY;
      touchData.lastTime = timestamp;
      
      // Update distance
      touchData.distance = Math.sqrt(
        Math.pow(touchData.currentX - touchData.startX, 2) +
        Math.pow(touchData.currentY - touchData.startY, 2)
      );
      
      // Update duration
      touchData.duration = timestamp - touchData.startTime;
    }
    
    // Check for pinch/rotate gestures
    if (this.activeTouches.size === 2) {
      this.checkPinchGesture();
      this.checkRotateGesture();
    }
    
    if (this.options.enableLogging) {
      console.log('Touch move:', touches.length, 'touches');
    }
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    if (!this.isTracking) return;
    
    event.preventDefault();
    
    const timestamp = Date.now();
    const touches = Array.from(event.changedTouches);
    
    for (const touch of touches) {
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData) continue;
      
      touchData.endTime = timestamp;
      touchData.endX = touch.clientX;
      touchData.endY = touch.clientY;
      touchData.duration = timestamp - touchData.startTime;
      
      // Recognize gestures
      this.recognizeGestures(touchData);
      
      this.activeTouches.delete(touch.identifier);
    }
    
    if (this.activeTouches.size === 0) {
      this.isTracking = false;
    }
    
    if (this.options.enableLogging) {
      console.log('Touch end:', touches.length, 'touches');
    }
  }

  /**
   * Handle touch cancel
   */
  handleTouchCancel(event) {
    event.preventDefault();
    
    const touches = Array.from(event.changedTouches);
    
    for (const touch of touches) {
      this.activeTouches.delete(touch.identifier);
    }
    
    if (this.activeTouches.size === 0) {
      this.isTracking = false;
    }
    
    if (this.options.enableLogging) {
      console.log('Touch cancel:', touches.length, 'touches');
    }
  }

  /**
   * Recognize gestures from touch data
   */
  recognizeGestures(touchData) {
    // Check for tap gestures
    if (this.options.enableTap) {
      this.checkTapGesture(touchData);
    }
    
    // Check for swipe gestures
    if (this.options.enableSwipe) {
      this.checkSwipeGesture(touchData);
    }
    
    // Check for long press
    if (this.options.enableLongPress) {
      this.checkLongPressGesture(touchData);
    }
  }

  /**
   * Check for tap gesture
   */
  checkTapGesture(touchData) {
    const distance = Math.sqrt(
      Math.pow(touchData.endX - touchData.startX, 2) +
      Math.pow(touchData.endY - touchData.startY, 2)
    );
    
    if (distance <= this.options.tapThreshold && 
        touchData.duration <= this.options.tapTimeout) {
      
      // Check for double tap
      if (this.options.enableDoubleTap) {
        const lastTap = this.gestureHistory
          .filter(g => g.type === 'tap')
          .pop();
        
        if (lastTap && 
            (Date.now() - lastTap.timestamp) <= this.options.doubleTapTimeout &&
            Math.abs(lastTap.x - touchData.startX) <= this.options.tapThreshold &&
            Math.abs(lastTap.y - touchData.startY) <= this.options.tapThreshold) {
          
          this.emitGesture('doubletap', {
            x: touchData.startX,
            y: touchData.startY,
            timestamp: Date.now()
          });
          
          // Remove the single tap from history
          const index = this.gestureHistory.lastIndexOf(lastTap);
          if (index > -1) {
            this.gestureHistory.splice(index, 1);
          }
          
          return;
        }
      }
      
      this.emitGesture('tap', {
        x: touchData.startX,
        y: touchData.startY,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check for swipe gesture
   */
  checkSwipeGesture(touchData) {
    const distance = Math.sqrt(
      Math.pow(touchData.endX - touchData.startX, 2) +
      Math.pow(touchData.endY - touchData.startY, 2)
    );
    
    const velocity = Math.sqrt(
      Math.pow(touchData.velocityX, 2) +
      Math.pow(touchData.velocityY, 2)
    );
    
    if (distance >= this.options.swipeThreshold && 
        velocity >= this.options.swipeVelocityThreshold) {
      
      const angle = Math.atan2(
        touchData.endY - touchData.startY,
        touchData.endX - touchData.startX
      ) * 180 / Math.PI;
      
      let direction;
      
      if (angle >= -45 && angle < 45) {
        direction = 'right';
      } else if (angle >= 45 && angle < 135) {
        direction = 'down';
      } else if (angle >= 135 || angle < -135) {
        direction = 'left';
      } else {
        direction = 'up';
      }
      
      this.emitGesture('swipe', {
        direction,
        distance,
        velocity,
        startX: touchData.startX,
        startY: touchData.startY,
        endX: touchData.endX,
        endY: touchData.endY,
        duration: touchData.duration,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check for long press gesture
   */
  checkLongPressGesture(touchData) {
    const distance = Math.sqrt(
      Math.pow(touchData.endX - touchData.startX, 2) +
      Math.pow(touchData.endY - touchData.startY, 2)
    );
    
    if (distance <= this.options.tapThreshold && 
        touchData.duration >= this.options.longPressThreshold) {
      
      this.emitGesture('longpress', {
        x: touchData.startX,
        y: touchData.startY,
        duration: touchData.duration,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check for pinch gesture
   */
  checkPinchGesture() {
    if (!this.options.enablePinch || this.activeTouches.size !== 2) return;
    
    const touches = Array.from(this.activeTouches.values());
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const currentDistance = Math.sqrt(
      Math.pow(touch2.currentX - touch1.currentX, 2) +
      Math.pow(touch2.currentY - touch1.currentY, 2)
    );
    
    const startDistance = Math.sqrt(
      Math.pow(touch2.startX - touch1.startX, 2) +
      Math.pow(touch2.startY - touch1.startY, 2)
    );
    
    const scale = currentDistance / startDistance;
    
    if (Math.abs(scale - 1) >= this.options.pinchThreshold / 100) {
      this.emitGesture('pinch', {
        scale,
        centerX: (touch1.currentX + touch2.currentX) / 2,
        centerY: (touch1.currentY + touch2.currentY) / 2,
        distance: currentDistance,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check for rotate gesture
   */
  checkRotateGesture() {
    if (!this.options.enableRotate || this.activeTouches.size !== 2) return;
    
    const touches = Array.from(this.activeTouches.values());
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const currentAngle = Math.atan2(
      touch2.currentY - touch1.currentY,
      touch2.currentX - touch1.currentX
    ) * 180 / Math.PI;
    
    const startAngle = Math.atan2(
      touch2.startY - touch1.startY,
      touch2.startX - touch1.startX
    ) * 180 / Math.PI;
    
    const rotation = currentAngle - startAngle;
    
    if (Math.abs(rotation) >= 5) { // 5 degrees threshold
      this.emitGesture('rotate', {
        rotation,
        centerX: (touch1.currentX + touch2.currentX) / 2,
        centerY: (touch1.currentY + touch2.currentY) / 2,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Emit gesture event
   */
  emitGesture(type, data) {
    const gesture = {
      type,
      data,
      timestamp: Date.now()
    };
    
    // Add to history
    this.gestureHistory.push(gesture);
    
    // Keep only last 100 gestures
    if (this.gestureHistory.length > 100) {
      this.gestureHistory = this.gestureHistory.slice(-100);
    }
    
    // Emit event
    if (this.onGesture) {
      this.onGesture(gesture);
    }
    
    // Dispatch custom event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gesture', {
        detail: gesture
      }));
    }
    
    if (this.options.enableLogging) {
      console.log('Gesture detected:', type, data);
    }
  }

  /**
   * Add gesture listener
   */
  onGesture(callback) {
    this.onGesture = callback;
  }

  /**
   * Remove gesture listener
   */
  offGesture() {
    this.onGesture = null;
  }

  /**
   * Get gesture history
   */
  getGestureHistory(type = null, limit = 50) {
    let history = this.gestureHistory;
    
    if (type) {
      history = history.filter(g => g.type === type);
    }
    
    return history.slice(-limit);
  }

  /**
   * Clear gesture history
   */
  clearHistory() {
    this.gestureHistory = [];
  }

  /**
   * Get active touches
   */
  getActiveTouches() {
    return Array.from(this.activeTouches.values());
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking() {
    return this.isTracking;
  }

  /**
   * Destroy gesture recognizer
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      window.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      window.removeEventListener('touchend', this.handleTouchEnd.bind(this));
      window.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }
    
    this.gestures.clear();
    this.activeTouches.clear();
    this.gestureHistory = [];
    this.isTracking = false;
    this.onGesture = null;
  }
}

export default GestureRecognizer;
