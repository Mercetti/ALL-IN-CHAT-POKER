# Free AI Setup Guide - No OpenAI Plus Required!

This guide shows you how to run the poker game AI features completely free using local models.

## 🚀 Option 1: Ollama (Recommended - Best Free Option)

### What is Ollama?
Ollama is a free, open-source tool that lets you run powerful AI models locally on your computer. No API keys, no monthly fees, completely free!

### Quick Setup (5 minutes):

#### 1. Install Ollama
**Windows:**
```powershell
# Download and run the installer
# Visit: https://ollama.ai/download/windows
# Or use Windows Package Manager:
winget install Ollama.Ollama
```

**Mac:**
```bash
# Install with Homebrew
brew install ollama

# Or download from https://ollama.ai/download/mac
```

**Linux:**
```bash
# Install with curl
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 2. Download a Free Model
```bash
# Download Llama 3.2 (excellent for chat and reasoning)
ollama pull llama3.2

# Or try Mistral (great for conversations)
ollama pull mistral

# For creative design work:
ollama pull codellama
```

#### 3. Configure the Poker Game
Add this to your `.env` file:
```env
# Use Ollama instead of OpenAI
AI_PROVIDER=ollama
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
# Remove or comment out OpenAI settings:
# OPENAI_API_KEY=
```

#### 4. Start Ollama
```bash
# Start Ollama service
ollama serve

# In another terminal, test it
ollama run llama3.2 "Hello, can you help with poker strategy?"
```

#### 5. Start the Poker Game
```bash
npm start
```

✅ **Done!** You now have free AI-powered chat and cosmetic generation!

---

## 🎯 Option 2: Built-in Rule-Based AI (No Setup Required)

The poker game includes a smart rule-based system that works out of the box:

### Features:
- **Natural conversations** with pattern matching
- **Game-aware responses** based on poker context
- **Personality system** (friendly, expert, casual)
- **No installation** required
- **Always available** fallback

### Enable Rule-Based AI:
```env
# In your .env file
AI_PROVIDER=rules
# Or leave empty to auto-detect
```

---

## 🛠️ Option 3: Local Models (Advanced)

For technical users who want to run custom models:

### Setup Steps:
1. **Install Python ML libraries**
2. **Download free pre-trained models**
3. **Configure local model server**
4. **Update configuration**

### Example Setup:
```env
AI_PROVIDER=local
LOCAL_MODEL_PATH=./models/
```

---

## 📊 Comparison of Options

| Feature | Ollama | Rule-Based | Local Models |
|--------|--------|------------|-------------|
| **Cost** | FREE | FREE | FREE |
| **Setup Time** | 5 min | 0 min | 30+ min |
| **Quality** | Excellent | Good | Variable |
| **Privacy** | 100% Local | 100% Local | 100% Local |
| **Customization** | High | Medium | Very High |
| **Maintenance** | Low | None | High |

---

## 🎮 Testing Your Setup

### Test Chat Bot:
```bash
# Test the AI chat endpoint
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hi","user":"test","channel":"test"}'
```

### Test Cosmetic AI:
```bash
# Test cosmetic generation
curl -X POST http://localhost:3000/admin/ai/cosmetics/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"login":"test","preset":"neon","cosmeticTypes":["cardBack"]}'
```

---

## 🔧 Configuration Options

### Environment Variables:
```env
# AI Provider Selection
AI_PROVIDER=ollama          # or 'rules' or 'local'

# Ollama Configuration
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# OpenAI (optional - not needed for free setup)
# OPENAI_API_KEY=your_key_here
# AI_MODEL=gpt-4o-mini

# AI Settings
AI_MAX_TOKENS=1200
AI_TIMEOUT_MS=15000
```

### Model Recommendations:
- **llama3.2** (7B): Best all-around, great reasoning
- **mistral** (7B): Excellent for conversations
- **codellama** (7B): Good for technical/design tasks
- **phi3** (3.8B): Lightweight, fast responses

---

## 🚨 Troubleshooting

### Ollama Issues:
```bash
# Check if Ollama is running
curl http://127.0.0.1:11434/api/tags

# Restart Ollama
ollama serve

# Check available models
ollama list
```

### Memory Issues:
- Use smaller models (phi3, llama3.2:1b)
- Close other applications
- Increase system RAM if possible

### Performance Tips:
- Use SSD for faster model loading
- Keep Ollama running in background
- Choose appropriate model size for your hardware

---

## 💡 Pro Tips

1. **Start with Ollama** - Best balance of quality and ease of use
2. **Use llama3.2** - Excellent for both chat and design tasks
3. **Keep models updated** - `ollama pull llama3.2:latest`
4. **Monitor resources** - Check RAM usage with larger models
5. **Fallback ready** - Rule-based system always available

---

## 🎉 You're All Set!

With Ollama, you get:
- ✅ **Free AI-powered chat bot** with natural conversations
- ✅ **Free cosmetic generation** with creative designs  
- ✅ **100% privacy** - Everything runs locally
- ✅ **No API limits** - Generate as much as you want
- ✅ **No monthly fees** - Completely free forever

Enjoy your AI-enhanced poker game without any costs! 🎰
