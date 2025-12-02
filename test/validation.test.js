const assert = require('assert');
const {
  validateUsername,
  validateIP,
  validatePassword,
  validateTwitchLogin,
  validateNumber,
  sanitizeString,
} = require('../server/validation');

const { describe, it } = require('node:test');

describe('validation utilities', () => {
  it('validateUsername accepts good usernames', () => {
    assert.strictEqual(validateUsername('user_123'), true);
    assert.strictEqual(validateUsername('ab'), false);
    assert.strictEqual(validateUsername('this-is-long-name-12345'), false);
  });

  it('validateIP recognizes IPv4 and IPv6', () => {
    assert.strictEqual(validateIP('127.0.0.1'), true);
    assert.strictEqual(validateIP('::1'), true);
    assert.strictEqual(validateIP('not-an-ip'), false);
  });

  it('validatePassword enforces complexity', () => {
    assert.strictEqual(validatePassword('Simple1'), false);
    assert.strictEqual(validatePassword('GoodPass1'), true);
  });

  it('validateTwitchLogin enforces lowercase alphanum', () => {
    assert.strictEqual(validateTwitchLogin('good_login'), true);
    assert.strictEqual(validateTwitchLogin('Bad-Name'), false);
  });

  it('validateNumber handles ranges', () => {
    assert.strictEqual(validateNumber('10', 0, 100), true);
    assert.strictEqual(validateNumber('abc', 0, 100), false);
  });

  it('sanitizeString strips tags', () => {
    assert.strictEqual(sanitizeString('<b>hello</b>'), 'bhello/b');
  });
});
