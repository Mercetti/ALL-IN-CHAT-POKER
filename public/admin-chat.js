/**
 * Admin-only chat page for MDN lookups
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  if (typeof enforceAuthenticatedPage === 'function' && !enforceAuthenticatedPage({ page: 'admin', markOkBadge: true })) return;

  const adminToken = getToken();
  const userToken = getUserToken();
  window.__DEFAULT_USE_USER_TOKEN = !adminToken && !!userToken;
  const pill = document.getElementById('session-pill');
  const refreshPill = () => {
    if (!pill || typeof getTokenStatus !== 'function') return;
    const state = getTokenStatus();
    if (state === 'ok') {
      pill.textContent = 'Session OK';
      pill.style.background = 'rgba(16,185,129,0.85)';
      pill.style.color = '#fff';
    } else if (state === 'warn') {
      pill.textContent = 'Session Check';
      pill.style.background = 'rgba(234,179,8,0.85)';
      pill.style.color = '#111';
    } else {
      pill.textContent = 'Session';
      pill.style.background = 'rgba(99,102,241,0.7)';
      pill.style.color = '#fff';
    }
  };
  refreshPill();
  setInterval(refreshPill, 30000);

  const chatLog = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const statusEl = document.getElementById('chat-status');
  const themeToggle = document.getElementById('chat-theme-toggle');
  const logoutBtn = document.getElementById('chat-logout');
  const scrapeToggle = document.getElementById('scrape-toggle');

  function appendMessage(author, text, url, snippet) {
    const row = document.createElement('div');
    row.className = `chat-row ${author === 'Bot' ? 'bot' : 'user'}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open MDN';
      bubble.appendChild(document.createElement('br'));
      bubble.appendChild(link);
    }
    if (snippet) {
      const snip = document.createElement('div');
      snip.className = 'chat-snippet';
      snip.textContent = snippet;
      bubble.appendChild(snip);
    }

    row.appendChild(bubble);
    chatLog.appendChild(row);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = (chatInput.value || '').trim();
    if (!message) return;

    appendMessage('You', message);
    chatInput.value = '';
    sendBtn.disabled = true;
    setStatus('Thinking...');

    try {
      const res = await apiCall('/admin/bot-chat', {
        method: 'POST',
        body: JSON.stringify({ message, scrape: !!(scrapeToggle && scrapeToggle.checked) }),
      });

      if (res && res.reply) {
        appendMessage('Bot', res.reply, res.url, res.snippet);
        setStatus(res.found === false ? 'No MDN match' : res.scraped ? 'Scraped MDN content' : 'Powered by MDN search');
      } else {
        setStatus('No response');
        Toast.warning('Bot did not return a response.');
      }
    } catch (err) {
      setStatus('Error talking to bot');
      Toast.error(`Failed to reach bot: ${err.message}`);
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

  if (themeToggle) {
    setThemeButtonLabel(themeToggle);
    themeToggle.addEventListener('click', () => {
      const next = toggleTheme();
      setThemeButtonLabel(themeToggle);
      Toast.info(`Theme: ${next}`);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearToken();
      clearUserToken();
      Toast.info('Logged out.');
      setTimeout(() => (window.location.href = '/login.html'), 200);
    });
  }

  appendMessage('Bot', 'Hi! Ask about a web API and I will pull the top MDN doc for you.');
  chatInput.focus();
});
