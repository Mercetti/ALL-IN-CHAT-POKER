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

async function apiCall(endpoint, options = {}) {
  const useUserToken = options.useUserToken !== undefined ? options.useUserToken : !!window.__DEFAULT_USE_USER_TOKEN;
  const token = useUserToken ? getUserToken() : getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
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
