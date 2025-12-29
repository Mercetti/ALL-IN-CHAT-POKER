const assert = require('assert');
const { describe, it } = require('node:test');

describe('auth contract utilities', () => {
  it('getAdminSession returns null for unauthenticated requests', () => {
    const { getAdminSession } = require('../server/auth-contract');
    
    const req = {
      get: () => undefined,
      headers: {},
      cookies: {},
    };

    const session = getAdminSession(req);
    assert.strictEqual(session, null);
  });

  it('getUserSession returns null for unauthenticated requests', () => {
    const { getUserSession } = require('../server/auth-contract');
    
    const req = {
      get: () => undefined,
      headers: {},
      cookies: {},
    };

    const session = getUserSession(req);
    assert.strictEqual(session, null);
  });

  it('hasAdminSession returns false for unauthenticated requests', () => {
    const { hasAdminSession } = require('../server/auth-contract');
    
    const req = {
      get: () => undefined,
      headers: {},
      cookies: {},
    };

    const hasSession = hasAdminSession(req);
    assert.strictEqual(hasSession, false);
  });

  it('hasUserSession returns false for unauthenticated requests', () => {
    const { hasUserSession } = require('../server/auth-contract');
    
    const req = {
      get: () => undefined,
      headers: {},
      cookies: {},
    };

    const hasSession = hasUserSession(req);
    assert.strictEqual(hasSession, false);
  });
});
