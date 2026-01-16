import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = Platform.OS === 'ios' ? 
  'http://localhost:8080' : 
  'http://10.0.2.2:8080';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userTier', 'userId']);
    }
    return Promise.reject(error);
  }
);

// Skill API types
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'audio' | 'graphics' | 'link' | 'payout' | 'analytics';
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  requiresApproval: boolean;
  usageCount: number;
  averageRating: number;
  revenueGenerated: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillExecutionRequest {
  skillName: string;
  input: any;
  dryRun?: boolean;
}

export interface SkillExecutionResponse {
  success: boolean;
  result: any;
  executionTime: number;
  requiresApproval: boolean;
  timestamp: string;
}

// Security API types
export interface SecurityEvent {
  id: string;
  action: string;
  resource: string;
  mode: 'Green' | 'Yellow' | 'Red';
  blocked: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface SecurityStats {
  currentMode: 'Green' | 'Yellow' | 'Red';
  totalEvents: number;
  last24Hours: {
    total: number;
    blocked: number;
    blockedPercentage: string;
  };
  eventsByMode: Record<string, number>;
  topBlockedActions: Array<{action: string, count: number}>;
}

// Partner API types
export interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  lastPayout: number;
  lastPayoutDate: string;
  monthlyEarnings: Array<{month: string, amount: number}>;
  skillEarnings: Array<{skill: string, amount: number, percentage: number}>;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed';
  createdAt: string;
  processedAt?: string;
  estimatedDelivery?: string;
}

export interface TrustMetrics {
  score: number;
  disputes: number;
  resolvedDisputes: number;
  averageRating: number;
  totalJobs: number;
  successRate: number;
}

// Investor API types
export interface InvestorMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  annualGrowth: number;
  activeUsers: number;
  totalUsers: number;
  churnRate: number;
  ltv: number;
  cac: number;
  mrr: number;
  arr: number;
  grossMargin: number;
  netMargin: number;
}

export interface TierBreakdown {
  tier: string;
  users: number;
  revenue: number;
  growth: number;
  churnRate: number;
}

export interface SkillPerformance {
  skill: string;
  revenue: number;
  usage: number;
  growth: number;
  roi: number;
}

export interface ForecastData {
  period: string;
  projectedRevenue: number;
  projectedUsers: number;
  confidence: number;
}

// API Service Class
class ApiService {
  // Skills API
  static async getSkills(userRole: string): Promise<Skill[]> {
    try {
      const response = await api.get<{ success: boolean; skills: Skill[] }>('/api/skills', {
        headers: { 'x-user-role': userRole }
      });
      return response.data.skills;
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      throw error;
    }
  }

  static async executeSkill(request: SkillExecutionRequest, userRole: string): Promise<SkillExecutionResponse> {
    try {
      const response = await api.post<{ success: boolean; result: SkillExecutionResponse }>(
        `/api/skills/${request.skillName}/execute`,
        {
          input: request.input,
          dryRun: request.dryRun || false
        },
        {
          headers: { 'x-user-role': userRole }
        }
      );
      return response.data.result;
    } catch (error) {
      console.error('Skill execution failed:', error);
      throw error;
    }
  }

  // Security API
  static async getSecurityStatus(): Promise<SecurityStats> {
    try {
      const response = await api.get<{ success: boolean; security: SecurityStats }>('/api/security/status');
      return response.data.security;
    } catch (error) {
      console.error('Failed to fetch security status:', error);
      throw error;
    }
  }

  static async getRecentSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const response = await api.get<{ success: boolean; events: SecurityEvent[] }>('/api/security/events');
      return response.data.events;
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      throw error;
    }
  }

  static async emergencyLockdown(reason: string): Promise<void> {
    try {
      await api.post('/api/security/emergency-lock', { reason });
    } catch (error) {
      console.error('Emergency lockdown failed:', error);
      throw error;
    }
  }

  static async resumeOperations(): Promise<void> {
    try {
      await api.post('/api/security/resume');
    } catch (error) {
      console.error('Resume operations failed:', error);
      throw error;
    }
  }

  // Partner API
  static async getPartnerEarnings(partnerId: string): Promise<EarningsData> {
    try {
      const response = await api.get<{ success: boolean; earnings: EarningsData }>(`/api/partners/${partnerId}/earnings`);
      return response.data.earnings;
    } catch (error) {
      console.error('Failed to fetch partner earnings:', error);
      throw error;
    }
  }

  static async getPartnerPayouts(partnerId: string): Promise<PayoutRequest[]> {
    try {
      const response = await api.get<{ success: boolean; payouts: PayoutRequest[] }>(`/api/partners/${partnerId}/payouts`);
      return response.data.payouts;
    } catch (error) {
      console.error('Failed to fetch partner payouts:', error);
      throw error;
    }
  }

  static async getPartnerTrustMetrics(partnerId: string): Promise<TrustMetrics> {
    try {
      const response = await api.get<{ success: boolean; metrics: TrustMetrics }>(`/api/partners/${partnerId}/trust`);
      return response.data.metrics;
    } catch (error) {
      console.error('Failed to fetch partner trust metrics:', error);
      throw error;
    }
  }

  static async requestPayout(partnerId: string, amount: number): Promise<void> {
    try {
      await api.post(`/api/partners/${partnerId}/payouts`, { amount });
    } catch (error) {
      console.error('Payout request failed:', error);
      throw error;
    }
  }

  // Investor API
  static async getInvestorMetrics(investorId: string): Promise<InvestorMetrics> {
    try {
      const response = await api.get<{ success: boolean; metrics: InvestorMetrics }>(`/api/investors/${investorId}/metrics`);
      return response.data.metrics;
    } catch (error) {
      console.error('Failed to fetch investor metrics:', error);
      throw error;
    }
  }

  static async getTierBreakdown(investorId: string): Promise<TierBreakdown[]> {
    try {
      const response = await api.get<{ success: boolean; breakdown: TierBreakdown[] }>(`/api/investors/${investorId}/tiers`);
      return response.data.breakdown;
    } catch (error) {
      console.error('Failed to fetch tier breakdown:', error);
      throw error;
    }
  }

  static async getSkillPerformance(investorId: string): Promise<SkillPerformance[]> {
    try {
      const response = await api.get<{ success: boolean; performance: SkillPerformance[] }>(`/api/investors/${investorId}/skills`);
      return response.data.performance;
    } catch (error) {
      console.error('Failed to fetch skill performance:', error);
      throw error;
    }
  }

  static async getRevenueForecast(investorId: string, period: 'month' | 'quarter' | 'year'): Promise<ForecastData[]> {
    try {
      const response = await api.get<{ success: boolean; forecast: ForecastData[] }>(
        `/api/investors/${investorId}/forecast?period=${period}`
      );
      return response.data.forecast;
    } catch (error) {
      console.error('Failed to fetch revenue forecast:', error);
      throw error;
    }
  }

  static async downloadReport(investorId: string, reportType: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/investors/${investorId}/reports/${reportType}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download report:', error);
      throw error;
    }
  }

  static async requestInvestorMeeting(investorId: string): Promise<void> {
    try {
      await api.post(`/api/investors/${investorId}/meeting-request`);
    } catch (error) {
      console.error('Failed to request investor meeting:', error);
      throw error;
    }
  }

  // Dataset API
  static async getDatasetMetrics(): Promise<any> {
    try {
      const response = await api.get<{ success: boolean; metrics: any }>('/api/dataset/metrics');
      return response.data.metrics;
    } catch (error) {
      console.error('Failed to fetch dataset metrics:', error);
      throw error;
    }
  }

  static async triggerTraining(): Promise<void> {
    try {
      await api.post('/api/dataset/train');
    } catch (error) {
      console.error('Failed to trigger training:', error);
      throw error;
    }
  }

  // Monetization API
  static async getMonetizationTiers(): Promise<any[]> {
    try {
      const response = await api.get<{ success: boolean; tiers: any[] }>('/api/monetization/tiers');
      return response.data.tiers;
    } catch (error) {
      console.error('Failed to fetch monetization tiers:', error);
      throw error;
    }
  }
}

export default ApiService;
