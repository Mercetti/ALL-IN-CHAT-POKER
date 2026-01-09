@echo off
REM Safe Deployment with Pre-Checks

echo 🔍 Running Pre-Deployment Safety Checks...

REM Run syntax and function checks
node pre-deploy-check.js

if %errorlevel% neq 0 (
  echo.
  echo ❌ PRE-DEPLOYMENT CHECKS FAILED!
  echo 💡 Fix the issues above before deploying
  echo.
  pause
  exit /b 1
)

echo.
echo ✅ All checks passed - Proceeding with deployment...
echo.

REM Run the actual deployment
fly deploy -a all-in-chat-poker --strategy immediate

if %errorlevel% neq 0 (
  echo.
  echo ❌ Deployment failed!
  echo 💡 Check the deployment logs above
  pause
  exit /b 1
)

echo.
echo 🎉 Deployment successful!
echo 🌐 Server: https://all-in-chat-poker.fly.dev
echo 🎛️  AI Control Center: http://localhost:5173
echo.
pause
