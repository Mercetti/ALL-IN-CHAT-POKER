/**
 * Backend API Stubs for Upgrade System
 * Replace these with your actual backend implementations
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

export const upgradeTier = async (userId: string, tierId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscriptions`, {
      userId,
      tierId,
    });
    
    return response.data;
  } catch (error) {
      console.error('Upgrade tier error:', error);
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

export const getSubscription = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get subscription error:', error);
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

export const getAvailableSkills = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/skills/available/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get available skills error:', error);
      throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Cancel subscription error:', error);
      throw error;
  }
};

export default {
  upgradeTier,
  installSkill,
  getSubscription,
  getInstalledSkills,
  checkSkillCompatibility,
  getAvailableSkills,
  cancelSubscription
};
