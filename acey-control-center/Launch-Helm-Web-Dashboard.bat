@echo off
title Helm Web Dashboard
echo 🛡️  Starting Helm Web Dashboard...
echo.
echo � Helm will automatically start Ollama if needed
echo �📱 Mobile-ready dashboard will open in your browser
echo.

REM Change to the app directory
cd /d "%~dp0"

REM Start the Python server
python serve-dashboard.py

pause
