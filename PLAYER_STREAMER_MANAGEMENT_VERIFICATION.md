# Player/Streamer Management Verification

## Quick Manual Tests

### Prerequisites
- Start server: `node server.js`
- Backend: http://localhost:8080
- Frontend: http://localhost:5173

### 1. Register a new player
```bash
curl -X POST http://localhost:8080/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "login":"testplayer",
    "password":"TestPass123!",
    "email":"testplayer@example.com"
  }'
# Expected: { success:true, token:"...", profile:{ login:"testplayer", ... } }
```

### 2. Login player
```bash
curl -X POST http://localhost:8080/players/login \
  -H "Content-Type: application/json" \
  -d '{
    "login":"testplayer",
    "password":"TestPass123!"
  }'
# Expected: { success:true, token:"...", profile:{ ... } }
```

### 3. Get player profile (requires token)
```bash
TOKEN="<token_from_login>"
curl -X GET http://localhost:8080/players/me \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success:true, profile:{ login:"testplayer", twitchLinked:false, discordLinked:false } }
```

### 4. Update player profile
```bash
curl -X PUT http://localhost:8080/players/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name":"Test Player",
    "email":"updated@example.com"
  }'
# Expected: { success:true, profile:{ display_name:"Test Player", email:"updated@example.com" } }
```

### 5. Change password
```bash
curl -X PUT http://localhost:8080/players/me/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword":"TestPass123!",
    "newPassword":"NewPass123!"
  }'
# Expected: { success:true, profile:{ ... } }
```

### 6. Link Twitch account (requires Twitch access token)
```bash
# Obtain a Twitch access token via OAuth2 flow first
TWITCH_TOKEN="<twitch_access_token>"
curl -X POST http://localhost:8080/players/link-twitch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"'$TWITCH_TOKEN'"}'
# Expected: { success:true, profile:{ twitchLinked:true } }
```

### 7. Unlink Twitch account
```bash
curl -X POST http://localhost:8080/players/unlink-twitch \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success:true, profile:{ twitchLinked:false } }
```

## Admin Moderation Tests

### 8. Login as admin (mercetti)
```bash
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -c admin-cookies.txt \
  -d '{
    "username":"mercetti",
    "password":"Hype420!Hype"
  }'
# Expected: { success:true, user:{ login:"mercetti", role:"owner" } }
```

### 9. List all players
```bash
curl -X GET http://localhost:8080/admin/players \
  -b admin-cookies.txt
# Expected: { success:true, players:[ ... ] }
```

### 10. Ban a player
```bash
curl -X POST http://localhost:8080/admin/players/testplayer/ban \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"reason":"Test ban"}'
# Expected: { success:true, player:{ login:"testplayer", role:"banned" } }
```

### 11. Verify banned player cannot login
```bash
curl -X POST http://localhost:8080/players/login \
  -H "Content-Type: application/json" \
  -d '{
    "login":"testplayer",
    "password":"NewPass123!"
  }'
# Expected: 401 with invalid_credentials
```

### 12. Unban a player
```bash
curl -X POST http://localhost:8080/admin/players/testplayer/unban \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"reason":"Test unban"}'
# Expected: { success:true, player:{ login:"testplayer", role:"player" } }
```

### 13. Verify unbanned player can login
```bash
curl -X POST http://localhost:8080/players/login \
  -H "Content-Type: application/json" \
  -d '{
    "login":"testplayer",
    "password":"NewPass123!"
  }'
# Expected: 200 with success:true
```

## Automated Test Run
```bash
npm test -- test/players.test.js
```

## UI Integration
- Registration form should POST to `/players/register` with login/password/email
- Login form should POST to `/players/login` and store returned JWT
- Profile page should GET `/players/me` with Authorization header
- Profile updates should PUT to `/players/me`
- Password change should PUT to `/players/me/password`
- Twitch linking should POST to `/players/link-twitch` with OAuth access token
- Admin moderation UI should call `/admin/players` (list), `/admin/players/:login/ban`, and `/admin/players/:login/unban`

## Security Checks
- Passwords are hashed with scrypt+salt
- Player endpoints require valid JWT
- Admin moderation endpoints require admin JWT
- Role field controls access (player vs banned)
- Audit logs are written for admin actions
- Twitch linking validates token with Twitch API
