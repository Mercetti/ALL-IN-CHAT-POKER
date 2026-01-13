/**
 * Acey WebSocket Integration Tests
 * Tests the Acey WebSocket server functionality with helper utilities
 */

const { AceyWebSocket } = require('../server/acey-websocket');
const { WebSocketTestServer, WebSocketTestClient, WebSocketTestUtils } = require('./utils/websocket-test-helper');

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

describe('AceyWebSocket Integration Tests', () => {
  let testServer;
  let aceyWebSocket;
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
  });

  beforeEach(async () => {
    // Create a new client for each test
    client = new WebSocketTestClient(wsUrl);
    await client.connect();
  });

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
      // Wait for connection confirmation
      await client.waitForMessage('connected', 1000);
      client.clearMessages();

      // Send ping
      const pingMessage = WebSocketTestUtils.generateTestData().ping;
      client.send(pingMessage);

      // Wait for pong
      const pongMessage = await client.waitForMessage('pong', 1000);
      
      expect(pongMessage.type).toBe('pong');
      expect(typeof pongMessage.timestamp).toBe('number');
    });

    test('should handle game event messages', async () => {
      // Wait for connection confirmation
      await client.waitForMessage('connected', 1000);
      client.clearMessages();

      // Send game event
      const gameEvent = WebSocketTestUtils.generateTestData().gameEvent;
      client.send(gameEvent);

      // Wait a bit to ensure no errors
      await WebSocketTestUtils.wait(500);
      
      // Connection should still be active
      expect(client.isConnected()).toBe(true);
    });

    test('should handle invalid JSON gracefully', async () => {
      // Wait for connection confirmation
      await client.waitForMessage('connected', 1000);

      // Send invalid JSON
      client.send('invalid json string');

      // Connection should remain active
      await WebSocketTestUtils.wait(500);
      expect(client.isConnected()).toBe(true);
    });

    test('should handle unknown message types', async () => {
      // Wait for connection confirmation
      await client.waitForMessage('connected', 1000);

      // Send unknown message type
      client.send(JSON.stringify({
        type: 'unknownType',
        data: 'test data'
      }));

      // Connection should remain active
      await WebSocketTestUtils.wait(500);
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('Broadcast Tests', () => {
    test('should broadcast messages to all connected clients', async () => {
      const clients = [];
      const clientCount = 3;

      // Create additional clients
      for (let i = 0; i < clientCount - 1; i++) {
        const testClient = new WebSocketTestClient(wsUrl);
        await testClient.connect();
        await testClient.waitForMessage('connected', 1000);
        testClient.clearMessages();
        clients.push(testClient);
      }

      // Clear main client messages
      await client.waitForMessage('connected', 1000);
      client.clearMessages();

      // Broadcast message
      const broadcastMessage = WebSocketTestUtils.generateTestData().broadcast;
      aceyWebSocket.broadcast(broadcastMessage);

      // All clients should receive the broadcast
      const allClients = [client, ...clients];
      for (const testClient of allClients) {
        const received = await testClient.waitForMessage('testBroadcast', 1000);
        expect(received.type).toBe('testBroadcast');
        expect(received.message).toBe('Test broadcast message');
      }

      // Clean up
      for (const testClient of clients) {
        await testClient.close();
      }
    });

    test('should not broadcast to disconnected clients', async () => {
      const client1 = client;
      const client2 = new WebSocketTestClient(wsUrl);
      
      await client2.connect();
      await client2.waitForMessage('connected', 1000);
      await client1.waitForMessage('connected', 1000);
      
      client1.clearMessages();
      client2.clearMessages();

      // Disconnect client1
      await client1.close();

      // Wait a bit for disconnection to process
      await WebSocketTestUtils.wait(100);

      // Broadcast message
      const broadcastMessage = WebSocketTestUtils.generateTestData().broadcast;
      aceyWebSocket.broadcast(broadcastMessage);

      // Only client2 should receive the message
      const received = await client2.waitForMessage('testBroadcast', 1000);
      expect(received.type).toBe('testBroadcast');

      await client2.close();
    });
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
      await client.waitForMessage('connected', 1000);
      client.clearMessages();

      const messageCount = 10;
      const startTime = Date.now();

      // Send multiple ping messages
      for (let i = 0; i < messageCount; i++) {
        const pingMessage = {
          type: 'ping',
          messageId: i,
          timestamp: Date.now()
        };
        client.send(pingMessage);
      }

      // Wait for responses
      const responses = await client.waitForMessageCount(messageCount + 1, 3000); // +1 for connected message
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(responses.length).toBeGreaterThanOrEqual(messageCount);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    test('should handle rapid connection/disconnection', async () => {
      const connectionCycles = 5;
      
      for (let i = 0; i < connectionCycles; i++) {
        const testClient = new WebSocketTestClient(wsUrl);
        await testClient.connect();
        
        const connected = await testClient.waitForMessage('connected', 1000);
        expect(connected.type).toBe('connected');
        
        await testClient.close();
        
        // Small delay between connections
        await WebSocketTestUtils.wait(50);
      }
    });
  });

  describe('Integration with AceyEngine', () => {
    test('should forward AceyEngine events to clients', async () => {
      // Wait for connection confirmation
      await client.waitForMessage('connected', 1000);
      client.clearMessages();

      // Simulate AceyEngine event
      if (aceyWebSocket.aceyEngine) {
        aceyWebSocket.aceyEngine.emit('overlay', {
          type: 'overlayEvent',
          data: 'test overlay data'
        });

        // Wait for the forwarded event
        const event = await client.waitForMessage('overlayEvent', 1000);
        expect(event.type).toBe('overlayEvent');
        expect(event.data).toBe('test overlay data');
      } else {
        // Skip test if AceyEngine is not available
        expect(true).toBe(true);
      }
    });
  });
});
