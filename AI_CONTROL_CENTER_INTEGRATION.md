# AI Control Center Integration Guide

## 🎯 Overview

Your Acey poker game system is now integrated with the AI Control Center! This provides:

- **Auto-Rule Processing**: Automatic filtering and modification of Acey's intents
- **Simulation Dashboard**: Real-time monitoring and testing interface  
- **Deterministic Control**: Predictable, reversible, and logged operations
- **Enhanced Safety**: All Acey actions go through the Control Center first

## 🚀 Quick Start

### Method 1: Use the Startup Script
```bash
# Run the integrated startup script
start-with-ai-control-center.bat
```

### Method 2: Manual Startup
```bash
# Terminal 1: Start AI Control Center
cd acey-control-center
npm run dev

# Terminal 2: Start Poker Game Server  
node server.js

# Terminal 3: Test integration
node test-acey-integration.js
```

## 📊 Access Points

- **AI Control Center**: http://localhost:3001
- **Poker Game Server**: http://localhost:8080  
- **Test Client**: `acey-control-center/test-client.html`
- **Simulation Dashboard**: Available in Control Center

## 🔗 How Integration Works

### Data Flow
1. **Chat/Game Events** → Acey Engine → AceyBridge → AI Control Center
2. **Auto-Rules Applied** → Modified/Filtered Intents → Back to Acey
3. **Logging & Monitoring** → All actions recorded in Control Center

### Key Integration Points

#### 1. Chat Messages (`server.js` lines 602-631)
```javascript
// Chat messages are converted to memory proposals
const aceyOutput = {
  speech: data.message || data.text || '',
  intents: [{
    type: "memory_proposal",
    scope: "event", 
    summary: `Chat: ${message}`,
    confidence: 0.8,
    ttl: "1h"
  }]
};
```

#### 2. Game Events (`server.js` lines 634-669)
```javascript
// Game events create memory proposals + trust signals
const aceyOutput = {
  speech: `Game event: ${type} by ${player}`,
  intents: [
    {
      type: "memory_proposal",
      scope: "event",
      summary: `Game: ${type} - ${player}`,
      confidence: 0.9,
      ttl: "2h"
    },
    {
      type: "trust_signal", 
      delta: type === 'all-in' ? 0.1 : 0.05,
      reason: `Game engagement: ${type}`,
      reversible: true
    }
  ]
};
```

## 🛡️ Auto-Rules in Action

### Memory Rules
- **Low Confidence Rejection**: < 40% confidence blocked
- **TTL Limits**: Prevents overly long storage
- **Duplicate Detection**: Avoids redundant memories

### Trust Rules  
- **Delta Throttling**: Limits trust changes per time window
- **Bounds Checking**: Keeps trust values in valid range

### Persona Rules
- **Lock Enforcement**: Prevents unauthorized persona changes
- **Frequency Limits**: Avoids rapid persona switching

### Moderation Rules
- **Severity Filtering**: Only processes significant moderation events
- **Frequency Limits**: Prevents spam moderation suggestions

## 🧪 Testing the Integration

### 1. Health Checks
```bash
# AI Control Center
curl http://localhost:3001/health

# Main Server  
curl http://localhost:8080/health
```

### 2. Manual Test via HTTP
```bash
# Send test data to Control Center
curl -X POST http://localhost:3001/process \
  -H "Content-Type: application/json" \
  -d '{"speech":"Test!","intents":[{"type":"memory_proposal","scope":"event","summary":"Test","confidence":0.9,"ttl":"1h"}]}'
```

### 3. Test Client
Open `acey-control-center/test-client.html` in your browser for interactive testing.

### 4. Integration Test
```bash
node test-acey-integration.js
```

## 📈 Monitoring

### Simulation Dashboard Features
- **Event Filtering**: Filter by intent type
- **Statistics Panel**: Real-time metrics and analytics
- **Model Comparison**: A/B testing capabilities
- **Replay Controls**: Step through events
- **Export Functionality**: Download simulation data

### Key Metrics
- Total events processed
- Average confidence scores  
- Auto-rule applications
- Rejections and modifications
- Event type distribution

## 🔧 Configuration

### Bridge Settings (`server.js` lines 586-591)
```javascript
aceyBridge = new AceyBridge({
  controlCenterUrl: 'http://localhost:3001',
  aceySystemUrl: 'http://localhost:8080',
  autoRulesEnabled: true,        // Enable/disable auto-rules
  dryRunMode: false             // Set true for testing only
});
```

### Auto-Rule Configuration
Modify the rule parameters in the bridge initialization:
```javascript
const ruleResults = applyAutoRules(data, {
  memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true },
  persona: { lockCheck: true, frequencyLimit: true },
  trust: { deltaThrottle: true, boundsCheck: true },
  moderation: { severityFilter: true, frequencyLimit: true }
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Bridge Connection Failed**
   - Ensure AI Control Center is running on port 3001
   - Check firewall settings
   - Verify no port conflicts

2. **Auto-Rules Not Working**
   - Check `autoRulesEnabled: true` in bridge config
   - Verify intent structure matches expected format
   - Check Control Center logs for rule applications

3. **Missing Events in Dashboard**
   - Ensure WebSocket connections are established
   - Check browser console for connection errors
   - Verify event filtering settings

### Debug Mode
Set `dryRunMode: true` to test without affecting live data:
```javascript
dryRunMode: true  // Logs actions but doesn't execute
```

## 🎮 Usage Examples

### Chat Message Processing
1. User sends chat: "All-in! This is amazing!"
2. Acey converts to memory proposal (confidence: 0.8)
3. Bridge sends to Control Center
4. Auto-rules check: confidence > 0.4 ✓, TTL reasonable ✓
5. Intent approved and stored
6. Response sent back to Acey

### Game Event Processing  
1. Player goes all-in
2. Acey creates game event intent
3. Bridge adds trust signal (+0.1) + memory proposal
4. Auto-rules check: trust delta within bounds ✓
5. Trust updated, memory stored
6. Game continues with enhanced context

## 🔄 Fallback Behavior

If the AI Control Center is unavailable:
- All Acey functions continue working normally
- Chat and game events processed locally
- Error logged but no interruption to gameplay
- Automatic reconnection attempts when Control Center returns

## 📝 Logging

All integration events are logged:
- Bridge connections/disconnections
- Auto-rule applications and rejections  
- Intent modifications
- Error conditions with fallbacks

Check server console for real-time integration status.

---

🎉 **Your Acey system is now enhanced with AI Control Center capabilities!**

The integration maintains full backward compatibility while adding powerful new control, monitoring, and safety features.
