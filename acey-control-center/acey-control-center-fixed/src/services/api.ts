import axios from 'axios';

const BASE_URL = 'https://all-in-chat-poker.fly.dev'; // Update with your actual backend URL

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  permissions: string[];
  expiresAt: number;
}

export interface StatusResponse {
  aceyOnline: boolean;
  currentTask: string;
  cognitiveLoad: string;
  activeModel: string;
  lastHeartbeat: number;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

export interface LogsResponse {
  logs: LogEntry[];
}

export interface Approval {
  approvalId: string;
  action: string;
  risk: number;
  reason: string;
  timestamp: number;
}

export interface ApprovalsResponse {
  pending: Approval[];
}

export interface CommandResponse {
  success?: boolean;
  requiresApproval?: boolean;
  approvalId?: string;
  message?: string;
  error?: string;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearStoredToken();
      // Navigate to login screen (handled by auth service)
    }
    return Promise.reject(error);
  }
);

// Token storage helpers
const TOKEN_KEY = 'acey_mobile_token';
const DEVICE_ID_KEY = 'acey_mobile_device_id';

export const getStoredToken = (): string | null => {
  // In a real app, use AsyncStorage:
  // return AsyncStorage.getItem(TOKEN_KEY);
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  // In a real app, use AsyncStorage:
  // return AsyncStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  // In a real app, use AsyncStorage:
  // return AsyncStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredDeviceId = (): string | null => {
  // In a real app, use AsyncStorage:
  // return AsyncStorage.getItem(DEVICE_ID_KEY);
  return localStorage.getItem(DEVICE_ID_KEY);
};

export const setStoredDeviceId = (deviceId: string): void => {
  // In a real app, use AsyncStorage:
  // return AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
};

// API functions
export const apiPost = async <T = any>(
  path: string,
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await api.post(path, data);
    return { data: response.data };
  } catch (error: any) {
    return {
      error: error.response?.data?.error || error.message || 'Request failed',
    };
  }
};

export const apiGet = async <T = any>(path: string): Promise<ApiResponse<T>> => {
  try {
    const response = await api.get(path);
    return { data: response.data };
  } catch (error: any) {
    return {
      error: error.response?.data?.error || error.message || 'Request failed',
    };
  }
};

// Specific API endpoints
export const mobileLogin = async (
  deviceId: string,
  pin: string
): Promise<ApiResponse<LoginResponse>> => {
  return apiPost<LoginResponse>('/mobile/auth/login', { deviceId, pin });
};

export const getStatus = async (): Promise<ApiResponse<StatusResponse>> => {
  return apiGet<StatusResponse>('/mobile/status');
};

export const getLogs = async (
  type: string = 'system',
  limit: number = 100
): Promise<ApiResponse<LogsResponse>> => {
  return apiGet<LogsResponse>(`/mobile/logs?type=${type}&limit=${limit}`);
};

export const getApprovals = async (): Promise<ApiResponse<ApprovalsResponse>> => {
  return apiGet<ApprovalsResponse>('/mobile/approvals');
};

export const processApproval = async (
  approvalId: string,
  approved: boolean
): Promise<ApiResponse> => {
  return apiPost('/mobile/approve', { approvalId, approved });
};

export const sendCommand = async (
  intent: string,
  params: Record<string, any> = {}
): Promise<ApiResponse<CommandResponse>> => {
  return apiPost<CommandResponse>('/mobile/command', { intent, params });
};

export default api;
