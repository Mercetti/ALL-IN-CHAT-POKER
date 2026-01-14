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
