/**
 * Core game state management and shared game utilities
 */

const config = require('../config');

const DEFAULT_CHANNEL = config.DEFAULT_CHANNEL || 'testchannel';

/**
 * Get channel from Express request
 */
function getChannelFromReq(req) {
  const bodyChannel = req && req.body && req.body.channel;
  const queryChannel = req && req.query && req.query.channel;
  const headerChannel = req && req.get && req.get('X-Channel');
  return bodyChannel || queryChannel || headerChannel || DEFAULT_CHANNEL;
}

/**
 * Get channel from Socket.IO socket
 */
function getChannelFromSocket(socket) {
  const authChannel = socket?.handshake?.auth?.channel;
  const queryChannel = socket?.handshake?.query?.channel;
  return authChannel || queryChannel || DEFAULT_CHANNEL;
}

/**
 * Legacy state view for single-channel mode
 */
function getLegacyStateView() {
  return {
    bettingOpen: false,
    roundInProgress: false,
    currentDeck: [],
    currentMode: 'blackjack',
    pokerPot: 0,
    pokerCurrentBet: 0,
    playerStates: {},
    betAmounts: {},
    pokerStreetBets: {},
    tournamentId: null,
  };
}

/**
 * Get state for a specific channel
 * Switches to channel-scoped state when MULTITENANT_ENABLED is true
 */
function getStateForChannel(channel = DEFAULT_CHANNEL) {
  if (!config.MULTITENANT_ENABLED) return getLegacyStateView();
  // TODO: Implement channel-scoped state management
  return getLegacyStateView();
}

/**
 * Ensure heuristic data exists for a player
 */
function ensureHeuristic(login) {
  if (!login) return null;
  // TODO: Implement player heuristic tracking
  return {
    handsPlayed: 0,
    totalWinnings: 0,
    avgBet: 0,
    winRate: 0,
  };
}

/**
 * Get player state for a specific channel
 */
function getPlayerState(login, channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  return state.playerStates[login] || null;
}

/**
 * Place a bet for a player
 */
function placeBet(username, amount, channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  if (!state || !username || amount <= 0) return false;
  
  // TODO: Implement betting logic
  return true;
}

/**
 * Open betting window for a channel
 */
function openBettingWindow(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  if (!state) return;
  
  state.bettingOpen = true;
  // TODO: Emit betting window open event
}

/**
 * Start a round in a channel
 */
function startRoundInternal(channel = DEFAULT_CHANNEL, options = {}) {
  const state = getStateForChannel(channel);
  if (!state || state.roundInProgress) return;
  
  state.roundInProgress = true;
  state.bettingOpen = false;
  
  // TODO: Implement round start logic based on game mode
}

/**
 * Settle a round and distribute winnings
 */
function settleRound({ channel = DEFAULT_CHANNEL, result }) {
  const state = getStateForChannel(channel);
  if (!state || !state.roundInProgress) return;
  
  state.roundInProgress = false;
  
  // TODO: Implement round settlement logic
}

module.exports = {
  DEFAULT_CHANNEL,
  getChannelFromReq,
  getChannelFromSocket,
  getStateForChannel,
  getPlayerState,
  ensureHeuristic,
  placeBet,
  openBettingWindow,
  startRoundInternal,
  settleRound,
};
