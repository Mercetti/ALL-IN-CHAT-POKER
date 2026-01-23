/**
 * Blackjack Mode - Simplified Version
 * Basic blackjack game functionality
 */

const logger = require('../utils/logger');

class BlackjackMode {
  constructor() {
    this.isActive = false;
    this.currentGame = null;
    this.stats = { games: 0, wins: 0, losses: 0 };
  }

  /**
   * Initialize blackjack mode
   */
  async initialize() {
    logger.info('Blackjack Mode initialized');
    return true;
  }

  /**
   * Start new blackjack game
   */
  startGame(playerId, bet) {
    if (this.isActive) {
      return { success: false, message: 'Game already in progress' };
    }

    this.isActive = true;
    this.currentGame = {
      playerId,
      bet,
      cards: [],
      dealerCards: [],
      status: 'playing',
      startedAt: new Date()
    };

    this.stats.games++;
    logger.info('Blackjack game started', { playerId, bet });

    return {
      success: true,
      game: this.currentGame
    };
  }

  /**
   * Hit - draw another card
   */
  hit(playerId) {
    if (!this.isActive || this.currentGame.playerId !== playerId) {
      return { success: false, message: 'No active game' };
    }

    // Simplified - just add a random card
    const card = Math.floor(Math.random() * 13) + 1;
    this.currentGame.cards.push(card);

    return {
      success: true,
      card,
      total: this.calculateTotal(this.currentGame.cards)
    };
  }

  /**
   * Stand - end player turn
   */
  stand(playerId) {
    if (!this.isActive || this.currentGame.playerId !== playerId) {
      return { success: false, message: 'No active game' };
    }

    this.currentGame.status = 'stand';
    
    // Simplified dealer logic
    const dealerTotal = this.calculateTotal(this.currentGame.dealerCards);
    const playerTotal = this.calculateTotal(this.currentGame.cards);

    const result = dealerTotal > 21 ? 'win' : playerTotal > dealerTotal ? 'win' : 'lose';
    
    this.endGame(result);

    return {
      success: true,
      result,
      dealerTotal,
      playerTotal
    };
  }

  /**
   * Calculate hand total
   */
  calculateTotal(cards) {
    return cards.reduce((total, card) => {
      return total + Math.min(card, 10);
    }, 0);
  }

  /**
   * End current game
   */
  endGame(result) {
    if (result === 'win') {
      this.stats.wins++;
    } else {
      this.stats.losses++;
    }

    this.currentGame.result = result;
    this.currentGame.endedAt = new Date();
    this.isActive = false;

    logger.info('Blackjack game ended', { result });
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
}

module.exports = BlackjackMode;
