/**
 * Minimal Twitch chat bot with admin token for troubleshooting.
 *
 * Env vars:
 *   BOT_USERNAME        Twitch bot username (e.g., allinchatpokerbot)
 *   BOT_OAUTH_TOKEN     Twitch IRC token, e.g., oauth:xxxx
 *   TARGET_CHANNELS     Comma-separated channels to join (without #)
 *   ADMIN_TOKEN         Admin bearer token for calling backend admin endpoints
 *   BACKEND_URL         Backend base URL (default: https://all-in-chat-poker.fly.dev)
 */

const tmi = require('tmi.js');
const fetch = global.fetch;

const BOT_USERNAME = process.env.BOT_USERNAME || process.env.TWITCH_BOT_USERNAME || '';
const BOT_OAUTH_TOKEN = process.env.BOT_OAUTH_TOKEN || process.env.TWITCH_OAUTH_TOKEN || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const BACKEND_URL = (process.env.BACKEND_URL || 'https://all-in-chat-poker.fly.dev').replace(/\/$/, '');
const TARGET_CHANNELS = (process.env.TARGET_CHANNELS || process.env.TWITCH_CHANNEL || '')
  .split(',')
  .map(c => c.trim().toLowerCase())
  .filter(Boolean);

if (!BOT_USERNAME || !BOT_OAUTH_TOKEN) {
  console.error('BOT_USERNAME and BOT_OAUTH_TOKEN are required.');
  process.exit(1);
}

if (!TARGET_CHANNELS.length) {
  console.error('Set TARGET_CHANNELS (comma separated) to join channels.');
  process.exit(1);
}

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: BOT_USERNAME,
    password: BOT_OAUTH_TOKEN,
  },
  channels: TARGET_CHANNELS,
  connection: { reconnect: true, secure: true },
});

client.on('connected', (addr, port) => {
  console.log(`Connected to Twitch IRC at ${addr}:${port} as ${BOT_USERNAME}`);
});

client.on('disconnected', (reason) => {
  console.error('Disconnected from Twitch IRC', reason);
});

client.on('notice', (channel, msgid, message) => {
  console.warn('IRC notice', { channel, msgid, message });
});

const quips = {
  greeting: [
    "Hey {user}, welcome to the table!",
    "Yo {user}, seat's warm. Grab some chips.",
    "What's up {user}? Cards are hot tonight.",
  ],
  hype: [
    "LET'S GOOOO 🚀",
    "Jackpots in the air! ✨",
    "Big energy! Who's all-in? ♠️♥️",
  ],
  help: [
    "Try !ping, !status, or just say hi. Game commands still go to the dealer (!bet, !hit, etc.).",
    "I'm your railbird bot. I can check status, hype the table, and say hi.",
  ],
  thanks: [
    "Cheers {user}! Appreciate the vibes.",
    "You're the MVP, {user}.",
    "Respect, {user}.",
  ],
};

const rules = {
  poker: "Video poker: bet with !bet, hold cards, best hand wins after draw. Min bet applies, match the current bet to stay in. Payouts follow standard poker hand ranks.",
  blackjack: "Blackjack: bet with !bet, dealer hits to 17. Use !hit, !stand, !double, !split (pairs), !insurance (when dealer shows Ace). Closest to 21 without busting wins; blackjack pays 3:2 unless otherwise stated.",
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

client.on('message', async (channel, tags, message, self) => {
  if (self) return;
  const raw = message.trim();
  const content = raw.toLowerCase();
  const user = tags['display-name'] || tags.username || 'friend';

  // Commands
  if (content === '!ping') {
    client.say(channel, `pong, ${user}!`);
  }

  if (content === '!status') {
    const status = await callAdmin('/health');
    client.say(channel, status ? 'All systems green ✅' : 'Health check failed ❌');
  }

  if (content === '!bothelp') {
    client.say(channel, pick(quips.help));
  }

  if (content.startsWith('!rules')) {
    const parts = content.split(/\s+/);
    const mode = parts[1] || 'poker';
    const text = rules[mode] || `${rules.poker} | ${rules.blackjack}`;
    client.say(channel, text);
  }

  if (content === '!commands') {
    client.say(channel, "Commands: !ping, !status, !start, !startnow, !mode poker|blackjack, !rules [poker|blackjack], !leaderboard, !bothelp");
  }

  if (content === '!leaderboard') {
    const top = await callPublic('/leaderboard.json');
    if (top && Array.isArray(top) && top.length) {
      const snippet = top.slice(0, 3).map((e, i) => `#${i + 1} ${e.username}: ${e.totalWon}`).join(' | ');
      client.say(channel, `Top players: ${snippet}`);
    } else {
      client.say(channel, 'No leaderboard data yet.');
    }
  }

  // Game control (admin token required)
  if (content === '!start') {
    const ok = await callAdminPost('/admin/start-round', { startNow: false });
    client.say(channel, ok ? 'Betting window opened.' : 'Failed to open betting window.');
  }

  if (content === '!startnow') {
    const ok = await callAdminPost('/admin/start-round', { startNow: true });
    client.say(channel, ok ? 'Round starting now.' : 'Failed to start round.');
  }

  if (content.startsWith('!mode ')) {
    const mode = content.split(/\s+/)[1];
    if (!mode || !['poker', 'blackjack'].includes(mode)) {
      client.say(channel, 'Mode must be poker or blackjack.');
    } else {
      const ok = await callAdminPost('/admin/mode', { mode });
      client.say(channel, ok ? `Mode set to ${mode}.` : 'Failed to set mode.');
    }
  }

  // Greeting triggers
  if (/hello|hi bot|hey bot|sup bot/.test(content)) {
    client.say(channel, pick(quips.greeting).replace('{user}', user));
  }

  // Hype triggers
  if (/hype|pog|let's go|lets go|lfg/.test(content)) {
    client.say(channel, pick(quips.hype));
  }

  // Thanks triggers
  if (/thank/.test(content)) {
    client.say(channel, pick(quips.thanks).replace('{user}', user));
  }
});

async function callAdmin(path) {
  if (!ADMIN_TOKEN) return false;
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    return res.ok;
  } catch (e) {
    console.error('Admin call failed', e);
    return false;
  }
}

async function callPublic(path) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Public call failed', e);
    return null;
  }
}

async function callAdminPost(path, body) {
  if (!ADMIN_TOKEN) return false;
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });
    return res.ok;
  } catch (e) {
    console.error('Admin POST failed', e);
    return false;
  }
}

client.connect().catch(err => {
  console.error('Failed to connect to Twitch', err);
  process.exit(1);
});

console.log(`Bot starting as ${BOT_USERNAME}, channels: ${TARGET_CHANNELS.join(', ')}`);
