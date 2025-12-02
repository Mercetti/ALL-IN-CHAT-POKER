/**
 * Blackjack helpers with shared shoe and dealer play
 */

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♦', '♣'];

function createDeck() {
  const deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => deck.push({ rank, suit }));
  });
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
  let total = 0;
  let aces = 0;
  hand.forEach(card => {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function evaluateHand(hand, dealerValue = 17) {
  const value = handValue(hand);
  if (value > 21) return { name: 'Bust', payout: 0, value };
  if (value === 21 && hand.length === 2) return { name: 'Blackjack', payout: 1.5, value };
  if (value > dealerValue || dealerValue > 21) return { name: 'Win', payout: 1, value };
  if (value === dealerValue) return { name: 'Push', payout: 0, value };
  return { name: 'Lose', payout: 0, value };
}

module.exports = {
  createDeck,
  createShoe,
  dealInitialHand,
  handValue,
  evaluateHand,
};
