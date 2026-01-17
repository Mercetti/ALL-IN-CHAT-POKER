# Audio + Coding Orchestrator Usage Guide

## 🎯 Overview

The `AudioCodingOrchestrator` is a TypeScript module that extends Acey's capabilities with specialized audio and coding generation while maintaining full integration with your existing orchestrator system.

## 🚀 Quick Start

### Installation & Setup

```typescript
import { AceyOrchestrator } from "./utils/orchestrator";
import { AudioCodingOrchestrator } from "./utils/audioCodingOrchestrator";

// Base orchestrator handles logging, simulation, multi-task
const base = new AceyOrchestrator({
  llmEndpoint: "https://your-llm-endpoint.com/generate",
  personaMode: "hype",
  autoApprove: true,
  simulationMode: true
});

// Audio + Coding orchestrator
const aceyTasks = new AudioCodingOrchestrator({ 
  baseOrchestrator: base,
  simulationMode: true,
  autoApprove: true,
  enableValidation: true,
  enableDatasetPrep: true
});
```

## 🎵 Audio Generation Examples

### Speech Generation (TTS)

```typescript
// Generate hype speech for poker game
const audioOutput = await aceyTasks.runTask("audio", "Generate hype TTS line for all-in play", {
  type: "speech",
  mood: "hype",
  lengthSeconds: 3,
  voice: "energetic",
  context: {
    player: "JohnDoe",
    pot: 500,
    chatExcitement: 8,
    gameState: "flop"
  }
});

console.log(audioOutput.speech);
// Output: "🎉 ALL-IN! JohnDoe goes all-in with 500 chips! The excitement is building!"
```

### Music Generation

```typescript
// Generate background music for subscriber notification
const musicOutput = await aceyTasks.runTask("audio", "Generate celebratory music for new subscriber", {
  type: "music",
  mood: "hype",
  lengthSeconds: 10,
  intensity: "high",
  format: "mp3",
  targetFileName: "subscriber_notification.mp3",
  context: {
    subscriberCount: 100,
    donationAmount: 25
  }
});
```

### Sound Effects

```typescript
// Generate victory sound effect
const effectOutput = await aceyTasks.runTask("audio", "Generate victory sound clip", {
  type: "effect",
  mood: "hype",
  lengthSeconds: 2,
  intensity: "medium",
  context: {
    player: "Alice",
    action: "won_pot"
  }
});
```

## 💻 Coding Generation Examples

### Bug Fix Generation

```typescript
// Generate TypeScript validation function
const codeOutput = await aceyTasks.runTask("website", "Create chat message validation function", {
  language: "typescript",
  description: "Validate chat messages for safe characters only",
  functionName: "validateChatMessage",
  inputs: "string message",
  outputs: "boolean isValid",
  maxLines: 30,
  validationRules: [
    { type: "security", rule: "No eval or Function usage", severity: "error" },
    { type: "style", rule: "Include JSDoc comments", severity: "warning" },
    { type: "performance", rule: "Use efficient string methods", severity: "info" }
  ],
  testCases: [
    {
      input: "Hello world!",
      expectedOutput: true,
      description: "Valid message should pass"
    },
    {
      input: "<script>alert('xss')</script>",
      expectedOutput: false,
      description: "XSS attempt should fail"
    },
    {
      input: "",
      expectedOutput: false,
      description: "Empty message should fail"
    }
  ]
});

console.log(codeOutput.speech);
// Output: "Generated TypeScript function validateChatMessage with comprehensive validation"
```

### Asset Automation Script

```typescript
// Generate Python script for image processing
const scriptOutput = await aceyTasks.runTask("website", "Create image conversion script", {
  language: "python",
  description: "Convert images to 512x512 PNG format while maintaining transparency",
  functionName: "convertImages",
  inputs: "string folderPath",
  outputs: "Array<string> convertedFiles",
  maxLines: 50,
  dependencies: ["PIL", "os", "path", "glob"],
  validationRules: [
    { type: "performance", rule: "Handle large batches efficiently", severity: "warning" },
    { type: "security", rule: "Validate file paths", severity: "error" }
  ]
});
```

### Website Component Generation

```typescript
// Generate React component
const componentOutput = await aceyTasks.runTask("website", "Create navigation component", {
  language: "typescript",
  framework: "react",
  description: "Responsive navigation component with mobile menu",
  functionName: "NavigationComponent",
  maxLines: 40,
  validationRules: [
    { type: "style", rule: "Use semantic HTML", severity: "warning" },
    { type: "performance", rule: "Optimize for mobile", severity: "info" }
  ]
});
```

## 🔄 Batch Processing

### Multiple Tasks

```typescript
// Process multiple tasks in parallel
const batchResults = await aceyTasks.runBatch([
  {
    taskType: "audio",
    prompt: "Generate welcome message for new player",
    context: {
      type: "speech",
      mood: "calm",
      lengthSeconds: 2,
      voice: "professional"
    }
  },
  {
    taskType: "audio",
    prompt: "Generate background music for waiting room",
    context: {
      type: "music",
      mood: "neutral",
      lengthSeconds: 15,
      intensity: "low"
    }
  },
  {
    taskType: "website",
    prompt: "Create player profile validation",
    context: {
      language: "typescript",
      description: "Validate player profile data",
      maxLines: 25
    }
  },
  {
    taskType: "website",
    prompt: "Generate CSS for responsive layout",
    context: {
      language: "css",
      description: "Mobile-first responsive styles",
      maxLines: 30
    }
  }
]);

console.log(`Processed ${batchResults.length} tasks successfully`);
```

## 🛡️ Validation Features

### Code Validation

```typescript
// Manual validation
const isValid = aceyTasks.validateCode({
  language: "typescript",
  description: "Test function",
  maxLines: 10
}, `
function test() {
  return "valid";
}
`);

console.log("Code is valid:", isValid); // true

// Invalid code example
const isInvalid = aceyTasks.validateCode({
  language: "typescript",
  description: "Test function",
  maxLines: 10
}, `
function test() {
  eval("malicious");
}
`);

console.log("Code is valid:", isInvalid); // false - security issue detected
```

### Audio Validation

```typescript
// Validate audio file
const audioValid = aceyTasks.validateAudio({
  type: "speech",
  mood: "hype",
  lengthSeconds: 3
}, "/path/to/generated/audio.mp3");

console.log("Audio is valid:", audioValid); // true if file exists and has valid format
```

## 📊 Dataset Management

### Dataset Statistics

```typescript
const stats = aceyTasks.getDatasetStats();
console.log("Dataset statistics:", stats);
// Output:
// {
//   "acey_audio.jsonl": { size: 1024, entries: 25 },
//   "acey_website.jsonl": { size: 2048, entries: 50 },
//   "acey_coding.jsonl": { size: 3072, entries: 75 }
// }
```

### Clear Datasets

```typescript
// Clear specific dataset
aceyTasks.clearDataset("audio");

// Clear all datasets
aceyTasks.clearDataset();
```

### Dataset Format

The generated JSONL files contain structured entries:

```jsonl
{"input":{"prompt":"Generate hype TTS line","context":{"type":"speech","mood":"hype"},"personaMode":"hype","timestamp":"2023-12-31T23:59:59.999Z"},"output":{"speech":"🎉 ALL-IN! JohnDoe goes all-in!","intents":[{"type":"audio_generation","confidence":0.9}],"metadata":{"taskType":"audio","taskCategory":"audio","generatedAt":"2023-12-31T23:59:59.999Z"}}}
```

## 🔧 Configuration Options

### Constructor Options

```typescript
interface AudioCodingOrchestratorOptions {
  baseOrchestrator: AceyOrchestrator;           // Required: Base orchestrator instance
  simulationMode?: boolean;                      // Default: true - Safe testing mode
  autoApprove?: boolean;                         // Default: true - Auto-approve filtered outputs
  datasetDir?: string;                           // Default: "./data/dataset"
  enableValidation?: boolean;                    // Default: true - Enable validation hooks
  enableDatasetPrep?: boolean;                   // Default: true - Prepare fine-tuning datasets
  maxDatasetSize?: number;                       // Default: 10000KB - Max dataset size
}
```

### Runtime Configuration Updates

```typescript
// Update configuration
aceyTasks.updateConfig({
  simulationMode: false,  // Switch to live mode
  autoApprove: false,    // Require manual approval
  enableValidation: true,
  maxDatasetSize: 20000  // Increase dataset size limit
});
```

### Statistics Monitoring

```typescript
const stats = aceyTasks.getStats();
console.log("Orchestrator stats:", stats);
// Output:
// {
//   orchestrator: { /* base orchestrator stats */ },
//   audioCoding: {
//     simulationMode: false,
//     autoApprove: false,
//     enableValidation: true,
//     enableDatasetPrep: true,
//     maxDatasetSize: 20000,
//     datasetStats: { /* dataset statistics */ }
//   }
// }
```

## 🎮 Integration Examples

### Game Engine Integration

```typescript
// In your game engine
import { AudioCodingOrchestrator } from "./utils/audioCodingOrchestrator";

class GameEngine {
  private aceyTasks: AudioCodingOrchestrator;
  
  constructor() {
    const baseOrchestrator = new AceyOrchestrator({
      llmEndpoint: process.env.LLM_ENDPOINT,
      personaMode: "hype"
    });
    
    this.aceyTasks = new AudioCodingOrchestrator({
      baseOrchestrator,
      simulationMode: process.env.NODE_ENV === "development"
    });
  }
  
  async handleAllIn(player: string, pot: number) {
    // Generate hype speech
    const audioOutput = await this.aceyTasks.runTask("audio", "All-in play, generate hype speech", {
      type: "speech",
      mood: "hype",
      lengthSeconds: 3,
      context: { player, pot, gameState: "all-in" }
    });
    
    // Send to TTS system
    this.ttsEngine.speak(audioOutput.speech);
    
    // Process any intents
    audioOutput.intents.forEach(intent => {
      if (intent.type === "audio_generation") {
        this.handleAudioIntent(intent);
      }
    });
  }
  
  async generateWebsiteFix(issue: string, context: any) {
    const codeOutput = await this.aceyTasks.runTask("website", `Fix: ${issue}`, {
      language: "typescript",
      description: issue,
      context,
      maxLines: 30,
      validationRules: [
        { type: "security", rule: "No eval usage", severity: "error" }
      ]
    });
    
    // Apply the fix
    await this.applyWebsiteFix(codeOutput.speech);
  }
}
```

### Stream Integration

```typescript
// In your streaming bot
class StreamBot {
  private aceyTasks: AudioCodingOrchestrator;
  
  async handleSubscriber(username: string, tier: string) {
    // Generate welcome audio
    const welcomeAudio = await this.aceyTasks.runTask("audio", "Generate subscriber welcome", {
      type: "speech",
      mood: "hype",
      lengthSeconds: 2,
      voice: "energetic",
      context: { subscriberCount: 1, username, tier }
    });
    
    // Generate notification sound
    const notificationSound = await this.aceyTasks.runTask("audio", "Generate subscriber notification sound", {
      type: "effect",
      mood: "hype",
      lengthSeconds: 1,
      intensity: "medium",
      context: { subscriberCount: 1, username }
    });
    
    // Play audio
    this.audioPlayer.play(welcomeAudio.speech);
    this.audioPlayer.play(notificationSound.speech);
  }
  
  async handleDonation(username: string, amount: number, message: string) {
    // Generate donation audio
    const donationAudio = await this.aceyTasks.runTask("audio", "Generate donation thank you", {
      type: "speech",
      mood: "hype",
      lengthSeconds: 4,
      voice: "enthusiastic",
      context: { donationAmount: amount, username, message }
    });
    
    // Generate celebration sound
    const celebrationSound = await this.aceyTasks.runTask("audio", "Generate celebration sound", {
      type: "effect",
      mood: "hype",
      lengthSeconds: 2,
      intensity: "high",
      context: { donationAmount: amount }
    });
    
    // Play audio
    this.audioPlayer.play(donationAudio.speech);
    this.audioPlayer.play(celebrationSound.speech);
  }
}
```

## 📈 Advanced Features

### Custom Validation Hooks

```typescript
// Extend validation with custom rules
class CustomAudioCodingOrchestrator extends AudioCodingOrchestrator {
  protected validateTask(taskType: TaskType, context: AceyTaskContext, output: AceyOutput): Promise<boolean> {
    // Call parent validation first
    const parentValid = await super.validateTask(taskType, context, output);
    if (!parentValid) return false;
    
    // Add custom validation
    if (taskType === "audio" && this.isAudioContext(context)) {
      const audioContext = context as AudioTaskContext;
      
      // Custom audio validation
      if (audioContext.lengthSeconds && audioContext.lengthSeconds > 10) {
        console.log("[CUSTOM] Audio too long for streaming");
        return false;
      }
      
      if (audioContext.mood === "hype" && audioContext.intensity === "high") {
        console.log("[CUSTOM] High-intensity hype audio requires manual review");
        return false;
      }
    }
    
    if (taskType === "coding" && this.isCodingContext(context)) {
      const codingContext = context as CodingTaskContext;
      
      // Custom coding validation
      if (codingContext.language === "python" && codingContext.dependencies?.includes("os")) {
        console.log("[CUSTOM] Python with os module requires security review");
        return false;
      }
    }
    
    return true;
  }
}
```

### Custom Dataset Preparation

```typescript
// Override dataset preparation for custom formatting
class CustomAudioCodingOrchestrator extends AudioCodingOrchestrator {
  protected async appendToDataset(
    taskType: TaskType, 
    prompt: string, 
    output: AceyOutput, 
    context: AceyTaskContext
  ): Promise<void> {
    // Custom dataset format
    const customEntry = {
      task_id: this.generateTaskId(),
      timestamp: new Date().toISOString(),
      task_type: taskType,
      category: this.getTaskCategory(taskType),
      persona_mode: this.orchestrator.personaMode,
      input: {
        prompt,
        context: this.sanitizeContext(context),
        metadata: {
          source: "acey_orchestrator",
          version: "1.0"
        }
      },
      output: {
        content: output.speech,
        intents: output.intents,
        confidence: this.calculateConfidence(output),
        validation_passed: true
      },
      feedback: {
        engagement_score: 0,
        quality_score: 0,
        user_rating: null
      }
    };
    
    // Write to custom dataset
    const filePath = path.join(this.datasetDir, `custom_${taskType}.jsonl`);
    const line = JSON.stringify(customEntry) + "\n";
    fs.appendFileSync(filePath, line);
  }
  
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private sanitizeContext(context: AceyTaskContext): any {
    // Remove sensitive information from context
    const sanitized = { ...context };
    
    // Remove personal data
    if (sanitized.context?.player) {
      sanitized.context.player = sanitized.context.player.substring(0, 3) + "***";
    }
    
    if (sanitized.context?.donationAmount) {
      sanitized.context.donationAmount = Math.min(sanitized.context.donationAmount, 100);
    }
    
    return sanitized;
  }
}
```

## 🚀 Production Deployment

### Environment Setup

```bash
# Set environment variables
export LLM_ENDPOINT="https://your-llm-endpoint.com/generate"
export PERSONA_MODE="hype"
export SIMULATION_MODE="false"
export AUTO_APPROVE="false"  # Production: require manual approval
```

### Monitoring Setup

```typescript
// Production monitoring
class ProductionAudioCodingOrchestrator extends AudioCodingOrchestrator {
  async runTask(taskType: TaskType, prompt: string, context: AceyTaskContext): Promise<AceyOutput> {
    const startTime = Date.now();
    
    try {
      const result = await super.runTask(taskType, prompt, context);
      
      // Production monitoring
      this.logMetrics(taskType, startTime, result);
      
      return result;
    } catch (error) {
      this.logError(taskType, error);
      throw error;
    }
  }
  
  private logMetrics(taskType: TaskType, startTime: number, result: AceyOutput): void {
    const duration = Date.now() - startTime;
    
    console.log(`[METRICS] ${taskType} task completed in ${duration}ms`);
    console.log(`[METRICS] Output length: ${result.speech.length} characters`);
    console.log(`[METRICS] Intents: ${result.intents.length}`);
    
    // Send to monitoring system
    this.monitoringService.trackTask(taskType, duration, result);
  }
  
  private logError(taskType: TaskType, error: Error): void {
    console.error(`[ERROR] ${taskType} task failed:`, error);
    
    // Send to error tracking
    this.errorTrackingService.trackError(taskType, error);
  }
}
```

## 🎉 Benefits

### ✅ **Full Integration**
- Works seamlessly with existing Acey orchestrator
- Maintains all logging and auto-rule functionality
- Compatible with simulation and dry-run modes

### ✅ **Audio Generation**
- Context-aware audio generation (game state, player info)
- Multiple audio types (speech, music, effects)
- Quality validation and format checking
- Automatic dataset preparation

### ✅ **Coding Generation**
- Safe code generation with security validation
- Multiple language support (TypeScript, Python, Bash, etc.)
- Automatic testing and validation
- Version control with metadata

### ✅ **Dataset Preparation**
- Automatic JSONL dataset generation
- Task-specific datasets for fine-tuning
- Quality filtering and confidence thresholds
- Size management and rotation

### ✅ **Safety Features**
- Comprehensive validation hooks
- Simulation mode for safe testing
- Auto-approval with filtering
- Error handling and logging

### ✅ **Production Ready**
- Batch processing capabilities
- Performance monitoring
- Configuration management
- Statistics and analytics

---

## 🎯 Ready to Use!

The AudioCodingOrchestrator provides a complete, production-ready solution for extending Acey's capabilities with audio and coding generation while maintaining full integration with your existing system.

**🚀 Start orchestrating:**
```typescript
// Setup base orchestrator
const base = new AceyOrchestrator({
  llmEndpoint: "https://your-llm-endpoint.com",
  personaMode: "hype",
  simulationMode: true
});

// Setup audio + coding orchestrator
const aceyTasks = new AudioCodingOrchestrator({ 
  baseOrchestrator: base,
  enableValidation: true,
  enableDatasetPrep: true
});

// Generate audio
const audio = await aceyTasks.runTask("audio", "Generate hype speech", {
  type: "speech",
  mood: "hype",
  context: { pot: 500 }
});

// Generate code
const code = await aceyTasks.runTask("website", "Create validation function", {
  language: "typescript",
  description: "Validate input",
  maxLines: 30
});

// Process batch
const results = await aceyTasks.runBatch([
  { taskType: "audio", prompt: "Welcome message", context: { type: "speech", mood: "calm" } },
  { taskType: "coding", prompt: "Validation function", context: { language: "typescript", description: "Validate input" } }
]);
```

Your Acey system now has enhanced audio and coding capabilities with full integration, validation, and dataset preparation! 🎵💻🎮
