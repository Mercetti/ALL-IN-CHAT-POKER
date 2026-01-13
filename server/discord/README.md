# Discord Application Setup Guide

## Environment Variables

Add these to your `.env` file:

```bash
# Discord Application Credentials (REQUIRED)
DISCORD_PUBLIC_KEY=your_discord_public_key_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=https://all-in-chat-poker.fly.dev/auth/discord/callback

# Application Configuration
APP_BASE_URL=https://all-in-chat-poker.fly.dev
NODE_ENV=production

# Security
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here

# Compliance (DO NOT CHANGE THESE)
DISCORD_COMPLIANCE_NO_REAL_MONEY=true
DISCORD_COMPLIANCE_ENTERTAINMENT_ONLY=true
DISCORD_COMPLIANCE_AI_NON_AUTHORITY=true
DISCORD_COMPLIANCE_NO_GAMBLING_TERMS=true
```

## Discord Developer Portal Setup

### 1. Application Configuration

In your Discord Developer Portal application:

**Interactions Endpoint URL:**
```
https://all-in-chat-poker.fly.dev/api/interactions
```

**Linked Roles URL:**
```
https://all-in-chat-poker.fly.dev/verify-user
```

**Terms of Service URL:**
```
https://all-in-chat-poker.fly.dev/terms
```

**Privacy Policy URL:**
```
https://all-in-chat-poker.fly.dev/privacy
```

### 2. OAuth2 Redirect URIs

Add this redirect URI:
```
https://all-in-chat-poker.fly.dev/auth/discord/callback
```

### 3. Bot Scopes (if adding bot features later)

Required scopes for Linked Roles:
- `identify`
- `role_connections.write`

### 4. Installation

Install the application to your Discord server with the required scopes.

## Testing the Integration

### 1. Health Check
```bash
curl -I https://all-in-chat-poker.fly.dev/health
```

### 2. Legal Routes (should load publicly)
```bash
curl https://all-in-chat-poker.fly.dev/terms
curl https://all-in-chat-poker.fly.dev/privacy
```

### 3. Discord Interactions
Use Discord's developer portal to test interactions or create a test command.

### 4. Linked Roles
1. Go to User Settings > Connected Accounts
2. Add your Discord application
3. Verify the metadata is returned correctly

## Security Notes

- All Discord requests are verified using Ed25519 signatures
- OAuth tokens are stored encrypted
- No chat logs or message content are stored
- Minimal user data is collected (Discord ID, username only)
- All responses are compliance-checked for gambling language

## Compliance Features

- Entertainment-only framing
- No real money language
- AI is non-authoritative
- Fictional currency only
- GDPR-compliant data deletion
- Discord policy compliant

## Database

The Discord system uses a separate SQLite database at `./data/discord.db` with minimal tables:
- `discord_users` - Basic user metadata
- `oauth_tokens` - Encrypted OAuth tokens

## Troubleshooting

### Common Issues

1. **"Missing Discord environment variables"**
   - Add all required DISCORD_* variables to your `.env` file

2. **"Invalid Discord signature"**
   - Check that your DISCORD_PUBLIC_KEY is correct
   - Ensure the interactions endpoint URL matches Discord portal

3. **"OAuth state mismatch"**
   - Clear browser cookies and try again
   - Check that redirect URI matches Discord portal exactly

4. **"Linked Roles not working"**
   - Verify the verify-user endpoint returns valid JSON
   - Check that metadata values are boolean only

## Production Deployment

1. Set `NODE_ENV=production`
2. Ensure all Discord URLs use HTTPS
3. Configure proper session secrets
4. Test all endpoints before going live
5. Monitor Discord developer portal for any warnings

## Support

For Discord integration issues:
1. Check Discord Developer Portal documentation
2. Verify all environment variables are set
3. Check server logs for error messages
4. Test each endpoint individually

The Discord integration is designed to be safe, compliant, and ready for Discord's application review process.
