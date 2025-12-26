/**
 * Login page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  const twitchLoginBtn = document.getElementById('twitch-login-btn');
  const twitchRedirectUri = `${window.location.origin}/login.html`;
  let twitchConfig = null;
  let desiredRole = (localStorage.getItem('loginRole') || 'player').toLowerCase();
  // background refresh of user JWT every 20 minutes
  setInterval(() => refreshUserTokenIfNeeded(), 20 * 60 * 1000);

  const roleButtons = Array.from(document.querySelectorAll('.role-option'));
  const roleNote = document.getElementById('role-note');

  function setRole(role) {
    desiredRole = role;
    localStorage.setItem('loginRole', role);
    roleButtons.forEach(btn => {
      const isActive = btn.dataset.role === role;
      btn.classList.toggle('active', isActive);
    });
    if (roleNote) {
      roleNote.textContent = role === 'streamer'
        ? 'Streamers get the admin panel; players can still join via chat.'
        : 'Players go to their profile for cosmetics and purchases.';
    }
  }

  if (roleButtons.length) {
    setRole(desiredRole);
    roleButtons.forEach(btn => {
      btn.addEventListener('click', () => setRole(btn.dataset.role || 'player'));
    });
  }

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

  function clearHash() {
    if (window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
  }

  // If already signed in, skip login page
  async function autoRedirectIfSignedIn() {
    const existing = getUserToken && getUserToken();
    if (!existing) return;
    try {
      // Try to fetch link/status to infer role; if it fails, fall back to desiredRole
      const status = await apiCall('/auth/link/status', { useUserToken: true, noAuthBounce: true });
      const role = (status?.role || '').toLowerCase();
      redirectAfterLogin(role || desiredRole);
    } catch (err) {
      redirectAfterLogin(desiredRole);
    }
  }

  function redirectAfterLogin(roleHint = 'player') {
    const role = (roleHint || desiredRole || 'player').toLowerCase();
    const wantsAdmin = (desiredRole || '').toLowerCase() === 'streamer';
    const isStreamer = role === 'streamer';
    const isAdminRole = role === 'streamer' || role === 'admin';
    if (isAdminRole || wantsAdmin) {
      const isDev = role === 'admin';
      window.location.href = isDev ? '/admin-dev.html' : '/admin2.html';
    } else {
      window.location.href = '/profile.html';
    }
  }

  // If user already has a token, skip the login UI
  autoRedirectIfSignedIn();

  // Twitch login button
  twitchLoginBtn.addEventListener('click', async () => {
    const cfg = await loadTwitchConfig();
    if (!cfg || !cfg.twitchClientId) {
      Toast.error('Twitch OAuth not configured on server');
      return;
    }
    const cleanRedirect = (cfg.redirectUri || twitchRedirectUri || '').trim().replace(/\\+$/, '');
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${encodeURIComponent(
      cfg.twitchClientId
    )}&redirect_uri=${encodeURIComponent(cleanRedirect)}&response_type=token&scope=user:read:email`;
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

  // Handle Twitch redirect back with access token in URL hash
  (async () => {
    const twitchToken = parseTwitchTokenFromHash();
    if (!twitchToken) return;
    clearHash();
    if (!twitchConfig) twitchConfig = await loadTwitchConfig();
    const existingUserToken = getUserToken();
    Toast.info(existingUserToken ? 'Linking Twitch to your account...' : 'Signing in with Twitch...');
    try {
      if (existingUserToken) {
        await apiCall('/auth/link/twitch', {
          method: 'POST',
          body: JSON.stringify({ twitchToken }),
          useUserToken: true,
        });
        Toast.success('Twitch linked to your account');
        refreshLinkStatus();
        return;
      }

      const result = await apiCall('/user/login', {
        method: 'POST',
        body: JSON.stringify({ twitchToken }),
      });
      if (result.token) {
        setUserToken(result.token);
        Toast.success(`Signed in as ${result.login}`);
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

          const goAdmin = async () => {
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
            window.location.href = '/admin2.html';
          };

          const goPlayer = () => {
            window.location.href = '/profile.html';
          };

          if (isAdminRole || isConfiguredAdmin || desiredRole === 'streamer') {
            goAdmin();
            return;
          }

          goPlayer();
        }, 300);
      }
    } catch (err) {
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
        const resp = await apiCall('/auth/login', {
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
          setTimeout(() => redirectAfterLogin(forcedRole), 150);
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
      if (password.length < 8) {
        Toast.error('Password must be at least 8 characters');
        return;
      }
      try {
        const resp = await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ login, email, password }),
          noAuthBounce: true,
        });
        if (resp.token) {
          setUserToken(resp.token);
          Toast.success(`Account created for ${login}`);
          refreshLinkStatus();
          const roleHint = (resp.profile?.role || '').toLowerCase();
          setTimeout(() => redirectAfterLogin(roleHint || desiredRole), 150);
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
          Toast.success('Password reset. Signed in.');
          setTimeout(() => redirectAfterLogin(roleHint), 150);
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
