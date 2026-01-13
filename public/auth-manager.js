/**
 * Unified Authentication Manager
 * Consolidates localStorage and cookie-based authentication into a single system
 */

class AuthManager {
  constructor() {
    this.USER_TOKEN_KEY = 'poker_user_token';
    this.ADMIN_TOKEN_KEY = 'poker_admin_token';
    this.TOKEN_REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes
    this.init();
  }

  init() {
    // Start token refresh interval
    setInterval(() => this.refreshTokensIfNeeded(), this.TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Set user token (localStorage-based)
   */
  setUserToken(token) {
    if (token) {
      localStorage.setItem(this.USER_TOKEN_KEY, token);
      this.updateTokenBadge('ok', 'user');
    } else {
      localStorage.removeItem(this.USER_TOKEN_KEY);
      this.updateTokenBadge('none');
    }
  }

  /**
   * Get user token
   */
  getUserToken() {
    return localStorage.getItem(this.USER_TOKEN_KEY);
  }

  /**
   * Set admin token (cookie-based for server-side access)
   */
  setAdminToken(token) {
    if (token) {
      const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
      document.cookie = `${this.ADMIN_TOKEN_KEY}=${token}; path=/; samesite=strict${secureFlag}`;
      this.updateTokenBadge('ok', 'admin');
    } else {
      document.cookie = `${this.ADMIN_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; samesite=strict`;
      this.updateTokenBadge('none');
    }
  }

  /**
   * Get admin token from cookie
   */
  getAdminToken() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith(`${this.ADMIN_TOKEN_KEY}=`));
    return cookie ? cookie.split('=')[1] : null;
  }

  /**
   * Get admin bearer token (localStorage fallback)
   */
  getAdminBearer() {
    return localStorage.getItem('admin_bearer');
  }

  /**
   * Set admin bearer token (localStorage fallback)
   */
  setAdminBearer(token) {
    if (token) {
      localStorage.setItem('admin_bearer', token);
    } else {
      localStorage.removeItem('admin_bearer');
    }
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated() {
    return !!this.getUserToken();
  }

  /**
   * Check if admin is authenticated
   */
  isAdminAuthenticated() {
    return !!(this.getAdminToken() || this.getAdminBearer());
  }

  /**
   * Get current authentication state
   */
  getAuthState() {
    const hasUser = this.isUserAuthenticated();
    const hasAdmin = this.isAdminAuthenticated();
    
    return {
      isAuthenticated: hasUser || hasAdmin,
      isUser: hasUser,
      isAdmin: hasAdmin,
      userToken: this.getUserToken(),
      adminToken: this.getAdminToken(),
      adminBearer: this.getAdminBearer()
    };
  }

  /**
   * Clear all authentication tokens
   */
  clearAllTokens() {
    this.setUserToken(null);
    this.setAdminToken(null);
    this.setAdminBearer(null);
  }

  /**
   * Refresh tokens if needed
   */
  async refreshTokensIfNeeded() {
    const authState = this.getAuthState();
    
    // Refresh user token
    if (authState.isUser) {
      try {
        const res = await this.apiCall('/auth/refresh', {
          method: 'POST',
          useUserToken: true,
          noAuthBounce: true,
        });
        if (res?.token) {
          this.setUserToken(res.token);
        }
      } catch (err) {
        console.warn('User token refresh failed:', err);
        this.updateTokenBadge('warn');
      }
    }
  }

  /**
   * API call helper (simplified version)
   */
  async apiCall(endpoint, options = {}) {
    const useUserToken = options.useUserToken !== false;
    const token = useUserToken ? this.getUserToken() : this.getAdminToken();
    const adminBearer = useUserToken ? null : this.getAdminBearer();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (adminBearer) {
      headers.Authorization = `Bearer ${adminBearer}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update token badge UI
   */
  updateTokenBadge(state, kind = null) {
    const badge = document.getElementById('token-status-badge');
    if (!badge) return;

    // Remove all state classes
    badge.classList.remove('badge-ok', 'badge-warn', 'badge-error');
    
    // Add appropriate state class
    badge.classList.add(`badge-${state}`);
    
    // Update badge text based on authentication state
    const authState = this.getAuthState();
    if (state === 'ok') {
      badge.textContent = kind === 'admin' ? 'ADMIN' : 'USER';
      badge.style.backgroundColor = kind === 'admin' ? '#22c55e' : '#3b82f6';
    } else if (state === 'warn') {
      badge.textContent = 'EXPIRING';
      badge.style.backgroundColor = '#f59e0b';
    } else {
      badge.textContent = 'NONE';
      badge.style.backgroundColor = '#ef4444';
    }
  }

  /**
   * Enforce authentication for protected pages
   */
  enforceAuthenticatedPage(options = {}) {
    if (typeof window === 'undefined') return true;
    
    const allowUser = options.allowUserToken !== false;
    const allowAdmin = options.allowAdminToken !== false;
    const authState = this.getAuthState();
    
    const hasUser = allowUser && authState.isUser;
    const hasAdmin = allowAdmin && authState.isAdmin;
    
    if (hasUser || hasAdmin) {
      if (options.markOkBadge) {
        this.updateTokenBadge('ok', hasAdmin ? 'admin' : 'user');
      }
      return true;
    }
    
    if (options.toast !== false && window.Toast) {
      Toast.warning('Please sign in to continue.');
    }
    
    const loginUrl = this.buildLoginRedirectUrl(options.nextPath);
    window.location.replace(loginUrl);
    return false;
  }

  /**
   * Build login redirect URL
   */
  buildLoginRedirectUrl(nextPath = '') {
    if (typeof window === 'undefined') return '/login.html';
    const target = nextPath || `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;
    const safeTarget = target.startsWith('/') ? target : `/${target}`.replace(/\/{2,}/g, '/');
    return `/login.html?redirect=${encodeURIComponent(safeTarget)}`;
  }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;

// Backward compatibility exports
window.getToken = () => authManager.getAdminToken();
window.setToken = (token) => authManager.setAdminToken(token);
window.clearToken = () => authManager.setAdminToken(null);
window.getUserToken = () => authManager.getUserToken();
window.setUserToken = (token) => authManager.setUserToken(token);
window.clearUserToken = () => authManager.setUserToken(null);
window.setAdminBearer = (token) => authManager.setAdminBearer(token);
window.getAdminBearer = () => authManager.getAdminBearer();
window.enforceAuthenticatedPage = (options) => authManager.enforceAuthenticatedPage(options);
window.buildLoginRedirectUrl = (nextPath) => authManager.buildLoginRedirectUrl(nextPath);

export default authManager;
