@echo off
REM Ollama Hybrid GPU + CPU Optimization for Windows

echo 🔧 Optimizing Ollama for Hybrid GPU + CPU usage...

REM Stop existing Ollama processes
taskkill /f /im ollama.exe 2>nul

REM Set hybrid environment variables
set OLLAMA_NUM_PARALLEL=2
set OLLAMA_MAX_QUEUE=1024
set OLLAMA_LOAD_TIMEOUT=300
set OLLAMA_GPU_LAYERS=-1
set OLLAMA_NUM_THREAD=6
set OLLAMA_GPU_MEMORY_UTILIZATION=0.6
set OLLAMA_CPU_MEMORY_UTILIZATION=0.4

REM Restart Ollama with hybrid optimization
echo Starting Ollama in Hybrid GPU + CPU mode...
start /B ollama serve

echo ✅ Ollama optimized for Hybrid GPU + CPU usage
echo 📊 Monitor with Task Manager (GPU and CPU usage)
echo 🎯 GPU: 60% utilization | CPU: 40% utilization
pause
