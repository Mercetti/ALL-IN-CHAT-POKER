@echo off
echo Starting SECURE ngrok tunnel for Ollama...
echo This will expose your local Ollama ONLY to Render servers
echo.
echo Security Features Enabled:
echo - IP Restrictions (Render servers only)
echo - No public access
echo - Your machine is protected
echo.
ngrok http 11434 --policy-file ngrok-policy.yml
pause
