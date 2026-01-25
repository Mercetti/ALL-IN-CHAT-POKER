/**
 * Test Cleanup Utilities
 * Properly handles resource cleanup to prevent timeout issues
 */

const net = require('net');

class TestCleanupManager {
  constructor() {
    this.allocatedPorts = new Set();
    this.activeServers = new Set();
    this.activeConnections = new Set();
  }

  /**
   * Find an available port to avoid conflicts
   */
  async getAvailablePort(startPort = 3000, endPort = 9000) {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.listen(0, () => {
        const port = server.address().port;
        this.allocatedPorts.add(port);
        server.close(() => {
          resolve(port);
        });
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Register a server for cleanup
   */
  registerServer(server, name = 'unknown') {
    this.activeServers.add({ server, name, registered: Date.now() });
  }

  /**
   * Register a connection for cleanup
   */
  registerConnection(connection, name = 'unknown') {
    this.activeConnections.add({ connection, name, registered: Date.now() });
  }

  /**
   * Close all registered resources
   */
  async cleanup() {
    const cleanupPromises = [];

    // Close all connections
    for (const { connection, name } of this.activeConnections) {
      if (connection && typeof connection.close === 'function') {
        cleanupPromises.push(
          new Promise((resolve) => {
            connection.close(() => {
              resolve();
            });
          })
        );
      }
    }

    // Close all servers
    for (const { server, name } of this.activeServers) {
      if (server && typeof server.close === 'function') {
        cleanupPromises.push(
          new Promise((resolve) => {
            server.close(() => {
              resolve();
            });
          })
        );
      }
    }

    // Wait for all cleanup to complete
    await Promise.all(cleanupPromises);

    // Clear tracking sets
    this.activeConnections.clear();
    this.activeServers.clear();
    this.allocatedPorts.clear();
  }

  /**
   * Force cleanup with timeout
   */
  async forceCleanup(timeoutMs = 5000) {
    const cleanupPromise = this.cleanup();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cleanup timeout')), timeoutMs);
    });

    try {
      await Promise.race([cleanupPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Force cleanup completed with errors:', error.message);
      // Clear sets anyway to prevent memory leaks
      this.activeConnections.clear();
      this.activeServers.clear();
      this.allocatedPorts.clear();
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    return {
      allocatedPorts: this.allocatedPorts.size,
      activeServers: this.activeServers.size,
      activeConnections: this.activeConnections.size,
      registeredAt: Date.now()
    };
  }
}

// Global cleanup manager instance
const globalCleanupManager = new TestCleanupManager();

/**
 * Enhanced Jest setup with proper cleanup
 */
function setupJestCleanup() {
  // Set up global timeout
  jest.setTimeout(30000);

  // Before each test
  beforeEach(() => {
    // Clear any previous state
    globalCleanupManager.cleanup();
  });

  // After each test
  afterEach(async () => {
    // Force cleanup with timeout
    await globalCleanupManager.forceCleanup(3000);
  });

  // After all tests
  afterAll(async () => {
    // Final cleanup
    await globalCleanupManager.forceCleanup(5000);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });
}

/**
 * Mock WebSocket utilities with proper cleanup
 */
function createMockWebSocket() {
  const EventEmitter = require('events');
  
  class MockWebSocket extends EventEmitter {
    constructor(url) {
      super();
      this.url = url;
      this.readyState = 1; // OPEN
      this.OPEN = 1;
      this.CLOSED = 3;
      
      // Auto-close after test
      setTimeout(() => {
        this.emit('close');
        this.readyState = 3;
      }, 1000);
    }

    send(data) {
      // Mock send - just emit message back
      setTimeout(() => {
        this.emit('message', data);
      }, 10);
    }

    close() {
      this.readyState = 3;
      this.emit('close');
    }
  }

  return MockWebSocket;
}

/**
 * Mock HTTP Server with proper cleanup
 */
function createMockServer() {
  const EventEmitter = require('events');
  
  class MockServer extends EventEmitter {
    constructor() {
      super();
      this.listening = false;
      this.port = 0;
    }

    listen(port, callback) {
      this.port = port || 0;
      this.listening = true;
      
      if (callback) {
        setTimeout(() => callback(), 10);
      }
      
      this.emit('listening');
      return this;
    }

    address() {
      return { port: this.port };
    }

    close(callback) {
      this.listening = false;
      
      if (callback) {
        setTimeout(() => callback(), 10);
      }
      
      this.emit('close');
      return this;
    }
  }

  return MockServer;
}

module.exports = {
  TestCleanupManager,
  globalCleanupManager,
  setupJestCleanup,
  createMockWebSocket,
  createMockServer
};
