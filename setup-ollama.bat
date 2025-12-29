@echo off
REM Quick Ollama Setup Script for Windows
REM This script installs Ollama and downloads a free AI model

echo 🚀 Setting up Ollama for All-In Chat Poker...
echo ==========================================

REM Check if Ollama is already installed
where ollama >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo ✅ Ollama is already installed!
    ollama --version
) else (
    echo 📦 Installing Ollama with winget...
    winget install Ollama.Ollama
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to install with winget
        echo Please download manually from: https://ollama.ai/download/windows
        pause
        exit /b 1
    )
)

echo.
echo 📥 Downloading free AI model...

REM Download Llama 3.2 (excellent for chat and reasoning)
echo Downloading llama3.2 (this may take a few minutes)...
ollama pull llama3.2

REM Also download Mistral for variety
echo Downloading mistral (great for conversations)...
ollama pull mistral

echo.
echo ✅ Setup complete!
echo.
echo 🎮 Next steps:
echo 1. Start Ollama: ollama serve
echo 2. Update your .env file:
echo    AI_PROVIDER=ollama
echo    OLLAMA_HOST=http://127.0.0.1:11434
echo    OLLAMA_MODEL=llama3.2
echo 3. Start the poker game: npm start
echo.
echo 🧪 Test Ollama:
echo ollama run llama3.2 "Hello, can you help with poker strategy?"
echo.
echo 📚 For more info, see: FREE_AI_SETUP.md

pause
