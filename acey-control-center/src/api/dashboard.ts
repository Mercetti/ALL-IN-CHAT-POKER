/**
 * Dashboard API Hooks
 * Centralized API calls for Skill Store + Upgrade Dashboard
 */

import axios from 'axios';
import { Skill, LLMMetrics, Tier, DashboardStats, SkillInstallationResponse, TierUpgradeResponse } from '../types/dashboard';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

// Mock data for development - replace with actual backend calls
const mockSkills: Skill[] = [
  {
    id: 'stream_ops',
    name: 'Acey Stream Ops Pro',
    description: 'Monitor streams, detect errors, and approve fixes',
    price: 15,
    requiredTierId: 'Pro',
    installed: false,
    category: 'monitoring',
    rating: 4.8,
    reviews: 127,
    trialDays: 7,
    features: ['Real-time monitoring', 'Error detection', 'Mobile approvals']
  },
  {
    id: 'graphics_auto',
    name: 'Acey Graphics Wizard',
    description: 'Auto-generate game graphics and cosmetics',
    price: 12,
    requiredTierId: 'Creator+',
    installed: false,
    category: 'creative',
    rating: 4.6,
    reviews: 89,
    trialDays: 14,
    features: ['Auto-generation', 'Custom cosmetics', 'Style templates']
  },
  {
    id: 'audio_mixer',
    name: 'Acey Audio Maestro',
    description: 'Auto-generate and optimize audio tracks',
    price: 12,
    requiredTierId: 'Creator+',
    installed: false,
    category: 'creative',
    rating: 4.5,
    reviews: 156,
    trialDays: 14,
    features: ['Audio optimization', 'Track generation', 'Quality enhancement']
  },
  {
    id: 'analytics_insights',
    name: 'Analytics & Insights',
    description: 'Stream performance predictions and engagement graphs',
    price: 18,
    requiredTierId: 'Pro',
    installed: false,
    category: 'monitoring',
    rating: 4.7,
    reviews: 203,
    trialDays: 7,
    features: ['Performance analytics', 'Engagement insights', 'Predictive modeling']
  },
  {
    id: 'event_automation',
    name: 'Event Automation',
    description: 'Auto-run peak-time events and notifications',
    price: 20,
    requiredTierId: 'Pro',
    installed: false,
    category: 'ops_automation',
    rating: 4.9,
    reviews: 67,
    trialDays: 7,
    features: ['Scheduled events', 'Auto-notifications', 'Peak-time optimization']
  }
];

const mockMetrics: LLMMetrics[] = [
  {
    skillId: 'stream_ops',
    trustScore: 85,
    datasetEntries: 1247,
    permissionsGranted: ['monitor_stream', 'approve_fixes'],
    lastUpdated: Date.now(),
    performanceMetrics: {
      responseTime: 120,
      accuracy: 94,
      reliability: 98
    }
  },
  {
    skillId: 'graphics_auto',
    trustScore: 78,
    datasetEntries: 892,
    permissionsGranted: ['generate_graphics', 'modify_cosmetics'],
    lastUpdated: Date.now(),
    performanceMetrics: {
      responseTime: 200,
      accuracy: 91,
      reliability: 95
    }
  },
  {
    skillId: 'audio_mixer',
    trustScore: 82,
    datasetEntries: 634,
    permissionsGranted: ['optimize_audio', 'generate_tracks'],
    lastUpdated: Date.now(),
    performanceMetrics: {
      responseTime: 180,
      accuracy: 89,
      reliability: 96
    }
  }
];

const mockTiers: Tier[] = [
  {
    id: 'Creator+',
    name: 'Creator Plus',
    price: 25,
    description: 'Perfect for growing creators with advanced needs',
    features: ['Up to 10 skills', 'Basic analytics', 'Email support'],
    maxSkills: 10,
    prioritySupport: false,
    billing: 'monthly'
  },
  {
    id: 'Pro',
    name: 'Professional',
    price: 50,
    description: 'Professional tools for serious streamers',
    features: ['Unlimited skills', 'Advanced analytics', 'Priority support', 'Custom integrations'],
    popular: true,
    maxSkills: -1,
    prioritySupport: true,
    billing: 'monthly'
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    price: 150,
    description: 'Complete solution for teams and organizations',
    features: ['Everything in Pro', 'Team management', 'Custom AI models', 'Dedicated support'],
    maxSkills: -1,
    prioritySupport: true,
    billing: 'monthly'
  }
];

export const fetchAllSkills = async (userId: string): Promise<Skill[]> => {
  try {
    // In production: const response = await axios.get(`${API_BASE_URL}/skills?userId=${userId}`);
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return mockSkills;
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    throw new Error('Failed to load skills');
  }
};

export const upgradeUserTier = async (userId: string, tierId: string): Promise<TierUpgradeResponse> => {
  try {
    // In production: const response = await axios.post(`${API_BASE_URL}/upgradeTier`, { userId, tierId });
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    
    const unlockedSkills = mockSkills.filter(skill => 
      skill.requiredTierId === tierId && !skill.installed
    );
    
    return {
      success: true,
      subscription: {
        id: `sub_${Date.now()}`,
        tierId,
        status: 'active',
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      },
      unlockedSkills,
      newPermissions: [`tier_${tierId.toLowerCase()}_access`]
    };
  } catch (error) {
    console.error('Failed to upgrade tier:', error);
    return {
      success: false,
      error: 'Failed to upgrade tier'
    };
  }
};

export const installSkill = async (userId: string, skillId: string): Promise<SkillInstallationResponse> => {
  try {
    // In production: const response = await axios.post(`${API_BASE_URL}/installSkill`, { userId, skillId });
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate installation
    
    const skill = mockSkills.find(s => s.id === skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    return {
      success: true,
      installation: {
        id: `inst_${Date.now()}`,
        skillId,
        status: 'installed',
        installedAt: Date.now()
      },
      unlockedFeatures: skill.features || []
    };
  } catch (error) {
    console.error('Failed to install skill:', error);
    return {
      success: false,
      error: 'Failed to install skill'
    };
  }
};

export const fetchLLMMetrics = async (userId: string): Promise<LLMMetrics[]> => {
  try {
    // In production: const response = await axios.get(`${API_BASE_URL}/llmMetrics?userId=${userId}`);
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMetrics;
  } catch (error) {
    console.error('Failed to fetch LLM metrics:', error);
    throw new Error('Failed to load LLM metrics');
  }
};

export const fetchTiers = async (): Promise<Tier[]> => {
  try {
    // In production: const response = await axios.get(`${API_BASE_URL}/tiers`);
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockTiers;
  } catch (error) {
    console.error('Failed to fetch tiers:', error);
    throw new Error('Failed to load tiers');
  }
};

export const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  try {
    const skills = await fetchAllSkills(userId);
    const metrics = await fetchLLMMetrics(userId);
    
    const installedSkills = skills.filter(s => s.installed).length;
    const totalTrustScore = metrics.reduce((sum, m) => sum + m.trustScore, 0) / metrics.length;
    const totalDatasetEntries = metrics.reduce((sum, m) => sum + m.datasetEntries, 0);
    const activePermissions = [...new Set(metrics.flatMap(m => m.permissionsGranted))];
    
    return {
      totalSkills: skills.length,
      installedSkills,
      availableSkills: skills.length - installedSkills,
      totalTrustScore: Math.round(totalTrustScore),
      totalDatasetEntries,
      activePermissions
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw new Error('Failed to load dashboard stats');
  }
};

export default {
  fetchAllSkills,
  upgradeUserTier,
  installSkill,
  fetchLLMMetrics,
  fetchTiers,
  fetchDashboardStats
};
