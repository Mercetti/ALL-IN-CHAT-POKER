/**
 * Stability API Service
 * Connects mobile app to Acey stability module APIs
 */

const API_BASE_URL = 'http://localhost:8080/api/acey';

export interface ModeStatus {
  currentMode: string;
  availableModes: string[];
  lastModeChange: string;
  modeChangeReason?: string;
}

export interface SafeModeStatus {
  isActive: boolean;
  autoTriggered: boolean;
  triggerReason?: string;
  lastTriggered?: string;
  resourceStatus: {
    cpu: number;
    memory: number;
    gpu: number;
    overall: number;
  };
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface StartupProfile {
  id: string;
  name: string;
  mode: string;
  description: string;
  startupOrder: string[];
  resourceReservations: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  timeoutMs: number;
  fallbackMode?: string;
}

export interface FounderBrief {
  id: string;
  date: string;
  requiredActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number;
    category: string;
  }>;
  optionalReviews: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number;
    category: string;
  }>;
  cognitiveLoadScore: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  summary: string;
}

export interface ReplaySession {
  id: string;
  startTime: string;
  endTime?: string;
  decisions: Array<{
    id: string;
    timestamp: string;
    input: any;
    skillRouting: string;
    llmResponse: any;
    autoRuleOutcome: {
      rule: string;
      action: string;
      result: string;
    };
    resourceSnapshot: {
      cpu: number;
      memory: number;
      gpu: number;
    };
    duration: number;
    success: boolean;
    error?: string;
  }>;
  context: {
    mode: string;
    activeSkills: string[];
    systemState: any;
  };
  summary: {
    totalDecisions: number;
    successRate: number;
    averageDuration: number;
    errors: string[];
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    stability: 'online' | 'offline' | 'degraded';
    watchdog: 'running' | 'stopped' | 'error';
    resources: 'optimal' | 'high' | 'critical';
    skills: Array<{
      id: string;
      name: string;
      status: 'running' | 'stopped' | 'error';
      health: number;
    }>;
  };
  metrics: {
    cpu: number;
    memory: number;
    gpu: number;
    uptime: number;
    activeSkills: number;
    totalDecisions: number;
    successRate: number;
  };
}

class StabilityApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = API_BASE_URL, apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Mode Management
  async getCurrentMode(): Promise<ModeStatus> {
    const response = await this.makeRequest('/modes/current');
    if (!response.ok) {
      throw new Error(`Failed to fetch current mode: ${response.statusText}`);
    }
    return response.json();
  }

  async switchMode(mode: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.makeRequest('/modes/switch', {
      method: 'POST',
      body: JSON.stringify({ mode, reason }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to switch mode: ${response.statusText}`);
    }
    return response.json();
  }

  async getAvailableModes(): Promise<string[]> {
    const response = await this.makeRequest('/modes/available');
    if (!response.ok) {
      throw new Error(`Failed to fetch available modes: ${response.statusText}`);
    }
    return response.json();
  }

  // Safe Mode Control
  async getSafeModeStatus(): Promise<SafeModeStatus> {
    const response = await this.makeRequest('/safe-mode/status');
    if (!response.ok) {
      throw new Error(`Failed to fetch Safe Mode status: ${response.statusText}`);
    }
    return response.json();
  }

  async toggleSafeMode(enabled: boolean, reason?: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.makeRequest('/safe-mode/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled, reason }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to toggle Safe Mode: ${response.statusText}`);
    }
    return response.json();
  }

  async updateAutoTriggerSettings(enabled: boolean, thresholds?: {
    cpu: number;
    memory: number;
    gpu: number;
  }): Promise<{ success: boolean; message?: string }> {
    const response = await this.makeRequest('/safe-mode/auto-trigger', {
      method: 'POST',
      body: JSON.stringify({ enabled, thresholds }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update auto-trigger settings: ${response.statusText}`);
    }
    return response.json();
  }

  // Startup Profiles
  async getStartupProfiles(): Promise<StartupProfile[]> {
    const response = await this.makeRequest('/profiles');
    if (!response.ok) {
      throw new Error(`Failed to fetch startup profiles: ${response.statusText}`);
    }
    return response.json();
  }

  async getStartupProfile(profileId: string): Promise<StartupProfile> {
    const response = await this.makeRequest(`/profiles/${profileId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch startup profile: ${response.statusText}`);
    }
    return response.json();
  }

  async executeStartupProfile(profileId: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.makeRequest('/profiles/execute', {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to execute startup profile: ${response.statusText}`);
    }
    return response.json();
  }

  // Founder Assistant
  async getFounderBrief(date?: string): Promise<FounderBrief> {
    const endpoint = date ? `/founder-assistant/brief?date=${date}` : '/founder-assistant/brief';
    const response = await this.makeRequest(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch founder brief: ${response.statusText}`);
    }
    return response.json();
  }

  async processAlert(alertId: string, action: 'approve' | 'reject' | 'defer'): Promise<{ success: boolean; message?: string }> {
    const response = await this.makeRequest('/founder-assistant/process-alert', {
      method: 'POST',
      body: JSON.stringify({ alertId, action }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to process alert: ${response.statusText}`);
    }
    return response.json();
  }

  async getCognitiveLoadMetrics(): Promise<{
    currentLoad: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
  }> {
    const response = await this.makeRequest('/founder-assistant/cognitive-load');
    if (!response.ok) {
      throw new Error(`Failed to fetch cognitive load metrics: ${response.statusText}`);
    }
    return response.json();
  }

  // Replay Engine
  async getReplaySessions(): Promise<ReplaySession[]> {
    const response = await this.makeRequest('/replay/sessions');
    if (!response.ok) {
      throw new Error(`Failed to fetch replay sessions: ${response.statusText}`);
    }
    return response.json();
  }

  async getReplaySession(sessionId: string): Promise<ReplaySession> {
    const response = await this.makeRequest(`/replay/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch replay session: ${response.statusText}`);
    }
    return response.json();
  }

  async startReplayRecording(context?: any): Promise<{ sessionId: string; message: string }> {
    const response = await this.makeRequest('/replay/start', {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to start replay recording: ${response.statusText}`);
    }
    return response.json();
  }

  async stopReplayRecording(sessionId: string): Promise<{ success: boolean; session: ReplaySession }> {
    const response = await this.makeRequest(`/replay/stop/${sessionId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to stop replay recording: ${response.statusText}`);
    }
    return response.json();
  }

  async replaySession(sessionId: string): Promise<{
    success: boolean;
    replayedDecisions: number;
    errors: string[];
    summary: any;
  }> {
    const response = await this.makeRequest(`/replay/replay/${sessionId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to replay session: ${response.statusText}`);
    }
    return response.json();
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await this.makeRequest('/system/health');
    if (!response.ok) {
      throw new Error(`Failed to fetch system health: ${response.statusText}`);
    }
    return response.json();
  }

  async getSystemLogs(level?: 'info' | 'warn' | 'error', limit?: number): Promise<Array<{
    timestamp: string;
    level: string;
    message: string;
    component: string;
  }>> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.makeRequest(`/system/logs?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch system logs: ${response.statusText}`);
    }
    return response.json();
  }

  async getSystemStats(): Promise<{
    uptime: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      gpu: number;
    };
    modeStats: {
      currentMode: string;
      modeChanges: number;
      lastModeChange: string;
    };
  }> {
    const response = await this.makeRequest('/system/stats');
    if (!response.ok) {
      throw new Error(`Failed to fetch system stats: ${response.statusText}`);
    }
    return response.json();
  }

  // Utility Methods
  async testConnection(): Promise<{ success: boolean; latency: number; message: string }> {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest('/health');
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        return {
          success: true,
          latency,
          message: 'Connection successful'
        };
      } else {
        return {
          success: false,
          latency,
          message: `Server responded with error: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - startTime,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  getApiKey(): string {
    return this.apiKey;
  }
}

// Export singleton instance
export const stabilityApiService = new StabilityApiService();

// Export class for custom instances
export { StabilityApiService };

export default stabilityApiService;
