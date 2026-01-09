@echo off
REM Clean Restart Development Server

echo 🧹 Cleaning up development server...

REM Kill any existing Node.js processes on port 5173
echo 🔄 Stopping existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do (
    echo Stopping process %%a
    taskkill /f /pid %%a 2>nul
)

REM Kill any existing Ollama processes (optional)
echo 🤖 Stopping Ollama processes...
taskkill /f /im ollama.exe 2>nul

REM Wait for processes to fully stop
timeout /t 2 /nobreak >nul

REM Clear Node.js cache
echo 🗑️ Clearing cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul
if exist ".vite" rmdir /s /q ".vite" 2>nul

REM Restart AI Control Center
echo 🚀 Starting AI Control Center...
cd /d "C:\Users\merce\Documents\poker-game\apps\ai-control-center"
start "AI Control Center" cmd /k "npm run dev"

echo ✅ Clean restart complete!
echo 🌐 AI Control Center: http://localhost:5173
timeout /t 3 /nobreak >nul
