// File: src/server/utils/memoryDeduplicator.ts

/**
 * Vector-Based Memory Deduplication
 * Prevents redundant memory growth by detecting semantic duplicates using cosine similarity
 */

export type MemoryVector = {
  id: string;
  embedding: number[];
  createdAt: number;
  trustScore: number;
  usageCount: number;
  content: string;
  lastAccessed: number;
};

export type DeduplicationResult = {
  isDuplicate: boolean;
  existingMemory?: MemoryVector;
  action: 'store' | 'merge' | 'increment';
  reason: string;
};

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Find duplicate memory based on semantic similarity
 */
export function findDuplicateMemory(
  incoming: number[],
  existing: MemoryVector[],
  threshold = 0.92
): MemoryVector | undefined {
  return existing.find(mem =>
    cosineSimilarity(incoming, mem.embedding) >= threshold
  );
}

/**
 * Process memory with deduplication
 */
export function processMemoryWithDeduplication(
  content: string,
  embedding: number[],
  existingMemories: MemoryVector[],
  trustScore: number = 0.5,
  threshold: number = 0.92
): DeduplicationResult {
  // Check for semantic duplicate
  const duplicate = findDuplicateMemory(embedding, existingMemories, threshold);
  
  if (duplicate) {
    // Merge behavior: increment usage and update trust
    const updatedTrust = Math.min(1, (duplicate.trustScore + trustScore) / 2);
    
    return {
      isDuplicate: true,
      existingMemory: {
        ...duplicate,
        trustScore: updatedTrust,
        usageCount: duplicate.usageCount + 1,
        lastAccessed: Date.now()
      },
      action: 'merge',
      reason: `Semantic duplicate found (similarity: ${cosineSimilarity(embedding, duplicate.embedding).toFixed(3)})`
    };
  }
  
  // No duplicate found - store normally
  return {
    isDuplicate: false,
    action: 'store',
    reason: 'No semantic duplicate detected'
  };
}

/**
 * Memory Deduplicator Class
 */
export class MemoryDeduplicator {
  private memories: Map<string, MemoryVector> = new Map();
  private threshold: number;
  private maxMemories: number;

  constructor(threshold: number = 0.92, maxMemories: number = 10000) {
    this.threshold = threshold;
    this.maxMemories = maxMemories;
  }

  /**
   * Add new memory with deduplication
   */
  public addMemory(
    id: string,
    content: string,
    embedding: number[],
    trustScore: number = 0.5
  ): DeduplicationResult {
    const existingArray = Array.from(this.memories.values());
    const result = processMemoryWithDeduplication(
      content,
      embedding,
      existingArray,
      trustScore,
      this.threshold
    );

    if (result.action === 'store') {
      // Store new memory
      const newMemory: MemoryVector = {
        id,
        embedding,
        createdAt: Date.now(),
        trustScore,
        usageCount: 1,
        content,
        lastAccessed: Date.now()
      };
      
      this.memories.set(id, newMemory);
      
      // Enforce memory limit
      if (this.memories.size > this.maxMemories) {
        this.evictLeastTrusted();
      }
    } else if (result.action === 'merge' && result.existingMemory) {
      // Update existing memory
      this.memories.set(result.existingMemory.id, result.existingMemory);
    }

    return result;
  }

  /**
   * Get memory by ID
   */
  public getMemory(id: string): MemoryVector | undefined {
    const memory = this.memories.get(id);
    if (memory) {
      // Update last accessed
      this.memories.set(id, {
        ...memory,
        lastAccessed: Date.now(),
        usageCount: memory.usageCount + 1
      });
    }
    return memory;
  }

  /**
   * Find similar memories
   */
  public findSimilarMemories(
    embedding: number[],
    limit: number = 5,
    minSimilarity: number = 0.7
  ): Array<{ memory: MemoryVector; similarity: number }> {
    const similarities = Array.from(this.memories.values())
      .map(memory => ({
        memory,
        similarity: cosineSimilarity(embedding, memory.embedding)
      }))
      .filter(item => item.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }

  /**
   * Get deduplication statistics
   */
  public getStats(): {
    totalMemories: number;
    avgTrustScore: number;
    avgUsageCount: number;
    memoryUtilization: number;
    duplicateRate: number;
  } {
    const memories = Array.from(this.memories.values());
    
    if (memories.length === 0) {
      return {
        totalMemories: 0,
        avgTrustScore: 0,
        avgUsageCount: 0,
        memoryUtilization: 0,
        duplicateRate: 0
      };
    }

    const avgTrustScore = memories.reduce((sum, m) => sum + m.trustScore, 0) / memories.length;
    const avgUsageCount = memories.reduce((sum, m) => sum + m.usageCount, 0) / memories.length;
    const memoryUtilization = memories.length / this.maxMemories;
    
    // Estimate duplicate rate based on usage patterns
    const highUsageMemories = memories.filter(m => m.usageCount > 3).length;
    const duplicateRate = highUsageMemories / memories.length;

    return {
      totalMemories: memories.length,
      avgTrustScore,
      avgUsageCount,
      memoryUtilization,
      duplicateRate
    };
  }

  /**
   * Evict least trusted memories when limit is reached
   */
  private evictLeastTrusted(): void {
    const memories = Array.from(this.memories.entries())
      .sort(([, a], [, b]) => {
        // Sort by trust score, then by last accessed time
        if (a.trustScore !== b.trustScore) {
          return a.trustScore - b.trustScore;
        }
        return a.lastAccessed - b.lastAccessed;
      });

    // Remove bottom 10% of memories
    const toRemove = Math.max(1, Math.floor(memories.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.memories.delete(memories[i][0]);
    }
  }

  /**
   * Clear all memories
   */
  public clear(): void {
    this.memories.clear();
  }

  /**
   * Export memories for backup
   */
  public export(): MemoryVector[] {
    return Array.from(this.memories.values());
  }

  /**
   * Import memories from backup
   */
  public import(memories: MemoryVector[]): void {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
  }
}

// LLM Rule Integration
export const MEMORY_DEDUPLICATION_RULES = {
  NEVER_STORE_IF_DUPLICATE: 'Never store memory if cosine similarity ≥ 0.92 — merge instead.',
  MERGE_BEHAVIOR: 'If duplicate found → increment usage + trust',
  STORE_NORMAL: 'If not duplicate → store normally',
  THRESHOLD_DEFAULT: 0.92,
  MIN_SIMILARITY_FOR_SEARCH: 0.7
};
