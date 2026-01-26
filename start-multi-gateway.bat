@echo off
echo Starting Multiple AI Gateway Tunnels...
echo.
echo Each tunnel optimized for specific models:
echo - llama2-tunnel: General chat, creative tasks
echo - qwen-tunnel: Fast responses, lightweight tasks  
echo - deepseek-tunnel: Code generation, technical tasks
echo - llama3-tunnel: Complex reasoning, analysis
echo.
echo Starting tunnels in separate windows...
start "llama2-gateway" cmd /c "ngrok http 11434 --subdomain llama2-ai-gateway"
timeout /t 2
start "qwen-gateway" cmd /c "ngrok http 11434 --subdomain qwen-ai-gateway"  
timeout /t 2
start "deepseek-gateway" cmd /c "ngrok http 11434 --subdomain deepseek-ai-gateway"
timeout /t 2
start "llama3-gateway" cmd /c "ngrok http 11434 --subdomain llama3-ai-gateway"
echo.
echo All AI Gateway tunnels started!
echo Check each window for the public URLs
pause
