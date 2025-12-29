#!/bin/bash

# Quick Ollama Setup Script for All-In Chat Poker
# This script installs Ollama and downloads a free AI model

echo "🚀 Setting up Ollama for All-In Chat Poker..."
echo "=========================================="

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed!"
    ollama --version
else
    echo "📦 Installing Ollama..."
    
    # Detect OS and install
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Detected Linux - installing with curl..."
        curl -fsSL https://ollama.ai/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Detected macOS - checking for Homebrew..."
        if command -v brew &> /dev/null; then
            echo "Installing Ollama with Homebrew..."
            brew install ollama
        else
            echo "Please install Homebrew first: https://brew.sh/"
            echo "Then run: brew install ollama"
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "Detected Windows - please download from:"
        echo "https://ollama.ai/download/windows"
        echo "Or use: winget install Ollama.Ollama"
        exit 1
    else
        echo "Unsupported OS. Please install manually from https://ollama.ai"
        exit 1
    fi
fi

echo ""
echo "📥 Downloading free AI model..."

# Download Llama 3.2 (excellent for chat and reasoning)
echo "Downloading llama3.2 (this may take a few minutes)..."
ollama pull llama3.2

# Also download Mistral for variety
echo "Downloading mistral (great for conversations)..."
ollama pull mistral

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎮 Next steps:"
echo "1. Start Ollama: ollama serve"
echo "2. Update your .env file:"
echo "   AI_PROVIDER=ollama"
echo "   OLLAMA_HOST=http://127.0.0.1:11434"
echo "   OLLAMA_MODEL=llama3.2"
echo "3. Start the poker game: npm start"
echo ""
echo "🧪 Test Ollama:"
echo "ollama run llama3.2 'Hello, can you help with poker strategy?'"
echo ""
echo "📚 For more info, see: FREE_AI_SETUP.md"
