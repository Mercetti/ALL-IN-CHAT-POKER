# Acey Orchestration Module Guide

## 🎯 Overview

The `AceyOrchestrator` is the main interface for running Acey tasks through the complete LLM fine-tuning and logging pipeline. It handles all LLM calls, applies auto-rules, logs interactions, and executes tasks safely.

## 🚀 Quick Start

### Installation
The orchestrator is already integrated into your AI Control Center. No additional installation needed.

### Basic Usage

```typescript
import { AceyOrchestrator } from "./src/server/utils/orchestrator";

// Initialize orchestrator
const acey = new AceyOrchestrator({
  llmEndpoint: "https://your-llm-endpoint.com/generate",
  personaMode: "hype",
  autoApprove: true,
  simulationMode: false
});

// Single task example
const gameOutput = await acey.runTask("game", "All-in play, generate hype speech", { 
  pot: 500, 
  players: 6 
});
console.log(gameOutput.speech);

// Batch task example
const batchResults = await acey.runBatch([
  { taskType: "game", prompt: "All-in call", context: { pot: 1000 } },
  { taskType: "graphics", prompt: "Generate neon badge", context: { subTier: 1 } },
  { taskType: "audio", prompt: "Victory sound clip", context: { intensity: "high" } }
]);
console.log(batchResults);
```

## 📋 Configuration Options

### OrchestratorOptions
```typescript
interface OrchestratorOptions {
  llmEndpoint: string;           // 3rd-party LLM endpoint (required)
  personaMode?: PersonaMode;     // Default persona mode ("calm" | "hype" | "neutral" | "locked")
  autoApprove?: boolean;         // Auto-approve filtered outputs (default: true)
  simulationMode?: boolean;      // No execution, just simulation (default: false)
  dryRunMode?: boolean;          // Apply rules but don't execute (default: false)
  retryAttempts?: number;        // Retry attempts for failed calls (default: 3)
  timeout?: number;             // Request timeout in ms (default: 30000)
}
```

### Task Types
- `"game"` - Poker game commentary and interactions
- `"website"` - Website management and fixes
- `"graphics"` - Graphics and cosmetic generation
- `"audio"` - Audio generation and sound effects
- `"moderation"` - Content moderation and safety
- `"memory"` - Memory storage and retrieval
- `"trust"` - Trust score calculations
- `"persona"` - Persona mode management

## 🔧 Advanced Features

### 1. Simulation Mode
Test without affecting live system:
```typescript
const acey = new AceyOrchestrator({
  llmEndpoint: "https://api.openai.com/v1/chat/completions",
  simulationMode: true  // No actual execution
});

const result = await acey.runTask("game", "Test message", {});
// Logs will show: "[Simulation] Task processed, no execution performed"
```

### 2. Dry-Run Mode
Apply rules but don't execute:
```typescript
const acey = new AceyOrchestrator({
  llmEndpoint: "https://api.openai.com/v1/chat/completions",
  dryRunMode: true  // Rules applied, but no execution
});
```

### 3. Manual Approval
Require manual approval for filtered outputs:
```typescript
const acey = new AceyOrchestrator({
  llmEndpoint: "https://api.openai.com/v1/chat/completions",
  autoApprove: false  // Manual approval required
});
```

### 4. Batch Processing
Process multiple tasks efficiently:
```typescript
const tasks = [
  { taskType: "game", prompt: "Welcome message", context: { newPlayer: true } },
  { taskType: "graphics", prompt: "Player avatar", context: { player: "John" } },
  { taskType: "audio", prompt: "Background music", context: { mood: "exciting" } }
];

const results = await acey.runBatch(tasks);
// Processes in parallel with concurrency limits
```

## 🔄 Integration with Existing Systems

### Game Engine Integration
```typescript
// In your game engine
const acey = new AceyOrchestrator({
  llmEndpoint: process.env.LLM_ENDPOINT,
  personaMode: "hype",
  simulationMode: process.env.NODE_ENV === "development"
});

// Handle chat messages
socket.on('chatMessage', async (data) => {
  try {
    const output = await acey.runTask("game", data.message, {
      gameState: getCurrentGameState(),
      player: data.player
    });
    
    // Send to TTS system
    ttsEngine.speak(output.speech);
    
    // Process any game intents
    output.intents.forEach(intent => {
      if (intent.type === "trust_signal") {
        updateTrustScore(intent.delta);
      }
    });
    
  } catch (error) {
    console.error("Acey task failed:", error);
  }
});
```

### Website Management
```typescript
// In your website backend
const acey = new AceyOrchestrator({
  llmEndpoint: process.env.LLM_ENDPOINT,
  personaMode: "neutral"
});

// Handle website issues
app.post('/api/website/fix', async (req, res) => {
  const { issue, context } = req.body;
  
  try {
    const output = await acey.runTask("website", `Fix: ${issue}`, context);
    
    // Apply the fix
    await applyWebsiteFix(output.speech);
    
    res.json({ success: true, fix: output.speech });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 📊 Monitoring and Logging

All orchestrator interactions are automatically logged:

### What Gets Logged
- **Task Details**: Type, prompt, context
- **LLM Response**: Raw output and processing time
- **Auto-Rule Decisions**: Approved, modified, or rejected
- **Execution Results**: Final actions taken
- **Performance Metrics**: Response time, cost, token count

### Viewing Logs
```bash
# Get recent logs
curl http://localhost:8080/api/logs?limit=10

# Get statistics
curl http://localhost:8080/api/logs/stats

# Filter by task type
curl http://localhost:8080/api/logs?taskType=game
```

## 🛡️ Safety Features

### Auto-Rule Integration
- **Confidence Filtering**: Rejects low-confidence outputs
- **Moderation Checks**: Blocks inappropriate content
- **Trust Bounds**: Limits trust score changes
- **Persona Locks**: Prevents unauthorized persona changes

### Error Handling
- **Automatic Retries**: Configurable retry attempts with exponential backoff
- **Graceful Degradation**: System continues working if logging fails
- **Fallback Responses**: Default actions when LLM calls fail

### Performance Optimization
- **Batch Processing**: Parallel execution with concurrency limits
- **Token Estimation**: Cost tracking and optimization
- **Timeout Protection**: Prevents hanging requests

## 🎮 Task-Specific Examples

### Game Commentary
```typescript
const gameOutput = await acey.runTask("game", "Player went all-in with 500 chips", {
  pot: 1200,
  players: 6,
  stage: "flop",
  previousActions: ["check", "raise", "fold"]
});

// Output: speech with hype commentary, trust signals, memory proposals
```

### Graphics Generation
```typescript
const graphicsOutput = await acey.runTask("graphics", "Create victory badge for subscriber", {
  player: "JohnDoe",
  tier: "subscriber",
  colors: ["blue", "gold"],
  style: "neon"
});

// Output: description for graphics generation system
```

### Audio Generation
```typescript
const audioOutput = await acey.runTask("audio", "Generate victory fanfare", {
  intensity: "high",
  duration: "5s",
  instruments: ["trumpet", "drums"],
  mood: "celebratory"
});

// Output: script for audio generation system
```

## 🔧 Configuration Examples

### Development Environment
```typescript
const devAcey = new AceyOrchestrator({
  llmEndpoint: "http://localhost:8080/mock-llm",
  personaMode: "neutral",
  simulationMode: true,  // Safe for development
  autoApprove: true,
  retryAttempts: 1
});
```

### Production Environment
```typescript
const prodAcey = new AceyOrchestrator({
  llmEndpoint: "https://api.openai.com/v1/chat/completions",
  personaMode: "hype",
  simulationMode: false,  // Live execution
  autoApprove: true,
  retryAttempts: 3,
  timeout: 30000
});
```

### Testing Environment
```typescript
const testAcey = new AceyOrchestrator({
  llmEndpoint: "https://test-llm.example.com/generate",
  personaMode: "calm",
  dryRunMode: true,     // Apply rules but don't execute
  autoApprove: false,   // Manual approval for testing
  retryAttempts: 5
});
```

## 🚨 Troubleshooting

### Common Issues

1. **LLM Endpoint Not Responding**
   ```typescript
   // Add timeout and retry configuration
   const acey = new AceyOrchestrator({
     llmEndpoint: "https://your-endpoint.com",
     timeout: 60000,        // 60 second timeout
     retryAttempts: 5      // More retries
   });
   ```

2. **Auto-Rules Rejecting Everything**
   ```typescript
   // Check logs for rejection reasons
   const logs = await fetch('/api/logs?controlDecision=rejected');
   console.log('Rejections:', logs);
   ```

3. **Performance Issues**
   ```typescript
   // Use batch processing for multiple tasks
   const results = await acey.runBatch(largeTaskArray);
   // Monitor performance metrics in logs
   ```

### Debug Mode
```typescript
// Enable detailed logging
const acey = new AceyOrchestrator({
  llmEndpoint: "https://your-endpoint.com",
  simulationMode: true,  // Safe debugging
  autoApprove: false   // See all decisions
});

// Check orchestrator status
console.log(acey.getStats());
```

## 📈 Best Practices

1. **Always Use Simulation in Development**
   - Test with `simulationMode: true` before going live
   - Verify auto-rule decisions in dry-run mode

2. **Monitor Performance**
   - Check response times and costs in logs
   - Use batch processing for multiple tasks

3. **Handle Errors Gracefully**
   - Wrap orchestrator calls in try-catch blocks
   - Provide fallback responses for failed tasks

4. **Configure Appropriately**
   - Use different persona modes for different contexts
   - Adjust retry attempts based on LLM reliability

5. **Log Analysis**
   - Regularly review auto-rule decisions
   - Monitor rejection rates and adjust thresholds

---

## 🎉 Ready to Use!

The Acey Orchestration Module provides a complete, production-ready interface for running Acey tasks through your fine-tuning pipeline. It handles everything from LLM calls to execution, with built-in safety, monitoring, and optimization features.

**Start integrating today:**
```typescript
import { AceyOrchestrator } from "./src/server/utils/orchestrator";

const acey = new AceyOrchestrator({
  llmEndpoint: "your-llm-endpoint",
  personaMode: "hype"
});

// Your first Acey task!
const result = await acey.runTask("game", "Hello poker world!", {});
```
