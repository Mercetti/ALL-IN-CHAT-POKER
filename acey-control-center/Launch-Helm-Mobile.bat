@echo off
title Helm Control Mobile Dashboard
echo Starting Helm Control Mobile Dashboard...
echo.
echo Make sure Helm server is running on port 3001
echo.

REM Change to the app directory
cd /d "%~dp0"

REM Start the development server
npm start

pause
