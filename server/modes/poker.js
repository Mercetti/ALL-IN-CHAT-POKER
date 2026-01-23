/**
 * Poker Mode - Simplified Version
 * Basic poker game functionality
 */

const logger = require('../utils/logger');

class PokerMode {
  constructor() {
    this.isActive = false;
    this.currentGame = null;
    this.stats = { games: 0, pots: 0, players: 0 };
  }

  /**
   * Initialize poker mode
   */
  async initialize() {
    logger.info('Poker Mode initialized');
    return true;
  }

  /**
   * Start new poker game
   */
  startGame(gameType, players) {
    if (this.isActive) {
      return { success: false, message: 'Game already in progress' };
    }

    this.isActive = true;
    this.currentGame = {
      type: gameType,
      players: players.map(id => ({ id, cards: [], bet: 0, folded: false })),
      deck: this.createDeck(),
      pot: 0,
      communityCards: [],
      stage: 'preflop',
      startedAt: new Date()
    };

    this.stats.games++;
    this.stats.players += players.length;

    logger.info('Poker game started', { gameType, players });

    return {
      success: true,
      game: this.currentGame
    };
  }

  /**
   * Create a standard deck of cards
   */
  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, value: this.getCardValue(rank) });
      }
    }

    return this.shuffleDeck(deck);
  }

  /**
   * Get card value
   */
  getCardValue(rank) {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
  }

  /**
   * Shuffle deck
   */
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Deal cards to players
   */
  dealCards(playerId, count = 2) {
    if (!this.isActive) {
      return { success: false, message: 'No active game' };
    }

    const player = this.currentGame.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    for (let i = 0; i < count; i++) {
      if (this.currentGame.deck.length > 0) {
        player.cards.push(this.currentGame.deck.pop());
      }
    }

    return {
      success: true,
      cards: player.cards
    };
  }

  /**
   * Place bet
   */
  placeBet(playerId, amount) {
    if (!this.isActive) {
      return { success: false, message: 'No active game' };
    }

    const player = this.currentGame.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    player.bet += amount;
    this.currentGame.pot += amount;
    this.stats.pots += amount;

    return {
      success: true,
      bet: player.bet,
      pot: this.currentGame.pot
    };
  }

  /**
   * Get current game status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      currentGame: this.currentGame,
      stats: this.stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * End current game
   */
  endGame(winnerId) {
    if (!this.isActive) {
      return { success: false, message: 'No active game' };
    }

    this.currentGame.winner = winnerId;
    this.currentGame.endedAt = new Date();
    this.isActive = false;

    logger.info('Poker game ended', { winner: winnerId, pot: this.currentGame.pot });

    return {
      success: true,
      winner: winnerId,
      pot: this.currentGame.pot
    };
  }
}

module.exports = PokerMode;
