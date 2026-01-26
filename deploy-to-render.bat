@echo off
setlocal enabledelayedexpansion

REM Deploy to Render - Quick Deployment Script (Windows)
REM This script helps you deploy your poker game to Render

echo 🚀 Deploying to Render...
echo ==================================================

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ [ERROR] Git is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ [ERROR] Not in a git repository
    pause
    exit /b 1
)

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo [INFO] Current branch: !CURRENT_BRANCH!

REM Check if there are uncommitted changes
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo [WARN] You have uncommitted changes
    set /p COMMIT_CHANGES="Do you want to commit them? (y/N): "
    if /i "!COMMIT_CHANGES!"=="y" (
        echo [INFO] Adding all changes...
        git add .
        
        set /p COMMIT_MSG="Enter commit message: "
        if "!COMMIT_MSG!"=="" set COMMIT_MSG=Deploy to Render - %date% %time%
        
        echo [INFO] Committing changes...
        git commit -m "!COMMIT_MSG!"
    ) else (
        echo ❌ [ERROR] Please commit your changes before deploying
        pause
        exit /b 1
    )
)

REM Check if we're on the correct branch
if not "!CURRENT_BRANCH!"=="main" (
    echo [WARN] You're not on the main branch
    set /p SWITCH_BRANCH="Do you want to switch to main branch? (y/N): "
    if /i "!SWITCH_BRANCH!"=="y" (
        echo [INFO] Switching to main branch...
        git checkout main
        git pull origin main
    ) else (
        echo [WARN] Deploying from branch: !CURRENT_BRANCH!
    )
)

REM Check if render.yaml exists
if not exist "render.yaml" (
    echo ❌ [ERROR] render.yaml not found
    pause
    exit /b 1
)
echo [INFO] Found render.yaml configuration

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ [ERROR] package.json not found
    pause
    exit /b 1
)
echo [INFO] Found package.json

REM Check if server.js exists
if not exist "server.js" (
    echo ❌ [ERROR] server.js not found
    pause
    exit /b 1
)
echo [INFO] Found server.js

REM Check health endpoint
findstr /C:"app.get" /C:"health" server.js >nul
if errorlevel 1 (
    echo [WARN] Health endpoint not found in server.js
    echo [WARN] Render requires a health check endpoint
) else (
    echo [INFO] Health endpoint found
)

REM Push to GitHub
echo [INFO] Pushing to GitHub...
git push origin !CURRENT_BRANCH!

if errorlevel 1 (
    echo ❌ [ERROR] Failed to push to GitHub
    pause
    exit /b 1
)

echo [INFO] Successfully pushed to GitHub

REM Wait a moment for GitHub to process
echo [INFO] Waiting for GitHub to process...
timeout /t 3 /nobreak >nul

REM Test deployment (if test script exists)
if exist "test-render-deployment.js" (
    echo [INFO] Running deployment test...
    node test-render-deployment.js
) else (
    echo [WARN] Deployment test script not found
)

echo ==================================================
echo 🎉 Deployment initiated!
echo.
echo Next steps:
echo 1. Go to https://render.com
echo 2. Check your services in the dashboard
echo 3. Monitor the build logs
echo 4. Test your application at:
echo    https://all-in-chat-poker.onrender.com
echo.
echo Health check:
echo    https://all-in-chat-poker.onrender.com/health
echo.
echo If you encounter issues:
echo 1. Check Render logs in the dashboard
echo 2. Verify environment variables
echo 3. Check the build process
echo.
echo For troubleshooting, run:
echo    node test-render-deployment.js
echo ==================================================

pause
