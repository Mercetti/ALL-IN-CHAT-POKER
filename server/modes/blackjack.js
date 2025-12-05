const blackjack = require('../blackjack');
const Logger = require('../logger');
const logger = new Logger('blackjack');
const db = require('../db');
const config = require('../config');

/**
 * Initialize a blackjack round with shared shoe and dealer hand.
 * Mutates dealerState and playerStates.
 * @param {Object} dealerState - { shoe, hand }
 * @param {Object} playerStates - map of login -> state
 * @param {Array<string>} bettors - logins placing bets
 * @param {number} maxPlayers
 */
function startBlackjackRound(dealerState, playerStates, bettors, maxPlayers = 7) {
  dealerState.shoe = blackjack.createShoe(4);
  dealerState.hand = blackjack.dealInitialHand(dealerState.shoe);

  bettors.slice(0, maxPlayers).forEach(user => {
    const hand = blackjack.dealInitialHand(dealerState.shoe);
    playerStates[user] = {
      deck: dealerState.shoe,
      hand,
      held: [],
      stood: false,
      busted: false,
      folded: false,
      hands: null,
      activeHand: 0,
      isSplit: false,
      doubled: false,
      surrendered: false,
    };
  });

  return {
    dealerHand: dealerState.hand,
    dealerShoe: dealerState.shoe,
  };
}

/**
 * Settle blackjack hands: auto-play players to 17+, settle dealer to 17+, evaluate results.
 * @param {Object} dealerState - { hand, shoe }
 * @param {Object} playerStates - map of login -> state
 * @returns {{dealerHand: Array, playerResults: Array}}
 */
function settleBlackjack(dealerState, playerStates) {
  if (!dealerState.hand || dealerState.hand.length === 0) {
    dealerState.hand = blackjack.dealInitialHand(dealerState.shoe || blackjack.createShoe(4));
  }

  while (blackjack.handValue(dealerState.hand) < 17 && dealerState.shoe && dealerState.shoe.length > 0) {
    dealerState.hand.push(dealerState.shoe.shift());
  }

  const dealerValue = blackjack.handValue(dealerState.hand);
  const playerResults = [];

  Object.entries(playerStates).forEach(([login, state]) => {
    if (state.isSplit && Array.isArray(state.hands)) {
      const results = state.hands.map(h => blackjack.evaluateHand(h, dealerValue));
      playerResults.push({ login, split: true, hands: state.hands, evaluations: results });
    } else {
      let finalHand = state.hand && state.hand.length ? [...state.hand] : blackjack.dealInitialHand(dealerState.shoe || blackjack.createShoe(4));

      if (!state.stood && blackjack.handValue(finalHand) < 17) {
        while (blackjack.handValue(finalHand) < 17 && dealerState.shoe && dealerState.shoe.length > 0) {
          finalHand.push(dealerState.shoe.shift());
        }
      }

      const evaluation = blackjack.evaluateHand(finalHand, dealerValue);
      playerResults.push({ login, finalHand, evaluation });
    }
  });

  return { dealerHand: dealerState.hand, playerResults };
}

/**
 * Settle and build payouts/round result for blackjack
 * @param {Object} dealerState
 * @param {Object} playerStates
 * @param {Object} betAmounts
 * @param {Array<string>} waitingQueue
 * @param {Object} dbInstance
 * @returns {{roundResult: Object, payoutPayload: Object}}
 */
function settleBlackjackRound(dealerState, playerStates, betAmounts, waitingQueue, dbInstance) {
  const { dealerHand, playerResults } = settleBlackjack(dealerState, playerStates);
  const beforeLeaderboard = dbInstance.getLeaderboard(10);
  const payoutPayload = { winners: [], payouts: {}, leaderboard: beforeLeaderboard, leaderboardAfter: [] };

  playerResults.forEach(({ login, evaluation }) => {
    const amount = betAmounts[login] || 0;
    const state = playerStates[login] || {};
    let winnings = 0;

    // Insurance payout if dealer has blackjack
    if (state.insurance && state.insurance > 0 && dealerHand && dealerHand.length === 2 && blackjack.handValue(dealerHand) === 21) {
      const insuranceWin = state.insurance * 2;
      winnings += insuranceWin;
      payoutPayload.payouts[login] = (payoutPayload.payouts[login] || 0) + insuranceWin;
    }

    // Surrender: bet already halved/refunded; no further payout
    if (state.surrendered) {
      dbInstance.updateRoundStats(login, { won: false, winnings: winnings, bestHand: 'Surrender' });
      if (winnings > 0) {
        payoutPayload.winners.push(login);
        dbInstance.addChips(login, winnings);
      }
      return;
    }

    if (state.isSplit && Array.isArray(state.hands)) {
      const perHandBet = (amount || 0) / 2;
      state.hands.forEach(handArr => {
        const evalHand = blackjack.evaluateHand(handArr, blackjack.handValue(dealerHand));
        if (evalHand.payout > 0) {
          const handWin = perHandBet * evalHand.payout;
          winnings += handWin;
        }
      });
      if (winnings > 0) {
        payoutPayload.winners.push(login);
        payoutPayload.payouts[login] = (payoutPayload.payouts[login] || 0) + winnings;
        dbInstance.addChips(login, winnings);
        dbInstance.updateRoundStats(login, { won: true, winnings, bestHand: 'Split Win' });
      } else {
        dbInstance.updateRoundStats(login, { won: false, winnings: 0 });
      }
      return;
    }

    if (evaluation.payout > 0) {
      winnings += amount * evaluation.payout;
      payoutPayload.winners.push(login);
      payoutPayload.payouts[login] = (payoutPayload.payouts[login] || 0) + winnings;
      dbInstance.addChips(login, winnings);
      dbInstance.updateRoundStats(login, { won: true, winnings, bestHand: evaluation.name });
    } else {
      dbInstance.updateRoundStats(login, { won: false, winnings });
      if (winnings > 0) {
        payoutPayload.payouts[login] = (payoutPayload.payouts[login] || 0) + winnings;
        payoutPayload.winners.push(login);
        dbInstance.addChips(login, winnings);
      }
    }
  });

  payoutPayload.leaderboardAfter = dbInstance.getLeaderboard(10);

  return {
    roundResult: {
      dealerHand,
      players: playerResults,
      community: [],
      waiting: waitingQueue,
      mode: 'blackjack',
    },
    payoutPayload,
  };
}

/**
 * Settle and emit events; returns list of broke users
 * @param {Object} io
 * @param {Object} dealerState
 * @param {Object} playerStates
 * @param {Object} betAmounts
 * @param {Array<string>} waitingQueue
 * @param {Object} dbInstance
 * @returns {{broke:Array<string>}}
 */
function settleAndEmit(io, dealerState, playerStates, betAmounts, waitingQueue, dbInstance) {
  const { roundResult, payoutPayload } = settleBlackjackRound(dealerState, playerStates, betAmounts, waitingQueue, dbInstance);
  io.emit('roundResult', roundResult);
  io.emit('payouts', payoutPayload);
  // Push final balances/bet reset to overlay
  Object.keys(betAmounts || {}).forEach(login => {
    io.emit('playerUpdate', {
      login,
      bet: 0,
      balance: dbInstance.getBalance(login),
    });
  });

  const broke = [];
  Object.keys(playerStates).forEach(login => {
    const balance = dbInstance.getBalance(login);
    if (balance <= 0) broke.push(login);
  });

  return {
    broke,
    roundResult,
    payoutPayload,
    nextWaiting: waitingQueue,
    nextBetAmounts: {},
    nextPlayerStates: {},
  };
}

/**
 * Start the blackjack action timer (shared for all players)
 * @param {Object} io - socket.io instance
 * @param {number} durationMs
 * @param {Function} onExpire - callback to force settle
 * @returns {NodeJS.Timeout}
 */
function startBlackjackActionTimer(io, durationMs, onExpire) {
  const timer = setTimeout(() => {
    io.emit('actionPhaseEnded');
    onExpire();
  }, durationMs);
  return timer;
}

/**
 * Handle per-player turn action (hit/stand) with timeout fallback
 * @param {Object} io
 * @param {Array<string>} turnOrder
 * @param {number} durationMs
 * @param {Function} onAuto - callback when auto-stand triggers
 * @param {Function} getDuration - optional per-player duration callback
 * @param {Function} onTimeout - optional hook when timeout occurs
 * @returns {{start: Function, stop: Function}}
 */
function createBlackjackTurnManager(io, turnOrder, durationMs, onAuto, getDuration, onTimeout) {
  let index = 0;
  let timer = null;

  const start = () => {
    if (!turnOrder.length) return;
    const login = turnOrder[index % turnOrder.length];
    const perPlayerDuration = typeof getDuration === 'function' ? getDuration(login) : durationMs;
    const endsAt = Date.now() + perPlayerDuration;
    io.emit('playerTurn', { login, endsAt });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (typeof onTimeout === 'function') onTimeout(login);
      onAuto(login);
      index = (index + 1) % turnOrder.length;
      start();
    }, perPlayerDuration);
  };

  const stop = () => {
    if (timer) clearTimeout(timer);
  };

  return { start, stop };
}

/**
 * Apply a stand action for a player (mutates state)
 * @param {Object} playerStates
 * @param {string} login
 */
function applyStand(playerStates, login) {
  const state = playerStates[login];
  if (!state) return;
  state.stood = true;
}

/**
 * Apply a hit action for a player (mutates state, uses shared shoe)
 * @param {Object} playerStates
 * @param {Object} dealerState
 * @param {string} login
 * @returns {Object|null} card drawn
 */
function applyHit(playerStates, dealerState, login) {
  const state = playerStates[login];
  if (!state) return null;
  if (!dealerState.shoe || dealerState.shoe.length === 0) {
    dealerState.shoe = blackjack.createShoe(4);
  }
  if (state.isSplit && Array.isArray(state.hands)) {
    const current = state.hands[state.activeHand] || [];
    const card = dealerState.shoe.shift();
    if (card) current.push(card);
    state.hands[state.activeHand] = current;
    state.hand = current;
    return card;
  } else {
    if (state.hand.length === 0) {
      state.hand = blackjack.dealInitialHand(dealerState.shoe);
    }
    const card = dealerState.shoe.shift();
    if (card) {
      state.hand.push(card);
    }
    return card;
  }
}

/**
 * Factory to handle blackjack socket actions and settle
 * @param {Object} io
 * @param {Object} dealerState
 * @param {Object} playerStates
 * @param {Function} onSettle - called to settle round
 * @param {Function} onTurnAdvance - called to restart turn cycle
 * @param {Function} getTurnDuration - optional per-player duration callback
 * @param {Function} onTimeout - optional callback when a player times out
 */
function createBlackjackHandlers(io, dealerState, playerStates, onSettle = () => {}, onTurnAdvance = () => {}, getTurnDuration, onTimeout) {
  const hit = (login) => {
    const card = applyHit(playerStates, dealerState, login);
    if (!card) return;
    const state = playerStates[login];
    const activeHand = state.isSplit ? (state.hands[state.activeHand] || []) : state.hand;
    const value = blackjack.handValue(activeHand);
    if (value > 21) {
      if (state.isSplit && state.activeHand < (state.hands.length - 1)) {
        state.activeHand += 1;
        state.hand = state.hands[state.activeHand];
      } else {
        state.busted = true;
        state.stood = true;
      }
    }
    io.emit('playerUpdate', {
      login,
      hand: state.hand,
      hands: state.hands,
      activeHand: state.activeHand,
    });
  };

  const stand = (login) => {
    applyStand(playerStates, login);
    const state = playerStates[login];
    if (state.isSplit && state.activeHand < (state.hands.length - 1)) {
      state.activeHand += 1;
      state.hand = state.hands[state.activeHand];
      state.stood = false;
    }
    io.emit('playerUpdate', { login, hand: state.hand, hands: state.hands, activeHand: state.activeHand, stood: state.stood });
  };

  const doubleDown = (login, betAmounts, dbInstance) => {
    const state = playerStates[login];
    if (!state || state.doubled) return;
    const currentBet = betAmounts[login] || 0;
    const balance = dbInstance.getBalance(login);
    if (balance < currentBet) return; // insufficient chips
    dbInstance.setBalance(login, balance - currentBet);
    betAmounts[login] = currentBet * 2;
    state.doubled = true;
    const card = applyHit(playerStates, dealerState, login);
    if (card) {
      const value = blackjack.handValue(state.hand);
      if (value > 21) {
        state.busted = true;
      }
    }
    state.stood = true;
    io.emit('playerUpdate', { login, hand: state.hand, doubled: true, bet: betAmounts[login], balance: dbInstance.getBalance(login) });
    onTurnAdvance();
  };

  const surrender = (login, betAmounts, dbInstance) => {
    const state = playerStates[login];
    if (!state || state.surrendered) return;
    const currentBet = betAmounts[login] || 0;
    const refund = Math.floor(currentBet / 2);
    if (refund > 0) {
      dbInstance.addChips(login, refund);
    }
    state.surrendered = true;
    state.stood = true;
    betAmounts[login] = 0; // prevent further payout
    io.emit('playerUpdate', { login, surrendered: true, bet: 0, balance: dbInstance.getBalance(login) });
    onTurnAdvance();
  };

  const insurance = (login, amount, betAmounts, dbInstance) => {
    const state = playerStates[login];
    if (!state || !dealerState.hand || dealerState.hand.length === 0 || dealerState.hand[0].rank !== 'A') return;
    if (state.insurancePlaced) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    const maxInsurance = Math.floor((betAmounts[login] || 0) / 2);
    if (amount > maxInsurance) return;
    const balance = dbInstance.getBalance(login);
    if (balance < amount) return;
    dbInstance.setBalance(login, balance - amount);
    state.insurance = amount;
    state.insurancePlaced = true;
    io.emit('playerUpdate', { login, insurance: amount, balance: dbInstance.getBalance(login) });
  };

  const split = (login, betAmounts, dbInstance) => {
    const state = playerStates[login];
    if (!state || !state.hand || state.hand.length !== 2) return;
    const [c1, c2] = state.hand;
    if (c1.rank !== c2.rank) return;
    const currentBet = betAmounts[login] || 0;
    const balance = dbInstance.getBalance(login);
    if (balance < currentBet) return; // need funds to duplicate bet
    dbInstance.setBalance(login, balance - currentBet);
    betAmounts[login] = currentBet * 2;

    const hand1 = [c1, dealerState.shoe.shift()].filter(Boolean);
    const hand2 = [c2, dealerState.shoe.shift()].filter(Boolean);

    state.hands = [hand1, hand2];
    state.activeHand = 0;
    state.isSplit = true;
    state.stood = false;
    state.hand = state.hands[state.activeHand];
    io.emit('playerUpdate', { login, split: true, hands: state.hands, activeHand: state.activeHand, bet: betAmounts[login], balance: dbInstance.getBalance(login) });
  };

  const switchHand = (login, index) => {
    const state = playerStates[login];
    if (!state || !state.isSplit || !Array.isArray(state.hands)) return;
    if (index < 0 || index >= state.hands.length) return;
    state.activeHand = index;
    state.hand = state.hands[state.activeHand];
    io.emit('playerUpdate', { login, hands: state.hands, activeHand: state.activeHand, split: true });
  };

  const autoTurn = (login) => {
    stand(login);
    onTurnAdvance();
  };

  const actionTimer = () =>
    startBlackjackActionTimer(io, config.BJ_ACTION_DURATION_MS, () => {
      onSettle();
    });

  const turnManager = (order) =>
    createBlackjackTurnManager(
      io,
      order,
      config.BJ_ACTION_DURATION_MS,
      (login) => {
        autoTurn(login);
      },
      getTurnDuration,
      onTimeout
    );

  return {
    hit,
    stand,
    insurance,
    split,
    switchHand,
    doubleDown,
    surrender,
    actionTimer,
    turnManager,
  };
}

module.exports = {
  startBlackjackRound,
  settleBlackjack,
  settleBlackjackRound,
  startBlackjackActionTimer,
  createBlackjackTurnManager,
  applyStand,
  applyHit,
  createBlackjackHandlers,
};
