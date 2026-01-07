/* eslint-env node, jest */
const express = require('express');
const request = require('supertest');
const { registerAdminAiControlRoutes } = require('../server/routes/admin-ai-control');

describe('Admin AI Control routes', () => {
  let app;
  let dependencies;
  let auth;
  let collectAiOverviewPanels;
  let unifiedAI;
  let sendMonitorAlert;
  let logger;
  let startTimer;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    const requireAdmin = (req, res, next) => {
      if (req.headers['x-test-admin'] === 'allow') {
        req.userLogin = req.headers['x-user-login'] || 'adminUser';
        return next();
      }
      return res.status(403).json({ error: 'not authorized' });
    };

    auth = {
      requireAdmin,
      extractUserLogin: (req) => req.headers['x-user-login'] || null,
    };

    collectAiOverviewPanels = jest.fn(() => [{
      key: 'errorManager',
      category: 'Stability',
      title: 'Error Manager',
      description: 'Tracks regressions',
      state: 'healthy',
      metrics: [{ label: 'Active errors', value: '0' }],
    }]);

    unifiedAI = {
      processChatMessage: jest.fn(async () => ({ content: 'Hello admin!' })),
      generateCosmetic: jest.fn(async () => ({ assetId: 'abc123' })),
    };

    sendMonitorAlert = jest.fn(async () => true);
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    startTimer = jest.fn(() => jest.fn());
    const performanceMonitor = { startTimer };

    dependencies = {
      auth,
      performanceMonitor,
      collectAiOverviewPanels,
      unifiedAI,
      sendMonitorAlert,
      logger,
    };

    registerAdminAiControlRoutes(app, dependencies);
  });

  describe('GET /admin/ai/overview', () => {
    it('returns panel summaries for an authorized admin', async () => {
      const response = await request(app)
        .get('/admin/ai/overview')
        .set('x-test-admin', 'allow')
        .set('x-user-login', 'mercetti');

      expect(response.status).toBe(200);
      expect(response.body.panels).toHaveLength(1);
      expect(response.body.panels[0].key).toBe('errorManager');
      expect(response.body.generatedAt).toBeTruthy();
      expect(collectAiOverviewPanels).toHaveBeenCalledTimes(1);
      expect(startTimer).toHaveBeenCalledWith('admin.ai.overview', expect.any(Object));
    });

    it('rejects unauthorized requests', async () => {
      const response = await request(app)
        .get('/admin/ai/overview');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'not authorized' });
    });
  });

  describe('POST /admin/ai-tools/chat', () => {
    it('requires a message body', async () => {
      const response = await request(app)
        .post('/admin/ai-tools/chat')
        .set('x-test-admin', 'allow')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'message_required' });
      expect(unifiedAI.processChatMessage).not.toHaveBeenCalled();
    });

    it('proxies chat messages to unifiedAI and returns response', async () => {
      unifiedAI.processChatMessage.mockResolvedValue('AI says hi');

      const response = await request(app)
        .post('/admin/ai-tools/chat')
        .set('x-test-admin', 'allow')
        .set('x-user-login', 'mercetti')
        .send({ message: 'Status update?' });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('AI says hi');
      expect(response.body.id).toMatch(/[0-9a-f-]{36}/);
      expect(unifiedAI.processChatMessage).toHaveBeenCalledWith(
        'Status update?',
        { login: 'mercetti' },
        null,
        null,
      );
    });

    it('sends monitor alert when unifiedAI throws', async () => {
      unifiedAI.processChatMessage.mockRejectedValue(new Error('AI offline'));

      const response = await request(app)
        .post('/admin/ai-tools/chat')
        .set('x-test-admin', 'allow')
        .send({ message: 'Ping' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'ai_chat_failed' });
      expect(sendMonitorAlert).toHaveBeenCalledWith(
        'Admin AI chat endpoint failed',
        expect.objectContaining({ description: 'AI offline' }),
      );
    });
  });

  describe('POST /admin/ai-tools/generate-cosmetic', () => {
    it('requires a prompt payload', async () => {
      const response = await request(app)
        .post('/admin/ai-tools/generate-cosmetic')
        .set('x-test-admin', 'allow')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'prompt_required' });
      expect(unifiedAI.generateCosmetic).not.toHaveBeenCalled();
    });

    it('defaults cosmetic types when not provided', async () => {
      const response = await request(app)
        .post('/admin/ai-tools/generate-cosmetic')
        .set('x-test-admin', 'allow')
        .set('x-user-login', 'mercetti')
        .send({ prompt: 'Neon cyberpunk theme' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        result: { assetId: 'abc123' },
      });

      expect(unifiedAI.generateCosmetic).toHaveBeenCalledWith(expect.objectContaining({
        login: 'mercetti',
        userId: 'mercetti',
        theme: 'Neon cyberpunk theme',
        cosmeticTypes: ['cardBack'],
        preset: 'neon',
        style: 'detailed',
        useCache: true,
      }));
    });

    it('sends monitor alert when cosmetic generation fails', async () => {
      unifiedAI.generateCosmetic.mockRejectedValue(new Error('Generator offline'));

      const response = await request(app)
        .post('/admin/ai-tools/generate-cosmetic')
        .set('x-test-admin', 'allow')
        .send({ prompt: 'Galactic' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'ai_cosmetic_generation_failed' });
      expect(sendMonitorAlert).toHaveBeenCalledWith(
        'Admin AI cosmetic generation failed',
        expect.objectContaining({ description: 'Generator offline' }),
      );
    });
  });
});
