@echo off
REM Auto-Update AI Control Center Script

echo 🔄 Updating AI Control Center...

REM Navigate to project directory
cd /d "C:\Users\merce\Documents\poker-game\apps\ai-control-center"

REM Pull latest changes
echo 📥 Pulling latest code...
git pull origin main

REM Install/update dependencies
echo 📦 Installing dependencies...
call npm install

REM Build the application
echo 🔨 Building application...
call npm run build

REM Start the updated app
echo 🚀 Starting updated AI Control Center...
call npm run dev

echo ✅ AI Control Center updated and running!
echo 🌐 Access at: http://localhost:5173
pause
