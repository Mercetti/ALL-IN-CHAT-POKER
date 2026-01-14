/**
 * LLM Orchestration API
 * Hook into your LLM orchestrator for permissions, trust, and dataset updates
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

export interface LLMOrchestrationRequest {
  userId: string;
  tierId?: string;
  skillId?: string;
  action: 'upgrade' | 'install_skill' | 'uninstall_skill';
  permissions?: string[];
  trustLevel?: number;
  datasetAccess?: string[];
}

export const orchestrateLLMUpgrade = async (request: LLMOrchestrationRequest): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/orchestrate`, request);
    return response.data;
  } catch (error) {
    console.error('LLM orchestration error:', error);
    throw error;
  }
};

export const updatePermissions = async (userId: string, permissions: string[]): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/permissions`, {
      userId,
      permissions,
    });
    return response.data;
  } catch (error) {
    console.error('Update permissions error:', error);
    throw error;
  }
};

export const updateTrustLevel = async (userId: string, trustLevel: number): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/trust`, {
      userId,
      trustLevel,
    });
    return response.data;
  } catch (error) {
    console.error('Update trust level error:', error);
    throw error;
  }
};

export const updateDatasetAccess = async (userId: string, datasetAccess: string[]): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/llm/dataset`, {
      userId,
      datasetAccess,
    });
    return response.data;
  } catch (error) {
    console.error('Update dataset access error:', error);
    throw error;
  }
};

export const getLLMStatus = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/llm/status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get LLM status error:', error);
    throw error;
  }
};

export default {
  orchestrateLLMUpgrade,
  updatePermissions,
  updateTrustLevel,
  updateDatasetAccess,
  getLLMStatus
};
