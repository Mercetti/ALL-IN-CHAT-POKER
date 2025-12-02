/**
 * Video Poker game logic
 */

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
 * Get rank value for comparison
 * @param {string} rank - Rank string
 * @returns {number}
 */
function getRankValue(rank) {
  const values = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  return values[rank] || 0;
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
 * Check if hand is a straight
 * @param {Array} hand - 5 cards
 * @returns {boolean}
 */
function isStraight(hand) {
  const values = hand.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
  // Check normal straight
  if (values[4] - values[0] === 4 && new Set(values).size === 5) {
    return true;
  }
  // Check A-2-3-4-5 (wheel)
  if (values[0] === 2 && values[4] === 14 && values[3] === 5) {
    return true;
  }
  return false;
}

/**
 * Evaluate poker hand
 * @param {Array} hand - 5 cards
 * @returns {Object} - { name, rank, payout }
 */
function evaluateHand(hand) {
  if (hand.length !== 5) {
    return { name: 'invalid', rank: 0, payout: 0 };
  }

  const ranks = hand.map(c => getRankValue(c.rank));
  const rankCounts = {};
  ranks.forEach(r => {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  });

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isF = isFlush(hand);
  const isS = isStraight(hand);

  // Royal flush (10-J-Q-K-A of same suit)
  if (isF && isS && ranks.includes(14) && ranks.includes(13) && ranks.includes(12) && ranks.includes(11) && ranks.includes(10)) {
    return { name: 'Royal Flush', rank: 10, payout: 250 };
  }

  // Straight flush
  if (isF && isS) {
    return { name: 'Straight Flush', rank: 9, payout: 50 };
  }

  // Four of a kind
  if (counts[0] === 4) {
    return { name: 'Four of a Kind', rank: 8, payout: 25 };
  }

  // Full house
  if (counts[0] === 3 && counts[1] === 2) {
    return { name: 'Full House', rank: 7, payout: 9 };
  }

  // Flush
  if (isF) {
    return { name: 'Flush', rank: 6, payout: 6 };
  }

  // Straight
  if (isS) {
    return { name: 'Straight', rank: 5, payout: 4 };
  }

  // Three of a kind
  if (counts[0] === 3) {
    return { name: 'Three of a Kind', rank: 4, payout: 3 };
  }

  // Two pair
  if (counts[0] === 2 && counts[1] === 2) {
    return { name: 'Two Pair', rank: 3, payout: 2 };
  }

  // Pair of Jacks or better
  if (counts[0] === 2) {
    const pairRank = Object.keys(rankCounts).find(r => rankCounts[r] === 2);
    if (parseInt(pairRank) >= 11) { // J, Q, K, A
      return { name: 'Pair (J or Better)', rank: 2, payout: 1 };
    }
  }

  return { name: 'No Winner', rank: 0, payout: 0 };
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
