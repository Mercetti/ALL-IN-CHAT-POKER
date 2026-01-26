@echo off
echo Starting ngrok tunnel for Ollama...
echo This will expose your local Ollama to the internet
echo.
ngrok http 11434
pause
