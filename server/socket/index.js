const { getUserSession } = require('../auth-contract');

function createSocketHandlers({ io, auth, db, logger, recentSocketDisconnects, getStateForChannel, getChannelFromSocket, socketRateLimit, DEFAULT_CHANNEL, openBettingWindow, startRoundInternal, settleRound, getCosmeticsForLogin, getHeuristics, getDefaultAvatarForLogin, overlaySettingsByChannel, overlayFxByChannel }) {
  io.on('connection', (socket) => {
    const channel = getChannelFromSocket(socket);
    socket.data.channel = channel;
    socket.join(channel);
    logger.debug('Client connected', { socketId: socket.id, channel });

    socket.on('disconnect', (reason) => {
      recentSocketDisconnects.push({ reason, at: Date.now(), channel });
      if (recentSocketDisconnects.length > 50) recentSocketDisconnects.shift();
    });

    // Send current state
    const stateView = getStateForChannel(channel);
    socket.emit('state', {
      bettingOpen: stateView.bettingOpen,
      roundInProgress: stateView.roundInProgress,
      deck: (stateView.currentDeck || []).length,
      mode: stateView.currentMode,
      pot: stateView.pokerPot,
      currentBet: stateView.pokerCurrentBet,
      channel,
      players: Object.entries(stateView.playerStates || {}).map(([login, st]) => ({
        login,
        hand: st.hand,
        hands: st.hands,
        activeHand: st.activeHand,
        split: st.isSplit,
        insurance: st.insurance,
        insurancePlaced: st.insurancePlaced,
        bet: (stateView.betAmounts && stateView.betAmounts[login]) || 0,
        streetBet: (stateView.pokerStreetBets && stateView.pokerStreetBets[login]) || 0,
        avatar: (db.getProfile(login)?.settings && JSON.parse(db.getProfile(login).settings || '{}').avatarUrl) || null,
        cosmetics: getCosmeticsForLogin(login),
        ...getHeuristics(login, channel),
      })),
    });

    if (overlaySettingsByChannel[channel]) {
      socket.emit('overlaySettings', { settings: overlaySettingsByChannel[channel], fx: overlayFxByChannel[channel], channel });
    }

    const socketLogin = auth.extractUserLogin(socket.handshake);
    socket.data.login = socketLogin;

    // Send profile if user is authenticated
    const userSession = getUserSession(socket.handshake);
    if (userSession) {
      socket.emit('profile', userSession);
      try {
        const settings = userSession.settings ? JSON.parse(userSession.settings) : {};
        const avatarUrl = settings?.avatarUrl || getDefaultAvatarForLogin(socketLogin, settings?.avatarColor);
        io.to(channel).emit('playerUpdate', { login: socketLogin, avatar: avatarUrl, channel });
      } catch (e) {
        // ignore parse errors
      }
    }

    /**
     * Start a new round
     */
    socket.on('startRound', (data) => {
      if (!socketRateLimit(socket, 'startRound', 5000, 3)) return;
      const channelName = socket.data.channel || DEFAULT_CHANNEL;
      const state = getStateForChannel(channelName);
      if (!auth.isAdminRequest(socket.handshake)) {
        logger.warn('Unauthorized round start attempt', { socketId: socket.id, channel: channelName });
        return;
      }
      if (state.roundInProgress) {
        socket.emit('error', 'Round already in progress');
        return;
      }
      if (data && data.startNow) {
        startRoundInternal(channelName);
      } else if (state.bettingOpen) {
        startRoundInternal(channelName);
      } else {
        openBettingWindow(channelName);
      }
    });

    /**
     * Force a draw/discard decision
     */
    socket.on('forceDraw', (data) => {
      if (!socketRateLimit(socket, 'forceDraw', 5000, 3)) return;
      const channelName = socket.data.channel || DEFAULT_CHANNEL;
      const state = getStateForChannel(channelName);
      if (!auth.isAdminRequest(socket.handshake)) {
        logger.warn('Unauthorized draw attempt', { socketId: socket.id });
        return;
      }
      if (!state.roundInProgress) {
        socket.emit('error', 'No round in progress');
        return;
      }
      if (state.currentMode === 'blackjack') {
        settleRound({ ...data, channel: channelName });
      }
    });
  });
}

module.exports = { createSocketHandlers };
