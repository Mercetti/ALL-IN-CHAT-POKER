@echo off
echo Starting ngrok AI Gateway for Ollama...
echo.
echo AI Gateway Features:
echo - LLM-optimized tunneling
echo - Built-in rate limiting
echo - Request monitoring
echo - Enhanced security
echo.
ngrok http 11434 --cidr-allow 74.220.49.0/24 --cidr-allow 74.220.57.0/24 --log-level info
pause
