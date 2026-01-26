#!/bin/bash

echo "🤖 Starting AI System for Poker Game..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama in background
echo "🚀 Starting Ollama..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Pull the model if not already available
echo "📥 Pulling llama2 model..."
ollama pull llama2

# Test Ollama
echo "🧪 Testing Ollama..."
ollama run llama2 "Generate a poker card back design description" --verbose

echo "✅ AI System is ready!"
echo "📊 Ollama running on: http://127.0.0.1:11434"
echo "🎯 Model: llama2"
echo "🔄 AI Worker can now connect to your local AI"

# Keep script running
echo "Press Ctrl+C to stop Ollama"
wait $OLLAMA_PID
