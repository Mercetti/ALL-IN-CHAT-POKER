const crypto = require('crypto');

function parseCookieHeader(cookieHeader) {
  const out = {};
  const raw = cookieHeader || '';
  if (!raw) return out;

  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) return;
    out[key] = val;
  });

  return out;
}

function getCsrfCookieOptions({ auth, config }) {
  const maxAge = auth.getAdminCookieOptions().maxAge || 60 * 60 * 1000;
  return {
    httpOnly: false,
    sameSite: 'strict',
    path: '/',
    secure: config.IS_PRODUCTION,
    maxAge,
  };
}

function createSecurityHeadersMiddleware({ config }) {
  return (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    let supabaseOrigin = '';
    try {
      if (config.SUPABASE_URL) supabaseOrigin = new URL(config.SUPABASE_URL).origin;
    } catch {
      supabaseOrigin = '';
    }

    const scriptSrc = [
      "script-src 'self' 'unsafe-inline'",
      'https://pagead2.googlesyndication.com',
      'https://www.googletagmanager.com',
      'https://cdn.jsdelivr.net',
      'https://cdn.socket.io',
    ];
    const connectSrc = [
      "connect-src 'self'",
      'https://id.twitch.tv',
      'https://gql.twitch.tv',
      'https://www.twitch.tv',
      'https://cdn.jsdelivr.net',
      'https://cdn.socket.io',
    ];
    if (supabaseOrigin) {
      scriptSrc.push(supabaseOrigin);
      connectSrc.push(supabaseOrigin);
    }

    const csp = [
      "default-src 'self'",
      scriptSrc.join(' '),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
      "img-src 'self' data: https://static-cdn.jtvnw.net https://pagead2.googlesyndication.com",
      connectSrc.join(' '),
      "font-src 'self' https://fonts.gstatic.com data:",
      "frame-ancestors 'self'",
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);

    if (config.IS_PRODUCTION) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}

function createCorsMiddleware({ config }) {
  return (req, res, next) => {
    const origin = (req.headers && req.headers.origin) || '';
    if (!origin) return next();

    const forwardedProto = ((req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
    const proto = forwardedProto || req.protocol || 'https';
    const host = (req.get && req.get('host')) || (req.headers && req.headers.host) || '';
    const sameOrigin = host ? `${proto}://${host}` : '';
    const pathName = req.path || '';

    const allowedOrigins = (config.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const adminControlOrigins = (config.ADMIN_CONTROL_CENTER_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const isAdminPath = pathName.startsWith('/admin/');
    const isCrossOrigin = sameOrigin ? origin !== sameOrigin : true;

    if (isAdminPath && isCrossOrigin) {
      if (adminControlOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-CSRF-Token, X-Channel, X-Requested-With'
        );

        if ((req.method || '').toUpperCase() === 'OPTIONS') {
          return res.status(204).end();
        }

        return next();
      }

      if ((req.method || '').toUpperCase() === 'OPTIONS') {
        return res.status(403).end();
      }
      return res.status(403).json({ error: 'cors' });
    }

    if (!isAdminPath && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-CSRF-Token, X-Channel, X-Requested-With'
      );

      if ((req.method || '').toUpperCase() === 'OPTIONS') {
        return res.status(204).end();
      }
    }

    return next();
  };
}

function createCsrfMiddleware({ config }) {
  return (req, res, next) => {
    if (!config.ENFORCE_ADMIN_CSRF) return next();

    const method = (req.method || '').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

    const pathName = req.path || '';
    if (!pathName.startsWith('/admin/')) return next();
    if (pathName === '/admin/login') return next();

    const cookies = parseCookieHeader(req.headers && req.headers.cookie);
    const cookieToken = cookies.csrf_token;
    const headerToken =
      (req.get && req.get('x-csrf-token')) ||
      (req.headers && (req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'])) ||
      '';

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: 'csrf' });
    }

    return next();
  };
}

function createRequestTrackingMiddleware({ recentSlowRequests, recentErrors }) {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      if (duration > 500) {
        recentSlowRequests.push({ path: req.path, status: res.statusCode, durationMs: duration, at: Date.now() });
        if (recentSlowRequests.length > 50) recentSlowRequests.shift();
      }

      if (res.statusCode >= 500) {
        recentErrors.push({ path: req.path, status: res.statusCode, at: Date.now() });
        if (recentErrors.length > 50) recentErrors.shift();
      }
    });

    next();
  };
}

function issueCsrfCookie(res, { auth, config }) {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie('csrf_token', token, getCsrfCookieOptions({ auth, config }));
  return token;
}

module.exports = {
  parseCookieHeader,
  getCsrfCookieOptions,
  createSecurityHeadersMiddleware,
  createCorsMiddleware,
  createCsrfMiddleware,
  createRequestTrackingMiddleware,
  issueCsrfCookie,
};
