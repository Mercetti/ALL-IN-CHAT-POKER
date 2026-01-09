@echo off
REM Smart development startup - Background mode (no windows)

echo 🚀 Smart Development Environment - Background Mode
echo ==================================================

echo.
echo 🔍 Step 1: Checking port availability...

REM Check if port 5173 is in use
netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 5173 is already in use
    echo.
    echo 🔄 Killing existing process(es)...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
        echo    Killing PID %%i
        taskkill /f /pid %%i >nul 2>&1
    )
    timeout /t 2 >nul
) else (
    echo ✅ Port 5173 is available
)

echo.
echo 📁 Step 2: Starting File Watcher (background)
start /B /MIN node auto-watch.js
echo ✅ File Watcher started in background

echo.
echo 🎛️  Step 3: Starting AI Control Center (background)
echo 🌐 Will be available at http://localhost:5173
start /B /MIN cmd /c "npm run control:center"
echo ✅ AI Control Center starting in background

echo.
echo 👁️  Step 4: Starting Production Monitor (background)
start /B /MIN node auto-deploy-monitor.js
echo ✅ Production Monitor started in background

echo.
echo 🎯 Background Development Environment Started!
echo.
echo 📝 Active Tools (all running in background):
echo   ✅ File Watcher - Real-time syntax checking
echo   ✅ AI Control Center - http://localhost:5173
echo   ✅ Production Monitor - Health monitoring
echo.
echo 💡 Management:
echo   - Tools run silently in background
echo   - Use Task Manager to end processes if needed
echo   - Check AI Control Center for status
echo   - Use Ctrl+Shift+B in VS Code for safe deployment
echo.
echo 🌐 Access Points:
echo   - AI Control Center: http://localhost:5173
echo   - Production Server: https://all-in-chat-poker.fly.dev
echo.
echo 🛑 To stop all tools:
echo   taskkill /f /im node.exe
echo.
timeout /t 3 >nul
