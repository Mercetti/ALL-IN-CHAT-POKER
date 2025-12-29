/**
 * Shared client utilities and Toast notification system
 */

/**
 * Resolve backend base URL (Render in production, same-origin locally)
 */
function getBackendBase() {
 if (typeof window === 'undefined') return '';
  const override = window.__BACKEND_URL || window.BACKEND_URL;
  if (override) return override.replace(/\/$/, '');

  // Prefer same-origin backend (Fly deployment). Fallback to Render only for GitHub Pages.
  const origin = window.location.origin;
  if (origin) return origin.replace(/\/$/, '');
  if (window.location.hostname.endsWith('github.io')) return 'https://all-in-chat-poker.onrender.com';
  return '';
}

function buildApiUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const base = getBackendBase();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

function getChannelParam() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search || '');
  return (params.get('channel') || '').trim().toLowerCase();
}

function getChannelParam() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search || '');
  return (params.get('channel') || '').trim().toLowerCase();
}

/**
 * Toast notification system
 */
class Toast {
  static container = null;

  static init() {
    if (!this.container) {
      this.container = document.getElementById('toast-container') || document.createElement('div');
      if (!this.container.id) {
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
  }

  static show(message, type = 'info', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  static success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  static error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  static warning(message, duration = 3500) {
    return this.show(message, 'warning', duration);
  }

  static info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }
}

/**
 * Utility functions
 */
function getToken() {
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('admin_jwt='));
  return cookie ? cookie.split('=')[1] : null;
}

function setToken(token) {
  const secureFlag =
    typeof window !== 'undefined' && window.location && window.location.protocol === 'https:'
      ? '; secure'
      : '';
  if (token) {
    document.cookie = `admin_jwt=${token}; path=/; samesite=strict${secureFlag}`;
  } else {
    document.cookie = `admin_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; samesite=strict${secureFlag}`;
  }
}

function setUserToken(token) {
  if (token) {
    localStorage.setItem('user_jwt', token);
  } else {
    localStorage.removeItem('user_jwt');
  }
}

function getUserToken() {
  return localStorage.getItem('user_jwt');
}

function clearUserToken() {
  setUserToken(null);
}

async function refreshUserTokenIfNeeded() {
  const token = getUserToken();
  if (!token) return;
  if (!refreshUserTokenIfNeeded.lastWarned) refreshUserTokenIfNeeded.lastWarned = 0;
  try {
    const res = await apiCall('/auth/refresh', {
      method: 'POST',
      useUserToken: true,
      noAuthBounce: true,
    });
    if (res?.token) {
      setUserToken(res.token);
      updateTokenBadge('ok', 'user');
    }
  } catch (err) {
    console.warn('User token refresh failed', err?.message || err);
    const now = Date.now();
    updateTokenBadge('warn');
    if (window.Toast && now - refreshUserTokenIfNeeded.lastWarned > 5 * 60 * 1000) {
      Toast.warning('Session refresh failed. You may need to sign in again soon.');
      refreshUserTokenIfNeeded.lastWarned = now;
    }
  }
}

function ensureTokenBadge() {
  if (ensureTokenBadge.created) return;
  const badge = document.createElement('div');
  badge.id = 'token-status-badge';
  badge.textContent = 'SESSION';
  badge.style.position = 'fixed';
  badge.style.bottom = '12px';
  badge.style.left = '12px';
  badge.style.padding = '6px 10px';
  badge.style.borderRadius = '12px';
  badge.style.fontSize = '11px';
  badge.style.fontWeight = '600';
  badge.style.letterSpacing = '0.6px';
  badge.style.background = 'rgba(0,0,0,0.5)';
  badge.style.color = '#ddd';
  badge.style.zIndex = '9999';
  badge.style.pointerEvents = 'none';
  document.body.appendChild(badge);
  ensureTokenBadge.created = true;
  updateTokenBadge('init');
}

function getSessionKind() {
  const hasAdmin = !!getToken() || !!getAdminBearer();
  const hasUser = !!getUserToken();
  if (hasAdmin) return 'admin';
  if (hasUser) return 'user';
  return 'none';
}

function updateTokenBadge(state, kind) {
  updateTokenBadge.state = state;
  const sessionKind = kind || getSessionKind();
  const badge = document.getElementById('token-status-badge');
  if (!badge) return;
  if (state === 'ok') {
    if (sessionKind === 'admin') {
      badge.style.background = 'rgba(59, 130, 246, 0.85)'; // blue
      badge.style.color = '#fff';
      badge.textContent = 'ADMIN OK';
      badge.dataset.state = 'ok-admin';
    } else {
      badge.style.background = 'rgba(16, 185, 129, 0.8)'; // green
      badge.style.color = '#fff';
      badge.textContent = 'USER OK';
      badge.dataset.state = 'ok-user';
    }
  } else if (state === 'warn') {
    badge.style.background = 'rgba(234, 179, 8, 0.85)'; // amber
    badge.style.color = '#111';
    badge.textContent = 'SESSION CHECK';
    badge.dataset.state = 'warn';
  } else {
    badge.style.background = 'rgba(99, 102, 241, 0.7)'; // indigo
    badge.style.color = '#fff';
    badge.textContent = 'SESSION';
    badge.dataset.state = 'init';
  }
}

function getTokenStatus() {
  return updateTokenBadge.state || 'init';
}

// Auto-refresh user tokens site-wide (except when explicitly disabled)
if (typeof window !== 'undefined' && !window.__DISABLE_AUTO_REFRESH) {
  window.addEventListener('DOMContentLoaded', () => {
    ensureTokenBadge();
    normalizeLinkTargets();
    initDebugTools();
  });
  setInterval(() => refreshUserTokenIfNeeded(), 20 * 60 * 1000);
}

function setAdminBearer(token) {
  if (token) {
    localStorage.setItem('admin_bearer', token);
  } else {
    localStorage.removeItem('admin_bearer');
  }
}

function getAdminBearer() {
  return localStorage.getItem('admin_bearer');
}

function clearToken() {
  setToken(null);
}

function getTheme() {
  return localStorage.getItem('app_theme') || 'dark';
}

function applyTheme(theme) {
  const t = theme || getTheme();
  if (t === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  localStorage.setItem('app_theme', t);
  return t;
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

function setThemeButtonLabel(btn) {
  if (!btn) return;
  const t = getTheme();
  btn.textContent = t === 'light' ? 'Dark Theme' : 'Light Theme';
}

function buildLoginRedirectUrl(nextPath = '') {
  if (typeof window === 'undefined') return '/login.html';
  const target = nextPath || `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;
  const safeTarget = target.startsWith('/') ? target : `/${target}`.replace(/\/{2,}/g, '/');
  return `/login.html?redirect=${encodeURIComponent(safeTarget)}`;
}

function enforceAuthenticatedPage(options = {}) {
  if (typeof window === 'undefined') return true;
  const allowUser = options.allowUserToken !== false;
  const allowAdmin = options.allowAdminToken !== false;
  const hasUser = allowUser && !!getUserToken();
  const hasAdminCookie = allowAdmin && !!getToken();
  const hasAdminBearer = allowAdmin && !!getAdminBearer();
  if (hasUser || hasAdminCookie || hasAdminBearer) {
    if (options.markOkBadge) updateTokenBadge('ok', hasAdminCookie || hasAdminBearer ? 'admin' : 'user');
    return true;
  }
  if (options.toast !== false && window.Toast) {
    Toast.warning('Please sign in to continue.');
  }
  const loginUrl = buildLoginRedirectUrl(options.nextPath);
  window.location.replace(loginUrl);
  return false;
}

let __authBounce = false;
function handleAuthFailure() {
  if (__authBounce) return;
  __authBounce = true;
  clearToken();
  clearUserToken();
  Toast.warning('Session expired. Please sign in again.');
  const loginUrl = buildLoginRedirectUrl();
  if (!window.location.pathname.endsWith('/login.html')) {
    window.location.href = loginUrl;
  } else {
    // Already on login page; avoid redirect loop and allow re-login
    setTimeout(() => {
      __authBounce = false;
    }, 3000);
  }
}

async function apiCall(endpoint, options = {}) {
  const useUserToken = options.useUserToken !== undefined ? options.useUserToken : !!window.__DEFAULT_USE_USER_TOKEN;
  const token = useUserToken ? getUserToken() : getToken();
  const adminBearer = useUserToken ? null : getAdminBearer();
  const channel = typeof getChannelParam === 'function' ? getChannelParam() : '';
  const method = ((options.method || 'GET') + '').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (adminBearer) {
    headers.Authorization = `Bearer ${adminBearer}`;
  }
  if (channel) {
    headers['x-channel'] = channel;
  }

  if (endpoint && typeof endpoint === 'string' && endpoint.startsWith('/admin/') && method !== 'GET') {
    try {
      const cookies = document.cookie || '';
      const m = cookies.match(/(?:^|;\s*)csrf_token=([^;]+)/);
      const csrfToken = m ? decodeURIComponent(m[1]) : '';
      if (csrfToken && !headers['x-csrf-token'] && !headers['X-CSRF-Token']) {
        headers['x-csrf-token'] = csrfToken;
      }
    } catch {
      // ignore
    }
  }

  try {
    const url = buildApiUrl(endpoint);
    const sessionKind = token ? 'user' : adminBearer ? 'admin' : 'none';
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && !options.noAuthBounce) {
        handleAuthFailure();
      }
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (!options.noAuthBounce && sessionKind !== 'none') {
      updateTokenBadge('ok', sessionKind);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// Initialize Toast
Toast.init();

// Export for use
window.Toast = Toast;
window.getToken = getToken;
window.setToken = setToken;
window.clearToken = clearToken;
window.setAdminBearer = setAdminBearer;
window.getAdminBearer = getAdminBearer;
window.getUserToken = getUserToken;
window.setUserToken = setUserToken;
window.clearUserToken = clearUserToken;
window.apiCall = apiCall;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.getTheme = getTheme;
window.setThemeButtonLabel = setThemeButtonLabel;
window.getBackendBase = getBackendBase;
window.buildApiUrl = buildApiUrl;
window.buildLoginRedirectUrl = buildLoginRedirectUrl;
window.enforceAuthenticatedPage = enforceAuthenticatedPage;
window.getTokenStatus = getTokenStatus;
window.updateTokenBadge = updateTokenBadge;
window.getChannelParam = getChannelParam;
window.initDebugTools = initDebugTools;

// Normalize link behavior: keep overlay links in a new tab, open other internal links in the same tab
function normalizeLinkTargets() {
  const allowNewTab = (url) => {
    try {
      const u = new URL(url, window.location.origin);
      const isOverlay =
        u.pathname.includes('obs-overlay') ||
        u.pathname.endsWith('/overlay.html') ||
        u.pathname.includes('overlay-editor');
      const isExternal = u.origin !== window.location.origin;
      return isOverlay || isExternal;
    } catch {
      return false;
    }
  };

  // Adjust existing anchors
  document.querySelectorAll('a[target="_blank"]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!allowNewTab(href)) {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }
  });

  // Patch window.open to avoid new tabs for internal nav
  const originalOpen = window.open;
  window.open = function patchedOpen(url, target, features) {
    if (url && !allowNewTab(url)) {
      window.location.href = url;
      return window;
    }
    return originalOpen.call(window, url, target, features);
  };
}

// ============== Debug tools (dev/admin only) ==============
const debugState = {
  enabled: false,
  session: null,
  apiLog: [],
  cspEvents: [],
  resourceErrors: [],
  overlay: null,
  assets: [],
  longTasks: [],
  featureFlags: {
    apiLogEnabled: true,
    overlayHealth: true,
    assetCheck: false,
    perfWatch: false,
  },
};

function hasPrivilegedSession() {
  if (getToken() || getAdminBearer()) return true;
  return !!getUserToken();
}

async function initDebugTools() {
  if (initDebugTools.started) return;
  initDebugTools.started = true;
  if (!hasPrivilegedSession()) return;
  const who = await fetchAuthDebug().catch(() => null);
  const allowed =
    who && (who.admin || ['admin', 'dev', 'ai'].includes((who.role || '').toLowerCase()));
  if (!allowed) return;
  debugState.enabled = true;
  debugState.session = who;
  attachDebugUI();
  attachGlobalDebugListeners();
  if (debugState.featureFlags.overlayHealth) runOverlayHealth();
  if (debugState.featureFlags.assetCheck) runAssetCheck();
  if (debugState.featureFlags.perfWatch) startPerfWatch();
}

async function fetchAuthDebug() {
  const useUser = !!getUserToken() && !getToken() && !getAdminBearer();
  return apiCall('/auth/debug', { method: 'GET', useUserToken: useUser, noAuthBounce: true });
}

function logApiCall(entry) {
  if (!debugState.featureFlags.apiLogEnabled || !debugState.enabled) return;
  debugState.apiLog.unshift(entry);
  debugState.apiLog = debugState.apiLog.slice(0, 50);
  renderDebugPanel();
}

function attachGlobalDebugListeners() {
  window.addEventListener('securitypolicyviolation', (e) => {
    if (!debugState.enabled) return;
    debugState.cspEvents.unshift({
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
      time: Date.now(),
    });
    debugState.cspEvents = debugState.cspEvents.slice(0, 20);
    renderDebugPanel();
  });
  window.addEventListener(
    'error',
    (e) => {
      if (!debugState.enabled) return;
      if (e.target && e.target.tagName && e.target.src) {
        debugState.resourceErrors.unshift({
          tag: e.target.tagName,
          src: e.target.src,
          time: Date.now(),
        });
        debugState.resourceErrors = debugState.resourceErrors.slice(0, 20);
        renderDebugPanel();
      }
    },
    true
  );
}

function formatMs(ms) {
  return `${ms.toFixed(0)}ms`;
}

async function runOverlayHealth() {
  try {
    const channel = getChannelParam() || 'default';
    const res = await apiCall(
      `/admin/overlay-snapshot?channel=${encodeURIComponent(channel)}`,
      {
        method: 'GET',
        noToast: true,
        noAuthBounce: true,
      }
    );
    debugState.overlay = { ok: true, channel, at: Date.now(), data: res };
  } catch (err) {
    debugState.overlay = {
      ok: false,
      error: err?.message || String(err),
      at: Date.now(),
    };
  }
  renderDebugPanel();
}

async function runAssetCheck(limit = 8) {
  try {
    const cat = await apiCall('/catalog', { method: 'GET', useUserToken: true, noToast: true });
    const entries = Array.isArray(cat?.items) ? cat.items : [];
    const missing = entries
      .filter((i) => !i.image_url)
      .slice(0, limit)
      .map((i) => ({ name: i.name || i.id, issue: 'missing image_url' }));
    const broken = [];
    const promises = entries
      .filter((i) => i.image_url)
      .slice(0, limit)
      .map(
        (i) =>
          new Promise((resolve) => {
            const img = new Image();
            const done = (issue) => {
              if (issue) broken.push({ name: i.name || i.id, issue });
              resolve();
            };
            img.onload = () => done(null);
            img.onerror = () => done('load error');
            img.src = i.image_url;
            setTimeout(() => done('timeout'), 4000);
          })
      );
    await Promise.all(promises);
    debugState.assets = { ok: missing.length === 0 && broken.length === 0, missing, broken, at: Date.now() };
  } catch (err) {
    debugState.assets = { ok: false, error: err.message || String(err), at: Date.now() };
  }
  renderDebugPanel();
}

function startPerfWatch() {
  try {
    if ('PerformanceObserver' in window) {
      const longTasks = [];
      const obs = new PerformanceObserver((list) => {
        list.getEntries().forEach((e) => {
          longTasks.push({ name: e.name, dur: e.duration, start: e.startTime });
        });
        debugState.longTasks = longTasks.slice(-20);
        renderDebugPanel();
      });
      obs.observe({ entryTypes: ['longtask'] });
    }
  } catch (_) {
    // ignore
  }
}

function renderDebugPanel() {
  if (!debugState.enabled) return;
  const panel = document.getElementById('debug-drawer');
  if (!panel || panel.dataset.open !== '1') return;
  const apiRows = debugState.apiLog
    .slice(0, 10)
    .map(
      (e) =>
        `<div class="row"><span class="${e.ok ? 'ok' : 'err'}">${e.status || ''}</span> <code>${e.endpoint}</code> <span>${formatMs(
          e.ms
        )}</span> ${e.error ? `<em>${e.error}</em>` : ''}</div>`
    )
    .join('');
  const cspRows = (debugState.cspEvents || [])
    .slice(0, 5)
    .map((e) => `<div class="row"><strong>${e.violatedDirective}</strong> ${e.blockedURI || ''}</div>`)
    .join('');
  const resRows = (debugState.resourceErrors || [])
    .slice(0, 5)
    .map((e) => `<div class="row">${e.tag}: ${e.src}</div>`)
    .join('');
  const overlay = debugState.overlay
    ? debugState.overlay.ok
      ? `OK (${debugState.overlay.channel || ''})`
      : `Err: ${debugState.overlay.error || 'unknown'}`
    : '—';
  const assets = debugState.assets
    ? debugState.assets.ok
      ? 'OK'
      : `Missing: ${debugState.assets.missing?.length || 0}, Broken: ${debugState.assets.broken?.length || 0}`
    : '—';
  const session = debugState.session;
  const longTasks =
    debugState.longTasks && debugState.longTasks.length
      ? debugState.longTasks
          .slice(-3)
          .map((t) => `${formatMs(t.dur)} @ ${formatMs(t.start)}`)
          .join(', ')
      : '—';

  panel.querySelector('[data-section="session"]').innerHTML = `
    <div>Login: <strong>${session?.login || 'n/a'}</strong> (${session?.role || 'none'})</div>
    <div>Admin: ${session?.admin ? 'yes' : 'no'} · TTL: ${session?.ttlSeconds ?? 'n/a'}s</div>
    <div>Channel: ${getChannelParam() || 'default'}</div>
    <div>Long tasks: ${longTasks}</div>
  `;
  panel.querySelector('[data-section="api"]').innerHTML = apiRows || '<div class="muted">No calls</div>';
  panel.querySelector('[data-section="csp"]').innerHTML = cspRows || '<div class="muted">No CSP blocks</div>';
  panel.querySelector('[data-section="res"]').innerHTML = resRows || '<div class="muted">No resource errors</div>';
  panel.querySelector('[data-section="overlay"]').textContent = overlay;
  panel.querySelector('[data-section="assets"]').textContent = assets;
}

function attachDebugUI() {
  if (document.getElementById('debug-drawer')) return;
  const btn = document.createElement('button');
  btn.id = 'debug-toggle';
  btn.textContent = 'DEBUG';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '12px',
    right: '12px',
    zIndex: '10000',
    background: '#0f172a',
    color: '#fff',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    opacity: '0.7',
  });
  btn.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
  btn.addEventListener('mouseleave', () => (btn.style.opacity = '0.7'));
  btn.addEventListener('click', () => {
    const panel = document.getElementById('debug-drawer');
    if (!panel) return;
    const isOpen = panel.dataset.open === '1';
    panel.dataset.open = isOpen ? '0' : '1';
    panel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) renderDebugPanel();
  });

  const panel = document.createElement('div');
  panel.id = 'debug-drawer';
  panel.dataset.open = '0';
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '50px',
    right: '12px',
    width: '360px',
    maxHeight: '70vh',
    overflowY: 'auto',
    background: '#0b1220',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '10px',
    fontSize: '12px',
    display: 'none',
    zIndex: '9999',
    boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
  });
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <strong>Debug</strong>
      <div style="display:flex;gap:6px;">
        <button data-action="refresh">Auth</button>
        <button data-action="clear">Clear</button>
        <button data-action="overlay">Overlay</button>
        <button data-action="assets">Assets</button>
      </div>
    </div>
    <div class="section"><div class="title">Session</div><div data-section="session"></div></div>
    <div class="section"><div class="title">Overlay</div><div data-section="overlay"></div></div>
    <div class="section"><div class="title">Assets</div><div data-section="assets"></div></div>
    <div class="section"><div class="title">API (last 10)</div><div data-section="api"></div></div>
    <div class="section"><div class="title">CSP</div><div data-section="csp"></div></div>
    <div class="section"><div class="title">Resources</div><div data-section="res"></div></div>
  `;
  panel.querySelectorAll('button[data-action]').forEach((b) => {
    b.style.fontSize = '11px';
    b.style.padding = '2px 6px';
  });
  panel.addEventListener('click', async (e) => {
    const act = e.target.dataset.action;
    if (!act) return;
    if (act === 'refresh') {
      debugState.session = await fetchAuthDebug().catch(() => debugState.session);
      renderDebugPanel();
    } else if (act === 'clear') {
      debugState.apiLog = [];
      debugState.cspEvents = [];
      debugState.resourceErrors = [];
      debugState.longTasks = [];
      renderDebugPanel();
    } else if (act === 'overlay') {
      runOverlayHealth();
    } else if (act === 'assets') {
      runAssetCheck();
    }
  });
  panel.querySelectorAll('.section .title').forEach((t) => {
    t.style.fontWeight = '700';
    t.style.marginBottom = '2px';
  });
  document.body.appendChild(btn);
  document.body.appendChild(panel);
}

// Hook API logging
const __apiCallOriginal = apiCall;
apiCall = async function apiCallWithLog(endpoint, options = {}) {
  const started = performance.now();
  try {
    const res = await __apiCallOriginal(endpoint, options);
    logApiCall({ endpoint, ok: true, status: 'ok', ms: performance.now() - started });
    return res;
  } catch (err) {
    logApiCall({
      endpoint,
      ok: false,
      status: err?.message?.match(/HTTP (\\d+)/)?.[1] || 'err',
      ms: performance.now() - started,
      error: err?.message || String(err),
    });
    throw err;
  }
};
window.apiCall = apiCall;
