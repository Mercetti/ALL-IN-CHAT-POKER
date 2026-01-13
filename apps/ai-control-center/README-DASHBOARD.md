# Audio + Coding Orchestrator Dashboard

A comprehensive React dashboard for managing Acey's Audio + Coding Orchestrator with dynamic task management, batch simulations, and real-time monitoring.

## 🚀 Features

### ✅ Core Functionality
- **Dynamic Task Management**: Add audio, coding, and graphics tasks on the fly
- **Batch Simulations**: Run multiple tasks in parallel or sequentially
- **Real-time Monitoring**: Live logs and status updates
- **Result Visualization**: Preview generated content with detailed metadata
- **Auto-approval System**: Configurable automatic result approval
- **Export Capabilities**: Download results as JSONL datasets

### 🎵 Audio Features
- **TTS Integration**: Generate speech from text prompts
- **Audio Preview**: Built-in audio player for generated content
- **Mood Control**: Different voice modes (hype, professional, casual)
- **Length Configuration**: Adjustable audio duration

### 💻 Coding Features
- **Multi-language Support**: TypeScript, JavaScript, React, etc.
- **Code Generation**: Dynamic component and function creation
- **Framework Integration**: React, Vue, Angular support
- **Code Preview**: Syntax-highlighted code display

### 🎨 Graphics Features
- **Sprite Generation**: Create game assets and graphics
- **Style Options**: Pixel art, realistic, cartoon styles
- **Dimension Control**: Configurable output sizes
- **Format Support**: PNG, SVG, WebP export

## 📦 Installation

```bash
# Install dependencies
npm install react react-dom

# Copy the dashboard files to your project
cp -r src/components src/utils src/examples /your-project/src/
```

## 🔧 Quick Start

```tsx
import React from "react";
import { AudioCodingDashboard } from "./components/AudioCodingDashboard";
import { AceyOrchestrator } from "./utils/orchestrator";

const App: React.FC = () => {
  const orchestrator = new AceyOrchestrator({
    llmEndpoint: "https://your-llm-endpoint.com/generate",
    personaMode: "hype",
    autoApprove: true,
    simulationMode: true
  });

  return <AudioCodingDashboard orchestrator={orchestrator} />;
};

export default App;
```

## 🎛️ Configuration

### Orchestrator Options

```typescript
interface OrchestratorConfig {
  llmEndpoint: string;           // LLM API endpoint
  personaMode?: 'hype' | 'professional' | 'casual';
  autoApprove?: boolean;         // Auto-approve results
  simulationMode?: boolean;       // Dry-run mode
  maxConcurrentTasks?: number;    // Max parallel tasks
  timeout?: number;              // Request timeout (ms)
}
```

### Dashboard Settings

- **Auto-approve**: Enable/disable automatic result approval
- **Simulation mode**: Run in dry-run mode for testing
- **Task filtering**: Filter results by task type
- **Log management**: Real-time log streaming with color coding

## 📊 Usage Examples

### Adding Audio Tasks

```typescript
// Audio task with speech context
const audioTask = {
  taskType: 'audio',
  prompt: 'Welcome to the stream!',
  context: {
    type: 'speech',
    mood: 'hype',
    lengthSeconds: 3,
    voice: 'default'
  }
};
```

### Adding Coding Tasks

```typescript
// Coding task with React component
const codingTask = {
  taskType: 'website',
  prompt: 'Create a user profile component',
  context: {
    language: 'typescript',
    framework: 'react',
    maxLines: 30
  }
};
```

### Adding Graphics Tasks

```typescript
// Graphics task for sprite generation
const graphicsTask = {
  taskType: 'graphics',
  prompt: 'Create a poker chip sprite',
  context: {
    type: 'sprite',
    dimensions: '512x512',
    style: 'pixel-art'
  }
};
```

## 🔍 Monitoring & Logs

### Real-time Logs
- **Info**: General operation messages
- **Warn**: Non-critical warnings
- **Error**: Critical errors and failures
- **Debug**: Detailed debugging information

### Task Status Tracking
- **Pending**: Task queued but not started
- **Running**: Task currently processing
- **Completed**: Task finished successfully
- **Failed**: Task encountered an error

### Performance Metrics
- **Processing Time**: Time per task
- **Success Rate**: Percentage of successful tasks
- **Batch Statistics**: Overall batch performance
- **Type Breakdown**: Performance by task type

## 🎯 Advanced Features

### Batch Processing
```typescript
// Process multiple tasks in parallel
const tasks = [audioTask, codingTask, graphicsTask];
const results = await orchestrator.runBatch(tasks);
```

### Custom Validation
```typescript
// Validate tasks before processing
const validation = await orchestrator.validateTask(task);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Export Results
```typescript
// Export simulation results as JSONL
const jsonl = results.map(r => JSON.stringify(r)).join('\n');
downloadFile('results.jsonl', jsonl);
```

## 🎨 Customization

### Theming
The dashboard supports light/dark themes with Tailwind CSS classes. Modify the CSS classes in the component to match your brand.

### Extensions
- **Custom Task Types**: Add new task types by extending the schema
- **Additional Outputs**: Support for video, 3D models, etc.
- **Integrations**: Connect to external services and APIs
- **WebSockets**: Live streaming of results and logs

## 🔧 Development

### File Structure
```
src/
├── components/
│   └── AudioCodingDashboard.tsx    # Main dashboard component
├── utils/
│   ├── orchestrator.ts              # Core orchestrator logic
│   ├── audioCodingOrchestrator.ts   # Batch processing
│   └── schema.ts                    # Type definitions
└── examples/
    └── DashboardExample.tsx         # Usage example
```

### TypeScript Support
Full TypeScript support with comprehensive type definitions:
- Task interfaces
- Result schemas
- Configuration types
- Validation schemas

## 🚀 Deployment

### Production Setup
```typescript
const productionOrchestrator = new AceyOrchestrator({
  llmEndpoint: process.env.LLM_ENDPOINT!,
  personaMode: 'professional',
  autoApprove: false,  // Manual approval in production
  simulationMode: false,
  maxConcurrentTasks: 5,
  timeout: 60000
});
```

### Environment Variables
```bash
LLM_ENDPOINT=https://api.example.com/generate
DASHBOARD_THEME=light
AUTO_APPROVE=false
MAX_CONCURRENT_TASKS=5
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the examples in the `examples/` directory

---

**Built with ❤️ for the Acey AI Assistant Platform**
