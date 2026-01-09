@echo off
REM Smart development startup - Interactive background mode

echo 🚀 Smart Development Environment - Interactive Mode
echo ==================================================

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
        tasklist /fi "PID eq %%i" /fo table 2>nul
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
        echo ✅ Port cleared
    ) else (
        echo ⚠️  Continuing with existing process...
    )
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
echo ✅ AI Control Center starting in background...

echo.
echo 👁️  Step 4: Production Monitor (optional)
set /p monitor="Start production monitor in background? (y/n): "
if /i "%monitor%"=="y" (
    start /B /MIN node auto-deploy-monitor.js
    echo ✅ Production Monitor started in background
) else (
    echo ℹ️  Production Monitor skipped
)

echo.
echo 🎯 Interactive Development Environment Started!
echo.
echo 📝 Active Tools (all running in background):
echo   ✅ File Watcher - Real-time syntax checking
echo   ✅ AI Control Center - http://localhost:5173
if /i "%monitor%"=="y" echo   ✅ Production Monitor - Health monitoring
echo.
echo 💡 Management:
echo   - Tools run silently in background
echo   - Use 'npm run dev:status' to check what's running
echo   - Use 'npm run dev:stop' to stop all tools
echo   - Use Ctrl+Shift+B in VS Code for safe deployment
echo.
echo 🌐 Access Points:
echo   - AI Control Center: http://localhost:5173
echo   - Production Server: https://all-in-chat-poker.fly.dev
echo.
echo 🛑 To stop all tools: npm run dev:stop
echo.
echo ⏳ Waiting 3 seconds for tools to start...
timeout /t 3 >nul

echo.
echo 🔍 Quick status check:
call :checkstatus
goto :end

:checkstatus
echo 📊 Current Status:
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo   ✅ AI Control Center: Running on http://localhost:5173
) else (
    echo   ⏳ AI Control Center: Starting up...
)

tasklist | findstr node.exe >nul
if %errorlevel% == 0 (
    echo   ✅ Background Tools: Node.js processes running
) else (
    echo   ❌ Background Tools: No processes detected
)
goto :eof

:end
echo.
echo 🎉 Ready for development! Your automation is now running silently.
echo 💡 Check http://localhost:5173 for AI Control Center in a few seconds
