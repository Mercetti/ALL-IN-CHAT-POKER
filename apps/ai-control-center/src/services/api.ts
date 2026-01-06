import type { PanelStatus } from '../types/panels';

const API_BASE = `${import.meta.env.VITE_BACKEND_BASE ?? ''}`.replace(/\/$/, '');

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const target = path.startsWith('http') ? path : `${API_BASE || ''}${path}`;
  const res = await fetch(target, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
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
