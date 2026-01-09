@echo off
REM Port Conflict Checker for Development Servers

echo 🔍 Checking for port conflicts...

echo.
echo 📊 Port 5173 (AI Control Center):
netstat -aon | find ":5173" >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 5173 is in use:
    netstat -aon | find ":5173"
    echo.
    echo 💡 To free this port, run: clean-restart-server.bat
) else (
    echo ✅ Port 5173 is free
)

echo.
echo 📊 Port 8080 (Backend Server):
netstat -aon | find ":8080" >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 8080 is in use:
    netstat -aon | find ":8080"
) else (
    echo ✅ Port 8080 is free
)

echo.
echo 📊 Port 11434 (Ollama):
netstat -aon | find ":11434" >nul
if %errorlevel% == 0 (
    echo ✅ Port 11434 is in use (Ollama running)
) else (
    echo ⚠️  Port 11434 is free (Ollama not running)
)

echo.
echo 📊 Port 8081 (Acey WebSocket):
netstat -aon | find ":8081" >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 8081 is in use:
    netstat -aon | find ":8081"
) else (
    echo ✅ Port 8081 is free
)

echo.
echo 🔧 Quick fixes:
echo   • Clean restart: clean-restart-server.bat
echo   • Kill all Node: taskkill /f /im node.exe
echo   • Kill Ollama: taskkill /f /im ollama.exe
echo.
pause
