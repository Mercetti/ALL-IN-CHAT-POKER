@echo off
REM Smart Deployment with Monitoring and Auto-Rollback

echo 🚀 Smart Deployment System
echo ========================

REM Step 1: Pre-deployment checks
echo.
echo 🔍 Step 1: Running pre-deployment checks...
npm run predeploy
if %errorlevel% neq 0 (
  echo ❌ Pre-deployment checks failed!
  echo 💡 Fix the issues above before deploying
  pause
  exit /b 1
)

REM Step 2: Deploy
echo.
echo 🚀 Step 2: Deploying to production...
fly deploy -a all-in-chat-poker --strategy immediate
if %errorlevel% neq 0 (
  echo ❌ Deployment failed!
  pause
  exit /b 1
)

REM Step 3: Health check
echo.
echo 🏥 Step 3: Verifying deployment health...
timeout /t 10 /nobreak >nul

curl -s -I https://all-in-chat-poker.fly.dev/ | findstr "200 OK"
if %errorlevel% neq 0 (
  echo ❌ Health check failed - Server not responding correctly
  echo 🔄 Initiating rollback...
  
  REM Rollback to previous deployment
  for /f "tokens=1" %%i in ('fly deployments list -a all-in-chat-poker ^| findstr /v "ID" ^| findstr /v "latest"') do (
    fly deploy rollback -a all-in-chat-poker %%i
    goto :rollback_complete
  )
  
  :rollback_complete
  echo ✅ Rollback completed
  pause
  exit /b 1
)

REM Step 4: Start monitoring
echo.
echo 👁️  Step 4: Starting deployment monitor...
echo 📊 Monitoring production health (press Ctrl+C to stop)
echo.

REM Start the monitor in background
start /b node auto-deploy-monitor.js

echo ✅ Smart deployment completed successfully!
echo 🌐 Production: https://all-in-chat-poker.fly.dev
echo 🎛️  AI Control Center: http://localhost:5173
echo 👁️  Monitor running in background
echo.
pause
