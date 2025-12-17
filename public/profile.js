/**
 * User profile page JavaScript
 */

let profileData = null;
let hasUnsavedChanges = false;
let cosmeticCatalog = [];
let userItems = { owned: [], equipped: {} };
let activeTab = 'settings';
let effectsMeta = null;
let winFxSprite = null;
let winFxMeta = null;
const fxImageCache = {};
const fxRunners = { deal: null, win: null };

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getUnlockLabel(item) {
  const type = (item.unlock_type || '').toLowerCase();
  const val = item.unlock_value;
  if (item.unlock_note) return item.unlock_note;
  if (type === 'streamer_goal') return val ? `Streamer unlock after ${val} hands` : 'Streamer unlock';
  if (type === 'subscriber') return 'Subscriber perk';
  if (type === 'twitch_drop') return 'Twitch Drop';
  if (type === 'hands') return val ? `Play ${val} hands` : 'Play hands to unlock';
  if (type === 'playtime') return val ? `Play ${Math.round(val / 60)} minutes` : 'Play to unlock';
  return '';
}

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
  await loadEffectsMeta();
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

async function loadEffectsMeta() {
  try {
    const res = await fetch('/assets/cosmetics/effects/meta.json');
    if (res.ok) {
      effectsMeta = await res.json();
      populateFxSelectors();
    }
  } catch (e) {
    // ignore
  }
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
              <button class="btn btn-info btn-sm" data-preview="${item.id}">Preview</button>
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

  grid.querySelectorAll('button[data-preview]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.currentTarget.dataset.preview;
      const item = cosmeticCatalog.find(i => i.id === itemId);
      openCosmeticPreview(item);
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
    const img = item.image_url || item.preview;
    const layers = [];
    if (img) layers.push(`url('${img}') center/cover no-repeat`);
    if (texture) layers.push(`url('${texture}') center/cover no-repeat`);
    layers.push(tint);
    const bg = `background:${layers.join(',')};`;
    return `<div class="preview-cardback" style="${bg}"></div>`;
  }
  if (item.type === 'cardFace') {
    const sample = item.preview || (item.image_url ? `${item.image_url.replace(/\/$/, '')}/ace_of_spades.png` : null);
    return `<div class="preview-cardback" style="background: ${sample ? `url('${sample}') center/cover no-repeat` : tint};"></div>`;
  }
  if (item.type === 'tableSkin') {
    const logo = item.color || '#8ef5d0';
    const art = item.image_url || texture;
    const bg = art
      ? `background: url('${art}') center/cover no-repeat, radial-gradient(ellipse at center, ${tint} 0%, #0a352f 58%, #061f1d 100%);`
      : `background: radial-gradient(ellipse at center, ${tint} 0%, #0a352f 58%, #061f1d 100%);`;
    return `<div class="preview-table" style="${bg}"><div class="table-logo" style="color:${logo}; border-color:${logo};">ALL-IN</div></div>`;
  }
  if (item.type === 'avatarRing') {
    const ring = item.color || '#00d4a6';
    if (item.image_url) {
      return `<div class="preview-avatar-ring has-image" style="--avatar-ring-img:url('${item.image_url}')"><div class="avatar-ring-image"></div></div>`;
    }
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
  const fxChoice = loadStoredFxChoice();
  const settingsFx = profileData.settings || {};
  const dealSel = document.getElementById('deal-fx-select');
  const winSel = document.getElementById('win-fx-select');
  if (dealSel) dealSel.value = settingsFx.dealFx || fxChoice.dealFx || dealSel.value;
  if (winSel) {
    winSel.value = settingsFx.winFx || fxChoice.winFx || winSel.value;
    previewWinFx(winSel.value);
  }
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
    document.getElementById('preview-hands-played').textContent = profileData.stats.handsPlayed || 0;
    const mins = Math.round((profileData.stats.playSeconds || 0) / 60);
    document.getElementById('preview-playtime').textContent = mins;
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

  const resetBtn = document.getElementById('profile-reset-session');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearToken();
      clearUserToken();
      Toast.info('Session cleared; please sign in again.');
      window.location.href = '/login.html';
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

  document.getElementById('btn-preview-win-fx')?.addEventListener('click', () => {
    const sel = document.getElementById('win-fx-select');
    if (sel && sel.value) previewWinFx(sel.value, true);
  });
  document.getElementById('btn-preview-deal-fx')?.addEventListener('click', () => {
    const sel = document.getElementById('deal-fx-select');
    if (sel && sel.value) previewDealFx(sel.value, true);
  });

  const dealSel = document.getElementById('deal-fx-select');
  const winSel = document.getElementById('win-fx-select');
  [dealSel, winSel].forEach(sel => {
    sel?.addEventListener('change', () => {
      updateFxLabels();
      broadcastFxToOverlay();
      if (sel === dealSel) previewDealFx(sel.value);
      if (sel === winSel) previewWinFx(sel.value);
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

function populateFxSelectors() {
  const dealSel = document.getElementById('deal-fx-select');
  const winSel = document.getElementById('win-fx-select');
  if (!effectsMeta || !effectsMeta.animations || !dealSel || !winSel) return;
  const animations = effectsMeta.animations || {};
  const dealOptions = Object.entries(animations).filter(([k]) => k.includes('deal') || k.includes('flip'));
  const winOptions = Object.entries(animations).filter(([k]) => k.includes('win') || k.includes('burst'));

  const currentFx = loadStoredFxChoice();
  dealSel.innerHTML = dealOptions.map(([key, meta]) => `<option value="${key}">${meta.description || key}</option>`).join('');
  winSel.innerHTML = winOptions.map(([key, meta]) => `<option value="${key}">${meta.description || key}</option>`).join('');
  dealSel.value = currentFx.dealFx || dealOptions[0]?.[0] || '';
  winSel.value = currentFx.winFx || winOptions[0]?.[0] || '';
  dealSel.addEventListener('change', () => {
    saveFxChoice({ dealFx: dealSel.value });
    hasUnsavedChanges = true;
    updateUnsavedWarning();
  });
  winSel.addEventListener('change', () => {
    saveFxChoice({ winFx: winSel.value });
    hasUnsavedChanges = true;
    updateUnsavedWarning();
    previewWinFx(winSel.value);
  });

  updateFxLabels();
  previewDealFx(dealSel.value);
  previewWinFx(winSel.value);
}

function loadStoredFxChoice() {
  try {
    const saved = localStorage.getItem('overlayFxChoice');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.winFx === 'win_burst_6') parsed.winFx = 'win_burst_25';
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  return { dealFx: 'card_deal_24', winFx: 'win_burst_25' };
}

function saveFxChoice(partial) {
  const current = loadStoredFxChoice();
  const next = { ...current, ...partial };
  localStorage.setItem('overlayFxChoice', JSON.stringify(next));
  broadcastFxToOverlay(next);
}

function broadcastFxToOverlay(payload) {
  const data = payload || loadStoredFxChoice();
  try {
    localStorage.setItem('overlayFxChoice', JSON.stringify(data));
  } catch (e) {
    // ignore storage errors
  }
  window.parent?.postMessage?.({ type: 'overlayFxUpdate', data }, '*');
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
  const tabs = Array.from(document.querySelectorAll('.tab-btn'));
  tabs.forEach((btn, idx) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, { focusPane: true }));
    btn.addEventListener('keydown', (e) => {
      const keysNext = ['ArrowRight', 'ArrowDown'];
      const keysPrev = ['ArrowLeft', 'ArrowUp'];
      const isHome = e.key === 'Home';
      const isEnd = e.key === 'End';
      if (![...keysNext, ...keysPrev, 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      let nextIndex = idx;
      if (keysNext.includes(e.key)) nextIndex = (idx + 1) % tabs.length;
      else if (keysPrev.includes(e.key)) nextIndex = (idx - 1 + tabs.length) % tabs.length;
      else if (isHome) nextIndex = 0;
      else if (isEnd) nextIndex = tabs.length - 1;
      const target = tabs[nextIndex];
      if (target) {
        switchTab(target.dataset.tab, { focusTab: true });
      }
    });
  });
  switchTab(activeTab);
}

function switchTab(tab, opts = {}) {
  if (!tab) return;
  activeTab = tab;
  const tabs = Array.from(document.querySelectorAll('.tab-btn'));
  const panes = Array.from(document.querySelectorAll('.tab-pane'));
  tabs.forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
    btn.tabIndex = isActive ? 0 : -1;
    if (isActive && opts.focusTab) btn.focus();
  });
  panes.forEach(pane => {
    const isActive = pane.id === `tab-${tab}`;
    pane.classList.toggle('active', isActive);
    pane.hidden = !isActive;
    if (isActive) {
      if (!pane.hasAttribute('tabindex')) pane.setAttribute('tabindex', '-1');
      if (opts.focusPane) pane.focus();
    }
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
        dealFx: document.getElementById('deal-fx-select')?.value || 'card_deal_24',
        winFx: document.getElementById('win-fx-select')?.value || 'win_burst_6',
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
    profileData.settings = { ...profileData.settings, ...updatedData.settings };
    saveFxChoice({ dealFx: updatedData.settings.dealFx, winFx: updatedData.settings.winFx });

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
function openCosmeticPreview(item) {
  const modal = document.getElementById('cosmetic-preview-modal');
  const body = document.getElementById('cosmetic-preview-body');
  if (!modal || !body || !item) return;
  const preview = buildCosmeticPreview(item);
  body.innerHTML = `
    <div class="modal-preview-card">
      <div class="modal-preview-type">${item.type || ''}</div>
      <div class="modal-preview-name">${item.name || ''}</div>
      <div class="modal-preview-area">${preview}</div>
      <p class="muted">${item.description || ''}</p>
    </div>
  `;
  modal.style.display = 'flex';
}

function updateFxLabels() {
  const dealSel = document.getElementById('deal-fx-select');
  const winSel = document.getElementById('win-fx-select');
  const dealName = document.getElementById('deal-fx-name');
  const winName = document.getElementById('win-fx-name');
  if (dealSel && dealName && effectsMeta?.animations?.[dealSel.value]) {
    dealName.textContent = effectsMeta.animations[dealSel.value].description || dealSel.value;
  }
  if (winSel && winName && effectsMeta?.animations?.[winSel.value]) {
    winName.textContent = effectsMeta.animations[winSel.value].description || winSel.value;
  }
}

function getSpritePath(key, meta) {
  if (!meta || !meta.image) return '';
  const file = meta.image;
  if (/^https?:\/\//i.test(file)) return file;
  if (key.includes('win')) return `/assets/cosmetics/effects/win/${file}`;
  if (key.includes('deal') || key.includes('flip')) return `/assets/cosmetics/effects/deals/face-down/${file}`;
  return `/assets/cosmetics/effects/${file}`;
}

async function getSpriteImage(key, meta) {
  const path = getSpritePath(key, meta);
  if (!path) return null;
  if (fxImageCache[path]) return fxImageCache[path];
  const img = await loadImage(path);
  if (img) fxImageCache[path] = img;
  return img;
}

function stopFxRunner(which) {
  if (fxRunners[which]?.cancel) {
    fxRunners[which].cancel();
  }
  fxRunners[which] = null;
}

function playSprite(meta, img, canvas, which) {
  if (!meta || !img || !canvas) return;
  stopFxRunner(which);
  const ctx = canvas.getContext('2d');
  const spacing = Number.isFinite(meta.spacing) ? meta.spacing : 0;
  const frames = meta.frames && Array.isArray(meta.frames) && meta.frames.length ? meta.frames : null;
  const total = meta.frameCount || (frames ? frames.length : 1);
  let idx = 0;
  let rafId = null;
  let timeoutId = null;

  const step = () => {
    if (!canvas.isConnected) return;
    const frameMeta = frames ? frames[idx % frames.length] : { index: idx };
    const frameIdx = frameMeta.index ?? idx;
    const sx = frameIdx * (meta.frameWidth + spacing);
    const sy = 0;
    const scale = Math.min(canvas.width / meta.frameWidth, canvas.height / meta.frameHeight);
    const dw = meta.frameWidth * scale;
    const dh = meta.frameHeight * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, meta.frameWidth, meta.frameHeight, dx, dy, dw, dh);

    idx += 1;
    if (idx >= total) return;
    const delay = frameMeta.duration || Math.max(20, 1000 / (meta.fps || 20));
    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(step);
    }, delay);
  };

  rafId = requestAnimationFrame(step);
  fxRunners[which] = {
    cancel: () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

async function previewDealFx(key, forcePlay) {
  if (!effectsMeta || !effectsMeta.animations) return;
  const meta = effectsMeta.animations[key];
  const canvas = document.getElementById('deal-fx-preview');
  if (!meta || !canvas) return;
  const img = await getSpriteImage(key, meta);
  if (!img) return;
  if (forcePlay) stopFxRunner('deal');
  playSprite(meta, img, canvas, 'deal');
}

async function previewWinFx(key, forcePlay) {
  if (!effectsMeta || !effectsMeta.animations) return;
  const meta = effectsMeta.animations[key];
  const canvas = document.getElementById('win-fx-preview');
  if (!meta || !canvas) return;
  const img = await getSpriteImage(key, meta);
  if (!img) return;
  if (forcePlay) stopFxRunner('win');
  playSprite(meta, img, canvas, 'win');
}

const closePreview = document.getElementById('close-cosmetic-preview');
if (closePreview) {
  closePreview.addEventListener('click', () => {
    const modal = document.getElementById('cosmetic-preview-modal');
    if (modal) modal.style.display = 'none';
  });
}
const modalBackdrop = document.getElementById('cosmetic-preview-modal');
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.style.display = 'none';
    }
  });
}
