@echo off
echo 🚀 Starting Poker Game with AI Control Center Integration...
echo.

:: Start AI Control Center first
echo 1️⃣ Starting AI Control Center on port 3001...
cd /d "%~dp0acey-control-center"
start "AI Control Center" cmd /k "npm run dev"

:: Wait a moment for AI Control Center to start
timeout /t 3 /nobreak > nul

:: Start main poker server
echo 2️⃣ Starting Poker Game Server on port 8080...
cd /d "%~dp0"
start "Poker Game Server" cmd /k "node server.js"

:: Wait a moment for main server to start
timeout /t 5 /nobreak > nul

:: Run integration test
echo 3️⃣ Running integration test...
node test-acey-integration.js

echo.
echo ✅ Both servers are starting up!
echo 📊 AI Control Center: http://localhost:3001
echo 🎮 Poker Game Server: http://localhost:8080
echo 🧪 Test Client: acey-control-center\test-client.html
echo.
echo Press any key to open the test client...
pause > nul
start "" "%~dp0acey-control-center\test-client.html"

echo 🎯 Integration complete! Your Acey system is now connected to the AI Control Center.
