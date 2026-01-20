// Frontend-safe orchestrator interfaces and API client
// This replaces the server-side orchestrator imports with API calls

export interface OrchestratorConfig {
  llmEndpoint: string;
  personaMode?: 'hype' | 'professional' | 'casual';
  autoApprove?: boolean;
  simulationMode?: boolean;
  maxConcurrentTasks?: number;
  timeout?: number;
}

export interface AceyOutput {
  speech: string;
  intents: Array<{
    type: string;
    confidence: number;
    metadata?: any;
  }>;
  approved: boolean;
  audioUrl?: string;
  metadata?: any;
  timestamp: Date;
}

export type TaskType = 'audio' | 'website' | 'graphics' | 'images';

export interface TaskEntry {
  id: string;
  type: TaskType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: AceyOutput;
  createdAt: Date;
  updatedAt: Date;
}

// API client for orchestrator operations
export class OrchestratorAPI {
  private static instance: OrchestratorAPI;
  private apiBase: string;

  constructor(apiBase: string = 'http://localhost:8080') {
    this.apiBase = apiBase;
  }

  static getInstance(apiBase?: string): OrchestratorAPI {
    if (!OrchestratorAPI.instance) {
      OrchestratorAPI.instance = new OrchestratorAPI(apiBase);
    }
    return OrchestratorAPI.instance;
  }

  async processTask(config: OrchestratorConfig, task: TaskEntry): Promise<AceyOutput> {
    const response = await fetch(`${this.apiBase}/api/ai/orchestrator/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({ config, task })
    });

    if (!response.ok) {
      throw new Error(`Orchestrator API error: ${response.status}`);
    }

    return response.json();
  }

  async getTaskStatus(taskId: string): Promise<TaskEntry> {
    const response = await fetch(`${this.apiBase}/api/ai/orchestrator/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Orchestrator API error: ${response.status}`);
    }

    return response.json();
  }

  async getActiveTasks(): Promise<TaskEntry[]> {
    const response = await fetch(`${this.apiBase}/api/ai/orchestrator/tasks`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Orchestrator API error: ${response.status}`);
    }

    return response.json();
  }

  async updateConfig(config: Partial<OrchestratorConfig>): Promise<void> {
    const response = await fetch(`${this.apiBase}/api/ai/orchestrator/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Orchestrator API error: ${response.status}`);
    }
  }

  async getConfig(): Promise<OrchestratorConfig> {
    const response = await fetch(`${this.apiBase}/api/ai/orchestrator/config`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Orchestrator API error: ${response.status}`);
    }

    return response.json();
  }
}

export default OrchestratorAPI;
