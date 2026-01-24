const request = require('supertest');
const express = require('express');

// Initialize database before requiring server
const db = require('../server/db');
db.initialize();

// Mock modules that start intervals to prevent Jest from hanging
jest.mock('../server/ai-cache', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    cleanup: jest.fn(),
  }));
});

jest.mock('../server/ai-performance-monitor', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    collectMetrics: jest.fn(),
    analyzePerformance: jest.fn(),
    getMetrics: jest.fn(() => ({})),
  }));
});

jest.mock('../server/ai-service-manager', () => ({
  AIServiceManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    startHealthMonitoring: jest.fn(),
    stopHealthMonitoring: jest.fn(),
    checkOllamaHealth: jest.fn(),
    checkTunnelHealth: jest.fn(),
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
  getHealth: jest.fn(() => ({ status: 'healthy', timestamp: new Date().toISOString() })),
}));

jest.mock('../server/routes/admin-ai-control', () => ({
  registerAdminAiControlRoutes: jest.fn(),
}));

jest.doMock('../server/routes/admin-services', () => ({
  createSimpleAdminServicesRouter: jest.fn(() => express.Router()),
}));

jest.mock('../server/routes/public', () => ({
  createPublicRouter: jest.fn(),
}));

jest.mock('../server/routes/partners', () => ({
  createPartnersRouter: jest.fn(),
}));

jest.mock('../server/routes/catalog', () => ({
  createCatalogRouter: jest.fn(),
}));

const { server } = require('../server');

describe('Admin User Management', () => {
  let adminCookie = null;
  let csrfToken = null;

  beforeAll(async () => {
    // Wait for test server to be ready and listening
    await new Promise(resolve => {
      const checkServer = () => {
        const address = server.address();
        if (address && address.port > 0) {
          resolve();
        } else {
          setTimeout(checkServer, 50);
        }
      };
      checkServer();
    });
    
    // Seed mercetti admin if not exists
    const auth = require('../server/auth');
    const existing = db.getAdminUser('mercetti');
    if (!existing) {
      db.createAdminUser({
        login: 'mercetti',
        display_name: 'Mercetti',
        email: 'owner@example.com',
        password_hash: auth.hashPassword('Hype420!Hype'),
        role: 'owner',
        status: 'active',
        created_by: 'test',
      });
    }
  });

  it('should reject login without username', async () => {
    const res = await request(server)
      .post('/admin/login')
      .send({ password: 'Hype420!Hype' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/username required/);
  });

  it('should reject login with invalid credentials', async () => {
    const res = await request(server)
      .post('/admin/login')
      .send({ username: 'mercetti', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid_credentials/);
  });

  it('should login with valid credentials and set cookie', async () => {
    const res = await request(server)
      .post('/admin/login')
      .send({ username: 'mercetti', password: 'Hype420!Hype' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.login).toBe('mercetti');
    expect(res.headers['set-cookie']).toBeDefined();
    adminCookie = res.headers['set-cookie'].find(c => c.startsWith('admin_jwt='));
  });

  it('should get CSRF token as admin', async () => {
    const res = await request(server)
      .get('/admin/csrf')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    csrfToken = res.body.token;
  });

  it('should list admin users', async () => {
    const res = await request(server)
      .get('/admin/users')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.some(u => u.login === 'mercetti')).toBe(true);
  });

  it('should get single admin user', async () => {
    const res = await request(server)
      .get('/admin/users/mercetti')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.login).toBe('mercetti');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('should create a new admin user', async () => {
    const res = await request(server)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        login: 'testadmin',
        display_name: 'Test Admin',
        email: 'test@example.com',
        password: 'TestPass123!',
        role: 'admin',
        status: 'active',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.login).toBe('testadmin');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('should reject duplicate admin user creation', async () => {
    const res = await request(server)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        login: 'testadmin',
        password: 'AnotherPass123!',
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/user_exists/);
  });

  it('should update admin user', async () => {
    const res = await request(server)
      .put('/admin/users/testadmin')
      .set('Cookie', adminCookie)
      .send({
        display_name: 'Updated Admin',
        email: 'updated@example.com',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.display_name).toBe('Updated Admin');
  });

  it('should disable admin user', async () => {
    const res = await request(server)
      .patch('/admin/users/testadmin/status')
      .set('Cookie', adminCookie)
      .send({ status: 'disabled' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.status).toBe('disabled');
  });

  it('should re-enable admin user', async () => {
    const res = await request(server)
      .patch('/admin/users/testadmin/status')
      .set('Cookie', adminCookie)
      .send({ status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.status).toBe('active');
  });

  it('should list admin audit logs', async () => {
    const res = await request(server)
      .get('/admin/audit')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('should get login attempts for a user', async () => {
    const res = await request(server)
      .get('/admin/users/mercetti/login-attempts')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.attempts)).toBe(true);
  });

  it('should unlock a user', async () => {
    const res = await request(server)
      .post('/admin/users/testadmin/unlock')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject unauthenticated access to admin endpoints', async () => {
    const res = await request(server).get('/admin/users');
    expect(res.status).toBe(403);
  });

  afterAll(async () => {
    // Cleanup test admin user
    const db = require('../server/db');
    db.db.prepare('DELETE FROM admin_users WHERE login = ?').run('testadmin');
    
    // Close server to prevent open handles
    if (server && server.close) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });
});
