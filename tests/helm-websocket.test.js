/**
 * Helm WebSocket Integration Tests
 * Tests the Helm WebSocket server functionality
 */

const { HelmWebSocket } = require('../server/helm-websocket');

describe('HelmWebSocket Integration Tests', () => {
  let helmWebSocket;
  let mockServer;
  let mockHelmEngine;

  beforeAll(() => {
    // Mock HTTP server
    mockServer = {
      on: jest.fn(),
      close: jest.fn()
    };

    // Mock Helm engine
    mockHelmEngine = {
      processRequest: jest.fn().mockResolvedValue({
        id: 'test-response',
        success: true,
        content: 'Test response from Helm engine',
        persona: 'acey',
        metadata: { processingTime: 100 }
      }),
      isHealthy: jest.fn().mockReturnValue(true)
    };

    // Create Helm WebSocket instance
    helmWebSocket = new HelmWebSocket({
      server: mockServer,
      path: '/helm',
      logger: console,
      helmEngine: mockHelmEngine
    });
  });

  afterAll(() => {
    if (helmWebSocket) {
      helmWebSocket.close();
    }
  });

  test('should initialize successfully', () => {
    expect(helmWebSocket).toBeDefined();
    expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(mockServer.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockServer.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  test('should handle client connection', () => {
    const mockWs = {
      readyState: 1, // WebSocket.OPEN
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    };

    const mockReq = {
      headers: {
        'x-user-login': 'testuser',
        'x-channel': 'test-channel'
      }
    };

    // Simulate connection
    helmWebSocket.wss.emit('connection', mockWs, mockReq);

    expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('connected')
    );
  });

  test('should handle chat messages', async () => {
    const mockWs = {
      readyState: 1,
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    };

    const mockReq = {
      headers: {
        'x-user-login': 'testuser',
        'x-channel': 'test-channel'
      }
    };

    helmWebSocket.wss.emit('connection', mockWs, mockReq);

    const chatMessage = {
      type: 'chat',
      content: 'Hello Helm engine',
      persona: 'acey'
    };

    // Simulate message
    helmWebSocket.wss.emit('message', JSON.stringify(chatMessage), mockWs);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockHelmEngine.processRequest).toHaveBeenCalledWith({
      id: expect.any(String),
      userId: 'testuser',
      persona: 'acey',
      message: 'Hello Helm engine',
      timestamp: expect.any(Number),
      context: {
        source: 'websocket',
        channel: 'test-channel',
        sessionId: expect.any(String)
      }
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('chat_response')
    );
  });

  test('should handle persona switching', () => {
    const mockWs = {
      readyState: 1,
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    };

    const mockReq = {
      headers: {
        'x-user-login': 'testuser',
        'x-channel': 'test-channel'
      }
    };

    helmWebSocket.wss.emit('connection', mockWs, mockReq);

    const personaMessage = {
      type: 'persona_switch',
      persona: 'professional'
    };

    helmWebSocket.wss.emit('message', JSON.stringify(personaMessage), mockWs);

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('persona_switched')
    );
  });

  test('should handle status requests', () => {
    const mockWs = {
      readyState: 1,
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    };

    const mockReq = {
      headers: {
        'x-user-login': 'testuser',
        'x-channel': 'test-channel'
      }
    };

    helmWebSocket.wss.emit('connection', mockWs, mockReq);

    const statusMessage = {
      type: 'status'
    };

    helmWebSocket.wss.emit('message', JSON.stringify(statusMessage), mockWs);

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('status')
    );
  });

  test('should provide connection statistics', () => {
    const stats = helmWebSocket.getStats();
    
    expect(stats).toHaveProperty('totalConnections');
    expect(stats).toHaveProperty('activeConnections');
    expect(stats).toHaveProperty('connectionsByChannel');
    expect(stats).toHaveProperty('averageSessionDuration');
  });

  test('should broadcast messages', () => {
    const mockWs1 = {
      readyState: 1,
      send: jest.fn()
    };

    const mockWs2 = {
      readyState: 1,
      send: jest.fn()
    };

    // Simulate two clients
    helmWebSocket.clients.set('session1', {
      ws: mockWs1,
      channel: 'channel1',
      lastActivity: Date.now()
    });

    helmWebSocket.clients.set('session2', {
      ws: mockWs2,
      channel: 'channel1',
      lastActivity: Date.now()
    });

    const broadcastData = {
      type: 'broadcast',
      message: 'Test broadcast'
    };

    helmWebSocket.broadcast(broadcastData);

    expect(mockWs1.send).toHaveBeenCalledWith(
      expect.stringContaining('broadcast')
    );
    expect(mockWs2.send).toHaveBeenCalledWith(
      expect.stringContaining('broadcast')
    );
  });

  test('should broadcast game events', () => {
    const mockWs = {
      readyState: 1,
      send: jest.fn()
    };

    helmWebSocket.clients.set('session1', {
      ws: mockWs,
      channel: 'poker',
      lastActivity: Date.now()
    });

    const gameEvent = {
      type: 'game_event',
      event: { action: 'deal', player: 'testuser' }
    };

    helmWebSocket.broadcastGameEvent(gameEvent, 'poker');

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('game_event')
    );
  });

  test('should handle unknown message types', () => {
    const mockWs = {
      readyState: 1,
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    };

    const mockReq = {
      headers: {
        'x-user-login': 'testuser',
        'x-channel': 'test-channel'
      }
    };

    helmWebSocket.wss.emit('connection', mockWs, mockReq);

    const unknownMessage = {
      type: 'unknown_type',
      data: 'test'
    };

    helmWebSocket.wss.emit('message', JSON.stringify(unknownMessage), mockWs);

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('error')
    );
  });
});
