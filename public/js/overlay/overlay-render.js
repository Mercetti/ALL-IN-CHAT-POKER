import {
  overlayState,
  getOverlayPlayers,
  setOverlayPlayers,
  getSelectedHeld,
  resetSelectedHeld,
  setPreviousCardCount,
  getPreviousCardCounts,
  setCurrentPot,
  setCountdownTimerId,
  getCountdownTimerId,
  setPlayerActionTimerId,
  getPlayerActionTimerId,
  getPlayerTimers,
  setPlayerTimer,
  deletePlayerTimer,
  clearPlayerTimers,
  setPlayerBalances,
  setOverlayTuning,
  setOverlayFx,
  setAllInFrames,
} from './overlay-state.js';

import {
  DEFAULT_CARD_BACK,
  ALL_IN_EFFECT_SPRITE,
  FOLD_EFFECT,
  DEAL_FACE_DOWN,
  DEAL_FACE_UP,
  CHIP_DENOMS,
  CHIP_ASSETS,
  normalizeSuitName,
  normalizeRankName,
  CARD_FACE_BASE_FALLBACK,
} from './overlay-config.js';

const cardImageCache = new Map();

const animationAssets = {
  flipSprite: null,
  flipMeta: null,
  dealSprite: null,
  dealMeta: null,
  winSprite: null,
  winMeta: null,
};

let actionButtonRefs = {};

function getAnimationManager() {
  return window.animationManager;
}

function getTimerManager() {
  return window.timerManager;
}

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

function normalizeRank(rank = '') {
  const n = normalizeRankName(rank);
  return n || rank;
}

function normalizeSuit(suit = '') {
  const n = normalizeSuitName(suit);
  return n || suit;
}

function getCardFaceImage(rank, suit, basePath) {
  const safeBasePath = basePath || CARD_FACE_BASE_FALLBACK;
  if (!safeBasePath) return null;
  const suitName = normalizeSuit(suit);
  const rankName = normalizeRank(rank);
  if (!suitName || !rankName) return null;
  const safeBase = safeBasePath.replace(/\/$/, '');
  return `${safeBase}/${rankName}_of_${suitName}.png`;
}

function setFlipAssets({ sprite, meta }) {
  animationAssets.flipSprite = sprite;
  animationAssets.flipMeta = meta || null;
}

function setDealAssets({ sprite, meta }) {
  animationAssets.dealSprite = sprite;
  animationAssets.dealMeta = meta || null;
}

function setWinAssets({ sprite, meta }) {
  animationAssets.winSprite = sprite;
  animationAssets.winMeta = meta || null;
}

function registerActionButtons(refs = {}) {
  actionButtonRefs = refs;
}

function updateUI() {
  const container = document.getElementById('player-hands');
  if (container) container.innerHTML = '';
  resetSelectedHeld();
  updatePhaseUI('Waiting for round');

  const resultDisplay = document.getElementById('result-display');
  if (resultDisplay) resultDisplay.style.display = 'none';
}

function renderPlayerHands(players) {
  const container = document.getElementById('player-hands');
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(players)) return;
  const isRevealPhase = ['result', 'showdown', 'reveal'].includes((overlayState.currentPhase || '').toLowerCase());

  updateTableSkinFromPlayers(players);

  players.forEach((player, playerIdx) => {
    const hand = player.hand || [];
    const totalCards = player.hands && Array.isArray(player.hands)
      ? player.hands.reduce((sum, h) => sum + (h ? h.length : 0), 0)
      : hand.length;
    const previousCounts = getPreviousCardCounts();
    const prevTotal = previousCounts.get(player.login) || 0;
    let newRemaining = Math.max(totalCards - prevTotal, 0);
    const balance = typeof player.balance === 'number' ? player.balance : overlayState.playerBalances[player.login] || 0;
    const betAmount = typeof player.bet === 'number' ? player.bet : 0;
    const showBetStack = overlayState.currentPhase === 'betting';
    const streak = typeof player.streak === 'number' ? player.streak : 0;
    const tilt = typeof player.tilt === 'number' ? player.tilt : 0;
    const afk = !!player.afk;
    const isSelf = overlayState.userLogin && player.login && overlayState.userLogin.toLowerCase() === player.login.toLowerCase();
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
        const dealFromY = 220;
        const delay = (playerIdx * (overlayState.overlayTuning.dealDelayBase || 0.18)) + (idx * (overlayState.overlayTuning.dealDelayPerCard || 0.08));
        const rotate = (playerIdx % 2 ? 5 : -5) + idx * 1.5;
        const styleParts = [];
        if (isNew) {
          styleParts.push(`--deal-from-x:${seatOffset}px`, `--deal-from-y:${dealFromY}px`, `--deal-rot:${rotate.toFixed(1)}deg`, `animation-delay:${delay.toFixed(2)}s`);
        }
        const tint = cosmetics.cardBackTint || overlayState.overlayTuning.cardBackTint || null;
        if (tint) {
          styleParts.push(`--card-back-tint:${tint}`);
        }
        const backImg = cosmetics.cardBackImage || overlayState.overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
        if (hidden && backImg) {
          styleParts.push(`--card-back-img:url('${backImg}')`);
        }
        const dealImg = hidden ? DEAL_FACE_DOWN : DEAL_FACE_UP;
        if (isNew && dealImg) {
          styleParts.push(`--deal-effect:url('${dealImg}')`);
        }
        const faceImg = !hidden ? getCardFaceImage(card.rank, card.suit, cosmetics.cardFaceBase || overlayState.overlayTuning.cardFaceBase) : null;
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
          ${(player.hands || []).map((h, idx) => `
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
    const avatarSrc = player.avatar || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-profile_image.png';
    wrapper.innerHTML = `
      <div class="player-header">
        <div class="player-avatar-wrapper ${ringImg ? 'has-ring-img' : ''}" ${ringStyle}>
          ${ringImg ? '<div class="avatar-ring-img"></div>' : ''}
          <div class="avatar-mask">
            <img class="player-avatar" src="${avatarSrc}" alt="${player.login}">
          </div>
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
      <div class="all-in-effect" style="background-image:url('${ALL_IN_EFFECT_SPRITE}');--allin-frames:${overlayState.allInFrames};"></div>
      <div class="fold-effect" style="background-image:url('${FOLD_EFFECT}');"></div>
      ${splitMarkup}
    `;
    container.appendChild(wrapper);

    setPreviousCardCount(player.login, totalCards);
  });

  kickoffFlipCanvases();
  kickoffDealCanvases();
  const btnDraw = document.getElementById('btn-draw');
  if (btnDraw) btnDraw.disabled = false;
}

function updateTableSkinFromPlayers(players = []) {
  if (!Array.isArray(players) || !players.length) return;
  const streamer = players.find(p => p.login && p.login.toLowerCase() === overlayState.streamerLogin);
  const chosen = streamer || players[0];
  if (chosen && chosen.cosmetics) {
    if (chosen.cosmetics.tableTint) overlayState.overlayTuning.tableTint = chosen.cosmetics.tableTint;
    if (chosen.cosmetics.tableTexture) overlayState.overlayTuning.tableTexture = chosen.cosmetics.tableTexture;
    if (chosen.cosmetics.tableLogoColor) overlayState.overlayTuning.tableLogoColor = chosen.cosmetics.tableLogoColor;
    if (chosen.cosmetics.cardFaceBase) overlayState.overlayTuning.cardFaceBase = chosen.cosmetics.cardFaceBase;
    applyVisualSettings();
  }
}

function renderPot(data) {
  const potWrap = document.getElementById('pot-chips');
  const potContainer = document.getElementById('table-pot');
  if (!potWrap) return;
  const explicitPot = data && typeof data.pot === 'number' ? data.pot : null;
  const sumBets = overlayState.overlayPlayers.reduce((sum, p) => sum + (p.bet || 0), 0);
  const pot = explicitPot !== null ? explicitPot : sumBets;
  const prevPot = overlayState.currentPot;
  setCurrentPot(pot);
  const chips = renderChipStack(pot);
  potWrap.innerHTML = `<div class="pot-total">Total Pot: $${(pot || 0).toLocaleString?.() || pot || 0}</div>${chips}`;
  const tablePotValue = document.getElementById('table-pot-value');
  if (tablePotValue) {
    tablePotValue.textContent = `$${(pot || 0).toLocaleString?.() || pot || 0}`;
  }
  if (potContainer) {
    const glowThreshold = (overlayState.minBet || 1) * ((overlayState.overlayTuning.potGlowMultiplier || overlayState.potGlowMultiplier || 5));
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
        const faceImg = getCardFaceImage(card.rank, card.suit, overlayState.overlayTuning.cardFaceBase || null);
        const styles = [];
        if (faceImg) styles.push(`--card-face-img:url('${faceImg}')`);
        const styleAttr = styles.length ? `style="${styles.join(';')}"` : '';
        const cls = faceImg ? 'card-item has-face' : 'card-item';
        const backImg = overlayState.overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
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
      const faceImg = getCardFaceImage(card.rank, card.suit, overlayState.overlayTuning.cardFaceBase || null);
      const styles = [];
      if (faceImg) styles.push(`--card-face-img:url('${faceImg}')`);
      const styleAttr = styles.length ? `style="${styles.join(';')}"` : '';
      const cls = faceImg ? 'card-item has-face' : 'card-item';
      const backImg = overlayState.overlayTuning.cardBackImage || DEFAULT_CARD_BACK;
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

function flipCard(cardEl, faceSrc, backSrc, opts = {}) {
  const canvas = cardEl.querySelector('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = cardEl.offsetWidth;
  const h = canvas.height = cardEl.offsetHeight;
  Promise.all([loadImageCached(faceSrc), loadImageCached(backSrc)]).then(([faceImg, backImg]) => {
    if (!faceImg && !backImg) return;
    const animationManager = getAnimationManager();
    if (!animationManager) return;
    cardEl.classList.add('flipping');
    canvas.classList.add('active');

    const animId = `flip-${Date.now()}-${Math.random()}`;

    animationManager.addFlipAnimation(animId, {
      duration: opts.durationMs || 600,
      delay: opts.delayMs || 0,
      onUpdate: (progress) => {
        if (!animationAssets.flipMeta || !animationAssets.flipSprite || !canvas.isConnected) {
          animationManager.removeAnimation(animId);
          return;
        }

        const frameIndex = Math.floor(progress * animationAssets.flipMeta.frameCount);
        const frameData = animationAssets.flipMeta.frames[frameIndex];
        if (!frameData) return;

        renderFlippingCard(ctx, animationAssets.flipSprite, animationAssets.flipMeta, frameIndex, backImg, faceImg, w, h);
      },
      onComplete: () => {
        canvas.classList.remove('active');
        canvas.parentElement?.classList.remove('flipping');
      }
    });
  });
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

function kickoffFlipCanvases(force) {
  if (!animationAssets.flipSprite || !animationAssets.flipMeta) {
    if (force) setTimeout(() => kickoffFlipCanvases(false), 180);
    return;
  }
  const cards = document.querySelectorAll('.card-item[data-should-flip="1"]:not([data-flip-bound="1"])');
  cards.forEach(card => {
    card.dataset.flipBound = '1';
    const faceSrc = card.dataset.faceImg;
    const backSrc = card.dataset.backImg;
    if (faceSrc && backSrc) {
      flipCard(card, faceSrc, backSrc);
    }
  });
}

function queueDealForCard(cardEl, opts = {}) {
  if (!cardEl || !animationAssets.dealSprite || !animationAssets.dealMeta) return;
  const animationManager = getAnimationManager();
  if (!animationManager) return;
  const canvas = cardEl.querySelector('.deal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = Math.max(1, Math.floor(cardEl.clientWidth || canvas.width || 120));
  const h = Math.max(1, Math.floor(cardEl.clientHeight || canvas.height || 180));
  canvas.width = w;
  canvas.height = h;
  canvas.style.opacity = '1';

  const animId = `deal-${Date.now()}-${Math.random()}`;

  animationManager.addDealAnimation(animId, {
    duration: opts.durationMs || 400,
    delay: opts.delayMs || 0,
    onUpdate: (progress) => {
      if (!animationAssets.dealMeta || !animationAssets.dealSprite || !canvas.isConnected) {
        animationManager.removeAnimation(animId);
        return;
      }

      const frameIndex = Math.floor(progress * (animationAssets.dealMeta.frameCount || 1));
      const spacing = Number.isFinite(animationAssets.dealMeta.spacing) ? animationAssets.dealMeta.spacing : 0;
      const sx = frameIndex * (animationAssets.dealMeta.frameWidth + spacing);
      const fw = animationAssets.dealMeta.frameWidth;
      const fh = animationAssets.dealMeta.frameHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(animationAssets.dealSprite, sx, 0, fw, fh, 0, 0, canvas.width, canvas.height);
    },
    onComplete: () => {
      setTimeout(() => { if (canvas && canvas.isConnected) canvas.style.opacity = '0'; }, 120);
    }
  });
}

function kickoffDealCanvases(force) {
  if (!animationAssets.dealSprite || !animationAssets.dealMeta) {
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
  const animationManager = getAnimationManager();
  if (!animationManager) return;
  const pot = document.getElementById('table-pot');
  if (!pot || !animationAssets.winMeta || !animationAssets.winSprite) return;
  let canvas = pot.querySelector('canvas.win-effect');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'win-effect';
    canvas.width = animationAssets.winMeta.frameWidth || 512;
    canvas.height = animationAssets.winMeta.frameHeight || 512;
    pot.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  const total = animationAssets.winMeta.frameCount || 1;
  const frameWidth = animationAssets.winMeta.frameWidth || animationAssets.winSprite.width;
  const frameHeight = animationAssets.winMeta.frameHeight || animationAssets.winSprite.height;
  const spacingX = typeof animationAssets.winMeta.spacing === 'number' ? animationAssets.winMeta.spacing : 0;
  const spacingY = typeof animationAssets.winMeta.spacingY === 'number' ? animationAssets.winMeta.spacingY : spacingX;
  const columns = animationAssets.winMeta.columns
    || (frameWidth ? Math.max(1, Math.floor((animationAssets.winSprite.width + spacingX) / (frameWidth + spacingX))) : 1);

  const animId = `win-${Date.now()}-${Math.random()}`;

  animationManager.addWinAnimation(animId, {
    fps: animationAssets.winMeta.fps || 18,
    totalFrames: total,
    onFrame: (frameIndex) => {
      if (!canvas.isConnected) return;
      const col = columns ? (frameIndex % columns) : frameIndex;
      const row = columns ? Math.floor(frameIndex / columns) : 0;
      const sx = (frameWidth + spacingX) * col;
      const sy = (frameHeight + spacingY) * row;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(animationAssets.winSprite, sx, sy, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);
    },
    onComplete: () => {
      setTimeout(() => { if (canvas && canvas.isConnected) canvas.remove(); }, 400);
    }
  });
}

function renderQueue(waiting) {
  const queueEl = document.getElementById('waiting-queue');
  const count = document.getElementById('waiting-count');
  const waitingNames = document.getElementById('waiting-names');
  const chipRow = document.getElementById('queue-chip-row');
  if (!queueEl) return;
  queueEl.innerHTML = waiting && waiting.length ? waiting.map(name => `<li>${name}</li>`).join('') : '<li>None</li>';
  const queueList = Array.isArray(waiting) ? waiting : [];
  if (count) count.textContent = queueList.length;
  if (waitingNames) {
    waitingNames.textContent = queueList.length ? queueList.join(' · ') : 'None';
  }
  if (chipRow) {
    if (!queueList.length) {
      chipRow.innerHTML = '<span class="queue-chip queue-chip-empty">Queue is open</span>';
    } else {
      chipRow.innerHTML = queueList.slice(0, 6).map((name) => {
        const player = getOverlayPlayers().find((p) => p.login === name) || {};
        const avatar = player.avatar || player.profile?.avatar || '/assets/overlay/open-seat.svg';
        return `
          <span class="queue-chip">
            <img src="${avatar}" alt="${name}" class="queue-chip-avatar" onerror="this.remove()">
            ${name}
          </span>
        `;
      }).join('');
    }
  }
}

function startCountdown(endsAt) {
  const timerManager = getTimerManager();
  const badge = document.getElementById('timer-badge');
  if (!timerManager || !badge) return;
  const existing = getCountdownTimerId();
  if (!endsAt) {
    badge.textContent = '00:00';
    if (existing) {
      timerManager.clearInterval(existing);
      setCountdownTimerId(null);
    }
    return;
  }

  if (existing) {
    timerManager.clearInterval(existing);
    setCountdownTimerId(null);
  }

  const tick = () => {
    const now = Date.now();
    const diff = Math.max(0, endsAt - now);
    const secs = Math.floor(diff / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    badge.textContent = `${mm}:${ss}`;
    if (diff <= 0) {
      const currentId = getCountdownTimerId();
      if (currentId) {
        timerManager.clearInterval(currentId);
        setCountdownTimerId(null);
      }
    }
  };
  tick();
  const id = timerManager.setInterval(tick, 1000);
  setCountdownTimerId(id);
}

function setPhaseLabel(label) {
  const el = document.getElementById('phase-label');
  if (!el) return;
  const applied = label || '-';
  el.textContent = applied;
  el.className = 'badge badge-secondary';
  const lower = applied.toLowerCase();
  if (lower.includes('flop') || lower.includes('turn') || lower.includes('river')) {
    el.className = 'badge badge-info';
  } else if (lower.includes('bet')) {
    el.className = 'badge badge-warning';
  } else if (lower.includes('showdown')) {
    el.className = 'badge badge-success';
  }
}

function setModeBadge(mode) {
  const el = document.getElementById('mode-badge');
  if (!el) return;
  let label = mode || 'poker';
  if (!overlayState.isMultiStream) label = 'blackjack';
  el.textContent = `Mode: ${label}${!overlayState.isMultiStream ? ' (single-channel)' : ''}`;
  el.className = 'badge badge-secondary';
  if (label === 'blackjack') {
    el.className = 'badge badge-warning';
  }
}

function startPlayerActionTimer(endsAt) {
  const timerManager = getTimerManager();
  const el = document.getElementById('player-action-timer');
  if (!timerManager || !el) return;
  const existing = getPlayerActionTimerId();
  if (existing) {
    timerManager.clearInterval(existing);
    setPlayerActionTimerId(null);
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
    if (diff <= 0) {
      const currentId = getPlayerActionTimerId();
      if (currentId) {
        timerManager.clearInterval(currentId);
        setPlayerActionTimerId(null);
      }
    }
  };
  tick();
  const id = timerManager.setInterval(tick, 1000);
  setPlayerActionTimerId(id);
}

function startPerPlayerTimers(players, endsAt) {
  const timerManager = getTimerManager();
  if (!timerManager) return;
  const target = endsAt ? new Date(endsAt).getTime() : null;
  const timers = getPlayerTimers();
  Object.keys(timers).forEach(login => {
    timerManager.clearInterval(timers[login]);
    deletePlayerTimer(login);
  });

  (players || []).forEach(p => {
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
      if (diff <= 0) {
        const stored = getPlayerTimers()[p.login];
        if (stored) {
          timerManager.clearInterval(stored);
          deletePlayerTimer(p.login);
        }
      }
    };
    tick();
    const id = timerManager.setInterval(tick, 1000);
    setPlayerTimer(p.login, id);
  });
}

function highlightPlayer(login) {
  document.querySelectorAll('.player-hand').forEach(card => card.classList.remove('active-turn'));
  if (!login) return;
  const el = document.getElementById(`timer-${login}`)?.closest('.player-hand');
  if (el) el.classList.add('active-turn');
  bumpPlayerChips(login);
}

function displayResult(data) {
  const resultDisplay = document.getElementById('result-display');
  const handName = document.getElementById('result-hand-name');
  const payout = document.getElementById('result-payout');

  if (!resultDisplay || !handName || !payout) return;

  if (data.players && data.players.length > 0) {
    handName.textContent = 'Results';
    payout.textContent = '';
  } else if (data.evaluation) {
    handName.textContent = data.evaluation.name;
    payout.textContent = `${data.evaluation.payout}x`;
  }

  resultDisplay.style.display = 'block';
}

function updatePhaseUI(phaseName) {
  const badge = document.getElementById('phase-badge');
  if (badge) {
    badge.textContent = phaseName;
  }

  const loadingManager = window.loadingManager;
  if (loadingManager) {
    const loadingTypes = loadingManager.getLoadingTypes();
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

  if (!badge) return;
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
  const {
    btnHit,
    btnStand,
    btnDouble,
    btnSurrender,
    btnInsurance,
    btnSplit,
    btnPrevHand,
    btnNextHand,
  } = actionButtonRefs;

  const disableBJ = overlayState.overlayMode !== 'blackjack' || overlayState.isMultiStream;
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

  const me = overlayState.overlayPlayers.find(p => p.login === overlayState.userLogin) || {};
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
    const vol = overlayState.overlayTuning.chipVolume ?? 0.16;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol * 0.0125), now + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    // ignore audio errors
  }
}

function applyVisualSettings() {
  const root = document.documentElement;
  const tint = resolveCardBackTint(overlayState.overlayTuning);
  if (tint) root.style.setProperty('--card-back-tint', tint);
  const backImg = overlayState.overlayTuning.cardBackImage || '/assets/card-back.png';
  if (backImg) root.style.setProperty('--card-back-img', `url('${backImg}')`);
  else root.style.removeProperty('--card-back-img');
  if (overlayState.overlayTuning.avatarRingColor) root.style.setProperty('--avatar-ring', overlayState.overlayTuning.avatarRingColor);
  if (overlayState.overlayTuning.avatarRingImage) root.style.setProperty('--avatar-ring-img', `url('${overlayState.overlayTuning.avatarRingImage}')`);
  else root.style.removeProperty('--avatar-ring-img');
  if (overlayState.overlayTuning.profileCardBorder) root.style.setProperty('--profile-card-border', overlayState.overlayTuning.profileCardBorder);
  const felt = overlayState.overlayTuning.tableTint || '#0c4c3b';
  const baseBg = `radial-gradient(ellipse at center, ${felt} 0%, #0a352f 58%, #061f1d 100%)`;
  const tex = overlayState.overlayTuning.tableTexture;
  const bg = tex ? `url('${tex}') center/cover no-repeat, ${baseBg}` : baseBg;
  root.style.setProperty('--table-bg', bg);
  root.style.setProperty('--table-felt', felt);
  if (overlayState.overlayTuning.tableLogoColor) root.style.setProperty('--table-logo', overlayState.overlayTuning.tableLogoColor);
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

export {
  loadImageCached,
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
};
