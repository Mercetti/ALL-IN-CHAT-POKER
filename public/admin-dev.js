/**
 * Dev-only admin page for partner + earn config and debug tools
 */

// Prefer user token if no admin cookie is present (mirrors admin-code/admin-chat behavior)
const __adminCookie = typeof getToken === 'function' ? getToken() : null;
const __userToken = typeof getUserToken === 'function' ? getUserToken() : null;
if (typeof window !== 'undefined') {
  window.__DEFAULT_USE_USER_TOKEN = !__adminCookie && !!__userToken;
}

let devSocket = null;
const overlayHealth = {
  status: 'disconnected',
  channel: (typeof getChannelParam === 'function' ? getChannelParam() : '') || 'default',
  lastAvatar: null,
  lastSettings: null,
};

const flagStoreKey = 'devFeatureFlags';
let lastState = null;

const el = (id) => document.getElementById(id);
const healthEls = {
  status: el('overlay-status'),
  channel: el('overlay-channel'),
  avatar: el('overlay-avatar-at'),
  settings: el('overlay-settings-at'),
  mode: el('overlay-mode'),
  round: el('overlay-round'),
  betting: el('overlay-betting'),
  potBet: el('overlay-pot-bet'),
  queue: el('overlay-queue'),
};
const roundDebugBody = el('round-debug-body');
const aiDiagOutput = el('ai-diagnosis-output');
const aiTestPlan = el('ai-test-plan');
const aiTestResults = el('ai-test-results');
const aiTestLast = el('ai-test-last-report');
const aiTestDiag = el('ai-test-diagnosis');
const opsSummaryEl = el('ops-summary');
const securitySummary = el('security-summary');
const securityDiagnosis = el('security-diagnosis');
const decodeUserLogin = (tok) => {
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

function formatTs(ts) {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return '-';
  }
}

function updateHealthDisplay() {
  if (healthEls.status) healthEls.status.textContent = overlayHealth.status;
  if (healthEls.channel) healthEls.channel.textContent = overlayHealth.channel || '-';
  if (healthEls.avatar) healthEls.avatar.textContent = formatTs(overlayHealth.lastAvatar);
  if (healthEls.settings) healthEls.settings.textContent = formatTs(overlayHealth.lastSettings);
  if (healthEls.mode) healthEls.mode.textContent = lastState?.mode || '-';
  const roundLabel = lastState
    ? `${lastState.roundInProgress ? 'In progress' : 'Idle'}${lastState.pokerPhase ? ` (${lastState.pokerPhase})` : ''}`
    : '-';
  if (healthEls.round) healthEls.round.textContent = roundLabel;
  if (healthEls.betting) healthEls.betting.textContent = lastState ? (lastState.bettingOpen ? 'Open' : 'Closed') : '-';
  if (healthEls.potBet) {
    const pot = lastState?.pot ?? lastState?.pokerPot ?? 0;
    const bet = lastState?.currentBet ?? lastState?.pokerCurrentBet ?? 0;
    healthEls.potBet.textContent = `${pot} / ${bet}`;
  }
  if (healthEls.queue) {
    const qLen = Array.isArray(lastState?.waitingQueue) ? lastState.waitingQueue.length : 0;
    healthEls.queue.textContent = `${qLen} queued`;
  }
}

function renderRoundDebug() {
  if (!roundDebugBody) return;
  if (!lastState) {
    roundDebugBody.textContent = 'Waiting for state...';
    return;
  }
  const waiting = Array.isArray(lastState.waitingQueue) ? lastState.waitingQueue : [];
  const players = Array.isArray(lastState.players) ? lastState.players : [];
  const community = Array.isArray(lastState.communityCards) ? lastState.communityCards : [];
  const dealerUp = lastState.dealerState?.hand?.[0] ? JSON.stringify(lastState.dealerState.hand[0]) : '-';
  const rows = [
    `<strong>Mode:</strong> ${lastState.mode || '-'} | <strong>Phase:</strong> ${lastState.pokerPhase || '-'}`,
    `<strong>Betting:</strong> ${lastState.bettingOpen ? 'Open' : 'Closed'} | <strong>Round:</strong> ${lastState.roundInProgress ? 'In progress' : 'Idle'}`,
    `<strong>Deck size:</strong> ${lastState.deck ?? lastState.deckSize ?? 0}`,
    `<strong>Pot / Bet:</strong> ${(lastState.pot ?? lastState.pokerPot) || 0} / ${(lastState.currentBet ?? lastState.pokerCurrentBet) || 0}`,
    `<strong>Community:</strong> ${community.length ? community.map(c => c.rank ? `${c.rank}${c.suit || ''}` : JSON.stringify(c)).join(', ') : '-'}`,
    `<strong>Dealer up:</strong> ${dealerUp}`,
    `<strong>Waiting queue (${waiting.length}):</strong> ${waiting.length ? waiting.join(', ') : '-'}`,
    `<strong>Players (${players.length}):</strong>`,
    `<ul>${players.map(p => `<li>${p.login} — bet: ${p.bet || 0}, balance: ${p.balance ?? ''}, hand: ${p.hand ? p.hand.length : 0} cards</li>`).join('')}</ul>`,
  ];
  roundDebugBody.innerHTML = rows.join('<br>');
}

async function requireAdmin() {
  const adminToken = typeof getToken === 'function' ? getToken() : null;
  const userToken = typeof getUserToken === 'function' ? getUserToken() : null;
  const userLogin = decodeUserLogin(userToken || '');
  // Loosen the gate: if we have any token, let the server APIs enforce auth.
  // Special-case mercetti to avoid redirect loops.
  if (adminToken) return true;
  if (userToken) return true;
  if (userLogin === 'mercetti') return true;
  const loginUrl =
    typeof buildLoginRedirectUrl === 'function'
      ? buildLoginRedirectUrl('/admin-dev.html')
      : '/login.html?redirect=%2Fadmin-dev.html';
  window.location.href = loginUrl;
  return false;
}

async function loadPartners() {
  const tbody = el('partner-table')?.querySelector('tbody');
  if (!tbody) return;
  try {
    const res = await apiCall('/admin/partners', { method: 'GET' });
    const list = Array.isArray(res?.partners) ? res.partners : Array.isArray(res) ? res : [];
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No data</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(p => `
        <tr>
          <td>${p.partner_id || p.id || ''}</td>
          <td>${(p.payout_pct ?? 0) * 100 || 0}%</td>
          <td>${p.order_count ?? 0}</td>
          <td>${p.coin_total ?? 0}</td>
          <td>${p.gross_usd ?? 0}</td>
          <td>${p.views ?? 0}</td>
        </tr>
      `)
      .join('');
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="6" class="muted">Failed to load</td></tr>';
  }
}

async function savePartner() {
  const id = el('partner-id')?.value || '';
  const name = el('partner-name')?.value || '';
  const pct = Number(el('partner-pct')?.value || 0);
  if (!id) return Toast.error('Partner id required');
  try {
    await apiCall('/admin/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: id, name, payout_pct: pct }),
    });
    Toast.success('Partner saved');
    loadPartners();
  } catch (e) {
    Toast.error('Save failed: ' + e.message);
  }
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderTaxForms(forms = []) {
  const tbody = el('tax-table')?.querySelector('tbody');
  if (!tbody) return;
  if (!forms.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="muted">No submissions</td></tr>';
    return;
  }
  tbody.innerHTML = forms
    .map(f => {
      const created = f.created_at ? new Date(f.created_at).toLocaleString() : '-';
      const download = f.id ? `<a href="/admin/partners/tax-forms/${f.id}/download" target="_blank" rel="noopener">Download</a>` : '-';
      return `
        <tr>
          <td>${f.id}</td>
          <td>${f.partner_id || ''}</td>
          <td>${f.full_name || ''}</td>
          <td>${f.country || ''}</td>
          <td>${f.form_type || ''}</td>
          <td>${f.status || ''}</td>
          <td>${created}</td>
          <td>${download}</td>
        </tr>
      `;
    })
    .join('');
}

  async function loadTaxForms() {
  try {
    const res = await apiCall('/admin/partners/tax-forms', { method: 'GET' });
    const list = Array.isArray(res?.forms) ? res.forms : Array.isArray(res) ? res : [];
    renderTaxForms(list);
  } catch (err) {
    console.error(err);
    renderTaxForms([]);
  }
}

async function submitTaxForm() {
  const partnerId = el('tax-partner-id')?.value || '';
  const fullName = el('tax-full-name')?.value || '';
  const address = el('tax-address')?.value || '';
  const country = el('tax-country')?.value || '';
  const payoutEmail = el('tax-email')?.value || '';
  const formType = el('tax-form-type')?.value || 'w9';
  const taxId = el('tax-id')?.value || '';
  const file = el('tax-file')?.files?.[0];
  if (!partnerId || !fullName || !payoutEmail || !file) {
    return Toast.error('Partner id, name, email, and file are required');
  }
  if (file.size > 8 * 1024 * 1024) {
    return Toast.error('File too large (max 8MB)');
  }
  try {
    const dataUrl = await fileToDataUrl(file);
    await apiCall('/admin/partners/tax-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId,
        fullName,
        address,
        country,
        payoutEmail,
        formType,
        taxId,
        fileName: file.name,
        fileData: dataUrl,
      }),
    });
    Toast.success('Tax form uploaded');
    loadTaxForms();
  } catch (err) {
    console.error(err);
    Toast.error('Upload failed: ' + err.message);
  }
}

async function loadPremierPending() {
  const tbody = el('premier-table')?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading...</td></tr>';
  try {
    const res = await apiCall('/admin/premier/pending', { method: 'GET' });
    const items = Array.isArray(res?.items) ? res.items : [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No pending items</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map(item => {
        const at = item.at ? new Date(item.at).toLocaleString() : '-';
        return `
          <tr>
            <td>${item.login || ''}</td>
            <td>${item.preset || ''}</td>
            <td>${at}</td>
            <td>
              <button class="btn btn-secondary btn-sm" data-action="test" data-login="${item.login}">Test</button>
              <button class="btn btn-primary btn-sm" data-action="approve" data-login="${item.login}">Approve</button>
              <button class="btn btn-secondary btn-sm" data-action="publish" data-login="${item.login}">Publish</button>
            </td>
          </tr>
        `;
      })
      .join('');
    tbody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const login = btn.dataset.login;
        const action = btn.dataset.action;
        try {
          if (action === 'test') {
            await apiCall('/admin/premier/test-apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: login }) });
            Toast.success('Test applied');
          } else if (action === 'approve') {
            await apiCall('/admin/premier/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login }) });
            Toast.success('Approved');
          } else if (action === 'publish') {
            await apiCall('/admin/premier/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login }) });
            Toast.success('Published');
          }
          loadPremierPending();
        } catch (err) {
          Toast.error(`${action} failed: ${err.message}`);
        }
      });
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Failed to load</td></tr>';
  }
}

async function importCosmetics() {
  const text = el('cosmetic-import-text')?.value || '';
  const status = el('cosmetic-import-status');
  if (!text.trim()) return Toast.error('Paste JSON first');
  try {
    const parsed = JSON.parse(text);
    const res = await apiCall('/admin/cosmetics/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    Toast.success(`Imported ${res?.imported || 0} items`);
    if (status) status.textContent = `Imported ${res?.imported || 0} items`;
  } catch (err) {
    console.error(err);
    Toast.error('Import failed: ' + err.message);
    if (status) status.textContent = 'Import failed';
  }
}

function loadEarnConfig() {
  const cfg = JSON.parse(localStorage.getItem('viewerEarnConfig') || '{}');
  const setVal = (id, def) => {
    const node = el(id);
    if (!node) return;
    node.value = cfg[id] !== undefined ? cfg[id] : def;
  };
  setVal('earn-chat-rate', 5);
  setVal('earn-chat-cap', 500);
  setVal('earn-follower', 25);
  setVal('earn-sub', 100);
  setVal('earn-raid', 250);
  setVal('earn-redeem', 25);
}

function saveEarnConfig() {
  const cfg = {
    'earn-chat-rate': Number(el('earn-chat-rate')?.value || 5),
    'earn-chat-cap': Number(el('earn-chat-cap')?.value || 500),
    'earn-follower': Number(el('earn-follower')?.value || 25),
    'earn-sub': Number(el('earn-sub')?.value || 100),
    'earn-raid': Number(el('earn-raid')?.value || 250),
    'earn-redeem': Number(el('earn-redeem')?.value || 25),
  };
  localStorage.setItem('viewerEarnConfig', JSON.stringify(cfg));
  Toast.success('Saved locally');
}

function openNewTab(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener');
}

async function connectSocket(force = false) {
  if (devSocket && devSocket.connected && !force) return devSocket;
  const socketUrl = typeof getBackendBase === 'function' ? getBackendBase() : '';
  devSocket = io(socketUrl || undefined, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: { channel: overlayHealth.channel },
  });

  devSocket.on('connect', () => {
    overlayHealth.status = 'connected';
    updateHealthDisplay();
    Toast.success('Dev socket connected');
  });

  devSocket.on('disconnect', () => {
    overlayHealth.status = 'disconnected';
    updateHealthDisplay();
    Toast.warning('Dev socket disconnected');
  });

  devSocket.on('overlaySettings', () => {
    overlayHealth.lastSettings = Date.now();
    updateHealthDisplay();
  });

  devSocket.on('playerUpdate', (payload) => {
    if (payload?.avatar) {
      overlayHealth.lastAvatar = Date.now();
      updateHealthDisplay();
    }
  });

  devSocket.on('error', (err) => {
    console.error('Socket error', err);
    Toast.error(typeof err === 'string' ? err : 'Socket error');
  });

  devSocket.on('state', (payload) => {
    lastState = {
      ...payload,
      pot: payload?.pot ?? payload?.pokerPot,
      currentBet: payload?.currentBet ?? payload?.pokerCurrentBet,
      waitingQueue: payload?.waitingQueue || payload?.waiting || [],
    };
    if (payload?.channel) overlayHealth.channel = payload.channel;
    updateHealthDisplay();
    renderRoundDebug();
  });

  updateHealthDisplay();
  return devSocket;
}

async function ensureSocketConnected() {
  const sock = await connectSocket();
  return !!(sock && sock.connected);
}

async function fetchSnapshot() {
  try {
    const res = await apiCall(`/admin/overlay-snapshot?channel=${encodeURIComponent(overlayHealth.channel)}`, { method: 'GET' });
    if (res?.snapshot) {
      lastState = {
        ...res.snapshot,
        pot: res.snapshot.pot ?? res.snapshot.state?.pot,
        currentBet: res.snapshot.currentBet ?? res.snapshot.state?.currentBet,
      };
      overlayHealth.channel = res.snapshot.channel || overlayHealth.channel;
      updateHealthDisplay();
      renderRoundDebug();
    }
    if (res?.lastDiagnosis?.reply && aiDiagOutput) {
      aiDiagOutput.textContent = `Last AI check (${new Date(res.lastDiagnosis.computedAt).toLocaleTimeString()}): ${res.lastDiagnosis.reply}`;
    }
    Toast.success('Snapshot refreshed');
  } catch (err) {
    console.error(err);
    Toast.error('Snapshot failed');
  }
}

async function loadPartnerSnapshot(opts = {}) {
  const tbody = el('partner-snapshot-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="muted">Loading...</td></tr>';
  try {
    const res = await apiCall(`/admin/partner/progress${opts.recompute ? '?recompute=1' : ''}`, { method: 'GET' });
    const rows = res?.rows || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">No data</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const goals = r.partner?.hardGates || r.goals || {};
        const goalCount = Object.values(goals).filter(g => (g.pass === undefined ? !!g : g.pass)).length;
        const win30 = r.windows?.win30 || {};
        const channel = r.channel || '';
        const profileHref = channel ? `/profile.html?user=${encodeURIComponent(channel)}` : '#';
        return `
          <tr>
            <td>${channel || '-'}</td>
            <td>${win30.streams || 0}</td>
            <td>${(win30.avgPlayersPerStream || 0).toFixed ? (win30.avgPlayersPerStream || 0).toFixed(1) : win30.avgPlayersPerStream || 0}</td>
            <td>${win30.uniquePlayers || 0}</td>
            <td>${win30.rounds || 0}</td>
            <td>${goalCount}</td>
            <td>${channel ? `<a href="${profileHref}" target="_blank" rel="noopener">Profile</a>` : '-'}</td>
          </tr>
        `;
      })
      .join('');
    Toast.success('Partner snapshot refreshed');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="7" class="muted">Failed to load</td></tr>';
    Toast.error('Snapshot fetch failed');
  }
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx];
    });
    return obj;
  });
}

async function importCosmeticsDev() {
  const input = (el('dev-import-input')?.value || '').trim();
  const statusEl = el('dev-import-status');
  if (!input) {
    if (statusEl) statusEl.textContent = 'No input provided';
    return Toast.error('Provide JSON or CSV');
  }
  let items = [];
  try {
    if (input.startsWith('[')) {
      items = JSON.parse(input);
    } else {
      items = parseCsv(input);
    }
    if (!Array.isArray(items) || !items.length) throw new Error('No items parsed');
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Parse error';
    return Toast.error('Parse error: ' + err.message);
  }

  try {
    const res = await apiCall('/admin/cosmetics/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (statusEl) statusEl.textContent = `Imported ${res?.imported || 0} items`;
    Toast.success('Import complete');
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = 'Import failed';
    Toast.error('Import failed: ' + err.message);
  }
}

async function exportPartnersCsv() {
  try {
    const res = await apiCall('/admin/partners', { method: 'GET' });
    const list = Array.isArray(res?.partners) ? res.partners : Array.isArray(res) ? res : [];
    if (!list.length) return Toast.warning('No partners to export');
    const headers = ['partner_id', 'display_name', 'payout_pct', 'order_count', 'coin_total', 'gross_usd', 'views'];
    const lines = [headers.join(',')];
    list.forEach(p => {
      lines.push(headers.map(h => p[h] ?? '').join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partners.csv';
    link.click();
    URL.revokeObjectURL(url);
    Toast.success('Exported partners.csv');
  } catch (err) {
    Toast.error('Export failed: ' + err.message);
  }
}

async function seedSampleCosmetics() {
  const sample = [
    { id: 'card-back-dev-emerald', type: 'cardBack', name: 'Dev Emerald', price_cents: 0, rarity: 'common', preview: '/assets/cosmetics/cards/emerald.png' },
    { id: 'card-face-dev-ace', type: 'cardFace', name: 'Dev Ace', price_cents: 0, rarity: 'common', preview: '/assets/cosmetics/cards/ace_of_spades.png', image_url: '/assets/cosmetics/cards/ace_of_spades.png' },
    { id: 'table-dev-grid', type: 'table', name: 'Dev Grid', price_cents: 0, rarity: 'rare', preview: '/assets/cosmetics/tables/green.png' },
  ];
  try {
    await apiCall('/admin/cosmetics/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: sample }),
    });
    Toast.success('Seeded sample cosmetics');
  } catch (err) {
    Toast.error('Seed failed: ' + err.message);
  }
}

function loadFlags() {
  const flags = JSON.parse(localStorage.getItem(flagStoreKey) || '{}');
  if (el('flag-drops')) el('flag-drops').checked = !!flags.drops;
  if (el('flag-avatar-refresh')) el('flag-avatar-refresh').checked = flags.avatarRefresh !== false;
  if (el('flag-deal-speed')) el('flag-deal-speed').value = flags.dealSpeed || 'normal';
}

function saveFlags() {
  const flags = {
    drops: !!el('flag-drops')?.checked,
    avatarRefresh: !!el('flag-avatar-refresh')?.checked,
    dealSpeed: el('flag-deal-speed')?.value || 'normal',
  };
  localStorage.setItem(flagStoreKey, JSON.stringify(flags));
  Toast.info('Feature toggles saved locally');
}

function clearLocalCaches() {
  localStorage.removeItem('viewerEarnConfig');
  localStorage.removeItem(flagStoreKey);
  Toast.success('Local caches cleared');
  loadFlags();
  loadEarnConfig();
}

function clearHealth() {
  overlayHealth.lastAvatar = null;
  overlayHealth.lastSettings = null;
  updateHealthDisplay();
  Toast.info('Health counters cleared');
}

async function resetOverlaySettings() {
  const ready = await ensureSocketConnected();
  if (!ready) return Toast.error('Socket not connected');
  devSocket.emit('overlaySettings', {});
  Toast.info('Overlay settings reset/ping sent');
}

async function sendStartRound(opts = {}) {
  const ready = await ensureSocketConnected();
  if (!ready) return Toast.error('Socket not connected');
  devSocket.emit('startRound', opts);
}

async function addTestBots() {
  const ready = await ensureSocketConnected();
  if (!ready) return Toast.error('Socket not connected');
  const autoBet = !!el('auto-bet-bots')?.checked;
  devSocket.emit('addTestBots', { count: 3, startNow: autoBet });
  Toast.success('Added test bots');
}

function goToProfile(viewOnly = false) {
  const login = (el('profile-search-login')?.value || '').trim().toLowerCase();
  if (!login) return Toast.error('Enter a username');
  const url = `/profile.html?user=${encodeURIComponent(login)}${viewOnly ? '&view=1' : ''}`;
  window.open(url, '_blank', 'noopener');
}

async function loadLastAiReport() {
  try {
    const res = await apiCall('/admin/ai-tests/report', { method: 'GET' });
    if (res?.report && aiTestLast) {
      const r = res.report;
      const ts = r.startedAt ? new Date(r.startedAt).toLocaleString() : '';
      aiTestLast.innerHTML = `<strong>Last scheduled/manual report (${r.kind || ''})</strong> ${ts}<br>${r.plan || ''}`;
      if (aiTestDiag && r.diagnosis) aiTestDiag.textContent = r.diagnosis;
    }
  } catch (err) {
    // ignore
  }
}

async function loadOpsSummary() {
  if (!opsSummaryEl) return;
  opsSummaryEl.textContent = 'Loading ops...';
  try {
    const res = await apiCall('/admin/ops-summary', { method: 'GET' });
    const parts = [];
    parts.push(`Bot: ${res.bot?.connected ? 'connected' : 'disconnected'} (channels: ${(res.bot?.channels || []).join(', ') || '-'})`);
    parts.push(`Synthetic: ${res.synthetic?.length ? JSON.stringify(res.synthetic[res.synthetic.length - 1]) : 'none'}`);
    parts.push(`Assets: ${res.assets?.length ? res.assets[res.assets.length - 1].results.map(r => `${r.asset}:${r.status}`).join(', ') : 'none'}`);
    parts.push(`Errors (latest): ${res.errors?.length ? res.errors.slice(-3).map(e => `${e.status}@${e.path}`).join(', ') : 'none'}`);
    parts.push(`Slow reqs: ${res.slow?.length || 0}`);
    parts.push(`Socket disconnects: ${res.socketDisconnects?.length || 0}`);
    parts.push(`DB backup: ${res.db?.lastBackup ? new Date(res.db.lastBackup.at).toLocaleString() : 'none'}`);
    parts.push(`Last vacuum: ${res.db?.lastVacuum ? new Date(res.db.lastVacuum.at).toLocaleString() : 'none'}`);
    parts.push(`Scheduler: last AI test date CST: ${res.scheduler?.lastAiTestRunDateCst || '-'}`);
    opsSummaryEl.innerHTML = parts.map(p => `<div>${p}</div>`).join('');
  } catch (err) {
    opsSummaryEl.textContent = 'Failed to load ops summary';
  }
}

async function loadSecuritySummary() {
  if (!securitySummary) return;
  securitySummary.textContent = 'Loading security...';
  try {
    const res = await apiCall('/admin/security-snapshot', { method: 'GET' });
    const snap = res?.snapshot;
    if (!snap) {
      securitySummary.textContent = 'No snapshot';
      return;
    }
    const parts = [];
    parts.push(`Blocked IPs: ${(snap.rateLimits?.blockedIps || []).length}`);
    parts.push(`Login attempts tracked: ${snap.rateLimits?.loginAttempts || 0}`);
    parts.push(`Recent errors: ${(snap.errors || []).length}`);
    parts.push(`Recent slow reqs: ${(snap.slow || []).length}`);
    parts.push(`Bot: ${snap.bot?.connected ? 'connected' : 'disconnected'} (channels: ${(snap.bot?.channels || []).join(', ') || '-'})`);
    parts.push(`Headers: CSP=${snap.headers?.csp ? 'on' : 'off'}, HSTS=${snap.headers?.hsts ? 'on' : 'off'}, CORS=${snap.headers?.cors || '*'}`);
    parts.push(`Integrity hashes: ${snap.integrity ? 'ok' : 'n/a'}`);
    securitySummary.innerHTML = parts.map(p => `<div>${p}</div>`).join('');
  } catch (err) {
    securitySummary.textContent = 'Failed to load security snapshot';
  }
}

function updateSupabaseEdgeStatus() {
  const pill = document.getElementById('supabase-edge-pill');
  if (!pill) return;
  const raw = localStorage.getItem('supabaseEdgeResult');
  if (!raw) {
    pill.textContent = 'Supabase: -';
    pill.className = 'pill muted';
    return;
  }
  try {
    const data = JSON.parse(raw);
    const ts = data.at ? new Date(data.at).toLocaleTimeString() : '';
    if (data.ok) {
      pill.textContent = `Supabase: ok ${ts}`;
      pill.className = 'pill success';
    } else {
      pill.textContent = `Supabase: failed ${ts}`;
      pill.className = 'pill warning';
    }
  } catch {
    pill.textContent = 'Supabase: -';
    pill.className = 'pill muted';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await requireAdmin();
  if (!ok) return;

  const sessionPill = document.getElementById('session-pill');
  const refreshSessionPill = () => {
    if (!sessionPill || typeof getTokenStatus !== 'function') return;
    const state = getTokenStatus();
    if (state === 'ok') {
      sessionPill.textContent = 'Session OK';
      sessionPill.style.background = 'rgba(16, 185, 129, 0.85)';
      sessionPill.style.color = '#fff';
    } else if (state === 'warn') {
      sessionPill.textContent = 'Session Check';
      sessionPill.style.background = 'rgba(234, 179, 8, 0.85)';
      sessionPill.style.color = '#111';
    } else {
      sessionPill.textContent = 'Session';
      sessionPill.style.background = 'rgba(99, 102, 241, 0.7)';
      sessionPill.style.color = '#fff';
    }
  };
  refreshSessionPill();
  setInterval(refreshSessionPill, 30000);
  updateSupabaseEdgeStatus();

  updateHealthDisplay();
  loadFlags();
  loadEarnConfig();
  loadPartners();
  loadTaxForms();
  loadPremierPending();
  loadPartnerSnapshot();
  loadLastAiReport();
  loadOpsSummary();
  loadSecuritySummary();

  el('btn-save-partner')?.addEventListener('click', savePartner);
  el('btn-refresh-partners')?.addEventListener('click', loadPartners);
  el('btn-submit-tax')?.addEventListener('click', submitTaxForm);
  el('btn-premier-refresh')?.addEventListener('click', loadPremierPending);
  el('btn-import-cosmetics')?.addEventListener('click', importCosmetics);
  el('btn-save-earn')?.addEventListener('click', saveEarnConfig);

  el('btn-open-audit')?.addEventListener('click', () => openNewTab('/admin/audit?limit=200'));
  el('btn-open-task-status')?.addEventListener('click', () => openNewTab('/admin/partner/progress'));
  el('btn-open-error-tail')?.addEventListener('click', () => openNewTab('/admin/audit?limit=50'));

  el('btn-connect-overlay')?.addEventListener('click', () => connectSocket(true));
  el('btn-ping-overlay')?.addEventListener('click', resetOverlaySettings);
  el('btn-refresh-state')?.addEventListener('click', fetchSnapshot);

  el('btn-open-profile')?.addEventListener('click', () => goToProfile(false));
  el('btn-open-profile-view')?.addEventListener('click', () => goToProfile(true));

  el('btn-refresh-snapshot')?.addEventListener('click', () => loadPartnerSnapshot({ recompute: false }));
  el('btn-recompute-snapshot')?.addEventListener('click', () => loadPartnerSnapshot({ recompute: true }));

  el('btn-import-cosmetics-dev')?.addEventListener('click', importCosmeticsDev);
  el('btn-export-partners')?.addEventListener('click', exportPartnersCsv);
  el('btn-seed-cosmetics')?.addEventListener('click', seedSampleCosmetics);

  el('btn-open-betting-dev')?.addEventListener('click', () => sendStartRound({}));
  el('btn-start-now-dev')?.addEventListener('click', () => sendStartRound({ startNow: true }));
  el('btn-add-bots-dev')?.addEventListener('click', addTestBots);
  el('btn-diagnose-ai')?.addEventListener('click', async () => {
    try {
      if (aiDiagOutput) aiDiagOutput.textContent = 'Running AI check...';
      const res = await apiCall('/admin/overlay-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: overlayHealth.channel }),
      });
      if (res?.diagnosis?.reply && aiDiagOutput) {
        aiDiagOutput.textContent = res.diagnosis.reply;
      }
      Toast.success('AI diagnosis complete');
    } catch (err) {
      console.error(err);
      if (aiDiagOutput) aiDiagOutput.textContent = 'AI diagnosis failed';
      Toast.error('AI diagnosis failed');
    }
  });
  el('btn-refresh-state')?.addEventListener('click', fetchSnapshot);

  el('flag-drops')?.addEventListener('change', saveFlags);
  el('flag-avatar-refresh')?.addEventListener('change', saveFlags);
  el('flag-deal-speed')?.addEventListener('change', saveFlags);

  el('btn-reset-overlay')?.addEventListener('click', resetOverlaySettings);
  el('btn-clear-cache')?.addEventListener('click', clearLocalCaches);
  el('btn-clear-health')?.addEventListener('click', clearHealth);

  el('btn-run-ai-tests')?.addEventListener('click', async () => {
    try {
      if (aiTestPlan) aiTestPlan.textContent = 'Planning tests...';
      if (aiTestResults) aiTestResults.textContent = 'Running...';
      const res = await apiCall('/admin/ai-tests', { method: 'POST' });
      if (aiTestPlan) aiTestPlan.textContent = res?.plan || 'No plan returned';
      if (aiTestResults) {
        aiTestResults.innerHTML = (res?.results || [])
          .map(r => `<div><strong>${r.cmd}</strong> (code ${r.code}, ${r.durationMs}ms)<pre>${(r.output || '').slice(0, 2000)}</pre></div>`)
          .join('');
      }
      if (aiTestDiag && res?.diagnosis) aiTestDiag.textContent = res.diagnosis;
      Toast.success('AI tests finished');
      loadLastAiReport();
    } catch (err) {
      console.error(err);
      if (aiTestResults) aiTestResults.textContent = 'AI tests failed';
      Toast.error('AI tests failed');
    }
  });

  el('btn-ops-refresh')?.addEventListener('click', loadOpsSummary);
  el('btn-run-synthetic')?.addEventListener('click', async () => {
    await apiCall('/admin/ops/run-synthetic', { method: 'POST' });
    Toast.success('Synthetic check triggered');
    loadOpsSummary();
  });
  el('btn-asset-check')?.addEventListener('click', async () => {
    await apiCall('/admin/ops/asset-check', { method: 'POST' });
    Toast.success('Asset check triggered');
    loadOpsSummary();
  });
  el('btn-db-backup')?.addEventListener('click', async () => {
    await apiCall('/admin/ops/db-backup', { method: 'POST' });
    Toast.success('DB backup started');
    loadOpsSummary();
  });
  el('btn-db-vacuum')?.addEventListener('click', async () => {
    await apiCall('/admin/ops/vacuum', { method: 'POST' });
    Toast.success('VACUUM requested');
    loadOpsSummary();
  });

  el('btn-security-refresh')?.addEventListener('click', loadSecuritySummary);
  el('btn-security-ai')?.addEventListener('click', async () => {
    if (securityDiagnosis) securityDiagnosis.textContent = 'Running AI security review...';
    try {
      const res = await apiCall('/admin/security-diagnose', { method: 'POST' });
      if (securityDiagnosis) securityDiagnosis.textContent = res?.diagnosis || 'No diagnosis';
      Toast.success('AI security review complete');
    } catch (err) {
      console.error(err);
      if (securityDiagnosis) securityDiagnosis.textContent = 'AI security review failed';
      Toast.error('AI security review failed');
    }
  });
});
