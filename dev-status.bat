@echo off
REM Check status of development tools

echo 📊 Development Tools Status
echo ==========================

echo.
echo 🔍 Checking Node.js processes...
tasklist | findstr node.exe
if %errorlevel% neq 0 echo    No Node.js processes running

echo.
echo 🌐 Checking port 5173 (AI Control Center)...
netstat -ano | findstr :5173 | findstr LISTENING
if %errorlevel% neq 0 echo    Port 5173 is not in use

echo.
echo 📁 Checking file watcher...
tasklist | findstr node.exe >nul
if %errorlevel% == 0 (
    echo ✅ File Watcher: Running (Node.js process detected)
) else (
    echo ❌ File Watcher: Not running
)

echo.
echo 🎛️  Checking AI Control Center...
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo ✅ AI Control Center: Running on http://localhost:5173
) else (
    echo ❌ AI Control Center: Not running
)

echo.
echo 👁️  Checking Production Monitor...
REM Check if auto-deploy-monitor.js is running (hard to detect specifically)
tasklist | findstr node.exe >nul
if %errorlevel% == 0 (
    echo ✅ Production Monitor: Likely running (Node.js process detected)
) else (
    echo ❌ Production Monitor: Not running
)

echo.
echo 💡 Management Commands:
echo   Start all:     npm run dev:bg
echo   Stop all:      npm run dev:stop
echo   Check status:  npm run dev:status
echo   Restart:       npm run dev:stop && npm run dev:bg
echo.
pause
