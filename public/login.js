/**
 * Login page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const passwordStrength = document.getElementById('password-strength');
  const errorMessage = document.getElementById('error-message');
  const loginBtn = document.getElementById('login-btn');
  const twitchLoginBtn = document.getElementById('twitch-login-btn');
  const twitchRedirectUri = `${window.location.origin}/login.html`;
  let twitchConfig = null;

  async function loadTwitchConfig() {
    if (twitchConfig) return twitchConfig;
    try {
      const res = await fetch('/public-config.json');
      if (!res.ok) throw new Error('config unavailable');
      const data = await res.json();
      twitchConfig = data;
      return data;
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

  // Password strength indicator
  passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    passwordStrength.className = 'password-strength';
    if (strength <= 2) {
      passwordStrength.classList.add('weak');
    } else if (strength <= 3) {
      passwordStrength.classList.add('fair');
    } else {
      passwordStrength.classList.add('good');
    }
  });

  // Login form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    if (!password) {
      Toast.error('Password required');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
      const result = await apiCall('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (result.token) {
        setToken(result.token);
        Toast.success('Login successful!');
        setTimeout(() => {
          window.location.href = '/admin2.html';
        }, 500);
      }
    } catch (err) {
      errorMessage.textContent = err.message;
      errorMessage.style.display = 'block';
      Toast.error('Login failed: ' + err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });

  // Twitch login button
  twitchLoginBtn.addEventListener('click', async () => {
    const cfg = await loadTwitchConfig();
    if (!cfg || !cfg.twitchClientId) {
      Toast.error('Twitch OAuth not configured on server');
      return;
    }
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${encodeURIComponent(
      cfg.twitchClientId
    )}&redirect_uri=${encodeURIComponent(cfg.redirectUri || twitchRedirectUri)}&response_type=token&scope=user:read:email`;
    window.location.href = authUrl;
  });

  // Handle Twitch redirect back with access token in URL hash
  (async () => {
    const twitchToken = parseTwitchTokenFromHash();
    if (!twitchToken) return;
    clearHash();
    Toast.info('Signing in with Twitch...');
    try {
      const result = await apiCall('/user/login', {
        method: 'POST',
        body: JSON.stringify({ twitchToken }),
      });
      if (result.token) {
        setUserToken(result.token);
        Toast.success(`Signed in as ${result.login}`);
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 500);
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
});
