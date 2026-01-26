@echo off
echo Starting basic ngrok tunnel for Ollama...
echo This will work with your existing Ollama setup
echo.
ngrok http 11434 --cidr-allow 74.220.49.0/24 --cidr-allow 74.220.57.0/24
pause
