/**
 * Future Skill TypeScript Interfaces
 * Types for upcoming skills, pre-purchase, and wishlist functionality
 */

export interface FutureSkill {
  id: string;
  name: string;
  description: string;
  price: number;
  requiredTierId: string;
  releaseDate: string; // ISO date
  prePurchased: boolean; // user can buy before release
  wishlisted: boolean;  // user wants to be notified
  category: 'monitoring' | 'optimization' | 'creative' | 'ops_automation' | 'analytics' | 'social';
  features?: string[];
  estimatedDevelopmentDays?: number;
  progressPercentage?: number; // Development progress
  earlyAccessDiscount?: number; // Percentage discount for pre-purchase
  previewImage?: string;
  developerNotes?: string;
  teamSize?: number;
}

export interface FutureSkillResponse {
  success: boolean;
  skill?: FutureSkill;
  message?: string;
  error?: string;
}

export interface PrePurchaseResponse {
  success: boolean;
  prePurchase?: {
    id: string;
    skillId: string;
    userId: string;
    purchaseDate: number;
    releaseDate: string;
    originalPrice: number;
    paidPrice: number;
    discountApplied: number;
  };
  llmPreparationStarted?: boolean;
  datasetEntriesCreated?: number;
  error?: string;
}

export interface WishlistResponse {
  success: boolean;
  wishlist?: {
    id: string;
    skillId: string;
    userId: string;
    addedDate: number;
    notificationsEnabled: boolean;
  };
  notificationPreferences?: {
    releaseAlert: boolean;
    discountAlert: boolean;
    progressUpdates: boolean;
  };
  error?: string;
}

export interface FutureSkillStats {
  totalFutureSkills: number;
  prePurchasedSkills: number;
  wishlistedSkills: number;
  comingSoon: number; // Skills releasing in next 30 days
  totalSavings: number; // Total savings from pre-purchases
  averageDevelopmentProgress: number;
}

export interface LLMPreparationStatus {
  skillId: string;
  status: 'not_started' | 'data_collection' | 'model_training' | 'testing' | 'ready';
  datasetEntries: number;
  targetDatasetEntries: number;
  modelAccuracy?: number;
  estimatedCompletionDate?: string;
  preparationStartedAt?: number;
}

export interface FutureSkillFilter {
  category?: string;
  priceRange?: { min: number; max: number };
  releaseWindow?: 'week' | 'month' | 'quarter' | 'year';
  tierRequired?: string;
  status?: 'all' | 'pre_purchased' | 'wishlisted' | 'available';
}
