/**
 * Login page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  const twitchLoginBtn = document.getElementById('twitch-login-btn');
  const twitchRedirectUri = `${window.location.origin}/login.html`;
  let twitchConfig = null;
  let desiredRole = 'player'; // Default to player since we're not using OAuth
  const computePostLoginRedirect = () => {
    const role = (desiredRole || 'player').toLowerCase();
    if (redirectTarget) return redirectTarget;
    return role === 'streamer' ? '/admin-enhanced.html' : '/profile-enhanced.html';
  };
  const setPostLoginRedirect = () => {
    try {
      sessionStorage.setItem('postLoginRedirect', computePostLoginRedirect());
    } catch {
      /* ignore */
    }
  };
  const decodeLoginFromToken = (tok) => {
    if (!tok || typeof tok !== 'string') return '';
    try {
      const payload = tok.split('.')[1];
      const pad = payload.length % 4 === 2 ? '==' : payload.length % 4 === 3 ? '=' : '';
      const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/') + pad));
      return (data.user || data.login || '').toLowerCase();
    } catch {
      return '';
    }
  };
  const urlParams = new URLSearchParams(window.location.search || '');
  console.log('🔍 URL params:', window.location.search);
  console.log('🔍 return param:', urlParams.get('return'));
  console.log('🔍 redirect param:', urlParams.get('redirect'));
  const redirectTarget = (() => {
    // First check if we have a stored OAuth return URL (from OAuth flow)
    const storedReturn = sessionStorage.getItem('oauthReturnUrl');
    if (storedReturn) {
      console.log('🔍 Using stored OAuth return URL:', storedReturn);
      sessionStorage.removeItem('oauthReturnUrl'); // Clean up after using
      return storedReturn;
    }
    // Otherwise check URL parameters
    const r = urlParams.get('return') || urlParams.get('redirect') || '';
    console.log('🔍 raw return/redirect value:', r);
    if (!r) return '';
    try {
      const url = new URL(r, window.location.origin);
      if (url.origin !== window.location.origin) return '';
      const result = url.pathname + url.search + url.hash;
      console.log('🔍 parsed redirectTarget:', result);
      return result;
    } catch {
      return '';
    }
  })();
  console.log('🔍 final redirectTarget:', redirectTarget);
  // background refresh of user JWT every 20 minutes
  setInterval(() => refreshUserTokenIfNeeded(), 20 * 60 * 1000);

  // Remove role selection since we're not using OAuth
  const roleButtons = Array.from(document.querySelectorAll('.role-option'));
  const roleNote = document.getElementById('role-note');
  if (roleButtons.length > 0) {
    roleButtons.forEach(btn => {
      btn.style.display = 'none';
    });
  }
  if (roleNote) {
    roleNote.style.display = 'none';
  }

  setPostLoginRedirect();

  async function loadTwitchConfig() {
    if (twitchConfig) return twitchConfig;
    try {
      const res = await fetch('/public-config.json');
      if (!res.ok) throw new Error('config unavailable');
      twitchConfig = await res.json();
      return twitchConfig;
    } catch (err) {
      Toast.warning('Twitch OAuth not configured yet');
      return null;
    }
  }

  function parseTwitchTokenFromHash() {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return null;
    const params = new URLSearchParams(hash.slice(1));
    return params.get('access_token');
  }

  function parseTwitchCodeFromSearch() {
    const search = window.location.search || '';
    if (!search.startsWith('?')) return null;
    const params = new URLSearchParams(search.slice(1));
    return params.get('code');
  }

  function parseTwitchStateFromSearch() {
    const search = window.location.search || '';
    if (!search.startsWith('?')) return null;
    const params = new URLSearchParams(search.slice(1));
    return params.get('state');
  }

  function clearHash() {
    if (window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
  }

  // If already signed in, skip login page
  async function autoRedirectIfSignedIn() {
    console.log('🔍 autoRedirectIfSignedIn called');
    const existing = getUserToken && getUserToken();
    const existingLogin = decodeLoginFromToken(existing);
    console.log('🔍 autoRedirectIfSignedIn:', { existing: !!existing, existingLogin });
    if (!existing) return;
    try {
      // Try to fetch link/status to infer role; if it fails, fall back to desiredRole
      const status = await apiCall('/auth/link/status', { useUserToken: true, noAuthBounce: true });
      const role = (status?.role || '').toLowerCase();
      console.log('🔍 autoRedirectIfSignedIn: status fetched, redirecting');
      redirectAfterLogin(role || desiredRole, existingLogin);
    } catch (err) {
      console.log('🔍 autoRedirectIfSignedIn: status failed, using desiredRole');
      redirectAfterLogin(desiredRole, existingLogin);
    }
  }

  function redirectAfterLogin(roleHint = 'player', loginHint = '') {
    console.log('🔍 redirectAfterLogin called:', { roleHint, loginHint, redirectTarget, desiredRole });
    if (redirectTarget) {
      console.log('🔍 Redirecting to redirectTarget:', redirectTarget);
      window.location.href = redirectTarget;
      return;
    }
    const role = (roleHint || desiredRole || 'player').toLowerCase();
    const wantsAdmin = (desiredRole || '').toLowerCase() === 'streamer';
    const isStreamer = role === 'streamer';
    const isAdminRole = role === 'streamer' || role === 'admin';
    const loginLower = (loginHint || '').toLowerCase();
    if (loginLower === 'mercetti') {
      console.log('🔍 Redirecting mercetti to admin-enhanced.html');
      window.location.href = '/admin-enhanced.html';
      return;
    }
    if (isAdminRole || wantsAdmin) {
      const isDev = role === 'admin' || loginLower === 'mercetti';
      console.log('🔍 Redirecting admin/streamer to admin-enhanced.html');
      window.location.href = isDev ? '/admin-enhanced.html' : '/admin-enhanced.html';
    } else {
      console.log('🔍 Redirecting player to profile-enhanced.html');
      window.location.href = '/profile-enhanced.html';
    }
  }

  // If user already has a token, skip the login UI
  // But don't auto-redirect if we have a return URL (let OAuth flow handle it)
  console.log('🔍 Checking autoRedirect condition:', { redirectTarget: !!redirectTarget, redirectTargetValue: redirectTarget });
  if (!redirectTarget) {
    console.log('🔍 No redirectTarget, calling autoRedirectIfSignedIn');
    autoRedirectIfSignedIn();
  } else {
    console.log('🔍 Has redirectTarget, skipping autoRedirectIfSignedIn');
  }

  // Twitch login button
  twitchLoginBtn.addEventListener('click', async () => {
    const cfg = await loadTwitchConfig();
    if (!cfg || !cfg.twitchClientId) {
      Toast.error('Twitch OAuth not configured on server');
      return;
    }
    setPostLoginRedirect();
    // Store the current return URL in sessionStorage to preserve it through OAuth flow
    if (redirectTarget) {
      sessionStorage.setItem('oauthReturnUrl', redirectTarget);
      console.log('🔍 Stored OAuth return URL:', redirectTarget);
    }
    const cleanRedirect = (cfg.redirectUri || twitchRedirectUri || '').trim().replace(/\/+$/, '');
    // Use authorization code flow instead of implicit flow
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${encodeURIComponent(
      cfg.twitchClientId
    )}&redirect_uri=${encodeURIComponent(cleanRedirect)}&response_type=code&scope=user:read:email&state=twitch_auth`;
    window.location.href = authUrl;
  });

  async function refreshLinkStatus() {
    const statusEl = document.getElementById('link-status');
    if (!statusEl) return;
    const token = getUserToken();
    if (!token) {
      statusEl.textContent = 'Not signed in with site account yet.';
      return;
    }
    try {
      const data = await apiCall('/auth/link/status', { useUserToken: true });
      const twitchTxt = data.twitchLinked ? 'Twitch linked' : 'Twitch not linked';
      const discordTxt = data.discordLinked ? 'Discord linked' : 'Discord not linked';
      statusEl.textContent = `${twitchTxt} • ${discordTxt}`;
    } catch (err) {
      statusEl.textContent = 'Link status unavailable';
    }
  }

  // Handle Twitch redirect back with authorization code
  (async () => {
    const twitchCode = parseTwitchCodeFromSearch();
    const twitchState = parseTwitchStateFromSearch();
    console.log('🔍 Twitch OAuth check:', { 
      hasCode: !!twitchCode, 
      codeLength: twitchCode?.length,
      state: twitchState,
      search: window.location.search 
    });
    
    if (!twitchCode || twitchState !== 'twitch_auth') return;
    
    // Clear the URL parameters
    if (window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    if (!twitchConfig) twitchConfig = await loadTwitchConfig();
    const existingUserToken = getUserToken();
    Toast.info(existingUserToken ? 'Linking Twitch to your account...' : 'Signing in with Twitch...');
    try {
      // Always use the sign-in flow for now (skip linking to avoid the error)
      console.log('🔍 Calling /auth/twitch/token-exchange with authorization code...');
      const result = await apiCall('/auth/twitch/token-exchange', {
        method: 'POST',
        body: JSON.stringify({ code: twitchCode }),
      });
      console.log('🔍 /auth/twitch/token-exchange response:', result);
      
      if (result.token) {
        setUserToken(result.token);
        // Also set a cookie for server-side authentication
        const cookieValue = `user_jwt=${result.token}; path=/; max-age=${24 * 60 * 60}; samesite=strict`;
        document.cookie = cookieValue;
        console.log('🔍 Setting cookie:', cookieValue);
        console.log('🔍 Cookie after setting:', document.cookie);
        Toast.success(`Signed in as ${result.login}`);
        // Give cookie time to set before redirect
        setTimeout(() => {
          // Bot or streamer can hop straight to admin, others to overlay
          const login = (result.login || '').toLowerCase();
          const role = (result.role || '').toLowerCase();
          const isAdminRole = role === 'streamer' || role === 'admin';
          const isConfiguredAdmin =
            login &&
            twitchConfig &&
            (login === (twitchConfig.streamerLogin || '').toLowerCase() ||
              login === (twitchConfig.botAdminLogin || '').toLowerCase());

          console.log('🔍 Redirect logic:', { login, role, isAdminRole, isConfiguredAdmin, desiredRole });

          // Check if we have a redirect target first
          if (redirectTarget) {
            console.log('🔍 Redirecting to redirectTarget after login:', redirectTarget);
            window.location.href = redirectTarget;
            return;
          }

          const goAdmin = async () => {
            console.log('🔍 Going to admin panel...');
            if (!isAdminRole && !isConfiguredAdmin && desiredRole === 'streamer') {
              try {
                await apiCall('/user/role', {
                  method: 'POST',
                  body: JSON.stringify({ role: 'streamer' }),
                });
              } catch (e) {
                console.warn('Streamer role set failed', e);
              }
            }
            console.log('🔍 Redirecting to /admin-enhanced.html');
            window.location.href = '/admin-enhanced.html';
          };

          const goPlayer = () => {
            console.log('🔍 Going to player profile...');
            window.location.href = '/profile-enhanced.html';
          };

          if (isAdminRole || isConfiguredAdmin || desiredRole === 'streamer') {
            goAdmin();
            return;
          }

          goPlayer();
        }, 1000); // Increased timeout for cookie setting
      } else {
        console.error('🔍 No token in /user/login response:', result);
        Toast.error('Twitch sign-in failed: No token received');
      }
    } catch (err) {
      console.error('🔍 Twitch sign-in error:', err);
      Toast.error(`Twitch sign-in failed: ${err.message}`);
    }
  })();

  const themeBtn = document.getElementById('login-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = toggleTheme();
      Toast.info(`Theme: ${next}`);
    });
  }

  const resetBtn = document.getElementById('reset-session-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearToken();
      clearUserToken();
      Toast.info('Session cleared. Please sign in again.');
      refreshLinkStatus();
    });
  }

  const loginForm = document.getElementById('local-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const login = (formData.get('login') || '').trim();
      const password = (formData.get('password') || '').trim();
      if (!login || !password) {
        Toast.error('Username and password required');
        return;
      }
      try {
        const resp = await apiCall('/players/login', {
          method: 'POST',
          body: JSON.stringify({ login, password }),
          noAuthBounce: true,
        });
        if (resp.token) {
          setUserToken(resp.token);
          Toast.success(`Signed in as ${login}`);
          refreshLinkStatus();
          const roleHint = (resp.profile?.role || '').toLowerCase();
          const loginLower = (login || '').toLowerCase();

          // If the server says we must reset password, prompt immediately
          if (resp.forcePasswordReset) {
            const newPwd = window.prompt('Set a new password (min 8 chars):');
            if (!newPwd || newPwd.length < 8) {
              Toast.error('Password reset required. Please choose at least 8 characters.');
              return;
            }
            try {
              const resp2 = await apiCall('/auth/password', {
                method: 'POST',
                body: JSON.stringify({ oldPassword: password, newPassword: newPwd }),
                useUserToken: true,
                noAuthBounce: true,
              });
              if (resp2.token) {
                setUserToken(resp2.token);
              }
              Toast.success('Password updated.');
            } catch (err) {
              Toast.error(err.message || 'Password update failed');
              return;
            }
          }

          // Force admin redirect for known admin logins even if role hint is missing
          const forcedRole = loginLower === 'mercetti' ? 'admin' : roleHint || desiredRole;
          setTimeout(() => redirectAfterLogin(forcedRole, loginLower), 150);
        }
      } catch (err) {
        Toast.error(err.message || 'Login failed');
      }
    });
  }

  const registerForm = document.getElementById('local-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const login = (formData.get('login') || '').trim();
      const email = (formData.get('email') || '').trim();
      const password = (formData.get('password') || '').trim();
      if (!login || !password) {
        Toast.error('Username and password required');
        return;
      }
      if (!email) {
        Toast.error('Email is required for account verification');
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        Toast.error('Please enter a valid email address');
        return;
      }
      if (password.length < 8) {
        Toast.error('Password must be at least 8 characters');
        return;
      }
      try {
        const resp = await apiCall('/players/register', {
          method: 'POST',
          body: JSON.stringify({ login, email, password }),
          noAuthBounce: true,
        });
        if (resp.token) {
          setUserToken(resp.token);
          Toast.success(`Account created for ${login}`);
          refreshLinkStatus();
          const roleHint = (resp.profile?.role || '').toLowerCase();
          setTimeout(() => redirectAfterLogin(roleHint || desiredRole, login.toLowerCase()), 150);
        }
      } catch (err) {
        Toast.error(err.message || 'Registration failed');
      }
    });
  }

  const forgotBtn = document.getElementById('forgot-password-btn');
  const resetPanel = document.getElementById('reset-panel');
  const resetHint = document.getElementById('reset-hint');
  const resetRequestForm = document.getElementById('reset-request-form');
  const resetConfirmForm = document.getElementById('reset-confirm-form');

  if (forgotBtn && resetPanel) {
    forgotBtn.addEventListener('click', () => {
      const isHidden = resetPanel.style.display === 'none' || !resetPanel.style.display;
      resetPanel.style.display = isHidden ? 'block' : 'none';
    });
  }

  if (resetRequestForm) {
    resetRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const login = (resetRequestForm.querySelector('input[name=\"reset-login\"]')?.value || '').trim();
      if (!login) {
        Toast.error('Username required');
        return;
      }
      try {
        const resp = await apiCall('/auth/reset/request', {
          method: 'POST',
          body: JSON.stringify({ login }),
          noAuthBounce: true,
        });
        if (resetHint) {
          resetHint.style.display = 'block';
          if (resp.delivered) {
            resetHint.textContent = 'If the account exists, a reset link/token was delivered.';
          } else if (resp.token) {
            resetHint.textContent = `Reset token: ${resp.token} (valid ~15 min)`;
          } else {
            resetHint.textContent = 'If the account exists, a reset token was created.';
          }
        }
        if (!resp.delivered && resp.token) {
          const tokenInput = resetConfirmForm?.querySelector('input[name=\"reset-token\"]');
          if (tokenInput) tokenInput.value = resp.token;
        }
        Toast.success(resp.delivered ? 'Reset request sent' : 'Reset token generated');
      } catch (err) {
        Toast.error(err.message || 'Reset request failed');
      }
    });
  }

  if (resetConfirmForm) {
    resetConfirmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = (resetConfirmForm.querySelector('input[name=\"reset-token\"]')?.value || '').trim();
      const password = (resetConfirmForm.querySelector('input[name=\"reset-password\"]')?.value || '').trim();
      if (!token || !password) {
        Toast.error('Token and new password required');
        return;
      }
      if (password.length < 8) {
        Toast.error('Password must be at least 8 characters');
        return;
      }
      try {
        const resp = await apiCall('/auth/reset/confirm', {
          method: 'POST',
          body: JSON.stringify({ token, password }),
          noAuthBounce: true,
        });
        if (resp.token) {
          setUserToken(resp.token);
          const roleHint = (resp.profile?.role || desiredRole).toLowerCase();
          const loginHint = (resp.profile?.login || '').toLowerCase();
          Toast.success('Password reset. Signed in.');
          setTimeout(() => redirectAfterLogin(roleHint, loginHint), 150);
        } else {
          Toast.success('Password reset. Please sign in.');
        }
      } catch (err) {
        Toast.error(err.message || 'Reset failed');
      }
    });
  }

  const discordBtn = document.getElementById('discord-login-btn');
  if (discordBtn) {
    discordBtn.addEventListener('click', () => {
      Toast.info('Discord linking coming soon.');
    });
  }

  refreshLinkStatus();
});
