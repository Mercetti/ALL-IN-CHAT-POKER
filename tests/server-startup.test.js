const request = require('supertest');

// Initialize database before requiring server
const db = require('../server/db');
db.initialize();

const { server } = require('../server');

describe('Server Startup', () => {
  it('should start without errors', async () => {
    const res = await request(server).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  afterAll(async () => {
    // Close server to prevent hanging
    if (server && server.close) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });
});
