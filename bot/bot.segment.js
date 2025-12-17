/**
 * Minimal Twitch chat bot with admin token for troubleshooting.
 *
 * Env vars:
 *   BOT_USERNAME        Twitch bot username (e.g., allinchatpokerbot)
 *   BOT_OAUTH_TOKEN     Twitch IRC token, e.g., oauth:xxxx
 *   TARGET_CHANNELS     Comma-separated channels to join (without #)
 *   BOT_JOIN_SECRET     Shared secret for backend-driven joins/bets
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
