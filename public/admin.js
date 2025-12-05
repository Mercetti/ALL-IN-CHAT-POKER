/**
 * Admin dashboard JavaScript
 */

let currentEditingProfile = null;
let adminSocket = null;
let streamerLogin = '';
let botAdminLogin = '';
let useUserToken = false;
let adminSocketReady = false;
const NOT_CONNECTED_MSG = 'Not connected to server. Please refresh and try again.';
const channelParam = typeof getChannelParam === 'function' ? getChannelParam() : '';
const adjustLoginInput = document.getElementById('adjust-login');
const adjustAmountInput = document.getElementById('adjust-amount');
const adjustModeSelect = document.getElementById('adjust-mode');
const adjustButton = document.getElementById('btn-adjust-balance');
const isEventForChannel = (payload) => {
  if (!payload || !payload.channel) return true;
  return payload.channel === channelParam;
};

function decodeUserLogin(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const pad = payload.length % 4 === 2 ? '==' : payload.length % 4 === 3 ? '=' : '';
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/') + pad));
    return data.user || data.login || null;
  } catch (e) {
    return null;
  }
}

async function loadPublicConfig() {
  try {
    const res = await fetch('/public-config.json');
    if (res.ok) {
      const cfg = await res.json();
      streamerLogin = (cfg.streamerLogin || '').toLowerCase();
      botAdminLogin = (cfg.botAdminLogin || '').toLowerCase();
    }
  } catch (e) {
    // ignore
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPublicConfig();

  // Check if logged in (admin token or streamer user token)
  const adminToken = getToken();
  const userToken = getUserToken();
  const userLogin = decodeUserLogin(userToken || '');
  let allowed = false;

  if (adminToken) {
    allowed = true;
  } else if (userToken && userLogin) {
    const lower = userLogin.toLowerCase();
    // Allow if matches configured streamer or bot admin login
    if ((streamerLogin && lower === streamerLogin) || (botAdminLogin && lower === botAdminLogin)) {
      allowed = true;
    } else {
      // Fallback: check profile role via user token
      try {
        const profileRes = await apiCall(`/profile?login=${encodeURIComponent(userLogin)}`, { useUserToken: true });
        if (profileRes?.profile?.role === 'streamer' || profileRes?.profile?.role === 'admin') {
          allowed = true;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!allowed) {
    window.location.href = '/login.html';
    return;
  }

  useUserToken = !adminToken && !!userToken;
  window.__DEFAULT_USE_USER_TOKEN = useUserToken;

  // Load initial data
  await loadStats();
  await loadProfiles();
  await loadAuditLog();

  // Setup event listeners
  setupEventListeners();
  initSocket();

  // Refresh data every 30 seconds
  setInterval(loadStats, 30000);
  setInterval(loadProfiles, 60000);
  setInterval(loadAuditLog, 60000);
});

async function ensureSocketConnected() {
  if (!adminSocket) initSocket();
  if (adminSocket?.connected) return true;

  return new Promise((resolve) => {
    if (!adminSocket) {
      resolve(false);
      return;
    }
    const socket = adminSocket;
    const cleanup = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      clearTimeout(timeout);
    };
    const onConnect = () => {
      cleanup();
      resolve(true);
    };
    const onError = () => {
      cleanup();
      resolve(false);
    };
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 4000);
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
    try {
      socket.connect();
      Toast.info('Connecting to server...');
    } catch (e) {
      cleanup();
      resolve(false);
    }
  });
}

function setupEventListeners() {
  // Start round
  document.getElementById('btn-admin-start-round')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    adminSocket.emit('startRound', {});
    Toast.info('Betting window opened / round starting...');
  });

  // Start now (skip timer)
  document.getElementById('btn-admin-start-now')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    adminSocket.emit('startRound', { startNow: true });
    Toast.success('Round starting now');
  });

  // Process draw
  document.getElementById('btn-admin-draw')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    adminSocket.emit('forceDraw', { held: [] });
    Toast.info('Processing draw...');
  });

  // Reset game
  document.getElementById('btn-reset-game')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    if (!confirm('Are you sure you want to reset the game state?')) return;
    // For now, reset triggers a fresh round start
    adminSocket.emit('startRound', { reset: true });
    Toast.warning('Game reset initiated');
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    clearToken();
    clearUserToken();
    window.location.href = '/login.html';
  });

  // Export
  document.getElementById('btn-export')?.addEventListener('click', async () => {
    try {
      const data = await apiCall('/export', { method: 'GET' });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poker-export-${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('Export downloaded');
    } catch (err) {
      Toast.error('Export failed: ' + err.message);
    }
  });

  // Profiles search
  document.getElementById('profiles-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#profiles-table-body tr');
    rows.forEach(row => {
      const username = row.querySelector('td')?.textContent.toLowerCase();
      row.style.display = username?.includes(query) ? '' : 'none';
    });
  });

  // Refresh profiles
  document.getElementById('btn-refresh-profiles')?.addEventListener('click', loadProfiles);

  // Modal buttons
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-save')?.addEventListener('click', saveProfile);

  if (adjustButton) {
    adjustButton.addEventListener('click', async () => {
      const login = (adjustLoginInput?.value || '').trim().toLowerCase();
      const amount = Number(adjustAmountInput?.value || 0);
      const mode = (adjustModeSelect?.value || 'add').toLowerCase();
      if (!login) {
        Toast.error('Player username required');
        return;
      }
      if (!Number.isFinite(amount)) {
        Toast.error('Amount required');
        return;
      }
      try {
        const res = await apiCall('/admin/balance', {
          method: 'POST',
          body: JSON.stringify({ login, amount, mode }),
        });
        Toast.success(`Balance ${mode === 'set' ? 'set' : 'added'} for ${login}: ${res.balance}`);
        loadProfiles();
        loadStats();
      } catch (err) {
        Toast.error('Balance update failed: ' + err.message);
      }
    });
  }

  document.getElementById('btn-save-mode')?.addEventListener('click', saveMode);

  // Open overlay (OBS)
  document.getElementById('btn-open-obs-overlay')?.addEventListener('click', () => {
    const base = typeof getBackendBase === 'function' ? getBackendBase() : window.location.origin;
    window.open(`${base}/obs-overlay.html`, '_blank', 'noopener');
  });
}

async function loadStats() {
  try {
    const profiles = await apiCall('/admin/profiles', { method: 'GET' });
    const balances = await apiCall('/balances.json', { method: 'GET' });
    const stats = await apiCall('/stats.json', { method: 'GET' });

    document.getElementById('stat-total-players').textContent = Object.keys(profiles).length;

    const totalBalance = Object.values(balances || {}).reduce((a, b) => a + b, 0);
    document.getElementById('stat-total-balance').textContent = totalBalance.toLocaleString();

    // Find top winner
    let topWinner = { login: '-', totalWon: 0 };
    Object.entries(stats || {}).forEach(([login, stat]) => {
      if (stat.totalWon > topWinner.totalWon) {
        topWinner = { login, totalWon: stat.totalWon };
      }
    });
    document.getElementById('stat-top-winner').textContent = topWinner.login;

    // Biggest win
    const biggestWin = Math.max(...Object.values(stats || {}).map(s => s.biggestWin || 0));
    document.getElementById('stat-biggest-win').textContent = biggestWin || '0';
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadProfiles() {
  try {
    const profiles = await apiCall('/admin/profiles', { method: 'GET' });
    const balances = await apiCall('/balances.json', { method: 'GET' });
    const stats = await apiCall('/stats.json', { method: 'GET' });

    const tbody = document.getElementById('profiles-table-body');
    if (!tbody) return;

    tbody.innerHTML = profiles
      .map(
        profile => `
      <tr>
        <td>${profile.login}</td>
        <td>${profile.display_name}</td>
        <td>${balances?.[profile.login] || 0}</td>
        <td>${stats?.[profile.login]?.roundsWon || 0}</td>
        <td>${stats?.[profile.login]?.totalWon || 0}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-info btn-sm" onclick="editProfile('${profile.login}')">
              Edit
            </button>
            <button class="btn btn-secondary btn-sm" onclick="viewProfile('${profile.login}')">
              View
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load profiles:', err);
  }
}

async function loadAuditLog() {
  try {
    const audit = await apiCall('/admin/audit?limit=20', { method: 'GET' });
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = (audit || [])
      .map(
        entry => `
      <tr>
        <td>${new Date(entry.created_at).toLocaleString()}</td>
        <td>${entry.actor}</td>
        <td>${entry.target_username || entry.target_ip}</td>
        <td>${entry.target_username ? 'Username' : 'IP'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteAudit(${entry.id})">
            Delete
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load audit log:', err);
  }
}

function editProfile(login) {
  currentEditingProfile = login;
  document.getElementById('edit-login').value = login;
  document.getElementById('edit-display-name').value = '';
  document.getElementById('edit-starting-chips').value = '1000';
  document.getElementById('edit-profile-modal').classList.add('active');
  document.getElementById('edit-profile-modal').style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('edit-profile-modal');
  modal.classList.remove('active');
  modal.style.display = 'none';
  currentEditingProfile = null;
}

async function saveProfile() {
  if (!currentEditingProfile) return;

  const displayName = document.getElementById('edit-display-name').value;
  const startingChips = document.getElementById('edit-starting-chips').value;

  try {
    await apiCall(`/admin/profile/${currentEditingProfile}`, {
      method: 'POST',
      body: JSON.stringify({
        display_name: displayName,
        settings: { startingChips: parseInt(startingChips, 10) },
      }),
    });

    Toast.success('Profile saved');
    closeModal();
    loadProfiles();
  } catch (err) {
    Toast.error('Save failed: ' + err.message);
  }
}

function viewProfile(login) {
  window.location.href = `/profile.html?user=${login}`;
}

async function deleteAudit(id) {
  if (!confirm('Delete this audit entry?')) return;

  try {
    await apiCall(`/admin/audit/${id}`, { method: 'DELETE' });
    Toast.success('Entry deleted');
    loadAuditLog();
  } catch (err) {
    Toast.error('Delete failed: ' + err.message);
  }
}

// Export functions for onclick handlers
window.editProfile = editProfile;
window.viewProfile = viewProfile;
window.deleteAudit = deleteAudit;

function initSocket() {
  const socketUrl = typeof getBackendBase === 'function' ? getBackendBase() : '';
  adminSocket = io(socketUrl || undefined, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: useUserToken
      ? { token: getUserToken(), channel: channelParam }
      : { channel: channelParam },
  });

  adminSocket.on('connect', () => {
    adminSocketReady = true;
    Toast.success('Admin socket connected');
  });

  adminSocket.on('disconnect', () => {
    adminSocketReady = false;
    Toast.warning('Admin socket disconnected');
  });

  adminSocket.on('error', (err) => {
    console.error('Socket error:', err);
    Toast.error(typeof err === 'string' ? err : 'Server error');
  });

  adminSocket.on('roundStarted', (data) => {
    if (!isEventForChannel(data)) return;
    Toast.info('Round started');
  });

  adminSocket.on('roundResult', (data) => {
    if (!isEventForChannel(data)) return;
    if (data?.evaluation) {
      Toast.success(`Round result: ${data.evaluation.name}`);
    }
    updateQueue(data.waiting || []);
    setAdminPhase('Showdown');
  });

  adminSocket.on('queueUpdate', (data) => {
    if (!isEventForChannel(data)) return;
    updateQueue(data.waiting || []);
  });

  adminSocket.on('bettingStarted', (data) => {
    if (!isEventForChannel(data)) return;
    startAdminCountdown(data.endsAt);
    setAdminPhase('Betting');
  });

  adminSocket.on('actionPhaseEnded', (data) => {
    if (!isEventForChannel(data)) return;
    startAdminCountdown(null);
    setAdminPhase('Action Ended');
  });

  adminSocket.on('pokerPhase', (data) => {
    if (!isEventForChannel(data)) return;
    if (data?.phase) setAdminPhase(data.phase);
  });

  adminSocket.on('pokerBetting', (data) => {
    if (!isEventForChannel(data)) return;
    const potEl = document.getElementById('admin-pot');
    const betEl = document.getElementById('admin-current-bet');
    const potVal = (data && data.pot) || 0;
    const betVal = (data && data.currentBet) || 0;
    if (potEl) potEl.textContent = potVal.toLocaleString?.() || potVal;
    if (betEl) {
      betEl.textContent = betVal.toLocaleString?.() || betVal;
      betEl.title = 'Current street bet to call';
    }
  });

  adminSocket.on('payouts', (data) => {
    const list = document.getElementById('admin-payouts');
    if (!list) return;
    const items = Object.entries(data?.payouts || {}).map(([name, amount]) => {
      const cls = amount > 0 ? 'gain-badge' : 'loss-badge';
      const formatted = (amount > 0 ? '+' : '') + (amount.toLocaleString?.() || amount);
      return `<li><span>${name}</span><span class="badge ${cls}">${formatted}</span></li>`;
    }).join('');
    const before = (data?.leaderboard || []).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    const after = (data?.leaderboardAfter || []).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    const deltas = after.map(a => {
      const prev = before.find(b => b.login === a.login);
      const delta = prev ? a.chips - prev.chips : a.chips;
      return { login: a.login, delta };
    }).filter(d => d.delta !== 0);
    const deltaList = deltas.map(d => {
      const tooltip = d.delta > 0 ? 'Chips gained since last leaderboard' : 'Chips lost since last leaderboard';
      const formatted = (d.delta > 0 ? '+' : '') + (d.delta.toLocaleString?.() || d.delta);
      const cls = d.delta > 0 ? 'gain-badge' : 'loss-badge';
      return `<li title="${tooltip}"><span>${d.login}</span><span class="badge ${cls}">${formatted}</span></li>`;
    }).join('');
    list.innerHTML = items || '<li>No payouts</li>';
    if (deltaList) {
      list.innerHTML += `<li class="delta-sep">Leaderboard Δ</li>${deltaList}`;
    }
  });

  // Apply saved theme on load and toggle
  applyTheme();
  setThemeButtonLabel(document.getElementById('admin-theme-toggle'));
  const themeBtn = document.getElementById('admin-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = toggleTheme();
      Toast.info(`Theme: ${next}`);
      setThemeButtonLabel(themeBtn);
    });
  }

  // Load current mode
  loadMode();
}

function updateQueue(waiting) {
  const list = document.getElementById('queue-list');
  const badge = document.getElementById('queue-count');
  if (!list) return;
  list.innerHTML = waiting && waiting.length
    ? waiting.map(name => `<li>${name}</li>`).join('')
    : '<li>None</li>';
  if (badge) badge.textContent = waiting?.length || 0;
}

let adminCountdownTimer = null;
function startAdminCountdown(endsAt) {
  const el = document.getElementById('admin-countdown');
  if (!el) return;
  if (adminCountdownTimer) clearInterval(adminCountdownTimer);

  if (!endsAt) {
    el.textContent = '00:00';
    return;
  }

  const target = new Date(endsAt).getTime();
  const tick = () => {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const secs = Math.floor(diff / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
    if (diff <= 0) clearInterval(adminCountdownTimer);
  };
  tick();
  adminCountdownTimer = setInterval(tick, 1000);
}

function setAdminPhase(label) {
  const el = document.getElementById('admin-phase');
  if (!el) return;
  el.textContent = label || '-';
}

async function loadMode() {
  try {
    const data = await apiCall('/admin/mode', { method: 'GET' });
    const select = document.getElementById('game-mode');
    if (select && data?.mode) {
      select.value = data.mode;
    }
  } catch (err) {
    console.error('Failed to load mode', err);
  }
}

async function saveMode() {
  const select = document.getElementById('game-mode');
  if (!select) return;
  Toast.info('Mode is locked to blackjack');
}
