// Re-export types from orchestrator for convenience
export type { AceyOutput, TaskEntry, OrchestratorConfig, TaskType } from './orchestrator';
import type { TaskType } from './orchestrator';

// Additional schema definitions for the dashboard
export interface DashboardConfig {
  theme: 'light' | 'dark' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number;
  maxLogEntries: number;
  enableAudioPreview: boolean;
  enableCodePreview: boolean;
}

export interface LogEntry {
  id: string;
  taskId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: any;
}

export interface SimulationStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  successRate: number;
  taskTypeBreakdown: Record<TaskType, number>;
}

export interface AudioPreview {
  url: string;
  duration: number;
  format: string;
  sampleRate: number;
}

export interface CodePreview {
  language: string;
  framework?: string;
  code: string;
  dependencies?: string[];
  previewUrl?: string;
}

export interface GraphicsPreview {
  url: string;
  dimensions: string;
  format: string;
  fileSize: number;
  style: string;
}

// Validation schemas
export const TaskValidationSchema = {
  audio: {
    required: ['prompt', 'context.type'],
    optional: ['context.mood', 'context.lengthSeconds', 'context.voice'],
    defaults: {
      'context.type': 'speech',
      'context.mood': 'hype',
      'context.lengthSeconds': 3,
      'context.voice': 'default'
    }
  },
  website: {
    required: ['prompt', 'context.language'],
    optional: ['context.framework', 'context.maxLines', 'context.description'],
    defaults: {
      'context.language': 'typescript',
      'context.framework': 'react',
      'context.maxLines': 30
    }
  },
  graphics: {
    required: ['prompt', 'context.type'],
    optional: ['context.dimensions', 'context.style', 'context.format'],
    defaults: {
      'context.type': 'sprite',
      'context.dimensions': '512x512',
      'context.style': 'pixel-art',
      'context.format': 'png'
    }
  },
  images: {
    required: ['prompt', 'context.style'],
    optional: ['context.resolution', 'context.format', 'context.aspectRatio'],
    defaults: {
      'context.style': 'photorealistic',
      'context.resolution': '1024x1024',
      'context.format': 'jpg',
      'context.aspectRatio': '1:1'
    }
  }
};

// Intent types for classification
export const IntentTypes = {
  EXCITEMENT: 'excitement',
  CODE_GENERATION: 'code_generation',
  GRAPHICS_GENERATION: 'graphics_generation',
  AUDIO_GENERATION: 'audio_generation',
  ERROR_HANDLING: 'error_handling',
  VALIDATION: 'validation',
  APPROVAL: 'approval',
  REJECTION: 'rejection'
} as const;

export type IntentType = typeof IntentTypes[keyof typeof IntentTypes];

// Export configuration constants
export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  theme: 'light',
  autoRefresh: false,
  refreshInterval: 5000,
  maxLogEntries: 1000,
  enableAudioPreview: true,
  enableCodePreview: true
};

export const DEFAULT_ORCHESTRATOR_CONFIG = {
  llmEndpoint: 'https://api.example.com/generate',
  personaMode: 'hype' as const,
  autoApprove: true,
  simulationMode: true,
  maxConcurrentTasks: 3,
  timeout: 30000
};

// Utility functions for schema validation
export const validateTask = (task: TaskEntry): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const schema = TaskValidationSchema[task.taskType as keyof typeof TaskValidationSchema];

  if (!schema) {
    errors.push(`Unknown task type: ${task.taskType}`);
    return { valid: false, errors };
  }

  // Check required fields
  schema.required.forEach((field: string) => {
    const value = getNestedValue(task, field);
    if (value === undefined || value === null || value === '') {
      errors.push(`Required field missing: ${field}`);
    }
  });

  // Apply defaults for optional fields
  schema.optional?.forEach((field: string) => {
    const value = getNestedValue(task, field);
    if (value === undefined || value === null) {
      const defaultValue = getNestedValue(schema.defaults, field);
      if (defaultValue !== undefined) {
        setNestedValue(task, field, defaultValue);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
};
