import request from 'supertest';
import { app } from '../src/app';
import { testUtils } from './setup';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeValidHealthCheck();
      expect(response.body.status).toBe('healthy');
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.services).toBeInstanceOf(Array);
    });

    it('should include system metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.system).toBeDefined();
      expect(response.body.system.memory).toBeDefined();
      expect(response.body.system.cpu).toBeDefined();
      expect(response.body.system.disk).toBeDefined();
    });

    it('should include application metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.activeConnections).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.requestsPerMinute).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.errorRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toBeValidHealthCheck();
      expect(response.body.services).toBeDefined();
      expect(Array.isArray(response.body.services)).toBe(true);
      
      // Check individual service health
      const services = response.body.services;
      expect(services).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            status: expect.any(String),
            lastCheck: expect.any(String),
          })
        ])
      );
    });
  });
});
