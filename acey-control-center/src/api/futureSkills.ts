/**
 * Future Skills API Hooks
 * API calls for future skills, pre-purchase, and wishlist functionality
 */

import axios from 'axios';
import { FutureSkill, PrePurchaseResponse, WishlistResponse, FutureSkillStats, LLMPreparationStatus, FutureSkillFilter } from '../types/futureSkill';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

// Mock data for development - replace with actual backend calls
const mockFutureSkills: FutureSkill[] = [
  {
    id: 'voice_modulation',
    name: 'Voice Modulation Studio',
    description: 'Real-time voice effects and modulation for stream entertainment',
    price: 18,
    requiredTierId: 'Creator+',
    releaseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    prePurchased: false,
    wishlisted: false,
    category: 'creative',
    features: ['Real-time effects', 'Voice cloning', 'Custom presets', 'Noise reduction'],
    estimatedDevelopmentDays: 45,
    progressPercentage: 78,
    earlyAccessDiscount: 20,
    previewImage: '/assets/future-skills/voice-modulation.jpg',
    developerNotes: 'Advanced DSP algorithms with low latency processing',
    teamSize: 3
  },
  {
    id: 'content_summaries',
    name: 'AI Content Summarizer',
    description: 'Automatically generate stream recaps, highlights, and social snippets',
    price: 22,
    requiredTierId: 'Pro',
    releaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    prePurchased: false,
    wishlisted: false,
    category: 'analytics',
    features: ['Auto highlights', 'Social media posts', 'Stream summaries', 'Clip detection'],
    estimatedDevelopmentDays: 60,
    progressPercentage: 45,
    earlyAccessDiscount: 15,
    previewImage: '/assets/future-skills/content-summarizer.jpg',
    developerNotes: 'Natural language processing with video analysis',
    teamSize: 5
  },
  {
    id: 'donation_incentives',
    name: 'Donation Incentive Manager',
    description: 'Dynamically reward donors with personalized cosmetic effects',
    price: 15,
    requiredTierId: 'Creator+',
    releaseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    prePurchased: false,
    wishlisted: false,
    category: 'social',
    features: ['Dynamic rewards', 'Personal effects', 'Donation tracking', 'Goal celebrations'],
    estimatedDevelopmentDays: 30,
    progressPercentage: 25,
    earlyAccessDiscount: 25,
    previewImage: '/assets/future-skills/donation-incentives.jpg',
    developerNotes: 'Integration with multiple donation platforms',
    teamSize: 2
  },
  {
    id: 'ai_co_host',
    name: 'AI Co-Host Companion',
    description: 'Interactive AI personality that runs chat games and engages audience',
    price: 35,
    requiredTierId: 'Enterprise',
    releaseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    prePurchased: false,
    wishlisted: false,
    category: 'social',
    features: ['Chat games', 'Audience interaction', 'Personality customization', 'Multi-language'],
    estimatedDevelopmentDays: 90,
    progressPercentage: 15,
    earlyAccessDiscount: 30,
    previewImage: '/assets/future-skills/ai-co-host.jpg',
    developerNotes: 'Advanced conversational AI with personality modeling',
    teamSize: 8
  },
  {
    id: 'moderation_assistant',
    name: 'Smart Moderation Assistant',
    description: 'AI-powered content moderation with custom rules and learning',
    price: 20,
    requiredTierId: 'Pro',
    releaseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    prePurchased: false,
    wishlisted: false,
    category: 'ops_automation',
    features: ['Auto moderation', 'Custom rules', 'Learning system', 'Appeal process'],
    estimatedDevelopmentDays: 40,
    progressPercentage: 65,
    earlyAccessDiscount: 10,
    previewImage: '/assets/future-skills/moderation-assistant.jpg',
    developerNotes: 'Machine learning for context-aware moderation',
    teamSize: 4
  }
];

const mockLLMPreparationStatus: { [key: string]: LLMPreparationStatus } = {
  'voice_modulation': {
    skillId: 'voice_modulation',
    status: 'model_training',
    datasetEntries: 845,
    targetDatasetEntries: 1000,
    modelAccuracy: 87,
    estimatedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    preparationStartedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  'content_summaries': {
    skillId: 'content_summaries',
    status: 'data_collection',
    datasetEntries: 234,
    targetDatasetEntries: 1500,
    estimatedCompletionDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    preparationStartedAt: Date.now() - 2 * 24 * 60 * 60 * 1000
  }
};

export const fetchFutureSkills = async (userId: string, filter?: FutureSkillFilter): Promise<FutureSkill[]> => {
  try {
    // In production: const response = await axios.get(`${API_BASE_URL}/futureSkills?userId=${userId}`, { params: filter });
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
    
    let filteredSkills = [...mockFutureSkills];
    
    // Apply filters
    if (filter) {
      if (filter.category) {
        filteredSkills = filteredSkills.filter(skill => skill.category === filter.category);
      }
      if (filter.priceRange) {
        filteredSkills = filteredSkills.filter(skill => 
          skill.price >= filter.priceRange!.min && skill.price <= filter.priceRange!.max
        );
      }
      if (filter.releaseWindow) {
        const now = Date.now();
        const windows = {
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
          quarter: 90 * 24 * 60 * 60 * 1000,
          year: 365 * 24 * 60 * 60 * 1000
        };
        filteredSkills = filteredSkills.filter(skill => {
          const releaseTime = new Date(skill.releaseDate).getTime();
          return (releaseTime - now) <= windows[filter.releaseWindow as keyof typeof windows];
        });
      }
      if (filter.tierRequired) {
        filteredSkills = filteredSkills.filter(skill => skill.requiredTierId === filter.tierRequired);
      }
      if (filter.status && filter.status !== 'all') {
        filteredSkills = filteredSkills.filter(skill => {
          switch (filter.status) {
            case 'pre_purchased': return skill.prePurchased;
            case 'wishlisted': return skill.wishlisted;
            case 'available': return !skill.prePurchased && !skill.wishlisted;
            default: return true;
          }
        });
      }
    }
    
    return filteredSkills;
  } catch (error) {
    console.error('Failed to fetch future skills:', error);
    throw new Error('Failed to load future skills');
  }
};

export const prePurchaseSkill = async (userId: string, skillId: string): Promise<PrePurchaseResponse> => {
  try {
    // In production: const response = await axios.post(`${API_BASE_URL}/prePurchaseSkill`, { userId, skillId });
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
    
    const skill = mockFutureSkills.find(s => s.id === skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    // Update skill status
    skill.prePurchased = true;
    
    // Calculate discount
    const discount = skill.earlyAccessDiscount || 0;
    const originalPrice = skill.price;
    const paidPrice = originalPrice * (1 - discount / 100);
    
    // Start LLM preparation
    const llmStatus = mockLLMPreparationStatus[skillId];
    const llmPreparationStarted = !!llmStatus;
    const datasetEntriesCreated = llmStatus?.datasetEntries || 0;
    
    return {
      success: true,
      prePurchase: {
        id: `pre_${Date.now()}`,
        skillId,
        userId,
        purchaseDate: Date.now(),
        releaseDate: skill.releaseDate,
        originalPrice,
        paidPrice,
        discountApplied: discount
      },
      llmPreparationStarted,
      datasetEntriesCreated
    };
  } catch (error) {
    console.error('Failed to pre-purchase skill:', error);
    return {
      success: false,
      error: 'Failed to pre-purchase skill'
    };
  }
};

export const wishlistSkill = async (userId: string, skillId: string): Promise<WishlistResponse> => {
  try {
    // In production: const response = await axios.post(`${API_BASE_URL}/wishlistSkill`, { userId, skillId });
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const skill = mockFutureSkills.find(s => s.id === skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    // Toggle wishlist status
    skill.wishlisted = !skill.wishlisted;
    
    return {
      success: true,
      wishlist: {
        id: `wl_${Date.now()}`,
        skillId,
        userId,
        addedDate: Date.now(),
        notificationsEnabled: true
      },
      notificationPreferences: {
        releaseAlert: true,
        discountAlert: true,
        progressUpdates: skill.wishlisted
      }
    };
  } catch (error) {
    console.error('Failed to wishlist skill:', error);
    return {
      success: false,
      error: 'Failed to update wishlist'
    };
  }
};

export const fetchFutureSkillStats = async (userId: string): Promise<FutureSkillStats> => {
  try {
    // In production: const response = await axios.get(`${API_BASE_URL}/futureSkillStats?userId=${userId}`);
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const prePurchasedSkills = mockFutureSkills.filter(s => s.prePurchased);
    const wishlistedSkills = mockFutureSkills.filter(s => s.wishlisted);
    const comingSoon = mockFutureSkills.filter(s => {
      const releaseTime = new Date(s.releaseDate).getTime();
      return (releaseTime - Date.now()) <= (30 * 24 * 60 * 60 * 1000);
    });
    
    const totalSavings = prePurchasedSkills.reduce((sum, skill) => {
      const discount = skill.earlyAccessDiscount || 0;
      return sum + (skill.price * discount / 100);
    }, 0);
    
    const averageProgress = mockFutureSkills.reduce((sum, skill) => sum + (skill.progressPercentage || 0), 0) / mockFutureSkills.length;
    
    return {
      totalFutureSkills: mockFutureSkills.length,
      prePurchasedSkills: prePurchasedSkills.length,
      wishlistedSkills: wishlistedSkills.length,
      comingSoon: comingSoon.length,
      totalSavings: Math.round(totalSavings),
      averageDevelopmentProgress: Math.round(averageProgress)
    };
  } catch (error) {
    console.error('Failed to fetch future skill stats:', error);
    throw new Error('Failed to load future skill stats');
  }
};

export const fetchLLMPreparationStatus = async (skillId: string): Promise<LLMPreparationStatus> => {
  try {
    // In production: const response = await axios.get(`${API_BASE_URL}/llmPreparationStatus?skillId=${skillId}`);
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const status = mockLLMPreparationStatus[skillId];
    if (!status) {
      return {
        skillId,
        status: 'not_started',
        datasetEntries: 0,
        targetDatasetEntries: 1000
      };
    }
    
    return status;
  } catch (error) {
    console.error('Failed to fetch LLM preparation status:', error);
    throw new Error('Failed to load LLM preparation status');
  }
};

export default {
  fetchFutureSkills,
  prePurchaseSkill,
  wishlistSkill,
  fetchFutureSkillStats,
  fetchLLMPreparationStatus
};
