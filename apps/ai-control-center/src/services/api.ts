import type { PanelStatus } from '../types/panels';

const defaultBackend = 'https://all-in-chat-poker.fly.dev';
// Use Fly backend when running in Electron (production-like environment)
const isElectron = typeof window !== 'undefined' && !!(window as any).process?.versions?.electron;
const API_BASE = `${import.meta.env.VITE_BACKEND_BASE ?? defaultBackend}`.replace(/\/$/, '');

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const target = path.startsWith('http') ? path : `${API_BASE || ''}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add Authorization header if we have a token
  const token = localStorage.getItem('admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(target, {
    headers,
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `API error ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        message = parsed.error || parsed.message || message;
      }
    } catch {
      // leave message as-is
    }
    throw new Error(message);
  }

  return res.json();
}

export async function fetchPanelSummaries(): Promise<PanelStatus[]> {
  try {
    const payload = await apiFetch<{ panels: PanelStatus[] }>('/admin/ai/overview');
    return payload.panels;
  } catch (err) {
    console.warn('fetchPanelSummaries fallback:', err);
    return [];
  }
}

export async function sendChatMessage(content: string): Promise<{ id: string; content: string }> {
  try {
    return await apiFetch<{ id: string; content: string }>('/admin/ai-tools/chat', {
      method: 'POST',
      body: JSON.stringify({ message: content }),
    });
  } catch (err) {
    console.warn('sendChatMessage failed, returning fallback', err);
    return {
      id: crypto.randomUUID(),
      content: 'The AI chat endpoint is unavailable. Please check connectivity.',
    };
  }
}

export async function requestCosmeticAsset(prompt: string): Promise<{ id?: string; content: string }> {
  try {
    return await apiFetch<{ id?: string; content: string }>('/admin/ai-tools/generate-cosmetic', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  } catch (err) {
    console.warn('requestCosmeticAsset failed, returning fallback', err);
    return {
      id: crypto.randomUUID(),
      content: 'Cosmetic generation endpoint is unavailable. Please retry later.',
    };
  }
}

export async function controlCenterLogin(password: string): Promise<{ success: boolean }> {
  const result = await apiFetch<{ success: boolean; token?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

  // Store the token if provided
  if (result.success && result.token) {
    localStorage.setItem('admin_token', result.token);
  }

  return { success: result.success };
}

// Export apiFetch for use in other components
export { apiFetch };
