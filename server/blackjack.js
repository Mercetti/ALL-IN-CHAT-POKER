/**
 * Blackjack helpers with shared shoe and dealer play
 */

const { cardLookup } = require('./utils');

// Use optimized lookup functions
const { 
  getBlackjackHandValueOptimized,
  evaluateBlackjackHandCached 
} = cardLookup;

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♦', '♣'];

function createDeck() {
  const deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => deck.push({ rank, suit }));
  return deck.sort(() => Math.random() - 0.5);
}

function createShoe(decks = 4) {
  let shoe = [];
  for (let i = 0; i < decks; i++) {
    shoe = shoe.concat(createDeck());
  }
  return shoe.sort(() => Math.random() - 0.5);
}

function dealInitialHand(deck) {
  return [deck.shift(), deck.shift()];
}

function handValue(hand) {
  return getBlackjackHandValueOptimized(hand);
}

function evaluateHand(hand, dealerValue = 17) {
  return evaluateBlackjackHandCached(hand, dealerValue);
}

module.exports = {
  createDeck,
  createShoe,
  dealInitialHand,
  handValue,
  evaluateHand,
};
