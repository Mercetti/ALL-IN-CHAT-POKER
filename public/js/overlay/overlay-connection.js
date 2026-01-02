import { getSocketUrl } from './overlay-config.js';

/**
 * Establishes a Socket.IO connection for overlays and exposes helpers to attach listeners.
 * @param {Object} options
 * @param {string} options.channel - Channel (login) to scope overlay events to.
 * @param {string|null} options.token - Optional auth token for privileged overlays.
 * @param {(state: 'connected'|'reconnecting'|'disconnected') => void} [options.onConnectionState]
 * @returns {{ socket: import('socket.io-client').Socket, on: Function, off: Function }}
 */
export function createOverlayConnection({ channel, token, onConnectionState } = {}) {
  const socket = io(getSocketUrl() || undefined, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
    auth: {
      channel: channel || undefined,
      token: token || undefined,
    },
  });

  const emitConnectionState = (state) => {
    if (typeof onConnectionState === 'function') {
      onConnectionState(state);
    }
  };

  socket.on('connect', () => emitConnectionState('connected'));
  socket.on('disconnect', () => emitConnectionState('disconnected'));
  socket.on('reconnect_attempt', () => emitConnectionState('reconnecting'));

  return {
    socket,
    on: (...args) => socket.on(...args),
    off: (...args) => socket.off(...args),
  };
}
