@echo off
echo Starting SECURE ngrok tunnel for Ollama...
echo Only Render servers can access this tunnel
echo.
ngrok http 11434 --cidr-allow 74.220.49.0/24 --cidr-allow 74.220.57.0/24
pause
