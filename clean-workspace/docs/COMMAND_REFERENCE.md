# 🎯 Command Reference Guide - AI Control Center

## 🚀 **Quick Start Commands**

### **🎮 Development Environment**
```bash
npm run dev:simple    # Start everything (no terminal needed)
```

### **🎛️ AI Control Center**
```bash
# Open in browser
http://localhost:5173
```

---

## 📋 **Audio Generation Commands**

### **🎵 Background Music**
```bash
# Generate 30s of ambient music
POST /admin/audio/generate
{
  "type": "background_music",
  "mood": "tense",
  "duration": 30
}
```

### **🎲 Game Sounds**
```bash
# Generate card shuffle sound
POST /admin/audio/generate
{
  "type": "game_sound",
  "effect": "card_shuffle"
}
```

### **🎙️ Voice Lines**
```bash
# Generate dealer announcement
POST /admin/audio/generate
{
  "type": "voice_line",
  "character": "dealer",
  "text": "Welcome to table"
}
```

### **🌊 Ambient Soundscapes**
```bash
# Generate casino ambiance
POST /admin/audio/generate
{
  "type": "ambient_soundscape",
  "gameState": "normal"
}
```

### **📦 Audio Packages**
```bash
# Generate complete audio bundle
POST /admin/audio/generate
{
  "type": "audio_package",
  "gameState": "normal"
}
```

---

## 🎛️ **Queue Management**
```bash
# Check generation queue
GET /admin/audio/status
```

### **📁 Cache Management**
```bash
# Clear audio cache
POST /admin/audio/clear
```

---

## 🎯 **File Management**
```bash
# Get generated files
GET /admin/audio/files
```

---

## 🎛️ **Advanced Features**

### **🎛️ AI-Powered Generation**
- **Context-Aware**: Game state influences audio generation
- **Professional Quality**: High-quality audio output
- **Batch Processing**: Queue system for multiple generations
- **Smart Caching**: Automatic audio file caching

---

## 🎛️ **Quick Reference**

### **🎮 Daily Development**
```bash
npm run dev:simple
```

### **🎵 Audio Generation**
```bash
# Generate background music
POST /admin/audio/generate
{
  "type": "background_music",
  "mood": "tense",
  "duration": 30
}
```

### **🎲 Game Sounds**
```bash
# Generate card shuffle sound
POST /admin/audio/generate
{
  "type": "game_sound",
  "effect": "card_shuffle"
}
```

### **🎙️ Voice Lines**
```bash
# Generate dealer announcement
POST /admin/audio/generate
{
  "type": "voice_line",
  "character": "dealer",
  "text": "Welcome to table"
}
```

### **🌊 Ambient Soundscapes**
```bash
# Generate casino ambiance
POST /admin/audio/generate
{
  "type": "ambient_soundscape",
  "gameState": "normal"
}
```

### **📦 Audio Packages**
```bash
# Generate complete audio bundle
POST /admin/audio/generate
{
  "type": "audio_package",
  "gameState": "normal"
}
```

---

## 🎛️ **Advanced Features**

### **🎛️ AI-Powered Generation**
- **Context-Aware**: Game state influences audio generation
- **Professional Quality**: High-quality audio output
- **Batch Processing**: Queue system for multiple generations
- **Smart Caching**: Automatic audio file caching

---

## 🎛️ **Admin Endpoints**

### **📋 Audio Generation**
- **Background Music**: `/admin/audio/generate`
- **Game Sounds**: `/admin/audio/generate`
- **Voice Lines**: `/admin/audio/generate`
- **Ambient Soundscapes**: `/admin/audio/generate`
- **Audio Packages**: `/admin/audio/generate`

### **🎛️ Queue Management**
- **Status**: `/admin/audio/status`
- **Clear Cache**: `/admin/audio/clear`
- **Files**: `/admin/audio/files`

---

## 🎛️ **Terminal Access - NOT Required**

### **✅ Web-Based Interface**
- **Full Functionality**: All panels work through HTTP requests
- **No Terminal Needed**: Everything works via browser interface
- **AI Control Center URL**: `http://localhost:5173`

---

## 🎯 **Your New Workflow:**

### **For Daily Development:**
```bash
npm run dev:simple
```

### **For Audio Generation:**
```bash
# Generate background music
POST /admin/audio/generate
```

### **For Game Sounds:**
```bash
# Generate card shuffle sound
POST /admin/audio/generate
```

### **For Voice Lines:**
```bash
# Generate dealer announcement
POST /admin/audio/generate
```

### **For Ambient Soundscapes:**
```bash
# Generate casino ambiance
POST /admin/audio/generate
{
  "type": "ambient_soundscape",
  "gameState": "normal"
}
```

### **For Audio Packages:**
```bash
# Generate complete audio bundle
POST /admin/audio/generate
{
  "type": "audio_package",
  "gameState": "normal"
}
```

---

## 🎊 **Benefits:**

### **For You (Developer):**
- **Professional Audio System**: AI-powered background music generation
- **Immersive Gaming**: Dynamic soundscapes and game sounds
- **Voice Announcements**: Professional poker commentary
- **Easy Management**: All through web interface

### **For System Health:**
- **Analytics**: Prevents issues before they happen
- **Automation**: Reduces manual work
- **Training**: Improves AI over time

### **For User Experience:**
- **Enhanced Chat**: Better AI interaction
- **Service Management**: More control
- **Visual Insights**: Easier monitoring

---

## 🎉 **Result:**

### **✅ Complete Audio AI System:**
- **8 New Panels**: All with full functionality
- **AI-Powered Generation**: Context-aware audio creation
- **Multiple Deployment Methods**: Safe, Smart, Quick, AI-powered
- **Zero Terminal Access**: Web-based interface
- **Professional Features**: Background music, game sounds, voice lines, ambient soundscapes
- **Easy Management**: All through HTTP requests

**Your poker game now has professional-grade audio capabilities!** 🎵

**The AI Control Center at http://localhost:5173 is your complete command center for all audio generation needs!** 🚀
