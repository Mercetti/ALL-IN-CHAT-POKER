/**
 * Overlay client with Socket.IO integration
 */

const SOCKET_URL = typeof getBackendBase === 'function' ? getBackendBase() : '';
const overlayChannel = typeof getChannelParam === 'function' ? getChannelParam() : '';
const isMultiStream = overlayChannel && overlayChannel.toLowerCase().startsWith('lobby-');
const isEventForChannel = (payload) => {
  if (!payload || !payload.channel) return true;
  return payload.channel === overlayChannel;
};
const socket = io(SOCKET_URL || undefined, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
  auth: {
    token: (typeof window !== 'undefined' && window.__USER_TOKEN__) || (typeof getUserToken === 'function' ? getUserToken() : null),
    channel: overlayChannel,
  },
});

let currentPhase = 'waiting';
let selectedHeld = new Set();
let userLogin = null;
let countdownTimer = null;
let countdownEndsAt = null;
let overlayPlayers = [];
let currentDealerHand = [];
let overlayMode = 'blackjack';
let streamerLogin = '';
let previousCardCounts = new Map();
let playerBalances = {};
let currentPot = 0;
let minBet = 10;
let potGlowMultiplier = 5;
let overlayTuning = {
  dealDelayBase: 0.18,
  dealDelayPerCard: 0.08,
  chipVolume: 0.16,
  potGlowMultiplier: 0,
  cardBackVariant: 'default',
  cardBackTint: null,
  cardBackImage: null,
  avatarRingColor: null,
  profileCardBorder: null,
  tableTint: null,
  tableLogoColor: null,
  tableTexture: null,
};

function normalizeSuitName(raw = '') {
  const s = (raw || '').toString().toLowerCase();
  if (['h', '♥', 'hearts', 'heart'].includes(s)) return 'hearts';
  if (['d', '♦', 'diamonds', 'diamond'].includes(s)) return 'diamonds';
  if (['c', '♣', 'clubs', 'club'].includes(s)) return 'clubs';
  if (['s', '♠', 'spades', 'spade'].includes(s)) return 'spades';
  return null;
}

function normalizeRankName(raw = '') {
  const r = (raw || '').toString().toUpperCase();
  if (['T', '10'].includes(r)) return '10';
  if (['J', 'JACK'].includes(r)) return 'jack';
  if (['Q', 'QUEEN'].includes(r)) return 'queen';
  if (['K', 'KING'].includes(r)) return 'king';
  if (['A', 'ACE'].includes(r)) return 'ace';
  return ['2', '3', '4', '5', '6', '7', '8', '9'].includes(r) ? r : null;
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
const ALL_IN_EFFECT_SPRITE = '/assets/cosmetics/effects/all-in/allin_burst_horizontal_sheet.png';
const FOLD_EFFECT = '/assets/cosmetics/effects/folds/fold-dust.png';
const DEAL_FACE_DOWN = '/assets/cosmetics/effects/deals/face-down-deal.png';
const DEAL_FACE_UP = '/assets/cosmetics/effects/deals/face-up/face-up-deal.png';
const CARD_FLIP_SPRITE = '/assets/cosmetics/effects/deals/face-up/card_flip_sprite.png';
const DEFAULT_CARD_BACK = '/assets/card-back.png';
let flipSprite = null;
let flipMeta = null;
const CARD_FLIP_META = '/assets/cosmetics/effects/deals/face-up/card_flip_animation.json';
let effectsMeta = null;
let winSprite = null;
let winMeta = null;
let dealSprite = null;
let dealMeta = null;
let overlayFx = { dealFx: 'card_deal_24', winFx: 'win_burst_6' };
let allInFrames = 6;

async function loadAllInSprite() {
  const img = await loadImageCached(ALL_IN_EFFECT_SPRITE);
  if (img && img.naturalHeight) {
    const frames = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
    allInFrames = frames;
    document.querySelectorAll('.all-in-effect').forEach(el => {
      el.style.setProperty('--allin-frames', frames);
    });
  }
}

async function loadPublicConfig() {
  try {
    const res = await fetch('/public-config.json');
    if (res.ok) {
      const cfg = await res.json();
      streamerLogin = (cfg.streamerLogin || '').toLowerCase();
    if (typeof cfg.minBet === 'number') minBet = cfg.minBet;
    if (typeof cfg.potGlowMultiplier === 'number') {
      potGlowMultiplier = cfg.potGlowMultiplier;
      overlayTuning.potGlowMultiplier = cfg.potGlowMultiplier;
    }
    updateUserBadge();
  }
} catch (e) {
  // ignore
}
}
loadPublicConfig();
loadBalances();
loadEffectsMeta();
loadAllInSprite();

async function loadEffectsMeta() {
  try {
    const res = await fetch('/assets/cosmetics/effects/meta.json');
    if (res.ok) {
      effectsMeta = await res.json();
      window.__EFFECTS_META__ = effectsMeta;
      loadWinSprite();
      loadDealSprite();
    }
  } catch (e) {
    // ignore
  }
}

async function loadFlipSprite() {
  try {
    const metaRes = await fetch(CARD_FLIP_META);
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
loadFlipSprite();
loadWinSprite();
loadDealSprite();

function loadFxChoice() {
  try {
    const saved = localStorage.getItem('overlayFxChoice');
    if (saved) overlayFx = { ...overlayFx, ...JSON.parse(saved) };
  } catch (e) {
    // ignore
  }
}
loadFxChoice();
loadWinSprite(overlayFx.winFx);
loadDealSprite(overlayFx.dealFx);

async function loadWinSprite(key) {
  try {
    const fxKey = key || overlayFx.winFx || 'win_burst_6';
    const meta = effectsMeta?.animations?.[fxKey] || effectsMeta?.animations?.win_burst_6 || null;
    if (!meta) return;
    const spritePath = meta.image
      ? (meta.image.startsWith('http') ? meta.image : `/assets/cosmetics/effects/win/${meta.image}`)
      : '/assets/cosmetics/effects/win/cosmic_win_sprite_horizontal_512.png';
    const img = await loadImageCached(spritePath);
    if (img) {
      winSprite = img;
      winMeta = meta;
    }
  } catch (e) {
    // ignore
  }
}

async function loadDealSprite(key) {
  try {
    const fxKey = key || overlayFx.dealFx || 'card_deal_24';
    const meta = effectsMeta?.animations?.[fxKey] || effectsMeta?.animations?.card_deal_24 || null;
    if (!meta) return;
    const spritePath = meta.image
      ? (meta.image.startsWith('http') ? meta.image : `/assets/cosmetics/effects/deals/face-down/${meta.image}`)
      : '/assets/cosmetics/effects/deals/face-down/horizontal_card_deal_sprite.png';
    const img = await loadImageCached(spritePath);
    if (img) {
      dealSprite = img;
      dealMeta = meta;
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
      playerBalances = data;
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
  userLogin = login || null;
  const isStreamer = login && streamerLogin && login.toLowerCase() === streamerLogin;

  if (login) {
    pill.textContent = `Signed in as ${login}`;
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
// Socket.IO event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  Toast.info('Connected');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  Toast.warning('Disconnected');
});

socket.on('state', (data) => {
  if (!isEventForChannel(data)) return;
  console.log('State received:', data);
  updateUI(data);
  overlayPlayers = data.players || [];
  overlayMode = data.mode || overlayMode;
  currentDealerHand = data.dealerHand || currentDealerHand;
  if (data.phase) currentPhase = data.phase;
  renderPlayerHands(overlayPlayers);
  if (data.mode) setModeBadge(data.mode);
  renderPot(data);
  updateActionButtons();
});

socket.on('readyStatus', (data) => {
  if (!isEventForChannel(data)) return;
  setReadyStatus(data || {});
});

socket.on('profile', (profile) => {
  console.log('Profile received:', profile);
  if (profile && profile.login) {
    userLogin = profile.login;
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
  currentPhase = 'dealing';
  currentDealerHand = data.dealerHand || [];
  overlayPlayers = data.players || [];
  overlayMode = data.mode || overlayMode;
  renderDealerHand(currentDealerHand);
  renderCommunityCards(data.community || []);
  renderPlayerHands(overlayPlayers);
  renderPot(data);
  updatePhaseUI('Dealing Cards');
  startCountdown(data.actionEndsAt || null);
  if (data.waiting) renderQueue(data.waiting);
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
  currentPhase = 'betting';
  updatePhaseUI('Place Your Bets');
  renderPlayerHands(overlayPlayers);
  renderPot(data);
});

socket.on('roundResult', (data) => {
  if (!isEventForChannel(data)) return;
  console.log('Round result:', data);
  currentPhase = 'result';
  currentDealerHand = data.dealerHand || [];
  overlayPlayers = data.players || [];
  loadBalances();
  renderDealerHand(currentDealerHand);
  renderCommunityCards(data.community || []);
  renderPlayerHands(overlayPlayers);
  renderPot(data);
  displayResult(data);
  updatePhaseUI('Round Complete');
  startCountdown(null);
  if (data.waiting) renderQueue(data.waiting);
  setPhaseLabel('Showdown');
  if (data.mode) setModeBadge(data.mode);
  const insuranceBanner = document.getElementById('insurance-banner');
  if (insuranceBanner) insuranceBanner.style.display = 'none';
  updateActionButtons();
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
    renderQueue(data.waiting);
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
  if (Array.isArray(overlayPlayers)) {
    overlayPlayers = overlayPlayers.map(p => ({
      ...p,
      streetBet: (data && data.streetBets && data.streetBets[p.login]) || p.streetBet || 0,
      bet: (data && data.totalBets && data.totalBets[p.login]) || p.bet || 0,
    }));
    renderPlayerHands(overlayPlayers);
    renderPot(data);
  }
});

socket.on('playerUpdate', (data) => {
  if (!isEventForChannel(data)) return;
  if (!data || !data.login) return;
  const idx = overlayPlayers.findIndex(p => p.login === data.login);
  if (idx !== -1) {
    overlayPlayers[idx] = { ...overlayPlayers[idx], ...data };
  } else {
    overlayPlayers.push(data);
  }
  renderPlayerHands(overlayPlayers);
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

// UI Functions
function updateUI(data) {
  const container = document.getElementById('player-hands');
  if (container) container.innerHTML = '';
  selectedHeld.clear();
  updatePhaseUI('Waiting for round');

  const resultDisplay = document.getElementById('result-display');
  if (resultDisplay) resultDisplay.style.display = 'none';
}

function renderPlayerHands(players) {
  const container = document.getElementById('player-hands');
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(players)) return;
  const isRevealPhase = ['result', 'showdown', 'reveal'].includes((currentPhase || '').toLowerCase());

  updateTableSkinFromPlayers(players);

  players.forEach((player, playerIdx) => {
    const hand = player.hand || [];
    const totalCards = player.hands && Array.isArray(player.hands)
      ? player.hands.reduce((sum, h) => sum + (h ? h.length : 0), 0)
      : hand.length;
    const prevTotal = previousCardCounts.get(player.login) || 0;
    let newRemaining = Math.max(totalCards - prevTotal, 0);
    const balance = typeof player.balance === 'number' ? player.balance : playerBalances[player.login] || 0;
    const betAmount = typeof player.bet === 'number' ? player.bet : 0;
    const showBetStack = currentPhase === 'betting';
    const streak = typeof player.streak === 'number' ? player.streak : 0;
    const tilt = typeof player.tilt === 'number' ? player.tilt : 0;
    const afk = !!player.afk;
    const isSelf = userLogin && player.login && userLogin.toLowerCase() === player.login.toLowerCase();
    const cosmetics = player.cosmetics || {};

    const wrapper = document.createElement('div');
    wrapper.className = 'player-hand';
    if (player.login) wrapper.dataset.login = player.login;
    if (cosmetics.avatarRingColor) wrapper.style.setProperty('--avatar-ring', cosmetics.avatarRingColor);
    else wrapper.style.removeProperty('--avatar-ring');
    if (cosmetics.avatarRingImage) wrapper.style.setProperty('--avatar-ring-img', `url('${cosmetics.avatarRingImage}')`);
    else wrapper.style.removeProperty('--avatar-ring-img');
    if (cosmetics.profileCardBorder) wrapper.style.setProperty('--profile-card-border', cosmetics.profileCardBorder);
    if (streak >= 2) wrapper.classList.add('hot');
    else if (streak <= -2) wrapper.classList.add('cold');
    if (tilt >= 2) wrapper.classList.add('tilt');
    const renderCards = (cards = []) => cards
      .map((card, idx) => {
        const isNew = newRemaining > 0 && idx >= cards.length - newRemaining;
        if (isNew) newRemaining--;
        const hidden = !isSelf;
        const seatOffset = (playerIdx - Math.floor(players.length / 2)) * 26;
        const dealFromY = 220; // dealer/front-center of the table
        const delay = (playerIdx * (overlayTuning.dealDelayBase || 0.18)) + (idx * (overlayTuning.dealDelayPerCard || 0.08));
        const rotate = (playerIdx % 2 ? 5 : -5) + idx * 1.5;
        const styleParts = [];
        if (isNew) {
          styleParts.push(`--deal-from-x:${seatOffset}px`, `--deal-from-y:${dealFromY}px`, `--deal-rot:${rotate.toFixed(1)}deg`, `animation-delay:${delay.toFixed(2)}s`);
        }
        const tint = cosmetics.cardBackTint || overlayTuning.cardBackTint || null;
        if (tint) {
          styleParts.push(`--card-back-tint:${tint}`);
        }
        const backImg = cosmetics.cardBackImage || overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
        if (hidden && backImg) {
          styleParts.push(`--card-back-img:url('${backImg}')`);
        }
        const dealImg = hidden ? DEAL_FACE_DOWN : DEAL_FACE_UP;
        if (isNew && dealImg) {
          styleParts.push(`--deal-effect:url('${dealImg}')`);
        }
        const faceImg = !hidden ? getCardFaceImage(card.rank, card.suit, cosmetics.cardFaceBase) : null;
        if (faceImg) {
          styleParts.push(`--card-face-img:url('${faceImg}')`);
        }
        const style = styleParts.length ? `style="${styleParts.join(';')}"` : '';
        const flipClass = !hidden && isRevealPhase ? 'flip-in' : '';
        const shouldFlip = !hidden && (isRevealPhase || isNew);
        const classes = ['card-item'];
        if (isNew) classes.push('deal-in');
        if (flipClass) classes.push('flip-in');
        if (hidden) classes.push('card-back');
        if (faceImg) classes.push('has-face');
        return `
          <div class="${classes.join(' ')}" ${style} data-face-img="${faceImg || ''}" data-back-img="${backImg || ''}" data-should-flip="${shouldFlip ? '1' : '0'}" data-should-deal="${isNew ? '1' : '0'}">
            <canvas class="deal-canvas" width="140" height="196"></canvas>
            <canvas class="flip-canvas" width="128" height="180"></canvas>
            <div class="card-rank">${hidden ? '' : card.rank}</div>
            <div class="card-suit">${hidden ? '' : card.suit}</div>
          </div>
        `;
      })
      .join('');

    const splitMarkup = player.hands && Array.isArray(player.hands)
      ? `
        <div class="split-hands">
          ${player.hands.map((h, idx) => `
            <div class="split-hand ${idx === player.activeHand ? 'active-turn' : ''}">
              <div class="split-label">Hand ${idx + 1}</div>
              <div class="cards-grid">${renderCards(h || [])}</div>
            </div>
          `).join('')}
        </div>
      `
      : `
        <div class="cards-grid">
          ${renderCards(hand)}
        </div>
      `;

    const chipStack = renderChipStack(balance);
    const betStack = showBetStack ? renderBetChips(betAmount) : '';
    const streakBadge = renderStreakBadge(streak, tilt, afk);

    const ringImg = cosmetics.avatarRingImage;
    const ringStyle = ringImg ? `style="--avatar-ring-img:url('${ringImg}')"` : '';
    wrapper.innerHTML = `
      <div class="player-header">
        <div class="player-avatar-wrapper ${ringImg ? 'has-ring-img' : ''}" ${ringStyle}>
          ${ringImg ? '<div class="avatar-ring-img"></div>' : ''}
          <img class="player-avatar" src="${player.avatar || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-profile_image.png'}" alt="${player.login}">
        </div>
        <div>
          <div class="player-name">${player.login}</div>
          ${streakBadge}
          ${player.evaluation ? `<div class="player-result">${player.evaluation.name} (${player.evaluation.payout}x)</div>` : ''}
          <div class="bet-badge" title="Street / Total bet">
            <span>Bet:</span>
            <span class="value">${(player.streetBet || 0).toLocaleString?.() || player.streetBet || 0} / ${(player.bet || 0).toLocaleString?.() || player.bet || 0}</span>
          </div>
          ${betStack}
          ${chipStack}
          <div class="player-timer" id="timer-${player.login}"></div>
        </div>
      </div>
      <div class="all-in-effect" style="background-image:url('${ALL_IN_EFFECT_SPRITE}');--allin-frames:${allInFrames};"></div>
      <div class="fold-effect" style="background-image:url('${FOLD_EFFECT}');"></div>
      ${splitMarkup}
    `;
    container.appendChild(wrapper);

    previousCardCounts.set(player.login, totalCards);
  });

  kickoffFlipCanvases();
  kickoffDealCanvases();
  document.getElementById('btn-draw').disabled = false;
}

function updateTableSkinFromPlayers(players = []) {
  if (!Array.isArray(players) || !players.length) return;
  // Prefer streamer cosmetics if present
  const streamer = players.find(p => p.login && p.login.toLowerCase() === streamerLogin);
  const chosen = streamer || players[0];
  if (chosen && chosen.cosmetics) {
    if (chosen.cosmetics.tableTint) overlayTuning.tableTint = chosen.cosmetics.tableTint;
    if (chosen.cosmetics.tableTexture) overlayTuning.tableTexture = chosen.cosmetics.tableTexture;
    if (chosen.cosmetics.tableLogoColor) overlayTuning.tableLogoColor = chosen.cosmetics.tableLogoColor;
    if (chosen.cosmetics.cardFaceBase) overlayTuning.cardFaceBase = chosen.cosmetics.cardFaceBase;
    applyVisualSettings();
  }
}

function renderPot(data) {
  const potWrap = document.getElementById('pot-chips');
  const potContainer = document.getElementById('table-pot');
  if (!potWrap) return;
  const explicitPot = data && typeof data.pot === 'number' ? data.pot : null;
  const sumBets = overlayPlayers.reduce((sum, p) => sum + (p.bet || 0), 0);
  const pot = explicitPot !== null ? explicitPot : sumBets;
  const prevPot = currentPot;
  currentPot = pot;
  const chips = renderChipStack(pot);
  potWrap.innerHTML = `<div class="pot-total">Total Pot: $${(pot || 0).toLocaleString?.() || pot || 0}</div>${chips}`;
  if (potContainer) {
    const glowThreshold = (minBet || 1) * ((overlayTuning.potGlowMultiplier || potGlowMultiplier || 5));
    potContainer.classList.toggle('pot-glow', pot >= glowThreshold);
    if (prevPot !== pot) {
      bumpChips(potContainer);
    }
  }
}

function renderChipStack(amount) {
  const total = Math.max(0, Math.floor(amount || 0));
  if (!total) {
    return `<div class="chip-stack" title="Chips"><div class="chip empty">0</div></div>`;
  }

  const pieces = [];
  let remaining = total;
  CHIP_DENOMS.forEach(denom => {
    const count = Math.floor(remaining / denom.value);
    if (count > 0) {
      pieces.push({ ...denom, count });
      remaining -= count * denom.value;
    }
  });

  const chipsHtml = pieces
    .map(part => {
      const assets = CHIP_ASSETS[part.value] || {};
      const styleParts = [`--chip-color:${part.color}`];
      if (assets.top) styleParts.push(`--chip-img:url('${assets.top}')`);
      if (assets.side) styleParts.push(`--chip-side-img:url('${assets.side}')`);
      const style = `style="${styleParts.join(';')}"`;
      return `<div class="chip" ${style} title="$${part.value} x ${part.count}">
        <span class="chip-label">${part.label}</span>
        <span class="chip-count">x${part.count}</span>
      </div>`;
    })
    .join('');

  return `
    <div class="chip-stack" title="Chips: $${total.toLocaleString?.() || total}">
      <div class="chip-total">Chips: $${total.toLocaleString?.() || total}</div>
      <div class="chip-row">
        ${chipsHtml}
      </div>
    </div>
  `;
}

function renderBetChips(amount) {
  const bet = Math.max(0, Math.floor(amount || 0));
  const chips = renderChipStack(bet);
  return `
    <div class="player-bet-chips" title="Current Bet">
      <div class="chip-total">Bet: $${bet.toLocaleString?.() || bet}</div>
      ${chips}
    </div>
  `;
}

function renderStreakBadge(streak, tilt, afk) {
  const parts = [];
  if (streak >= 2) parts.push('<span class="streak-hot">Hot</span>');
  else if (streak <= -2) parts.push('<span class="streak-cold">Cold</span>');
  if (tilt >= 2) parts.push('<span class="streak-tilt">Tilt</span>');
  if (afk) parts.push('<span class="streak-afk">AFK-prone</span>');
  if (!parts.length) return '';
  return `<div class="streak-badges">${parts.join('')}</div>`;
}

function renderDealerHand(hand) {
  const section = document.getElementById('dealer-section');
  const cardsEl = document.getElementById('dealer-cards');
  if (!section || !cardsEl) return;

  if (!hand || hand.length === 0) {
    section.style.display = 'none';
    cardsEl.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  cardsEl.innerHTML = hand
    .map(
      card => {
        const faceImg = getCardFaceImage(card.rank, card.suit, overlayTuning.cardFaceBase || null);
        const styles = [];
        if (faceImg) styles.push(`--card-face-img:url('${faceImg}')`);
        const styleAttr = styles.length ? `style="${styles.join(';')}"` : '';
        const cls = faceImg ? 'card-item has-face' : 'card-item';
        const backImg = overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
        return `
          <div class="${cls}" ${styleAttr} data-face-img="${faceImg || ''}" data-back-img="${backImg}" data-should-flip="1">
            <canvas class="flip-canvas" width="128" height="180"></canvas>
            <div class="card-rank">${card.rank}</div>
            <div class="card-suit">${card.suit}</div>
          </div>
        `;
      }
    )
    .join('');

  // Toggle insurance banner based on upcard
  const insuranceBanner = document.getElementById('insurance-banner');
  if (insuranceBanner) {
    if (hand[0] && hand[0].rank === 'A') {
      insuranceBanner.style.display = 'flex';
    } else {
      insuranceBanner.style.display = 'none';
    }
  }
  kickoffFlipCanvases();
}

function renderCommunityCards(cards) {
  const section = document.getElementById('community-section');
  const cardsEl = document.getElementById('community-cards');
  if (!section || !cardsEl) return;

  if (!cards || cards.length === 0) {
    section.style.display = 'none';
    cardsEl.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  cardsEl.innerHTML = cards
    .map(card => {
      const faceImg = getCardFaceImage(card.rank, card.suit, overlayTuning.cardFaceBase || null);
      const styles = [];
      if (faceImg) styles.push(`--card-face-img:url('${faceImg}')`);
      const styleAttr = styles.length ? `style="${styles.join(';')}"` : '';
      const cls = faceImg ? 'card-item has-face' : 'card-item';
      const backImg = overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
      return `
        <div class="${cls} flip-in" ${styleAttr} data-face-img="${faceImg || ''}" data-back-img="${backImg}" data-should-flip="1" data-should-deal="0">
          <canvas class="flip-canvas" width="128" height="180"></canvas>
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit">${card.suit}</div>
        </div>
      `;
    })
    .join('');
  kickoffFlipCanvases();
  kickoffDealCanvases();
}

const flipAnimations = new Map();
let flipLoopRunning = false;
const dealAnimations = new Map();
let dealLoopRunning = false;
function queueFlipForCard(cardEl, opts = {}) {
  if (!cardEl || !flipSprite || !flipMeta) return;
  const canvas = cardEl.querySelector('.flip-canvas');
  if (!canvas || flipAnimations.has(canvas)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const faceSrc = cardEl.dataset.faceImg || opts.face;
  const backSrc = cardEl.dataset.backImg || opts.back || overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
  const w = Math.max(1, Math.floor(cardEl.clientWidth || canvas.width || 120));
  const h = Math.max(1, Math.floor(cardEl.clientHeight || canvas.height || 180));
  canvas.width = w;
  canvas.height = h;
  Promise.all([loadImageCached(faceSrc), loadImageCached(backSrc)]).then(([faceImg, backImg]) => {
    if (!faceImg && !backImg) return;
    cardEl.classList.add('flipping');
    canvas.classList.add('active');
    flipAnimations.set(canvas, {
      canvas,
      ctx,
      faceImg: faceImg || null,
      backImg: backImg || null,
      frame: 0,
      nextFrameAt: performance.now() + (opts.delayMs || 0),
    });
    if (!flipLoopRunning) {
      flipLoopRunning = true;
      requestAnimationFrame(stepFlipAnimations);
    }
  });
}

function stepFlipAnimations(ts) {
  flipAnimations.forEach((anim, canvas) => {
    if (!canvas.isConnected) {
      flipAnimations.delete(canvas);
      return;
    }
    if (!flipMeta || !flipSprite) {
      flipAnimations.delete(canvas);
      return;
    }
    if (ts < anim.nextFrameAt) return;
    const frame = flipMeta.frames[anim.frame];
    if (!frame) {
      flipAnimations.delete(canvas);
      canvas.classList.remove('active');
      canvas.parentElement?.classList.remove('flipping');
      return;
    }
    renderFlippingCard(anim.ctx, flipSprite, flipMeta, anim.frame, anim.backImg, anim.faceImg, anim.canvas.width, anim.canvas.height);
    const duration = frame.duration || flipMeta.frameDuration || 40;
    anim.nextFrameAt = ts + duration;
    anim.frame += 1;
    if (anim.frame >= flipMeta.frameCount) {
      if (flipMeta.loop) {
        anim.frame = 0;
      } else {
        flipAnimations.delete(canvas);
        canvas.classList.remove('active');
        canvas.parentElement?.classList.remove('flipping');
      }
    }
  });
  if (flipAnimations.size) {
    requestAnimationFrame(stepFlipAnimations);
  } else {
    flipLoopRunning = false;
  }
}

function kickoffFlipCanvases(force) {
  if (!flipSprite || !flipMeta) {
    if (force) setTimeout(() => kickoffFlipCanvases(false), 180);
    return;
  }
  const cards = document.querySelectorAll('.card-item[data-should-flip="1"]:not([data-flip-bound="1"])');
  cards.forEach(card => {
    card.dataset.flipBound = '1';
    queueFlipForCard(card);
  });
}

function queueDealForCard(cardEl, opts = {}) {
  if (!cardEl || !dealSprite || !dealMeta) return;
  const canvas = cardEl.querySelector('.deal-canvas');
  if (!canvas || dealAnimations.has(canvas)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = Math.max(1, Math.floor(cardEl.clientWidth || canvas.width || 120));
  const h = Math.max(1, Math.floor(cardEl.clientHeight || canvas.height || 180));
  canvas.width = w;
  canvas.height = h;
  canvas.style.opacity = '1';
  dealAnimations.set(canvas, {
    canvas,
    ctx,
    frame: 0,
    nextFrameAt: performance.now() + (opts.delayMs || 0),
  });
  if (!dealLoopRunning) {
    dealLoopRunning = true;
    requestAnimationFrame(stepDealAnimations);
  }
}

function stepDealAnimations(ts) {
  dealAnimations.forEach((anim, canvas) => {
    if (!canvas.isConnected || !dealMeta || !dealSprite) {
      dealAnimations.delete(canvas);
      return;
    }
    if (ts < anim.nextFrameAt) return;
    const total = dealMeta.frameCount || 1;
    const spacing = Number.isFinite(dealMeta.spacing) ? dealMeta.spacing : 0;
    const fIdx = anim.frame % total;
    const sx = fIdx * (dealMeta.frameWidth + spacing);
    const fw = dealMeta.frameWidth;
    const fh = dealMeta.frameHeight;
    anim.ctx.clearRect(0, 0, anim.canvas.width, anim.canvas.height);
    anim.ctx.drawImage(dealSprite, sx, 0, fw, fh, 0, 0, anim.canvas.width, anim.canvas.height);
    anim.frame += 1;
    const delay = dealMeta.frames?.[fIdx]?.duration || (1000 / (dealMeta.fps || 24));
    anim.nextFrameAt = ts + delay;
    if (anim.frame >= total) {
      dealAnimations.delete(canvas);
      setTimeout(() => { if (canvas && canvas.isConnected) canvas.style.opacity = '0'; }, 120);
    }
  });
  if (dealAnimations.size) {
    requestAnimationFrame(stepDealAnimations);
  } else {
    dealLoopRunning = false;
  }
}

function kickoffDealCanvases(force) {
  if (!dealSprite || !dealMeta) {
    if (force) setTimeout(() => kickoffDealCanvases(false), 180);
    return;
  }
  const cards = document.querySelectorAll('.card-item[data-should-deal="1"]:not([data-deal-bound="1"])');
  cards.forEach(card => {
    card.dataset.dealBound = '1';
    queueDealForCard(card);
    card.dataset.shouldDeal = '0';
  });
}

function playWinEffect() {
  const pot = document.getElementById('table-pot');
  if (!pot || !winMeta || !winSprite) return;
  let canvas = pot.querySelector('canvas.win-effect');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'win-effect';
    canvas.width = winMeta.frameWidth || 512;
    canvas.height = winMeta.frameHeight || 512;
    pot.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  let frame = 0;
  const total = winMeta.frameCount || 1;
  const draw = () => {
    if (!canvas.isConnected) return;
    const f = frame % total;
    const sx = (winMeta.spacing || 0) * f + (winMeta.frameWidth * f);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(winSprite, sx, 0, winMeta.frameWidth, winMeta.frameHeight, 0, 0, canvas.width, canvas.height);
    frame += 1;
    if (frame < total) {
      setTimeout(() => requestAnimationFrame(draw), Math.max(20, 1000 / (winMeta.fps || 18)));
    } else if (canvas) {
      setTimeout(() => { if (canvas && canvas.isConnected) canvas.remove(); }, 400);
    }
  };
  requestAnimationFrame(draw);
}

// Queue rendering
function renderQueue(waiting) {
  const queueEl = document.getElementById('waiting-queue');
  const count = document.getElementById('waiting-count');
  if (!queueEl) return;
  queueEl.innerHTML = waiting && waiting.length ? waiting.map(name => `<li>${name}</li>`).join('') : '<li>None</li>';
  if (count) count.textContent = waiting?.length || 0;
}

socket.on('queueUpdate', (data) => {
  if (!isEventForChannel(data)) return;
  renderQueue(data.waiting || []);
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
  countdownEndsAt = endsAt ? new Date(endsAt).getTime() : null;
  const badge = document.getElementById('phase-countdown');
  if (!countdownEndsAt) {
    if (badge) badge.textContent = '00:00';
    if (countdownTimer) clearInterval(countdownTimer);
    return;
  }

  if (countdownTimer) clearInterval(countdownTimer);
  const tick = () => {
    const now = Date.now();
    const diff = Math.max(0, countdownEndsAt - now);
    const secs = Math.floor(diff / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    if (badge) badge.textContent = `${mm}:${ss}`;
    if (diff <= 0) clearInterval(countdownTimer);
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
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
let playerActionTimer = null;
function startPlayerActionTimer(endsAt) {
  const el = document.getElementById('player-action-timer');
  if (!el) return;
  if (playerActionTimer) clearInterval(playerActionTimer);
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
    if (diff <= 0) clearInterval(playerActionTimer);
  };
  tick();
  playerActionTimer = setInterval(tick, 1000);
}

// Optional per-player timers (uses same deadline for now)
const playerTimers = {};
function startPerPlayerTimers(players, endsAt) {
  const target = endsAt ? new Date(endsAt).getTime() : null;
  Object.keys(playerTimers).forEach(login => {
    clearInterval(playerTimers[login]);
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
      if (diff <= 0) clearInterval(playerTimers[p.login]);
    };
    tick();
    playerTimers[p.login] = setInterval(tick, 1000);
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
    badge.className = 'badge badge-info';

    if (phaseName.includes('Betting')) {
      badge.className = 'badge badge-warning';
    } else if (phaseName.includes('Result') || phaseName.includes('Complete')) {
      badge.className = 'badge badge-success';
    } else if (phaseName.includes('Dealing')) {
      badge.className = 'badge badge-info';
    }
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
  const disableBJ = overlayMode !== 'blackjack';
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

  if (disableBJ || !userLogin) return;

  const me = overlayPlayers.find(p => p.login === userLogin) || {};
  const upcardAce = currentDealerHand && currentDealerHand[0] && currentDealerHand[0].rank === 'A';
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
      if (userLogin) {
        heldBy[userLogin] = Array.from(selectedHeld);
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
      if (userLogin) {
        heldBy[userLogin] = Array.from(selectedHeld);
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
      if (e.target.checked) selectedHeld.add(idx);
      else selectedHeld.delete(idx);
    }
    if (socket.connected && userLogin) {
      socket.emit('playerHold', { held: Array.from(selectedHeld) });
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

if (btnHit) {
  btnHit.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerHit', {});
    }
  });
}

if (btnStand) {
  btnStand.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerStand', {});
    }
  });
}

if (btnDouble) {
  btnDouble.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerDouble');
    }
  });
}

if (btnSurrender) {
  btnSurrender.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerSurrender');
    }
  });
}

if (btnInsurance) {
  btnInsurance.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      const me = overlayPlayers.find(p => p.login === userLogin) || {};
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
          socket.emit('playerInsurance', { amount: val });
        }
        form.remove();
      };
    }
  });
}

if (btnSplit) {
  btnSplit.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerSplit');
    }
  });
}

if (btnPrevHand) {
  btnPrevHand.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      const me = overlayPlayers.find(p => p.login === userLogin) || {};
      const prevIdx = Math.max(0, (me.activeHand || 0) - 1);
      socket.emit('playerSwitchHand', { index: prevIdx });
    }
  });
}

if (btnNextHand) {
  btnNextHand.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      const me = overlayPlayers.find(p => p.login === userLogin) || {};
      const nextIdx = Math.min((me.hands?.length || 1) - 1, (me.activeHand || 0) + 1);
      socket.emit('playerSwitchHand', { index: nextIdx });
    }
  });
}

// Poker betting actions
if (btnPokerCheck) {
  btnPokerCheck.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerCheck');
    }
  });
}

if (btnPokerCall) {
  btnPokerCall.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerCall');
    }
  });
}

if (btnPokerRaise) {
  btnPokerRaise.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      const amt = parseInt((inputPokerRaise && inputPokerRaise.value) || '0', 10);
      if (Number.isInteger(amt) && amt > 0) {
        socket.emit('playerRaise', { amount: amt });
      }
    }
  });
}

if (btnPokerFold) {
  btnPokerFold.addEventListener('click', () => {
    if (socket.connected && userLogin) {
      socket.emit('playerFold');
    }
  });
}

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
    window.location.href = '/admin2.html';
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
setInterval(loadLeaderboard, 30000);

// User authentication helper: read user JWT from localStorage and decode username (simple parse)
function initUserFromToken() {
  const token = getUserToken();
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userLogin = payload.user;
  } catch (err) {
    console.warn('Failed to parse user token', err);
  }
}

initUserFromToken();
applyVisualSettings();



