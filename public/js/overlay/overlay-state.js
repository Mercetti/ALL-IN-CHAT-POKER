const overlayState = {
  currentPhase: 'waiting',
  selectedHeld: new Set(),
  userLogin: null,
  countdownTimerId: null,
  countdownEndsAt: null,
  playerActionTimerId: null,
  playerTimers: {},
  overlayPlayers: [],
  currentDealerHand: [],
  overlayMode: 'blackjack',
  streamerLogin: '',
  previousCardCounts: new Map(),
  playerBalances: {},
  currentPot: 0,
  minBet: 10,
  potGlowMultiplier: 5,
  overlayTuning: {
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
    cardFaceBase: null,
  },
  overlayFx: {
    dealFx: 'card_deal_24',
    winFx: 'win_burst_6',
  },
  allInFrames: 6,
  loadoutApplied: false,
  catalogCache: null,
  isMultiStream: false,
};

function getOverlayState() {
  return overlayState;
}

function updateOverlayState(patch = {}) {
  Object.assign(overlayState, patch);
  return overlayState;
}

function setOverlayPlayers(players = []) {
  overlayState.overlayPlayers = Array.isArray(players) ? players : [];
  return overlayState.overlayPlayers;
}

function getOverlayPlayers() {
  return overlayState.overlayPlayers;
}

function mergeOverlayPlayer(update = {}) {
  if (!update || !update.login) return overlayState.overlayPlayers;
  const idx = overlayState.overlayPlayers.findIndex(p => p.login === update.login);
  if (idx === -1) {
    overlayState.overlayPlayers.push(update);
  } else {
    overlayState.overlayPlayers[idx] = { ...overlayState.overlayPlayers[idx], ...update };
  }
  return overlayState.overlayPlayers;
}

function getSelectedHeld() {
  return overlayState.selectedHeld;
}

function resetSelectedHeld() {
  overlayState.selectedHeld.clear();
}

function toggleHeldIndex(index, shouldHold) {
  if (typeof index !== 'number' || Number.isNaN(index)) return;
  if (shouldHold) {
    overlayState.selectedHeld.add(index);
  } else {
    overlayState.selectedHeld.delete(index);
  }
}

function setUserLogin(login) {
  overlayState.userLogin = login || null;
  return overlayState.userLogin;
}

function setStreamerLogin(login = '') {
  overlayState.streamerLogin = login || '';
  return overlayState.streamerLogin;
}

function setOverlayMode(mode) {
  overlayState.overlayMode = mode || overlayState.overlayMode;
  return overlayState.overlayMode;
}

function setCurrentPhase(phase) {
  overlayState.currentPhase = phase || overlayState.currentPhase;
  return overlayState.currentPhase;
}

function setCurrentDealerHand(hand = []) {
  overlayState.currentDealerHand = Array.isArray(hand) ? hand : [];
  return overlayState.currentDealerHand;
}

function setPlayerBalances(balances = {}) {
  overlayState.playerBalances = balances || {};
  return overlayState.playerBalances;
}

function setCurrentPot(value) {
  if (typeof value === 'number') {
    overlayState.currentPot = value;
  }
  return overlayState.currentPot;
}

function setMinBet(value) {
  if (typeof value === 'number') {
    overlayState.minBet = value;
  }
  return overlayState.minBet;
}

function setPotGlowMultiplier(value) {
  if (typeof value === 'number') {
    overlayState.potGlowMultiplier = value;
  }
  return overlayState.potGlowMultiplier;
}

function setOverlayTuning(patch = {}) {
  overlayState.overlayTuning = { ...overlayState.overlayTuning, ...patch };
  return overlayState.overlayTuning;
}

function setOverlayFx(patch = {}) {
  overlayState.overlayFx = { ...overlayState.overlayFx, ...patch };
  return overlayState.overlayFx;
}

function setAllInFrames(frames) {
  if (typeof frames === 'number' && frames > 0) {
    overlayState.allInFrames = frames;
  }
  return overlayState.allInFrames;
}

function setCatalogCache(cache) {
  overlayState.catalogCache = cache || null;
  return overlayState.catalogCache;
}

function getCatalogCache() {
  return overlayState.catalogCache;
}

function setLoadoutApplied(applied) {
  overlayState.loadoutApplied = !!applied;
  return overlayState.loadoutApplied;
}

function setCountdownTimerId(id) {
  overlayState.countdownTimerId = id || null;
  return overlayState.countdownTimerId;
}

function getCountdownTimerId() {
  return overlayState.countdownTimerId;
}

function setPlayerActionTimerId(id) {
  overlayState.playerActionTimerId = id || null;
  return overlayState.playerActionTimerId;
}

function getPlayerActionTimerId() {
  return overlayState.playerActionTimerId;
}

function getPlayerTimers() {
  return overlayState.playerTimers;
}

function clearPlayerTimers() {
  Object.keys(overlayState.playerTimers).forEach(login => {
    delete overlayState.playerTimers[login];
  });
}

function setPlayerTimer(login, timerId) {
  if (!login) return;
  overlayState.playerTimers[login] = timerId;
}

function deletePlayerTimer(login) {
  if (!login) return;
  delete overlayState.playerTimers[login];
}

function getPreviousCardCounts() {
  return overlayState.previousCardCounts;
}

function setPreviousCardCount(login, count) {
  if (!login) return;
  overlayState.previousCardCounts.set(login, count);
}

function clearPreviousCardCounts(login) {
  if (login) {
    overlayState.previousCardCounts.delete(login);
  } else {
    overlayState.previousCardCounts.clear();
  }
}

function setIsMultiStream(flag) {
  overlayState.isMultiStream = !!flag;
}

function getIsMultiStream() {
  return overlayState.isMultiStream;
}

export {
  overlayState,
  getOverlayState,
  updateOverlayState,
  setOverlayPlayers,
  getOverlayPlayers,
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
  setCurrentPot,
  setMinBet,
  setPotGlowMultiplier,
  setOverlayTuning,
  setOverlayFx,
  setAllInFrames,
  setCatalogCache,
  getCatalogCache,
  setLoadoutApplied,
  setCountdownTimerId,
  getCountdownTimerId,
  setPlayerActionTimerId,
  getPlayerActionTimerId,
  getPlayerTimers,
  setPlayerTimer,
  deletePlayerTimer,
  clearPlayerTimers,
  getPreviousCardCounts,
  setPreviousCardCount,
  clearPreviousCardCounts,
  setIsMultiStream,
  getIsMultiStream,
};
