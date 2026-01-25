/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Set up enhanced cleanup with basic timeout
jest.setTimeout(30000);

// Mock JSDOM to prevent ES module issues
jest.mock('jsdom', () => ({
  JSDOM: class {
    constructor() {
      this.window = {
        document: {
          createElement: jest.fn(() => ({
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => [])
          }))
        },
        navigator: {
          userAgent: 'jest'
        }
      };
    }
  }
}));

// Mock WebSocket to prevent real connections
jest.mock('ws', () => {
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

  return {
    Server: jest.fn().mockImplementation(() => ({
      address: () => ({ port: 8081 }),
      close: jest.fn((callback) => {
        if (callback && typeof callback === 'function') {
          callback();
        }
      }),
      on: jest.fn(),
      clients: new Set(),
    })),
    WebSocket: MockWebSocket
  };
});

// Mock HTTP server for test helpers
jest.mock('http', () => {
  const originalHttp = jest.requireActual('http');
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
      
      if (callback && typeof callback === 'function') {
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
      
      if (callback && typeof callback === 'function') {
        setTimeout(() => callback(), 10);
      }
      
      this.emit('close');
      return this;
    }
  }
  
  return {
    ...originalHttp,
    createServer: jest.fn().mockImplementation(() => new MockServer()),
  };
});

// Mock AceyBridge to prevent external connections during tests
jest.mock('../acey-control-center/dist/server/aceyBridge', () => {
  return {
    AceyBridge: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(),
      disconnect: jest.fn(),
      getStatus: jest.fn(() => ({ connected: false })),
      handleAceyOutput: jest.fn().mockResolvedValue(),
    }))
  };
});

// Mock socket.io to prevent WebSocket connections during tests
jest.mock('socket.io', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    connect: jest.fn(),
  }));
});

// Mock other external services
jest.mock('../server/aceyEngine', () => ({
  AceyEngine: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  }))
}));

jest.mock('tmi.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    say: jest.fn(),
  }))
}));

jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(),
    destroy: jest.fn(),
    on: jest.fn(),
  }))
}));

// Global test utilities
global.testCleanup = {
  cleanup: jest.fn(),
  registerServer: jest.fn(),
  registerConnection: jest.fn(),
};

jest.mock('../server/routes/public', () => {
  const express = require('express');
  return {
    createPublicRouter: jest.fn(() => express.Router()),
  };
});

jest.mock('../server/routes/partners', () => {
  const express = require('express');
  return {
    createPartnersRouter: jest.fn(() => express.Router()),
  };
});

jest.mock('../server/routes/catalog', () => {
  const express = require('express');
  return {
    createCatalogRouter: jest.fn(() => express.Router()),
  };
});

// Mock AI modules to prevent initialization issues
jest.mock('../server/ai-cache', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn(() => ({})),
  }));
});

jest.mock('../server/ai-performance-monitor', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    recordRequest: jest.fn(),
    analyzePerformance: jest.fn(),
    getMetrics: jest.fn(() => ({})),
  }));
});

jest.mock('../server/ai-service-manager', () => ({
  AIServiceManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    chat: jest.fn(),
    generateCosmetic: jest.fn(),
  })),
}));

jest.mock('../server/ai-audio-generator', () => ({
  getAIAudioGenerator: jest.fn(() => ({
    initialize: jest.fn(),
    generateAudio: jest.fn(),
  })),
}));

jest.mock('../server/poker-audio-system', () => ({
  PokerAudioSystem: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
  })),
}));

jest.mock('../server/startup', () => ({
  checkStartup: jest.fn(),
  logStartupCheck: jest.fn(),
  getHealth: jest.fn(() => ({ status: 'healthy' })),
}));

// Mock tmi.js to fix Node.js 22 compatibility issues
jest.mock('tmi.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    say: jest.fn(),
    join: jest.fn(),
    part: jest.fn(),
    on: jest.fn(),
  })),
}));

// Mock discord.js to fix Node.js 22 compatibility issues
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4,
  },
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn(),
    put: jest.fn(),
  })),
  Routes: {
    applicationCommands: jest.fn(),
  },
}));

// Mock unlock.ts to avoid TypeScript issues
jest.mock('../server/routes/unlock', () => ({
  createUnlockRouter: jest.fn(() => {
    const express = require('express');
    return express.Router();
  }),
}));

// Mock incident.ts to avoid TypeScript issues
jest.mock('../server/routes/incident', () => ({
  createIncidentRouter: jest.fn(() => {
    const express = require('express');
    return express.Router();
  }),
}));

// Mock socket.io to prevent WebSocket connections during tests
jest.mock('socket.io', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    connect: jest.fn(),
  }));
});

// Mock AceyEngine to fix WebSocket test issues
jest.mock('../server/aceyEngine', () => {
  const mockAceyEngine = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    processEvent: jest.fn(),
    stop: jest.fn(),
  }));
  
  // Add EventEmitter methods
  Object.assign(mockAceyEngine.prototype, {
    on: jest.fn(),
    emit: jest.fn(),
    stop: jest.fn(),
  });
  
  return mockAceyEngine;
});
