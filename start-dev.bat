@echo off
REM Auto-start development environment with all automation tools

echo 🚀 Starting Development Environment
echo ==================================

echo.
echo 📁 Step 1: Starting File Watcher (real-time syntax checking)
start "File Watcher" cmd /k "node auto-watch.js"

echo.
echo 🎛️  Step 2: Starting AI Control Center
start "AI Control Center" cmd /k "npm run control:center"

echo.
echo 👁️  Step 3: Starting Production Monitor (optional)
echo 📊 This monitors production health and auto-reverts on failures
set /p monitor="Start production monitor? (y/n): "
if /i "%monitor%"=="y" start "Production Monitor" cmd /k "node auto-deploy-monitor.js"

echo.
echo 🎯 Development Environment Started!
echo.
echo 📝 Active Tools:
echo   ✅ File Watcher - Checks syntax on every save
echo   ✅ AI Control Center - Real-time AI performance monitoring
echo   ✅ Production Monitor - Health monitoring (if started)
echo.
echo 💡 Tips:
echo   - All tools run in separate windows
echo   - Close windows to stop individual tools
echo   - Use Ctrl+Shift+B in VS Code for safe deployment
echo   - Check VS Code debug configurations (Ctrl+Shift+D) for more options
echo.
echo 🌐 Access Points:
echo   - AI Control Center: http://localhost:5173
echo   - Production Server: https://all-in-chat-poker.fly.dev
echo.
pause
