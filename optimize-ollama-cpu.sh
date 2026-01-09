#!/bin/bash
# Ollama CPU Optimization Script

echo "🔧 Optimizing Ollama for CPU usage..."

# Stop Ollama service
echo "Stopping Ollama..."
pkill ollama 2>/dev/null || true

# Set CPU-only environment variables
export OLLAMA_GPU_DISABLED=1
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_QUEUE=512
export OLLAMA_LOAD_TIMEOUT=5m

# Restart Ollama with CPU-only mode
echo "Starting Ollama in CPU-only mode..."
OLLAMA_GPU_DISABLED=1 OLLAMA_NUM_PARALLEL=1 ollama serve &

echo "✅ Ollama optimized for CPU usage"
echo "📊 Monitor with: htop or Task Manager"
