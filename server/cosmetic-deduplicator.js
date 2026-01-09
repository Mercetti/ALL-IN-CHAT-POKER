/**
 * Cosmetic Deduplicator - Smart duplicate detection and removal
 * Uses similarity algorithms and AI to identify duplicate cosmetics
 */

const Logger = require('./logger');
const logger = new Logger('COSMETIC-DEDUPLICATOR');
const ImageDeduplicator = require('./image-deduplicator');

class CosmeticDeduplicator {
  constructor() {
    this.cosmeticCache = new Map();
    this.similarityThreshold = 0.85;
    this.aiEnabled = true;
  }

  /**
   * Detect duplicates using similarity algorithms
   */
  detectDuplicates(cosmetics) {
    const duplicates = [];
    const processed = new Set();

    for (const cosmetic of cosmetics) {
      if (processed.has(cosmetic.id)) continue;

      const similar = this.findSimilar(cosmetics, cosmetic);
      if (similar.length > 0) {
        duplicates.push({
          original: cosmetic,
          duplicates: similar,
          similarityScores: similar.map(d => ({
            id: d.id,
            score: this.calculateSimilarity(cosmetic, d)
          }))
        });
      }

      processed.add(cosmetic.id);
    }

    logger.info('Duplicate detection completed', {
      totalCosmetics: cosmetics.length,
      duplicateGroups: duplicates.length,
      totalDuplicates: duplicates.reduce((sum, group) => sum + group.duplicates.length, 0)
    });

    return duplicates;
  }

  /**
   * Find similar cosmetics using multiple criteria
   */
  findSimilar(cosmetics, target) {
    return cosmetics.filter(c => {
      if (c.id === target.id) return false;
      
      const nameSimilarity = this.stringSimilarity(c.name, target.name);
      const descSimilarity = this.stringSimilarity(c.description || '', target.description || '');
      const priceSimilarity = c.price === target.price ? 1 : 0;
      const typeSimilarity = c.type === target.type ? 1 : 0;
      
      // Weighted similarity calculation
      const overallSimilarity = 
        (nameSimilarity * 0.4) +     // Name is most important
        (descSimilarity * 0.3) +    // Description matters
        (priceSimilarity * 0.2) +    // Price similarity
        (typeSimilarity * 0.1);     // Type similarity
      
      return overallSimilarity > this.similarityThreshold;
    });
  }

  /**
   * Calculate similarity between two strings
   */
  stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm for string similarity
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Remove duplicates automatically
   */
  async removeDuplicates(cosmetics) {
    const imageDeduplicator = new ImageDeduplicator();
    return await imageDeduplicator.removeDuplicates(cosmetics);
  }

  /**
   * Merge similar cosmetics with image awareness
   */
  async mergeSimilar(cosmetics) {
    const imageDeduplicator = new ImageDeduplicator();
    return await imageDeduplicator.mergeSimilar(cosmetics);
  }

  /**
   * AI-powered duplicate detection
   */
  async aiDetectDuplicates(cosmetics) {
    if (!this.aiEnabled) {
      return this.detectDuplicates(cosmetics);
    }

    try {
      const ai = require('./ai');
      
      const prompt = `
      Analyze these cosmetic items and identify duplicates with high accuracy.
      Consider name similarity, description similarity, price, and type.
      
      Items: ${JSON.stringify(cosmetics.slice(0, 10), null, 2)}
      
      Return JSON with:
      {
        "duplicates": [
          {
            "original": { "id": 1, "name": "Red Shirt", "price": 100 },
            "duplicates": [
              { "id": 2, "name": "Red T-Shirt", "price": 100 },
              { "id": 3, "name": "Red Tee", "price": 105 }
            ],
            "similarity": 0.95,
            "recommendation": "merge",
            "reason": "Similar names and prices"
          }
        ],
        "unique": [items without duplicates],
        "confidence": 0.92
      }
      `;

      const response = await ai.chat([
        { role: 'system', content: 'You are a data analyst. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 2000
      });

      const analysis = JSON.parse(response);
      
      logger.info('AI duplicate detection completed', {
        confidence: analysis.confidence,
        duplicateGroups: analysis.duplicates.length
      });

      return analysis;
    } catch (error) {
      logger.error('AI duplicate detection failed', { error: error.message });
      // Fallback to algorithmic detection
      return this.detectDuplicates(cosmetics);
    }
  }

  /**
   * Smart cleanup with AI assistance
   */
  async smartCleanup(cosmetics) {
    // First try AI detection
    const aiResult = await this.aiDetectDuplicates(cosmetics);
    
    // Combine AI and algorithmic results
    const algorithmicDuplicates = this.detectDuplicates(cosmetics);
    
    // Merge results for better accuracy
    const enhancedDuplicates = this.mergeDuplicateResults(aiResult.duplicates, algorithmicDuplicates);
    
    // Apply cleanup
    const cleaned = this.removeDuplicates(cosmetics);
    
    return {
      original: cosmetics,
      cleaned,
      duplicates: enhancedDuplicates,
      aiConfidence: aiResult.confidence || 0,
      algorithmicCount: algorithmicDuplicates.length,
      aiCount: aiResult.duplicates.length
    };
  }

  /**
   * Merge AI and algorithmic duplicate results
   */
  mergeDuplicateResults(aiDuplicates, algorithmicDuplicates) {
    const merged = [];
    const processed = new Set();

    // Add AI-detected duplicates
    aiDuplicates.forEach(group => {
      if (!processed.has(group.original.id)) {
        merged.push(group);
        processed.add(group.original.id);
        group.duplicates.forEach(d => processed.add(d.id));
      }
    });

    // Add algorithmic duplicates not found by AI
    algorithmicDuplicates.forEach(group => {
      if (!processed.has(group.original.id)) {
        merged.push(group);
        processed.add(group.original.id);
        group.duplicates.forEach(d => processed.add(d.id));
      }
    });

    return merged;
  }

  /**
   * Generate cleanup report
   */
  generateCleanupReport(original, cleaned, duplicates) {
    return {
      summary: {
        originalCount: original.length,
        cleanedCount: cleaned.length,
        duplicatesRemoved: original.length - cleaned.length,
        duplicateGroups: duplicates.length,
        cleanupEfficiency: ((original.length - cleaned.length) / original.length * 100).toFixed(1) + '%'
      },
      duplicateGroups: duplicates.map(group => ({
        original: {
          id: group.original.id,
          name: group.original.name,
          price: group.original.price
        },
        duplicates: group.duplicates.map(d => ({
          id: d.id,
          name: d.name,
          price: d.price,
          similarity: group.similarityScores?.find(s => s.id === d.id)?.score || 0
        })),
        recommendation: 'merge',
        reason: `High similarity detected (${group.similarityScores?.[0]?.score || 'N/A'})`
      })),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CosmeticDeduplicator;
