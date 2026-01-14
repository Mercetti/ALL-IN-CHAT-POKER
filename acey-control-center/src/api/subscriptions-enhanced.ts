/**
 * Enhanced Subscriptions API with Skill Unlocking
 * Backend integration for tier upgrades with automatic skill unlocking
 */

import axios from 'axios';
import { Skill, User, SkillInstallationResponse } from '../types/upgrade-dynamic';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

export interface UpgradeTierResponse {
  success: boolean;
  user: User;
  unlockedSkills: Skill[];
  message?: string;
  error?: string;
}

export const upgradeTier = async (userId: string, tierId: string): Promise<UpgradeTierResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscriptions/upgrade`, {
      userId,
      tierId,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to upgrade tier');
    }
    
    return response.data;
  } catch (error) {
    console.error('Upgrade tier error:', error);
    throw error;
  }
};

export const getUserInfo = async (userId: string): Promise<{ user: User; availableSkills: Skill[] }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user info error:', error);
    throw error;
  }
};

export const getUnlockedSkills = async (userId: string, tierId: string): Promise<Skill[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/skills/unlocked?userId=${userId}&tierId=${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Get unlocked skills error:', error);
    throw error;
  }
};

export const installSkill = async (userId: string, skillId: string): Promise<SkillInstallationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/skills/install`, {
      userId,
      skillId,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to install skill');
    }
    
    return response.data;
  } catch (error) {
    console.error('Install skill error:', error);
    throw error;
  }
};

export const batchInstallSkills = async (userId: string, skillIds: string[]): Promise<SkillInstallationResponse[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/skills/batch-install`, {
      userId,
      skillIds,
    });
    
    return response.data;
  } catch (error) {
    console.error('Batch install skills error:', error);
    throw error;
  }
};

export default {
  upgradeTier,
  getUserInfo,
  getUnlockedSkills,
  installSkill,
  batchInstallSkills
};
