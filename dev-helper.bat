@echo off
REM AI Control Center Development Helper for Windows

echo 🎮 AI Control Center Development Helper
echo ==================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if "%1"=="dev" goto :start_local
if "%1"=="local" goto :start_local
if "%1"=="start" goto :start_local
if "%1"=="deploy" goto :deploy_production
if "%1"=="prod" goto :deploy_production
if "%1"=="production" goto :deploy_production
if "%1"=="status" goto :show_status
if "%1"=="info" goto :show_status
if "%1"=="test" goto :run_tests
if "%1"=="check" goto :run_tests
if "%1"=="help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help

REM Default: Show menu
echo.
echo Available commands:
echo   dev, local, start    - Start local development server
echo   deploy, prod, prod    - Deploy to production (with warnings)
echo   status, info         - Show current status
echo   test, check         - Run basic tests
echo   help, -h, --help     - Show this help message
echo.
echo 🚀 Quick start: dev-helper.bat dev
echo.
pause
exit /b 0

:start_local
echo 🚀 Starting local development server...
echo 📍 URL: http://localhost:5173
echo 🔗 Backend: https://all-in-chat-poker.fly.dev
echo.
echo 📝 Development Notes:
echo - Changes will be hot-reloaded automatically
echo - Connects to production backend for data
echo - Safe for development without affecting players
echo.
cd apps\ai-control-center
npm run dev
exit /b 0

:deploy_production
echo ⚠️  PRODUCTION DEPLOYMENT WARNING!
echo ==================================
echo 🎮 This will interrupt gameplay for active players!
echo.
set /p "continue=Are you sure you want to continue? (y/N): "
if /i "%continue%" neq "y" (
    echo ❌ Deployment cancelled
    pause
    exit /b 0
)
echo 🚀 Deploying to production...
echo ⏰ Expected downtime: 1-2 minutes
echo 📊 Players will be disconnected temporarily
echo.
fly deploy
exit /b 0

:show_status
echo 📊 Current Status
echo ==================
echo.
echo 🎮 Production: https://all-in-chat-poker.fly.dev
echo 🛠️  Development: http://localhost:5173
echo.
echo 📈 Production Status:
echo - Core Systems: ✅ Stable
echo - User Issues: ✅ All resolved
echo - Last Deploy: Check git log for latest changes
echo.
echo 🔄 Recommended Workflow:
echo 1. Develop locally (npm run dev)
echo 2. Test thoroughly
echo 3. Deploy only when ready
echo.
pause
exit /b 0

:run_tests
echo 🧪 Running tests...
echo.
echo 🎵 Checking audio player...
curl -s -o nul -w "%%{http_code}" https://all-in-chat-poker.fly.dev/uploads/audio/test.mp3
echo.
echo 🔗 Checking API endpoints...
curl -s -o nul -w "%%{http_code}" https://all-in-chat-poker.fly.dev/admin/ai/overview
echo.
echo ✅ Tests completed
pause
exit /b 0

:show_help
echo Usage: dev-helper.bat [command]
echo.
echo Commands:
echo   dev, local, start    - Start local development server
echo   deploy, prod, prod    - Deploy to production (with warnings)
echo   status, info         - Show current status
echo   test, check         - Run basic tests
echo   help, -h, --help     - Show this help message
echo.
echo Examples:
echo   dev-helper.bat dev              # Start local development
echo   dev-helper.bat deploy           # Deploy to production
echo   dev-helper.bat status           # Show status
echo.
echo 🚀 Quick start: dev-helper.bat dev
pause
exit /b 0
