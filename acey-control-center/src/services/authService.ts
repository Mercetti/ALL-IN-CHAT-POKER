import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = Platform.OS === 'ios' ? 
  'http://localhost:8080' : 
  'http://10.0.2.2:8080';

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear it and redirect to login
      await AsyncStorage.multiRemove([
        'authToken',
        'userRole',
        'userTier',
        'userId',
        'refreshToken'
      ]);
    }
    return Promise.reject(error);
  }
);

export type UserRole = 'owner' | 'dev' | 'streamer' | 'user' | 'partner' | 'investor';

export interface UserAccess {
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  trialRemaining: number;
  unlockedSkills: string[];
  role: UserRole;
  permissions: string[];
  trials?: Array<{
    skillName: string;
    expiresInHours: number;
  }>;
  id: string;
  email: string;
  trustScore: number;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: UserAccess;
  token: string;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
  expires: string;
}

// Enhanced Authentication Service
class AuthService {
  // Login user
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      // Store auth data locally
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userTier', response.data.user.tier);
      await AsyncStorage.setItem('userId', response.data.user.id);
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      await AsyncStorage.multiRemove([
        'authToken',
        'userRole',
        'userTier',
        'userId',
        'refreshToken'
      ]);
    }
  }

  // Refresh token
  static async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<RefreshTokenResponse>('/api/auth/refresh', {
        refreshToken
      });

      // Update stored token
      await AsyncStorage.setItem('authToken', response.data.token);
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Get current user from local storage
  static async getCurrentUser(): Promise<UserAccess | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return null;

      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('userRole') as UserAccess['role'];
      const userTier = await AsyncStorage.getItem('userTier') as UserAccess['tier'];

      if (!userId || !userRole || !userTier) return null;

      // Fetch full user data from API
      const response = await api.get<{ success: boolean; user: UserAccess }>('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Check if user has specific permission
  static async hasPermission(permission: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;
      return user.permissions.includes(permission);
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  // Check if user can access tier
  static async canAccessTier(requiredTier: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const tierOrder = ['Free', 'Pro', 'Creator+', 'Enterprise'];
      const userTierIndex = tierOrder.indexOf(user.tier);
      const requiredTierIndex = tierOrder.indexOf(requiredTier as any);
      
      return userTierIndex >= requiredTierIndex;
    } catch (error) {
      console.error('Failed to check tier access:', error);
      return false;
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<UserAccess>): Promise<UserAccess> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put<{ success: boolean; user: UserAccess }>('/api/auth/profile', updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local storage if needed
      if (updates.role) {
        await AsyncStorage.setItem('userRole', updates.role);
      }
      if (updates.tier) {
        await AsyncStorage.setItem('userTier', updates.tier);
      }
      
      return response.data.user;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  // Legacy functions for backward compatibility
  static async getUserAccess(userToken: string): Promise<UserAccess> {
    try {
      const response = await api.get<{ success: boolean; user: UserAccess }>('/api/auth/profile', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user access:', error);
      // Fallback to basic access
      return {
        tier: 'Free',
        trialRemaining: 7,
        unlockedSkills: ['code'],
        role: 'user',
        permissions: ['basic'],
        id: 'demo-user',
        email: 'demo@example.com',
        trustScore: 100,
        createdAt: new Date().toISOString(),
        isActive: true
      };
    }
  }
}

// Legacy functions for backward compatibility
export function canAccessAceyLab(role: UserRole): boolean {
  return role === 'owner' || role === 'dev';
}

export function canApproveOutput(role: UserRole): boolean {
  return role === 'owner' || role === 'dev';
}

export function canViewAllMetrics(role: UserRole): boolean {
  return role === 'owner' || role === 'dev';
}

export function canUnlockSkills(role: UserRole): boolean {
  return role !== 'user'; // All roles except basic user can unlock skills
}

export function getSkillAccessByTier(tier: string): string[] {
  switch (tier) {
    case 'Free':
      return ['code']; // Basic code helper
    case 'Pro':
      return ['code', 'link']; // Code + link review
    case 'Creator+':
      return ['code', 'link', 'audio', 'graphics']; // All creative skills
    case 'Enterprise':
      return ['code', 'link', 'audio', 'graphics', 'streaming', 'games']; // All skills
    default:
      return ['code'];
  }
}

export function canAccessSkill(skillType: string, userAccess: UserAccess): boolean {
  return userAccess.unlockedSkills.includes(skillType) || 
         getSkillAccessByTier(userAccess.tier).includes(skillType);
}

export default AuthService;
