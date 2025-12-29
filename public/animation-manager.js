/**
 * Consolidated animation manager for overlay.js
 * Centralizes all animation loops and timers for better performance
 */

class AnimationManager {
  constructor() {
    this.animations = new Map(); // animationId -> animation data
    this.timers = new Map(); // timerId -> timer data
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.frameCallbacks = new Set(); // callbacks for each frame
  }

  /**
   * Start the main animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.step();
  }

  /**
   * Stop the main animation loop
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Main animation loop step
   */
  step() {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Process all animations
    for (const [id, animation] of this.animations.entries()) {
      if (animation.active) {
        this.updateAnimation(animation, deltaTime);
      }
    }

    // Process frame callbacks
    for (const callback of this.frameCallbacks) {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('Animation frame callback error:', error);
      }
    }

    // Continue the loop if there are active animations or callbacks
    if (this.hasActiveAnimations() || this.frameCallbacks.size > 0) {
      requestAnimationFrame(() => this.step());
    } else {
      this.isRunning = false;
    }
  }

  /**
   * Update a specific animation
   * @param {Object} animation - Animation data
   * @param {number} deltaTime - Time since last frame
   */
  updateAnimation(animation, deltaTime) {
    animation.elapsed += deltaTime;

    switch (animation.type) {
      case 'flip':
        this.updateFlipAnimation(animation, deltaTime);
        break;
      case 'deal':
        this.updateDealAnimation(animation, deltaTime);
        break;
      case 'win':
        this.updateWinAnimation(animation, deltaTime);
        break;
      case 'countdown':
        this.updateCountdownAnimation(animation, deltaTime);
        break;
      default:
        console.warn(`Unknown animation type: ${animation.type}`);
    }
  }

  /**
   * Update flip card animation
   * @param {Object} animation - Animation data
   * @param {number} deltaTime - Time since last frame
   */
  updateFlipAnimation(animation, deltaTime) {
    const { duration, onUpdate, onComplete } = animation;
    const progress = Math.min(animation.elapsed / duration, 1);
    
    if (onUpdate) onUpdate(progress);
    
    if (progress >= 1) {
      animation.active = false;
      this.animations.delete(animation.id);
      if (onComplete) onComplete();
    }
  }

  /**
   * Update deal card animation
   * @param {Object} animation - Animation data
   * @param {number} deltaTime - Time since last frame
   */
  updateDealAnimation(animation, deltaTime) {
    const { duration, onUpdate, onComplete } = animation;
    const progress = Math.min(animation.elapsed / duration, 1);
    
    if (onUpdate) onUpdate(progress);
    
    if (progress >= 1) {
      animation.active = false;
      this.animations.delete(animation.id);
      if (onComplete) onComplete();
    }
  }

  /**
   * Update win animation
   * @param {Object} animation - Animation data
   * @param {number} deltaTime - Time since last frame
   */
  updateWinAnimation(animation, deltaTime) {
    const { fps, totalFrames, frameDelay, onFrame, onComplete } = animation;
    
    const frameIndex = Math.floor(animation.elapsed / frameDelay);
    
    if (frameIndex < totalFrames) {
      if (onFrame) onFrame(frameIndex);
    } else {
      animation.active = false;
      this.animations.delete(animation.id);
      if (onComplete) onComplete();
    }
  }

  /**
   * Update countdown animation
   * @param {Object} animation - Animation data
   * @param {number} deltaTime - Time since last frame
   */
  updateCountdownAnimation(animation, deltaTime) {
    const { endTime, onUpdate, onComplete } = animation;
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    
    if (onUpdate) onUpdate(remaining);
    
    if (remaining <= 0) {
      animation.active = false;
      this.animations.delete(animation.id);
      if (onComplete) onComplete();
    }
  }

  /**
   * Add a flip animation
   * @param {string} id - Animation ID
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  addFlipAnimation(id, options = {}) {
    const animation = {
      id,
      type: 'flip',
      active: true,
      elapsed: 0,
      duration: options.duration || 600,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete
    };
    
    this.animations.set(id, animation);
    this.start();
    return id;
  }

  /**
   * Add a deal animation
   * @param {string} id - Animation ID
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  addDealAnimation(id, options = {}) {
    const animation = {
      id,
      type: 'deal',
      active: true,
      elapsed: 0,
      duration: options.duration || 400,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete
    };
    
    this.animations.set(id, animation);
    this.start();
    return id;
  }

  /**
   * Add a win animation
   * @param {string} id - Animation ID
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  addWinAnimation(id, options = {}) {
    const animation = {
      id,
      type: 'win',
      active: true,
      elapsed: 0,
      fps: options.fps || 18,
      totalFrames: options.totalFrames || 30,
      frameDelay: 1000 / (options.fps || 18),
      onFrame: options.onFrame,
      onComplete: options.onComplete
    };
    
    this.animations.set(id, animation);
    this.start();
    return id;
  }

  /**
   * Add a countdown timer
   * @param {string} id - Timer ID
   * @param {Object} options - Timer options
   * @returns {string} - Timer ID
   */
  addCountdown(id, options = {}) {
    const animation = {
      id,
      type: 'countdown',
      active: true,
      elapsed: 0,
      endTime: options.endTime || Date.now() + (options.duration || 1000),
      onUpdate: options.onUpdate,
      onComplete: options.onComplete
    };
    
    this.animations.set(id, animation);
    this.start();
    return id;
  }

  /**
   * Remove an animation
   * @param {string} id - Animation ID
   */
  removeAnimation(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.active = false;
      this.animations.delete(id);
    }
  }

  /**
   * Add a frame callback (called every frame)
   * @param {Function} callback - Callback function
   * @returns {Function} - Remove function
   */
  addFrameCallback(callback) {
    this.frameCallbacks.add(callback);
    this.start();
    
    // Return function to remove the callback
    return () => {
      this.frameCallbacks.delete(callback);
      if (this.frameCallbacks.size === 0 && !this.hasActiveAnimations()) {
        this.stop();
      }
    };
  }

  /**
   * Check if there are active animations
   * @returns {boolean} - True if there are active animations
   */
  hasActiveAnimations() {
    for (const animation of this.animations.values()) {
      if (animation.active) return true;
    }
    return false;
  }

  /**
   * Get animation statistics
   * @returns {Object} - Animation stats
   */
  getStats() {
    const activeCount = Array.from(this.animations.values()).filter(a => a.active).length;
    const typeCounts = {};
    
    for (const animation of this.animations.values()) {
      typeCounts[animation.type] = (typeCounts[animation.type] || 0) + 1;
    }
    
    return {
      totalAnimations: this.animations.size,
      activeAnimations: activeCount,
      frameCallbacks: this.frameCallbacks.size,
      isRunning: this.isRunning,
      typeCounts
    };
  }

  /**
   * Clear all animations
   */
  clear() {
    this.animations.clear();
    this.frameCallbacks.clear();
    this.stop();
  }
}

// Timer manager for interval-based timers
class TimerManager {
  constructor() {
    this.timers = new Map(); // timerId -> timer data
    this.nextId = 1;
  }

  /**
   * Set a timer
   * @param {Function} callback - Callback function
   * @param {number} interval - Interval in milliseconds
   * @returns {number} - Timer ID
   */
  setInterval(callback, interval) {
    const id = this.nextId++;
    const timerData = {
      id,
      callback,
      interval,
      lastRun: Date.now(),
      active: true
    };
    
    this.timers.set(id, timerData);
    this.start();
    return id;
  }

  /**
   * Clear a timer
   * @param {number} id - Timer ID
   */
  clearInterval(id) {
    const timer = this.timers.get(id);
    if (timer) {
      timer.active = false;
      this.timers.delete(id);
    }
  }

  /**
   * Start the timer manager
   */
  start() {
    if (this.timerRunning) return;
    this.timerRunning = true;
    this.step();
  }

  /**
   * Timer manager step
   */
  step() {
    if (!this.timerRunning || this.timers.size === 0) {
      this.timerRunning = false;
      return;
    }

    const now = Date.now();
    const timersToRun = [];

    for (const timer of this.timers.values()) {
      if (timer.active && (now - timer.lastRun) >= timer.interval) {
        timersToRun.push(timer);
        timer.lastRun = now;
      }
    }

    // Run timers outside of iteration to avoid modification issues
    for (const timer of timersToRun) {
      try {
        timer.callback();
      } catch (error) {
        console.error('Timer callback error:', error);
      }
    }

    // Schedule next step
    setTimeout(() => this.step(), 100); // Check every 100ms
  }

  /**
   * Clear all timers
   */
  clear() {
    this.timers.clear();
    this.timerRunning = false;
  }
}

// Create global instances
const animationManager = new AnimationManager();
const timerManager = new TimerManager();

// Export for use in overlay.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationManager, TimerManager, animationManager, timerManager };
} else {
  window.AnimationManager = AnimationManager;
  window.TimerManager = TimerManager;
  window.animationManager = animationManager;
  window.timerManager = timerManager;
}
