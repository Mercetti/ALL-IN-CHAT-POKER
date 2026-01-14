/**
 * Review Memory Storage System
 * Manages approved reviews and learning patterns for Acey's LLM
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinkReview } from '../api/linkReview';

const APPROVED_REVIEWS_KEY = '@AceyApprovedReviews';
const LEARNING_PATTERNS_KEY = '@AceyLearningPatterns';
const REVIEW_STATS_KEY = '@AceyReviewStats';

export interface ReviewStats {
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  mostReviewedType: string;
  lastReviewDate: string;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  category: 'code' | 'documentation' | 'issue' | 'general';
  frequency: number;
  lastApplied: string;
  effectiveness: number; // 0-1 rating of how well this pattern worked
}

/**
 * Store approved review in memory
 */
export async function storeApprovedReview(review: LinkReview): Promise<void> {
  try {
    const existingReviews = await getApprovedReviews();
    const updatedReviews = [...existingReviews, review];
    
    await AsyncStorage.setItem(APPROVED_REVIEWS_KEY, JSON.stringify(updatedReviews));
    
    // Update learning patterns
    await extractLearningPatterns(review);
    
    // Update stats
    await updateReviewStats(true);
    
    console.log('✅ Review stored in memory:', review.url);
  } catch (error) {
    console.error('❌ Error storing review:', error);
    throw error;
  }
}

/**
 * Get all approved reviews
 */
export async function getApprovedReviews(): Promise<LinkReview[]> {
  try {
    const stored = await AsyncStorage.getItem(APPROVED_REVIEWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Error getting approved reviews:', error);
    return [];
  }
}

/**
 * Clear approved reviews
 */
export async function clearApprovedReviews(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APPROVED_REVIEWS_KEY);
    await AsyncStorage.removeItem(REVIEW_STATS_KEY);
    console.log('🗑️ Approved reviews cleared');
  } catch (error) {
    console.error('❌ Error clearing approved reviews:', error);
    throw error;
  }
}

/**
 * Extract learning patterns from approved reviews
 */
async function extractLearningPatterns(review: LinkReview): Promise<void> {
  try {
    const existingPatterns = await getLearningPatterns();
    
    // Extract patterns from suggestions and highlights
    const newPatterns: LearningPattern[] = [];
    
    // Pattern from suggestions
    review.suggestions.forEach((suggestion, index) => {
      const pattern: LearningPattern = {
        id: `suggestion_${Date.now()}_${index}`,
        pattern: suggestion,
        category: review.type === 'GitHubRepo' || review.type === 'Gist' ? 'code' : 'general',
        frequency: 1,
        lastApplied: new Date().toISOString(),
        effectiveness: 0.5 // Default effectiveness
      };
      newPatterns.push(pattern);
    });
    
    // Pattern from highlights
    review.highlights.forEach((highlight, index) => {
      const pattern: LearningPattern = {
        id: `highlight_${Date.now()}_${index}`,
        pattern: highlight,
        category: 'general',
        frequency: 1,
        lastApplied: new Date().toISOString(),
        effectiveness: 0.7 // Highlights usually more effective
      };
      newPatterns.push(pattern);
    });
    
    // Merge with existing patterns
    const mergedPatterns = [...existingPatterns, ...newPatterns];
    
    // Update frequency of existing patterns
    const updatedPatterns = mergedPatterns.map(pattern => {
      const existing = existingPatterns.find(p => p.pattern === pattern.pattern);
      if (existing) {
        return {
          ...pattern,
          frequency: existing.frequency + 1,
          lastApplied: new Date().toISOString()
        };
      }
      return pattern;
    });
    
    await AsyncStorage.setItem(LEARNING_PATTERNS_KEY, JSON.stringify(updatedPatterns));
    console.log('🧠 Learning patterns updated:', updatedPatterns.length);
  } catch (error) {
    console.error('❌ Error extracting patterns:', error);
  }
}

/**
 * Get all learning patterns
 */
export async function getLearningPatterns(): Promise<LearningPattern[]> {
  try {
    const stored = await AsyncStorage.getItem(LEARNING_PATTERNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Error getting learning patterns:', error);
    return [];
  }
}

/**
 * Get effective learning patterns (filtered by effectiveness)
 */
export async function getEffectivePatterns(minEffectiveness: number = 0.6): Promise<LearningPattern[]> {
  try {
    const patterns = await getLearningPatterns();
    return patterns.filter(pattern => pattern.effectiveness >= minEffectiveness);
  } catch (error) {
    console.error('❌ Error getting effective patterns:', error);
    return [];
  }
}

/**
 * Update pattern effectiveness based on user feedback
 */
export async function updatePatternEffectiveness(patternId: string, effectiveness: number): Promise<void> {
  try {
    const patterns = await getLearningPatterns();
    const updatedPatterns = patterns.map(pattern => 
      pattern.id === patternId 
        ? { ...pattern, effectiveness, lastApplied: new Date().toISOString() }
        : pattern
    );
    
    await AsyncStorage.setItem(LEARNING_PATTERNS_KEY, JSON.stringify(updatedPatterns));
    console.log('📈 Pattern effectiveness updated:', patternId, effectiveness);
  } catch (error) {
    console.error('❌ Error updating pattern effectiveness:', error);
  }
}

/**
 * Get review statistics
 */
export async function getReviewStats(): Promise<ReviewStats> {
  try {
    const stored = await AsyncStorage.getItem(REVIEW_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default stats
    return {
      totalReviews: 0,
      approvedReviews: 0,
      averageRating: 0,
      mostReviewedType: 'Other',
      lastReviewDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting review stats:', error);
    return {
      totalReviews: 0,
      approvedReviews: 0,
      averageRating: 0,
      mostReviewedType: 'Other',
      lastReviewDate: new Date().toISOString()
    };
  }
}

/**
 * Update review statistics
 */
async function updateReviewStats(approved: boolean): Promise<void> {
  try {
    const stats = await getReviewStats();
    
    const updatedStats: ReviewStats = {
      ...stats,
      totalReviews: stats.totalReviews + 1,
      approvedReviews: approved ? stats.approvedReviews + 1 : stats.approvedReviews,
      lastReviewDate: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(REVIEW_STATS_KEY, JSON.stringify(updatedStats));
  } catch (error) {
    console.error('❌ Error updating review stats:', error);
  }
}

/**
 * Get patterns by category
 */
export async function getPatternsByCategory(category: LearningPattern['category']): Promise<LearningPattern[]> {
  try {
    const patterns = await getLearningPatterns();
    return patterns.filter(pattern => pattern.category === category);
  } catch (error) {
    console.error('❌ Error getting patterns by category:', error);
    return [];
  }
}

/**
 * Search patterns by keyword
 */
export async function searchPatterns(keyword: string): Promise<LearningPattern[]> {
  try {
    const patterns = await getLearningPatterns();
    return patterns.filter(pattern => 
      pattern.pattern.toLowerCase().includes(keyword.toLowerCase())
    );
  } catch (error) {
    console.error('❌ Error searching patterns:', error);
    return [];
  }
}

/**
 * Export learning data for backup
 */
export async function exportLearningData(): Promise<string> {
  try {
    const reviews = await getApprovedReviews();
    const patterns = await getLearningPatterns();
    const stats = await getReviewStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      reviews,
      patterns,
      stats
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('❌ Error exporting learning data:', error);
    return '{}';
  }
}
