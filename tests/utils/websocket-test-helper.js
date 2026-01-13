/**
 * WebSocket Test Helper Utility
 * Provides utilities for testing WebSocket functionality
 */

const WebSocket = require('ws');
const http = require('http');

/**
 * Creates a test HTTP server with WebSocket support
 */
class WebSocketTestServer {
  constructor() {
    this.server = null;
    this.port = null;
  }

  /**
   * Start the test server
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer();
      
      this.server.listen(0, () => {
        this.port = this.server.address().port;
        resolve(this.port);
      });
      
      this.server.on('error', reject);
    });
  }

  /**
   * Stop the test server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }

  /**
   * Get the WebSocket URL
   */
  getWebSocketUrl(path = '/test') {
    return `ws://localhost:${this.port}${path}`;
  }

  /**
   * Get the HTTP URL
   */
  getHttpUrl() {
    return `http://localhost:${this.port}`;
  }
}

/**
 * Creates a WebSocket client with promise-based events
 */
class WebSocketTestClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.messages = [];
    this.eventHandlers = {};
  }

  /**
   * Connect to WebSocket server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.on('open', () => {
        resolve();
      });
      
      this.ws.on('error', (error) => {
        reject(error);
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.messages.push(message);
          
          // Call event handlers
          if (this.eventHandlers.message) {
            this.eventHandlers.message(message);
          }
        } catch (parseError) {
          // Store raw message if JSON parsing fails
          this.messages.push({
            type: 'raw',
            data: data.toString(),
            error: parseError.message
          });
        }
      });
      
      this.ws.on('close', () => {
        if (this.eventHandlers.close) {
          this.eventHandlers.close();
        }
      });
    });
  }

  /**
   * Send a message
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (typeof message === 'object') {
        this.ws.send(JSON.stringify(message));
      } else {
        this.ws.send(message);
      }
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  /**
   * Wait for a specific message type
   */
  async waitForMessage(type, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const checkMessages = () => {
        const message = this.messages.find(msg => msg.type === type);
        if (message) {
          resolve(message);
          return;
        }
        
        if (this.eventHandlers.message) {
          this.eventHandlers.message = (msg) => {
            if (msg.type === type) {
              resolve(msg);
            }
          };
        }
      };

      // Check existing messages
      checkMessages();

      // Set timeout
      setTimeout(() => {
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);
    });
  }

  /**
   * Wait for a specific number of messages
   */
  async waitForMessageCount(count, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.messages.length >= count) {
        resolve(this.messages.slice(0, count));
        return;
      }

      const originalHandler = this.eventHandlers.message;
      let receivedCount = this.messages.length;

      this.eventHandlers.message = (message) => {
        if (originalHandler) originalHandler(message);
        
        receivedCount++;
        if (receivedCount >= count) {
          resolve(this.messages.slice(0, count));
        }
      };

      setTimeout(() => {
        reject(new Error(`Timeout waiting for ${count} messages`));
      }, timeout);
    });
  }

  /**
   * Clear messages
   */
  clearMessages() {
    this.messages = [];
  }

  /**
   * Get all messages
   */
  getMessages() {
    return this.messages;
  }

  /**
   * Close the connection
   */
  async close() {
    if (this.ws) {
      return new Promise((resolve) => {
        this.ws.on('close', resolve);
        this.ws.close();
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Utility functions for WebSocket testing
 */
const WebSocketTestUtils = {
  /**
   * Create a test server and client
   */
  async createTestServerAndClient(websocketPath = '/test') {
    const server = new WebSocketTestServer();
    const port = await server.start();
    const wsUrl = server.getWebSocketUrl(websocketPath);
    const client = new WebSocketTestClient(wsUrl);
    
    return { server, client, port, wsUrl };
  },

  /**
   * Wait for a specified time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate test data
   */
  generateTestData() {
    return {
      ping: { type: 'ping', timestamp: Date.now() },
      gameEvent: {
        type: 'gameEvent',
        sessionId: 'test-session',
        data: {
          event: 'playerAction',
          player: 'testPlayer',
          action: 'fold',
          amount: 0
        }
      },
      broadcast: {
        type: 'testBroadcast',
        message: 'Test broadcast message',
        timestamp: Date.now()
      }
    };
  },

  /**
   * Assert message structure
   */
  assertMessageStructure(message, expectedType, requiredFields = []) {
    if (!message || typeof message !== 'object') {
      throw new Error('Message is not an object');
    }

    if (message.type !== expectedType) {
      throw new Error(`Expected message type ${expectedType}, got ${message.type}`);
    }

    for (const field of requiredFields) {
      if (!(field in message)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }
};

module.exports = {
  WebSocketTestServer,
  WebSocketTestClient,
  WebSocketTestUtils
};
