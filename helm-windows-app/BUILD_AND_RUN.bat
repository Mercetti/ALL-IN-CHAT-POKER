@echo off
setlocal enabledelayedexpansion

echo 🛡️ Building Helm Control Windows App...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the helm-windows-app directory
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Build the application
echo 🔨 Building application...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Application built successfully

REM Create distributable
echo 📦 Creating Windows distributable...
call npm run build:win

if errorlevel 1 (
    echo ⚠️ Distributable creation failed, but app should still work
) else (
    echo ✅ Windows distributable created
)

REM Start the application
echo 🚀 Starting Helm Control...
echo.
echo The application will open in a new window
echo Make sure your local Helm server is running on http://localhost:3000
echo.
echo Press Ctrl+C to stop the application
echo.

call npm start

pause
