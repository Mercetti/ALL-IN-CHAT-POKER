/**
 * Tournament management and logic
 */

const crypto = require('crypto');

/**
 * Generate unique lobby code
 */
function generateLobbyCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle(array = []) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate tournament bracket assignments
 */
function generateBracketAssignments(tournamentId, round = 1, roster = [], tableSize = 6) {
  const cleanSize = Math.min(Math.max(Number(tableSize) || 6, 2), 10);
  const shuffled = shuffle(roster);
  const assignments = [];
  
  for (let i = 0; i < shuffled.length; i += cleanSize) {
    const tablePlayers = shuffled.slice(i, i + cleanSize);
    assignments.push({
      tableNumber: Math.floor(i / cleanSize) + 1,
      round,
      players: tablePlayers,
      maxPlayers: cleanSize,
    });
  }
  
  return assignments;
}

/**
 * Get current tournament blinds structure
 */
function getCurrentBlinds(state) {
  const tournament = state.tournamentId ? getTournament(state.tournamentId) : null;
  
  if (!tournament || !tournament.blinds) {
    return { small: 10, big: 20, ante: 0 };
  }
  
  const currentLevel = tournament.currentLevel || 1;
  const blinds = tournament.blinds[currentLevel - 1] || tournament.blinds[0];
  
  return blinds || { small: 10, big: 20, ante: 0 };
}

/**
 * Apply tournament payouts
 */
function applyTournamentPayouts(state, payoutPayload = {}) {
  if (!state.tournamentId) return [];
  
  const tournament = getTournament(state.tournamentId);
  if (!tournament || !tournament.payouts) return [];
  
  // TODO: Implement payout calculation based on tournament structure
  const payouts = [];
  
  return payouts;
}

/**
 * Bind players to tournament table
 */
function bindTournamentTable(tournamentId, round, tableNum, channelName, players = []) {
  const state = getStateForChannel(channelName);
  if (!state) return false;
  
  // TODO: Implement table binding logic
  // Associate players with specific tournament table
  
  return true;
}

/**
 * Bootstrap tournament round
 */
function bootstrapTournamentRound(tournamentId, round, channelName) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return false;
  
  const state = getStateForChannel(channelName);
  if (!state) return false;
  
  // TODO: Implement round bootstrap
  // Set up tables, assign players, reset state
  
  return true;
}

/**
 * Advance tournament to next round
 */
function advanceTournamentRound(tournamentId, channelName) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return false;
  
  // TODO: Implement round advancement
  // Eliminate players, reassign remaining players to new tables
  
  return true;
}

/**
 * Create new tournament
 */
function createTournament(options = {}) {
  const tournament = {
    id: crypto.randomUUID(),
    name: options.name || 'Tournament',
    type: options.type || 'blackjack',
    buyIn: options.buyIn || 1000,
    maxPlayers: options.maxPlayers || 48,
    startTime: Date.now(),
    status: 'registering',
    players: [],
    currentLevel: 1,
    blinds: options.blinds || [
      { small: 10, big: 20, ante: 0, duration: 20 },
      { small: 20, big: 40, ante: 0, duration: 20 },
      { small: 30, big: 60, ante: 0, duration: 20 },
    ],
    payouts: options.payouts || [],
  };
  
  // TODO: Save tournament to database
  
  return tournament;
}

/**
 * Register player for tournament
 */
function registerPlayer(tournamentId, login, buyIn) {
  const tournament = getTournament(tournamentId);
  if (!tournament || tournament.status !== 'registering') return false;
  
  if (tournament.players.length >= tournament.maxPlayers) return false;
  
  tournament.players.push({
    login,
    buyIn,
    registeredAt: Date.now(),
    status: 'active',
    chips: buyIn,
  });
  
  // TODO: Save tournament state
  
  return true;
}

// Helper imports (these would be connected to the actual database)
function getStateForChannel(channel) {
  return require('./core').getStateForChannel(channel);
}

function getTournament(tournamentId) {
  // TODO: Connect to database
  return null;
}

module.exports = {
  generateLobbyCode,
  shuffle,
  generateBracketAssignments,
  getCurrentBlinds,
  applyTournamentPayouts,
  bindTournamentTable,
  bootstrapTournamentRound,
  advanceTournamentRound,
  createTournament,
  registerPlayer,
};
