/**
 * Modern Process Manager for Java 21+ Compatibility
 * Replaces deprecated ProcessBuilder usage with modern child_process API
 * Provides modern process management and monitoring capabilities
 */

const { spawn, exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

class ModernProcessManager {
  constructor(options = {}) {
    this.defaultTimeout = options.defaultTimeout || 30000; // 30 seconds
    this.maxConcurrentProcesses = options.maxConcurrentProcesses || 10;
    this.activeProcesses = new Map();
    this.processHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.processMetrics = {
      totalStarted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Create a modern process configuration
   * @param {Array<string>} command - Command and arguments
   * @param {Object} options - Process options
   * @returns {Object} Process configuration
   */
  createProcessBuilder(command, options = {}) {
    const processConfig = {
      command,
      options: {
        cwd: options.workingDirectory || process.cwd(),
        env: { ...process.env, ...options.environment },
        stdio: options.redirectErrorStream ? ['pipe', 'pipe', 'pipe'] : 'pipe',
        shell: options.shell || false,
        detached: options.detached || false,
        uid: options.uid,
        gid: options.gid,
        timeout: options.timeout || this.defaultTimeout
      }
    };
    
    return processConfig;
  }

  /**
   * Start a process with modern monitoring
   * @param {Array<string>} command - Command and arguments
   * @param {Object} options - Process options
   * @returns {Promise<Object>} Process handle with monitoring
   */
  async startProcess(command, options = {}) {
    const processId = this.generateProcessId();
    const startTime = Date.now();
    
    try {
      // Create process configuration
      const processConfig = this.createProcessBuilder(command, options);
      
      // Start the process using spawn
      const [cmd, ...args] = processConfig.command;
      const childProcess = spawn(cmd, args, processConfig.options);
      
      // Create process monitor
      const processMonitor = {
        processId,
        command,
        process: childProcess,
        pid: childProcess.pid,
        startTime,
        options,
        status: 'running',
        exitCode: null,
        output: [],
        errorOutput: [],
        metrics: {
          cpuUsage: 0,
          memoryUsage: 0,
          wallTime: 0
        }
      };
      
      // Store active process
      this.activeProcesses.set(processId, processMonitor);
      this.processMetrics.totalStarted++;
      
      // Setup monitoring
      this.setupProcessMonitoring(processMonitor);
      
      // Setup output capture
      this.setupOutputCapture(processMonitor);
      
      // Setup timeout
      if (options.timeout) {
        this.setupProcessTimeout(processMonitor, options.timeout);
      }
      
      return processMonitor;
      
    } catch (error) {
      this.processMetrics.totalFailed++;
      throw new Error(`Failed to start process: ${error.message}`);
    }
  }

  /**
   * Setup process monitoring with Node.js child_process
   * @param {Object} processMonitor - Process monitor object
   */
  setupProcessMonitoring(processMonitor) {
    const { process } = processMonitor;
    
    // Monitor process completion
    process.on('close', (code, signal) => {
      processMonitor.status = 'completed';
      processMonitor.exitCode = code;
      processMonitor.endTime = Date.now();
      processMonitor.metrics.wallTime = processMonitor.endTime - processMonitor.startTime;
      
      // Update metrics
      this.updateProcessMetrics(processMonitor);
      
      // Move to history
      this.moveToHistory(processMonitor);
    });
    
    // Monitor process errors
    process.on('error', (error) => {
      processMonitor.status = 'error';
      processMonitor.error = error.message;
      processMonitor.endTime = Date.now();
      this.moveToHistory(processMonitor);
    });
    
    // Monitor process health
    const healthCheckInterval = setInterval(() => {
      if (processMonitor.status === 'running') {
        this.updateProcessHealth(processMonitor);
      } else {
        clearInterval(healthCheckInterval);
      }
    }, 1000);
    
    processMonitor.healthCheckInterval = healthCheckInterval;
  }

  /**
   * Setup output capture for process
   * @param {Object} processMonitor - Process monitor object
   */
  setupOutputCapture(processMonitor) {
    const { process } = processMonitor;
    
    // Capture stdout
    if (process.stdout) {
      process.stdout.on('data', (data) => {
        processMonitor.output.push(data.toString());
      });
    }
    
    // Capture stderr
    if (process.stderr) {
      process.stderr.on('data', (data) => {
        processMonitor.errorOutput.push(data.toString());
      });
    }
  }

  /**
   * Setup process timeout
   * @param {Object} processMonitor - Process monitor object
   * @param {number} timeout - Timeout in milliseconds
   */
  setupProcessTimeout(processMonitor, timeout) {
    setTimeout(() => {
      if (processMonitor.status === 'running') {
        this.terminateProcess(processMonitor.processId, 'timeout');
      }
    }, timeout);
  }

  /**
   * Update process health metrics
   * @param {Object} processMonitor - Process monitor object
   */
  updateProcessHealth(processMonitor) {
    try {
      // Update wall time
      processMonitor.metrics.wallTime = Date.now() - processMonitor.startTime;
      
      // Check if process is still alive (Node.js doesn't provide direct isAlive check)
      // We can check if the process has exited
      if (processMonitor.process.killed || processMonitor.status !== 'running') {
        processMonitor.status = 'completed';
        processMonitor.endTime = Date.now();
        this.moveToHistory(processMonitor);
      }
      
    } catch (error) {
      // Process might have terminated
      if (processMonitor.status === 'running') {
        processMonitor.status = 'error';
        processMonitor.error = error.message;
        this.moveToHistory(processMonitor);
      }
    }
  }

  /**
   * Update process metrics
   * @param {Object} processMonitor - Process monitor object
   */
  updateProcessMetrics(processMonitor) {
    if (processMonitor.status === 'completed') {
      this.processMetrics.totalCompleted++;
    } else {
      this.processMetrics.totalFailed++;
    }
    
    // Update average execution time
    const completedProcesses = this.processHistory.filter(p => p.status === 'completed');
    if (completedProcesses.length > 0) {
      const totalTime = completedProcesses.reduce((sum, p) => sum + p.metrics.wallTime, 0);
      this.processMetrics.averageExecutionTime = totalTime / completedProcesses.length;
    }
  }

  /**
   * Move process to history
   * @param {Object} processMonitor - Process monitor object
   */
  moveToHistory(processMonitor) {
    // Remove from active processes
    this.activeProcesses.delete(processMonitor.processId);
    
    // Add to history
    this.processHistory.push(processMonitor);
    
    // Limit history size
    if (this.processHistory.length > this.maxHistorySize) {
      this.processHistory.shift();
    }
    
    // Cleanup monitoring
    if (processMonitor.healthCheckInterval) {
      clearInterval(processMonitor.healthCheckInterval);
    }
  }

  /**
   * Terminate a process
   * @param {string} processId - Process ID
   * @param {string} reason - Termination reason
   * @returns {boolean} Success status
   */
  async terminateProcess(processId, reason = 'manual') {
    const processMonitor = this.activeProcesses.get(processId);
    
    if (!processMonitor) {
      return false;
    }
    
    try {
      const { process } = processMonitor;
      
      // Try graceful termination first
      process.kill('SIGTERM');
      
      // Wait for process to terminate
      let terminated = false;
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (processMonitor.status !== 'running') {
          terminated = true;
          break;
        }
      }
      
      if (!terminated) {
        // Force terminate
        process.kill('SIGKILL');
      }
      
      processMonitor.status = 'terminated';
      processMonitor.terminationReason = reason;
      processMonitor.endTime = Date.now();
      
      this.moveToHistory(processMonitor);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to terminate process ${processId}:`, error);
      return false;
    }
  }

  /**
   * Get process information
   * @param {string} processId - Process ID
   * @returns {Object|null} Process information
   */
  getProcessInfo(processId) {
    const processMonitor = this.activeProcesses.get(processId);
    
    if (!processMonitor) {
      // Check history
      const historicalProcess = this.processHistory.find(p => p.processId === processId);
      return historicalProcess || null;
    }
    
    return {
      processId: processMonitor.processId,
      command: processMonitor.command,
      status: processMonitor.status,
      startTime: processMonitor.startTime,
      endTime: processMonitor.endTime,
      exitCode: processMonitor.exitCode,
      metrics: processMonitor.metrics,
      output: processMonitor.output,
      errorOutput: processMonitor.errorOutput
    };
  }

  /**
   * Get all active processes
   * @returns {Array} Array of active process information
   */
  getActiveProcesses() {
    return Array.from(this.activeProcesses.values()).map(processMonitor => ({
      processId: processMonitor.processId,
      command: processMonitor.command,
      status: processMonitor.status,
      startTime: processMonitor.startTime,
      metrics: processMonitor.metrics
    }));
  }

  /**
   * Get process history
   * @param {number} limit - Maximum number of processes to return
   * @returns {Array} Array of process history
   */
  getProcessHistory(limit = 100) {
    return this.processHistory.slice(-limit).map(processMonitor => ({
      processId: processMonitor.processId,
      command: processMonitor.command,
      status: processMonitor.status,
      startTime: processMonitor.startTime,
      endTime: processMonitor.endTime,
      exitCode: processMonitor.exitCode,
      metrics: processMonitor.metrics
    }));
  }

  /**
   * Get process metrics
   * @returns {Object} Process metrics
   */
  getProcessMetrics() {
    return {
      ...this.processMetrics,
      activeProcesses: this.activeProcesses.size,
      historySize: this.processHistory.length,
      timestamp: Date.now()
    };
  }

  /**
   * Execute command with modern process management
   * @param {Array<string>} command - Command and arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeCommand(command, options = {}) {
    const processMonitor = await this.startProcess(command, options);
    
    return new Promise((resolve, reject) => {
      const originalStatus = processMonitor.status;
      
      // Wait for completion
      const checkCompletion = () => {
        if (processMonitor.status !== originalStatus) {
          resolve({
            processId: processMonitor.processId,
            command,
            exitCode: processMonitor.exitCode,
            output: processMonitor.output.join(''),
            errorOutput: processMonitor.errorOutput.join(''),
            metrics: processMonitor.metrics,
            success: processMonitor.exitCode === 0
          });
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      
      checkCompletion();
    });
  }

  /**
   * Execute command with timeout
   * @param {Array<string>} command - Command and arguments
   * @param {number} timeout - Timeout in milliseconds
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeCommandWithTimeout(command, timeout, options = {}) {
    const processMonitor = await this.startProcess(command, { ...options, timeout });
    
    return new Promise((resolve, reject) => {
      const originalStatus = processMonitor.status;
      
      // Wait for completion or timeout
      const checkCompletion = () => {
        if (processMonitor.status !== originalStatus) {
          resolve({
            processId: processMonitor.processId,
            command,
            exitCode: processMonitor.exitCode,
            output: processMonitor.output.join(''),
            errorOutput: processMonitor.errorOutput.join(''),
            metrics: processMonitor.metrics,
            success: processMonitor.exitCode === 0,
            timedOut: processMonitor.status === 'terminated' && processMonitor.terminationReason === 'timeout'
          });
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      
      checkCompletion();
    });
  }

  /**
   * Generate unique process ID
   * @returns {string} Process ID
   */
  generateProcessId() {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up terminated processes
   */
  cleanup() {
    // Terminate all active processes
    for (const [processId, processMonitor] of this.activeProcesses) {
      this.terminateProcess(processId, 'cleanup');
    }
    
    // Clear collections
    this.activeProcesses.clear();
    this.processHistory = [];
    this.processMetrics = {
      totalStarted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Get system process information
   * @returns {Object} System process information
   */
  getSystemProcessInfo() {
    const currentProcess = process;
    
    return {
      currentProcess: {
        pid: currentProcess.pid,
        ppid: currentProcess.ppid,
        title: currentProcess.title,
        execPath: currentProcess.execPath,
        execArgv: currentProcess.execArgv,
        platform: currentProcess.platform,
        arch: currentProcess.arch,
        version: currentProcess.version
      },
      timestamp: Date.now()
    };
  }
}

module.exports = ModernProcessManager;
