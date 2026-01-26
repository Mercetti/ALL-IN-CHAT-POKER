@echo off
title Helm Web Dashboard
echo 🛡️  Starting Helm Web Dashboard...
echo.
echo 📱 Mobile-ready dashboard will open in your browser
echo 🚀 Make sure Helm server is running on port 3001
echo.

REM Change to the app directory
cd /d "%~dp0"

REM Start the Python server
python serve-dashboard.py

pause
