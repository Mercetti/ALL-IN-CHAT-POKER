/**
 * Main Express/Socket.IO server with game logic, auth, and Twitch integration
 */

const express = require('express');
const http = require('http');
const tmi = require('tmi.js');
const socketIO = require('socket.io');
const path = require('path');

// Import utilities
const config = require('./server/config');
const Logger = require('./server/logger');
const validation = require('./server/validation');
const auth = require('./server/auth');
const startup = require('./server/startup');
const db = require('./server/db');
const game = require('./server/game');
const blackjack = require('./server/blackjack');
const stateAdapter = require('./server/state-adapter');
const {
  normalizeChannelName: normalizeChannelNameScoped,
  getDefaultChannel,
} = require('./server/channel-state');
const {
  startBlackjackRound,
  createBlackjackHandlers,
  settleAndEmit: settleAndEmitBlackjack,
} = require('./server/modes/blackjack');
const {
  startPokerRound,
  startPokerPhaseTimer,
  createPokerHandlers,
  settleAndEmit: settleAndEmitPoker,
} = require('./server/modes/poker');
const fetch = global.fetch;

const logger = new Logger('server');
let currentMode = 'blackjack';
let tmiClient = null;
const DEFAULT_CHANNEL = getDefaultChannel();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(express.json());
// Serve welcome page at root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});
// Expose minimal public config for the frontend (no secrets)
app.get('/public-config.json', (req, res) => {
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || 'https';
  const redirectUri =
    config.TWITCH_REDIRECT_URI ||
    `${proto}://${req.get('host')}/login.html`;
  res.json({
    twitchClientId: config.TWITCH_CLIENT_ID || '',
    redirectUri,
    streamerLogin: config.STREAMER_LOGIN || '',
    botAdminLogin: config.BOT_ADMIN_LOGIN || '',
    minBet: config.GAME_MIN_BET || 0,
    potGlowMultiplier: config.POT_GLOW_MULTIPLIER || 5,
    defaultChannel: DEFAULT_CHANNEL,
  });
});
app.use(express.static('public'));

function normalizeChannelName(name) {
  return normalizeChannelNameScoped(name);
}

function getChannelFromReq(req) {
  const bodyChannel = req && req.body && req.body.channel;
  const queryChannel = req && req.query && req.query.channel;
  const headerChannel = req && req.headers && (req.headers['x-channel'] || req.headers['x-streamer']);
  const channel =
    bodyChannel ||
    queryChannel ||
    headerChannel ||
    config.TWITCH_CHANNEL ||
    config.STREAMER_LOGIN ||
    DEFAULT_CHANNEL;
  return normalizeChannelName(channel);
}

function getChannelFromSocket(socket) {
  const authChannel = socket?.handshake?.auth?.channel;
  const queryChannel = socket?.handshake?.query?.channel;
  const channel =
    authChannel ||
    queryChannel ||
    config.TWITCH_CHANNEL ||
    config.STREAMER_LOGIN ||
    DEFAULT_CHANNEL;
  return normalizeChannelName(channel);
}

async function joinBotChannel(channelName) {
  const channel = normalizeChannelName(channelName);
  if (!channel) return;
  if (!tmiClient) {
    logger.warn('Cannot join channel; tmi client not ready', { channel });
    return;
  }
  db.addBotChannel(channel);
  try {
    await tmiClient.join(channel);
    logger.info('Bot joined channel', { channel });
  } catch (err) {
    logger.error('Failed to join channel', { channel, error: err.message });
  }
}

// ============ STATE MANAGEMENT ============

let currentDeck = [];
let currentHand = [];
let roundInProgress = false;
let bettingOpen = true;
let betAmounts = {};
let streamerProfile = null;
let playerStates = {};
let dealerState = { hand: [], shoe: [] };
let waitingQueue = [];
let communityCards = [];

const MAX_POKER_PLAYERS = 10;
const MAX_BLACKJACK_PLAYERS = 7;
let blackjackActionTimer = null;
let bettingTimer = null;
let pokerActionTimer = null;
let pokerPhase = 'preflop';
let pokerCurrentBet = 0;
let pokerStreetBets = {};
let pokerPot = 0;
let pokerActed = new Set();
let playerTurnOrder = [];
let playerTurnIndex = 0;
let turnManager = null;
let pokerHandlers = null;
let blackjackHandlers = null;
const playerHeuristics = {};

function getLegacyStateView() {
  return {
    get currentMode() { return currentMode; }, set currentMode(v) { currentMode = v; },
    get currentDeck() { return currentDeck; }, set currentDeck(v) { currentDeck = v; },
    get currentHand() { return currentHand; }, set currentHand(v) { currentHand = v; },
    get roundInProgress() { return roundInProgress; }, set roundInProgress(v) { roundInProgress = v; },
    get bettingOpen() { return bettingOpen; }, set bettingOpen(v) { bettingOpen = v; },
    get betAmounts() { return betAmounts; }, set betAmounts(v) { betAmounts = v; },
    get streamerProfile() { return streamerProfile; }, set streamerProfile(v) { streamerProfile = v; },
    get playerStates() { return playerStates; }, set playerStates(v) { playerStates = v; },
    get dealerState() { return dealerState; }, set dealerState(v) { dealerState = v; },
    get waitingQueue() { return waitingQueue; }, set waitingQueue(v) { waitingQueue = v; },
    get communityCards() { return communityCards; }, set communityCards(v) { communityCards = v; },
    get blackjackActionTimer() { return blackjackActionTimer; }, set blackjackActionTimer(v) { blackjackActionTimer = v; },
    get bettingTimer() { return bettingTimer; }, set bettingTimer(v) { bettingTimer = v; },
    get pokerActionTimer() { return pokerActionTimer; }, set pokerActionTimer(v) { pokerActionTimer = v; },
    get pokerPhase() { return pokerPhase; }, set pokerPhase(v) { pokerPhase = v; },
    get pokerCurrentBet() { return pokerCurrentBet; }, set pokerCurrentBet(v) { pokerCurrentBet = v; },
    get pokerStreetBets() { return pokerStreetBets; }, set pokerStreetBets(v) { pokerStreetBets = v; },
    get pokerPot() { return pokerPot; }, set pokerPot(v) { pokerPot = v; },
    get pokerActed() { return pokerActed; }, set pokerActed(v) { pokerActed = v; },
    get playerTurnOrder() { return playerTurnOrder; }, set playerTurnOrder(v) { playerTurnOrder = v; },
    get playerTurnIndex() { return playerTurnIndex; }, set playerTurnIndex(v) { playerTurnIndex = v; },
    get turnManager() { return turnManager; }, set turnManager(v) { turnManager = v; },
    get pokerHandlers() { return pokerHandlers; }, set pokerHandlers(v) { pokerHandlers = v; },
    get blackjackHandlers() { return blackjackHandlers; }, set blackjackHandlers(v) { blackjackHandlers = v; },
    get playerHeuristics() { return playerHeuristics; }, set playerHeuristics(v) { Object.assign(playerHeuristics, v); },
  };
}

// Provide a legacy state view for single-tenant mode so we can conditionally
// switch to channel-scoped state when MULTITENANT_ENABLED is true.
function getStateForChannel(channel = DEFAULT_CHANNEL) {
  if (!config.MULTITENANT_ENABLED) return getLegacyStateView();
  return stateAdapter.getState(normalizeChannelName(channel) || DEFAULT_CHANNEL);
}

function ensureHeuristic(login) {
  if (!playerHeuristics[login]) {
    playerHeuristics[login] = { history: [], streak: 0, tilt: 0, lastBetRatio: 0, rounds: 0, timeouts: [] };
  }
  return playerHeuristics[login];
}

function recordBetHeuristic(login, amount, balanceAfter) {
  const h = ensureHeuristic(login);
  const ratio = amount > 0 ? amount / (amount + Math.max(balanceAfter, 0.01)) : 0;
  h.lastBetRatio = ratio;
}

function recordOutcomeHeuristic(login, won) {
  const h = ensureHeuristic(login);
  h.history.push(won ? 1 : -1);
  if (h.history.length > config.STREAK_WINDOW) h.history.shift();
  h.streak = h.history.reduce((a, b) => a + b, 0);
  const tiltDelta = won ? -0.5 * h.lastBetRatio : h.lastBetRatio;
  h.tilt = Math.max(-3, Math.min(3, (h.tilt || 0) + tiltDelta));
  h.rounds = (h.rounds || 0) + 1;
}

function recordTimeoutHeuristic(login) {
  const h = ensureHeuristic(login);
  h.timeouts.push(Date.now());
  if (h.timeouts.length > config.BJ_TIMEOUT_WINDOW) h.timeouts.shift();
}

function getHeuristics(login) {
  const h = playerHeuristics[login] || { streak: 0, tilt: 0, rounds: 0, timeouts: [] };
  const timeouts = Array.isArray(h.timeouts) ? h.timeouts : [];
  const afk = timeouts.length >= config.BJ_TIMEOUT_THRESHOLD;
  return { streak: h.streak || 0, tilt: h.tilt || 0, rounds: h.rounds || 0, afk };
}

function updateHeuristicsAfterPayout(prevBets = {}, payoutPayload, dbInstance, channel = DEFAULT_CHANNEL) {
  const payoutMap = (payoutPayload && payoutPayload.payouts) || {};
  Object.keys(prevBets || {}).forEach(login => {
    const win = (payoutMap[login] || 0) > 0;
    recordOutcomeHeuristic(login, win);
    const heur = getHeuristics(login);
    const balance = dbInstance ? dbInstance.getBalance(login) : db.getBalance(login);
    io.to(channel || DEFAULT_CHANNEL).emit('playerUpdate', { login, streak: heur.streak, tilt: heur.tilt, balance, bet: 0, afk: heur.afk, channel: channel || DEFAULT_CHANNEL });
  });
}

function getBlackjackTurnDuration(login) {
  const base = config.BJ_ACTION_DURATION_MS;
  const heur = getHeuristics(login);
  let duration = base;
  const timeouts = (playerHeuristics[login]?.timeouts || []).length;
  if (timeouts >= config.BJ_TIMEOUT_THRESHOLD) {
    duration = base * config.BJ_TIMER_MIN_PCT;
  } else if ((heur.rounds || 0) < config.BJ_NEW_PLAYER_ROUNDS || timeouts === 0) {
    duration = base * config.BJ_TIMER_MAX_PCT;
  }
  duration = Math.max(config.BJ_TIMER_MIN_MS, Math.min(config.BJ_TIMER_MAX_MS, Math.floor(duration)));
  return duration;
}

/**
 * Get or init player state
 * @param {string} login
 * @returns {Object}
 */
function getPlayerState(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (!state.playerStates[login]) {
    state.playerStates[login] = {
      deck: [],
      hand: [],
      held: [],
      stood: false,
      busted: false,
      folded: false,
    };
  }
  return state.playerStates[login];
}

// Rate limiting
const adminLoginAttempts = new Map();
const blockedIPs = new Map();

/**
 * Extract actor identifier (admin username) from request for audit logs
 * @param {Object} req
 */
function getActorFromReq(req) {
  try {
    const payload = auth.extractJWT(req);
    if (payload && payload.adminName) return payload.adminName;
  } catch (e) {
    // ignore
  }
  if (req && req.body && req.body.adminUser) return req.body.adminUser;
  return 'admin';
}

/**
 * Check if IP is blocked
 * @param {string} ip
 * @returns {boolean}
 */
function isIPBlocked(ip) {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  if (Date.now() > block.unblockTime) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

/**
 * Block IP with exponential backoff
 * @param {string} ip
 */
function blockIP(ip) {
  const existing = blockedIPs.get(ip) || { attempts: 0 };
  const attempts = existing.attempts + 1;
  const penalty = config.ADMIN_LOGIN_BASE_PENALTY_SECONDS * Math.pow(2, attempts - 1);
  const unblockTime = Date.now() + penalty * 1000;

  blockedIPs.set(ip, {
    attempts,
    unblockTime,
    blockedAt: new Date(),
  });

  logger.warn('IP blocked due to failed login attempts', {
    ip,
    attempts,
    penaltySeconds: penalty,
  });
}

/**
 * Record login attempt
 * @param {string} ip
 * @returns {boolean} - true if still allowed, false if over limit
 */
function recordLoginAttempt(ip) {
  if (isIPBlocked(ip)) return false;

  const now = Date.now();
  const windowStart = now - config.ADMIN_LOGIN_ATTEMPT_WINDOW_SECONDS * 1000;
  const attempts = adminLoginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => t > windowStart);

  if (recentAttempts.length >= config.ADMIN_LOGIN_MAX_ATTEMPTS) {
    blockIP(ip);
    return false;
  }

  recentAttempts.push(now);
  adminLoginAttempts.set(ip, recentAttempts);
  return true;
}

/**
 * Place or adjust a bet for a username, handling balance deductions
 * @param {string} username
 * @param {number} amount
 * @param {string} channel
 * @returns {boolean} success
 */
function placeBet(username, amount, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (!state.bettingOpen) {
    logger.debug('Bet rejected; betting closed', { username, channel: channelName });
    return false;
  }

  const maxPlayers = state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS;
  const isNewPlayer = state.betAmounts[username] === undefined;
  const activeCount = Object.keys(state.betAmounts).length + (isNewPlayer ? 1 : 0);
  if (isNewPlayer && activeCount > maxPlayers) {
    if (!state.waitingQueue.includes(username)) state.waitingQueue.push(username);
    logger.warn('Bet rejected; table full, added to queue', { username, maxPlayers, channel: channelName });
    return false;
  }

  if (!validation.validateUsername(username)) {
    logger.debug('Rejected bet with invalid username', { username, channel: channelName });
    return false;
  }

  if (!Number.isInteger(amount) || amount < config.GAME_MIN_BET || amount > config.GAME_MAX_BET) {
    logger.debug('Rejected bet with invalid amount', { username, amount, channel: channelName });
    return false;
  }

  const existingBet = state.betAmounts[username] || 0;
  const currentBalance = db.getBalance(username);
  const available = currentBalance + existingBet; // refund previous bet to recalc
  const heur = getHeuristics(username, channelName);
  const tiltClamp = Math.max(config.GAME_MIN_BET, Math.floor(available * config.TILT_BET_CLAMP_RATIO));
  let targetAmount = amount;

  if (state.currentMode === 'blackjack') {
    if (amount > available * config.TILT_BET_WARN_RATIO) {
      logger.warn('Tilt warning: high bet ratio', { username, amount, available });
    }
    if (heur.tilt >= 2 && amount > tiltClamp && tiltClamp >= config.GAME_MIN_BET) {
      logger.warn('Clamping bet due to tilt', { username, requested: amount, clamped: tiltClamp });
      targetAmount = tiltClamp;
    }
  }

  if (targetAmount > available || available <= 0) {
    logger.warn('Bet exceeds available balance', { username, amount: targetAmount, available });
    if (!waitingQueue.includes(username)) waitingQueue.push(username);
    return false;
  }

  // Deduct new bet
  const newBalance = available - targetAmount;
  db.setBalance(username, newBalance);
  state.betAmounts[username] = targetAmount;
  if (state.currentMode === 'poker') {
    state.pokerCurrentBet = Math.max(state.pokerCurrentBet, targetAmount);
  }
  state.waitingQueue = state.waitingQueue.filter(u => u !== username);
  recordBetHeuristic(username, targetAmount, newBalance, channelName);

  // Ensure profile exists
  db.upsertProfile({
    login: username,
    display_name: username,
    settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
    role: 'player',
  });

  getPlayerState(username, channelName); // init state

  logger.info('Bet placed', { username, amount, remaining: newBalance });
  const updatedHeur = getHeuristics(username, channelName);
  io.to(channelName).emit('playerUpdate', { login: username, bet: amount, balance: newBalance, streak: updatedHeur.streak, tilt: updatedHeur.tilt, channel: channelName });
  emitQueueUpdate(channelName);
  return true;
}

function startPokerActionTimer(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const emitter = io.to(channelName);
  if (state.pokerActionTimer) clearTimeout(state.pokerActionTimer);
  state.pokerActionTimer = startPokerPhaseTimer(
    emitter,
    state.pokerPhase,
    state.communityCards,
    config.POKER_ACTION_DURATION_MS,
    () => advancePokerPhase(channelName),
    channelName
  );
}

function advancePokerPhase(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  if (!state.roundInProgress || state.currentMode === 'blackjack') return;

  // Reset street bets/current bet for new street
  state.pokerStreetBets = {};
  state.pokerCurrentBet = 0;
  state.pokerActed = new Set();
  emitPokerBettingState(channel);

  if (state.pokerPhase === 'preflop') {
    // Deal flop
    state.communityCards = state.communityCards.concat(state.currentDeck.splice(0, 3));
    state.pokerPhase = 'flop';
    startPokerActionTimer(channel);
    return;
  }
  if (state.pokerPhase === 'flop') {
    state.communityCards = state.communityCards.concat(state.currentDeck.splice(0, 1));
    state.pokerPhase = 'turn';
    startPokerActionTimer(channel);
    return;
  }
  if (state.pokerPhase === 'turn') {
    state.communityCards = state.communityCards.concat(state.currentDeck.splice(0, 1));
    state.pokerPhase = 'river';
    startPokerActionTimer(channel);
    return;
  }
  if (state.pokerPhase === 'river') {
    state.pokerPhase = 'showdown';
    if (state.pokerActionTimer) clearTimeout(state.pokerActionTimer);
    settleRound({ channel });
    return;
  }
}

function settleRound(data) {
  const channel = normalizeChannelName(data?.channel || DEFAULT_CHANNEL) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channel);
  const emitter = io.to(channel);
  try {
    const prevBets = { ...state.betAmounts };
    if (state.currentMode === 'blackjack') {
      const { broke, nextWaiting, nextBetAmounts, nextPlayerStates, payoutPayload } = settleAndEmitBlackjack(emitter, state.dealerState, state.playerStates, state.betAmounts, state.waitingQueue, db, channel);
      state.waitingQueue = nextWaiting;
      state.betAmounts = nextBetAmounts;
      state.playerStates = nextPlayerStates;
      updateHeuristicsAfterPayout(prevBets, payoutPayload, db, channel);
      broke.forEach(login => {
        if (!state.waitingQueue.includes(login)) state.waitingQueue.push(login);
      });
    } else {
      const { broke, nextWaiting, nextBetAmounts, nextPlayerStates, payoutPayload } = settleAndEmitPoker(emitter, state.playerStates, state.communityCards, state.betAmounts, state.waitingQueue, db, channel);
      state.waitingQueue = nextWaiting;
      state.betAmounts = nextBetAmounts;
      state.playerStates = nextPlayerStates;
      updateHeuristicsAfterPayout(prevBets, payoutPayload, db, channel);
      broke.forEach(login => {
        if (!state.waitingQueue.includes(login)) state.waitingQueue.push(login);
      });
    }

    cleanupAfterSettle(channel);
  } catch (err) {
    logger.error('Failed to process round settle', { error: err.message, channel });
  }
}

function cleanupAfterSettle(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  state.betAmounts = {};
  state.playerStates = {};
  state.pokerCurrentBet = 0;
  state.pokerStreetBets = {};
  state.pokerPot = 0;
  state.pokerActed = new Set();
  state.roundInProgress = false;
  state.bettingOpen = false;
  if (state.bettingTimer) clearTimeout(state.bettingTimer);
  if (state.blackjackActionTimer) clearTimeout(state.blackjackActionTimer);
  if (state.pokerActionTimer) clearTimeout(state.pokerActionTimer);
  if (state.turnManager && state.turnManager.stop) state.turnManager.stop();
  emitQueueUpdate(channel);
}

function emitQueueUpdate(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const bets = Object.keys(state.betAmounts).length;
  io.to(channelName).emit('queueUpdate', {
    waiting: state.waitingQueue,
    limits: {
      poker: MAX_POKER_PLAYERS,
      blackjack: MAX_BLACKJACK_PLAYERS,
    },
    activeBets: bets,
    channel: channelName,
  });
}

function openBettingWindow(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (state.roundInProgress) return;

  // Reset round state for new betting window
  state.betAmounts = {};
  state.playerStates = {};
  state.pokerCurrentBet = 0;
  state.pokerStreetBets = {};
  state.pokerPot = 0;
  state.pokerActed = new Set();
  state.dealerState = { hand: [], shoe: [] };
  state.communityCards = [];
  state.pokerPhase = 'preflop';
  state.playerTurnOrder = [];
  state.playerTurnIndex = 0;

  state.bettingOpen = true;
  const duration = state.currentMode === 'blackjack' ? config.BJ_BETTING_DURATION_MS : config.BETTING_PHASE_DURATION_MS;
  const endsAt = Date.now() + duration;

  if (state.bettingTimer) clearTimeout(state.bettingTimer);
  state.bettingTimer = setTimeout(() => {
    state.bettingOpen = false;
    startRoundInternal(channelName);
  }, duration);

  io.to(channelName).emit('bettingStarted', { duration, endsAt, mode: state.currentMode, channel: channelName });
}

function startRoundInternal(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const channelEmitter = io.to(channelName);
  try {
    if (state.bettingTimer) clearTimeout(state.bettingTimer);
    state.bettingOpen = false;
    state.roundInProgress = true;
    state.playerStates = {};
    state.pokerCurrentBet = 0;
    state.pokerStreetBets = {};
    state.pokerPot = 0;
    state.pokerActed = new Set();
    state.dealerState = { hand: [], shoe: state.dealerState.shoe || [] };
    state.communityCards = [];
    state.pokerPhase = 'preflop';
    state.playerTurnOrder = [];
    state.playerTurnIndex = 0;

    const bettors = Object.keys(state.betAmounts);
    if (bettors.length === 0 && state.currentMode === 'blackjack') {
      // Blackjack only: auto-place min bet for first queued player if available
      const next = state.waitingQueue.shift();
      if (next) {
        const minBet = config.GAME_MIN_BET;
        placeBet(next, minBet, channelName);
        emitQueueUpdate(channelName);
      }
    }

    const activeBettors = Object.keys(state.betAmounts);
    if (activeBettors.length === 0) {
      io.to(channelName).emit('error', 'No bets placed');
      state.roundInProgress = false;
      return;
    }

    if (state.currentMode === 'blackjack') {
      const bj = startBlackjackRound(state.dealerState, state.playerStates, activeBettors, MAX_BLACKJACK_PLAYERS);
      state.currentHand = bj.dealerHand;
      state.currentDeck = bj.dealerShoe;
      state.blackjackHandlers = createBlackjackHandlers(
        channelEmitter,
        state.dealerState,
        state.playerStates,
        () => settleRound({ channel: channelName }),
        () => startPlayerTurnCycle(channelName),
        getBlackjackTurnDuration,
        recordTimeoutHeuristic,
        channelName
      );
      state.pokerHandlers = null;
    } else {
      const { deck, community } = startPokerRound(state.playerStates, activeBettors, MAX_POKER_PLAYERS);
      state.currentDeck = deck;
      state.communityCards = community;
      state.pokerCurrentBet = Math.max(...activeBettors.map(b => state.betAmounts[b] || 0), 0);
      state.pokerStreetBets = {};
      state.pokerPot = 0;
      activeBettors.forEach(login => {
        const amt = state.betAmounts[login] || 0;
        state.pokerStreetBets[login] = amt;
        state.pokerPot += amt;
      });
      state.pokerActed = new Set(activeBettors.filter(login => (state.pokerStreetBets[login] || 0) >= state.pokerCurrentBet));
      emitPokerBettingState(channelName);
      state.pokerHandlers = createPokerHandlers(
        channelEmitter,
        state.playerStates,
        state.communityCards,
        () => settleRound({ channel: channelName }),
        (login) => {
          const streetBet = state.pokerStreetBets[login] || 0;
          return streetBet < state.pokerCurrentBet;
        },
        channelName
      );
      state.blackjackHandlers = null;
    }
    state.playerTurnOrder = activeBettors.slice(0, state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS);
    state.playerTurnIndex = 0;

    logger.info('New round started', { channel: channelName });
    io.to(channelName).emit('roundStarted', {
      dealerHand: state.currentMode === 'blackjack' ? state.currentHand : null,
      players: Object.entries(state.playerStates).map(([login, pState]) => ({
        login,
        hand: pState.hand || pState.hole || [],
        hands: pState.hands,
        activeHand: pState.activeHand,
        split: pState.isSplit,
        insurance: pState.insurance,
        insurancePlaced: pState.insurancePlaced,
        bet: state.betAmounts[login] || 0,
        streetBet: state.pokerStreetBets[login] || 0,
        avatar: (db.getProfile(login)?.settings && JSON.parse(db.getProfile(login).settings || '{}').avatarUrl) || null,
      })),
      waiting: state.waitingQueue,
      community: state.communityCards,
      actionEndsAt: state.currentMode === 'blackjack' ? Date.now() + config.BJ_ACTION_DURATION_MS : null,
      mode: state.currentMode,
      pot: state.pokerPot,
      currentBet: state.pokerCurrentBet,
      channel: channelName,
    });

    // Blackjack action timer -> auto settle
    if (state.currentMode === 'blackjack') {
      if (state.blackjackActionTimer) clearTimeout(state.blackjackActionTimer);
      state.blackjackActionTimer = state.blackjackHandlers?.actionTimer?.();
    } else {
      // Poker action timer -> auto advance phase
      startPokerActionTimer(channelName);
    }
    startPlayerTurnCycle(channelName);
  } catch (err) {
    logger.error('Failed to start round', { error: err.message, channel: channelName });
    state.roundInProgress = false;
  }
}

/**
 * Validate Twitch user token and return profile basics
 * @param {string} token
 * @returns {Promise<{login:string, user_id:string, display_name:string, avatarUrl?:string}>}
 */
async function fetchTwitchUser(token) {
  const validateRes = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: {
      Authorization: `OAuth ${token}`,
    },
  });

  if (!validateRes.ok) {
    throw new Error(`Twitch validate failed: ${validateRes.status}`);
  }

  const validateData = await validateRes.json();
  const login = validateData.login;
  const user_id = validateData.user_id;

  let avatarUrl = undefined;
  let display_name = validateData.login;

  if (config.TWITCH_CLIENT_ID) {
    const userRes = await fetch(`https://api.twitch.tv/helix/users?id=${user_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': config.TWITCH_CLIENT_ID,
      },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData.data && userData.data[0]) {
        avatarUrl = userData.data[0].profile_image_url;
        display_name = userData.data[0].display_name || login;
      }
    }
  }

  return { login, user_id, display_name, avatarUrl };
}

// ============ HTTP ENDPOINTS ============

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const health = startup.getHealth();
  res.json(health);
});

/**
 * Admin login endpoint with rate limiting
 */
app.post('/admin/login', (req, res) => {
  try {
    const ip = req.ip;
    const { password } = req.body || {};

    // Validate input
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password required' });
    }

    // Rate limit check
    if (!recordLoginAttempt(ip)) {
      logger.warn('Login attempt blocked - rate limited', { ip });
      return res.status(429).json({ error: 'too many attempts, try again later' });
    }

    // Check password
    if (password !== config.ADMIN_PASSWORD) {
      logger.warn('Failed login attempt', { ip });
      return res.status(401).json({ error: 'invalid password' });
    }

    // Success
    logger.info('Admin login successful', { ip });
    const jwtData = auth.createAdminJWT();
    const cookieOptions = auth.getAdminCookieOptions();

    res.cookie('admin_jwt', jwtData.token, cookieOptions);
    res.json({
      success: true,
      token: jwtData.token,
      expiresIn: jwtData.expiresIn,
    });
  } catch (err) {
    logger.error('Error in admin login', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin logout endpoint
 */
app.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_jwt');
  res.json({ success: true });
});

/**
 * Create ephemeral admin token
 */
app.post('/admin/token', auth.requireAdmin, (req, res) => {
  // Optional TTL override (seconds)
  const ttl = (req.body && Number(req.body.ttl)) || config.EPHEMERAL_TOKEN_TTL_SECONDS;
  if (!Number.isInteger(ttl) || ttl <= 0 || ttl > 60 * 60 * 24) {
    return res.status(400).json({ error: 'invalid ttl' });
  }

  const token = db.createToken('admin_overlay', req.ip, ttl);
  logger.info('Ephemeral token created', { ip: req.ip, ttl });
  res.json({ token, ttl });
});

/**
 * Create user JWT (admin only)
 */
app.post('/admin/user-token', auth.requireAdmin, (req, res) => {
  const { login } = req.body || {};
  if (!validation.validateUsername(login || '')) {
    return res.status(400).json({ error: 'invalid username' });
  }

  // Ensure profile exists
  db.upsertProfile({
    login,
    display_name: login,
    settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
    role: 'player',
  });

  const token = auth.signUserJWT(login);
  return res.json({ token, login, expiresIn: config.USER_JWT_TTL_SECONDS });
});

/**
 * Get/set current game mode (admin)
 */
app.get('/admin/mode', auth.requireAdmin, (_req, res) => {
  return res.json({ mode: 'blackjack' });
});

app.post('/admin/mode', auth.requireAdmin, (req, res) => {
  // Lock to blackjack only
  currentMode = 'blackjack';
  const channel = getChannelFromReq(req);
  const state = getStateForChannel(channel);
  state.currentMode = 'blackjack';
  return res.json({ mode: 'blackjack' });
});

/**
 * Start a round (admin)
 * If startNow is true, starts immediately; otherwise opens betting window.
 */
app.post('/admin/start-round', auth.requireAdmin, (req, res) => {
  try {
    const channel = getChannelFromReq(req);
    const state = getStateForChannel(channel);
    const startNow = !!(req.body && req.body.startNow);
    if (startNow) {
      startRoundInternal(channel);
      return res.json({ started: true, mode: state.currentMode });
    }
    openBettingWindow(channel);
    return res.json({ betting: true, mode: state.currentMode });
  } catch (err) {
    logger.error('Failed to start round (admin)', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Player login via Twitch user access token -> user JWT
 */
app.post('/user/login', async (req, res) => {
  try {
    const { twitchToken } = req.body || {};
    if (!twitchToken || typeof twitchToken !== 'string') {
      return res.status(400).json({ error: 'twitch token required' });
    }

    const twitchProfile = await fetchTwitchUser(twitchToken);
    if (!twitchProfile || !twitchProfile.login) {
      return res.status(401).json({ error: 'invalid twitch token' });
    }

  const login = twitchProfile.login;
  const safeAvatar = twitchProfile.avatarUrl ? validation.sanitizeUrl(twitchProfile.avatarUrl) : undefined;

  const role =
    login === config.STREAMER_LOGIN
      ? 'streamer'
      : login === config.BOT_ADMIN_LOGIN
        ? 'admin'
        : 'player';

  db.upsertProfile({
    login,
    display_name: twitchProfile.display_name || login,
    settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark', avatarUrl: safeAvatar },
    role,
  });
  db.ensureBalance(login);
  const stats = db.ensureStats(login);

  // Auto-join the streamer's channel when they log in via Twitch
  if (login === config.STREAMER_LOGIN) {
    joinBotChannel(login);
  }

  const token = auth.signUserJWT(login);
  return res.json({ token, login, avatarUrl: safeAvatar, expiresIn: config.USER_JWT_TTL_SECONDS, stats });
  } catch (err) {
    logger.error('User login failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Unblock username or IP
 */
app.post('/admin/unblock', auth.requireAdmin, (req, res) => {
  try {
    const { username, ip, note } = req.body || {};
    if (!username && !ip) return res.status(400).json({ error: 'username or ip required' });

    if (username && !validation.validateUsername(username)) return res.status(400).json({ error: 'invalid username format' });
    if (ip && !validation.validateIP(ip)) return res.status(400).json({ error: 'invalid ip format' });

    const actor = getActorFromReq(req);
    db.logUnblock(actor, username || '', ip || '', note || '');

    logger.info('Unblock executed', { username, ip, actor });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Failed to execute unblock', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get leaderboard
 */
app.get('/leaderboard.json', (req, res) => {
  try {
    const leaderboard = db.getLeaderboard(10);
    return res.json(leaderboard);
  } catch (err) {
    logger.error('Failed to fetch leaderboard', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get all balances (admin only)
 */
app.get('/balances.json', auth.requireAdmin, (req, res) => {
  try {
    const balances = {};
    const profiles = db.getAllProfiles(1000);

    profiles.forEach(profile => {
      balances[profile.login] = db.getBalance(profile.login);
    });

    return res.json(balances);
  } catch (err) {
    logger.error('Failed to fetch balances', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get all stats (admin only)
 */
app.get('/stats.json', auth.requireAdmin, (req, res) => {
  try {
    const stats = {};
    const profiles = db.getAllProfiles(1000);

    profiles.forEach(profile => {
      stats[profile.login] = db.getStats(profile.login);
    });

    return res.json(stats);
  } catch (err) {
    logger.error('Failed to fetch stats', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Export all data (admin only)
 */
app.get('/export', auth.requireAdmin, (req, res) => {
  try {
    const profiles = db.getAllProfiles(1000);
    const balances = {};
    const stats = {};

    profiles.forEach(profile => {
      balances[profile.login] = db.getBalance(profile.login);
      stats[profile.login] = db.getStats(profile.login);
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      leaderboard: db.getLeaderboard(100),
      balances,
      stats,
      profiles,
    };

    return res.json(exportData);
  } catch (err) {
    logger.error('Failed to export data', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get user profile
 */
app.get('/profile', (req, res) => {
  try {
    const tokenLogin = auth.extractUserLogin(req);
    const queryLogin = (req.query && req.query.login) || null;
    const isAdmin = auth.isAdminRequest(req);

    // Determine which login to serve
    let login = tokenLogin;
    if (isAdmin && validation.validateUsername(queryLogin || '')) {
      login = queryLogin;
    }

    if (!validation.validateUsername(login || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    let profile = db.getProfile(login);
    if (!profile) {
      profile = db.upsertProfile({
        login,
        display_name: login,
        settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
      });
    }

    const stats = db.getStats(login);
    const balance = db.getBalance(login);

    return res.json({ profile, stats, balance });
  } catch (err) {
    logger.error('Failed to fetch profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Save user profile
 */
app.post('/profile', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { display_name, settings, avatarUrl } = req.body || {};

  // Basic validation for settings object (optional)
  let safeSettings = {};
  if (typeof settings === 'object' && settings !== null) {
    safeSettings.startingChips = validation.validateNumber(settings.startingChips, 0, 100000)
      ? Number(settings.startingChips)
      : config.GAME_STARTING_CHIPS;
    safeSettings.theme = (settings.theme === 'light') ? 'light' : 'dark';
  }

  if (avatarUrl && typeof avatarUrl === 'string') {
    const sanitized = validation.sanitizeUrl(avatarUrl);
    if (sanitized) safeSettings.avatarUrl = sanitized;
  }

  try {
    const profile = db.upsertProfile({
      login,
      display_name: validation.sanitizeString(display_name) || login,
      settings: safeSettings,
      role: login === config.STREAMER_LOGIN ? 'streamer' : 'player',
    });

    logger.info('Profile saved', { login });
    return res.json(profile);
  } catch (err) {
    logger.error('Failed to save profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Chat-initiated bet (used by the Twitch bot)
 */
app.post('/chat/bet', (req, res) => {
  try {
    const { login, amount, secret } = req.body || {};
    const channel = getChannelFromReq(req);
    if (!config.BOT_JOIN_SECRET || secret !== config.BOT_JOIN_SECRET) {
      return res.status(403).json({ error: 'not authorized' });
    }

    const normalizedLogin = (login || '').toLowerCase();
    const betAmount = parseInt(amount, 10);

    if (!validation.validateUsername(normalizedLogin)) {
      return res.status(400).json({ error: 'invalid username' });
    }
    if (!Number.isInteger(betAmount)) {
      return res.status(400).json({ error: 'invalid amount' });
    }

    db.ensureBalance(normalizedLogin);
    const ok = placeBet(normalizedLogin, betAmount, channel);
    if (!ok) {
      return res.status(400).json({ error: 'bet_rejected' });
    }

    const balance = db.getBalance(normalizedLogin);
    return res.json({ success: true, balance, bet: betAmount, channel });
  } catch (err) {
    logger.error('Chat bet failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Bot channels list (used by Twitch bot to auto-join streamer channel)
 */
app.get('/bot/channels', (req, res) => {
  const secret = (req.query && req.query.secret) || '';
  if (!config.BOT_JOIN_SECRET || secret !== config.BOT_JOIN_SECRET) {
    return res.status(403).json({ error: 'not authorized' });
  }

  try {
    const channels = db.getBotChannels();
    const defaults = [];
    if (config.TWITCH_CHANNEL) defaults.push(config.TWITCH_CHANNEL.replace(/^#/, '').toLowerCase());
    const unique = Array.from(new Set([...defaults, ...channels]));
    return res.json({ channels: unique });
  } catch (err) {
    logger.error('Failed to fetch bot channels', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get all profiles (admin only)
 */
app.get('/admin/profiles', auth.requireAdmin, (req, res) => {
  try {
    const profiles = db.getAllProfiles();
    return res.json(profiles);
  } catch (err) {
    logger.error('Failed to fetch profiles', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get single profile (admin only)
 */
app.get('/admin/profile/:login', auth.requireAdmin, (req, res) => {
  try {
    const login = req.params.login;
    if (!validation.validateUsername(login)) return res.status(400).json({ error: 'invalid username' });
    const profile = db.getProfile(login);
    if (!profile) return res.status(404).json({ error: 'not found' });
    return res.json(profile);
  } catch (err) {
    logger.error('Failed to fetch profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Update profile (admin only)
 */
app.post('/admin/profile/:login', auth.requireAdmin, (req, res) => {
  try {
    const { display_name, settings } = req.body || {};
    const login = req.params.login;

    if (!validation.validateUsername(login)) return res.status(400).json({ error: 'invalid username' });

    const safeSettings = (typeof settings === 'object' && settings !== null) ? settings : {};

    const profile = db.upsertProfile({
      login,
      display_name: display_name ? validation.sanitizeString(display_name) : login,
      settings: safeSettings,
    });

    logger.info('Admin updated profile', { login });
    return res.json(profile);
  } catch (err) {
    logger.error('Failed to update profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Adjust player balance (admin only)
 * Body: { login, amount, mode: 'set' | 'add' }
 */
app.post('/admin/balance', auth.requireAdmin, (req, res) => {
  try {
    const { login, amount, mode } = req.body || {};
    if (!validation.validateUsername(login || '')) {
      return res.status(400).json({ error: 'invalid username' });
    }
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'amount required' });
    }

    db.ensureBalance(login);
    const safeAmount = Math.floor(amount);
    let newBalance = db.getBalance(login);

    if (mode === 'set') {
      db.setBalance(login, safeAmount);
      newBalance = safeAmount;
    } else {
      // default to add
      newBalance = db.addChips(login, safeAmount);
    }

    const channel = getChannelFromReq(req);
    const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
    io.to(channelName).emit('playerUpdate', { login, balance: newBalance, bet: 0, channel: channelName });
    logger.info('Admin balance update', { login, amount: safeAmount, mode: mode || 'add', newBalance });
    return res.json({ login, balance: newBalance });
  } catch (err) {
    logger.error('Failed to update balance', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get audit log (admin only)
 */
app.get('/admin/audit', auth.requireAdmin, (req, res) => {
  try {
    const raw = req.query.limit || '100';
    const limit = Math.min(parseInt(raw, 10) || 100, 1000);
    const audit = db.getAuditLog(limit);
    return res.json(audit);
  } catch (err) {
    logger.error('Failed to fetch audit log', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Delete audit entry (admin only)
 */
app.delete('/admin/audit/:id', auth.requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    db.deleteAuditById(id);
    logger.info('Audit entry deleted', { id });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Failed to delete audit entry', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============ SOCKET.IO EVENTS ============

io.on('connection', (socket) => {
  const channel = getChannelFromSocket(socket);
  socket.data.channel = channel;
  socket.join(channel);
  logger.debug('Client connected', { socketId: socket.id, channel });

  // Send current state
  const stateView = getStateForChannel(channel);
  socket.emit('state', {
    bettingOpen: stateView.bettingOpen,
    roundInProgress: stateView.roundInProgress,
    deck: (stateView.currentDeck || []).length,
    mode: stateView.currentMode,
    pot: stateView.pokerPot,
    currentBet: stateView.pokerCurrentBet,
    channel,
    players: Object.entries(stateView.playerStates || {}).map(([login, st]) => ({
      login,
      hand: st.hand,
      hands: st.hands,
      activeHand: st.activeHand,
      split: st.isSplit,
      insurance: st.insurance,
      insurancePlaced: st.insurancePlaced,
      bet: (stateView.betAmounts && stateView.betAmounts[login]) || 0,
      streetBet: (stateView.pokerStreetBets && stateView.pokerStreetBets[login]) || 0,
      avatar: (db.getProfile(login)?.settings && JSON.parse(db.getProfile(login).settings || '{}').avatarUrl) || null,
      ...getHeuristics(login, channel),
    })),
  });

  const socketLogin = auth.extractUserLogin(socket.handshake);
  socket.data.login = socketLogin;

  // Send profile if user is authenticated
  if (socketLogin) {
    const profile = db.getProfile(socketLogin);
    if (profile) socket.emit('profile', profile);
  }

  /**
   * Start a new round
   */
  socket.on('startRound', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!auth.isAdminRequest(socket.handshake)) {
      logger.warn('Unauthorized round start attempt', { socketId: socket.id, channel: channelName });
      return;
    }

    if (state.roundInProgress) {
      socket.emit('error', 'Round already in progress');
      return;
    }

    if (data && data.startNow) {
      startRoundInternal(channelName);
    } else if (state.bettingOpen) {
      startRoundInternal(channelName);
    } else {
      openBettingWindow(channelName);
    }
  });

  /**
   * Force a draw/discard decision
   */
  socket.on('forceDraw', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!auth.isAdminRequest(socket.handshake)) {
      logger.warn('Unauthorized draw attempt', { socketId: socket.id });
      return;
    }

    if (!state.roundInProgress) {
      socket.emit('error', 'No round in progress');
      return;
    }

    if (state.currentMode === 'blackjack') {
      settleRound({ ...data, channel: channelName });
    } else {
      advancePokerPhase(channelName);
    }
  });

  /**
   * Player selects held cards (poker)
   */
  socket.on('playerHold', (data) => {
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerHold: missing/invalid login', { socketId: socket.id });
      return;
    }
    const held = Array.isArray(data.held) ? data.held : [];
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getPlayerState(login, channelName);
    state.held = held.slice(0, 5);
  });

  /**
   * Poker betting: check
   */
  socket.on('playerCheck', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    pokerCheckAction(login, channelName);
  });

  /**
   * Poker betting: call
   */
  socket.on('playerCall', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    pokerCallAction(login, channelName);
  });

  /**
   * Poker betting: raise/bet
   */
  socket.on('playerRaise', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    const amount = Number.isInteger(data?.amount) ? data.amount : null;
    if (amount === null) return;
    pokerRaiseAction(login, amount, channelName);
  });

  /**
   * Poker betting: fold
   */
  socket.on('playerFold', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    pokerFoldAction(login, channelName);
  });

  /**
   * Blackjack: player requests a hit
   */
  socket.on('playerHit', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerHit: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.hit?.(login);
  });

  /**
   * Blackjack: player stands
   */
  socket.on('playerStand', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerStand: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.stand?.(login);
  });

  /**
   * Blackjack: player double down
   */
  socket.on('playerDouble', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerDouble: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.doubleDown?.(login, state.betAmounts, db);
  });

  /**
   * Blackjack: player surrender (forfeit half bet)
   */
  socket.on('playerSurrender', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerSurrender: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.surrender?.(login, state.betAmounts, db);
  });

  /**
   * Blackjack: player insurance (max 50% of bet when dealer shows Ace)
   */
  socket.on('playerInsurance', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    const amount = data && Number(data.amount);
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerInsurance: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.insurance?.(login, amount, state.betAmounts, db);
  });

  /**
   * Blackjack: player split (duplicates bet and plays two hands)
   */
  socket.on('playerSplit', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerSplit: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.split?.(login, state.betAmounts, db);
  });

  socket.on('playerSwitchHand', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerSwitchHand: missing/invalid login', { socketId: socket.id });
      return;
    }
    const index = Number.isInteger(data?.index) ? data.index : null;
    if (index !== null) {
      state.blackjackHandlers?.switchHand?.(login, index);
    }
  });

  socket.on('disconnect', () => {
    logger.debug('Client disconnected', { socketId: socket.id });
  });
});

// ============ TWITCH CHAT INTEGRATION ============

async function initializeTwitch() {
  if (!config.TWITCH_OAUTH_TOKEN || !config.TWITCH_BOT_USERNAME) {
    logger.warn('Twitch configuration incomplete, skipping chat integration');
    return;
  }

  try {
    // Determine channels to join (persisted list + default channel)
    let botChannels = [];
    try {
      botChannels = db.getBotChannels();
    } catch (e) {
      logger.warn('Failed to load bot channels; defaulting to TWITCH_CHANNEL', { error: e.message });
    }
    if ((!botChannels || botChannels.length === 0) && config.TWITCH_CHANNEL) {
      db.addBotChannel(config.TWITCH_CHANNEL);
      botChannels = [config.TWITCH_CHANNEL];
    }
    botChannels = (botChannels || []).map(c => c.replace(/^#/, '').toLowerCase());

    tmiClient = new tmi.Client({
      options: { debug: config.NODE_ENV === 'development' },
      connection: {
        reconnect: true,
        secure: true,
      },
      identity: {
        username: config.TWITCH_BOT_USERNAME,
        password: config.TWITCH_OAUTH_TOKEN,
      },
      channels: botChannels,
    });

    tmiClient.on('message', (channel, tags, message, self) => {
      if (self) return;

      const username = tags['display-name'] || tags.username;
      const loginLower = (username || '').toLowerCase();
      const isBroadcaster = (tags.badges && tags.badges.broadcaster === '1') || false;
      const isMod = tags.mod === true || (tags.badges && tags.badges.moderator === '1');
      const isStreamer = config.STREAMER_LOGIN && loginLower === config.STREAMER_LOGIN.toLowerCase();
      const isBotAdmin = config.BOT_ADMIN_LOGIN && loginLower === config.BOT_ADMIN_LOGIN.toLowerCase();
      const canAdjustBalance = isBroadcaster || isMod || isStreamer || isBotAdmin;
      const content = message.trim();
      const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
      const channelState = getStateForChannel(channelName);

      logger.debug('Twitch message', { username, message: content });

      // Handle betting commands
      if (content.startsWith('!bet ')) {
        const parts = content.split(/\s+/);
        const amount = parseInt(parts[1], 10);
        placeBet(username, amount, channelName);
      } else if (content.toLowerCase().startsWith('!addchips')) {
        if (!canAdjustBalance) return;
        const parts = content.split(/\s+/);
        const target = (parts[1] || '').trim().toLowerCase();
        const amt = parseInt(parts[2], 10);
        if (!validation.validateUsername(target) || !Number.isInteger(amt) || amt <= 0) {
          tmiClient.say(channel, 'Usage: !addchips <username> <amount>');
          return;
        }
        db.ensureBalance(target);
        db.upsertProfile({
          login: target,
          display_name: target,
          settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
          role: 'player',
        });
        const newBalance = db.addChips(target, amt);
        io.to(channelName).emit('playerUpdate', { login: target, balance: newBalance, bet: 0, channel: channelName });
        logger.info('Chips added via chat', { actor: username, target, amount: amt, newBalance });
        tmiClient.say(channel, `Added ${amt} chips to ${target}. New balance: ${newBalance}`);
      } else if (content.toLowerCase().startsWith('!joinme ')) {
        const parts = content.split(/\s+/);
        const token = parts[1]?.trim();
        const secretOk = token && (
          (config.BOT_JOIN_SECRET && token === config.BOT_JOIN_SECRET) ||
          (config.ADMIN_TOKEN && token === config.ADMIN_TOKEN)
        );
        if (!secretOk) {
          logger.warn('Join request rejected (bad token)', { channel, user: username });
          return;
        }
        const requestedChannel = channel.replace(/^#/, '');
        joinBotChannel(requestedChannel);
        tmiClient.say(channel, `Bot joining ${requestedChannel}`);
      } else if (content === '!hit') {
        if (channelState.currentMode === 'blackjack') {
          channelState.blackjackHandlers?.hit?.(username);
        }
      } else if (content === '!stand') {
        if (channelState.currentMode === 'blackjack') {
          channelState.blackjackHandlers?.stand?.(username);
        }
      } else if (content.startsWith('!hold ')) {
        const indices = content
          .split(/\s+/)[1]
          .split(',')
          .map(n => parseInt(n, 10))
          .filter(n => Number.isInteger(n) && n >= 0 && n < 5);
        const state = getPlayerState(username, channelName);
        state.held = indices.slice(0, 5);
      }
    });

    await tmiClient.connect();
    logger.info('Twitch chat connected', { channels: botChannels });
  } catch (err) {
    logger.error('Failed to initialize Twitch', { error: err.message });
  }
}

// ============ SERVER STARTUP ============

/**
 * Start the server
 */
async function start() {
  try {
    // Run startup checks
    const checks = startup.checkStartup();
    startup.logStartupCheck(checks);

    if (checks.status === 'error') {
      logger.error('Startup checks failed, exiting');
      process.exit(1);
    }

    // Initialize database
    db.init();

    // Ensure streamer profile exists
    if (validation.validateUsername(config.STREAMER_LOGIN)) {
      streamerProfile = db.upsertProfile({
        login: config.STREAMER_LOGIN,
        display_name: config.STREAMER_LOGIN,
        settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
        role: 'streamer',
      });
    }

    // Initialize Twitch (optional)
    await initializeTwitch();

    // Start listening
    server.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`, {
        environment: config.NODE_ENV,
        database: config.DB_FILE,
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

// ============ GRACEFUL SHUTDOWN ============

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Close Twitch connection
    if (tmiClient) {
      await tmiClient.disconnect();
      logger.info('Twitch disconnected');
    }

    // Close Socket.IO
    io.close();
    logger.info('Socket.IO closed');

    // Close database
    db.close();
    logger.info('Database closed');

    // Close HTTP server
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit after configured timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, config.SHUTDOWN_FORCE_TIMEOUT_MS);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
start();
function startPlayerTurnCycle(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  if (state.turnManager && state.turnManager.stop) state.turnManager.stop();
  if (!state.playerTurnOrder.length) return;

  const activeOrder = state.playerTurnOrder.filter(login => {
    const pState = getPlayerState(login, channel);
    if (state.currentMode === 'blackjack') {
      return !pState.stood && !pState.busted;
    }
    return !pState.folded;
  });

  if (!activeOrder.length) {
    settleRound({ channel });
    return;
  }

  if (state.currentMode === 'blackjack') {
    state.turnManager = state.blackjackHandlers?.turnManager?.(activeOrder);
  } else {
    const duration = config.POKER_ACTION_DURATION_MS;
    state.turnManager = state.pokerHandlers?.turnManager?.(activeOrder, duration, (login) => {
      if (!login) return;
      const streetBet = state.pokerStreetBets[login] || 0;
      if (streetBet >= state.pokerCurrentBet) {
        state.pokerActed.add(login);
        emitPokerBettingState(channel);
        maybeAdvanceAfterAction(channel);
      } else {
        pokerFoldAction(login, channel);
      }
    });
  }

  if (state.turnManager && state.turnManager.start) {
    state.turnManager.start();
  }
}

function emitPokerBettingState(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  const normalized = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  io.to(normalized).emit('pokerBetting', {
    pot: state.pokerPot,
    currentBet: state.pokerCurrentBet,
    streetBets: state.pokerStreetBets,
    totalBets: state.betAmounts,
    phase: state.pokerPhase,
    channel: normalized,
  });
}

function maybeAdvanceAfterAction(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  const active = state.playerTurnOrder.filter(login => !getPlayerState(login, channel).folded);
  if (active.length <= 1) {
    settleRound({ channel });
    return;
  }

  const allMatched = active.every(login => (state.pokerStreetBets[login] || 0) >= state.pokerCurrentBet);
  const allActed = active.every(login => state.pokerActed.has(login));
  if (allMatched && allActed) {
    advancePokerPhase(channel);
  }
}

function pokerFoldAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const playerState = getPlayerState(login, channelName);
  if (!playerState || playerState.folded) return;
  playerState.folded = true;
  state.pokerActed.add(login);
  io.to(channelName).emit('playerUpdate', { login, folded: true, channel: channelName });
  maybeAdvanceAfterAction(channelName);
  startPlayerTurnCycle(channelName);
}

function pokerCheckAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const streetBet = state.pokerStreetBets[login] || 0;
  if (streetBet < state.pokerCurrentBet) return;
  state.pokerActed.add(login);
  emitPokerBettingState(channelName);
  maybeAdvanceAfterAction(channelName);
  startPlayerTurnCycle(channelName);
}

function pokerCallAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const streetBet = state.pokerStreetBets[login] || 0;
  const needed = Math.max(0, state.pokerCurrentBet - streetBet);
  if (needed === 0) {
    pokerCheckAction(login, channelName);
    return;
  }
  const balance = db.getBalance(login);
  if (needed > balance) return;
  db.setBalance(login, balance - needed);
  state.betAmounts[login] = (state.betAmounts[login] || 0) + needed;
  state.pokerStreetBets[login] = streetBet + needed;
  state.pokerPot += needed;
  state.pokerActed.add(login);
  emitPokerBettingState(channelName);
  maybeAdvanceAfterAction(channelName);
  startPlayerTurnCycle(channelName);
}

function pokerRaiseAction(login, amount, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const streetBet = state.pokerStreetBets[login] || 0;
  if (!Number.isInteger(amount) || amount <= state.pokerCurrentBet || amount < config.GAME_MIN_BET || amount > config.GAME_MAX_BET) {
    return;
  }
  const needed = amount - streetBet;
  const balance = db.getBalance(login);
  if (needed > balance) return;
  db.setBalance(login, balance - needed);
  state.betAmounts[login] = (state.betAmounts[login] || 0) + needed;
  state.pokerStreetBets[login] = amount;
  state.pokerCurrentBet = amount;
  state.pokerPot += needed;
  state.pokerActed = new Set([login]); // others must respond
  emitPokerBettingState(channelName);
  startPlayerTurnCycle(channelName);
}
