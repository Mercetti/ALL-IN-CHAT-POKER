@echo off
echo ========================================
echo Android Development Environment Check
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo Please install Node.js from https://nodejs.org/
    goto :error
) else (
    echo ✅ Node.js found
)

echo.
echo [2/5] Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ npm not found
    goto :error
) else (
    echo ✅ npm found
)

echo.
echo [3/5] Checking Expo CLI...
npx expo --version
if %errorlevel% neq 0 (
    echo ❌ Expo CLI not found
    echo Installing Expo CLI...
    npm install -g @expo/cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Expo CLI
        goto :error
    )
) else (
    echo ✅ Expo CLI found
)

echo.
echo [4/5] Checking project dependencies...
if exist node_modules (
    echo ✅ Dependencies installed
) else (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        goto :error
    )
)

echo.
echo [5/5] Checking Android environment...
where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Android SDK not found in PATH
    echo Please install Android Studio from https://developer.android.com/studio
    echo And add Android SDK tools to PATH
) else (
    echo ✅ Android SDK found
)

echo.
echo ========================================
echo Environment Check Complete
echo ========================================
echo.
echo 📱 Ready for Android Development!
echo.
echo Available commands:
echo   npm start     - Start development server
echo   npm run android - Build and run on Android
echo   npx expo build:android - Build APK
echo.
goto :end

:error
echo.
echo ❌ Environment setup failed!
echo Please install the missing components and try again.
echo.

:end
pause
