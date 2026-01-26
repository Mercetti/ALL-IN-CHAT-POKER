@echo off
setlocal enabledelayedexpansion

echo 🤖 Setting up Helm Control with Local LLM...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Check if Ollama is installed
ollama --version >nul 2>&1
if errorlevel 1 (
    echo 🔧 Ollama not found. Installing...
    echo.
    echo Downloading Ollama...
    powershell -Command "iwr -useb https://ollama.ai/install.sh | sh"
    
    if errorlevel 1 (
        echo ❌ Failed to install Ollama
        echo Please install manually from https://ollama.ai
        pause
        exit /b 1
    )
    
    echo ✅ Ollama installed successfully
) else (
    echo ✅ Ollama found
)

REM Start Ollama server
echo 🚀 Starting Ollama server...
start /B ollama serve

REM Wait for Ollama to start
echo ⏳ Waiting for Ollama to start...
timeout /t 10 /nobreak >nul

REM Download models
echo 📦 Downloading LLM models...
echo.
echo Downloading Llama2 (7B model, ~4GB)...
ollama pull llama2

if errorlevel 1 (
    echo ❌ Failed to download llama2 model
    pause
    exit /b 1
)

echo ✅ Llama2 model downloaded

echo.
echo Downloading Mistral (fast, efficient model)...
ollama pull mistral

if errorlevel 1 (
    echo ⚠️ Failed to download mistral model (optional)
) else (
    echo ✅ Mistral model downloaded
)

REM Test Ollama
echo 🧪 Testing Ollama...
ollama run llama2 "Hello, can you help with poker commentary?" >nul 2>&1

if errorlevel 1 (
    echo ❌ Ollama test failed
    pause
    exit /b 1
)

echo ✅ Ollama test successful

REM Update Helm integration
echo 🔧 Updating Helm integration...
echo.
echo Updating Helm engine to use local LLM...

REM Create backup of original file
if exist "helm-local-engine.js" (
    copy "helm-local-engine.js" "helm-local-engine.js.backup" >nul
    echo ✅ Backed up original engine
)

REM Copy the local LLM engine
copy "helm-local-llm-engine.js" "helm-local-engine.js" >nul
echo ✅ Updated Helm engine for local LLM

REM Update integration file
if exist "helm-integration.js" (
    copy "helm-integration.js" "helm-integration.js.backup" >nul
    echo ✅ Backed up integration file
)

echo.
echo 🎯 Testing Helm with Local LLM...

REM Test the integration
node -e "
const HelmLocalLLMEngine = require('./helm-local-llm-engine');
const engine = new HelmLocalLLMEngine();
engine.initialize().then(() => {
  console.log('✅ Helm + Local LLM integration successful!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Integration failed:', error.message);
  process.exit(1);
});
"

if errorlevel 1 (
    echo ❌ Helm integration test failed
    pause
    exit /b 1
)

echo.
echo ==================================================
echo 🎉 LOCAL LLM SETUP COMPLETE!
echo.
echo What you now have:
echo ✅ Ollama server running locally
echo ✅ Llama2 model downloaded and ready
echo ✅ Helm Control integrated with local LLM
echo ✅ Advanced AI capabilities with 100% privacy
echo.
echo Next steps:
echo 1. Start your poker game: npm run dev
echo 2. Launch Windows App: cd helm-windows-app && BUILD_AND_RUN.bat
echo 3. Test AI skills in the Windows app
echo.
echo Available AI skills:
echo - poker_commentary: AI-powered poker commentary
echo - chat_response: Advanced chat responses
echo - game_analysis: AI game state analysis
echo - player_assist: AI player assistance
echo.
echo 💰 Total Cost: $0 (completely free!)
echo 🔒 Privacy: 100% local, no data leaves your system
echo 🧠 Intelligence: Advanced LLM capabilities
echo.
echo Ollama server is running in the background.
echo To stop it later, close the Ollama window or run: taskkill /f /im ollama.exe
echo ==================================================

pause
