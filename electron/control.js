window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const chatBtn = document.getElementById('chat-btn');
  const codeBtn = document.getElementById('code-btn');
  const statusEl = document.getElementById('status');
  const testsBtn = document.getElementById('tests-btn');

  async function refreshStatus() {
    const status = await window.desktopApi.getBotStatus();
    statusEl.textContent = status.running
      ? `Status: running (pid ${status.pid || '?'})`
      : 'Status: stopped';
  }

  startBtn.addEventListener('click', async () => {
    await window.desktopApi.startBot();
    refreshStatus();
  });

  stopBtn.addEventListener('click', async () => {
    await window.desktopApi.stopBot();
    refreshStatus();
  });

  chatBtn.addEventListener('click', async () => {
    await window.desktopApi.openChat();
  });

  codeBtn.addEventListener('click', async () => {
    await window.desktopApi.openCode();
  });

  testsBtn.addEventListener('click', async () => {
    await window.desktopApi.runTests();
  });

  async function loginBackend() {
    const pwd = (passwordInput.value || '').trim();
    if (!pwd) {
      loginStatus.textContent = 'Enter a password.';
      return;
    }
    loginStatus.textContent = 'Logging in...';
    try {
      const res = await fetch(`${baseUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        loginStatus.textContent = data.error || 'Login failed';
        return;
      }
      loginStatus.textContent = 'Login successful. Cookies set for backend.';
    } catch (err) {
      loginStatus.textContent = `Login failed: ${err.message}`;
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', loginBackend);
  }

  window.addEventListener('bot-status', refreshStatus);
  refreshStatus();
});
  const loginBtn = document.getElementById('login-btn');
  const passwordInput = document.getElementById('admin-password');
  const loginStatus = document.getElementById('login-status');
  const baseUrl = new URLSearchParams(window.location.search).get('baseUrl') || 'http://localhost:3000';
