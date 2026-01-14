/**
 * Enhanced Skills API with Complete Skill Database Integration
 * Backend integration for all skills including current and future offerings
 */

import axios from 'axios';
import { Skill, SkillInstallationResponse } from '../types/upgrade-dynamic';
import { 
  ALL_SKILLS, 
  SKILLS_BY_TIER, 
  SKILLS_BY_CATEGORY,
  AUTO_UNLOCKED_SKILLS 
} from '../data/skillsDatabase';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

export const fetchAvailableSkills = async (userId: string): Promise<Skill[]> => {
  try {
    // In production, this would call your backend
    // const response = await fetch(`${API_BASE_URL}/skills?userId=${userId}`);
    // return response.json();
    
    // For now, return all skills with installation status
    // In production, backend would determine installed status
    return ALL_SKILLS.map(skill => ({
      ...skill,
      installed: false // Backend would determine this
    }));
  } catch (error) {
    console.error('Fetch skills error:', error);
    throw error;
  }
};

export const fetchSkillsByTier = async (userId: string, tierId: string): Promise<Skill[]> => {
  try {
    // In production, call backend with tier filter
    // const response = await fetch(`${API_BASE_URL}/skills/by-tier?userId=${userId}&tierId=${tierId}`);
    // return response.json();
    
    return SKILLS_BY_TIER[tierId] || [];
  } catch (error) {
    console.error('Fetch skills by tier error:', error);
    throw error;
  }
};

export const fetchSkillsByCategory = async (userId: string, category: string): Promise<Skill[]> => {
  try {
    // In production, call backend with category filter
    // const response = await fetch(`${API_BASE_URL}/skills/by-category?userId=${userId}&category=${category}`);
    // return response.json();
    
    return SKILLS_BY_CATEGORY[category] || [];
  } catch (error) {
    console.error('Fetch skills by category error:', error);
    throw error;
  }
};

export const getUnlockedSkills = async (userId: string, tierId: string): Promise<Skill[]> => {
  try {
    const unlockedSkillIds = AUTO_UNLOCKED_SKILLS[tierId] || [];
    const unlockedSkills = ALL_SKILLS.filter(skill => 
      unlockedSkillIds.includes(skill.id)
    );
    
    return unlockedSkills;
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

export const getSkillDetails = async (skillId: string): Promise<Skill> => {
  try {
    // In production, call backend
    // const response = await fetch(`${API_BASE_URL}/skills/${skillId}`);
    // return response.json();
    
    const skill = ALL_SKILLS.find(s => s.id === skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }
    
    return skill;
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
    const skill = await getSkillDetails(skillId);
    
    // In production, get user's current tier from backend
    const currentTier = 'creator-plus'; // Mock - get from backend
    
    const tiers = ['free', 'creator-plus', 'pro', 'enterprise'];
    const requiredIndex = tiers.indexOf(skill.requiredTierId);
    const currentIndex = tiers.indexOf(currentTier);
    
    const canInstall = currentIndex >= requiredIndex;
    
    return {
      compatible: canInstall,
      requiredTier: skill.requiredTierId,
      currentTier,
      canInstall,
      reason: canInstall ? undefined : `Requires ${skill.requiredTierId} tier or higher`
    };
  } catch (error) {
    console.error('Check compatibility error:', error);
    throw error;
  }
};

export const getPopularSkills = async (userId: string): Promise<Skill[]> => {
  try {
    // In production, call backend for popular skills based on user data
    // const response = await fetch(`${API_BASE_URL}/skills/popular?userId=${userId}`);
    // return response.json();
    
    // Return top rated skills with good review counts
    return ALL_SKILLS
      .filter(skill => skill.rating && skill.reviews && skill.rating >= 4.5 && skill.reviews >= 100)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  } catch (error) {
    console.error('Get popular skills error:', error);
    throw error;
  }
};

export const getNewSkills = async (userId: string): Promise<Skill[]> => {
  try {
    // In production, call backend for recently added/updated skills
    // const response = await fetch(`${API_BASE_URL}/skills/new?userId=${userId}`);
    // return response.json();
    
    return ALL_SKILLS
      .filter(skill => skill.lastUpdated)
      .sort((a, b) => new Date(b.lastUpdated!).getTime() - new Date(a.lastUpdated!).getTime())
      .slice(0, 4);
  } catch (error) {
    console.error('Get new skills error:', error);
    throw error;
  }
};

export const getTrialSkills = async (userId: string): Promise<Skill[]> => {
  try {
    // In production, call backend for skills with trials
    // const response = await fetch(`${API_BASE_URL}/skills/trial?userId=${userId}`);
    // return response.json();
    
    return ALL_SKILLS.filter(skill => skill.trialDays && skill.trialDays > 0);
  } catch (error) {
    console.error('Get trial skills error:', error);
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

export default {
  fetchAvailableSkills,
  fetchSkillsByTier,
  fetchSkillsByCategory,
  getUnlockedSkills,
  installSkill,
  batchInstallSkills,
  getSkillDetails,
  checkSkillCompatibility,
  getPopularSkills,
  getNewSkills,
  getTrialSkills,
  searchSkills,
  getSkillUsageStats
};
