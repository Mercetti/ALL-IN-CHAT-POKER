/**
 * Blackjack-specific game logic and utilities
 */

const config = require('../config');

const MAX_BLACKJACK_PLAYERS = 7;

/**
 * Get card value for blackjack
 */
function getBlackjackCardValue(card) {
  if (!card || !card.rank) return 0;
  
  const rank = card.rank.toUpperCase();
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  
  const value = parseInt(rank, 10);
  return isNaN(value) ? 0 : value;
}

/**
 * Calculate hand value for blackjack (handles aces)
 */
function getBlackjackHandValue(hand) {
  if (!Array.isArray(hand) || hand.length === 0) return 0;
  
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    const cardValue = getBlackjackCardValue(card);
    if (cardValue === 11) aces++;
    value += cardValue;
  }
  
  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

/**
 * Check if hand is a blackjack
 */
function isBlackjack(hand) {
  if (!Array.isArray(hand) || hand.length !== 2) return false;
  
  const values = hand.map(getBlackjackCardValue);
  return values.includes(11) && values.includes(10);
}

/**
 * Check if hand is busted (over 21)
 */
function isBusted(hand) {
  return getBlackjackHandValue(hand) > 21;
}

/**
 * Blackjack hit action
 */
function blackjackHitAction(login, channel) {
  // TODO: Implement hit logic - draw card from deck
  const newCard = { rank: 'A', suit: '♠' }; // Placeholder
  
  const state = getStateForChannel(channel);
  const playerState = getPlayerState(login, channel);
  
  if (!playerState || !playerState.hand) return;
  
  playerState.hand.push(newCard);
  
  // Check for bust
  if (isBusted(playerState.hand)) {
    // TODO: Handle bust
  }
}

/**
 * Blackjack stand action
 */
function blackjackStandAction(login, channel) {
  const playerState = getPlayerState(login, channel);
  if (!playerState) return;
  
  playerState.standing = true;
  
  // TODO: Check if all players are standing, then dealer plays
}

/**
 * Blackjack double down action
 */
function blackjackDoubleAction(login, channel, betAmounts, db) {
  const state = getStateForChannel(channel);
  const playerState = getPlayerState(login, channel);
  
  if (!playerState || !playerState.hand || playerState.hand.length !== 2) return;
  
  const currentBet = state.betAmounts[login] || 0;
  if (currentBet === 0) return;
  
  // Double the bet
  const profile = db.getProfile(login);
  const balance = profile ? profile.chips || 0 : 0;
  
  if (balance < currentBet) return;
  
  db.deductChips(login, currentBet);
  state.betAmounts[login] = currentBet * 2;
  
  // Auto-hit after doubling
  blackjackHitAction(login, channel);
  blackjackStandAction(login, channel);
}

/**
 * Blackjack surrender action
 */
function blackjackSurrenderAction(login, channel, betAmounts, db) {
  const state = getStateForChannel(channel);
  const currentBet = state.betAmounts[login] || 0;
  
  if (currentBet === 0) return;
  
  // Return half the bet
  const surrenderAmount = Math.floor(currentBet / 2);
  db.addChips(login, surrenderAmount);
  
  // Remove player from round
  delete state.playerStates[login];
  delete state.betAmounts[login];
}

/**
 * Blackjack insurance action
 */
function blackjackInsuranceAction(login, insurance, betAmounts, db) {
  const state = getStateForChannel(channel);
  const currentBet = state.betAmounts[login] || 0;
  
  if (currentBet === 0) return;
  
  const insuranceAmount = Math.min(Math.floor(currentBet / 2), insurance ? currentBet / 2 : 0);
  
  if (insuranceAmount > 0) {
    const profile = db.getProfile(login);
    const balance = profile ? profile.chips || 0 : 0;
    
    if (balance >= insuranceAmount) {
      db.deductChips(login, insuranceAmount);
      // TODO: Track insurance bet
    }
  }
}

/**
 * Blackjack split action
 */
function blackjackSplitAction(login, betAmounts, db) {
  const state = getStateForChannel(channel);
  const playerState = getPlayerState(login, channel);
  
  if (!playerState || !playerState.hand || playerState.hand.length !== 2) return;
  
  const [c1, c2] = playerState.hand;
  const v1 = getBlackjackCardValue(c1);
  const v2 = getBlackjackCardValue(c2);
  
  if (v1 !== v2) return;
  
  const bet = state.betAmounts[login] || 0;
  if (bet === 0) return;
  
  const profile = db.getProfile(login);
  const balance = profile ? profile.chips || 0 : 0;
  
  if (balance < bet) return;
  
  // Split logic
  db.deductChips(login, bet);
  playerState.isSplit = true;
  playerState.hand = [c1];
  playerState.secondHand = [c2];
  playerState.activeHand = 'first';
  playerState.splitBet = bet;
  state.betAmounts[login] = bet * 2;
}

// Helper imports
function getStateForChannel(channel) {
  // This will be imported from core.js
  return require('./core').getStateForChannel(channel);
}

function getPlayerState(login, channel) {
  return require('./core').getPlayerState(login, channel);
}

module.exports = {
  MAX_BLACKJACK_PLAYERS,
  getBlackjackCardValue,
  getBlackjackHandValue,
  isBlackjack,
  isBusted,
  blackjackHitAction,
  blackjackStandAction,
  blackjackDoubleAction,
  blackjackSurrenderAction,
  blackjackInsuranceAction,
  blackjackSplitAction,
};
