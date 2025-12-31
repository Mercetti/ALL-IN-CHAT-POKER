@echo off
echo Testing mercetti login...
curl -s -X POST "https://all-in-chat-poker.fly.dev/auth/login" -H "Content-Type: application/json" -d "{\"login\":\"mercetti\",\"password\":\"mercetti123\"}"
echo.
