import type { PanelStatus } from '../types/panels';

const defaultBackend = 'https://all-in-chat-poker.fly.dev';
// Use Fly backend when running in Electron (production-like environment)
const isElectron = typeof window !== 'undefined' && !!(window as any).process?.versions?.electron;
const API_BASE = `${import.meta.env.VITE_BACKEND_BASE ?? defaultBackend}`.replace(/\/$/, '');
const HELPER_BASE = `${import.meta.env.VITE_ACEY_HELPER_BASE ?? 'http://127.0.0.1:7123'}`.replace(/\/$/, '');

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

// Audio and Cosmetics API functions
export async function fetchAudioFiles() {
  return await apiFetch<{ success: boolean; data: { files: any[], totalSize: string, totalCount: number } }>('/admin/ai/audio/files');
}

export async function fetchCosmeticSets() {
  return await apiFetch<{ success: boolean; data: { sets: any[], totalCount: number } }>('/admin/ai/cosmetics/sets');
}

export async function generateAudio(params: {
  type: string;
  mood?: string;
  duration?: string;
  effectType?: string;
  description?: string;
}) {
  return await apiFetch<{ success: boolean; data: any; message: string }>('/admin/ai/audio/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function generateCosmetic(params: {
  prompt: string;
  preset?: string;
  cosmeticTypes?: string[];
  style?: string;
  palette?: string[];
}) {
  return await apiFetch<{ success: boolean; data: any; message: string }>('/admin/ai/cosmetics/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Approval API functions
export async function approveAudio(id: string, approvedBy?: string, notes?: string) {
  return await apiFetch<{ success: boolean; data: any; message: string }>(`/admin/ai/audio/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy, notes }),
  });
}

export async function rejectAudio(id: string, rejectedBy?: string, rejectionReason?: string) {
  return await apiFetch<{ success: boolean; data: any; message: string }>(`/admin/ai/audio/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectedBy, rejectionReason }),
  });
}

export async function approveCosmetic(id: string, approvedBy?: string, notes?: string, priceAdjustment?: number) {
  return await apiFetch<{ success: boolean; data: any; message: string }>(`/admin/ai/cosmetics/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy, notes, priceAdjustment }),
  });
}

export async function rejectCosmetic(id: string, rejectedBy?: string, rejectionReason?: string) {
  return await apiFetch<{ success: boolean; data: any; message: string }>(`/admin/ai/cosmetics/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectedBy, rejectionReason }),
  });
}

export async function fetchPricingSchema() {
  return await apiFetch<{ success: boolean; data: any }>('/admin/ai/pricing/schema');
}

// Cosmetics deduplication API functions
export async function detectDuplicates(cosmetics: any[]) {
  return await apiFetch<{ success: boolean; data: any }>('/admin/ai/cosmetics/deduplicate', {
    method: 'POST',
    body: JSON.stringify({ action: 'detect', cosmetics }),
  });
}

export async function removeDuplicates(cosmetics: any[]) {
  return await apiFetch<{ success: boolean; data: any }>('/admin/ai/cosmetics/deduplicate', {
    method: 'POST',
    body: JSON.stringify({ action: 'remove', cosmetics }),
  });
}

export async function mergeDuplicates(cosmetics: any[]) {
  return await apiFetch<{ success: boolean; data: any }>('/admin/ai/cosmetics/deduplicate', {
    method: 'POST',
    body: JSON.stringify({ action: 'merge', cosmetics }),
  });
}

export async function smartCleanup(cosmetics: any[]) {
  return await apiFetch<{ success: boolean; data: any }>('/admin/ai/cosmetics/deduplicate', {
    method: 'POST',
    body: JSON.stringify({ action: 'smart-cleanup', cosmetics }),
  });
}

export async function aiCleanup(cosmetics: any[]) {
  return await apiFetch<{ success: boolean; data: any }>('/admin/ai/cosmetics/ai-cleanup', {
    method: 'POST',
    body: JSON.stringify({ cosmetics }),
  });
}

async function helperFetch<T>(path: string, options: RequestInit = {}, tokenOverride?: string): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('Helper commands are only available in the browser');
  }

  const token = tokenOverride || localStorage.getItem('acey_helper_token') || import.meta.env.VITE_ACEY_HELPER_TOKEN;
  if (!token) {
    throw new Error('Helper token required. Set ACEY_HELPER_TOKEN or enter a token in the UI.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Acey-Token': token,
    ...(options.headers as Record<string, string> | undefined),
  };

  const url = path.startsWith('http') ? path : `${HELPER_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Helper error ${res.status}`);
  }

  return res.json();
}

export async function fetchAceyHelperStatus(token?: string) {
  return helperFetch<{ success: boolean; status: { running: boolean; pid: number | null; startedAt: string | null } }>('/acey-dev/status', { method: 'GET' }, token);
}

export async function startAceyDevSuite(token?: string) {
  return helperFetch<{ success: boolean; message: string; status: { running: boolean; pid: number | null; startedAt: string | null } }>('/acey-dev/start', { method: 'POST' }, token);
}

// Export apiFetch for use in other components
export { apiFetch };
