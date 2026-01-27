@echo off
title Helm Comprehensive Test Suite
echo 🛡️  Running Comprehensive Helm System Tests...
echo.
echo This will test:
echo    • File structure and integrity
echo    • Ollama availability and models
echo    • Helm server functionality
echo    • Dashboard server and features
echo    • Learning system integration
echo    • Chat interface and skills
echo    • Shortcut files and automation
echo    • System metrics and performance
echo.

REM Change to main directory
cd /d "%~dp0"

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo 🧪 Starting comprehensive test suite...
echo.

REM Run the comprehensive test
node comprehensive-test.js

echo.
echo 📊 Test complete! Check the summary above.
echo 📄 Detailed report saved to: helm-test-report.json
echo.
pause
