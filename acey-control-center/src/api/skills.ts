/**
 * Skills API Backend Stubs
 * Replace these with your actual backend implementations
 */

import axios from 'axios';
import { Skill } from '../types/upgrade';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

// Mock data for testing - replace with actual backend calls
export const getAllSkills = (): Skill[] => [
  {
    id: 'stream_ops',
    name: 'Acey Stream Ops Pro',
    price: 15,
    description: 'Monitor streams, detect errors, and approve fixes',
    category: 'monitoring',
    requiredTierId: 'Pro',
    installed: false,
  },
  {
    id: 'graphics_auto',
    name: 'Acey Graphics Wizard',
    price: 12,
    description: 'Auto-generate game graphics and cosmetics',
    category: 'creative',
    requiredTierId: 'Creator+',
    installed: false,
  },
  {
    id: 'audio_mixer',
    name: 'Acey Audio Maestro',
    price: 12,
    description: 'Auto-generate and optimize audio tracks',
    category: 'creative',
    requiredTierId: 'Creator+',
    installed: false,
  },
  {
    id: 'link_review',
    name: 'Acey Link Review Pro',
    price: 10,
    description: 'Review GitHub repos, gists, documentation, and issues',
    category: 'analysis',
    requiredTierId: 'Pro',
    installed: false,
  },
];

export const orchestrateLLMUpgrade = async ({ userId, skillId }: { userId: string; skillId: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/skills/orchestrate`, {
      userId,
      skillId,
    });
    
    return response.data;
  } catch (error) {
    console.error('Orchestrate LLM upgrade error:', error);
    throw error;
  }
};

export const installSkill = async (userId: string, skillId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/skills/install`, {
      userId,
      skillId,
    });
    
    return response.data;
  } catch (error) {
      console.error('Install skill error:', error);
      throw error;
  }
};

export const uninstallSkill = async (userId: string, skillId: string): Promise<any> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/skills/install`, {
      data: { userId, skillId }
    });
    
    return response.data;
  } catch (error) {
      console.error('Uninstall skill error:', error);
      throw error;
  }
};

export const getSkillDetails = async (skillId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/skills/${skillId}`);
    return response.data;
  } catch (error) {
      console.error('Get skill details error:', error);
      throw error;
  }
};

export const getAvailableSkills = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/skills/available/${userId}`);
    return response.data;
  } catch (error) {
      console.error('Get available skills error:', error);
      throw error;
  }
};

export const getInstalledSkills = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/skills/installed/${userId}`);
    return response.data;
  } catch (error) {
      console.error('Get installed skills error:', error);
      throw error;
  }
};

export const checkSkillCompatibility = async (skillId: string, userId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/skills/compatibility`, {
      skillId,
      userId,
    });
    
    return response.data;
  } catch (error) {
      console.error('Check compatibility error:', error);
      throw error;
  }
};

export default {
  installSkill,
  uninstallSkill,
  getSkillDetails,
  getAvailableSkills,
  getInstalledSkills,
  checkSkillCompatibility,
  getAllSkills,
  orchestrateLLMUpgrade
};
