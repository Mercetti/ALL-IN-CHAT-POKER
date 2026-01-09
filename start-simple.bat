@echo off
REM Simple development startup - no prompts, no extra windows

echo Starting Development Environment...

REM Kill existing processes on port 5173
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%i >nul 2>&1
)

REM Start tools in background
start /B /MIN node auto-watch.js
timeout /t 2 >nul
start /B /MIN cmd /c "npm run control:center"
start /B /MIN node auto-deploy-monitor.js

echo.
echo Tools started in background:
echo - AI Control Center: http://localhost:5173
echo - File Watcher: Running
echo - Production Monitor: Running
echo.
echo Use npm run dev:status to check status
echo Use npm run dev:stop to stop all tools
timeout /t 3 >nul
