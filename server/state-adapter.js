/**
 * State adapter to safely toggle between legacy single-tenant globals
 * and channel-scoped state. Defaults to single-tenant (safe) unless
 * MULTITENANT_ENABLED=true.
 */

const config = require('./config');
const channelState = require('./channel-state');

// Legacy singleton state (mirrors previous globals)
const legacyState = {
  currentMode: 'blackjack',
  currentDeck: [],
  currentHand: [],
  roundInProgress: false,
  bettingOpen: true,
  betAmounts: {},
  streamerProfile: null,
  playerStates: {},
  dealerState: { hand: [], shoe: [] },
  waitingQueue: [],
  communityCards: [],
  blackjackActionTimer: null,
  bettingTimer: null,
  pokerActionTimer: null,
  pokerPhase: 'preflop',
  pokerCurrentBet: 0,
  pokerStreetBets: {},
  pokerPot: 0,
  pokerActed: new Set(),
  playerTurnOrder: [],
  playerTurnIndex: 0,
  turnManager: null,
  pokerHandlers: null,
  blackjackHandlers: null,
  playerHeuristics: {},
};

function ensureChannelState(channel) {
  const state = channelState.getChannelState(channel);
  if (!state.__init) {
    Object.assign(state, JSON.parse(JSON.stringify({
      currentMode: config.GAME_MODE || 'blackjack',
      currentDeck: [],
      currentHand: [],
      roundInProgress: false,
      bettingOpen: true,
      betAmounts: {},
      streamerProfile: null,
      playerStates: {},
      dealerState: { hand: [], shoe: [] },
      waitingQueue: [],
      communityCards: [],
      blackjackActionTimer: null,
      bettingTimer: null,
      pokerActionTimer: null,
      pokerPhase: 'preflop',
      pokerCurrentBet: 0,
      pokerStreetBets: {},
      pokerPot: 0,
      pokerActed: [],
      playerTurnOrder: [],
      playerTurnIndex: 0,
      turnManager: null,
      pokerHandlers: null,
      blackjackHandlers: null,
      playerHeuristics: {},
    })));
    state.pokerActed = new Set(state.pokerActed || []);
    state.__init = true;
  }
  return state;
}

/**
 * Get the appropriate state bucket (legacy or channel-scoped).
 * Note: until the codebase is fully migrated, callers should guard usage
 * behind config.MULTITENANT_ENABLED to avoid mixing state.
 */
function getState(channel) {
  if (!config.MULTITENANT_ENABLED) return legacyState;
  return ensureChannelState(channelState.normalizeChannelName(channel));
}

module.exports = {
  getState,
  legacyState,
};
