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
const BOT_NAME_LOWER = BOT_USERNAME.toLowerCase();
const BOT_JOIN_SECRET = process.env.BOT_JOIN_SECRET || '';
let MIN_BET_CACHE = null;

if (!BOT_USERNAME || !BOT_OAUTH_TOKEN) {
  console.error('BOT_USERNAME and BOT_OAUTH_TOKEN are required.');
  process.exit(1);
}

if (!TARGET_CHANNELS.length) {
  console.error('Set TARGET_CHANNELS (comma separated) to join channels.');
}

let client = null;

async function getBackendChannels() {
  if (!BOT_JOIN_SECRET) return [];
  try {
    const url = `${BACKEND_URL}/bot/channels?secret=${encodeURIComponent(BOT_JOIN_SECRET)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.channels) ? data.channels : [];
  } catch (e) {
    console.error('Failed to fetch backend bot channels', e);
    return [];
  }
}

async function bootstrap() {
  const backendChannels = await getBackendChannels();
  const channels = Array.from(new Set([...TARGET_CHANNELS, ...backendChannels])).filter(Boolean);
  if (!channels.length) {
    console.warn('No channels configured to join. Set TARGET_CHANNELS or backend bot channels.');
  }

  client = new tmi.Client({
    options: { debug: true },
    identity: {
      username: BOT_USERNAME,
      password: BOT_OAUTH_TOKEN,
    },
    channels,
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
  mention: [
    "Yo {user}, I'm here! Need a status check?",
    "Sup {user}? I'm watching the table.",
    "Hey {user}, bot at your service.",
    "What's good, {user}? Want me to start a round?",
    "Hey {user}, I'm all ears. Need chips or hype?",
    "Howdy {user}! Dealer bot online.",
  ],
  curious: [
    "Good question, {user}. Mostly, I keep the table flowing and hype high.",
    "I don't have all the answers, {user}, but I can start a round or drop rules.",
    "I'm just a humble bot, {user}, but I can nudge the dealer and cheer you on.",
  ],
  vibes: [
    "Feeling good vibes. Keep 'em coming.",
    "Stacking chips and good energy.",
    "Bots can't feel luck, but I'm sensing a heater.",
  ],
  reassure: [
    "Tough beats happen. Fresh hand coming, {user}.",
    "Shake it off, {user}. Next hand is yours.",
    "Cold streaks flip fast. Stick around, {user}.",
  ],
  comeback: [
    "Chip up, {user}. Small bets build stacks.",
    "Smart plays > luck. You've got this, {user}.",
    "Patience pays. Wait for your spot, {user}.",
  ],
};

const rules = {
  poker: "Video poker: bet with !bet, hold cards, best hand wins after draw. Min bet applies, match the current bet to stay in. Payouts follow standard poker hand ranks.",
  blackjack: "Blackjack: bet with !bet, dealer hits to 17. Use !hit, !stand, !double, !split (pairs), !insurance (when dealer shows Ace). Closest to 21 without busting wins; blackjack pays 3:2 unless otherwise stated.",
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const replyCooldownMs = 8000;
const lastReplyAt = {};
const channelMood = {};
const MAX_MOOD = 5;

function shouldReply(channel) {
  const now = Date.now();
  if (!lastReplyAt[channel] || now - lastReplyAt[channel] > replyCooldownMs) {
    lastReplyAt[channel] = now;
    return true;
  }
  return false;
}

function updateMood(channel, text) {
  const lower = text.toLowerCase();
  let delta = 0;
  if (/(win|gg|nice|good|let's go|lets go|lfg|hype|pog)/.test(lower)) delta += 1;
  if (/(rip|bust|lost|rigged|mad|angry|trash|bad|hate)/.test(lower)) delta -= 1;
  if (/(all-in|all in)/.test(lower)) delta += 1;
  const current = channelMood[channel] || 0;
  channelMood[channel] = Math.max(-MAX_MOOD, Math.min(MAX_MOOD, current + delta));
}

function getMood(channel) {
  return channelMood[channel] || 0;
}

function pickMood(quipsArr, mood, fallbackArr) {
  if (mood <= -2 && fallbackArr && fallbackArr.length) {
    return pick(fallbackArr);
  }
  return pick(quipsArr);
}

client.on('message', async (channel, tags, message, self) => {
  if (self) return;
  const raw = message.trim();
  const content = raw.toLowerCase();
  const user = tags['display-name'] || tags.username || 'friend';
  updateMood(channel, content);
  const mood = getMood(channel);

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

  if (content === '!join') {
    const login = (tags.username || '').toLowerCase();
    const minBet = await getMinBet();
    const ok = await callChatBet(login, minBet, channel);
    if (ok?.success) {
      client.say(channel, `${login} joined with ${minBet} chips.`);
    } else {
      client.say(channel, 'Join failed. Betting may be closed or invalid bet.');
    }
  }

  const betMatch = content.match(/^!bet\s+(\d+)/);
  if (betMatch) {
    const amount = parseInt(betMatch[1], 10);
    const login = (tags.username || '').toLowerCase();
    const ok = await callChatBet(login, amount, channel);
    if (ok?.success) {
      client.say(channel, `${login} bet ${amount}. Balance: ${ok.balance}`);
    } else {
      client.say(channel, 'Bet failed. Check amount or betting window.');
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
    client.say(channel, pickMood(quips.greeting, mood, quips.reassure).replace('{user}', user));
  }

  // Hype triggers
  if (/hype|pog|let's go|lets go|lfg/.test(content)) {
    client.say(channel, pickMood(quips.hype, mood, quips.comeback));
  }

  // Thanks triggers
  if (/thank/.test(content)) {
    client.say(channel, pick(quips.thanks).replace('{user}', user));
  }

  // Mention trigger
  if (raw.toLowerCase().includes(`@${BOT_NAME_LOWER}`) || raw.toLowerCase().includes(BOT_NAME_LOWER)) {
    client.say(channel, pickMood(quips.mention, mood, quips.reassure).replace('{user}', user));
  } else if (raw.endsWith('?') && shouldReply(channel) && mood > -3) {
    client.say(channel, pickMood(quips.curious, mood, quips.reassure).replace('{user}', user));
  } else if (/cool|awesome|bot/.test(content) && shouldReply(channel) && mood > -3) {
    client.say(channel, pickMood(quips.vibes, mood, quips.comeback));
  }
});

  await client.connect();
}

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

async function getMinBet() {
  if (MIN_BET_CACHE !== null) return MIN_BET_CACHE;
  try {
    const res = await fetch(`${BACKEND_URL}/public-config.json`);
    if (res.ok) {
      const cfg = await res.json();
      MIN_BET_CACHE = cfg?.minBet || 10;
      return MIN_BET_CACHE;
    }
  } catch (e) {
    console.error('Failed to load min bet', e);
  }
  MIN_BET_CACHE = 10;
  return MIN_BET_CACHE;
}

async function callChatBet(login, amount, channel) {
  if (!BOT_JOIN_SECRET) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/chat/bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, amount, secret: BOT_JOIN_SECRET, channel }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Chat bet failed', e);
    return null;
  }
}

bootstrap().catch(err => {
  console.error('Bot bootstrap failed', err);
  process.exit(1);
});

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
