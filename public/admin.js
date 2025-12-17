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
const lobbyCodeOutput = document.getElementById('lobby-code-output');
const lobbyLinks = document.getElementById('lobby-links');
const lobbyJoinInput = document.getElementById('lobby-join-input');
const devDealBaseInput = document.getElementById('dev-deal-base');
const devDealCardInput = document.getElementById('dev-deal-card');
const devChipVolumeInput = document.getElementById('dev-chip-volume');
const devPotGlowInput = document.getElementById('dev-pot-glow');
const devDisplay = {
  base: document.getElementById('dev-deal-base-val'),
  card: document.getElementById('dev-deal-card-val'),
  vol: document.getElementById('dev-chip-volume-val'),
  glow: document.getElementById('dev-pot-glow-val'),
};
const devCardVariant = document.getElementById('dev-card-variant');
const devCardTint = document.getElementById('dev-card-tint');
const devAvatarRing = document.getElementById('dev-avatar-ring');
const devProfileBorder = document.getElementById('dev-profile-border');
const devTableTint = document.getElementById('dev-table-tint');
const devTableLogo = document.getElementById('dev-table-logo');
const devAutoFillAi = document.getElementById('dev-auto-fill-ai');
const connectSubsBtn = document.getElementById('btn-connect-subs');
const overlayModal = document.getElementById('overlay-modal');
const overlayModalOpen = document.getElementById('btn-open-overlay-modal');
const overlayModalClose = document.getElementById('overlay-modal-close');
const addAiButton = document.getElementById('btn-add-ai');
const addAiStartButton = document.getElementById('btn-add-ai-start');
// Quick modal/popover elements (support both legacy ids and new compact popover ids)
// Inline highlight helper for quick-nav buttons
function focusSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  // Open details panels
  if (el.tagName.toLowerCase() === 'details') el.open = true;
  el.classList.add('pulse-highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => el.classList.remove('pulse-highlight'), 1400);
}

// Lightweight drawer to show quick sections in-place without moving DOM
let drawerOverlay = null;
let drawerPanel = null;
let drawerBody = null;
let drawerTitle = null;
function ensureDrawer() {
  if (drawerOverlay && drawerPanel && drawerBody && drawerTitle) return;
  drawerOverlay = document.createElement('div');
  drawerOverlay.id = 'quick-drawer-overlay';
  drawerOverlay.className = 'quick-drawer-overlay';
  drawerOverlay.style.display = 'none';

  drawerPanel = document.createElement('div');
  drawerPanel.id = 'quick-drawer';
  drawerPanel.className = 'quick-drawer';

  const header = document.createElement('div');
  header.className = 'quick-drawer-header';
  drawerTitle = document.createElement('div');
  drawerTitle.id = 'quick-drawer-title';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-secondary btn-sm';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', closeDrawer);
  header.appendChild(drawerTitle);
  header.appendChild(closeBtn);

  drawerBody = document.createElement('div');
  drawerBody.id = 'quick-drawer-body';
  drawerBody.className = 'quick-drawer-body';

  drawerPanel.appendChild(header);
  drawerPanel.appendChild(drawerBody);
  drawerOverlay.appendChild(drawerPanel);
  document.body.appendChild(drawerOverlay);

  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) closeDrawer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}

function closeDrawer() {
  if (!drawerOverlay) return;
  drawerOverlay.style.display = 'none';
  drawerBody.innerHTML = '';
}

function openDrawerForSection(sectionId) {
  ensureDrawer();
  const section = document.getElementById(sectionId);
  if (!drawerOverlay || !drawerBody || !drawerTitle) return;
  if (!section) {
    drawerTitle.textContent = 'Not found';
    drawerBody.innerHTML = `<div style="padding:8px;">Section "${sectionId}" not found.</div>`;
  } else {
    const isDetails = section.tagName.toLowerCase() === 'details';
    const titleText = isDetails
      ? (section.querySelector('summary')?.textContent?.trim() || section.dataset.title || sectionId)
      : (section.dataset.title || sectionId);
    drawerTitle.textContent = titleText;
    drawerBody.innerHTML = section.innerHTML;
  }
  drawerOverlay.style.display = 'flex';
}

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

  // Loosen gate: if either token exists, let the page load and let API calls/auth enforce server-side.
  // This avoids redirect loops when Twitch login succeeds but role lookup fails temporarily.
  let allowed = !!(adminToken || userToken);
  let roleWarning = '';

  if (!adminToken && userToken && userLogin) {
    const lower = userLogin.toLowerCase();
    if ((streamerLogin && lower === streamerLogin) || (botAdminLogin && lower === botAdminLogin)) {
      allowed = true;
    } else {
      try {
        const profileRes = await apiCall(`/profile?login=${encodeURIComponent(userLogin)}`, { useUserToken: true });
        if (profileRes?.profile?.role === 'streamer' || profileRes?.profile?.role === 'admin') {
          allowed = true;
        } else {
          roleWarning = 'Viewer role token; some admin actions may be blocked.';
        }
      } catch (e) {
        // Permit but warn; server will enforce if unauthorized.
        roleWarning = 'Role check unavailable; continuing with viewer token.';
      }
    }
  }

  if (!allowed) {
    window.location.href = '/login.html';
    return;
  }

  useUserToken = !adminToken && !!userToken;
  window.__DEFAULT_USE_USER_TOKEN = useUserToken;
  if (roleWarning) {
    Toast.warning(roleWarning, 4000);
  }

  // Load initial data
  await loadStats();
  await loadProfiles();
  await loadAuditLog();

  // Setup event listeners
  setupEventListeners();
  initSocket();
  updateDevDisplays();

  // Refresh data every 30 seconds
  setInterval(loadStats, 30000);
  setInterval(loadProfiles, 60000);
  setInterval(loadAuditLog, 60000);
});

// Fallback delegated handler to ensure popover always opens for quick buttons
document.addEventListener('click', (e) => {
  const btn = e.target?.closest?.('[data-open-section]');
  if (!btn) return;
  ensurePopover();
  const targetId = btn.dataset.openSection || 'unknown';
  try { console.debug('[admin] delegated quick button', targetId); } catch (err) { /* ignore */ }
  quickModalBody.innerHTML = `<div style="padding:8px;">Loading ${targetId}...</div>`;
  quickModal.style.position = 'fixed';
  quickModal.style.top = '90px';
  quickModal.style.left = '24px';
  quickModal.style.width = 'min(92vw, 1040px)';
  quickModal.style.zIndex = 6000;
  quickModal.style.opacity = '1';
  quickModal.style.pointerEvents = 'auto';
  quickModal.style.display = 'block';
  quickModal.classList.add('active');
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
  ensurePopover();

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

  addAiButton?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    adminSocket.emit('addTestBots', { count: 3 });
    Toast.info('Added AI test players (3)');
  });

  addAiStartButton?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    adminSocket.emit('addTestBots', { count: 3, startNow: true });
    Toast.success('AI players added and round starting');
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

  // Tournament helpers
  document.getElementById('btn-gen-bracket')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) return Toast.error(NOT_CONNECTED_MSG);
    const round = Number(document.getElementById('t-round')?.value || 1);
    const tableSize = Number(document.getElementById('t-table-size')?.value || 6);
    const playersRaw = document.getElementById('t-players')?.value || '';
    const players = playersRaw.split(',').map(p => p.trim()).filter(Boolean);
    try {
      const res = await apiCall('/admin/tournaments/' + encodeURIComponent(getChannelParam() || 't') + '/bracket', {
        method: 'POST',
        body: JSON.stringify({ round, tableSize, players }),
      });
      Toast.success('Bracket generated');
      console.log('Bracket', res);
    } catch (e) {
      Toast.error('Bracket failed: ' + e.message);
    }
  });

  document.getElementById('btn-bootstrap-round')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) return Toast.error(NOT_CONNECTED_MSG);
    const round = Number(document.getElementById('t-round')?.value || 1);
    const tableSize = Number(document.getElementById('t-table-size')?.value || 6);
    try {
      const res = await apiCall('/admin/tournaments/' + encodeURIComponent(getChannelParam() || 't') + '/bootstrap-round', {
        method: 'POST',
        body: JSON.stringify({ round, tableSize }),
      });
      Toast.success('Round bootstrapped');
      console.log('Bootstrap', res);
    } catch (e) {
      Toast.error('Bootstrap failed: ' + e.message);
    }
  });

  document.getElementById('btn-bind-table')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) return Toast.error(NOT_CONNECTED_MSG);
    const channel = document.getElementById('t-channel')?.value || '';
    const table = Number(document.getElementById('t-table-num')?.value || 1);
    try {
      const res = await apiCall('/admin/tournaments/' + encodeURIComponent(getChannelParam() || 't') + '/table/' + table + '/bind', {
        method: 'POST',
        body: JSON.stringify({ channel }),
      });
      Toast.success('Table bound to channel');
      console.log('Bind', res);
    } catch (e) {
      Toast.error('Bind failed: ' + e.message);
    }
  });

  document.getElementById('btn-ready-ping')?.addEventListener('click', async () => {
    const channel = document.getElementById('t-ready-channel')?.value || '';
    if (!channel) return Toast.error('Channel required');
    try {
      const res = await apiCall('/table/ready', {
        method: 'POST',
        body: JSON.stringify({ channel }),
        useUserToken: true,
      });
      const el = document.getElementById('ready-status');
      if (el) el.textContent = `Ready: ${res.ready} (${res.readyCount}/${res.required})${res.started ? ' · started' : ''}`;
      Toast.info(res.started ? 'All ready - round starting' : 'Ready submitted');
    } catch (e) {
      Toast.error('Ready failed: ' + e.message);
    }
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    clearToken();
    clearUserToken();
    window.location.href = '/login.html';
  });

  document.getElementById('btn-reset-session')?.addEventListener('click', () => {
    clearToken();
    clearUserToken();
    Toast.info('Session cleared; please sign in again.');
    window.location.href = '/login.html';
  });

  document.querySelectorAll('[data-open-section]')?.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.openSection;
      // Also scroll to the section in-page for quick context
      focusSection(target);
      // And open the drawer with the section contents for immediate controls
      openDrawerForSection(target);
    });
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

  // Create lobby
  document.getElementById('btn-create-lobby')?.addEventListener('click', async () => {
    try {
      const res = await apiCall('/admin/lobby', { method: 'POST' });
      if (res?.code) {
        if (lobbyCodeOutput) lobbyCodeOutput.value = res.code;
        if (lobbyLinks) {
          lobbyLinks.innerHTML = `Admin: <a href="${res.adminUrl}" target="_blank" rel="noopener">${res.adminUrl}</a> | Overlay: <a href="${res.overlayUrl}" target="_blank" rel="noopener">${res.overlayUrl}</a>`;
        }
      }
    } catch (err) {
      Toast.error('Failed to create lobby: ' + err.message);
    }
  });

  // Copy lobby code
  document.getElementById('btn-copy-lobby')?.addEventListener('click', () => {
    if (lobbyCodeOutput && lobbyCodeOutput.value) {
      navigator.clipboard?.writeText(lobbyCodeOutput.value);
      Toast.success('Lobby code copied');
    }
  });

  // Join lobby
  document.getElementById('btn-join-lobby')?.addEventListener('click', () => {
    const code = (lobbyJoinInput?.value || '').trim();
    if (!code) {
      Toast.error('Enter a lobby code');
      return;
    }
    const target = `/admin2.html?channel=${encodeURIComponent(code)}`;
    window.location.href = target;
  });

  // Developer overlay tuning inputs
  [devDealBaseInput, devDealCardInput, devChipVolumeInput, devPotGlowInput].forEach((input) => {
    if (input) input.addEventListener('input', updateDevDisplays);
  });
  [devCardVariant, devCardTint, devAvatarRing, devProfileBorder, devTableTint, devTableLogo].forEach((input) => {
    if (input && input.tagName === 'SELECT') input.addEventListener('change', updateDevDisplays);
    else if (input) input.addEventListener('input', updateDevDisplays);
  });

  document.getElementById('btn-apply-overlay-settings')?.addEventListener('click', async () => {
    const ready = await ensureSocketConnected();
    if (!ready) {
      Toast.error(NOT_CONNECTED_MSG);
      return;
    }
    const settings = getDevSettingsFromInputs();
    adminSocket.emit('overlaySettings', settings);
    Toast.success('Overlay settings pushed');
  });

  connectSubsBtn?.addEventListener('click', () => {
    const url = `/auth/twitch/subs?channel=${encodeURIComponent(channelParam || '')}`;
    window.open(url, '_blank', 'width=700,height=800');
    Toast.info('Opening Twitch consent in a new window...');
  });

  overlayModalOpen?.addEventListener('click', () => {
    if (overlayModal) overlayModal.classList.add('active');
  });
  overlayModalClose?.addEventListener('click', () => {
    if (overlayModal) overlayModal.classList.remove('active');
  });
  overlayModal?.addEventListener('click', (e) => {
    if (e.target === overlayModal) overlayModal.classList.remove('active');
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

  adminSocket.on('overlaySettings', (data) => {
    if (!isEventForChannel(data)) return;
    setDevInputs(data?.settings || {});
  });

  document.getElementById('btn-refresh-catalog')?.addEventListener('click', async () => {
    try {
      await apiCall('/catalog', { method: 'GET' });
      Toast.success('Catalog reloaded from server');
    } catch (err) {
      Toast.error('Catalog reload failed: ' + err.message);
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

function updateDevDisplays() {
  if (devDealBaseInput && devDisplay.base) devDisplay.base.textContent = Number(devDealBaseInput.value).toFixed(2);
  if (devDealCardInput && devDisplay.card) devDisplay.card.textContent = Number(devDealCardInput.value).toFixed(2);
  if (devChipVolumeInput && devDisplay.vol) devDisplay.vol.textContent = Number(devChipVolumeInput.value).toFixed(2);
  if (devPotGlowInput && devDisplay.glow) devDisplay.glow.textContent = Number(devPotGlowInput.value).toFixed(1);
  // no display spans for colors; input UI shows current value
}

function setDevInputs(settings = {}) {
  if (devDealBaseInput && typeof settings.dealDelayBase === 'number') devDealBaseInput.value = settings.dealDelayBase;
  if (devDealCardInput && typeof settings.dealDelayPerCard === 'number') devDealCardInput.value = settings.dealDelayPerCard;
  if (devChipVolumeInput && typeof settings.chipVolume === 'number') devChipVolumeInput.value = settings.chipVolume;
  if (devPotGlowInput && typeof settings.potGlowMultiplier === 'number') devPotGlowInput.value = settings.potGlowMultiplier;
  if (devCardVariant && typeof settings.cardBackVariant === 'string') devCardVariant.value = settings.cardBackVariant;
  if (devCardTint && typeof settings.cardBackTint === 'string') devCardTint.value = settings.cardBackTint;
  if (devAvatarRing && typeof settings.avatarRingColor === 'string') devAvatarRing.value = settings.avatarRingColor;
  if (devProfileBorder && typeof settings.profileCardBorder === 'string') devProfileBorder.value = settings.profileCardBorder;
  if (devTableTint && typeof settings.tableTint === 'string') devTableTint.value = settings.tableTint;
  if (devTableLogo && typeof settings.tableLogoColor === 'string') devTableLogo.value = settings.tableLogoColor;
  if (devAutoFillAi && typeof settings.autoFillAi === 'boolean') devAutoFillAi.checked = settings.autoFillAi;
  updateDevDisplays();
}

function getDevSettingsFromInputs() {
  return {
    dealDelayBase: Number(devDealBaseInput?.value || 0.18),
    dealDelayPerCard: Number(devDealCardInput?.value || 0.08),
    chipVolume: Number(devChipVolumeInput?.value || 0.16),
    potGlowMultiplier: Number(devPotGlowInput?.value || 5),
    cardBackVariant: (devCardVariant?.value || 'default').toLowerCase(),
    cardBackTint: devCardTint?.value || undefined,
    avatarRingColor: devAvatarRing?.value || undefined,
    profileCardBorder: devProfileBorder?.value || undefined,
    tableTint: devTableTint?.value || undefined,
    tableLogoColor: devTableLogo?.value || undefined,
    autoFillAi: !!devAutoFillAi?.checked,
  };
}

async function saveMode() {
  const select = document.getElementById('game-mode');
  if (!select) return;
  Toast.info('Mode is locked to blackjack');
}
