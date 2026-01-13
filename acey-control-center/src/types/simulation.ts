// Simulation types for AI Control Center

export interface SimulationEvent {
  timestamp: number;
  eventType: string;
  intent: {
    type: string;
    summary?: string;
    confidence?: number;
    speech?: string;
  };
  originalModel: string;
  comparisonModel?: string;
}

export interface ModelComparison {
  timestamp: number;
  modelA: {
    speech: string;
    intents: any[];
    confidence: number;
  };
  modelB: {
    speech: string;
    intents: any[];
    confidence: number;
  };
  differences: string[];
}

export interface SimulationConfig {
  dryRun: boolean;
  autoRules: boolean;
  playbackSpeed: number;
  startTime?: number;
  endTime?: number;
}

export interface SimulationState {
  isPlaying: boolean;
  currentTime: number;
  events: SimulationEvent[];
  comparison: ModelComparison[];
  config: SimulationConfig;
}

export interface SimulationData {
  events: SimulationEvent[];
  comparison: ModelComparison[];
  isDryRun: boolean;
  autoRulesEnabled: boolean;
  currentTime: number;
  totalEvents: number;
}
