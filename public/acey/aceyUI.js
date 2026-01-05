import { speakBrowser, playServerTTS } from './aceyTTS.js';
import { StreamOverview } from './streamOverview.js';

const overlayEl = document.getElementById('aceyOverlay');
const peakEl = document.getElementById('peakEvent');
const summaryEl = document.getElementById('periodicSummary');
const textEl = overlayEl?.querySelector('.acey-text');

const config = window.AceyConfig || {};
const session = {
  memory: [],
  dynamicMemory: [],
  moodCounters: { trashTalk: 0, positiveEvents: 0 },
};

let peakTimeout = null;
let ws = null;
let streamOverview = null;

function ensureVisible() {
  if (overlayEl) overlayEl.classList.add('is-visible');
}

function setPrimaryText(text, tone) {
  if (!textEl) return;
  textEl.textContent = text;
  ensureVisible();
  overlayEl?.classList.add('is-speaking');
  setTimeout(() => overlayEl?.classList.remove('is-speaking'), 1800);
  playVoice(text, tone);
}

function playVoice(text, tone) {
  if (!text) return;
  if (config.isUltra) playServerTTS(text, { tone });
  else speakBrowser(text);
}

function showPeakEvent(text) {
  if (!peakEl || !text) return;
  peakEl.textContent = text;
  peakEl.style.display = 'block';
  peakEl.classList.remove('acey-peak-animate');
  void peakEl.offsetWidth;
  peakEl.classList.add('acey-peak-animate');
  if (peakTimeout) clearTimeout(peakTimeout);
  peakTimeout = setTimeout(() => {
    peakEl.style.display = 'none';
    peakEl.classList.remove('acey-peak-animate');
  }, 5000);
}

function showPeriodicSummary(text) {
  if (!summaryEl || !text) return;
  summaryEl.textContent = text;
  ensureVisible();
}

function addMemory(entry = {}) {
  const item = { ...entry, timestamp: entry.timestamp || Date.now() };
  session.memory.push(item);
  if (session.memory.length > 500) session.memory.shift();
}

function addDynamicPhrase(phrase = {}) {
  if (!phrase.text) return;
  session.dynamicMemory.push({ ...phrase, timestamp: phrase.timestamp || Date.now() });
  if (session.dynamicMemory.length > 100) session.dynamicMemory.shift();
}

function handleServerMessage(raw) {
  let data;
  try {
    data = JSON.parse(raw.data || raw);
  } catch (err) {
    console.warn('Acey message parse failed', err);
    return;
  }

  if (data.memory) {
    addMemory(data.memory);
    streamOverview?.checkPeakEvent(data.memory);
  }

  if (Array.isArray(data.dynamicMemory)) {
    data.dynamicMemory.forEach(addDynamicPhrase);
  } else if (data.dynamicMemory) {
    addDynamicPhrase(data.dynamicMemory);
  }

  if (data.type === 'peak') {
    showPeakEvent(data.text);
    return;
  }

  if (data.type === 'summary') {
    showPeriodicSummary(data.text);
    return;
  }

  if (data.source === 'acey' && data.text) {
    setPrimaryText(data.text, data.tone);
    return;
  }
}

function connect() {
  try {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${window.location.host}/acey`);
  } catch (err) {
    console.error('Failed to init Acey socket', err);
    return;
  }

  streamOverview = new StreamOverview(session, {
    send: (payload) => {
      try {
        handleServerMessage({ data: payload });
      } catch (err) {
        console.warn('Local stream overview dispatch failed', err);
      }
    },
  }, config.isUltra);

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({
      type: 'init',
      sessionId: config.sessionId,
      userId: config.userId,
      userEmail: config.userEmail,
    }));
    ensureVisible();
  });

  ws.addEventListener('message', handleServerMessage);

  ws.addEventListener('close', () => {
    setPrimaryText('Lost connection to Acey… reconnecting.', 'playful');
    setTimeout(connect, 4000);
  });

  ws.addEventListener('error', (err) => {
    console.warn('Acey socket error', err);
  });
}

if (overlayEl && window.WebSocket) {
  connect();
}
