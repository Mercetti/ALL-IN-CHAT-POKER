@echo off
REM Stop all development background processes

echo 🛑 Stopping All Development Tools
echo ==================================

echo.
echo 🔄 Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 🔄 Stopping any remaining processes on port 5173...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo    Killing PID %%i
    taskkill /f /pid %%i >nul 2>&1
)

echo.
echo ✅ All development tools stopped!
echo.
echo 💡 To restart: npm run dev:bg
echo 💡 To start with windows: npm run dev:smart
pause
