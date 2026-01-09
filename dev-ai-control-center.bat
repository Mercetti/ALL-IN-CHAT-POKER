@echo off
REM Development Mode with Live Reload

echo 🚀 Starting AI Control Center in Development Mode...
echo 🔄 Live reload enabled - changes will auto-update
echo 🌐 Access at: http://localhost:5173

REM Navigate to project directory
cd /d "C:\Users\merce\Documents\poker-game\apps\ai-control-center"

REM Start development server with live reload
call npm run dev

echo 📝 Development server stopped
pause
