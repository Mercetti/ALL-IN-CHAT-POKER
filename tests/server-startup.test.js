const request = require('supertest');

const app = require('../server');

describe('Server Startup', () => {
  it('should start without errors', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});
