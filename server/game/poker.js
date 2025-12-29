/**
 * Poker-specific game logic and utilities
 */

const config = require('../config');

const MAX_POKER_PLAYERS = 8;

/**
 * Poker check action
 */
function pokerCheckAction(login, channel) {
  const state = getStateForChannel(channel);
  if (!state || state.currentMode !== 'poker' || !state.roundInProgress) return;
  
  // TODO: Implement poker check logic
  // Player passes their turn without betting
}

/**
 * Poker call action
 */
function pokerCallAction(login, channel) {
  const state = getStateForChannel(channel);
  if (!state || state.currentMode !== 'poker' || !state.roundInProgress) return;
  
  // TODO: Implement poker call logic
  // Player matches the current bet
}

/**
 * Poker raise/bet action
 */
function pokerRaiseAction(login, amount, channel) {
  const state = getStateForChannel(channel);
  if (!state || state.currentMode !== 'poker' || !state.roundInProgress) return;
  
  if (!Number.isInteger(amount) || amount <= 0) return;
  
  // TODO: Implement poker raise logic
  // Player increases the current bet
}

/**
 * Poker fold action
 */
function pokerFoldAction(login, channel) {
  const state = getStateForChannel(channel);
  if (!state || state.currentMode !== 'poker' || !state.roundInProgress) return;
  
  // TODO: Implement poker fold logic
  // Player forfeits their hand and exits the round
}

/**
 * Hold cards for draw poker
 */
function pokerHoldAction(login, heldCards, channel) {
  const state = getPlayerState(login, channel);
  if (!state || !Array.isArray(heldCards)) return;
  
  // Validate held cards indices
  const validHeld = heldCards.filter(n => Number.isInteger(n) && n >= 0 && n < 5);
  state.held = validHeld.slice(0, 5);
}

/**
 * Evaluate poker hand strength
 */
function evaluatePokerHand(hand) {
  if (!Array.isArray(hand) || hand.length !== 5) return { rank: 0, name: 'High Card' };
  
  // TODO: Implement poker hand evaluation
  // Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, High Card
  
  return { rank: 1, name: 'High Card' };
}

/**
 * Compare two poker hands
 */
function comparePokerHands(hand1, hand2) {
  const eval1 = evaluatePokerHand(hand1);
  const eval2 = evaluatePokerHand(hand2);
  
  if (eval1.rank !== eval2.rank) {
    return eval1.rank > eval2.rank ? 1 : -1;
  }
  
  // TODO: Implement tie-breaker logic for same rank hands
  return 0;
}

/**
 * Determine poker winner among multiple hands
 */
function determinePokerWinner(players) {
  if (!Array.isArray(players) || players.length === 0) return null;
  
  let winner = players[0];
  let winnerHand = evaluatePokerHand(winner.hand);
  
  for (let i = 1; i < players.length; i++) {
    const player = players[i];
    const playerHand = evaluatePokerHand(player.hand);
    
    if (comparePokerHands(playerHand, winnerHand) > 0) {
      winner = player;
      winnerHand = playerHand;
    }
  }
  
  return winner;
}

/**
 * Calculate poker pot distribution
 */
function calculatePokerDistribution(players, pot) {
  if (!Array.isArray(players) || pot <= 0) return [];
  
  // TODO: Implement side pot calculations for all-in scenarios
  // For now, simple winner-takes-all
  const winner = determinePokerWinner(players);
  if (!winner) return [];
  
  return [{
    login: winner.login,
    amount: pot,
    handRank: evaluatePokerHand(winner.hand).name,
  }];
}

// Helper imports
function getStateForChannel(channel) {
  return require('./core').getStateForChannel(channel);
}

function getPlayerState(login, channel) {
  return require('./core').getPlayerState(login, channel);
}

module.exports = {
  MAX_POKER_PLAYERS,
  pokerCheckAction,
  pokerCallAction,
  pokerRaiseAction,
  pokerFoldAction,
  pokerHoldAction,
  evaluatePokerHand,
  comparePokerHands,
  determinePokerWinner,
  calculatePokerDistribution,
};
