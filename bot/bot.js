/**
 * Twitch chat bot with light game awareness.
 *
 * Commands:
 *  !ping, !status, !commands, !leaderboard, !join, !bet <amt>,
 *  !start, !startnow, !mode poker|blackjack, !seats, !ready (tournaments)
 *
 * Env:
 *  BOT_USERNAME, BOT                                                                                                                                             _OAUTH_TOKEN, TARGET_CHANNELS, BOT_JOIN_SECRET,
 *  ADMIN_TOKEN, BACKEND_URL (defaults to https://all-in-chat-poker.fly.dev)
 */

const tmi = require('tmi.js');
const {
  Client: DiscordClient,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits,
} = require('discord.js');
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
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const DISCORD_ALLOWED_CHANNELS = (process.env.DISCORD_ALLOWED_CHANNELS || '')
  .split(',')
  .map(c => c.trim())
  .filter(Boolean);
const DISCORD_OPS_CHANNEL_ID = process.env.DISCORD_OPS_CHANNEL_ID || '';
const DISCORD_RESET_DM = process.env.DISCORD_RESET_DM || 'true'; // whether to DM tokens when not delivered via webhook
const DISCORD_ADMIN_USERS = (process.env.DISCORD_ADMIN_USERS || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);
const DEPLOY_WEBHOOK_URL = process.env.DEPLOY_WEBHOOK_URL || '';

let MIN_BET_CACHE = null;
const stateCache = {};
const STATE_TTL_MS = 5000;

if (!BOT_USERNAME || !BOT_OAUTH_TOKEN) {
  console.error('BOT_USERNAME and BOT_OAUTH_TOKEN are required.');
  process.exit(1);
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

async function fetchState(channel) {
  if (!BOT_JOIN_SECRET) return null;
  const now = Date.now();
  const cached = stateCache[channel];
  if (cached && now - cached.at < STATE_TTL_MS) return cached.data;
  try {
    const url = `${BACKEND_URL}/bot/state?secret=${encodeURIComponent(BOT_JOIN_SECRET)}&channel=${encodeURIComponent(channel)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    stateCache[channel] = { at: now, data };
    return data;
  } catch (e) {
    console.error('State fetch failed', e);
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

async function callAdmin(path) {
  if (!ADMIN_TOKEN) return false;
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    return res.ok;
  } catch (e) {
    console.error('Admin call failed', e);
    return false;
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

async function callAdminJson(path, options = {}) {
  if (!ADMIN_TOKEN) throw new Error('ADMIN_TOKEN missing for admin call');
  const { method = 'GET', body } = options;
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Admin call failed ${res.status}`);
  return res.json();
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

async function callChatBet(login, amount, channel) {
  if (!BOT_JOIN_SECRET) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/chat/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, amount, secret: BOT_JOIN_SECRET, channel }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Chat bet failed', e);
    return null;
  }
}

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
  studyTips: [
    "Break it down: 25-50 minute sprints, 5-10 minute breaks. One topic per sprint.",
    "Teach it aloud. If you can explain it simply, you know it.",
    "Flashcards > rereading. Active recall beats passive review.",
    "Sleep & water matter. A rested brain remembers more.",
    "Practice problems over notes. Apply, don't just read.",
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
  if (mood <= -2 && fallbackArr && fallbackArr.length) return pick(fallbackArr);
  return pick(quipsArr);
}

function isDiscordAdmin(interaction) {
  if (!interaction) return false;
  const userId = interaction.user?.id;
  if (userId && DISCORD_ADMIN_USERS.includes(userId)) return true;
  const hasRole = interaction.memberPermissions?.has?.(PermissionFlagsBits.Administrator);
  return !!hasRole;
}

// ---- Discord helper (optional) ----
const discordCommands = [
  { name: 'ping', description: 'Check bot latency' },
  { name: 'status', description: 'Show game status links' },
  { name: 'help', description: 'Show bot commands' },
  { name: 'join', description: 'How to join the table' },
  { name: 'study', description: 'Get a quick study tip' },
  {
    name: 'tutor',
    description: 'Ask a short study question',
    options: [
      {
        name: 'question',
        description: 'Your study question (math/CS/general)',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'resetme',
    description: 'DM a password reset token for a site login',
    options: [
      {
        name: 'login',
        description: 'Site username to reset',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'ops',
    description: 'Post ops summary (admin)',
  },
  {
    name: 'snapshot',
    description: 'Overlay snapshot for a channel (admin)',
    options: [
      {
        name: 'channel',
        description: 'Channel login',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'security',
    description: 'Run security diagnosis (admin)',
  },
  {
    name: 'deploy',
    description: 'Trigger a deploy webhook (admin)',
    options: [
      {
        name: 'env',
        description: 'Environment (staging|prod)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'profile',
    description: 'Look up a player profile (admin)',
    options: [
      {
        name: 'login',
        description: 'Twitch login',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'refresh',
    description: 'Refresh overlay snapshot/cache (admin)',
    options: [
      {
        name: 'channel',
        description: 'Channel login',
        type: 3,
        required: false,
      },
    ],
  },
];

function isAllowedDiscordChannel(channelId) {
  if (!DISCORD_ALLOWED_CHANNELS.length) return true;
  return DISCORD_ALLOWED_CHANNELS.includes(channelId);
}

async function registerDiscordCommands() {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) return;
  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: discordCommands });
    console.log('Discord slash commands registered');
  } catch (err) {
    console.warn('Discord command registration failed', err.message);
  }
}

function startDiscordBot() {
  if (!DISCORD_BOT_TOKEN) return;
  const client = new DiscordClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const replyCooldownMs = 8000;
  const lastDiscordReply = new Map();
  const sendToOps = async (content) => {
    if (!DISCORD_OPS_CHANNEL_ID) return null;
    try {
      const channel = await client.channels.fetch(DISCORD_OPS_CHANNEL_ID);
      if (!channel) return null;
      return channel.send({ content });
    } catch (err) {
      console.warn('Failed to post to ops channel', err.message);
      return null;
    }
  };

  const canReply = (userId) => {
    const now = Date.now();
    const last = lastDiscordReply.get(userId) || 0;
    if (now - last > replyCooldownMs) {
      lastDiscordReply.set(userId, now);
      return true;
    }
    return false;
  };

  client.on('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    if (commandName === 'ping') return interaction.reply({ content: 'Pong!', ephemeral: true });
    if (commandName === 'status') {
      const msg = `Overlay: ${BACKEND_URL}/obs-overlay.html | Admin: ${BACKEND_URL}/admin2.html | Editor: ${BACKEND_URL}/overlay-editor-enhanced.html`;
      return interaction.reply({ content: msg, ephemeral: true });
    }
    if (commandName === 'help') {
      return interaction.reply({ content: 'Commands: /ping /status /join /help | In chat: !join, !bet <amt>, !rules', ephemeral: true });
    }
    if (commandName === 'join') {
      return interaction.reply({ content: 'To join: in Twitch chat type !join or !bet <amount>. Use !rules poker|blackjack for game rules.', ephemeral: true });
    }
    if (commandName === 'study') {
      return interaction.reply({ content: pick(quips.studyTips) });
    }
    if (commandName === 'tutor') {
      const q = interaction.options.getString('question', true);
      const short = q.length > 200 ? `${q.slice(0, 200)}...` : q;
      return interaction.reply({
        content: `I’ll keep it brief.\nQuestion: ${short}\n\nTips: Break it down, define terms, outline steps, and try a practice example. (AI answer stub—wire to a tutor API/model if you want real solutions.)`,
        ephemeral: true,
      });
    }
    if (commandName === 'resetme') {
      const login = (interaction.options.getString('login', true) || '').trim().toLowerCase();
      if (!login) return interaction.reply({ content: 'Login required.', ephemeral: true });
      try {
        const resp = await fetch(`${BACKEND_URL}/auth/reset/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          return interaction.reply({ content: `Reset failed: ${data?.error || resp.status}`, ephemeral: true });
        }
        const delivered = !!data.delivered;
        const token = data.token;
        let dmOk = false;
        if (DISCORD_RESET_DM !== 'false' && !delivered && token) {
          try {
            await interaction.user.send(`Password reset token for ${login}: ${token} (valid ~15 min)`);
            dmOk = true;
          } catch (err) {
            dmOk = false;
          }
        }
        const parts = [];
        if (delivered) parts.push('Reset link/token delivered via configured channel.');
        if (token && dmOk) parts.push('Token sent via DM.');
        if (token && !dmOk && !delivered) parts.push(`Token: ${token}`);
        if (!delivered && !token) parts.push('If the account exists, a reset token was created.');
        return interaction.reply({ content: parts.join(' '), ephemeral: true });
      } catch (err) {
        console.error('resetme failed', err);
        return interaction.reply({ content: 'Reset request failed.', ephemeral: true });
      }
    }

    // Admin-only commands below
    if (['ops', 'snapshot', 'security', 'deploy', 'profile', 'refresh'].includes(commandName)) {
      if (!isDiscordAdmin(interaction)) {
        return interaction.reply({ content: 'Admin only.', ephemeral: true });
      }
    }

    if (commandName === 'ops') {
      try {
        const data = await callAdminJson('/admin/ops-summary');
        const latestSynthetic = data.synthetic?.length ? data.synthetic[data.synthetic.length - 1] : null;
        const summary = [
          `Bot: ${data.bot?.connected ? 'online' : 'offline'} (${(data.bot?.channels || []).length} channels)`,
          `Errors(last20): ${data.errors?.length || 0}, Slow(last20): ${data.slow?.length || 0}`,
          latestSynthetic ? `Synthetic: ${latestSynthetic.status || 'n/a'} at ${latestSynthetic.at || 'n/a'}` : 'Synthetic: n/a',
          `Next AI test: ${data.scheduler?.nextAiTest || 'midnight CST'}`,
          `DB backup: ${data.db?.lastBackup ? new Date(data.db.lastBackup.at || data.db.lastBackup).toLocaleString() : 'n/a'}`,
        ].join('\n');
        await interaction.reply({ content: `Ops summary:\n${summary}`, ephemeral: true });
        await sendToOps(`Ops summary requested by ${interaction.user.tag}\n${summary}`);
      } catch (err) {
        console.error('Ops summary failed', err);
        return interaction.reply({ content: 'Ops summary failed.', ephemeral: true });
      }
    }

    if (commandName === 'snapshot') {
      const channel = interaction.options.getString('channel') || TARGET_CHANNELS[0] || 'allinchatpoker';
      try {
        const snap = await callAdminJson(`/admin/overlay-snapshot?channel=${encodeURIComponent(channel)}`);
        const meta = snap?.snapshot || {};
        const info = [
          `Channel: ${channel}`,
          `Mode: ${meta.mode || 'n/a'}`,
          `Betting: ${meta.bettingOpen ? 'open' : 'closed'}`,
          `Players: ${Array.isArray(meta.players) ? meta.players.length : 0}`,
          `Waiting: ${Array.isArray(meta.waiting) ? meta.waiting.length : 0}`,
          `Pot: ${meta.pot || 0}, Current bet: ${meta.currentBet || 0}`,
        ].join('\n');
        await interaction.reply({ content: `Overlay snapshot:\n${info}`, ephemeral: true });
        await sendToOps(`Overlay snapshot (${channel}) by ${interaction.user.tag}\n${info}`);
      } catch (err) {
        console.error('Snapshot failed', err);
        return interaction.reply({ content: 'Snapshot failed.', ephemeral: true });
      }
    }

    if (commandName === 'security') {
      try {
        const res = await callAdminJson('/admin/security-diagnose', { method: 'POST' });
        const diag = res?.diagnosis || 'No diagnosis';
        await interaction.reply({ content: `Security review:\n${diag}`, ephemeral: true });
        await sendToOps(`Security review by ${interaction.user.tag}\n${diag}`);
      } catch (err) {
        console.error('Security diagnose failed', err);
        return interaction.reply({ content: 'Security diagnose failed.', ephemeral: true });
      }
    }

    if (commandName === 'deploy') {
      const env = (interaction.options.getString('env') || 'prod').toLowerCase();
      if (!DEPLOY_WEBHOOK_URL) {
        return interaction.reply({ content: 'DEPLOY_WEBHOOK_URL not set.', ephemeral: true });
      }
      try {
        await fetch(DEPLOY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ env, actor: interaction.user.tag, at: new Date().toISOString() }),
        });
        await interaction.reply({ content: `Deploy triggered for ${env}.`, ephemeral: true });
        await sendToOps(`Deploy triggered (${env}) by ${interaction.user.tag}`);
      } catch (err) {
        console.error('Deploy webhook failed', err);
        return interaction.reply({ content: 'Deploy webhook failed.', ephemeral: true });
      }
    }

    if (commandName === 'profile') {
      const login = interaction.options.getString('login', true).toLowerCase();
      try {
        const profile = await callAdminJson(`/admin/profile/${encodeURIComponent(login)}`);
        const label = profile?.display_name || profile?.login || login;
        const link = `${BACKEND_URL}/profile-enhanced.html?user=${encodeURIComponent(login)}`;
        const text = `Profile: ${label}\nBalance: ${profile?.chips || profile?.balance || 'n/a'}\nLink: ${link}`;
        await interaction.reply({ content: text, ephemeral: true });
      } catch (err) {
        console.error('Profile lookup failed', err);
        return interaction.reply({ content: 'Profile not found.', ephemeral: true });
      }
    }

    if (commandName === 'refresh') {
      const channel = interaction.options.getString('channel') || TARGET_CHANNELS[0] || 'allinchatpoker';
      try {
        await callAdminJson(`/admin/overlay-snapshot?channel=${encodeURIComponent(channel)}`);
        await interaction.reply({ content: `Overlay snapshot refreshed for ${channel}.`, ephemeral: true });
        await sendToOps(`Overlay snapshot refreshed for ${channel} by ${interaction.user.tag}`);
      } catch (err) {
        console.error('Overlay refresh failed', err);
        return interaction.reply({ content: 'Overlay refresh failed.', ephemeral: true });
      }
    }
  });

  client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (!isAllowedDiscordChannel(msg.channelId)) return;
    const lower = msg.content.toLowerCase();
    if (!canReply(msg.author.id)) return;
    if (/!ping/.test(lower)) {
      return msg.reply('pong');
    }
    if (/help|how.*join|join.*table/.test(lower)) {
      return msg.reply('Join from Twitch chat with !join or !bet <amount>. Need rules? Try !rules poker or blackjack in chat.');
    }
    if (/status|overlay|admin/.test(lower)) {
      return msg.reply(`Overlay: ${BACKEND_URL}/obs-overlay.html | Admin: ${BACKEND_URL}/admin2.html | Editor: ${BACKEND_URL}/overlay-editor-enhanced.html`);
    }
    if (/study|homework|test|exam/.test(lower)) {
      return msg.reply(pick(quips.studyTips));
    }
  });

  registerDiscordCommands().catch(() => {});
  client.login(DISCORD_BOT_TOKEN).catch(err => console.error('Discord login failed', err.message));
}

async function bootstrap() {
  const backendChannels = await getBackendChannels();
  const channels = Array.from(new Set([...TARGET_CHANNELS, ...backendChannels])).filter(Boolean);
  if (!channels.length) {
    console.warn('No channels configured to join. Set TARGET_CHANNELS or backend bot channels.');
  }

  client = new tmi.Client({
    options: { debug: true },
    identity: { username: BOT_USERNAME, password: BOT_OAUTH_TOKEN },
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
      const state = await fetchState(channel);
      if (!status && !state) {
        client.say(channel, 'Status check failed.');
      } else {
        const mode = state?.mode || 'unknown';
        const open = state?.bettingOpen ? 'betting open' : state?.roundInProgress ? 'round live' : 'idle';
        const pot = state?.pot || 0;
        const cur = state?.currentBet || 0;
        const seats = state?.maxSeats ? `${state.seated || 0}/${state.maxSeats}` : `${state?.players?.length || 0}`;
        const waiting = state?.waiting ? state.waiting.length : 0;
        const ready = state?.readyCount || 0;
        const req = state?.requiredReady || 0;
        const blinds = state?.blinds ? ` | Blinds ${state.blinds.small}/${state.blinds.big}` : '';
        const readyPart = req ? `, ready ${ready}/${req}` : '';
        const msg = `Status: ${mode}, ${open}. Pot ${pot}, current bet ${cur}. Seats ${seats}, waiting ${waiting}${readyPart}${blinds}`;
        client.say(channel, msg);
      }
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
      client.say(channel, "Commands: !ping, !status, !start, !startnow, !mode poker|blackjack, !rules [poker|blackjack], !leaderboard, !bothelp, !seats, !ready");
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

    if (content === '!seats') {
      const state = await fetchState(channel);
      if (!state) {
        client.say(channel, 'No state yet.');
      } else {
        const seats = state.maxSeats ? `${state.seated || 0}/${state.maxSeats}` : `${state.players?.length || 0}`;
        const open = state.maxSeats ? Math.max(0, state.maxSeats - (state.seated || 0)) : 0;
        const waiting = state.waiting && state.waiting.length ? ` | Waiting: ${state.waiting.join(', ').slice(0, 120)}` : '';
        client.say(channel, `Seats: ${seats} (${open} open)${waiting}`);
      }
    }

    if (content === '!ready') {
      const state = await fetchState(channel);
      if (!state || !state.tournament) {
        client.say(channel, 'Ready check is only for tournament tables.');
      } else {
        const ready = state.readyCount || 0;
        const req = state.requiredReady || 0;
        const needed = Math.max(0, req - ready);
        const missing = state.requiredSeats && state.requiredSeats.length
          ? state.requiredSeats.filter(u => !(state.players || []).some(p => p.login === u))
          : [];
        const missingText = missing.length ? ` | Missing: ${missing.join(', ').slice(0, 100)}` : '';
        const needText = needed ? ` (need ${needed} more)` : '';
        client.say(channel, `Ready: ${ready}/${req}${needText}${missingText}`);
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
      const state = await fetchState(channel);
      if (state?.bettingOpen) {
        client.say(channel, 'Betting is already open.');
        return;
      }
      if (state?.roundInProgress) {
        client.say(channel, 'A round is already in progress.');
        return;
      }
      const ok = await callAdminPost('/admin/start-round', { startNow: false, channel });
      client.say(channel, ok ? 'Betting window opened.' : 'Failed to open betting window.');
    }

    if (content === '!startnow') {
      const state = await fetchState(channel);
      if (state?.roundInProgress) {
        client.say(channel, 'Round already in progress.');
        return;
      }
      const ok = await callAdminPost('/admin/start-round', { startNow: true, channel });
      client.say(channel, ok ? 'Round starting now.' : 'Failed to start round.');
    }

    if (content.startsWith('!mode ')) {
      const mode = content.split(/\s+/)[1];
      if (!mode || !['poker', 'blackjack'].includes(mode)) {
        client.say(channel, 'Mode must be poker or blackjack.');
      } else {
        const ok = await callAdminPost('/admin/mode', { mode, channel });
        client.say(channel, ok ? `Mode set to ${mode}.` : 'Failed to set mode.');
      }
    }

    // Greeting / hype / mentions
    if (/hello|hi bot|hey bot|sup bot/.test(content)) {
      client.say(channel, pickMood(quips.greeting, mood, quips.reassure).replace('{user}', user));
    }

    if (/hype|pog|let's go|lets go|lfg/.test(content)) {
      client.say(channel, pickMood(quips.hype, mood, quips.comeback));
    }

    if (/thank/.test(content)) {
      client.say(channel, pick(quips.thanks).replace('{user}', user));
    }

    if (raw.toLowerCase().includes(`@${BOT_NAME_LOWER}`) || raw.toLowerCase().includes(BOT_NAME_LOWER)) {
      client.say(channel, pickMood(quips.mention, mood, quips.reassure).replace('{user}', user));
    } else if (raw.endsWith('?') && shouldReply(channel) && mood > -3) {
      client.say(channel, pickMood(quips.curious, mood, quips.reassure).replace('{user}', user));
    } else if (/cool|awesome|bot/.test(content) && shouldReply(channel) && mood > -3) {
      client.say(channel, pickMood(quips.vibes, mood, quips.comeback));
    }
  });

  await client.connect();
  // Fire up the Discord bot (optional)
  startDiscordBot();
}

bootstrap().catch(err => {
  console.error('Bot bootstrap failed', err);
  process.exit(1);
});
