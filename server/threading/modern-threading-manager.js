/**
 * Modern Threading Manager for Java 21+ Compatibility
 * Replaces deprecated ThreadLocal usage with ScopedValue
 * Provides modern concurrency patterns and thread management
 */

class ModernThreadingManager {
  constructor(options = {}) {
    this.defaultExecutor = options.defaultExecutor || null;
    this.threadPoolSize = options.threadPoolSize || 4;
    this.maxThreadPoolSize = options.maxThreadPoolSize || 16;
    this.threadTimeout = options.threadTimeout || 30000; // 30 seconds
    this.scopedValues = new Map();
    this.threadContexts = new Map();
    this.threadCount = 0;
    this.activeThreads = new Set();
  }

  /**
   * Create a new ScopedValue for thread-local storage
   * @param {string} name - Name of the scoped value
   * @param {*} defaultValue - Default value when not bound
   * @returns {Object} ScopedValue instance
   */
  createScopedValue(name, defaultValue = null) {
    const scopedValue = {
      name,
      defaultValue,
      isBound: false,
      value: defaultValue,
      bindings: new Set()
    };
    
    this.scopedValues.set(name, scopedValue);
    return scopedValue;
  }

  /**
   * Bind a value to a ScopedValue for the current context
   * @param {Object} scopedValue - ScopedValue instance
   * @param {*} value - Value to bind
   * @param {Function} operation - Operation to execute with bound value
   * @returns {*} Result of the operation
   */
  withScopedValue(scopedValue, value, operation) {
    const previousValue = scopedValue.value;
    const wasBound = scopedValue.isBound;
    
    try {
      // Bind the value
      scopedValue.value = value;
      scopedValue.isBound = true;
      scopedValue.bindings.add(Thread.currentThread().getId());
      
      // Execute the operation
      const result = operation();
      
      return result;
    } finally {
      // Unbind the value if it was previously unbound
      if (!wasBound) {
        scopedValue.value = scopedValue.defaultValue;
        scopedValue.isBound = false;
        scopedValue.bindings.clear();
      } else {
        // Check if this thread is the last binding
        scopedValue.bindings.delete(Thread.currentThread().getId());
        if (scopedValue.bindings.size === 0) {
          scopedValue.value = scopedValue.defaultValue;
          scopedValue.isBound = false;
        }
      }
    }
  }

  /**
   * Create a new thread with modern Thread.Builder
   * @param {Function} task - Task to run in the thread
   * @param {Object} options - Thread options
   * @returns {Promise} Thread handle
   */
  async createThread(task, options = {}) {
    const threadBuilder = this.createThreadBuilder(options);
    const thread = threadBuilder.start(task);
    return thread;
  }

  /**
   * Create a Thread.Builder with modern options
   * @param {Object} options - Thread builder options
   * @returns {Object} Thread.Builder instance
   */
  createThreadBuilder(options = {}) {
    const builder = new Thread.Builder();
    
    // Set thread name if provided
    if (options.name) {
      builder.name(options.name);
    }
    
    // Set thread priority if provided
    if (options.priority) {
      builder.priority(options.priority);
    }
    
    // Set thread as daemon if specified
    if (options.daemon) {
      builder.daemon(options.daemon);
    }
    
    // Set uncaught exception handler
    builder.uncaughtExceptionHandler((thread, error) => {
      console.error(`Uncaught exception in thread ${thread.getName()}:`, error);
      // Log to error tracking system
      this.logThreadError(thread, error);
    
    return builder;
  }

  /**
   * Create a virtual thread (lightweight)
   * @param {Function} task - Task to run
   * @param {Object} options - Thread options
   * @returns {Object} Thread handle
   */
  async createVirtualThread(task, options = {}) {
    const threadBuilder = Thread.ofVirtual();
    
    if (options.name) {
      threadBuilder.name(options.name);
    }
    
    if (options.taskStart) {
      threadBuilder.taskStart(options.taskStart);
    }
    
    if (options.taskEnd) {
      threadBuilder.taskEnd(options.taskEnd);
    }
    
    const thread = threadBuilder.start(task);
    return thread;
  }

  /**
   * Create a thread pool for concurrent tasks
   * @param {number} size - Pool size
   * @param {Object} options - Pool options
   * @returns {Object} ExecutorService
   */
  createThreadPool(size = this.threadPoolSize, options = {}) {
    const executor = new ThreadPoolExecutor(size, size, 60, TimeUnit.SECONDS);
    
    return {
      executor,
      submit: (task) => {
        return executor.submit(task);
      },
      shutdown: () => {
        executor.shutdown();
      },
      awaitTermination: (timeout) => {
        return executor.awaitTermination(timeout, TimeUnit.MILLISECONDS);
      }
    };
  }

  /**
   * Execute task with timeout
   * @param {Function} task - Task to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Task result
   */
  async executeWithTimeout(task, timeout = this.threadTimeout) {
    return Promise.race([
      task(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      )
    ]);
  }

  /**
   * Get current thread information
   * @returns {Object} Thread information
   */
  getCurrentThreadInfo() {
    const thread = Thread.currentThread();
    return {
      id: thread.getId(),
      name: thread.getName(),
      priority: thread.getPriority(),
      state: thread.getState(),
      isAlive: thread.isAlive(),
      isDaemon: thread.isDaemon(),
      isInterrupted: thread.isInterrupted()
    };
  }

  /**
   * Get all active threads
   * @returns {Array} Array of thread information
   */
  getActiveThreads() {
    return Array.from(this.activeThreads).map(thread => ({
      id: thread.getId(),
      name: thread.getName(),
      priority: thread.getPriority(),
      state: thread.getState(),
      isAlive: thread.isAlive(),
      isDaemon: thread.isDaemon(),
      isInterrupted: thread.isInterrupted()
    }));
  }

  /**
   * Monitor thread performance
   * @returns {Object} Performance metrics
   */
  getThreadMetrics() {
    return {
      totalThreads: this.threadCount,
      activeThreads: this.activeThreads.size,
      threadPoolSize: this.threadPoolSize,
      maxThreadPoolSize: this.maxThreadPoolSize,
      scopedValues: this.scopedValues.size,
      threadContexts: this.threadContexts.size,
      timestamp: Date.now()
    };
  }

  /**
   * Log thread error for debugging
   * @param {Object} thread - Thread instance
   * @param {Error} error - Error object
   */
  logThreadError(thread, error) {
    const errorInfo = {
      threadId: thread.getId(),
      threadName: thread.getName(),
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    };
    
    // In a real implementation, this would log to a monitoring system
    console.error('Thread Error:', JSON.stringify(errorInfo, null, 2));
  }

  /**
   * Clean up thread resources
   */
  cleanup() {
    // Clear scoped values
    this.scopedValues.clear();
    
    // Clear thread contexts
    this.threadContexts.clear();
    
    // Clear active threads
    this.activeThreads.clear();
    
    // Reset counters
    this.threadCount = 0;
  }

  /**
   * Create a context manager for thread-local operations
   * @param {string} contextName - Name of the context
   * @returns {Object} Context manager
   */
  createContextManager(contextName) {
    return {
      contextName,
      setValue: (key, value) => {
        const threadId = Thread.currentThread().getId();
        if (!this.threadContexts.has(threadId)) {
          this.threadContexts.set(threadId, {});
        }
        this.threadContexts.get(threadId)[key] = value;
      },
      getValue: (key) => {
        const threadId = Thread.currentThread().getId();
        return this.threadContexts.get(threadId)?.[key];
      },
      clear: () => {
        const threadId = Thread.currentThread().getId();
        this.threadContexts.delete(threadId);
      }
    };
  }

  /**
   * Create a task scheduler for delayed execution
   * @param {Object} options - Scheduler options
   * @returns {Object} Task scheduler
   */
  createTaskScheduler(options = {}) {
    const scheduler = new ScheduledThreadPoolExecutor(1, 1);
    
    return {
      schedule: (task, delay) => {
        const scheduledTask = scheduler.schedule(task, delay, TimeUnit.MILLISECONDS);
        return scheduledTask;
      },
      scheduleAtFixedRate: (task, initialDelay, period) => {
        const scheduledTask = scheduler.scheduleAtFixedRate(task, initialDelay, period, TimeUnit.MILLISECONDS);
        return scheduledTask;
      },
      shutdown: () => {
        scheduler.shutdown();
      }
    };
  }

  /**
   * Monitor system resources
   * @returns {Object} Resource metrics
   */
  getResourceMetrics() {
    const runtime = Runtime.getRuntime();
    return {
      availableProcessors: runtime.availableProcessors(),
      totalMemory: runtime.totalMemory(),
      freeMemory: runtime.freeMemory(),
      usedMemory: runtime.totalMemory() - runtime.freeMemory(),
      maxMemory: runtime.maxMemory(),
      threadCount: this.threadCount,
      activeThreads: this.activeThreads.size
    };
  }
}

module.exports = ModernThreadingManager;
