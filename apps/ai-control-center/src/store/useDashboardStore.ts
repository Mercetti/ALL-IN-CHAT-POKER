import { create } from 'zustand';
import { fetchPanelSummaries, sendChatMessage, requestCosmeticAsset } from '../services/api';
import type { PanelKey, PanelStatus, ChatMessage } from '../types/panels';

export type DashboardStore = {
  statuses: Record<PanelKey, PanelStatus>;
  lastSync: number | null;
  isLoading: boolean;
  error?: string;
  chat: {
    history: ChatMessage[];
    isSending: boolean;
  };
  fetchAll: () => Promise<void>;
  sendChat: (content: string) => Promise<void>;
  generateCosmetic: (prompt: string) => Promise<void>;
};

const defaultStatuses: Record<PanelKey, PanelStatus> = {
  errorManager: {
    key: 'errorManager',
    category: 'Stability',
    title: 'Error Manager',
    description: 'Auto-detects regressions & suggests patches.',
    state: 'offline',
  },
  performanceOptimizer: {
    key: 'performanceOptimizer',
    category: 'Performance',
    title: 'Performance Optimizer',
    description: 'Monitors CPU/memory & applies live tuning.',
    state: 'offline',
  },
  uxMonitor: {
    key: 'uxMonitor',
    category: 'Experience',
    title: 'UX Monitor',
    description: 'Tracks funnel health and friction events.',
    state: 'offline',
  },
  audioGenerator: {
    key: 'audioGenerator',
    category: 'Media',
    title: 'AI Audio Generator',
    description: 'Builds music beds and FX packs on demand.',
    state: 'offline',
  },
  selfHealing: {
    key: 'selfHealing',
    category: 'Reliability',
    title: 'Self-Healing Middleware',
    description: 'Applies hot fixes & restarts services automatically.',
    state: 'offline',
  },
  pokerAudio: {
    key: 'pokerAudio',
    category: 'Immersion',
    title: 'Poker Audio System',
    description: 'Keeps broadcast-quality soundscapes running.',
    state: 'offline',
  },
};

const CHAT_STORAGE_KEY = 'ai-control-center-chat-history';

const loadStoredChat = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((msg) => msg && typeof msg.id === 'string')
        .slice(-100);
    }
    return [];
  } catch (err) {
    console.warn('Failed to load stored chat history', err);
    return [];
  }
};

const persistChat = (history: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history.slice(-100)));
  } catch (err) {
    console.warn('Failed to persist chat history', err);
  }
};

const useDashboardStore = create<DashboardStore>((set, get) => ({
  statuses: defaultStatuses,
  lastSync: null,
  isLoading: false,
  chat: {
    history: loadStoredChat(),
    isSending: false,
  },
  async fetchAll() {
    if (get().isLoading) return;
    set({ isLoading: true, error: undefined });
    try {
      const summaries = await fetchPanelSummaries();
      const merged = { ...defaultStatuses };
      summaries.forEach((summary) => {
        merged[summary.key] = summary;
      });
      set({
        statuses: merged,
        lastSync: Date.now(),
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to refresh dashboards',
      });
    }
  },
  async sendChat(content: string) {
    if (!content.trim()) return;
    const provisional: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((prev) => {
      const nextHistory = [...prev.chat.history, provisional].slice(-100);
      persistChat(nextHistory);
      return {
        chat: {
          history: nextHistory,
          isSending: true,
        },
      };
    });

    try {
      const response = await sendChatMessage(content);
      set((prev) => {
        const assistantMessage: ChatMessage = {
          id: response.id || crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
        };
        const nextHistory = [...prev.chat.history, assistantMessage].slice(-100);
        persistChat(nextHistory);
        return {
          chat: {
            history: nextHistory,
            isSending: false,
          },
        };
      });
    } catch (err) {
      set((prev) => {
        const failure: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Chat failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          timestamp: Date.now(),
        };
        const nextHistory = [...prev.chat.history, failure].slice(-100);
        persistChat(nextHistory);
        return {
          chat: {
            history: nextHistory,
            isSending: false,
          },
        };
      });
    }
  },
  async generateCosmetic(prompt: string) {
    if (!prompt.trim()) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `[Cosmetic Request] ${prompt.trim()}`,
      timestamp: Date.now(),
    };
    set((prev) => {
      const nextHistory = [...prev.chat.history, userMessage].slice(-100);
      persistChat(nextHistory);
      return {
        chat: {
          history: nextHistory,
          isSending: true,
        },
      };
    });

    try {
      const response = await requestCosmeticAsset(prompt.trim());
      set((prev) => {
        const assistantMessage: ChatMessage = {
          id: response.id || crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
        };
        const nextHistory = [...prev.chat.history, assistantMessage].slice(-100);
        persistChat(nextHistory);
        return {
          chat: {
            history: nextHistory,
            isSending: false,
          },
        };
      });
    } catch (err) {
      set((prev) => {
        const failure: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Cosmetic generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          timestamp: Date.now(),
        };
        const nextHistory = [...prev.chat.history, failure].slice(-100);
        persistChat(nextHistory);
        return {
          chat: {
            history: nextHistory,
            isSending: false,
          },
        };
      });
    }
  },
}));

export default useDashboardStore;
