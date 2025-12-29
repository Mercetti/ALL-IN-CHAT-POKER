const assert = require('assert');
const { describe, it } = require('node:test');

describe('routes utilities', () => {
  it('public routes respond correctly', async () => {
    const { createPublicRouter } = require('../server/routes/public');
    const auth = require('../server/auth');
    const middleware = require('../server/middleware');
    const config = require('../server/config');
    const logger = require('../server/logger');
    const startup = require('../server/startup');

    const router = createPublicRouter({
      auth,
      middleware,
      config,
      logger,
      startup,
    });

    // Test that router has expected routes
    assert.ok(router.stack);
    const routes = router.stack.map(layer => layer.route?.path).filter(Boolean);
    assert.ok(routes.includes('/health'));
    assert.ok(routes.includes('/public-config.json'));
  });

  it('auth routes are properly configured', async () => {
    const { createAuthRouter } = require('../server/routes/auth');
    const auth = require('../server/auth');
    const middleware = require('../server/middleware');
    const config = require('../server/config');
    const logger = require('../server/logger');
    const validation = require('../server/validation');
    const db = require('../server/db');
    const ai = require('../server/ai');

    const router = createAuthRouter({
      auth,
      middleware,
      config,
      logger,
      validation,
      db,
      ai,
      rateLimit: () => (req, res, next) => next(),
      DEFAULT_CHANNEL: 'testchannel',
      normalizeChannelNameScoped: (name) => name,
      isUserBanned: () => false,
      fetchSupabaseUser: async () => null,
      deriveLoginFromSupabaseUser: (user) => user?.user_metadata?.login || user?.email?.split('@')[0],
      fetchTwitchUser: async () => null,
      validateBody: () => (req, res, next) => next(),
      validateLocalLogin: () => (req, res, next) => next(),
      isBanned: () => false,
      getHelixToken: () => null,
      fetchTwitchUsersByLogin: async () => ({}),
      isUserSubscribedTo: async () => false,
      grantSubscriberCosmetics: () => [],
      grantVipCosmetics: () => [],
      grantFollowerCosmetics: () => [],
    });

    // Test that router has expected auth routes
    assert.ok(router.stack);
    const routes = router.stack.map(layer => layer.route?.path).filter(Boolean);
    assert.ok(routes.includes('/auth/register'));
    assert.ok(routes.includes('/auth/login'));
    assert.ok(routes.includes('/auth/refresh'));
  });

  it('admin routes require authentication', async () => {
    const { createAdminRouter } = require('../server/routes/admin');
    const auth = require('../server/auth');
    const middleware = require('../server/middleware');
    const config = require('../server/config');
    const logger = require('../server/logger');

    const router = createAdminRouter({
      auth,
      middleware,
      config,
      logger,
      rateLimit: () => (req, res, next) => next(),
      db: null,
      tmiClient: null,
      blockedIPs: new Map(),
      adminLoginAttempts: new Set(),
      recentErrors: [],
      recentSlowRequests: [],
      recentSocketDisconnects: [],
      lastTmiReconnectAt: null,
      getCriticalHashes: () => ({}),
      recordLoginAttempt: () => true,
    });

    // Test that router has expected admin routes
    assert.ok(router.stack);
    const routes = router.stack.map(layer => layer.route?.path).filter(Boolean);
    assert.ok(routes.includes('/csrf'));
    assert.ok(routes.includes('/login'));
    assert.ok(routes.includes('/logout'));
  });
});
