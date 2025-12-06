/**
 * Login page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  const twitchLoginBtn = document.getElementById('twitch-login-btn');
  const twitchRedirectUri = `${window.location.origin}/login.html`;
  let twitchConfig = null;

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
    if (!twitchConfig) twitchConfig = await loadTwitchConfig();
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
          // Bot or streamer can hop straight to admin, others to overlay
          const login = (result.login || '').toLowerCase();
          const role = (result.role || '').toLowerCase();
          const isAdminRole = role === 'streamer' || role === 'admin';
          const isConfiguredAdmin =
            login &&
            twitchConfig &&
            (login === (twitchConfig.streamerLogin || '').toLowerCase() ||
              login === (twitchConfig.botAdminLogin || '').toLowerCase());

          if (isAdminRole || isConfiguredAdmin) {
            window.location.href = '/admin2.html';
            return;
          }

          // Offer to set streamer role on first login
          const wantStreamer = window.confirm('Are you the streamer? Choose OK to enable the streamer panel.');
          if (wantStreamer) {
            apiCall('/user/role', {
              method: 'POST',
              body: JSON.stringify({ role: 'streamer' }),
            })
              .then(() => {
                window.location.href = '/admin2.html';
              })
              .catch(() => {
                window.location.href = '/index.html';
              });
          } else {
            window.location.href = '/index.html';
          }
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
});
