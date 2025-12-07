/**
 * User profile page JavaScript
 */

let profileData = null;
let hasUnsavedChanges = false;
let cosmeticCatalog = [];
let userItems = { owned: [], equipped: {} };
let activeTab = 'settings';

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme();
  // Get username from URL or use default
  const params = new URLSearchParams(window.location.search);
  const username = params.get('user') || 'guest';

  // Require user token; redirect to login if missing
  const token = getUserToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  await loadProfile(username);
  await loadCosmetics();
  initTabs();
  setupEventListeners();
});

async function loadProfile(username) {
  try {
    const data = await apiCall(`/profile?login=${encodeURIComponent(username)}`, { useUserToken: true });

    profileData = {
      username: data?.profile?.login || username,
      display_name: data?.profile?.display_name || username,
      theme: data?.profile?.settings?.theme || 'dark',
      startingChips: data?.profile?.settings?.startingChips || 1000,
      avatarUrl: data?.profile?.settings?.avatarUrl || '',
      stats: data?.stats || {},
      balance: data?.balance,
    };

    updateForm();
    updatePreview();
    updateStreamLinks();
  } catch (err) {
    Toast.error('Failed to load profile: ' + err.message);
  }
}

async function loadCosmetics() {
  try {
    const cat = await apiCall('/catalog');
    cosmeticCatalog = Array.isArray(cat) ? cat : [];
  } catch (e) {
    cosmeticCatalog = [];
  }
  try {
    const inv = await apiCall('/user/items', { useUserToken: true });
    userItems = inv || { owned: [], equipped: {} };
  } catch (e) {
    userItems = { owned: [], equipped: {} };
  }
  renderCosmetics();
}

function renderCosmetics() {
  const grid = document.getElementById('cosmetic-grid');
  if (!grid) return;
  if (!cosmeticCatalog.length) {
    grid.innerHTML = '<div class="cosmetic-loading">Catalog unavailable</div>';
    return;
  }
  const ownedSet = new Set(userItems.owned || []);
  const equipped = userItems.equipped || {};
  grid.innerHTML = cosmeticCatalog
    .map(item => {
      const owned = ownedSet.has(item.id) || item.price_cents === 0 || item.price === 0;
      const eq = Object.values(equipped || {}).includes(item.id);
      const tint = item.tint || item.color || '';
      const priceCents = Number.isFinite(item.price_cents) ? item.price_cents : (item.price || 0);
      const preview = buildCosmeticPreview(item);
      const rarityClass = item.rarity ? `rarity-${item.rarity.toLowerCase()}` : '';
      return `
        <div class="cosmetic-card ${owned ? '' : 'locked'}">
          <div class="cosmetic-head">
            <div class="badge">${item.type}</div>
            <div class="rarity ${rarityClass}">${item.rarity || ''}</div>
          </div>
            <div class="cosmetic-name">${item.name}</div>
            ${eq ? '<div class="equipped-pill">Equipped</div>' : ''}
            <div class="cosmetic-preview">${preview}</div>
            <div class="cosmetic-meta">
              <span>${owned ? 'Owned' : 'Locked'}${eq ? ' · Equipped' : ''}</span>
              <span class="price">${priceCents ? `$${(priceCents / 100).toFixed(2)}` : 'Free'}</span>
            </div>
            <div class="cosmetic-actions">
              <button class="btn btn-secondary btn-sm" data-equip="${item.id}" ${owned ? '' : 'disabled'}>Equip</button>
              <button class="btn btn-ghost btn-sm" disabled title="Purchases coming soon">Buy (soon)</button>
            </div>
        </div>
      `;
    })
    .join('');

  grid.querySelectorAll('button[data-equip]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const itemId = e.currentTarget.dataset.equip;
      try {
        await apiCall('/user/equip', {
          method: 'POST',
          body: JSON.stringify({ itemId }),
          useUserToken: true,
        });
        Toast.success('Equipped');
        await loadCosmetics();
      } catch (err) {
        Toast.error('Equip failed: ' + err.message);
      }
    });
  });

  const refreshBtn = document.getElementById('btn-refresh-cosmetics');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadCosmetics();
      Toast.info('Reloading cosmetics...');
    });
  }
}

function buildCosmeticPreview(item) {
  const tint = item.tint || item.color || '#0b1b1b';
  const texture = item.texture_url;
  if (item.type === 'cardBack') {
    const bg = texture ? `background: url('${texture}') center/cover no-repeat, ${tint};` : `background:${tint};`;
    return `<div class="preview-cardback" style="${bg}"></div>`;
  }
  if (item.type === 'tableSkin') {
    const logo = item.color || '#8ef5d0';
    const bg = texture
      ? `background: url('${texture}') center/cover no-repeat, radial-gradient(ellipse at center, ${tint} 0%, #0a352f 58%, #061f1d 100%);`
      : `background: radial-gradient(ellipse at center, ${tint} 0%, #0a352f 58%, #061f1d 100%);`;
    return `<div class="preview-table" style="${bg}"><div class="table-logo" style="color:${logo}; border-color:${logo};">ALL-IN</div></div>`;
  }
  if (item.type === 'avatarRing') {
    const ring = item.color || '#00d4a6';
    return `<div class="preview-avatar-ring"><div class="avatar-ring-outer" style="border-color:${ring}; box-shadow:0 0 12px ${ring};"></div></div>`;
  }
  if (item.type === 'profileFrame') {
    const frame = item.color || '#00d4a6';
    return `<div class="preview-frame" style="border-color:${frame}; box-shadow:0 0 12px ${frame};"></div>`;
  }
  return `<div class="preview-swatch" style="${tint ? `background:${tint};` : ''}"></div>`;
}

function updateForm() {
  if (!profileData) return;

  document.getElementById('profile-username').value = profileData.username;
  document.getElementById('profile-display-name').value = profileData.display_name || profileData.username;
  document.getElementById('profile-theme').value = profileData.theme || 'dark';
  document.getElementById('profile-starting-chips').value = profileData.startingChips || 1000;
  document.getElementById('profile-avatar').value = profileData.avatarUrl || '';
}

function updatePreview() {
  if (!profileData) return;

  document.getElementById('preview-username').textContent = profileData.username;
  document.getElementById('preview-display-name').textContent = profileData.display_name || profileData.username;
  document.getElementById('preview-theme').textContent = profileData.theme || 'dark';
  document.getElementById('preview-chips').textContent = profileData.startingChips || 1000;
  const avatar = document.getElementById('preview-avatar');
  if (avatar) {
    avatar.src = profileData.avatarUrl || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-profile_image.png';
  }

  if (profileData.stats) {
    document.getElementById('preview-rounds-played').textContent = profileData.stats.roundsPlayed || 0;
    document.getElementById('preview-rounds-won').textContent = profileData.stats.roundsWon || 0;
    document.getElementById('preview-total-won').textContent = profileData.stats.totalWon || 0;
    document.getElementById('preview-biggest-win').textContent = profileData.stats.biggestWin || 0;
  }
}

function updateStreamLinks() {
  if (!profileData) return;
  const channel = profileData.username || 'yourchannel';
  const origin = window.location.origin;
  setLinkTarget('overlay-url', `${origin}/obs-overlay.html?channel=${encodeURIComponent(channel)}`);
  setLinkTarget('admin-url', `${origin}/admin2.html?channel=${encodeURIComponent(channel)}`);
  setLinkTarget('leaderboard-url', `${origin}/leaderboard-overlay.html?channel=${encodeURIComponent(channel)}`);
}

function setLinkTarget(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = url;
  el.textContent = url;
  el.dataset.copyValue = url;
}

function setupEventListeners() {
  const form = document.getElementById('profile-form');
  const inputs = form.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    input.addEventListener('change', () => {
      hasUnsavedChanges = true;
      updateUnsavedWarning();
      updateLivePreview();
    });
  });

  form.addEventListener('submit', saveProfile);

  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Leave anyway?')) {
      return;
    }
    window.history.back();
  });

  const themeBtn = document.getElementById('profile-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = toggleTheme();
      Toast.info(`Theme: ${next}`);
    });
  }

  document.querySelectorAll('.copy-btn[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      copyLink(btn.dataset.copyTarget);
    });
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function updateLivePreview() {
  document.getElementById('preview-display-name').textContent = document.getElementById('profile-display-name').value || profileData.username;
  document.getElementById('preview-theme').textContent = document.getElementById('profile-theme').value;
  document.getElementById('preview-chips').textContent = document.getElementById('profile-starting-chips').value;
  const avatar = document.getElementById('preview-avatar');
  if (avatar) {
    avatar.src = document.getElementById('profile-avatar').value || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-profile_image.png';
  }
}

function updateUnsavedWarning() {
  const warning = document.getElementById('unsaved-warning');
  warning.style.display = hasUnsavedChanges ? 'block' : 'none';
}

async function copyLink(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const value = el.dataset.copyValue || el.textContent || '';
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      Toast.success('Copied to clipboard');
    } else {
      throw new Error('Clipboard unavailable');
    }
  } catch (err) {
    Toast.error('Copy failed: ' + err.message);
  }
}

function initTabs() {
  switchTab(activeTab);
}

function switchTab(tab) {
  if (!tab) return;
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tab}`);
  });
}

async function saveProfile(e) {
  e.preventDefault();

  try {
    const updatedData = {
      login: profileData.username,
      display_name: document.getElementById('profile-display-name').value,
      settings: {
        theme: document.getElementById('profile-theme').value,
        startingChips: parseInt(document.getElementById('profile-starting-chips').value, 10),
        avatarUrl: document.getElementById('profile-avatar').value,
      },
    };

    await apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify(updatedData),
      useUserToken: true,
    });

    profileData.display_name = updatedData.display_name;
    profileData.theme = updatedData.settings.theme;
    profileData.startingChips = updatedData.settings.startingChips;
    profileData.avatarUrl = updatedData.settings.avatarUrl;

    hasUnsavedChanges = false;
    updateUnsavedWarning();
    updatePreview();
    Toast.success('Profile saved successfully');
  } catch (err) {
    Toast.error('Save failed: ' + err.message);
  }
}

// Warn before leaving if unsaved
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
