@echo off
REM Ollama CPU Optimization for Windows

echo 🔧 Optimizing Ollama for CPU usage...

REM Stop Ollama processes
taskkill /f /im ollama.exe 2>nul

REM Set CPU-only environment variables
set OLLAMA_GPU_DISABLED=1
set OLLAMA_NUM_PARALLEL=1
set OLLAMA_MAX_QUEUE=512
set OLLAMA_LOAD_TIMEOUT=300

REM Restart Ollama with CPU optimization
echo Starting Ollama in CPU-only mode...
start /B ollama serve

echo ✅ Ollama optimized for CPU usage
echo 📊 Monitor with Task Manager
pause
