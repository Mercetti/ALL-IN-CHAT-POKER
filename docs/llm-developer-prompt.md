# 🤖 LLM Developer Prompt for Acey Auto-Generation

## 🎯 Objective

Generate a complete TypeScript / React codebase for Acey's self-learning AI Control Center, supporting multi-task management, dashboards, continuous learning, and real-time fine-tuning.

## 📁 Project Structure

```
/src
  /client
    /components
      - AceyControlCenter.tsx
      - InteractiveAceyDashboard.tsx
  /server
    /utils
      - orchestrator.ts
      - audioCodingOrchestrator.ts
      - continuousLearning.ts
      - realtimeFineTune.ts
      - schema.ts
  /data
    /datasets/
      /audio/
      /code/
      /graphics/
      /images/
```

## 🧩 Modules to Generate

### **1. Core Orchestrator**
**File**: `src/server/utils/orchestrator.ts`

**Requirements**:
- Handle multi-task execution for audio, code, graphics, and images
- Support parallel and sequential processing
- Include intent detection and classification
- Implement quality assessment and confidence scoring
- Support persona-based generation with dynamic switching
- Include dry-run simulation mode

**Key Methods**:
```typescript
class AceyOrchestrator {
  async generateResponse(prompt: string, context: TaskContext): Promise<AceyOutput>
  async executeTask(task: TaskEntry): Promise<AceyOutput>
  async runBatch(tasks: TaskEntry[]): Promise<AceyOutput[]>
  setPersona(persona: PersonaType): void
  enableDryRun(enabled: boolean): void
  assessQuality(output: AceyOutput): QualityMetrics
}
```

### **2. Audio Coding Orchestrator**
**File**: `src/server/utils/audioCodingOrchestrator.ts`

**Requirements**:
- Extend base Orchestrator for audio & coding tasks
- Include specialized context handling for audio parameters
- Support code generation with multiple languages/frameworks
- Implement simulation mode for batch testing
- Include audio file generation and preview capabilities

**Key Methods**:
```typescript
class AudioCodingOrchestrator extends AceyOrchestrator {
  async generateAudio(prompt: string, audioContext: AudioContext): Promise<AudioOutput>
  async generateCode(prompt: string, codeContext: CodeContext): Promise<CodeOutput>
  async runSimulation(tasks: TaskEntry[]): Promise<SimulationResult[]>
  validateAudioOutput(output: AudioOutput): ValidationResult
  validateCodeOutput(output: CodeOutput): ValidationResult
}
```

### **3. Continuous Learning Loop**
**File**: `src/server/utils/continuousLearning.ts`

**Requirements**:
- Add approved outputs to JSONL datasets per task type
- Track dataset growth and quality metrics
- Implement smart batching for fine-tune preparation
- Include data validation and deduplication
- Support dataset versioning and rollback
- Include export/import capabilities

**Key Methods**:
```typescript
class ContinuousLearningLoop {
  async processOutput(taskType: TaskType, prompt: string, output: AceyOutput, approved: boolean): Promise<void>
  async addToDataset(entry: DatasetEntry): Promise<void>
  async prepareBatch(taskType: TaskType, size: number): Promise<DatasetEntry[]>
  getDatasetStats(): DatasetStats
  exportDataset(taskType: TaskType): string
  importDataset(data: string, taskType: TaskType): Promise<void>
  triggerFineTune(taskType: TaskType): Promise<FineTuneResult>
}
```

### **4. Real-Time Fine-Tune**
**File**: `src/server/utils/realtimeFineTune.ts`

**Requirements**:
- Automatically fine-tune Acey's LLM on approved outputs
- Support multi-task batch processing
- Include model versioning and rollback capabilities
- Implement A/B testing for fine-tune results
- Include authentication and API rate limiting
- Support incremental fine-tuning

**Key Methods**:
```typescript
class RealTimeFineTune {
  async startFineTune(taskType: TaskType, dataset: DatasetEntry[]): Promise<FineTuneJob>
  async monitorProgress(jobId: string): Promise<FineTuneProgress>
  async rollbackModel(version: string): Promise<void>
  async compareModels(versionA: string, versionB: string): Promise<ComparisonResult>
  scheduleFineTune(taskType: TaskType, schedule: FineTuneSchedule): void
}
```

### **5. Schema Definitions**
**File**: `src/server/utils/schema.ts`

**Requirements**:
- Define TaskType, AceyOutput, intents, trust/confidence metadata
- Include validation schemas for all task types
- Support persona definitions and switching
- Include dataset entry structures
- Define API interfaces and response types

**Key Types**:
```typescript
export type TaskType = 'audio' | 'code' | 'graphics' | 'images';

export interface AceyOutput {
  id: string;
  taskType: TaskType;
  speech: string;
  intents: Intent[];
  approved: boolean;
  confidence: number;
  trust: number;
  audioUrl?: string;
  imageUrl?: string;
  metadata: OutputMetadata;
  timestamp: Date;
}

export interface TaskEntry {
  id: string;
  taskType: TaskType;
  prompt: string;
  context: TaskContext;
  persona?: PersonaType;
  priority: TaskPriority;
  timestamp: Date;
  status: TaskStatus;
}

export interface DatasetEntry {
  id: string;
  taskType: TaskType;
  prompt: string;
  output: AceyOutput;
  approved: boolean;
  qualityScore: number;
  timestamp: Date;
  metadata: DatasetMetadata;
}
```

## 🎨 Dashboard Components

### **1. Acey Control Center**
**File**: `src/client/components/AceyControlCenter.tsx`

**Requirements**:
- **Left Panel**: Task manager & dynamic task addition
  - Task type selection (audio, code, graphics, images)
  - Prompt input with validation
  - Context configuration per task type
  - Task queue with status indicators
  - Batch execution controls

- **Middle Panel**: Batch simulation with previews
  - Real-time task execution progress
  - Audio player for generated audio
  - Monaco Editor for code preview
  - Image display for graphics
  - Intent and confidence visualization

- **Right Panel**: Dataset growth & fine-tune progress
  - Dataset statistics per task type
  - Fine-tune progress bars and status
  - Trust/confidence metrics visualization
  - Model version information
  - Performance analytics

**Key Features**:
- Real-time WebSocket updates
- Drag-and-drop task reordering
- Export results functionality
- Dark/light theme support
- Responsive design

### **2. Interactive Dashboard**
**File**: `src/client/components/InteractiveAceyDashboard.tsx`

**Requirements**:
- Individual task preview and editing
- Monaco Editor integration for code modification
- HTML5 audio player with controls
- Image preview with zoom capabilities
- Task approval/rejection interface
- Real-time collaboration features

**Key Features**:
- Live editing with instant preview
- Version history for generated content
- Share and export capabilities
- Annotation system for feedback
- Performance metrics per task

## 🔄 Continuous Learning + Fine-Tune Integration

### **Automated Workflow**:
1. **Task Execution**: Process user requests through orchestrator
2. **Quality Assessment**: Evaluate output quality and confidence
3. **Auto-Approval**: Apply rule-based approval logic
4. **Dataset Curation**: Add approved outputs to JSONL datasets
5. **Batch Preparation**: Queue outputs for fine-tuning
6. **Fine-Tune Trigger**: Automatically trigger when threshold met
7. **Model Update**: Deploy improved model with rollback capability

### **Dataset Management**:
- **JSONL Format**: Structured data per task type
- **Versioning**: Incremental dataset versions
- **Quality Filtering**: Only high-quality outputs used
- **Deduplication**: Remove similar entries
- **Export/Import**: Backup and migration support

### **Fine-Tune Pipeline**:
- **Batch Processing**: Process multiple outputs together
- **Multi-Task Support**: Separate models per task type
- **API Integration**: Connect to LLM fine-tune endpoints
- **Progress Tracking**: Real-time fine-tune monitoring
- **A/B Testing**: Compare model performance

## 🎛️ Optional Enhancements

### **Multi-Persona Support**:
```typescript
export type PersonaType = 'hype' | 'professional' | 'casual' | 'technical' | 'creative';

interface PersonaConfig {
  type: PersonaType;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  responseStyle: string;
}
```

### **Emotion Inference**:
```typescript
interface EmotionAnalysis {
  detected: EmotionType;
  confidence: number;
  context: string;
  adjustment: PersonaAdjustment;
}
```

### **Trust-Weighted Output**:
```typescript
interface TrustWeighting {
  historicalAccuracy: number;
  currentConfidence: number;
  userFeedback: number;
  finalWeight: number;
}
```

### **A/B Testing Framework**:
```typescript
interface ABTest {
  id: string;
  modelA: string;
  modelB: string;
  trafficSplit: number;
  metrics: TestMetrics;
  winner?: string;
}
```

## 🌐 UI / Visualization Requirements

### **Monaco Editor Integration**:
- Syntax highlighting for multiple languages
- Auto-completion and IntelliSense
- Error detection and highlighting
- Code formatting and beautification
- Real-time collaboration support

### **Audio Player**:
- HTML5 audio controls
- Waveform visualization
- Playback speed adjustment
- Volume normalization
- Export to multiple formats

### **Image Preview**:
- High-resolution display
- Zoom and pan capabilities
- Format conversion options
- Metadata display
- Batch preview mode

### **Graphs and Charts**:
- Dataset growth over time
- Trust/confidence trends
- Performance metrics
- Fine-tune progress
- A/B test results

## 🔒 Testing & Safety

### **Shadow-Ban Simulation**:
```typescript
interface SafetyCheck {
  contentFilter: ContentFilterResult;
  policyViolation: PolicyCheckResult;
  qualityThreshold: QualityCheckResult;
  approved: boolean;
  reasons: string[];
}
```

### **Dry-Run Mode**:
- Simulation without actual execution
- Resource usage estimation
- Performance prediction
- Error detection without impact

### **Auto-Rule Evaluation**:
```typescript
interface AutoRule {
  id: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  enabled: boolean;
}
```

## 🔧 Fine-Tuning Integration

### **Batch Processing**:
```typescript
interface FineTuneBatch {
  id: string;
  taskType: TaskType;
  entries: DatasetEntry[];
  config: FineTuneConfig;
  status: BatchStatus;
  createdAt: Date;
  completedAt?: Date;
}
```

### **API Integration**:
```typescript
interface FineTuneAPI {
  authenticate(credentials: APICredentials): Promise<AuthToken>;
  submitJob(batch: FineTuneBatch): Promise<JobId>;
  checkProgress(jobId: JobId): Promise<Progress>;
  retrieveModel(modelId: string): Promise<Model>;
  deployModel(modelId: string): Promise<DeployResult>;
}
```

### **Version Management**:
```typescript
interface ModelVersion {
  id: string;
  version: string;
  taskType: TaskType;
  performance: PerformanceMetrics;
  createdAt: Date;
  parent?: string;
  isActive: boolean;
}
```

## 📦 Deliverables

### **Core Requirements**:
1. **Fully Working TypeScript + React Codebase**
   - All modules implemented and functional
   - Type safety throughout the application
   - Error handling and logging
   - Performance optimization

2. **All Modules Wired Together**
   - Import/export relationships established
   - Dependency injection implemented
   - Configuration management
   - Environment-specific settings

3. **Plug-and-Play Ready**
   - Package.json with all dependencies
   - Build and deployment scripts
   - Environment configuration
   - Documentation and examples

4. **Dashboard Renders Correctly**
   - All components display properly
   - Real-time updates functional
   - Responsive design implemented
   - Accessibility features included

5. **Continuous Learning Functional**
   - Dataset curation working
   - Fine-tune triggers operating
   - Model updates successful
   - Quality improvements measurable

## 💡 Implementation Tips

### **Generation Strategy**:
1. **Generate Core Schema First**: Define all types and interfaces
2. **Implement Base Orchestrator**: Core execution engine
3. **Build Specialized Modules**: Audio, code, graphics handlers
4. **Create Learning Loop**: Dataset management and curation
5. **Add Fine-Tune Pipeline**: Model improvement system
6. **Develop Dashboard UI**: User interface components
7. **Integrate Everything**: Wire all modules together
8. **Add Advanced Features**: Personas, A/B testing, safety

### **Best Practices**:
- Use TypeScript strict mode
- Implement comprehensive error handling
- Add logging throughout the system
- Include unit tests for all modules
- Use React hooks for state management
- Implement proper security measures
- Include performance monitoring
- Add comprehensive documentation

### **Testing Strategy**:
- Unit tests for all utility functions
- Integration tests for module interactions
- End-to-end tests for complete workflows
- Performance tests for scalability
- Security tests for vulnerability assessment

---

**Feed this prompt to your LLM with the instruction: "Generate each module one-by-one and show how to import/use it, so it produces a fully integrated repo ready to run."**

This will create Acey's complete self-learning ecosystem automatically, including dashboard, orchestrator, continuous learning, real-time fine-tune, and multi-task outputs.
