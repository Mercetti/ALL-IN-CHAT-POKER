@echo off
REM Live status checker with real-time monitoring

echo 📊 Development Tools Live Status
echo ================================

:checkloop
cls
echo 📊 Development Tools Status - %date% %time%
echo ==========================================
echo.

echo 🔍 Node.js Processes:
tasklist | findstr node.exe
if %errorlevel% neq 0 echo    No Node.js processes running
echo.

echo 🌐 Port 5173 Status:
netstat -ano | findstr :5173 | findstr LISTENING
if %errorlevel% neq 0 echo    Port 5173 is not in use
echo.

echo 📝 Tool Status:
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo   ✅ AI Control Center: RUNNING on http://localhost:5173
) else (
    echo   ❌ AI Control Center: NOT RUNNING
)

tasklist | findstr node.exe >nul
if %errorlevel% == 0 (
    echo   ✅ File Watcher: RUNNING (background process detected)
    echo   ✅ Production Monitor: LIKELY RUNNING
) else (
    echo   ❌ File Watcher: NOT RUNNING
    echo   ❌ Production Monitor: NOT RUNNING
)

echo.
echo 💡 Commands:
echo   Start Interactive: npm run dev:interactive
echo   Start Silent:     npm run dev:bg
echo   Stop All:         npm run dev:stop
echo   Refresh Status:   npm run dev:live
echo.
echo 🔄 Auto-refreshing in 10 seconds... (Ctrl+C to stop)

timeout /t 10 >nul
goto checkloop
