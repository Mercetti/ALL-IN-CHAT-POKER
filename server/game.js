/**
 * Core game logic and utilities
 */

const { cardLookup } = require('./utils');

// Use optimized lookup functions
const { getRankValue, evaluateHand: evaluateHandOptimized, isStraightOptimized } = cardLookup;

const config = require('./config');

/**
 * Create a standard 52-card deck
 * @returns {Array}
 */
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

/**
 * Deal initial 5 cards from deck
 * @param {Array} deck - Card deck
 * @returns {Array}
 */
function dealInitialCards(deck) {
  return deck.splice(0, 5);
}

/**
 * Get replacement cards for held indices
 * @param {Array} deck - Card deck
 * @param {Array} heldIndices - Indices of cards to hold (0-4)
 * @returns {Array}
 */
function getReplacementCards(deck, heldIndices) {
  const replacements = [];
  for (let i = 0; i < 5; i++) {
    if (!heldIndices.includes(i)) {
      replacements.push(deck.splice(0, 1)[0]);
    }
  }
  return replacements;
}

/**
 * Check if hand is a flush
 * @param {Array} hand - 5 cards
 * @returns {boolean}
 */
function isFlush(hand) {
  return hand.every(card => card.suit === hand[0].suit);
}

/**
 * Check if hand is a straight (using optimized version)
 * @param {Array} hand - 5 cards
 * @returns {boolean}
 */
function isStraight(hand) {
  const values = hand.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
  return isStraightOptimized(values);
}

/**
 * Evaluate poker hand (using optimized cached version)
 * @param {Array} hand - 5 cards
 * @returns {Object} - { name, rank, payout }
 */
function evaluateHand(hand) {
  return evaluateHandOptimized(hand);
}

/**
 * Evaluate best 5-card hand from up to 7 cards (Texas Hold'em style)
 * @param {Array} cards - 5 to 7 cards
 * @returns {Object} best evaluation
 */
function evaluateBestOfSeven(cards) {
  if (!Array.isArray(cards) || cards.length < 5) {
    return { name: 'invalid', rank: 0, payout: 0 };
  }

  // Generate all 5-card combinations
  const combos = [];
  const n = cards.length;
  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            combos.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
          }
        }
      }
    }
  }

  let best = { name: 'No Winner', rank: 0, payout: 0 };
  combos.forEach(hand => {
    const evalHand = evaluateHand(hand);
    if (evalHand.rank > best.rank || (evalHand.rank === best.rank && evalHand.payout > best.payout)) {
      best = evalHand;
    }
  });

  return best;
}

module.exports = {
  createDeck,
  dealInitialCards,
  getReplacementCards,
  evaluateHand,
  getRankValue,
  isFlush,
  isStraight,
  evaluateBestOfSeven,
};
