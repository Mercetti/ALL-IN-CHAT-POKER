/**
 * WebSocket Integration Tests
 * Tests the Acey WebSocket server functionality
 */

const WebSocket = require('ws');
const http = require('http');
const { AceyWebSocket } = require('../server/acey-websocket');
const Logger = require('../server/logger');

// Mock logger to avoid console output during tests
jest.mock('../server/logger');
Logger.mockImplementation(() => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('WebSocket Integration Tests', () => {
  let server;
  let aceyWebSocket;
  let wsUrl;
  let testPort;

  beforeAll(async () => {
    // Create a test HTTP server
    testPort = await getAvailablePort();
    server = http.createServer();
    
    // Start the server
    await new Promise((resolve) => {
      server.listen(testPort, resolve);
    });

    // Initialize AceyWebSocket
    aceyWebSocket = new AceyWebSocket({
      server,
      path: '/test-acey'
    });

    aceyWebSocket.start();
    wsUrl = `ws://localhost:${testPort}/test-acey`;
  });

  afterAll(async () => {
    // Clean up
    if (aceyWebSocket) {
      aceyWebSocket.stop();
    }
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Tests', () => {
    test('should establish WebSocket connection', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should receive connection confirmation message', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        expect(message).toHaveProperty('type', 'connected');
        expect(message).toHaveProperty('message', 'Acey WebSocket connected');
        expect(message).toHaveProperty('timestamp');
        expect(typeof message.timestamp).toBe('number');
        
        ws.close();
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should handle multiple concurrent connections', (done) => {
      const connections = [];
      const connectionCount = 5;
      let connectedCount = 0;
      let closedCount = 0;

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(wsUrl);
        connections.push(ws);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === connectionCount) {
            // All connections established, close them
            connections.forEach(ws => ws.close());
          }
        });

        ws.on('close', () => {
          closedCount++;
          if (closedCount === connectionCount) {
            done();
          }
        });

        ws.on('error', (error) => {
          done(error);
        });
      }
    });
  });

  describe('Message Handling Tests', () => {
    test('should handle ping messages', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        // Send ping message
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          // Ignore connection message
          return;
        }
        
        expect(message).toHaveProperty('type', 'pong');
        expect(message).toHaveProperty('timestamp');
        expect(typeof message.timestamp).toBe('number');
        
        ws.close();
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should handle game event messages', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        // Send game event message
        ws.send(JSON.stringify({
          type: 'gameEvent',
          sessionId: 'test-session',
          data: {
            event: 'playerAction',
            player: 'testPlayer',
            action: 'fold'
          }
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          // Ignore connection message
          return;
        }
        
        // Game events are processed by AceyEngine, we just test that it doesn't crash
        expect(typeof message).toBe('object');
        
        ws.close();
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should handle invalid JSON messages gracefully', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        // Send invalid JSON
        ws.send('invalid json string');
      });

      // Should not crash and connection should remain open
      setTimeout(() => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      }, 100);

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should handle unknown message types', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        // Send unknown message type
        ws.send(JSON.stringify({
          type: 'unknownType',
          data: 'test data'
        }));
      });

      // Should not crash and connection should remain open
      setTimeout(() => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      }, 100);

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Broadcast Tests', () => {
    test('should broadcast messages to all connected clients', (done) => {
      const clients = [];
      const clientCount = 3;
      let connectedCount = 0;
      let messageReceivedCount = 0;

      for (let i = 0; i < clientCount; i++) {
        const ws = new WebSocket(wsUrl);
        clients.push(ws);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === clientCount) {
            // All clients connected, trigger a broadcast
            aceyWebSocket.broadcast({
              type: 'testBroadcast',
              message: 'Hello to all clients',
              timestamp: Date.now()
            });
          }
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'connected') {
            return; // Ignore connection messages
          }
          
          expect(message.type).toBe('testBroadcast');
          expect(message.message).toBe('Hello to all clients');
          
          messageReceivedCount++;
          if (messageReceivedCount === clientCount) {
            // All clients received the broadcast
            clients.forEach(ws => ws.close());
          }
        });

        ws.on('close', () => {
          if (messageReceivedCount === clientCount) {
            done();
          }
        });

        ws.on('error', (error) => {
          done(error);
        });
      }
    });

    test('should not broadcast to disconnected clients', (done) => {
      const client1 = new WebSocket(wsUrl);
      const client2 = new WebSocket(wsUrl);
      let client1Connected = false;
      let client2Connected = false;
      let client2ReceivedMessage = false;

      client1.on('open', () => {
        client1Connected = true;
        if (client2Connected) {
          // Both connected, close client1
          client1.close();
          
          // Wait a bit then broadcast
          setTimeout(() => {
            aceyWebSocket.broadcast({
              type: 'testBroadcast',
              message: 'Only for client2',
              timestamp: Date.now()
            });
          }, 50);
        }
      });

      client2.on('open', () => {
        client2Connected = true;
        if (client1Connected) {
          client1.close();
          
          setTimeout(() => {
            aceyWebSocket.broadcast({
              type: 'testBroadcast',
              message: 'Only for client2',
              timestamp: Date.now()
            });
          }, 50);
        }
      });

      client2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          return;
        }
        
        expect(message.type).toBe('testBroadcast');
        expect(message.message).toBe('Only for client2');
        client2ReceivedMessage = true;
        client2.close();
      });

      client2.on('close', () => {
        if (client2ReceivedMessage) {
          done();
        }
      });

      client1.on('error', () => {}); // Ignore expected errors
      client2.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle connection errors gracefully', (done) => {
      // Try to connect to invalid port
      const invalidWs = new WebSocket('ws://localhost:99999/invalid');

      invalidWs.on('error', () => {
        // Expected to fail
        done();
      });
    });

    test('should handle malformed messages without crashing', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        // Send various malformed messages
        ws.send('');
        ws.send('{');
        ws.send('{"incomplete": "json"');
        ws.send('{"type": null}');
        
        // Wait to ensure no crashes
        setTimeout(() => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
        }, 200);
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle high message throughput', (done) => {
      const ws = new WebSocket(wsUrl);
      const messageCount = 100;
      let messagesSent = 0;
      let messagesReceived = 0;

      ws.on('open', () => {
        const startTime = Date.now();
        
        // Send many messages rapidly
        for (let i = 0; i < messageCount; i++) {
          ws.send(JSON.stringify({
            type: 'ping',
            messageId: i,
            timestamp: Date.now()
          }));
        }
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          return;
        }
        
        messagesReceived++;
        
        if (messagesReceived === messageCount) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          expect(messagesReceived).toBe(messageCount);
          expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
          
          ws.close();
        }
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should handle many concurrent connections', (done) => {
      const connectionCount = 20;
      const connections = [];
      let connectedCount = 0;
      let closedCount = 0;

      const startTime = Date.now();

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(wsUrl);
        connections.push(ws);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === connectionCount) {
            // All connected, close them all
            connections.forEach(ws => ws.close());
          }
        });

        ws.on('close', () => {
          closedCount++;
          if (closedCount === connectionCount) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
            done();
          }
        });

        ws.on('error', (error) => {
          done(error);
        });
      }
    });
  });

  describe('Integration with AceyEngine', () => {
    test('should forward AceyEngine events to clients', (done) => {
      const ws = new WebSocket(wsUrl);
      let eventReceived = false;

      ws.on('open', () => {
        // Simulate an AceyEngine event
        setTimeout(() => {
          // Access the internal AceyEngine and emit an event
          if (aceyWebSocket.aceyEngine) {
            aceyWebSocket.aceyEngine.emit('overlay', {
              type: 'overlayEvent',
              data: 'test overlay data'
            });
          }
        }, 100);
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          return;
        }
        
        if (message.type === 'overlayEvent') {
          expect(message.data).toBe('test overlay data');
          eventReceived = true;
          ws.close();
        }
      });

      ws.on('close', () => {
        if (eventReceived) {
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});

/**
 * Helper function to get an available port
 */
function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', reject);
  });
}
