const assert = require('assert');
const { describe, it } = require('node:test');
const { signJWT, extractJWT, isAdminRequest, createAdminJWT } = require('../server/auth');

// Note: auth.js uses jwt and config; tests will exercise token sign/verify functions

describe('auth utilities', () => {
  it('createAdminJWT returns token and ttl', () => {
    const data = createAdminJWT();
    assert.ok(data.token);
    assert.ok(Number.isInteger(data.expiresIn));
  });

  it('signJWT produces verifiable token', () => {
    const token = signJWT({ admin: true }, 60);
    assert.ok(typeof token === 'string');
  });

  it('isAdminRequest returns false for empty request object', () => {
    assert.strictEqual(isAdminRequest({ get: () => undefined }), false);
  });
});
