@echo off
title Helm Control - Small LLM Edition
echo Starting Helm Control...
echo.
echo Make sure Helm server is running on port 3001
echo.

REM Change to the app directory
cd /d "%~dp0"

REM Start the app
npm run dev

pause
