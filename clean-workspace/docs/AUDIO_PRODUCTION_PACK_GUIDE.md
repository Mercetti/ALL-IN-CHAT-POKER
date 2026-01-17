# 🎧 All-In Chat Poker — Audio System Production Pack

## 📋 **File Naming Conventions (Dev-Safe & Scalable)**

### **General Rules**
- ✅ **Lowercase only**
- ✅ **Hyphens, not underscores**
- ✅ **No spaces**
- ✅ **No version numbers** (handled in metadata)
- ✅ **Format: .ogg primary, .mp3 fallback**

### **🎶 Music Files**
**Format:** `music-{category}-{mood}-{tempo}-{loop}.ogg`

**Examples:**
```
music-ambient-lounge-slow-loop.ogg
music-ambient-highstakes-medium-loop.ogg
music-tension-riser-fast-once.ogg
```

### **🔊 Sound Effects**
**Format:** `sfx-{action}-{variation}.ogg`

**Examples:**
```
sfx-card-shuffle-01.ogg
sfx-card-deal-02.ogg
sfx-chip-stack-01.ogg
```

### **🎯 Event Stingers**
**Format:** `stinger-{event}-{intensity}.ogg`

**Examples:**
```
stinger-allin-heavy.ogg
stinger-win-big.ogg
stinger-loss-soft.ogg
```

### **🎤 Dealer / Voice FX**
**Format:** `voice-dealer-{phrase}-{style}.ogg`

**Examples:**
```
voice-dealer-allin-calm.ogg
voice-dealer-showdown-hype.ogg
```

### **🧨 Viewer Trigger Sounds**
**Format:** `viewer-{trigger}-{style}.ogg`

**Examples:**
```
viewer-hype-cheer.ogg
viewer-gasp-dramatic.ogg
```

---

## 📝 **Music Pack Checklist (Creator-Friendly)**

### **🎵 Music**
- [ ] **Ambient idle loop** (30–60s)
- [ ] **High-stakes loop** (30–60s)
- [ ] **Tension riser** (10–15s)
- [ ] **Seamless looping tested**
- [ ] **Loudness normalized** (-16 LUFS)

### **🔊 Core SFX**
- [ ] **Card shuffle**
- [ ] **Card deal**
- [ ] **Chip stack**
- [ ] **Bet confirm**
- [ ] **Timer tick**

### **🎯 Event Stingers**
- [ ] **All-In**
- [ ] **Small win**
- [ ] **Big win**
- [ ] **Loss**

### **🎤 Optional (Partner+)**
- [ ] **Dealer voice lines**
- [ ] **Stream-branded FX**
- [ ] **Viewer trigger sounds**

### **🛡️ Compliance**
- [ ] **DMCA-safe confirmed**
- [ ] **No copyrighted samples**
- [ ] **Commercial use cleared**

---

## 🔄 **Chat SFX Cooldown Logic (Clean & Abuse-Safe)**

### **Design Goals**
- ✅ **Prevent spam**
- ✅ **Fair for all viewers**
- ✅ **Streamer-controlled**
- ✅ **Lightweight server logic**

### **Recommended Rules**
```javascript
const GLOBAL_COOLDOWN = 5000;  // 5 seconds
const USER_COOLDOWN = 30000;   // 30 seconds

function canTriggerSFX(userId, soundId) {
  const now = Date.now();

  if (now - lastGlobalTrigger[soundId] < GLOBAL_COOLDOWN) {
    return false;
  }

  if (now - lastUserTrigger[userId] < USER_COOLDOWN) {
    return false;
  }

  lastGlobalTrigger[soundId] = now;
  lastUserTrigger[userId] = now;
  return true;
}
```

### **🎛️ Streamer Controls**
- **Enable / Disable viewer sounds**
- **Adjust cooldowns**
- **Partner-only triggers**
- **Emergency mute button**

---

## 📚 **Partner Documentation (Copy-Ready)**

### **Audio Features by Partner Tier**

#### **🎮 Affiliate**
- Standard ambient music
- Core sound effects
- Event stingers
- Full audio control panel

#### **🎥 Partner**
- Additional music themes
- Custom All-In stingers
- Stream-branded table sounds
- Viewer reward audio drops

#### **👑 Premier (Invite-Only)**
- Custom branded music packs
- Dealer voice effects
- Tournament-exclusive audio
- Early access to new audio content
- Co-branded event stingers

### **Partner Audio Guidelines**
- ✅ **All audio is DMCA-safe**
- ✅ **No third-party music uploads**
- ✅ **Audio must not mislead gameplay**
- ✅ **Viewer triggers subject to cooldowns**
- ✅ **All audio features are cosmetic only**

---

## 📢 **Marketing Copy (Short + Long)**

### **🔥 Short Landing-Page Blurb**
```
Immersive, DMCA-Safe Audio

All-In Chat Poker features built-in music and sound effects designed specifically for live streaming. Every sound is 100% DMCA-safe, fully customizable, and streamer-controlled — no copyright strikes, no distractions.
```

### **🎶 Feature Section Copy**
```
Sound That Reacts to the Game

From subtle ambient music to high-stakes All-In stingers, audio in All-In Chat Poker enhances the moment without overpowering the stream. Streamers can enable, customize, or disable audio at any time — keeping full control.
```

### **🎥 Partner Highlight Copy**
```
Partner-Exclusive Audio Customization

Unlock custom music themes, branded sound effects, and viewer audio rewards as a Partner or Premier creator. Stand out with a table that sounds as unique as your stream.
```

### **🛡️ Trust Line**
```
All audio is original or licensed for commercial streaming use.
```

---

## 🚀 **Implementation Quick Start**

### **1. Generate Production Pack**
```bash
# Generate affiliate pack
curl -X POST http://localhost:3000/admin/audio/generate/production-pack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"packName": "affiliate-pack-v1", "tier": "affiliate"}'

# Generate partner pack
curl -X POST http://localhost:3000/admin/audio/generate/production-pack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"packName": "partner-pack-v1", "tier": "partner"}'
```

### **2. Verify Production Files**
```bash
# List production packs
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/admin/audio/production-packs

# Get pack details
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/admin/audio/production-pack/affiliate-pack-v1
```

### **3. Test Cooldown System**
```bash
# Test viewer trigger with cooldowns
curl -X POST http://localhost:3000/api/audio/trigger/viewer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"soundName": "viewer-hype-cheer", "viewerId": "test123"}'
```

### **4. Configure Cooldown Settings**
```bash
# Update cooldown settings
curl -X POST http://localhost:3000/admin/audio/cooldown-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"globalCooldown": 3000, "userCooldown": 20000}'
```

### **5. Emergency Controls**
```bash
# Toggle emergency mute
curl -X POST http://localhost:3000/admin/audio/emergency-mute \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 **API Endpoints Reference**

### **Production Management**
- **`POST /admin/audio/generate/production-pack`** - Generate production pack
- **`GET /admin/audio/production-packs`** - List all production packs
- **`GET /admin/audio/production-pack/:packName`** - Get pack details
- **`POST /admin/audio/cooldown-settings`** - Update cooldown settings
- **`POST /admin/audio/emergency-mute`** - Emergency mute toggle

### **Public Access**
- **`GET /api/audio/partner-docs`** - Partner documentation
- **`GET /api/audio/marketing-copy`** - Marketing materials
- **`POST /api/audio/trigger/viewer`** - Viewer sound triggers

---

## 🎯 **What This Unlocks for You**

### **✅ Faster Dev Implementation**
- Standardized naming conventions
- Production-ready file structure
- Automated compliance checks
- Scalable architecture

### **✅ Clear Partner Expectations**
- Tier-based feature documentation
- Copy-ready partner guidelines
- Marketing materials included
- Compliance guarantees

### **✅ Safer Streaming Experience**
- 100% DMCA-safe audio
- Streamer-controlled defaults
- Emergency mute capabilities
- Abuse-safe cooldown system

### **✅ Future Monetization Paths**
- Tier-based audio unlocks
- Custom branding opportunities
- Partner exclusives
- Premium features

### **✅ Strong Brand Identity**
- Professional audio quality
- Consistent naming standards
- Production-ready assets
- Marketing-ready copy

---

## 📁 **Generated File Structure**

### **Production Pack Example:**
```
public/assets/audio/
├── packs/
│   └── affiliate-pack-v1.json
├── music/
│   ├── music-ambient-lounge-slow-loop.ogg
│   ├── music-ambient-highstakes-medium-loop.ogg
│   └── music-tension-riser-fast-once.ogg
├── sfx/
│   ├── sfx-card-shuffle-01.ogg
│   ├── sfx-card-deal-02.ogg
│   ├── sfx-chip-stack-01.ogg
│   ├── sfx-chip-bet-01.ogg
│   └── sfx-timer-tick-01.ogg
├── stinger/
│   ├── stinger-allin-heavy.ogg
│   ├── stinger-win-big.ogg
│   ├── stinger-win-small.ogg
│   └── stinger-loss-soft.ogg
└── compliance/
    └── affiliate-pack-v1-compliance.json
```

---

## 🎉 **Production Pack Benefits**

### **🛡️ Compliance Guaranteed**
- Automated DMCA checks
- Commercial use verification
- Loudness normalization
- Format standardization

### **📈 Scalable Architecture**
- Consistent naming conventions
- Tier-based access control
- Production-ready metadata
- Future-proof structure

### **🎮 Developer Friendly**
- Clear file organization
- Standardized API access
- Comprehensive documentation
- Quick-start guides

### **💰 Partner Ready**
- Tier-based feature sets
- Marketing materials included
- Compliance documentation
- Brand customization support

---

## 🚀 **You're Production Ready!**

Your poker game now has a **complete production audio system** that:

1. **Follows Professional Standards**: Industry naming conventions
2. **Guarantees Compliance**: 100% DMCA-safe with verification
3. **Prevents Abuse**: Smart cooldown system with emergency controls
4. **Scales Gracefully**: Tier-based architecture for growth
5. **Partners Effectively**: Complete documentation and marketing
6. **Produces Quality**: Professional audio with loudness normalization

**Start generating production packs and scale your audio system with confidence!** 🎰🎧✨
