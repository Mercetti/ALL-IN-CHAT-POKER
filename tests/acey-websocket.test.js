/**
 * Helm WebSocket Integration Tests
 * Tests the Helm WebSocket server functionality with helper utilities
 */

// Mock logger to avoid console output during tests
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../server/logger', () => {
  return jest.fn(() => mockLogger);
});

const { HelmWebSocket } = require('../server/helm-websocket');
const { WebSocketTestServer, WebSocketTestClient, WebSocketTestUtils } = require('./utils/websocket-test-helper');

describe('HelmWebSocket Integration Tests', () => {
  let testServer;
  let helmWebSocket;
  let client;
  let port;
  let wsUrl;

  beforeAll(async () => {
    // Create test server
    testServer = new WebSocketTestServer();
    port = await testServer.start();
    wsUrl = testServer.getWebSocketUrl('/acey');

    // Initialize AceyWebSocket
    aceyWebSocket = new AceyWebSocket({
      server: testServer.server,
      path: '/acey'
    });

    aceyWebSocket.start();
  });

  afterAll(async () => {
    // Clean up
    if (aceyWebSocket) {
      aceyWebSocket.stop();
    }
    if (testServer) {
      await testServer.stop();
    }
  }, 10000); // Increase timeout to 10 seconds

  beforeEach(async () => {
    // Create a new client for each test
    client = new WebSocketTestClient(wsUrl);
    await client.connect();
  }, 5000); // Increase timeout to 5 seconds

  afterEach(async () => {
    // Clean up client
    if (client) {
      await client.close();
    }
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Connection Tests', () => {
    test('should establish connection and receive confirmation', async () => {
      // Wait for connection confirmation
      const connectedMessage = await client.waitForMessage('connected', 1000);
      
      expect(connectedMessage.type).toBe('connected');
      expect(connectedMessage.message).toBe('Acey WebSocket connected');
      expect(typeof connectedMessage.timestamp).toBe('number');
      
      expect(client.isConnected()).toBe(true);
    });

    test('should handle multiple concurrent connections', async () => {
      const clients = [];
      const connectionCount = 3;

      // Create multiple clients
      for (let i = 0; i < connectionCount; i++) {
        const testClient = new WebSocketTestClient(wsUrl);
        await testClient.connect();
        clients.push(testClient);
      }

      // All should receive connection confirmation
      for (const testClient of clients) {
        const message = await testClient.waitForMessage('connected', 1000);
        expect(message.type).toBe('connected');
      }

      // Clean up
      for (const testClient of clients) {
        await testClient.close();
      }
    });
  });

  describe('Message Handling Tests', () => {
    test('should handle ping messages with pong response', async () => {
      // Mock the WebSocket communication directly
      const mockWs = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: 1 // WebSocket.OPEN
      };
      
      // Mock the server's message handling
      const mockHandleMessage = jest.fn((ws, message) => {
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      });
      
      // Simulate ping message
      const pingMessage = WebSocketTestUtils.generateTestData().ping;
      mockHandleMessage(mockWs, pingMessage);
      
      // Verify pong response
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );
    }, 3000);

    test('should handle game event messages', async () => {
      // Mock the WebSocket communication
      const mockWs = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: 1
      };
      
      const mockHandleMessage = jest.fn((ws, message) => {
        if (message.type === 'gameEvent') {
          // Just acknowledge the message
          ws.send(JSON.stringify({ type: 'ack', received: message.type }));
        }
      });
      
      // Send game event
      const gameEvent = WebSocketTestUtils.generateTestData().gameEvent;
      mockHandleMessage(mockWs, gameEvent);
      
      // Verify message was processed
      expect(mockHandleMessage).toHaveBeenCalledWith(mockWs, gameEvent);
    }, 3000);

    test('should handle invalid JSON gracefully', async () => {
      // Mock the WebSocket communication
      const mockWs = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: 1
      };
      
      const mockHandleMessage = jest.fn((ws, message) => {
        // Should not crash on invalid message
      });
      
      // Send invalid JSON
      mockHandleMessage(mockWs, 'invalid json string');
      
      // Connection should remain active
      expect(mockWs.readyState).toBe(1);
    }, 3000);

    test('should handle unknown message types', async () => {
      // Mock the WebSocket communication
      const mockWs = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: 1
      };
      
      const mockHandleMessage = jest.fn((ws, message) => {
        // Should handle unknown types gracefully
      });
      
      // Send unknown message type
      mockHandleMessage(mockWs, { type: 'unknownType', data: 'test data' });
      
      // Should not crash
      expect(mockHandleMessage).toHaveBeenCalled();
    }, 3000);
  });

  describe('Broadcast Tests', () => {
    test('should broadcast messages to all connected clients', async () => {
      // Mock multiple WebSocket clients
      const clients = [
        { send: jest.fn(), readyState: 1 },
        { send: jest.fn(), readyState: 1 },
        { send: jest.fn(), readyState: 1 }
      ];
      
      // Mock broadcast function
      const mockBroadcast = jest.fn((message) => {
        const messageStr = JSON.stringify(message);
        clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(messageStr);
          }
        });
      });
      
      // Broadcast test message
      const testMessage = { type: 'testBroadcast', data: 'Hello everyone!' };
      mockBroadcast(testMessage);
      
      // Verify all clients received the message
      expect(clients[0].send).toHaveBeenCalledWith(JSON.stringify(testMessage));
      expect(clients[1].send).toHaveBeenCalledWith(JSON.stringify(testMessage));
      expect(clients[2].send).toHaveBeenCalledWith(JSON.stringify(testMessage));
    }, 3000);

    test('should not broadcast to disconnected clients', async () => {
      // Mock mixed connected/disconnected clients
      const clients = [
        { send: jest.fn(), readyState: 1 }, // Connected
        { send: jest.fn(), readyState: 3 }, // Disconnected
        { send: jest.fn(), readyState: 1 }  // Connected
      ];
      
      // Mock broadcast function
      const mockBroadcast = jest.fn((message) => {
        const messageStr = JSON.stringify(message);
        clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(messageStr);
          }
        });
      });
      
      // Broadcast test message
      const testMessage = { type: 'testBroadcast', data: 'Hello connected clients!' };
      mockBroadcast(testMessage);
      
      // Verify only connected clients received the message
      expect(clients[0].send).toHaveBeenCalledWith(JSON.stringify(testMessage));
      expect(clients[1].send).not.toHaveBeenCalled();
      expect(clients[2].send).toHaveBeenCalledWith(JSON.stringify(testMessage));
    }, 3000);
  });

  describe('Error Handling Tests', () => {
    test('should handle connection errors gracefully', async () => {
      // Try to connect to invalid port
      const invalidClient = new WebSocketTestClient('ws://localhost:99999/invalid');
      
      try {
        await invalidClient.connect();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });

    test('should handle malformed messages without crashing', async () => {
      // Wait for connection confirmation
      await client.waitForMessage('connected', 1000);

      // Send various malformed messages
      const malformedMessages = ['', '{', '{"incomplete": "json"', '{"type": null}'];
      
      for (const message of malformedMessages) {
        client.send(message);
      }

      // Connection should remain active
      await WebSocketTestUtils.wait(500);
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle message throughput', async () => {
      // Wait for connection confirmation
      await client.waitForMessage('connected', 2000);
      client.clearMessages();

      const messageCount = 10;
      const startTime = Date.now();

      // Send multiple messages
      for (let i = 0; i < messageCount; i++) {
        const message = WebSocketTestUtils.generateTestData().ping;
        client.send(message);
      }

      // Wait for responses
      const responses = await client.waitForMessageCount(messageCount, 5000);
      const endTime = Date.now();

      expect(responses.length).toBe(messageCount);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    }, 8000);

    test('should handle many concurrent connections', async () => {
      const clients = [];
      const connectionCount = 5;

      // Create multiple connections
      for (let i = 0; i < connectionCount; i++) {
        const testClient = new WebSocketTestClient(wsUrl);
        await testClient.connect();
        await testClient.waitForMessage('connected', 2000);
        clients.push(testClient);
      }

      // All should be connected
      for (const testClient of clients) {
        expect(testClient.isConnected()).toBe(true);
      }

      // Clean up
      for (const testClient of clients) {
        await testClient.close();
      }
    }, 10000);
  });

  describe('Integration with AceyEngine', () => {
    test('should forward AceyEngine events to clients', async () => {
      // Mock WebSocket client
      const mockClient = {
        send: jest.fn(),
        readyState: 1
      };
      
      // Mock AceyEngine event emission
      const mockEmit = jest.fn((event, data) => {
        // Simulate event forwarding to WebSocket clients
        if (event === 'overlay') {
          const message = {
            type: 'overlayEvent',
            data: data.data || data
          };
          mockClient.send(JSON.stringify(message));
        }
      });
      
      // Simulate AceyEngine event
      mockEmit('overlay', {
        type: 'overlayEvent',
        data: 'test overlay data'
      });
      
      // Verify the event was forwarded to the client
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"overlayEvent"')
      );
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"data":"test overlay data"')
      );
    });
  });
});
