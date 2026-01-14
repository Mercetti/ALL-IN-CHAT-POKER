/**
 * Tier-Gated Review Features
 * Provides different review capabilities based on user tier
 */

import { LinkReview, LinkType, ReviewOptions } from './linkReview';
import { getTrustLevel } from '../utils';

export type UserTier = 'Free' | 'Pro' | 'Creator+' | 'Enterprise';

export interface TieredReviewCapabilities {
  maxContentLength: number;
  supportedLinkTypes: LinkType[];
  canDownloadContent: boolean;
  canExportAnalysis: boolean;
  maxBatchSize: number;
  advancedFeatures: string[];
}

export interface TieredReviewOptions extends ReviewOptions {
  userTier?: UserTier;
  includeAdvancedAnalysis?: boolean;
}

/**
 * Get tier capabilities for link review
 */
export function getTierCapabilities(tier: UserTier): TieredReviewCapabilities {
  switch (tier) {
    case 'Free':
      return {
        maxContentLength: 10000,
        supportedLinkTypes: ['GitHubRepo', 'Gist', 'Documentation'],
        canDownloadContent: false,
        canExportAnalysis: false,
        maxBatchSize: 1,
        advancedFeatures: []
      };
    
    case 'Pro':
      return {
        maxContentLength: 50000,
        supportedLinkTypes: ['GitHubRepo', 'Gist', 'Documentation', 'Issue', 'Media'],
        canDownloadContent: true,
        canExportAnalysis: true,
        maxBatchSize: 5,
        advancedFeatures: ['Syntax highlighting', 'Code quality scoring', 'Security analysis']
      };
    
    case 'Creator+':
      return {
        maxContentLength: 100000,
        supportedLinkTypes: ['GitHubRepo', 'Gist', 'Documentation', 'Issue', 'Media', 'Other'],
        canDownloadContent: true,
        canExportAnalysis: true,
        maxBatchSize: 20,
        advancedFeatures: [
          'Syntax highlighting',
          'Code quality scoring', 
          'Security analysis',
          'Performance profiling',
          'Auto-fix suggestions',
          'Integration with development tools'
        ]
      };
    
    case 'Enterprise':
      return {
        maxContentLength: 500000,
        supportedLinkTypes: ['GitHubRepo', 'Gist', 'Documentation', 'Issue', 'Media', 'Other'],
        canDownloadContent: true,
        canExportAnalysis: true,
        maxBatchSize: 100,
        advancedFeatures: [
          'Syntax highlighting',
          'Code quality scoring',
          'Security analysis',
          'Performance profiling',
          'Auto-fix suggestions',
          'Integration with development tools',
          'Custom analysis templates',
          'Team collaboration features',
          'Advanced reporting',
          'API integration'
        ]
      };
    
    default:
      return getTierCapabilities('Free');
  }
}

/**
 * Check if user can review specific link type
 */
export function canReviewLinkType(linkType: LinkType, userTier: UserTier): boolean {
  const capabilities = getTierCapabilities(userTier);
  return capabilities.supportedLinkTypes.includes(linkType);
}

/**
 * Get enhanced review options based on tier
 */
export function getTieredReviewOptions(baseOptions: ReviewOptions, userTier: UserTier): TieredReviewOptions {
  const capabilities = getTierCapabilities(userTier);
  
  return {
    ...baseOptions,
    userTier,
    maxContentLength: Math.min(baseOptions.maxContentLength || Infinity, capabilities.maxContentLength),
    includeAdvancedAnalysis: capabilities.advancedFeatures.length > 0
  };
}

/**
 * Apply tier-specific analysis enhancements
 */
export async function applyTierAnalysis(
  content: string, 
  linkType: LinkType, 
  userTier: UserTier,
  baseAnalysis: Partial<LinkReview>
): Promise<Partial<LinkReview>> {
  const capabilities = getTierCapabilities(userTier);
  const enhancedAnalysis = { ...baseAnalysis };
  
  // Add tier-specific features
  if (userTier !== 'Free' && capabilities.advancedFeatures.length > 0) {
    enhancedAnalysis.suggestions = [
      ...(enhancedAnalysis.suggestions || []),
      ...getTierSpecificSuggestions(linkType, userTier)
    ];
    
    enhancedAnalysis.highlights = [
      ...(enhancedAnalysis.highlights || []),
      ...getTierSpecificHighlights(content, userTier)
    ];
  }
  
  // Add rating for Pro+ tiers
  if (userTier !== 'Free') {
    enhancedAnalysis.rating = calculateTierRating(content, linkType, userTier);
  }
  
  return enhancedAnalysis;
}

/**
 * Get tier-specific suggestions
 */
function getTierSpecificSuggestions(linkType: LinkType, userTier: UserTier): string[] {
  const suggestions: string[] = [];
  
  switch (linkType) {
    case 'GitHubRepo':
    case 'Gist':
      if (userTier === 'Pro') {
        suggestions.push('Consider adding unit tests for better code coverage');
        suggestions.push('Review code complexity and maintainability');
      }
      if (userTier === 'Creator+') {
        suggestions.push('Set up automated CI/CD pipeline');
        suggestions.push('Consider microservices architecture for scalability');
      }
      if (userTier === 'Enterprise') {
        suggestions.push('Implement comprehensive security audit');
        suggestions.push('Set up enterprise monitoring and alerting');
      }
      break;
      
    case 'Documentation':
      if (userTier === 'Pro') {
        suggestions.push('Add interactive examples and tutorials');
        suggestions.push('Include API documentation with examples');
      }
      if (userTier === 'Creator+') {
        suggestions.push('Create video walkthroughs for complex topics');
        suggestions.push('Add search functionality to documentation');
      }
      break;
      
    case 'Issue':
      if (userTier === 'Pro') {
        suggestions.push('Analyze issue impact and priority');
        suggestions.push('Suggest related issues that might be affected');
      }
      if (userTier === 'Creator+') {
        suggestions.push('Provide automated fix suggestions');
        suggestions.push('Include test cases for bug reproduction');
      }
      break;
  }
  
  return suggestions;
}

/**
 * Get tier-specific highlights
 */
function getTierSpecificHighlights(content: string, userTier: UserTier): string[] {
  const highlights: string[] = [];
  
  if (userTier === 'Pro') {
    // Basic code quality highlights
    if (content.includes('function') || content.includes('class')) {
      highlights.push('Good function/class structure detected');
    }
    if (content.includes('async') || content.includes('await')) {
      highlights.push('Asynchronous patterns properly implemented');
    }
  }
  
  if (userTier === 'Creator+') {
    // Advanced pattern detection
    if (content.includes('try') && content.includes('catch')) {
      highlights.push('Error handling patterns implemented');
    }
    if (content.includes('test') || content.includes('spec')) {
      highlights.push('Testing practices detected');
    }
  }
  
  if (userTier === 'Enterprise') {
    // Enterprise-level analysis
    if (content.includes('security') || content.includes('auth')) {
      highlights.push('Security considerations identified');
    }
    if (content.includes('scale') || content.includes('performance')) {
      highlights.push('Performance and scalability factors found');
    }
  }
  
  return highlights;
}

/**
 * Calculate tier-specific rating
 */
function calculateTierRating(content: string, linkType: LinkType, userTier: UserTier): 'excellent' | 'good' | 'needs-work' | 'poor' {
  // Simple scoring algorithm - enhance with actual LLM integration
  let score = 50; // Base score
  
  // Content quality factors
  if (content.length > 1000) score += 10;
  if (content.includes('documentation') || content.includes('comment')) score += 15;
  if (content.includes('test')) score += 10;
  if (content.includes('error') || content.includes('catch')) score += 5;
  
  // Tier bonuses
  if (userTier === 'Creator+') score += 10;
  if (userTier === 'Enterprise') score += 15;
  
  // Convert to rating
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-work';
  return 'poor';
}

/**
 * Get user's current tier (integrate with existing auth system)
 */
export async function getCurrentUserTier(): Promise<UserTier> {
  try {
    const trustLevel = await getTrustLevel();
    
    // Map trust levels to tiers (customize based on your auth system)
    if (trustLevel >= 80) return 'Enterprise';
    if (trustLevel >= 60) return 'Creator+';
    if (trustLevel >= 40) return 'Pro';
    return 'Free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'Free';
  }
}

/**
 * Check if user can access advanced feature
 */
export function canAccessAdvancedFeature(feature: string, userTier: UserTier): boolean {
  const capabilities = getTierCapabilities(userTier);
  return capabilities.advancedFeatures.includes(feature);
}

/**
 * Get upgrade prompt for tier-gated features
 */
export function getUpgradePrompt(currentTier: UserTier, requiredTier: UserTier): string {
  if (currentTier === requiredTier) return '';
  
  const tierNames = {
    'Free': 'Free',
    'Pro': 'Pro',
    'Creator+': 'Creator+',
    'Enterprise': 'Enterprise'
  };
  
  return `This feature requires ${tierNames[requiredTier]} tier. Upgrade from ${tierNames[currentTier]} to unlock advanced review capabilities.`;
}
