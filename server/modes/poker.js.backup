const game = require('../game');
const db = require('../db');
const { helmEngine: HelmEngine } = require('../helm/index');

/**
 * Initialize a poker round with shared deck/community and per-player hole cards.
 * Mutates playerStates and communityCards.
 * @param {Object} playerStates - map of login -> state
 * @param {Array<string>} bettors - logins placing bets
 * @param {number} maxPlayers
 * @returns {{deck: Array, community: Array}}
 */
function startPokerRound(playerStates, bettors, maxPlayers = 10) {
  const deck = game.createDeck();
  const community = [];

  bettors.slice(0, maxPlayers).forEach(user => {
    const hole = deck.splice(0, 2);
    playerStates[user] = {
      deck,
      hole,
      held: [],
      stood: false,
      busted: false,
      folded: false,
    };
  });

  return { deck, community };
}

/**
 * Evaluate poker results (best 5 of 7) given community cards
 * @param {Object} playerStates
 * @param {Array} communityCards
 * @returns {{playerResults:Array}}
 */
function settlePoker(playerStates, communityCards) {
  const playerResults = [];

  Object.entries(playerStates).forEach(([login, state]) => {
    if (state.folded) {
      playerResults.push({ login, finalHand: state.hole || [], evaluation: { name: 'Folded', rank: 0, payout: 0 } });
      return;
    }

    const finalHand = (state.hole || []).concat(communityCards || []);
    const evaluation = game.evaluateBestOfSeven(finalHand);
    playerResults.push({ login, finalHand, evaluation });

  return { playerResults };
}

/**
 * Settle and build payouts/round result for poker
 * @param {Object} playerStates
 * @param {Array} communityCards
 * @param {Object} betAmounts
 * @param {Object} dbInstance
 * @param {Array<string>} waitingQueue
 * @returns {{roundResult:Object, payoutPayload:Object}}
 */
function settlePokerRound(playerStates, communityCards, betAmounts, waitingQueue, dbInstance, options = {}) {
  const { playerResults } = settlePoker(playerStates, communityCards);
  const beforeLeaderboard = dbInstance.getLeaderboard(10);
  const payoutPayload = { winners: [], payouts: {}, leaderboard: beforeLeaderboard, leaderboardAfter: [] };
  const handsInc = Number.isFinite(options.hands) ? options.hands : 1;
  const secInc = Number.isFinite(options.playSeconds) ? options.playSeconds : 0;

  playerResults.forEach(({ login, evaluation }) => {
    const amount = betAmounts[login] || 0;
    if (evaluation.payout > 0) {
      const winnings = amount * evaluation.payout;
      payoutPayload.winners.push(login);
      payoutPayload.payouts[login] = winnings;
      dbInstance.addChips(login, winnings);
      dbInstance.updateRoundStats(login, { won: true, winnings, bestHand: evaluation.name, hands: handsInc, seconds: secInc });
    } else {
      dbInstance.updateRoundStats(login, { won: false, winnings: 0, hands: handsInc, seconds: secInc });
    }
  });

  payoutPayload.leaderboardAfter = dbInstance.getLeaderboard(10);

  return {
    roundResult: {
      dealerHand: null,
      players: playerResults,
      community: communityCards,
      waiting: waitingQueue,
      mode: 'poker',
    },
    payoutPayload,
  };
}

/**
 * Settle and emit poker results; returns list of broke users
 * @param {Object} io
 * @param {Object} playerStates
 * @param {Array} communityCards
 * @param {Object} betAmounts
 * @param {Array<string>} waitingQueue
 * @param {string} channel
 * @returns {{broke:Array<string>}}
 */
function settleAndEmit(io, playerStates, communityCards, betAmounts, waitingQueue, dbInstance = db, channel, meta = {}) {
  const { roundResult, payoutPayload } = settlePokerRound(playerStates, communityCards, betAmounts, waitingQueue, dbInstance, meta);
  const chan = typeof channel === 'string' ? channel : undefined;
  io.emit('roundResult', { ...roundResult, channel: chan });
  io.emit('payouts', { ...payoutPayload, channel: chan });

  // Forward game events to Helm engine
  // Note: Helm engine uses different API, this is a placeholder for integration
  // const helmEngine = new HelmEngine();
  // if (helmEngine) {
  //   roundResult.players.forEach(player => {
  //     if (player.evaluation) {
  //       helmEngine.processEvent(chan || 'default', {
  //         type: player.evaluation.payout > 0 ? 'win' : 'lose',
  //         player: player.login,
  //         amount: betAmounts[player.login] || 0,
  //         winnings: payoutPayload.payouts[player.login] || 0
  //       });
  //     }
  //   });
  // }

  const broke = [];
  Object.keys(playerStates).forEach(login => {
    const balance = db.getBalance(login);
    if (balance <= 0) broke.push(login);

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
 * Start a poker phase timer (auto-advances phases)
 * @param {Object} io - socket.io instance
 * @param {string} phase
 * @param {Array} communityCards
 * @param {number} durationMs
 * @param {Function} onExpire - callback to advance phase
 * @param {string} channel
 * @returns {NodeJS.Timeout}
 */
function startPokerPhaseTimer(io, phase, communityCards, durationMs, onExpire, channel) {
  const endsAt = Date.now() + durationMs;
  io.emit('pokerPhase', { phase, community: communityCards, actionEndsAt: endsAt, channel: channel || undefined });
  const timer = setTimeout(onExpire, durationMs);
  return timer;
}

/**
 * Create a poker turn manager (per-player timers)
 * @param {Object} io
 * @param {Array<string>} turnOrder
 * @param {number} durationMs
 * @param {Function} onTimeout(login)
 * @param {string} channel
 * @returns {{start: Function, stop: Function}}
 */
function createPokerTurnManager(io, turnOrder, durationMs, onTimeout, playerStates = {}, channel, aiDecider) {
  const order = Array.from(turnOrder);
  let index = 0;
  let timer = null;
  const chan = channel || undefined;

  const scheduleNext = () => {
    // Skip folded players as we walk the order
    while (index < order.length) {
      const login = order[index];
      const state = playerStates[login];
      if (!state || state.folded) {
        index += 1;
        continue;
      }

      if (typeof aiDecider === 'function' && aiDecider(login)) {
        index += 1;
        continue;
      }

      const endsAt = Date.now() + durationMs;
      io.emit('playerTurn', { login, endsAt, channel: chan });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onTimeout && onTimeout(login, false);
        index += 1;
        scheduleNext();
      }, durationMs);
      return;
    }

    // One full pass completed
    onTimeout && onTimeout(null, true);
  };

  const start = () => scheduleNext();

  const stop = () => {
    if (timer) clearTimeout(timer);
  };

  return { start, stop };
}

/**
 * Fold a player (mutates state)
 * @param {Object} playerStates
 * @param {string} login
 */
function foldPlayerState(playerStates, login) {
  const state = playerStates[login];
  if (!state) return;
  state.folded = true;
}

/**
 * Factory to handle poker settle and turn management
 * @param {Object} io
 * @param {Object} playerStates
 * @param {Array} communityCards
 * @param {Function} onSettle
 * @param {Function} shouldFoldOnTimeout
 * @param {string} channel
 * @returns {Object} handlers
 */
function createPokerHandlers(io, playerStates, communityCards, onSettle = () => {}, shouldFoldOnTimeout = () => true, channel) {
  const chan = channel || undefined;
  const settleIfDone = () => {
    const activeCount = Object.values(playerStates).filter(state => !state.folded).length;
    if (activeCount <= 1) {
      onSettle();
    }
  };

  const fold = (login) => {
    foldPlayerState(playerStates, login);
    io.emit('playerUpdate', { login, folded: true, channel: chan });
    settleIfDone();
  };

  const turnManager = (order, durationMs, onTimeoutOverride, aiDecider) => {
    const timeoutHandler = onTimeoutOverride
      ? (login) => onTimeoutOverride(login)
      : (login, empty) => {
          if (login) {
            if (shouldFoldOnTimeout(login)) {
              fold(login);
            } else {
              io.emit('playerUpdate', { login, checked: true, channel: chan });
            }
          }
          if (empty) onSettle();
          else settleIfDone();
        };
    return createPokerTurnManager(io, order, durationMs, timeoutHandler, playerStates, channel, aiDecider);
  };

  return {
    fold,
    turnManager,
  };
}

module.exports = {
  startPokerRound,
  settlePoker,
  settlePokerRound,
  settleAndEmit,
  startPokerPhaseTimer,
  createPokerTurnManager,
  foldPlayerState,
  createPokerHandlers,
};
