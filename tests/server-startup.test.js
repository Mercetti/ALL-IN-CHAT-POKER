const request = require('supertest');

// Mock modules that start intervals to prevent Jest from hanging
jest.mock('../server/ai-cache', () => ({
  AICache: {
    init: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    cleanup: jest.fn(),
  },
}));

jest.mock('../server/ai-performance-monitor', () => ({
  AIPerformanceMonitor: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    collectMetrics: jest.fn(),
    analyzePerformance: jest.fn(),
    getMetrics: jest.fn(() => ({})),
  })),
}));

jest.mock('../server/ai-service-manager', () => ({
  AIServiceManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    startHealthMonitoring: jest.fn(),
    stopHealthMonitoring: jest.fn(),
    checkOllamaHealth: jest.fn(),
    checkTunnelHealth: jest.fn(),
  })),
}));

jest.mock('../server/startup', () => ({
  checkStartup: jest.fn(),
  logStartupCheck: jest.fn(),
  getHealth: jest.fn(() => ({ status: 'healthy', timestamp: new Date().toISOString() })),
}));

jest.mock('../server/routes/admin-ai-control', () => ({
  registerAdminAiControlRoutes: jest.fn(),
}));

jest.mock('../server/routes/admin-services-simple', () => ({
  createSimpleAdminServicesRouter: jest.fn(() => express.Router()),
}));

jest.mock('../server/routes/public', () => ({
  createPublicRouter: jest.fn(() => express.Router()),
}));

jest.mock('../server/routes/partners', () => ({
  createPartnersRouter: jest.fn(() => express.Router()),
}));

const app = require('../server');

describe('Server Startup', () => {
  it('should start without errors', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});
