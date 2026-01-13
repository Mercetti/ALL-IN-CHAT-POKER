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
