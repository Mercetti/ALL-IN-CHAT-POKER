export type PanelState = 'healthy' | 'warning' | 'critical' | 'offline';

export type PanelKey =
  | 'errorManager'
  | 'performanceOptimizer'
  | 'uxMonitor'
  | 'audioGenerator'
  | 'selfHealing'
  | 'pokerAudio';

export type PanelStatus = {
  key: PanelKey;
  category: string;
  title: string;
  description: string;
  state: PanelState;
  metrics?: { label: string; value: string }[];
  alerts?: { id: string; title: string; message: string; severity: PanelState; timestamp: number }[];
};

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  localPath?: string;
  remoteUrl?: string;
  previewUrl?: string;
  savedAt?: number;
  type?: 'image' | 'audio' | 'file';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
};
