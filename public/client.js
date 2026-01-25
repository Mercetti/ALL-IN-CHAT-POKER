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
  // Use unified theme manager if available
  if (window.unifiedThemeManager) {
    return window.unifiedThemeManager.getCurrentTheme();
  }
  
  // Fallback to legacy storage
  return localStorage.getItem('app_theme') || 
         localStorage.getItem('theme') || 
         localStorage.getItem('theme-preference') || 'dark';
}

function applyTheme(theme) {
  // Use unified theme manager if available
  if (window.unifiedThemeManager) {
    return window.unifiedThemeManager.setTheme(theme);
  }
  
  // Fallback behavior
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
  // Use unified theme manager if available
  if (window.unifiedThemeManager) {
    return window.unifiedThemeManager.toggleTheme();
  }
  
  // Fallback behavior
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

// Initialize Toast when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Toast.init);
} else {
  Toast.init();
}

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
// Initialize debug tools (placeholder for now)
function initDebugTools() {
  console.log('Debug tools initialized');
}

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


function hasPrivilegedSession() {
  if (getToken() || getAdminBearer()) return true;
  return !!getUserToken();
}

window.apiCall = apiCall;
