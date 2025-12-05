/**
 * OBS table overlay: renders seats, avatars, and player names.
 */

const SOCKET_URL = typeof getBackendBase === 'function' ? getBackendBase() : '';
const overlayChannel = typeof getChannelParam === 'function' ? getChannelParam() : '';
const isEventForChannel = (payload) => {
  if (!payload || !payload.channel) return true;
  return payload.channel === overlayChannel;
};
const socket = io(SOCKET_URL || undefined, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
  auth: {
    channel: overlayChannel,
  },
});

const DEFAULT_AVATAR = 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-profile_image.png';
const seatNodes = Array.from(document.querySelectorAll('.seat'));
const seatOrder = seatNodes.map((_, idx) => idx);
const seatAssignments = new Map();
let overlayPlayers = [];
let currentMode = '-';

function dedupePlayers(list) {
  const seen = new Set();
  return (list || []).reduce((acc, player) => {
    const login = player && player.login;
    if (!login || seen.has(login)) return acc;
    seen.add(login);
    acc.push(player);
    return acc;
  }, []);
}

function syncSeatAssignments(players) {
  const active = new Set(players.map(p => p.login));
  for (const login of Array.from(seatAssignments.keys())) {
    if (!active.has(login)) seatAssignments.delete(login);
  }

  const usedSeats = new Set(seatAssignments.values());
  const openSeats = seatOrder.filter(idx => !usedSeats.has(idx));
  players.forEach(player => {
    if (!seatAssignments.has(player.login) && openSeats.length) {
      seatAssignments.set(player.login, openSeats.shift());
    }
  });
}

function renderSeats() {
  syncSeatAssignments(overlayPlayers);

  seatNodes.forEach(node => {
    const seatIdx = Number(node.dataset.seat);
    const entry = Array.from(seatAssignments.entries()).find(([, seat]) => seat === seatIdx);
    const login = entry ? entry[0] : null;
    const player = login ? overlayPlayers.find(p => p.login === login) : null;
    const avatar = node.querySelector('img');
    const label = node.querySelector('.seat-name');

    if (player) {
      const displayName = player.display_name || player.login;
      node.classList.remove('open');
      if (avatar) {
        avatar.src = player.avatar || DEFAULT_AVATAR;
        avatar.alt = displayName;
      }
      if (label) label.textContent = displayName;
    } else {
      node.classList.add('open');
      if (avatar) {
        avatar.src = DEFAULT_AVATAR;
        avatar.alt = 'Open seat';
      }
      if (label) label.textContent = 'Open Seat';
    }
  });

  const overflowRow = document.getElementById('overflow-row');
  const overflowNames = document.getElementById('overflow-names');
  const overflowPlayers = overlayPlayers.filter(p => !seatAssignments.has(p.login));
  if (overflowRow && overflowNames) {
    if (overflowPlayers.length) {
      overflowRow.style.display = 'flex';
      overflowNames.textContent = overflowPlayers.map(p => p.display_name || p.login).join(' - ');
    } else {
      overflowRow.style.display = 'none';
    }
  }

  const seatedPill = document.getElementById('seated-pill');
  if (seatedPill) {
    seatedPill.textContent = `${overlayPlayers.length} / ${seatNodes.length} seated`;
  }
}

function updatePlayers(players = []) {
  overlayPlayers = dedupePlayers(players);
  renderSeats();
}

function mergePlayer(update) {
  if (!update || !update.login) return;
  const idx = overlayPlayers.findIndex(p => p.login === update.login);
  if (idx === -1) {
    overlayPlayers.push(update);
  } else {
    overlayPlayers[idx] = { ...overlayPlayers[idx], ...update };
  }
  renderSeats();
}

function setConnection(state) {
  const pill = document.getElementById('connection-pill');
  if (!pill) return;
  const text = state === 'connected' ? 'Connected' : state === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';
  pill.textContent = text;
  pill.classList.toggle('connected', state === 'connected');
  pill.classList.toggle('disconnected', state === 'disconnected');
}

function setMode(mode) {
  if (!mode) return;
  currentMode = mode;
  const pill = document.getElementById('mode-pill');
  if (pill) pill.textContent = `Mode: ${mode}`;
}

socket.on('connect', () => setConnection('connected'));
socket.on('disconnect', () => setConnection('disconnected'));
socket.on('reconnect_attempt', () => setConnection('reconnecting'));

socket.on('state', (data) => {
  if (!isEventForChannel(data)) return;
  setMode(data?.mode || currentMode);
  updatePlayers(data?.players || []);
});

socket.on('roundStarted', (data) => {
  if (!isEventForChannel(data)) return;
  setMode(data?.mode || currentMode);
  updatePlayers(data?.players || []);
});

socket.on('roundResult', (data) => {
  if (!isEventForChannel(data)) return;
  setMode(data?.mode || currentMode);
  updatePlayers(data?.players || []);
});

socket.on('playerUpdate', (data) => {
  if (!isEventForChannel(data)) return;
  mergePlayer(data);
});

socket.on('error', (err) => {
  console.error('Overlay error', err);
});

renderSeats();
