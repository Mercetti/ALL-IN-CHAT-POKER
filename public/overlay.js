import {
  getSocketUrl,
  isEventForChannel,
} from './js/overlay/overlay-config.js';
import { createOverlayConnection } from './js/overlay/overlay-connection.js';
import {
  overlayState,
  getOverlayPlayers,
  setOverlayPlayers,
  mergeOverlayPlayer,
  getSelectedHeld,
  resetSelectedHeld,
  toggleHeldIndex,
  setUserLogin,
  setStreamerLogin,
  setOverlayMode,
  setCurrentPhase,
  setCurrentDealerHand,
  setPlayerBalances,
  setMinBet,
  setPotGlowMultiplier,
  setOverlayTuning,
  setOverlayFx,
  setAllInFrames,
  setCatalogCache,
  getCatalogCache,
  setLoadoutApplied,
  setIsMultiStream,
} from './js/overlay/overlay-state.js';
import {
  updateUI,
  renderPlayerHands,
  renderDealerHand,
  renderCommunityCards,
  renderPot,
  renderQueue,
  startCountdown,
  startPlayerActionTimer,
  startPerPlayerTimers,
  highlightPlayer,
  displayResult,
  updatePhaseUI,
  updateProfile,
  updateActionButtons,
  setPhaseLabel,
  setModeBadge,
  triggerFoldEffect,
  triggerAllInEffect,
  playWinEffect,
  applyVisualSettings,
  setFlipAssets,
  setDealAssets,
  setWinAssets,
  registerActionButtons,
} from './js/overlay/overlay-render.js';
import { queueValidator } from './js/overlay/queue-validation.js';

/**
 * Overlay client with Socket.IO integration
 */

// Import loading manager
const script = document.createElement('script');
script.src = 'loading-manager.js';
document.head.appendChild(script);

// Import animation manager
const animScript = document.createElement('script');
animScript.src = 'animation-manager.js';
document.head.appendChild(animScript);

// Initialize accessibility manager
let accessibilityManager = null;
if (typeof window !== 'undefined' && window.accessibilityManager) {
  accessibilityManager = window.accessibilityManager;
}

// Helper function to format time remaining
function formatTimeRemaining(endsAt) {
  if (!endsAt) return null;
  const now = Date.now();
  const remaining = Math.max(0, endsAt - now);
  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

const SOCKET_URL = getSocketUrl();
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Global overlay state
let hasHydrated = false;
let connectionPill = null;
let modePill = null;

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
  connectionPill = document.getElementById('connection-pill');
  modePill = document.getElementById('mode-pill');
  
  // Set initial connection state
  setConnection('disconnected');
});

const initialQueryChannel = typeof getChannelParam === 'function' ? getChannelParam() : '';
const hasChannelQuery = !!initialQueryChannel;
let overlayChannel = initialQueryChannel;
let isMultiStream = false;
let connectionInitialized = false;
const eventMatchesChannel = (payload) => isEventForChannel(overlayChannel, payload);
const authToken =
  (typeof window !== 'undefined' && window.__USER_TOKEN__) ||
  (typeof getUserToken === 'function' ? getUserToken() : null);

const seatNodes = Array.from(document.querySelectorAll('.seat'));
const seatOrder = seatNodes.map((_, idx) => idx);
const seatAssignments = new Map();
const overflowRow = document.getElementById('overflow-row');
const overflowNames = document.getElementById('overflow-names');
const channelPill = document.getElementById('channel-pill');
const seatedPill = document.getElementById('seated-pill');
const loadingScreen = document.getElementById('overlay-loading');
const errorScreen = document.getElementById('overlay-error');
const retryButton = document.getElementById('overlay-retry');
let queueNamesCache = [];

function refreshMultiStreamFlag() {
  isMultiStream = !!overlayChannel && overlayChannel.toLowerCase().startsWith('lobby-');
  setIsMultiStream(isMultiStream);
}

function applyChannelFallback(candidate) {
  const next = (candidate || '').toLowerCase();
  if (!next || next === overlayChannel) return false;
  overlayChannel = next;
  refreshMultiStreamFlag();
  updateChannelPill();
  if (connectionInitialized && !hasChannelQuery) {
    const url = new URL(window.location.href);
    url.searchParams.set('channel', overlayChannel);
    window.location.replace(url.toString());
  }
  return true;
}

function normalizeQueueEntries(waiting) {
  const list = Array.isArray(waiting) ? waiting : [];
  return list
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        return { login: entry.toLowerCase?.() || entry, label: entry };
      }
      if (typeof entry === 'object') {
        const login =
          entry.login ||
          entry.name ||
          entry.display_name ||
          entry.username ||
          entry.twitch ||
          '';
        const label = entry.display_name || entry.name || entry.login || entry.alias || 'Player';
        return { login, label };
      }
      return null;
    })
    .filter((item) => item && item.label);
}

function getPlayerLabel(player) {
  if (!player) return '';
  return player.display_name || player.name || player.login || player.alias || 'Player';
}

function updateOverflowDisplay(overflowPlayers = []) {
  if (!overflowRow || !overflowNames) return;
  let names = [];
  if (Array.isArray(overflowPlayers) && overflowPlayers.length) {
    names = overflowPlayers.map((p) => getPlayerLabel(p)).filter(Boolean);
  } else if (queueNamesCache.length) {
    names = queueNamesCache.slice(0, 6);
  }
  overflowRow.classList.toggle('hidden', names.length === 0);
  overflowNames.textContent = names.length ? names.join(' · ') : '-';
}

function toggleScreen(el, show) {
  if (!el) return;
  el.classList.toggle('hidden', !show);
}

function showLoadingScreen() {
  toggleScreen(errorScreen, false);
  toggleScreen(loadingScreen, true);
}

function showErrorScreen() {
  toggleScreen(loadingScreen, false);
  toggleScreen(errorScreen, true);
}

function hideOverlayScreens() {
  toggleScreen(loadingScreen, false);
  toggleScreen(errorScreen, false);
}

function updateChannelPill() {
  if (!channelPill) return;
  if (overlayChannel) {
    channelPill.textContent = `Channel: ${overlayChannel}`;
    channelPill.classList.add('channel');
  } else {
    channelPill.textContent = 'Channel: -';
    channelPill.classList.remove('channel');
  }
}

if (!overlayChannel && typeof getUserToken === 'function') {
  const tokenLogin = decodeLoginFromJwt(getUserToken());
  if (tokenLogin) {
    applyChannelFallback(tokenLogin);
  }
}

refreshMultiStreamFlag();
updateChannelPill();
showLoadingScreen();

if (retryButton) {
  retryButton.addEventListener('click', () => {
    window.location.reload();
  });
}

function setConnection(state) {
  if (connectionPill) {
    const text =
      state === 'connected'
        ? 'Connected'
        : state === 'reconnecting'
        ? 'Reconnecting...'
        : 'Disconnected';
    connectionPill.textContent = text;
    connectionPill.classList.toggle('connected', state === 'connected');
    connectionPill.classList.toggle('disconnected', state === 'disconnected');
  }

  if (state === 'connected') {
    if (hasHydrated) {
      hideOverlayScreens();
    }
  } else if (state === 'reconnecting') {
    showLoadingScreen();
  } else if (state === 'disconnected') {
    showErrorScreen();
  }
}

function updateModePill(mode) {
  if (!modePill) return;
  modePill.textContent = `Mode: ${mode || '-'}`;
}

function syncSeatAssignments(players) {
  const active = new Set(players.map((p) => p.login));
  Array.from(seatAssignments.keys()).forEach((login) => {
    if (!active.has(login)) seatAssignments.delete(login);
  });

  const usedSeats = new Set(seatAssignments.values());
  const availableSeats = seatOrder.filter((seatIdx) => !usedSeats.has(seatIdx));
  players.forEach((player) => {
    if (!seatAssignments.has(player.login) && availableSeats.length) {
      const nextSeat = availableSeats.shift();
      seatAssignments.set(player.login, nextSeat);
    }
  });
}

function renderSeatLayer(players = getOverlayPlayers()) {
  const validPlayers = (players || []).filter((p) => p && p.login);
  syncSeatAssignments(validPlayers);

  const seatMap = {};
  seatAssignments.forEach((seatIdx, login) => {
    const player = validPlayers.find((p) => p.login === login);
    if (player) seatMap[seatIdx] = player;
  });

  seatNodes.forEach((node) => {
    const seatIdx = Number(node.dataset.seat);
    const player = seatMap[seatIdx];
    const avatar = node.querySelector('img');
    const name = node.querySelector('.seat-name');
    if (player) {
      node.classList.remove('open');
      if (avatar) {
        avatar.src = player.avatar || player.profile?.avatar || '/assets/overlay/open-seat.svg';
        avatar.alt = player.display_name || player.login;
      }
      if (name) name.textContent = player.display_name || player.login;
    } else {
      node.classList.add('open');
      if (avatar) {
        avatar.src = '/assets/overlay/open-seat.svg';
        avatar.alt = 'Open seat';
      }
      if (name) name.textContent = 'Open Seat';
    }
  });

  if (seatedPill) {
    const seatedCount = Math.min(validPlayers.length, seatNodes.length);
    seatedPill.textContent = `${seatedCount} / ${seatNodes.length} seated`;
  }
  const overflowPlayers = validPlayers.filter((p) => !seatAssignments.has(p.login));
  updateOverflowDisplay(overflowPlayers);
}

function getCardFaceImage(rank, suit, basePath) {
  const safeBasePath = basePath || CARD_FACE_BASE_FALLBACK;
  if (!safeBasePath) return null;
  const suitName = normalizeSuitName(suit);
  const rankName = normalizeRankName(rank);
  if (!suitName || !rankName) return null;
  const safeBase = safeBasePath.replace(/\/$/, '');
  return `${safeBase}/${rankName}_of_${suitName}.png`;
}
const cardImageCache = new Map();
async function loadImageCached(src) {
  if (!src) return null;
  if (cardImageCache.has(src)) return cardImageCache.get(src);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  cardImageCache.set(src, promise);
  return promise;
}

function deriveFlipMeta(img, metaRaw = {}) {
  if (!img) return null;
  const base = { frameCount: metaRaw.frameCount || 24, frameWidth: metaRaw.frameWidth || 512, frameHeight: metaRaw.frameHeight || 716, loop: !!metaRaw.loop };
  let frames = Array.isArray(metaRaw.frames) ? metaRaw.frames : [];
  const needsDerive = !frames.length;

  if (needsDerive) {
    const total = base.frameCount || 24;
    const spacing = Number.isFinite(metaRaw.spacing) ? metaRaw.spacing : 0;
    frames = Array.from({ length: total }).map((_, idx) => ({
      index: idx,
      x: idx * (base.frameWidth + spacing),
      y: 0,
      duration: metaRaw.frameDuration || 40,
      side: idx < total / 2 ? 'back' : 'front',
    }));
  } else {
    base.frameCount = metaRaw.frameCount || frames.length;
    base.frameWidth = metaRaw.frameWidth || frames[0].w || frames[0].width || frames[0].frameWidth || base.frameWidth;
    base.frameHeight = metaRaw.frameHeight || frames[0].h || frames[0].height || frames[0].frameHeight || base.frameHeight;
  }

  return { ...base, frames };
}

function renderFlippingCard(ctx, sprite, meta, frameIdx, backImg, faceImg, width, height) {
  if (!sprite || !meta || !meta.frames || !meta.frames[frameIdx]) return;
  const f = meta.frames[frameIdx];
  const isBack = f.side ? f.side === 'back' : frameIdx < meta.frameCount / 2;
  const skin = isBack ? backImg : faceImg;
  if (!skin || !ctx) return;
  const w = width || meta.frameWidth;
  const h = height || meta.frameHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(sprite, f.x, f.y, meta.frameWidth, meta.frameHeight, 0, 0, w, h);
  ctx.drawImage(skin, 0, 0, w, h);
}
const CHIP_DENOMS = [
  { value: 1000, color: '#f5a524', label: '1k' },
  { value: 500, color: '#9b59b6', label: '500' },
  { value: 100, color: '#111', label: '100' },
  { value: 25, color: '#2ecc71', label: '25' },
  { value: 5, color: '#e74c3c', label: '5' },
  { value: 1, color: '#ecf0f1', label: '1' },
];
const CHIP_ASSETS = {
  1: { top: '/assets/cosmetics/effects/chips/chip-1-top.png', side: '/assets/cosmetics/effects/chips/chip-1-side.png' },
  5: { top: '/assets/cosmetics/effects/chips/chip-5-top.png', side: '/assets/cosmetics/effects/chips/chip-5-side.png' },
  25: { top: '/assets/cosmetics/effects/chips/chip-25-top.png', side: '/assets/cosmetics/effects/chips/chip-25-side.png' },
  100: { top: '/assets/cosmetics/effects/chips/chip-100-top.png', side: '/assets/cosmetics/effects/chips/chip-100-side.png' },
  500: { top: '/assets/cosmetics/effects/chips/chip-500-top.png', side: '/assets/cosmetics/effects/chips/chip-500-side.png' },
};
const CARD_FACE_BASE_FALLBACK = '/assets/cosmetics/cards/faces/classic';
const ALL_IN_EFFECT_SPRITE = '/assets/cosmetics/effects/all-in/allin_burst_horizontal_sheet.png?v=3';
const FOLD_EFFECT = '/assets/cosmetics/effects/folds/fold-dust.png';
  const DEAL_FACE_DOWN = '/assets/cosmetics/effects/deals/face-down-deal.png';
const DEAL_FACE_UP = '/assets/cosmetics/effects/deals/face-up/face-up-deal.png';
const CARD_FLIP_SPRITE = '/assets/cosmetics/effects/deals/face-up/card_flip_sprite.png';
const DEFAULT_CARD_BACK = '/assets/card-back.png';
let flipSprite = null;
let flipMeta = null;
let effectsMeta = null;
let effectsMetaPromise = null;
let winSprite = null;
let winMeta = null;
let dealSprite = null;
let dealMeta = null;
let overlayFx = { dealFx: 'card_deal_24', winFx: 'win_burst_6' };
let allInFrames = 6;
let loadoutApplied = false;
let catalogCache = null;
let allInSpritePromise = null;

async function ensureEffectsMetaLoaded() {
  if (effectsMeta) return effectsMeta;
  if (effectsMetaPromise) return effectsMetaPromise;
  effectsMetaPromise = (async () => {
    try {
      const res = await fetch('/assets/cosmetics/effects/meta.json');
      if (res.ok) {
        effectsMeta = await res.json();
        window.__EFFECTS_META__ = effectsMeta;
      }
    } catch (e) {
      console.warn('[overlay] failed to load effects meta', e);
    }
    return effectsMeta;
  })();
  return effectsMetaPromise;
}

async function ensureAllInSpriteLoaded() {
  if (allInSpritePromise || allInFrames !== 6) return allInSpritePromise;
  allInSpritePromise = (async () => {
    const img = await loadImageCached(ALL_IN_EFFECT_SPRITE);
    if (img && img.naturalHeight) {
      const frames = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
      allInFrames = frames;
      document.querySelectorAll('.all-in-effect').forEach(el => {
        el.style.setProperty('--allin-frames', frames);
      });
    }
  })();
  return allInSpritePromise;
}

async function loadPublicConfig() {
  try {
    const res = await fetch('/public-config.json');
    if (!res.ok) return;
    const cfg = await res.json();
    setStreamerLogin((cfg.streamerLogin || '').toLowerCase());
    if (!overlayChannel && (cfg.streamerLogin || cfg.twitchChannel)) {
      applyChannelFallback(cfg.streamerLogin || cfg.twitchChannel || '');
    }
    if (typeof cfg.minBet === 'number') setMinBet(cfg.minBet);
    if (typeof cfg.potGlowMultiplier === 'number') {
      setPotGlowMultiplier(cfg.potGlowMultiplier);
      setOverlayTuning({ potGlowMultiplier: cfg.potGlowMultiplier });
    }
    updateUserBadge();
  } catch (e) {
    // ignore
  }
}
loadPublicConfig();
loadBalances();
scheduleOverlayAssetWarmup();

function scheduleOverlayAssetWarmup() {
  const kickoff = () => {
    ensureEffectsMetaLoaded()
      .then(() => {
        loadWinSprite();
        loadDealSprite();
        loadFlipSprite();
      })
      .catch(() => {});
    ensureAllInSpriteLoaded();
  };
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(kickoff, { timeout: 1500 });
  } else {
    setTimeout(kickoff, 400);
  }
}

async function loadFlipSprite() {
  try {
    const metaRes = await fetch('/assets/cosmetics/effects/deals/face-up/card_flip_animation.json');
    const rawMeta = metaRes.ok ? await metaRes.json() : {};
    const merged = effectsMeta?.animations?.card_flip_24
      ? { ...effectsMeta.animations.card_flip_24, ...rawMeta }
      : rawMeta;
    const metaJson = merged || {};
    const spritePath = metaJson.image
      ? (metaJson.image.startsWith('http') ? metaJson.image : `/assets/cosmetics/effects/deals/face-up/${metaJson.image}`)
      : CARD_FLIP_SPRITE;
    const img = await loadImageCached(spritePath);
    if (img) {
      flipMeta = deriveFlipMeta(img, metaJson);
      flipSprite = img;
      kickoffFlipCanvases(true);
    }
  } catch (e) {
    // ignore sprite load failures
  }
}

function loadFxChoice() {
  try {
    const saved = localStorage.getItem('overlayFxChoice');
    if (saved) overlayFx = { ...overlayFx, ...JSON.parse(saved) };
    if (overlayFx.winFx === 'win_burst_25') overlayFx.winFx = 'win_burst_6';
  } catch (e) {
    // ignore
  }
}
loadFxChoice();
loadOverlayLoadout();

async function fetchCatalogForLoadout() {
  if (catalogCache) return catalogCache;
  try {
    const res = await fetch('/catalog');
    if (res.ok) {
      catalogCache = await res.json();
    }
  } catch (e) {
    console.warn('[overlay] catalog fetch failed', e);
  }
  return catalogCache || [];
}

function mapLoadoutToOverlaySettings(loadout = {}, catalog = []) {
  const map = {};
  (catalog || []).forEach((item) => {
    if (item?.id) map[item.id] = item;
  });
  const cosmetics = loadout.cosmetics || {};
  const pick = (slot, fallback) => map[cosmetics[slot]] || (fallback ? map[fallback] : null);

  const cardBackItem = pick('cardBack', 'card-default');
  const tableItem = pick('tableSkin', 'table-default');
  const ringItem = pick('avatarRing', 'ring-default');
  const frameItem = pick('profileFrame', 'frame-default');
  const faceItem = pick('cardFace', 'card-face-classic');

  const settings = {};
  if (cardBackItem) {
    if (cardBackItem.tint) settings.cardBackTint = cardBackItem.tint;
    if (cardBackItem.image_url || cardBackItem.preview) {
      settings.cardBackImage = cardBackItem.image_url || cardBackItem.preview;
    }
  }
  if (tableItem) {
    if (tableItem.tint) settings.tableTint = tableItem.tint;
    if (tableItem.color) settings.tableLogoColor = tableItem.color;
    if (tableItem.texture_url || tableItem.image_url || tableItem.preview) {
      settings.tableTexture = tableItem.texture_url || tableItem.image_url || tableItem.preview;
    }
  }
  if (ringItem) {
    if (ringItem.color) settings.avatarRingColor = ringItem.color;
    if (ringItem.image_url || ringItem.preview) {
      settings.avatarRingImage = ringItem.image_url || ringItem.preview;
    }
  }
  if (frameItem && frameItem.color) {
    settings.profileCardBorder = frameItem.color;
  }
  if (faceItem && (faceItem.image_url || faceItem.preview)) {
    settings.cardFaceBase = faceItem.image_url || faceItem.preview;
  }

  return { settings, fx: loadout.effects || {} };
}

async function loadOverlayLoadout() {
  try {
    if (!overlayChannel) return;
    const qs = overlayChannel ? `?channel=${encodeURIComponent(overlayChannel)}` : '';
    const res = await fetch(`/overlay/loadout${qs}`);
    if (!res.ok) return;
    const data = await res.json();
    const catalog = await fetchCatalogForLoadout();
    const mapped = mapLoadoutToOverlaySettings(data || {}, catalog);
    if (mapped.settings && Object.keys(mapped.settings).length) {
      overlayTuning = { ...overlayTuning, ...mapped.settings };
      applyVisualSettings();
    }
    if (mapped.fx && Object.keys(mapped.fx).length) {
      overlayFx = { ...overlayFx, ...mapped.fx };
    }
    loadoutApplied = true;
  } catch (err) {
    console.warn('[overlay] loadout fetch failed', err);
  }
}

async function loadWinSprite(key) {
  try {
    const metaData = await ensureEffectsMetaLoaded();
    const fxKey = key || overlayFx.winFx || 'win_burst_6';
    const meta = metaData?.animations?.[fxKey] || metaData?.animations?.win_burst_6 || null;
    if (!meta) return;
    const spritePath = meta.image
      ? (meta.image.startsWith('http') ? meta.image : `/assets/cosmetics/effects/win/${meta.image}`)
      : '/assets/cosmetics/effects/win/AllInChatPoker_Glitch_24Frames_1024x1024_Horizontal_FIXED.png';
    const img = await loadImageCached(spritePath);
    if (img) {
      winSprite = img;
      winMeta = meta;
      setWinAssets({ sprite: winSprite, meta: winMeta });
    }
  } catch (e) {
    // ignore
  }
}

async function loadDealSprite(key) {
  try {
    const metaData = await ensureEffectsMetaLoaded();
    const fxKey = key || overlayFx.dealFx || 'card_deal_24';
    const meta = metaData?.animations?.[fxKey] || metaData?.animations?.card_deal_24 || null;
    if (!meta) return;
    const spritePath = meta.image
      ? (meta.image.startsWith('http') ? meta.image : `/assets/cosmetics/effects/deals/face-down/${meta.image}`)
      : '/assets/cosmetics/effects/deals/face-down/horizontal_transparent_sheet.png';
    const img = await loadImageCached(spritePath);
    if (img) {
      dealSprite = img;
      dealMeta = meta;
      setDealAssets({ sprite: dealSprite, meta: dealMeta });
    }
  } catch (e) {
    // ignore
  }
}

async function loadBalances() {
  try {
    const res = await fetch('/balances.json');
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === 'object') {
      // Check for balance changes and announce
      const currentLogin = overlayState.userLogin;
      const existingBalances = overlayState.playerBalances || {};
      if (accessibilityManager && currentLogin) {
        const oldBalance = existingBalances[currentLogin] || 0;
        const newBalance = data[currentLogin] || 0;
        if (oldBalance !== newBalance) {
          const change = newBalance - oldBalance;
          accessibilityManager.announceBalanceChange(newBalance, change);
        }
      }
      setPlayerBalances(data);
    }
  } catch (e) {
    // ignore
  }
}

function decodeLoginFromJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = token.split('.')[1];
    // base64url decode with padding
    const pad = payload.length % 4 === 2 ? '==' : payload.length % 4 === 3 ? '=' : '';
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const decoded = JSON.parse(atob(b64));
    return decoded.user || decoded.login || null;
  } catch (err) {
    console.warn('Failed to decode user token', err);
    return null;
  }
}

function updateUserBadge() {
  const pill = document.getElementById('user-pill');
  const logoutBtn = document.getElementById('logout-btn');
  const loginLink = document.getElementById('login-link');
  const streamerBtn = document.getElementById('streamer-btn');
  const token = typeof getUserToken === 'function' ? getUserToken() : null;
  const login = decodeLoginFromJwt(token);
  setUserLogin(login || null);
  const currentLogin = overlayState.userLogin;
  const isStreamer = currentLogin && overlayState.streamerLogin && currentLogin.toLowerCase() === overlayState.streamerLogin;

  if (currentLogin) {
    pill.textContent = `Signed in as ${currentLogin}`;
    pill.classList.remove('badge-secondary');
    pill.classList.add('badge-success');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (loginLink) loginLink.style.display = 'none';
  } else {
    pill.textContent = 'Signed out';
    pill.classList.remove('badge-success');
    pill.classList.add('badge-secondary');
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginLink) loginLink.style.display = 'inline-flex';
  }
  if (streamerBtn) streamerBtn.style.display = isStreamer ? 'inline-flex' : 'none';
}

// Init auth UI immediately (script loads after DOM)
updateUserBadge();
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearUserToken && clearUserToken();
    clearToken && clearToken();
    updateUserBadge();
    Toast.info('Signed out');
    window.location.href = '/login.html';
  });
}

// Apply saved theme on load and wire theme toggle
applyTheme();
const headerThemeBtn = document.getElementById('theme-toggle');
if (headerThemeBtn) {
  setThemeButtonLabel(headerThemeBtn);
  headerThemeBtn.addEventListener('click', () => {
    const next = toggleTheme();
    setThemeButtonLabel(headerThemeBtn);
    Toast.info(`Theme: ${next}`);
  });
}

// Player ready (tournament tables)
const readyBtn = document.getElementById('btn-player-ready');
const readyPill = document.getElementById('ready-pill');
function setReadyStatus(payload = {}) {
  if (!readyPill) return;
  const readyArr = Array.isArray(payload.ready) ? payload.ready : [];
  const readyCount = [payload.readyCount, readyArr.length].find(n => typeof n === 'number') ?? readyArr.length;
  const requiredArr = Array.isArray(payload.required) ? payload.required : [];
  const requiredCount = [payload.requiredCount, requiredArr.length].find(n => typeof n === 'number') ?? requiredArr.length;
  const allReady = !!payload.allReady || (requiredCount > 0 && readyCount >= requiredCount);
  readyPill.style.display = 'inline-flex';
  readyPill.className = `badge ready-pill ${allReady ? 'all-ready' : ''}`;
  readyPill.classList.toggle('pulse', !allReady);
  readyPill.textContent = allReady
    ? (payload.started ? 'Starting...' : `All ready ${readyCount}/${requiredCount || readyCount}`)
    : `Ready ${readyCount}/${requiredCount || '?'}`;
}
if (readyBtn) {
  readyBtn.addEventListener('click', async () => {
    try {
      const res = await apiCall('/table/ready', {
        method: 'POST',
        body: JSON.stringify({ channel: overlayChannel }),
        useUserToken: true,
      });
      setReadyStatus(res);
      Toast.info(res.started ? 'All ready - round starting' : 'Ready sent');
    } catch (e) {
      Toast.error('Ready failed: ' + e.message);
    }
  });
}
function completeHydration() {
  console.log('Overlay hydration complete');
  hasHydrated = true;
  
  // Hide loading screens and show the overlay
  hideOverlayScreens();
  
  // Set connection state to connected
  setConnection('connected');
  
  // Apply any pending state that was received during hydration
  if (overlayState.pendingState) {
    updateUI(overlayState.pendingState);
    overlayState.pendingState = null;
  }
  
  // Start any periodic updates or animations
  startOverlayAnimations();
  
  // Emit hydration complete event for other components
  window.dispatchEvent(new CustomEvent('overlay-hydration-complete'));
}

function startOverlayAnimations() {
  // Start any periodic animations or effects
  if (overlayState.overlayMode === 'poker') {
    // Start poker-specific animations
    startPokerAnimations();
  }
}

function startPokerAnimations() {
  // Initialize card flip animations, pot glow effects, etc.
  console.log('Starting poker overlay animations');
}

// Socket.IO event handlers with proper connection routing
socket.on('connect', () => {
  console.log('Connected to server');
  Toast.info('Connected');
  setConnection('connected');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  Toast.warning('Disconnected');
  setConnection('disconnected');
});

socket.on('reconnect', () => {
  console.log('Reconnected to server');
  Toast.info('Reconnected');
  setConnection('connected');
});

socket.on('reconnecting', () => {
  console.log('Reconnecting to server...');
  setConnection('reconnecting');
});

socket.on('connect_error', (err) => {
  console.error('Overlay connect error', err);
  Toast.error('Overlay connection failed');
  setConnection('disconnected');
});

socket.on('state', (data) => {
  if (!isEventForChannel(data)) return;
  console.log('State received:', data);
  updateUI(data);
  applyPlayers(data.players || []);
  setOverlayMode(data.mode || overlayState.overlayMode);
  setCurrentDealerHand(data.dealerHand || overlayState.currentDealerHand);
  if (data.phase) setCurrentPhase(data.phase);
  renderPlayerHands(getOverlayPlayers());
  if (data.mode) setModeBadge(data.mode);
  renderPot(data);
  displayResult(data);
  updatePhaseUI('Round Complete');
  startCountdown(null);
  if (data.waiting) {
    const validatedQueue = queueValidator.updateQueue(data.waiting);
    renderQueue(validatedQueue.seated, validatedQueue.overflow);
    updateOverflowDisplay(validatedQueue.overflow);
  }
  setPhaseLabel(data.phase);
  highlightPlayer(null);
  completeHydration();
});

socket.on('readyStatus', (data) => {
  if (!isEventForChannel(data)) return;
  setReadyStatus(data || {});
});

socket.on('profile', (profile) => {
  console.log('Profile received:', profile);
  if (profile && profile.login) {
    setUserLogin(profile.login);
  }
  updateProfile(profile);
});

socket.on('roundStarted', (data) => {
  if (!isEventForChannel(data)) return;
  try {
    document.body.classList.add('shuffle-anim');
    if (window.__shuffleTimeout) clearTimeout(window.__shuffleTimeout);
    window.__shuffleTimeout = setTimeout(() => document.body.classList.remove('shuffle-anim'), 1200);
    if (!window.__shuffleAudio) {
      window.__shuffleAudio = new Audio('/assets/shuffle.mp3');
      window.__shuffleAudio.volume = 0.4;
    }
    window.__shuffleAudio?.play()?.catch(() => {});
  } catch (e) {
    // ignore
  }
  console.log('Round started:', data);
  setCurrentPhase('dealing');
  setCurrentDealerHand(data.dealerHand || []);
  setOverlayPlayers(data.players || []);
  setOverlayMode(data.mode || overlayState.overlayMode);
  renderDealerHand(overlayState.currentDealerHand);
  renderCommunityCards(data.community || []);
  renderPlayerHands(getOverlayPlayers());
  renderPot(data);
  updatePhaseUI('Dealing Cards');
  startCountdown(data.actionEndsAt || null);
  if (data.waiting) {
    const validatedQueue = queueValidator.updateQueue(data.waiting);
    renderQueue(validatedQueue.seated, validatedQueue.overflow);
    updateOverflowDisplay(validatedQueue.overflow);
  }
  if (data.phase) setPhaseLabel(data.phase);
  if (data.mode) setModeBadge(data.mode);
  highlightPlayer(null);

  // Show insurance prompt if dealer shows Ace
  if (data.dealerHand && data.dealerHand.length && data.dealerHand[0].rank === 'A') {
    const insuranceBanner = document.getElementById('insurance-banner');
    if (insuranceBanner) {
      insuranceBanner.style.display = 'flex';
    }
  } else {
    const insuranceBanner = document.getElementById('insurance-banner');
    if (insuranceBanner) insuranceBanner.style.display = 'none';
  }
  updateActionButtons();
});

socket.on('bettingStarted', (data) => {
  if (!isEventForChannel(data)) return;
  console.log('Betting started');

  // Show loading state for betting phase
  if (window.loadingManager) {
    window.loadingManager.startLoading('betting', 'Betting phase active...');
  }

  setCurrentPhase('betting');
  updatePhaseUI('Place Your Bets');
  renderPlayerHands(getOverlayPlayers());
  renderPot(data);
});

socket.on('roundResult', (data) => {
  if (!isEventForChannel(data)) return;
  console.log('Round result:', data);

  // Stop betting loading state, start result loading
  if (window.loadingManager) {
    window.loadingManager.stopLoading('betting');
    window.loadingManager.startLoading('result', 'Processing results...');
  }

  setCurrentPhase('result');
  setCurrentDealerHand(data.dealerHand || []);
  setOverlayPlayers(data.players || []);
  loadBalances();
  renderDealerHand(overlayState.currentDealerHand);
  renderCommunityCards(data.community || []);
  renderPlayerHands(getOverlayPlayers());
  renderPot(data);
  displayResult(data);
  updatePhaseUI('Round Complete');
  startCountdown(null);
  if (data.waiting) {
    const validatedQueue = queueValidator.updateQueue(data.waiting);
    renderQueue(validatedQueue.seated, validatedQueue.overflow);
    updateOverflowDisplay(validatedQueue.overflow);
  }
  setPhaseLabel('Showdown');
  if (data.mode) setModeBadge(data.mode);
  const insuranceBanner = document.getElementById('insurance-banner');
  if (insuranceBanner) insuranceBanner.style.display = 'none';
  updateActionButtons();

  // Accessibility announcements for results
  if (accessibilityManager && data.evaluation) {
    const handName = data.evaluation.name || 'No Winner';
    const payout = data.evaluation.payout || 0;
    accessibilityManager.announceHandResult(handName, payout);
  }
});

socket.on('payouts', (data) => {
  if (!isEventForChannel(data)) return;
  console.log('Payouts:', data);
  const winners = data.winners || [];
  if (winners.length > 0) {
    const names = winners.join(', ');
    Toast.success(`Winners: ${names}`);
    playWinEffect();
  } else if (data.payouts && Object.keys(data.payouts).length > 0) {
    Toast.success('Winners announced!');
    playWinEffect();
  }

  // Refresh leaderboard after payouts
  loadLeaderboard();

  // Show payouts in UI
  const resultDisplay = document.getElementById('result-display');
  if (resultDisplay && data.payouts) {
    resultDisplay.style.display = 'block';
    const payout = document.getElementById('result-payout');
    payout.textContent = Object.entries(data.payouts)
      .map(([name, amount]) => `${name}: +${amount}`)
      .join(', ');
    const detail = document.getElementById('payout-details');
    if (detail) {
      const items = Object.entries(data.payouts)
        .map(([name, amount]) => {
          const formatted = (amount > 0 ? '+' : '') + (amount.toLocaleString?.() || amount);
          const cls = amount > 0 ? 'gain-badge' : 'loss-badge';
          return `<li><span>${name}</span><span class="badge ${cls}">${formatted}</span></li>`;
        })
        .join('');
      const before = (data.leaderboard || []).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      const after = (data.leaderboardAfter || []).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      const deltas = after.map(a => {
        const prev = before.find(b => b.login === a.login);
        const delta = prev ? a.chips - prev.chips : a.chips;
        return { login: a.login, delta };
      }).filter(d => d.delta !== 0);

      const deltaList = deltas
        .map(d => {
          const tooltip = d.delta > 0 ? 'Chips gained since last leaderboard' : 'Chips lost since last leaderboard';
          const formatted = (d.delta > 0 ? '+' : '') + (d.delta.toLocaleString?.() || d.delta);
          const cls = d.delta > 0 ? 'gain-badge' : 'loss-badge';
          return `<li title="${tooltip}"><span>${d.login}</span><span class="badge ${cls}">${formatted}</span></li>`;
        })
        .join('');

      detail.innerHTML = `<ul>${items || '<li>No payouts</li>'}</ul><div class="delta-header">Leaderboard Δ</div><ul>${deltaList || '<li>No changes</li>'}</ul>`;
    }
  }

  if (data.waiting) {
    const validatedQueue = queueValidator.updateQueue(data.waiting);
    renderQueue(validatedQueue.seated, validatedQueue.overflow);
    updateOverflowDisplay(validatedQueue.overflow);
  }
});

socket.on('pokerBetting', (data) => {
  if (!isEventForChannel(data)) return;
  const potEl = document.getElementById('pot-value');
  const betEl = document.getElementById('current-bet');
  const potVal = (data && data.pot) || 0;
  const betVal = (data && data.currentBet) || 0;
  if (potEl) {
    potEl.textContent = potVal.toLocaleString?.() || potVal;
    potEl.title = 'Total pot';
  }
  if (betEl) {
    betEl.textContent = betVal.toLocaleString?.() || betVal;
    betEl.title = 'Current street bet to call';
  }

  const players = getOverlayPlayers();
  if (Array.isArray(players) && players.length) {
    const updated = players.map(p => ({
      ...p,
      streetBet: (data?.streetBets && data.streetBets[p.login]) || p.streetBet || 0,
      bet: (data?.totalBets && data.totalBets[p.login]) || p.bet || 0,
    }));
    setOverlayPlayers(updated);
    renderPlayerHands(updated);
    renderPot(data);
  }
});

socket.on('playerUpdate', (data) => {
  if (!isEventForChannel(data)) return;
  if (!data || !data.login) return;
  mergeOverlayPlayer(data);
  renderPlayerHands(getOverlayPlayers());
  renderPot();
  updateActionButtons();
});

socket.on('error', (err) => {
  console.error('Server error:', err);
  Toast.error(err);
});

window.addEventListener('message', (event) => {
  if (!event || !event.data || !event.data.type) return;
  if (event.data.type === 'overlayFxUpdate' && event.data.data) {
    overlayFx = { ...overlayFx, ...event.data.data };
    loadDealSprite(overlayFx.dealFx);
    loadWinSprite(overlayFx.winFx);
    kickoffDealCanvases(true);
  }
});

socket.on('queueUpdate', (data) => {
  if (!isEventForChannel(data)) return;
  const validatedQueue = queueValidator.updateQueue(data.waiting);
  renderQueue(validatedQueue.seated, validatedQueue.overflow);
  updateOverflowDisplay(validatedQueue.overflow);
});

socket.on('bettingStarted', (data) => {
  if (!isEventForChannel(data)) return;
  startCountdown(Date.now() + (data.duration || 0));
  updatePhaseUI('Betting');
  setPhaseLabel('Betting');
  if (data.mode) setModeBadge(data.mode);
  startPlayerActionTimer(data.endsAt || Date.now() + (data.duration || 0));
});

socket.on('actionPhaseEnded', (data) => {
  if (!isEventForChannel(data)) return;
  updatePhaseUI('Action Ended');
  startPlayerActionTimer(null);
});

socket.on('pokerPhase', (data) => {
  if (!isEventForChannel(data)) return;
  setPhaseLabel(data.phase || '');
  renderCommunityCards(data.community || []);
  if (data.actionEndsAt) {
    startCountdown(data.actionEndsAt);
    startPlayerActionTimer(data.actionEndsAt);
  }
  if (data.players) {
    startPerPlayerTimers(data.players, data.actionEndsAt);
  }
  if (data.mode) setModeBadge(data.mode);
  
  // Accessibility announcements
  if (accessibilityManager) {
    const timeRemaining = data.actionEndsAt ? formatTimeRemaining(data.actionEndsAt) : null;
    accessibilityManager.announceGameState(data.phase, data.mode, timeRemaining);
  }
});

function triggerFoldEffect(login) {
  const el = document.querySelector(`.player-hand[data-login="${login}"] .fold-effect`);
  if (!el) return;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 800);
}

function triggerAllInEffect(login) {
  const el = document.querySelector(`.player-hand[data-login="${login}"] .all-in-effect`);
  if (!el) return;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 900);
}

socket.on('playerTurn', (data) => {
  if (!isEventForChannel(data)) return;
  const login = data.login;
  const endsAt = data.endsAt;
  highlightPlayer(login);
  startPerPlayerTimers([{ login }], endsAt);
});

socket.on('playerUpdate', (payload) => {
  if (!isEventForChannel(payload)) return;
  const login = payload.login;
  if (payload.folded && login) {
    triggerFoldEffect(login);
  }
  if (payload.allIn && login) {
    triggerAllInEffect(login);
  }
});

// Subtle chip bump + sound
function bumpChips(el) {
  if (!el) return;
  el.classList.add('chip-bump');
  setTimeout(() => el.classList.remove('chip-bump'), 420);
  playChipSound();
}

function bumpPlayerChips(login) {
  if (!login) return;
  const hand = document.querySelector(`.player-hand[data-login="${login}"]`);
  if (!hand) return;
  const stack = hand.querySelector('.chip-stack');
  bumpChips(stack || hand);
}

let chipAudioCtx = null;
function playChipSound() {
  try {
    const ctx = chipAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    chipAudioCtx = ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    const vol = overlayTuning.chipVolume ?? 0.16;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol * 0.0125), now + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    // ignore audio errors (e.g., autoplay policies)
  }
}

socket.on('overlaySettings', (data) => {
  if (!isEventForChannel(data)) return;
  const settings = data?.settings || {};
  overlayTuning = { ...overlayTuning, ...settings };
  if (settings.potGlowMultiplier) {
    potGlowMultiplier = settings.potGlowMultiplier;
  }
  applyVisualSettings();
  if (data?.fx) {
    overlayFx = { ...overlayFx, ...data.fx };
    loadDealSprite(overlayFx.dealFx);
    loadWinSprite(overlayFx.winFx);
  }
});

function applyVisualSettings() {
  const root = document.documentElement;
  const tint = resolveCardBackTint(overlayTuning);
  if (tint) root.style.setProperty('--card-back-tint', tint);
  const backImg = overlayTuning.cardBackImage || '/assets/card-back.png';
  if (backImg) root.style.setProperty('--card-back-img', `url('${backImg}')`);
  else root.style.removeProperty('--card-back-img');
  if (overlayTuning.avatarRingColor) root.style.setProperty('--avatar-ring', overlayTuning.avatarRingColor);
  if (overlayTuning.avatarRingImage) root.style.setProperty('--avatar-ring-img', `url('${overlayTuning.avatarRingImage}')`);
  else root.style.removeProperty('--avatar-ring-img');
  if (overlayTuning.profileCardBorder) root.style.setProperty('--profile-card-border', overlayTuning.profileCardBorder);
  const felt = overlayTuning.tableTint || '#0c4c3b';
  const baseBg = `radial-gradient(ellipse at center, ${felt} 0%, #0a352f 58%, #061f1d 100%)`;
  const tex = overlayTuning.tableTexture;
  const bg = tex ? `url('${tex}') center/cover no-repeat, ${baseBg}` : baseBg;
  root.style.setProperty('--table-bg', bg);
  root.style.setProperty('--table-felt', felt);
  if (overlayTuning.tableLogoColor) root.style.setProperty('--table-logo', overlayTuning.tableLogoColor);
}

function resolveCardBackTint(opts = {}) {
  const variant = (opts.cardBackVariant || 'default').toLowerCase();
  if (variant === 'custom' && opts.cardBackTint) return opts.cardBackTint;
  const palette = {
    default: '#0b1b1b',
    emerald: '#00d4a6',
    azure: '#2d9cff',
    magenta: '#c94cff',
    gold: '#f5a524',
  };
  return palette[variant] || palette.default;
}

function startCountdown(endsAt) {
  const badge = document.getElementById('timer-badge');
  if (!badge) return;
  if (!endsAt) {
    badge.textContent = '00:00';
    if (countdownTimer) {
      timerManager.clearInterval(countdownTimer);
      countdownTimer = null;
    }
    return;
  }

  if (countdownTimer) {
    timerManager.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  
  const tick = () => {
    const now = Date.now();
    const diff = Math.max(0, endsAt - now);
    const secs = Math.floor(diff / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    if (badge) badge.textContent = `${mm}:${ss}`;
    if (diff <= 0 && countdownTimer) {
      timerManager.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  };
  tick();
  countdownTimer = timerManager.setInterval(tick, 1000);
}

function setPhaseLabel(label) {
  const el = document.getElementById('phase-label');
  if (!el) return;
  el.textContent = label || '-';
  el.className = 'badge badge-secondary';
  if (label.toLowerCase().includes('flop') || label.toLowerCase().includes('turn') || label.toLowerCase().includes('river')) {
    el.className = 'badge badge-info';
  } else if (label.toLowerCase().includes('bet')) {
    el.className = 'badge badge-warning';
  } else if (label.toLowerCase().includes('showdown')) {
    el.className = 'badge badge-success';
  }
}

function setModeBadge(mode) {
  const el = document.getElementById('mode-badge');
  if (!el) return;
  let label = mode || 'poker';
  if (!isMultiStream) label = 'blackjack';
  el.textContent = `Mode: ${label}${!isMultiStream ? ' (single-channel)' : ''}`;
  el.className = 'badge badge-secondary';
  if (label === 'blackjack') {
    el.className = 'badge badge-warning';
  }
}

// Player action timer mirrors phase/action timers for players
function startPlayerActionTimer(endsAt) {
  const el = document.getElementById('player-action-timer');
  if (!el) return;
  if (playerActionTimer) {
    timerManager.clearInterval(playerActionTimer);
    playerActionTimer = null;
  }
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
    if (diff <= 0 && playerActionTimer) {
      timerManager.clearInterval(playerActionTimer);
      playerActionTimer = null;
    }
  };
  tick();
  playerActionTimer = timerManager.setInterval(tick, 1000);
}

// Optional per-player timers (uses same deadline for now)
function startPerPlayerTimers(players, endsAt) {
  const target = endsAt ? new Date(endsAt).getTime() : null;
  Object.keys(playerTimers).forEach(login => {
    timerManager.clearInterval(playerTimers[login]);
    delete playerTimers[login];
  });

  players.forEach(p => {
    const el = document.getElementById(`timer-${p.login}`);
    if (!el) return;
    if (!target) {
      el.textContent = '';
      return;
    }
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const secs = Math.floor(diff / 1000);
      el.textContent = `Action: ${secs}s`;
      if (diff <= 0 && playerTimers[p.login]) {
        timerManager.clearInterval(playerTimers[p.login]);
        delete playerTimers[p.login];
      }
    };
    tick();
    playerTimers[p.login] = timerManager.setInterval(tick, 1000);
  });
}

function highlightPlayer(login) {
  document.querySelectorAll('.player-hand').forEach(card => card.classList.remove('active-turn'));
  const el = document.getElementById(`timer-${login}`)?.closest('.player-hand');
  if (el) el.classList.add('active-turn');
  bumpPlayerChips(login);
}

function displayResult(data) {
  const resultDisplay = document.getElementById('result-display');
  const handName = document.getElementById('result-hand-name');
  const payout = document.getElementById('result-payout');

  if (data.players && data.players.length > 0) {
    handName.textContent = 'Results';
    payout.textContent = '';
  } else if (data.evaluation) {
    handName.textContent = data.evaluation.name;
    payout.textContent = `${data.evaluation.payout}x`;
  }

  if (resultDisplay) resultDisplay.style.display = 'block';
}

function updatePhaseUI(phaseName) {
  const badge = document.getElementById('phase-badge');
  if (badge) {
    badge.textContent = phaseName;
  }
  
  // Update loading indicator based on loading states
  if (window.loadingManager) {
    const loadingTypes = window.loadingManager.getLoadingTypes();
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (loadingTypes.length > 0 && loadingIndicator) {
      const primaryLoadingType = loadingTypes[0];
      loadingIndicator.textContent = `${primaryLoadingType.charAt(0).toUpperCase() + primaryLoadingType.slice(1)} in progress...`;
      loadingIndicator.style.display = 'block';
      loadingIndicator.className = 'loading-indicator active';
    } else if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
      loadingIndicator.className = 'loading-indicator';
    }
  }
  
  badge.className = 'badge badge-info';

  if (phaseName.includes('Betting')) {
    badge.className = 'badge badge-warning';
  } else if (phaseName.includes('Result') || phaseName.includes('Complete')) {
    badge.className = 'badge badge-success';
  } else if (phaseName.includes('Dealing')) {
    badge.className = 'badge badge-info';
  }
}

function updateProfile(profile) {
  if (profile && profile.settings) {
    if (profile.settings.theme === 'light') {
      document.body.classList.add('light-theme');
    }
  }
}

function updateActionButtons() {
  const disableBJ = overlayState.overlayMode !== 'blackjack' || isMultiStream;
  if (btnHit) btnHit.disabled = disableBJ;
  if (btnStand) btnStand.disabled = disableBJ;
  if (btnDouble) btnDouble.disabled = disableBJ;
  if (btnSurrender) btnSurrender.disabled = disableBJ;
  if (btnInsurance) {
    btnInsurance.disabled = true;
    btnInsurance.classList.add('btn-hidden');
  }
  if (btnSplit) {
    btnSplit.disabled = true;
    btnSplit.classList.add('btn-hidden');
  }
  if (btnPrevHand) btnPrevHand.disabled = disableBJ;
  if (btnNextHand) btnNextHand.disabled = disableBJ;

  if (disableBJ || !overlayState.userLogin) return;

  const me = getOverlayPlayers().find(p => p.login === overlayState.userLogin) || {};
  const upcardAce = overlayState.currentDealerHand && overlayState.currentDealerHand[0] && overlayState.currentDealerHand[0].rank === 'A';
  const canInsurance = upcardAce && !me.insurancePlaced && !me.insurance;
  if (btnInsurance) {
    btnInsurance.disabled = !canInsurance;
    btnInsurance.classList.toggle('btn-hidden', !canInsurance);
  }

  const canSplit =
    !me.split &&
    Array.isArray(me.hand) &&
    me.hand.length === 2 &&
    me.hand[0] &&
    me.hand[1] &&
    me.hand[0].rank === me.hand[1].rank;
  if (btnSplit) {
    btnSplit.disabled = !canSplit;
    btnSplit.classList.toggle('btn-hidden', !canSplit);
  }

  const hasSplit = (me.split || (Array.isArray(me.hands) && me.hands.length > 1));
  if (btnPrevHand) btnPrevHand.disabled = !hasSplit;
  if (btnNextHand) btnNextHand.disabled = !hasSplit;
}

// Button handlers
const btnDraw = document.getElementById('btn-draw');
if (btnDraw) {
  btnDraw.addEventListener('click', () => {
    if (socket.connected) {
      const heldBy = {};
      const currentLogin = overlayState.userLogin;
      if (currentLogin) {
        heldBy[currentLogin] = Array.from(getSelectedHeld());
      }
      socket.emit('forceDraw', { heldBy });
    }
  });
}

const btnForceDraw = document.getElementById('btn-force-draw');
if (btnForceDraw) {
  btnForceDraw.addEventListener('click', () => {
    if (socket.connected) {
      const heldBy = {};
      const currentLogin = overlayState.userLogin;
      if (currentLogin) {
        heldBy[currentLogin] = Array.from(getSelectedHeld());
      }
      socket.emit('forceDraw', { heldBy });
    }
  });
}

// Hold checkboxes
document.querySelectorAll('.hold-checkbox').forEach(cb => {
  cb.addEventListener('change', (e) => {
    const idx = parseInt(e.target.dataset.idx, 10);
    if (Number.isInteger(idx)) {
      toggleHeldIndex(idx, e.target.checked);
    }
    const currentLogin = overlayState.userLogin;
    if (socket.connected && currentLogin) {
      socket.emit('playerHold', { held: Array.from(getSelectedHeld()) });
    }
  });
});

// Blackjack actions
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnDouble = document.getElementById('btn-double');
const btnSurrender = document.getElementById('btn-surrender');
const btnInsurance = document.getElementById('btn-insurance');
const btnSplit = document.getElementById('btn-split');
const btnPrevHand = document.getElementById('btn-prev-hand');
const btnNextHand = document.getElementById('btn-next-hand');
const btnPokerCheck = document.getElementById('poker-check');
const btnPokerCall = document.getElementById('poker-call');
const btnPokerRaise = document.getElementById('poker-raise');
const btnPokerFold = document.getElementById('poker-fold');
const inputPokerRaise = document.getElementById('poker-raise-amount');
const btnThemeToggle = document.getElementById('theme-toggle');
const pokerActions = document.querySelector('.poker-actions');
if (!isMultiStream && pokerActions) {
  pokerActions.style.display = 'none';
}

registerActionButtons({
  btnHit,
  btnStand,
  btnDouble,
  btnSurrender,
  btnInsurance,
  btnSplit,
  btnPrevHand,
  btnNextHand,
});

const currentLogin = () => overlayState.userLogin || null;

function guardedEmit(action, payload = {}) {
  const login = currentLogin();
  if (!socket.connected || !login) return;
  socket.emit(action, payload);
}

const actionEmitters = [
  [btnHit, () => guardedEmit('playerHit', {})],
  [btnStand, () => guardedEmit('playerStand', {})],
  [btnDouble, () => guardedEmit('playerDouble')],
  [btnSurrender, () => guardedEmit('playerSurrender')],
  [btnSplit, () => guardedEmit('playerSplit')],
  [btnPrevHand, () => {
    const login = currentLogin();
    if (!login) return;
    const me = overlayState.overlayPlayers.find(p => p.login === login) || {};
    const prevIdx = Math.max(0, (me.activeHand || 0) - 1);
    guardedEmit('playerSwitchHand', { index: prevIdx });
  }],
  [btnNextHand, () => {
    const login = currentLogin();
    if (!login) return;
    const me = overlayState.overlayPlayers.find(p => p.login === login) || {};
    const nextIdx = Math.min((me.hands?.length || 1) - 1, (me.activeHand || 0) + 1);
    guardedEmit('playerSwitchHand', { index: nextIdx });
  }],
];

actionEmitters.forEach(([btn, handler]) => {
  if (btn) btn.addEventListener('click', handler);
});

if (btnInsurance) {
  btnInsurance.addEventListener('click', () => {
    const login = currentLogin();
    if (!login) return;
    const me = overlayState.overlayPlayers.find(p => p.login === login) || {};
    const maxInsurance = Math.max(1, Math.floor((me.bet || 0) / 2));
    const form = document.createElement('div');
    form.className = 'prompt';
    form.innerHTML = `
      <div class="prompt-card">
        <h4>Insurance</h4>
        <p>Enter amount (max ${maxInsurance}).</p>
        <input type="number" min="1" max="${maxInsurance}" step="1" id="insurance-input" class="form-input">
        <div class="prompt-actions">
          <button id="insurance-cancel" class="btn btn-secondary btn-sm">Cancel</button>
          <button id="insurance-confirm" class="btn btn-info btn-sm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(form);
    form.querySelector('#insurance-cancel').onclick = () => form.remove();
    form.querySelector('#insurance-confirm').onclick = () => {
      const val = Number(form.querySelector('#insurance-input').value);
      if (Number.isFinite(val) && val > 0 && val <= maxInsurance) {
        guardedEmit('playerInsurance', { amount: val });
      }
      form.remove();
    };
  });
}

const pokerHandlers = [
  [btnPokerCheck, () => guardedEmit('playerCheck')],
  [btnPokerCall, () => guardedEmit('playerCall')],
  [btnPokerRaise, () => {
    const amt = parseInt((inputPokerRaise && inputPokerRaise.value) || '0', 10);
    if (Number.isInteger(amt) && amt > 0) {
      guardedEmit('playerRaise', { amount: amt });
    }
  }],
  [btnPokerFold, () => guardedEmit('playerFold')],
];

pokerHandlers.forEach(([btn, handler]) => {
  if (btn) btn.addEventListener('click', handler);
});

if (btnThemeToggle) {
  btnThemeToggle.addEventListener('click', () => {
    const next = toggleTheme();
    Toast.info(`Theme: ${next}`);
    setThemeButtonLabel(btnThemeToggle);
  });
}

const btnStartRound = document.getElementById('btn-start-round');
if (btnStartRound) {
  btnStartRound.addEventListener('click', () => {
    if (socket.connected && getToken()) {
      socket.emit('startRound', {});
      btnStartRound.disabled = true;
      setTimeout(() => {
        btnStartRound.disabled = false;
      }, 1000);
    }
  });
}

const btnAdminPanel = document.getElementById('btn-admin-panel');
if (btnAdminPanel) {
  btnAdminPanel.addEventListener('click', () => {
    window.location.href = '/admin-enhanced.html';
  });
}

// Show admin controls if token exists
if (getToken()) {
  const adminControls = document.getElementById('admin-controls');
  if (adminControls) {
    adminControls.style.display = 'block';
  }
}

// Fetch leaderboard
async function loadLeaderboard() {
  try {
    const data = await apiCall('/leaderboard.json');
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard && data) {
      leaderboard.innerHTML = data
        .slice(0, 10)
        .map(
          (entry, idx) =>
            `<li>
          <span class="leaderboard-rank">#${idx + 1}</span>
          <span class="leaderboard-name">${entry.username}</span>
          <span class="leaderboard-score">${entry.totalWon}</span>
        </li>`
        )
        .join('');
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  }
}

// Load leaderboard on startup
loadLeaderboard();

// Reload leaderboard every 30 seconds
timerManager.setInterval(loadLeaderboard, 30000);

// User authentication helper: read user JWT from localStorage and decode username (simple parse)
function decodeLoginFromJwt(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user || payload.login || null;
  } catch (err) {
    console.warn('Failed to parse user token', err);
    return null;
  }
}
applyVisualSettings();
