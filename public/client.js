/**
 * Shared client utilities and Toast notification system
 */

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
  if (token) {
    document.cookie = `admin_jwt=${token}; path=/; secure; samesite=strict`;
  } else {
    document.cookie = 'admin_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
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
  const token = options.useUserToken ? getUserToken() : getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
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
