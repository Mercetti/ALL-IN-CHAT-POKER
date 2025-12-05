/**
 * OBS overlay: embed the main table page and show minimal status.
 */

const SOCKET_URL = typeof getBackendBase === 'function' ? getBackendBase() : '';
const socket = io(SOCKET_URL || undefined, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
});

const frame = document.getElementById('table-frame');
const connectionPill = document.getElementById('connection-pill');
const modePill = document.getElementById('mode-pill');
const seatedPill = document.getElementById('seated-pill');

function setFrameSrc() {
  const base = (typeof getBackendBase === 'function' ? getBackendBase() : '') || window.location.origin || '';
  if (frame) frame.src = `${base}/`;
}

function setConnection(state) {
  if (!connectionPill) return;
  const text = state === 'connected' ? 'Connected' : state === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';
  connectionPill.textContent = text;
  connectionPill.classList.toggle('connected', state === 'connected');
  connectionPill.classList.toggle('disconnected', state === 'disconnected');
}

function setMode(mode) {
  if (!modePill || !mode) return;
  modePill.textContent = `Mode: ${mode}`;
}

function setSeated(count) {
  if (!seatedPill) return;
  seatedPill.textContent = `${count} seated`;
}

socket.on('connect', () => setConnection('connected'));
socket.on('disconnect', () => setConnection('disconnected'));
socket.on('reconnect_attempt', () => setConnection('reconnecting'));

socket.on('state', (data = {}) => {
  setMode(data.mode);
  setSeated(Array.isArray(data.players) ? data.players.length : 0);
});

socket.on('roundStarted', (data = {}) => {
  setMode(data.mode);
  setSeated(Array.isArray(data.players) ? data.players.length : 0);
});

socket.on('roundResult', (data = {}) => {
  setMode(data.mode);
  setSeated(Array.isArray(data.players) ? data.players.length : 0);
});

socket.on('error', (err) => {
  console.error('Overlay error', err);
});

setFrameSrc();
