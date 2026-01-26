@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up Helm Control (Free Version)...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Run the implementation script
echo 🔧 Running Helm implementation...
node IMPLEMENT_HELM_FREE.js

if errorlevel 1 (
    echo ❌ Implementation failed
    pause
    exit /b 1
)

echo.
echo ==================================================
echo 🎉 Helm Control Setup Complete!
echo.
echo Next steps:
echo 1. Test locally: npm run dev
echo 2. Check Helm: npm run helm:test
echo 3. Deploy: deploy-to-render.bat
echo 4. Visit: https://all-in-chat-poker.onrender.com
echo.
echo 💰 Total Monthly Cost: $0
echo ==================================================

pause
