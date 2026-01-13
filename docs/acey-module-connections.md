# 🔗 Acey Module Connections & Data Flow

## 📊 Complete Module Dependency Graph

```mermaid
graph TB
    subgraph "Frontend Layer"
        ACC[AceyControlCenter.tsx]
        IAD[InteractiveAceyDashboard.tsx]
        SCE[SimpleCodeEditor.tsx]
    end
    
    subgraph "Core Backend"
        ORCH[orchestrator.ts]
        ACO[audioCodingOrchestrator.ts]
        SCHEMA[schema.ts]
    end
    
    subgraph "Learning System"
        CLL[continuousLearning.ts]
        RTF[realtimeFineTune.ts]
    end
    
    subgraph "Data Layer"
        DS[datasets/]
        JSONL[JSONL Files]
    end
    
    subgraph "External APIs"
        LLM[LLM API]
        AUDIO[Audio Generation API]
        IMAGE[Image Generation API]
    end
    
    ACC --> ORCH
    ACC --> ACO
    ACC --> CLL
    IAD --> SCE
    IAD --> ORCH
    
    ORCH --> SCHEMA
    ORCH --> LLM
    ORCH --> AUDIO
    ORCH --> IMAGE
    
    ACO --> ORCH
    ACO --> SCHEMA
    
    CLL --> SCHEMA
    CLL --> DS
    CLL --> RTF
    
    RTF --> LLM
    RTF --> DS
    
    DS --> JSONL
    
    style ACC fill:#e3f2fd
    style ORCH fill:#f3e5f5
    style CLL fill:#fff3e0
    style DS fill:#e8f5e8
```

## 🔄 Data Flow Sequence

### **1. Task Execution Flow**
```
User Input → Dashboard → Orchestrator → External APIs → Result → Dashboard
                ↓
            Quality Assessment → Learning Loop → Dataset
```

### **2. Learning Loop Flow**
```
Approved Output → Dataset Curation → Batch Preparation → Fine-Tune Trigger → Model Update
```

### **3. Real-time Update Flow**
```
Task Status Change → WebSocket → Dashboard Update → UI Refresh
```

## 🧩 Module Import Dependencies

### **Frontend Components**
```typescript
// AceyControlCenter.tsx
import { AceyOrchestrator } from '../server/utils/orchestrator';
import { AudioCodingOrchestrator } from '../server/utils/audioCodingOrchestrator';
import { ContinuousLearningLoop } from '../server/utils/continuousLearning';
import { TaskType, TaskEntry, AceyOutput } from '../server/utils/schema';

// InteractiveAceyDashboard.tsx
import { SimpleCodeEditor } from './SimpleCodeEditor';
import { AceyOrchestrator } from '../server/utils/orchestrator';
import { TaskEntry, AceyOutput } from '../server/utils/schema';

// SimpleCodeEditor.tsx
import React from 'react';
// No external dependencies - standalone component
```

### **Core Backend**
```typescript
// orchestrator.ts
import { TaskType, TaskEntry, AceyOutput, PersonaType } from './schema';

// audioCodingOrchestrator.ts
import { AceyOrchestrator } from './orchestrator';
import { TaskType, TaskEntry, AceyOutput, AudioContext, CodeContext } from './schema';

// schema.ts
// No imports - base type definitions
```

### **Learning System**
```typescript
// continuousLearning.ts
import { AceyOrchestrator } from './orchestrator';
import { TaskType, TaskEntry, AceyOutput, DatasetEntry } from './schema';

// realtimeFineTune.ts
import { TaskType, DatasetEntry, ModelVersion } from './schema';
import { ContinuousLearningLoop } from './continuousLearning';
```

## 📡 WebSocket Communication

### **Real-time Updates**
```typescript
// Dashboard WebSocket Events
interface DashboardEvents {
  'task:created': TaskEntry;
  'task:updated': { id: string; status: TaskStatus };
  'task:completed': { id: string; result: AceyOutput };
  'dataset:updated': DatasetStats;
  'finetune:started': FineTuneJob;
  'finetune:progress': FineTuneProgress;
  'finetune:completed': FineTuneResult;
}

// Server WebSocket Handlers
class WebSocketManager {
  onTaskCreated(task: TaskEntry): void
  onTaskUpdated(id: string, status: TaskStatus): void
  onTaskCompleted(id: string, result: AceyOutput): void
  onDatasetUpdated(stats: DatasetStats): void
  onFineTuneStarted(job: FineTuneJob): void
  onFineTuneProgress(jobId: string, progress: FineTuneProgress): void
  onFineTuneCompleted(jobId: string, result: FineTuneResult): void
}
```

## 🗂️ File System Structure

### **Dataset Organization**
```
/data/datasets/
├── audio/
│   ├── dataset_v1.jsonl
│   ├── dataset_v2.jsonl
│   └── latest.jsonl -> dataset_v2.jsonl
├── code/
│   ├── dataset_v1.jsonl
│   ├── dataset_v2.jsonl
│   └── latest.jsonl -> dataset_v2.jsonl
├── graphics/
│   ├── dataset_v1.jsonl
│   └── latest.jsonl -> dataset_v1.jsonl
└── images/
    ├── dataset_v1.jsonl
    └── latest.jsonl -> dataset_v1.jsonl
```

### **Model Versioning**
```
/data/models/
├── audio/
│   ├── model_v1.pt
│   ├── model_v2.pt
│   └── current.pt -> model_v2.pt
├── code/
│   ├── model_v1.pt
│   └── current.pt -> model_v1.pt
└── shared/
    ├── base_model.pt
    └── persona_configs.json
```

## 🔄 State Management Flow

### **Dashboard State**
```typescript
interface DashboardState {
  tasks: TaskEntry[];
  results: AceyOutput[];
  datasetStats: DatasetStats;
  fineTuneProgress: FineTuneProgress;
  selectedTask?: TaskEntry;
  selectedResult?: AceyOutput;
  isSimulating: boolean;
  activeTab: 'tasks' | 'simulation' | 'dataset' | 'learning';
}
```

### **Learning Loop State**
```typescript
interface LearningState {
  datasets: Map<TaskType, DatasetEntry[]>;
  fineTuneQueue: DatasetEntry[];
  activeFineTuneJobs: Map<string, FineTuneJob>;
  modelVersions: Map<TaskType, ModelVersion[]>;
  performanceMetrics: Map<TaskType, PerformanceMetrics>;
}
```

## 🔧 Configuration Flow

### **Environment Configuration**
```typescript
// config/environment.ts
export interface EnvironmentConfig {
  llm: {
    endpoint: string;
    apiKey: string;
    maxTokens: number;
    temperature: number;
  };
  database: {
    host: string;
    port: number;
    database: string;
  };
  storage: {
    datasetPath: string;
    modelPath: string;
    tempPath: string;
  };
  websocket: {
    port: number;
    enabled: boolean;
  };
  fineTune: {
    batchSize: number;
    threshold: number;
    maxConcurrent: number;
  };
}
```

### **Module Initialization**
```typescript
// initialization.ts
export async function initializeSystem(config: EnvironmentConfig): Promise<System> {
  // 1. Initialize database connections
  const db = await Database.connect(config.database);
  
  // 2. Initialize orchestrator
  const orchestrator = new AceyOrchestrator(config.llm);
  
  // 3. Initialize specialized orchestrators
  const audioOrchestrator = new AudioCodingOrchestrator(orchestrator);
  
  // 4. Initialize learning loop
  const learningLoop = new ContinuousLearningLoop(audioOrchestrator, config.fineTune);
  
  // 5. Initialize fine-tune manager
  const fineTune = new RealTimeFineTune(config.llm, config.storage);
  
  // 6. Initialize WebSocket server
  const wsServer = new WebSocketServer(config.websocket);
  
  // 7. Wire up event handlers
  wireEventHandlers(orchestrator, learningLoop, fineTune, wsServer);
  
  return {
    orchestrator,
    learningLoop,
    fineTune,
    wsServer,
    db
  };
}
```

## 📊 Performance Monitoring

### **Metrics Collection**
```typescript
interface PerformanceMetrics {
  taskExecution: {
    totalTasks: number;
    averageTime: number;
    successRate: number;
    taskTypeBreakdown: Record<TaskType, TaskMetrics>;
  };
  learning: {
    datasetGrowth: Record<TaskType, number>;
    fineTuneFrequency: number;
    modelImprovement: number;
    qualityScore: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}
```

### **Health Checks**
```typescript
interface HealthCheck {
  orchestrator: boolean;
  learningLoop: boolean;
  fineTune: boolean;
  database: boolean;
  websocket: boolean;
  externalAPIs: Record<string, boolean>;
}
```

## 🚀 Deployment Architecture

### **Container Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5173 8080
CMD ["npm", "start"]
```

### **Service Dependencies**
```yaml
# docker-compose.yml
version: '3.8'
services:
  acey-dashboard:
    build: .
    ports:
      - "5173:5173"
    depends_on:
      - acey-server
      - database
      - redis
  
  acey-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@database:5432/acey
    depends_on:
      - database
      - redis
  
  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=acey
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

This complete module connection guide ensures all components work together seamlessly, creating a fully integrated self-learning AI ecosystem.
