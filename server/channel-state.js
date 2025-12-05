/**
 * Channel-scoped state manager for multi-tenant support.
 * Each channel keeps its own game state and timers.
 */

const config = require('./config');

function normalizeChannelName(name) {
  if (!name || typeof name !== 'string') return 'default';
  return name.trim().toLowerCase().replace(/^#/, '') || 'default';
}

const DEFAULT_CHANNEL =
  normalizeChannelName(config.TWITCH_CHANNEL || config.STREAMER_LOGIN || 'default');

const channelStates = new Map();

function createEmptyState() {
  return {
    // Game flow
    currentMode: 'blackjack',
    roundInProgress: false,
    bettingOpen: true,

    // Card state
    currentDeck: [],
    currentHand: [],
    communityCards: [],

    // Player state
    betAmounts: {},
    waitingQueue: [],
    playerStates: {},
    dealerState: { hand: [], shoe: [] },
    playerHeuristics: {},

    // Poker-specific
    pokerPhase: 'preflop',
    pokerCurrentBet: 0,
    pokerStreetBets: {},
    pokerPot: 0,
    pokerActed: new Set(),
    playerTurnOrder: [],
    playerTurnIndex: 0,
    turnManager: null,
    pokerHandlers: null,

    // Blackjack-specific
    blackjackHandlers: null,

    // Timers
    blackjackActionTimer: null,
    bettingTimer: null,
    pokerActionTimer: null,

    // Profiles
    streamerProfile: null,
  };
}

function getChannelState(channel) {
  const key = normalizeChannelName(channel || DEFAULT_CHANNEL);
  if (!channelStates.has(key)) {
    channelStates.set(key, createEmptyState());
  }
  return channelStates.get(key);
}

function resetChannelState(channel) {
  const key = normalizeChannelName(channel || DEFAULT_CHANNEL);
  channelStates.set(key, createEmptyState());
}

function getDefaultChannel() {
  return DEFAULT_CHANNEL;
}

module.exports = {
  normalizeChannelName,
  getChannelState,
  resetChannelState,
  getDefaultChannel,
};
