/**
 * Dev-only admin page for partner + earn config
 */

async function requireAdmin() {
  const adminToken = getToken && getToken();
  if (!adminToken) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

async function loadPartners() {
  const tbody = document.getElementById('partner-table')?.querySelector('tbody');
  if (!tbody) return;
  try {
    const res = await apiCall('/admin/partners', { method: 'GET' });
    if (!Array.isArray(res)) throw new Error('Invalid data');
    if (!res.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No data</td></tr>';
      return;
    }
    tbody.innerHTML = res
      .map(p => `
        <tr>
          <td>${p.partner_id || ''}</td>
          <td>${p.payout_pct ?? 10}%</td>
          <td>${p.order_count ?? 0}</td>
          <td>${p.coin_total ?? 0}</td>
          <td>${p.gross_usd ?? 0}</td>
          <td>${p.views ?? 0}</td>
        </tr>
      `)
      .join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">Failed to load</td></tr>';
  }
}

async function savePartner() {
  const id = document.getElementById('partner-id')?.value || '';
  const name = document.getElementById('partner-name')?.value || '';
  const pct = Number(document.getElementById('partner-pct')?.value || 0);
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

function loadEarnConfig() {
  const cfg = JSON.parse(localStorage.getItem('viewerEarnConfig') || '{}');
  const setVal = (id, def) => {
    const el = document.getElementById(id);
    if (el && cfg[id] !== undefined) el.value = cfg[id];
    else if (el) el.value = def;
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
    'earn-chat-rate': Number(document.getElementById('earn-chat-rate')?.value || 5),
    'earn-chat-cap': Number(document.getElementById('earn-chat-cap')?.value || 500),
    'earn-follower': Number(document.getElementById('earn-follower')?.value || 25),
    'earn-sub': Number(document.getElementById('earn-sub')?.value || 100),
    'earn-raid': Number(document.getElementById('earn-raid')?.value || 250),
    'earn-redeem': Number(document.getElementById('earn-redeem')?.value || 25),
  };
  localStorage.setItem('viewerEarnConfig', JSON.stringify(cfg));
  Toast.success('Saved locally');
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await requireAdmin();
  if (!ok) return;
  loadEarnConfig();
  loadPartners();
  document.getElementById('btn-save-partner')?.addEventListener('click', savePartner);
  document.getElementById('btn-refresh-partners')?.addEventListener('click', loadPartners);
  document.getElementById('btn-save-earn')?.addEventListener('click', saveEarnConfig);
});
