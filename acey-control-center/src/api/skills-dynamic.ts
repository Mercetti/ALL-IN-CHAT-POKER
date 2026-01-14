/**
 * Dynamic Skills API Hooks
 * Backend integration for skill management with LLM orchestration
 */

import { Skill, SkillInstallationResponse, LLMOrchestrationPayload } from '../types/upgrade-dynamic';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

export const fetchAvailableSkills = async (userId: string): Promise<Skill[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch skills: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch skills error:', error);
    throw error;
  }
};

export const installSkill = async (userId: string, skillId: string): Promise<SkillInstallationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/install`, {
      method: 'POST',
      body: JSON.stringify({ userId, skillId }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to install skill: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Install skill error:', error);
    throw error;
  }
};

export const uninstallSkill = async (userId: string, skillId: string): Promise<SkillInstallationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/uninstall`, {
      method: 'POST',
      body: JSON.stringify({ userId, skillId }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to uninstall skill: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Uninstall skill error:', error);
    throw error;
  }
};

export const getInstalledSkills = async (userId: string): Promise<Skill[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/installed?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get installed skills: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Get installed skills error:', error);
    throw error;
  }
};

export const getSkillDetails = async (skillId: string): Promise<Skill> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}`);
    if (!response.ok) {
      throw new Error(`Failed to get skill details: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Get skill details error:', error);
    throw error;
  }
};

export const checkSkillCompatibility = async (skillId: string, userId: string): Promise<{
  compatible: boolean;
  requiredTier: string;
  currentTier: string;
  canInstall: boolean;
  reason?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/compatibility`, {
      method: 'POST',
      body: JSON.stringify({ skillId, userId }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check compatibility: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Check compatibility error:', error);
    throw error;
  }
};

// LLM orchestrator hook
export const orchestrateLLMUpgrade = async (payload: LLMOrchestrationPayload): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/orchestrate`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to orchestrate LLM upgrade: ${response.status}`);
    }
    
    // Success - LLM has been updated with new permissions, trust, and dataset access
    console.log('LLM orchestration completed successfully');
  } catch (error) {
    console.error('LLM orchestration error:', error);
    throw error;
  }
};

export const getSkillUsageStats = async (userId: string, skillId: string): Promise<{
  usageCount: number;
  lastUsed: string;
  avgResponseTime: number;
  errorRate: number;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}/usage?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get skill usage stats: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Get skill usage stats error:', error);
    throw error;
  }
};

export const searchSkills = async (userId: string, query: string): Promise<Skill[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/search?userId=${userId}&q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Failed to search skills: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Search skills error:', error);
    throw error;
  }
};

export default {
  fetchAvailableSkills,
  installSkill,
  uninstallSkill,
  getInstalledSkills,
  getSkillDetails,
  checkSkillCompatibility,
  orchestrateLLMUpgrade,
  getSkillUsageStats,
  searchSkills
};
