/**
 * Card value lookup tables for optimized game logic
 * Provides pre-computed lookup tables to avoid repeated calculations
 */

// Card rank lookup tables
const CARD_RANK_VALUES = Object.freeze({
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
});

// Blackjack card values (with ace handling)
const BLACKJACK_CARD_VALUES = Object.freeze({
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10, 'A': 11,
});

// Face card detection
const FACE_CARDS = Object.freeze(new Set(['J', 'Q', 'K']));

// Hand ranking definitions
const HAND_RANKINGS = Object.freeze({
  'Royal Flush': { rank: 10, payout: 250 },
  'Straight Flush': { rank: 9, payout: 50 },
  'Four of a Kind': { rank: 8, payout: 25 },
  'Full House': { rank: 7, payout: 9 },
  'Flush': { rank: 6, payout: 6 },
  'Straight': { rank: 5, payout: 4 },
  'Three of a Kind': { rank: 4, payout: 3 },
  'Two Pair': { rank: 3, payout: 2 },
  'Pair (J or Better)': { rank: 2, payout: 1 },
  'No Winner': { rank: 0, payout: 0 },
  'invalid': { rank: 0, payout: 0 },
});

// Blackjack hand rankings
const BLACKJACK_RANKINGS = Object.freeze({
  'Blackjack': { payout: 1.5 },
  'Bust': { payout: 0 },
  'Stand': { payout: 1 },
});

// Pre-computed straight patterns for faster detection
const STRAIGHT_PATTERNS = Object.freeze([
  // Regular straights
  [2, 3, 4, 5, 6], [3, 4, 5, 6, 7], [4, 5, 6, 7, 8],
  [5, 6, 7, 8, 9], [6, 7, 8, 9, 10], [7, 8, 9, 10, 11],
  [8, 9, 10, 11, 12], [9, 10, 11, 12, 13], [10, 11, 12, 13, 14],
  // Ace-low straight (A-2-3-4-5)
  [14, 2, 3, 4, 5]
]);

// Cache for hand evaluations to avoid recomputation
const handEvaluationCache = new Map();
const blackjackHandCache = new Map();

// Maximum cache size to prevent memory leaks
const MAX_CACHE_SIZE = 10000;

/**
 * Get card rank value with lookup table
 * @param {string} rank - Card rank
 * @returns {number} - Rank value
 */
function getRankValue(rank) {
  return CARD_RANK_VALUES[rank] || 0;
}

/**
 * Get blackjack card value with lookup table
 * @param {string} rank - Card rank
 * @returns {number} - Blackjack card value
 */
function getBlackjackCardValue(rank) {
  return BLACKJACK_CARD_VALUES[rank] || 0;
}

/**
 * Check if rank is a face card
 * @param {string} rank - Card rank
 * @returns {boolean} - True if face card
 */
function isFaceCard(rank) {
  return FACE_CARDS.has(rank);
}

/**
 * Check if rank is an ace
 * @param {string} rank - Card rank
 * @returns {boolean} - True if ace
 */
function isAce(rank) {
  return rank === 'A';
}

/**
 * Generate cache key for hand evaluation
 * @param {Array} hand - Card hand
 * @returns {string} - Cache key
 */
function getHandCacheKey(hand) {
  if (!Array.isArray(hand) || hand.length === 0) return '';
  
  // Sort cards by rank and suit for consistent key
  const sorted = hand
    .map(card => `${card.rank}${card.suit}`)
    .sort()
    .join(',');
  
  return sorted;
}

/**
 * Generate cache key for blackjack hand
 * @param {Array} hand - Card hand
 * @param {number} dealerValue - Dealer value
 * @returns {string} - Cache key
 */
function getBlackjackCacheKey(hand, dealerValue = 17) {
  const handKey = getHandCacheKey(hand);
  return `${handKey}|${dealerValue}`;
}

/**
 * Clean cache if it exceeds maximum size
 * @param {Map} cache - Cache to clean
 */
function cleanCache(cache) {
  if (cache.size <= MAX_CACHE_SIZE) return;
  
  // Remove oldest entries (first 25%)
  const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.25);
  const keys = Array.from(cache.keys()).slice(0, entriesToRemove);
  keys.forEach(key => cache.delete(key));
}

/**
 * Optimized hand evaluation with caching
 * @param {Array} hand - 5 cards
 * @returns {Object} - Hand evaluation
 */
function evaluateHandCached(hand) {
  if (hand.length !== 5) {
    return { name: 'invalid', rank: 0, payout: 0 };
  }

  const cacheKey = getHandCacheKey(hand);
  const cached = handEvaluationCache.get(cacheKey);
  if (cached) return cached;

  // Perform evaluation
  const result = evaluateHandUncached(hand);
  
  // Cache the result
  cleanCache(handEvaluationCache);
  handEvaluationCache.set(cacheKey, result);
  
  return result;
}

/**
 * Uncached hand evaluation (internal)
 * @param {Array} hand - 5 cards
 * @returns {Object} - Hand evaluation
 */
function evaluateHandUncached(hand) {
  const ranks = hand.map(c => getRankValue(c.rank));
  const rankCounts = {};
  
  // Count ranks efficiently
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isF = isFlush(hand);
  const isS = isStraightOptimized(ranks);

  // Royal flush (10-J-Q-K-A of same suit)
  if (isF && isS && ranks.includes(14) && ranks.includes(13) && 
      ranks.includes(12) && ranks.includes(11) && ranks.includes(10)) {
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
 * Optimized straight detection using pre-computed patterns
 * @param {Array} ranks - Card ranks
 * @returns {boolean} - True if straight
 */
function isStraightOptimized(ranks) {
  if (ranks.length !== 5) return false;
  
  const sorted = [...ranks].sort((a, b) => a - b);
  
  // Check against pre-computed patterns
  for (const pattern of STRAIGHT_PATTERNS) {
    if (arraysEqual(sorted, pattern)) return true;
  }
  
  return false;
}

/**
 * Check if two arrays are equal
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {boolean} - True if equal
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Optimized blackjack hand evaluation with caching
 * @param {Array} hand - Card hand
 * @param {number} dealerValue - Dealer value
 * @returns {Object} - Hand evaluation
 */
function evaluateBlackjackHandCached(hand, dealerValue = 17) {
  if (!Array.isArray(hand) || hand.length === 0) {
    return { name: 'invalid', payout: 0, value: 0 };
  }

  const cacheKey = getBlackjackCacheKey(hand, dealerValue);
  const cached = blackjackHandCache.get(cacheKey);
  if (cached) return cached;

  // Perform evaluation
  const result = evaluateBlackjackHandUncached(hand, dealerValue);
  
  // Cache the result
  cleanCache(blackjackHandCache);
  blackjackHandCache.set(cacheKey, result);
  
  return result;
}

/**
 * Uncached blackjack hand evaluation (internal)
 * @param {Array} hand - Card hand
 * @param {number} dealerValue - Dealer value
 * @returns {Object} - Hand evaluation
 */
function evaluateBlackjackHandUncached(hand, dealerValue = 17) {
  const value = getBlackjackHandValueOptimized(hand);
  
  if (value > 21) return { name: 'Bust', payout: 0, value };
  if (value === 21 && hand.length === 2) return { name: 'Blackjack', payout: 1.5, value };
  
  // Compare with dealer
  if (dealerValue > 21) return { name: 'Stand', payout: 1, value };
  if (value > dealerValue) return { name: 'Stand', payout: 1, value };
  if (value === dealerValue) return { name: 'Stand', payout: 1, value }; // Push
  
  return { name: 'Stand', payout: 0, value };
}

/**
 * Optimized blackjack hand value calculation
 * @param {Array} hand - Card hand
 * @returns {number} - Hand value
 */
function getBlackjackHandValueOptimized(hand) {
  if (!Array.isArray(hand) || hand.length === 0) return 0;
  
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    const cardValue = getBlackjackCardValue(card.rank);
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
 * Optimized blackjack detection
 * @param {Array} hand - Card hand
 * @returns {boolean} - True if blackjack
 */
function isBlackjackOptimized(hand) {
  if (!Array.isArray(hand) || hand.length !== 2) return false;
  
  const values = hand.map(card => getBlackjackCardValue(card.rank));
  return values.includes(11) && values.includes(10);
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
function getCacheStats() {
  return {
    pokerHandCache: {
      size: handEvaluationCache.size,
      maxSize: MAX_CACHE_SIZE
    },
    blackjackHandCache: {
      size: blackjackHandCache.size,
      maxSize: MAX_CACHE_SIZE
    }
  };
}

/**
 * Clear all caches
 */
function clearCaches() {
  handEvaluationCache.clear();
  blackjackHandCache.clear();
}

module.exports = {
  // Lookup tables
  CARD_RANK_VALUES,
  BLACKJACK_CARD_VALUES,
  FACE_CARDS,
  HAND_RANKINGS,
  BLACKJACK_RANKINGS,
  STRAIGHT_PATTERNS,
  
  // Optimized functions
  getRankValue,
  getBlackjackCardValue,
  isFaceCard,
  isAce,
  evaluateHandCached,
  evaluateBlackjackHandCached,
  getBlackjackHandValueOptimized,
  isBlackjackOptimized,
  isStraightOptimized,
  
  // Cache management
  getCacheStats,
  clearCaches,
  
  // Legacy compatibility
  evaluateHand: evaluateHandCached,
};
