@echo off
REM Quick script to kill processes on port 5173

echo 🔍 Checking port 5173...

netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 5173 is in use. Killing process(es)...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
        echo    Killing PID %%i
        taskkill /f /pid %%i >nul 2>&1
    )
    echo ✅ Port 5173 cleared
) else (
    echo ✅ Port 5173 is already available
)

echo.
echo 🌐 Port 5173 is ready for AI Control Center
pause
