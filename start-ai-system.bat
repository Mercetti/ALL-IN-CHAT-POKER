@echo off
echo 🤖 Starting AI System for Poker Game...

REM Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama not found. Please install from https://ollama.ai/
    pause
    exit /b 1
)

REM Start Ollama in background
echo 🚀 Starting Ollama...
start "Ollama Server" ollama serve

REM Wait for Ollama to start
echo ⏳ Waiting for Ollama to start...
timeout /t 5 /nobreak >nul

REM Pull the model if not already available
echo 📥 Pulling llama2 model...
ollama pull llama2

REM Test Ollama
echo 🧪 Testing Ollama...
ollama run llama2 "Generate a poker card back design description"

echo ✅ AI System is ready!
echo 📊 Ollama running on: http://127.0.0.1:11434
echo 🎯 Model: llama2
echo 🔄 AI Worker can now connect to your local AI

echo.
echo Press any key to continue...
pause >nul
