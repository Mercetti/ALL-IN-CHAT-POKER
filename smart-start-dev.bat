@echo off
REM Smart development startup with port management

echo 🚀 Smart Development Environment Startup
echo ========================================

echo.
echo 🔍 Step 1: Checking port availability...

REM Check if port 5173 is in use
netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 5173 is already in use
    echo.
    echo 📋 Processes using port 5173:
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
        echo    PID: %%i
        tasklist /fi "PID eq %%i" /fo table
    )
    echo.
    set /p kill="Kill existing process(es) on port 5173? (y/n): "
    if /i "%kill%"=="y" (
        echo 🔄 Killing existing process(es)...
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
            echo    Killing PID %%i
            taskkill /f /pid %%i >nul 2>&1
        )
        timeout /t 2 >nul
    )
) else (
    echo ✅ Port 5173 is available
)

echo.
echo 📁 Step 2: Starting File Watcher
start "File Watcher" cmd /k "node auto-watch.js"

echo.
echo 🎛️  Step 3: Starting AI Control Center
echo 🌐 This will be available at http://localhost:5173
start "AI Control Center" cmd /k "npm run control:center"

echo.
echo 👁️  Step 4: Production Monitor (optional)
set /p monitor="Start production monitor? (y/n): "
if /i "%monitor%"=="y" start "Production Monitor" cmd /k "node auto-deploy-monitor.js"

echo.
echo 🎯 Smart Development Environment Started!
echo.
echo 📝 Active Tools:
echo   ✅ File Watcher - Real-time syntax checking
echo   ✅ AI Control Center - http://localhost:5173
echo   ✅ Production Monitor - Health monitoring (if started)
echo.
echo 💡 Tips:
echo   - All tools run in separate windows
echo   - Port conflicts automatically detected and resolved
echo   - Use Ctrl+Shift+B in VS Code for safe deployment
echo.
echo 🌐 Access Points:
echo   - AI Control Center: http://localhost:5173
echo   - Production Server: https://all-in-chat-poker.fly.dev
echo.
pause
