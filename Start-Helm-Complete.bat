@echo off
title Helm Complete System
echo 🛡️  Starting Helm Complete System...
echo.
echo 🚀 This will start:
echo    • Ollama (automatically if needed)
echo    • Helm Server with Intelligent Learning
echo    • Web Dashboard Interface
echo.

REM Change to the main directory
cd /d "%~dp0"

echo 🔍 Starting Helm with automatic Ollama management...
echo.

REM Start Helm server (will auto-start Ollama)
start "Helm Server" cmd /k "node helm-server.js"

REM Wait for Helm to initialize
timeout /t 8 /nobreak >nul

echo 📱 Opening Helm Dashboard...
echo.

REM Start the dashboard server
echo 📱 Starting Helm Dashboard Server...
start "Helm Dashboard" cmd /k "cd acey-control-center && python serve-dashboard.py"

REM Wait for dashboard to start
timeout /t 3 /nobreak >nul

REM Open the dashboard in browser with cache-buster
start http://localhost:8082/helm-dashboard-complete.html?nocache=%random%

echo.
echo ✅ Helm Complete System Started!
echo 🧠 Intelligent Learning is Active
echo 📊 Learning data will be stored in D:\AceyLearning\helm\
echo.
echo Press any key to open dashboard again...
pause >nul
start http://localhost:8082/helm-dashboard-complete.html?nocache=%random%

echo.
echo 🎯 Helm is running! Close this window to keep Helm running in background.
pause
