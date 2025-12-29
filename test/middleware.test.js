const assert = require('assert');
const { describe, it } = require('node:test');

describe('middleware utilities', () => {
  it('CSRF cookie options are consistent', () => {
    const middleware = require('../server/middleware');
    const auth = require('../server/auth');
    const config = require('../server/config');

    const options = middleware.getCsrfCookieOptions({ auth, config });
    
    assert.ok(typeof options === 'object');
    assert.ok(options.sameSite);
  });

  it('CSRF token generation works', () => {
    const middleware = require('../server/middleware');
    const auth = require('../server/auth');
    const config = require('../server/config');

    // Mock response with cookie method
    const res = {
      cookie: (name, value, options) => {
        res.cookieData = { name, value, options };
      },
    };

    const token = middleware.issueCsrfCookie(res, { auth, config });
    
    assert.ok(typeof token === 'string');
    assert.ok(token.length > 0);
    assert.strictEqual(res.cookieData.name, 'csrf_token');
    assert.strictEqual(res.cookieData.value, token);
  });

  it('Cookie header parsing works', () => {
    const middleware = require('../server/middleware');

    const cookieHeader = 'csrf_token=abc123; session_id=xyz789; theme=dark';
    const parsed = middleware.parseCookieHeader(cookieHeader);
    
    assert.strictEqual(parsed.csrf_token, 'abc123');
    assert.strictEqual(parsed.session_id, 'xyz789');
    assert.strictEqual(parsed.theme, 'dark');
  });

  it('Empty cookie header returns empty object', () => {
    const middleware = require('../server/middleware');

    const parsed = middleware.parseCookieHeader('');
    assert.deepStrictEqual(parsed, {});
    
    const parsedNull = middleware.parseCookieHeader(null);
    assert.deepStrictEqual(parsedNull, {});
  });
});
