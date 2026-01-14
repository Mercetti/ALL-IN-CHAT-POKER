/**
 * Enhanced LLM Orchestrator with Timestamps and Enhanced Tracking
 * Advanced LLM integration for permissions, trust, and dataset management
 */

import axios from 'axios';
import { LLMOrchestrationPayload } from '../types/upgrade-dynamic';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

export interface EnhancedLLMPayload extends LLMOrchestrationPayload {
  timestamp: number;
  sessionId?: string;
  metadata?: {
    source: 'skill_install' | 'tier_upgrade' | 'skill_uninstall';
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface LLMOrchestrationResponse {
  success: boolean;
  permissionsUpdated: string[];
  trustLevelUpdated: number;
  datasetAccessUpdated: string[];
  memoryProvenance?: {
    skillId?: string;
    addedToDataset: boolean;
    timestamp: number;
  };
  message?: string;
  error?: string;
}

export const orchestrateLLMUpgrade = async (payload: EnhancedLLMPayload): Promise<LLMOrchestrationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/orchestrate`, payload);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to orchestrate LLM upgrade');
    }
    
    console.log('LLM orchestration completed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('LLM orchestration error:', error);
    throw error;
  }
};

export const updatePermissions = async (userId: string, permissions: string[]): Promise<string[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/permissions`, {
      userId,
      permissions,
      timestamp: Date.now()
    });
    
    return response.data.permissions;
  } catch (error) {
    console.error('Update permissions error:', error);
    throw error;
  }
};

export const updateTrustLevel = async (userId: string, trustLevel: number): Promise<number> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/trust`, {
      userId,
      trustLevel,
      timestamp: Date.now()
    });
    
    return response.data.trustLevel;
  } catch (error) {
    console.error('Update trust level error:', error);
    throw error;
  }
};

export const updateDatasetAccess = async (userId: string, datasetAccess: string[]): Promise<string[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/dataset`, {
      userId,
      datasetAccess,
      timestamp: Date.now()
    });
    
    return response.data.datasetAccess;
  } catch (error) {
    console.error('Update dataset access error:', error);
    throw error;
  }
};

export const getLLMStatus = async (userId: string): Promise<{
  permissions: string[];
  trustLevel: number;
  datasetAccess: string[];
  lastUpdated: number;
  activeSkills: string[];
  memoryProvenance: Array<{
    skillId: string;
    addedToDataset: boolean;
    timestamp: number;
  }>;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/llm/status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get LLM status error:', error);
    throw error;
  }
};

export const trackSkillUsage = async (userId: string, skillId: string, action: string, metadata?: any): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/llm/track-usage`, {
      userId,
      skillId,
      action,
      metadata,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Track skill usage error:', error);
    // Don't throw error for tracking
  }
};

export const getSkillMemoryProvenance = async (userId: string, skillId: string): Promise<{
  totalInteractions: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: number;
  memoryFootprint: number;
  datasetContributions: number;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/llm/skill-provenance/${userId}/${skillId}`);
    return response.data;
  } catch (error) {
    console.error('Get skill memory provenance error:', error);
    throw error;
  }
};

export default {
  orchestrateLLMUpgrade,
  updatePermissions,
  updateTrustLevel,
  updateDatasetAccess,
  getLLMStatus,
  trackSkillUsage,
  getSkillMemoryProvenance
};
