/**
 * Lightweight Twitch OAuth helper to obtain a chat token for your bot account.
 *
 * Prereqs: Node 18+, your Twitch app Client ID/Secret, and a redirect URI
 * set to http://localhost:3000/auth/twitch/callback (or adjust PORT below).
 *
 * Run:
 *   CLIENT_ID=your_client_id CLIENT_SECRET=your_client_secret node scripts/get-twitch-token.js
 *
 * Then open the printed auth URL, approve as the bot account, and this script
 * will exchange the code and print the access token (keep the oauth: prefix).
 * Scopes: chat:read chat:edit
 */

const http = require('http');
const { URL } = require('url');

const CLIENT_ID = process.env.CLIENT_ID || process.env.TWITCH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET || '';
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = 'localhost';
const REDIRECT_URI = `http://${HOST}:${PORT}/auth/twitch/callback`;
const SCOPES = ['chat:read', 'chat:edit'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing CLIENT_ID / CLIENT_SECRET env vars.');
  process.exit(1);
}

const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES.join(' '));
authUrl.searchParams.set('force_verify', 'true');

console.log('Open this URL in your browser (log in as the BOT account):');
console.log(authUrl.toString());

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/auth/twitch/callback')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400);
    res.end('Missing code');
    return;
  }
  try {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(data.message || `HTTP ${tokenRes.status}`);
    }
    const accessToken = data.access_token;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Token received. You can close this tab.');
    console.log('\nUse this as BOT_OAUTH_TOKEN (keep the oauth: prefix):');
    console.log(`oauth:${accessToken}`);
    console.log('\nScopes:', data.scope);
  } catch (err) {
    res.writeHead(500);
    res.end('Token exchange failed');
    console.error('Token exchange failed:', err.message);
  } finally {
    setTimeout(() => server.close(), 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on http://${HOST}:${PORT} for the OAuth callback...`);
});
