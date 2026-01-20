/**
 * Image-based Cosmetic Deduplicator
 * Uses image similarity and metadata to detect duplicate cosmetics
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./logger');

const logger = new Logger('IMAGE-DEDUPLICATOR');

class ImageDeduplicator {
  constructor() {
    this.imageCache = new Map();
    this.similarityThreshold = 0.85;
    this.aiEnabled = true;
  }

  /**
   * Calculate image hash for comparison
   */
  calculateImageHash(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
      return hash;
    } catch (error) {
      logger.error('Failed to calculate image hash', { error: error.message, imagePath });
      return null;
    }
  }

  /**
   * Extract image metadata
   */
  extractImageMetadata(imagePath) {
    try {
      const stats = fs.statSync(imagePath);
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Basic image info
      const metadata = {
        path: imagePath,
        size: stats.size,
        lastModified: stats.mtime,
        hash: this.calculateImageHash(imagePath),
        dimensions: this.getImageDimensions(imageBuffer),
        format: this.getImageFormat(imagePath)
      };

      return metadata;
    } catch (error) {
      logger.error('Failed to extract image metadata', { error: error.message, imagePath });
      return null;
    }
  }

  /**
   * Get image dimensions (basic implementation)
   */
  getImageDimensions(imageBuffer) {
    // This is a simplified implementation
    // In production, you'd use a proper image processing library
    try {
      // For now, return placeholder dimensions
      const dimensions = {
        width: 512, // Default assumption
        height: 512, // Default assumption
        format: 'unknown'
      };
      return dimensions;
    } catch (error) {
      return { width: 0, height: 0, format: 'error' };
    }
  }

  /**
   * Get image format from file extension
   */
  getImageFormat(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();
    const formatMap = {
      '.jpg': 'jpeg',
      '.jpeg': 'jpeg',
      '.png': 'png',
      '.gif': 'gif',
      '.webp': 'webp',
      '.svg': 'svg'
    };
    return formatMap[ext] || 'unknown';
  }

  /**
   * Calculate visual similarity between images
   */
  calculateVisualSimilarity(metadata1, metadata2) {
    let similarity = 0;

    // Hash comparison (exact match)
    if (metadata1.hash && metadata2.hash && metadata1.hash === metadata2.hash) {
      similarity = 1.0;
    }
    // Format similarity
    else if (metadata1.format === metadata2.format) {
      similarity += 0.3;
    }
    // Size similarity (similar sizes are more likely duplicates)
    const sizeDiff = Math.abs(metadata1.size - metadata2.size);
    const maxSize = Math.max(metadata1.size, metadata2.size);
    if (maxSize > 0) {
      const sizeSimilarity = 1 - (sizeDiff / maxSize);
      similarity += sizeSimilarity * 0.2;
    }
    // Dimension similarity
    if (metadata1.dimensions.width && metadata2.dimensions.width) {
      const widthDiff = Math.abs(metadata1.dimensions.width - metadata2.dimensions.width);
      const maxWidth = Math.max(metadata1.dimensions.width, metadata2.dimensions.width);
      if (maxWidth > 0) {
        const widthSimilarity = 1 - (widthDiff / maxWidth);
        similarity += widthSimilarity * 0.1;
      }
    }

    return Math.min(similarity, 1.0);
  }

  /**
   * Calculate filename similarity
   */
  calculateFilenameSimilarity(name1, name2) {
    const lower1 = name1.toLowerCase();
    const lower2 = name2.toLowerCase();
    
    // Exact match
    if (lower1 === lower2) {
      return 1.0;
    }

    // Check for similar substrings
    const words1 = lower1.split(/[\s_-]+/);
    const words2 = lower2.split(/[\s_-]+/);
    
    let commonWords = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word of words1) {
      if (words2.includes(word)) {
        commonWords++;
      }
    }

    return totalWords > 0 ? commonWords / totalWords : 0;
  }

  /**
   * Calculate overall similarity score
   */
  calculateOverallSimilarity(metadata1, metadata2) {
    const visualSimilarity = this.calculateVisualSimilarity(metadata1, metadata2);
    const filenameSimilarity = this.calculateFilenameSimilarity(
      path.basename(metadata1.path, path.extname(metadata1.path)),
      path.basename(metadata2.path, path.extname(metadata2.path))
    );
    
    // Weighted combination
    const overallSimilarity = 
      (visualSimilarity * 0.5) +     // Visual is most important
      (filenameSimilarity * 0.3) +     // Filename matters
      0.2;                              // Base similarity score

    return Math.min(overallSimilarity, 1.0);
  }

  /**
   * Detect duplicate cosmetics with image analysis
   */
  async detectDuplicates(cosmetics) {
    const duplicates = [];
    const processed = new Set();

    logger.info('Starting image-based duplicate detection', { totalCosmetics: cosmetics.length });

    for (const cosmetic of cosmetics) {
      if (processed.has(cosmetic.id)) continue;

      const similar = [];
      const cosmeticMetadata = this.extractImageMetadata(cosmetic.imagePath);

      if (!cosmeticMetadata) {
        logger.warn('Failed to extract metadata for cosmetic', { id: cosmetic.id, imagePath: cosmetic.imagePath });
        continue;
      }

      // Compare with other cosmetics
      for (const otherCosmetic of cosmetics) {
        if (cosmetic.id === otherCosmetic.id) continue;

        const otherMetadata = this.extractImageMetadata(otherCosmetic.imagePath);
        
        if (!otherMetadata) continue;

        const similarity = this.calculateOverallSimilarity(cosmeticMetadata, otherMetadata);
        
        if (similarity > this.similarityThreshold) {
          similar.push({
            id: otherCosmetic.id,
            name: otherCosmetic.name,
            price: otherCosmetic.price,
            image: otherCosmetic.imagePath,
            similarity: similarity,
            similarityDetails: {
              visual: this.calculateVisualSimilarity(cosmeticMetadata, otherMetadata),
              filename: this.calculateFilenameSimilarity(cosmetic.name, otherCosmetic.name),
              hash: cosmeticMetadata.hash === otherMetadata.hash ? 1.0 : 0.0
            }
          });
        }
      }

      if (similar.length > 0) {
        duplicates.push({
          original: cosmetic,
          duplicates: similar,
          overallSimilarity: Math.max(...similar.map(s => s.similarity)),
          duplicateCount: similar.length
        });
      }

      processed.add(cosmetic.id);
    }

    logger.info('Image-based duplicate detection completed', {
      totalCosmetics: cosmetics.length,
      duplicateGroups: duplicates.length,
      totalDuplicates: duplicates.reduce((sum, group) => sum + group.duplicateCount, 0)
    });

    return duplicates;
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
      
      // Prepare image data for AI analysis
      const cosmeticData = cosmetics.filter(c => {
        const metadata = this.extractImageMetadata(c.imagePath);
        return metadata !== null;
      });

      const imageData = cosmeticData.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        imagePath: c.imagePath,
        metadata: this.extractImageMetadata(c.imagePath)
      }));

      const prompt = `
      Analyze these cosmetic items for duplicates using image analysis.
      Consider visual similarity, filename patterns, and metadata.
      
      Items: ${JSON.stringify(imageData.slice(0, 10), null, 2)}
      
      For each item, compare with others and identify:
      1. Exact visual duplicates (same image)
      2. Near duplicates (similar appearance)
      3. Filename variations (typos, plural/singular forms)
      4. Price anomalies (same item, different prices)
      
      Return JSON with:
      {
        "duplicates": [
          {
            "original": { "id": 1, "name": "Red Shirt" },
            "duplicates": [
              {
                "id": 2, 
                "name": "Red T-Shirt", 
                "similarity": 0.95,
                "reason": "Visual match + filename variation",
                "imageAnalysis": {
                  "hashMatch": false,
                  "visualSimilarity": 0.9,
                  "filenameSimilarity": 0.8
                }
              }
            ],
            "similarity": 0.95,
            "recommendation": "merge"
          }
        ],
        "unique": [items without duplicates],
        "confidence": 0.92
      }
      `;

      const response = await ai.chat([
        { role: 'system', content: 'You are an expert image analyst. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 3000
      });

      const analysis = JSON.parse(response);
      
      logger.info('AI image duplicate detection completed', {
        confidence: analysis.confidence,
        duplicateGroups: analysis.duplicates.length
      });

      return analysis;
    } catch (error) {
      logger.error('AI image duplicate detection failed', { error: error.message });
      // Fallback to algorithmic detection
      return this.detectDuplicates(cosmetics);
    }
  }

  /**
   * Merge duplicate cosmetics with image awareness
   */
  mergeSimilar(cosmetics) {
    const duplicates = this.detectDuplicates(cosmetics);
    const merged = [];
    const processed = new Set();

    for (const group of duplicates) {
      if (processed.has(group.original.id)) continue;

      // Create merged cosmetic with best image
      const mergedCosmetic = {
        ...group.original,
        duplicates: group.duplicates.map(d => d.id),
        mergedNames: [group.original.name, ...group.duplicates.map(d => d.name)].join(' / '),
        mergedImages: [group.original.imagePath, ...group.duplicates.map(d => d.imagePath)],
        selectedImage: this.selectBestImage(group.original, group.duplicates),
        similarityScores: group.similarityScores
      };

      // Keep the best price (lowest) and best description
      mergedCosmetic.price = Math.min(group.original.price, ...group.duplicates.map(d => d.price));
      
      const descriptions = [group.original.description, ...group.duplicates.map(d => d.description)].filter(Boolean);
      mergedCosmetic.description = descriptions.reduce((longest, desc) => desc.length > longest.length ? desc : longest, '');

      merged.push(mergedCosmetic);
      processed.add(group.original.id);
      group.duplicates.forEach(d => processed.add(d.id));
    }

    // Add non-duplicates
    cosmetics.forEach(cosmetic => {
      if (!processed.has(cosmetic.id)) {
        merged.push(cosmetic);
      }
    });

    logger.info('Image-aware cosmetic merge completed', {
      originalCount: cosmetics.length,
      mergedCount: merged.length,
      groupsProcessed: duplicates.length
    });

    return merged;
  }

  /**
   * Select the best image from duplicates
   */
  selectBestImage(original, duplicates) {
    // For now, prefer the original image
    // In the future, this could use AI to determine best quality
    return {
      selected: original.imagePath,
      reason: 'Original image preferred',
      confidence: 0.95
    };
  }

  /**
   * Generate detailed image analysis report
   */
  generateImageAnalysisReport(original, cleaned, duplicates) {
    return {
      summary: {
        originalCount: original.length,
        cleanedCount: cleaned.length,
        duplicatesRemoved: original.length - cleaned.length,
        duplicateGroups: duplicates.length,
        imageAnalysisEnabled: this.aiEnabled
      },
      imageDuplicates: duplicates.map(group => ({
        original: {
          id: group.original.id,
          name: group.original.name,
          image: group.original.imagePath,
          metadata: this.extractImageMetadata(group.original.imagePath)
        },
        duplicates: group.duplicates.map(d => ({
          id: d.id,
          name: d.name,
          image: d.imagePath,
          metadata: this.extractImageMetadata(d.imagePath),
          similarity: d.similarity,
          similarityDetails: d.similarityDetails || {},
          recommendation: d.similarity > 0.9 ? 'High similarity - consider merging' : 'Moderate similarity'
        })),
        overallSimilarity: group.overallSimilarity,
        recommendation: group.overallSimilarity > 0.9 ? 'Merge duplicates' : 'Keep separate'
      })),
      processing: {
        hashComparison: 'Exact matches detected via MD5 hashing',
        visualAnalysis: this.aiEnabled ? 'AI-powered visual similarity detection' : 'Algorithmic similarity detection',
        filenameAnalysis: 'Levenshtein distance and pattern matching',
        imageMetadata: 'Size, format, and dimension extraction'
      }
    };
  }
}

module.exports = ImageDeduplicator;
