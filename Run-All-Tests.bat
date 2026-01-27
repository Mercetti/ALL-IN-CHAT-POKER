@echo off
title Complete Project Test Suite
echo 🛡️  RUNNING COMPLETE PROJECT TEST SUITE
echo ========================================
echo.
echo This will execute ALL test suites across the entire project:
echo.
echo 📋 TEST PLAN:
echo    1️⃣ Main Application & Backend Tests
echo    2️⃣ WebSocket Server Tests  
echo    3️⃣ UI Component Tests
echo    4️⃣ Mobile Application Tests
echo    5️⃣ E2E Playwright Tests
echo    6️⃣ Windows Desktop App Tests
echo    7️⃣ CI/CD Pipeline Validation
echo    8️⃣ Render Deployment Health Checks
echo    9️⃣ Helm System Comprehensive Tests
echo.

set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

REM Change to root directory
cd /d "%~dp0"

echo 🚀 Starting complete test execution...
echo.

REM 1. Main Application & Backend Tests
echo [1/9] 📦 Main Application & Backend Tests
echo ----------------------------------------
npm run test:backend
if %errorlevel% equ 0 (
    echo ✅ Backend tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ Backend tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 2. WebSocket Server Tests
echo [2/9] 🔌 WebSocket Server Tests
echo ---------------------------------
npm run test:websocket
if %errorlevel% equ 0 (
    echo ✅ WebSocket tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ WebSocket tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 3. UI Component Tests
echo [3/9] 🎨 UI Component Tests
echo -------------------------------
npm run test:components
if %errorlevel% equ 0 (
    echo ✅ Component tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ Component tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 4. Mobile Application Tests
echo [4/9] 📱 Mobile Application Tests
echo ----------------------------------
npm run test:mobile
if %errorlevel% equ 0 (
    echo ✅ Mobile tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ Mobile tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 5. E2E Playwright Tests
echo [5/9] 🎭 E2E Playwright Tests
echo -------------------------------
echo ⚠️  Note: Requires browser installation
npm run test:e2e
if %errorlevel% equ 0 (
    echo ✅ E2E tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ E2E tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 6. Windows Desktop App Tests
echo [6/9] 🖥️  Windows Desktop App Tests
echo -----------------------------------
cd helm-windows-app
npm run test
if %errorlevel% equ 0 (
    echo ✅ Windows app tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ Windows app tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
cd ..
echo.

REM 7. CI/CD Pipeline Validation
echo [7/9] 🔄 CI/CD Pipeline Validation
echo ------------------------------------
node test-cicd-setup.js
if %errorlevel% equ 0 (
    echo ✅ CI/CD validation passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ CI/CD validation failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 8. Render Deployment Health Checks
echo [8/9] 🌐 Render Deployment Health Checks
echo ----------------------------------------
node test-render-deployment.js
if %errorlevel% equ 0 (
    echo ✅ Render deployment healthy
    set /a PASSED_TESTS+=1
) else (
    echo ❌ Render deployment issues
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 9. Helm System Comprehensive Tests
echo [9/9] 🛡️  Helm System Comprehensive Tests
echo -----------------------------------------
node comprehensive-test.js
if %errorlevel% equ 0 (
    echo ✅ Helm system tests passed
    set /a PASSED_TESTS+=1
) else (
    echo ❌ Helm system tests failed
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM Summary
echo 📊 TEST EXECUTION SUMMARY
echo =========================
echo Total Test Suites: %TOTAL_TESTS%
echo Passed: %PASSED_TESTS%
echo Failed: %FAILED_TESTS%
set /a SUCCESS_RATE=(%PASSED_TESTS% * 100) / %TOTAL_TESTS%
echo Success Rate: %SUCCESS_RATE%%%
echo.

if %FAILED_TESTS% equ 0 (
    echo 🎉 ALL TESTS PASSED! System is fully operational.
) else (
    echo ⚠️  %FAILED_TESTS% test suite(s) failed. Review logs above.
)

echo.
echo 📄 Detailed reports available:
echo    • Helm system: helm-test-report.json
echo    • Test logs: Check individual test outputs above
echo.

pause
