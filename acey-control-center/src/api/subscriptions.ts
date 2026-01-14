/**
 * API calls for subscriptions and skill installation
 * Production-ready API integration for upgrade flows
 */

import axios from 'axios';
import { SubscriptionResponse, SkillInstallationResponse } from '../types/upgrade';

const API_BASE_URL = 'http://localhost:8080/api'; // In production, use actual API URL

export const subscriptionsAPI = {
  /**
   * Create or update subscription
   */
  async createSubscription: async (tierId: string): Promise<SubscriptionResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscriptions`, {
        tierId,
      });
      
      return response.data;
    } catch (error) {
      console.error('Subscription API error:', error);
      throw error;
    }
  },

  /**
   * Get current subscription status
   */
  async getSubscription: async (tenantId: string): Promise<SubscriptionResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Get subscription error:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription: async (subscriptionId: string): Promise<SubscriptionResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  },

  /**
   * Get subscription usage
   */
  async getUsage: async (tenantId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/${tenantId}/usage`);
      return response.data;
    } catch (error) {
      console.error('Get usage error:', error);
      throw error;
    }
  }
};

export const skillsAPI = {
  /**
   * Install skill
   */
  async installSkill: async (skillId: string, tenantId: string): Promise<SkillInstallationResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/skills/install`, {
        skillId,
        tenantId,
      });
      
      return response.data;
    } catch (error) {
      console.error('Skill installation error:', error);
      throw error;
    }
  },

  /**
   * Uninstall skill
   */
  async uninstallSkill: async (installationId: string): Promise<SkillInstallationResponse> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/skills/installations/${installationId}`);
      return response.data;
    } catch (error) {
      console.error('Skill uninstall error:', error);
      throw error;
    }
  },

  /**
   * Get installed skills
   */
  async getInstalledSkills: async (tenantId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/skills/installed/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Get installed skills error:', error);
      throw error;
    }
  },

  /**
   * Get skill details
   */
  async getSkillDetails: async (skillId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/skills/${skillId}`);
      return response.data;
    } catch (error) {
      console.error('Get skill details error:', error);
      throw error;
    }
  },

  /**
   * Get available skills for current tier
   */
  async getAvailableSkills: async (tenantId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/skills/available/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Get available skills error:', error);
      throw error;
    }
  },

  /**
   * Check skill compatibility
   */
  async checkCompatibility: async (skillId: string, tenantId: string): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/skills/compatibility`, {
        skillId,
        tenantId,
      });
      return response.data;
    } catch (error) {
      console.error('Check compatibility error:', error);
      throw error;
    }
  }
};

export default {
  subscriptions: subscriptionsAPI,
  skills: skillsAPI
};
