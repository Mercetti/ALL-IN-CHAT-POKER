import { create } from 'zustand';
import { fetchPanelSummaries, sendChatMessage, requestCosmeticAsset } from '../services/api';
import type { PanelKey, PanelStatus, ChatMessage, ChatAttachment } from '../types/panels';

export type DashboardStore = {
  statuses: Record<PanelKey, PanelStatus>;
  lastSync: number | null;
  isLoading: boolean;
  error?: string;
  authRequired: boolean;
  chat: {
    history: ChatMessage[];
    isSending: boolean;
  };
  fetchAll: () => Promise<void>;
  hydrateChatHistory: () => Promise<void>;
  sendChat: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
  generateCosmetic: (prompt: string) => Promise<void>;
  markAuthenticated: () => void;
  setAuthRequired: (value: boolean) => void;
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
const LOCAL_HISTORY_LIMIT = 500;

const normalizeChatHistory = (history: unknown): ChatMessage[] => {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (msg): msg is ChatMessage =>
        !!msg &&
        typeof msg === 'object' &&
        typeof msg.id === 'string' &&
        typeof msg.role === 'string' &&
        typeof msg.content === 'string',
    )
    .map((msg) => ({
      ...msg,
      attachments: Array.isArray(msg.attachments) ? msg.attachments : undefined,
    }))
    .slice(-LOCAL_HISTORY_LIMIT);
};

const loadLocalStorageChat = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return [];
    return normalizeChatHistory(JSON.parse(stored));
  } catch (err) {
    console.warn('Failed to load stored chat history', err);
    return [];
  }
};

const persistChatHistory = (history: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  const payload = history.slice(-LOCAL_HISTORY_LIMIT);
  if (window.aiBridge?.chat?.writeHistory) {
    window.aiBridge.chat
      .writeHistory(payload)
      .catch((err: unknown) => console.warn('Failed to persist chat history to disk', err));
    return;
  }

  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to persist chat history', err);
  }
};

const useDashboardStore = create<DashboardStore>((set, get) => ({
  statuses: defaultStatuses,
  lastSync: null,
  isLoading: false,
  authRequired: true,
  chat: {
    history: typeof window !== 'undefined' && !window.aiBridge?.chat ? loadLocalStorageChat() : [],
    isSending: false,
  },
  markAuthenticated() {
    set({ authRequired: false, error: undefined });
  },
  setAuthRequired(value: boolean) {
    set({ authRequired: value });
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
        authRequired: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh dashboards';
      const requiresAuth = typeof message === 'string' && message.toLowerCase().includes('not authorized');
      set({
        isLoading: false,
        error: message,
        authRequired: requiresAuth,
      });
    }
  },
  async hydrateChatHistory() {
    if (typeof window === 'undefined') return;
    if (window.aiBridge?.chat?.readHistory) {
      try {
        const stored = await window.aiBridge.chat.readHistory();
        if (stored) {
          set((prev) => ({
            chat: {
              ...prev.chat,
              history: normalizeChatHistory(stored),
            },
          }));
        }
      } catch (err) {
        console.warn('Failed to hydrate chat history from disk', err);
      }
      return;
    }

    set((prev) => ({
      chat: {
        ...prev.chat,
        history: loadLocalStorageChat(),
      },
    }));
  },
  async sendChat(content: string, attachments: ChatAttachment[] = []) {
    if (!content.trim() && attachments.length === 0) return;
    const provisional: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments: attachments.length ? attachments : undefined,
    };
    set((prev) => {
      const nextHistory = [...prev.chat.history, provisional].slice(-100);
      persistChatHistory(nextHistory);
      return {
        chat: {
          history: nextHistory,
          isSending: true,
        },
      };
    });

    try {
      const response = await sendChatMessage(content, attachments);
      set((prev) => {
        const assistantMessage: ChatMessage = {
          id: response.id || crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
          attachments: Array.isArray(response.attachments) && response.attachments.length
            ? response.attachments
            : undefined,
        };
        const nextHistory = [...prev.chat.history, assistantMessage].slice(-100);
        persistChatHistory(nextHistory);
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
        persistChatHistory(nextHistory);
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
      persistChatHistory(nextHistory);
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
        persistChatHistory(nextHistory);
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
        persistChatHistory(nextHistory);
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
