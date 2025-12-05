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
  identity: {
    username: BOT_USERNAME,
    password: BOT_OAUTH_TOKEN,
  },
  channels: TARGET_CHANNELS,
  connection: { reconnect: true, secure: true },
});

client.on('message', async (channel, tags, message, self) => {
  if (self) return;
  const content = message.trim().toLowerCase();

  if (content === '!ping') {
    client.say(channel, 'pong');
  }

  if (content === '!status') {
    const status = await callAdmin('/health');
    client.say(channel, status ? 'OK' : 'Health check failed');
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

client.connect().catch(err => {
  console.error('Failed to connect to Twitch', err);
  process.exit(1);
});

console.log(`Bot starting as ${BOT_USERNAME}, channels: ${TARGET_CHANNELS.join(', ')}`);
