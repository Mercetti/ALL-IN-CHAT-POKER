@echo off
echo "🏗️ Creating Simple React Native APK Build Script"
echo "=========================================="

REM Navigate to mobile directory
cd mobile

REM Check if gradlew exists
if exist "android\gradlew.bat" (
    echo "🔧 Found gradlew.bat, attempting build..."
    cd android
    
    REM Try to build APK using gradlew
    call gradlew.bat assembleDebug
    
    if %ERRORLEVEL% EQU 0 (
        echo "✅ APK built successfully!"
        echo "📍 Location: android\app\build\outputs\apk\debug\app-debug.apk"
        
        REM Copy to dist directory
        if not exist "..\..\dist" mkdir "..\..\dist"
        copy "app\build\outputs\apk\debug\app-debug.apk" "..\..\dist\acey-control-center.apk"
        echo "📋 APK copied to dist\acey-control-center.apk"
        
        REM Get file size
        for %%I in ("..\..\dist\acey-control-center.apk") do echo "📊 File size: %%~zI bytes"
    ) else (
        echo "❌ Gradle build failed"
    )
) else (
    echo "⚠️  No gradlew.bat found - React Native project incomplete"
    echo "💡 Recommendation: Use Expo.dev for APK generation"
    echo "🌐 Visit: https://expo.dev"
    echo "📱 Upload project to Expo.dev for automatic APK building"
)

echo "🎯 APK Build Process Complete!"
pause
