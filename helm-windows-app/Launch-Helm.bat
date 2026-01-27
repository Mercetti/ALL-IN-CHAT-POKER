@echo off
title Helm Control - Enhanced Windows App
echo 🛡️  Starting Helm Enhanced Windows App...
echo.
echo 🚀 This will start:
echo    • Helm Server (if not running)
echo    • Dashboard Server (if not running) 
echo    • Enhanced Windows App Interface
echo.

REM Change to main directory
cd /d "%~dp0\.."

REM Start Helm server (will auto-start Ollama)
echo 🔍 Starting Helm server...
start "Helm Server" cmd /k "node helm-server.js"

REM Wait for Helm to initialize
timeout /t 5 /nobreak >nul

REM Start dashboard server
echo 📱 Starting Dashboard server...
start "Dashboard Server" cmd /k "cd acey-control-center && python serve-dashboard.py"

REM Wait for dashboard to start
timeout /t 3 /nobreak >nul

REM Change to Windows app directory
cd /d "%~dp0"

echo 🖥️  Starting Enhanced Windows App...
echo.

REM Start the app
npm run dev

pause
