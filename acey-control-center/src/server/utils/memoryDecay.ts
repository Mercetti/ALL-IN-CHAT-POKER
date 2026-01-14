// File: src/server/utils/memoryDecay.ts

/**
 * Trust-Weighted Memory Decay
 * Memories fade unless they prove useful - entropy control without deletion
 */

export type MemoryNode = {
  id: string;
  content: string;
  trustScore: number;
  usageCount: number;
  lastAccessed: number;
  createdAt: number;
  category: string;
  importance: number;
  decayRate: number;
};

export type MemoryDecayResult = {
  memory: MemoryNode;
  previousTrust: number;
  newTrust: number;
  decayAmount: number;
  status: 'hot' | 'warm' | 'cool' | 'archive_eligible';
  daysInactive: number;
};

export type DecayPolicy = {
  baseDecayRate: number;
  usageBonus: number;
  importanceBonus: number;
  categoryMultipliers: Record<string, number>;
  archiveThreshold: number;
  refreshThreshold: number;
  maxDecayPerDay: number;
};

/**
 * Calculate trust decay for a memory node
 */
export function decayMemoryTrust(
  mem: MemoryNode,
  now: number = Date.now(),
  policy: DecayPolicy = DEFAULT_DECAY_POLICY
): MemoryDecayResult {
  const daysInactive = (now - mem.lastAccessed) / (1000 * 60 * 60 * 24);
  
  // Calculate adjusted decay rate based on usage and importance
  const usageBonus = Math.min(0.05, mem.usageCount * policy.usageBonus);
  const importanceBonus = mem.importance * policy.importanceBonus;
  const categoryMultiplier = policy.categoryMultipliers[mem.category] || 1.0;
  
  const adjustedDecayRate = Math.max(
    0.001,
    Math.min(
      policy.maxDecayPerDay,
      (mem.decayRate - usageBonus - importanceBonus) * categoryMultiplier
    )
  );
  
  const decay = daysInactive * adjustedDecayRate;
  const newTrust = Math.max(0, +(mem.trustScore - decay).toFixed(3));
  
  // Determine memory status
  let status: MemoryDecayResult['status'];
  if (newTrust > 0.8) {
    status = 'hot';
  } else if (newTrust > 0.6) {
    status = 'warm';
  } else if (newTrust > 0.4) {
    status = 'cool';
  } else {
    status = 'archive_eligible';
  }

  return {
    memory: {
      ...mem,
      trustScore: newTrust,
      lastAccessed: now
    },
    previousTrust: mem.trustScore,
    newTrust,
    decayAmount: decay,
    status,
    daysInactive
  };
}

/**
 * Default decay policy
 */
export const DEFAULT_DECAY_POLICY: DecayPolicy = {
  baseDecayRate: 0.1,
  usageBonus: 0.01,
  importanceBonus: 0.02,
  categoryMultipliers: {
    'critical': 0.5,      // Critical memories decay slower
    'frequent': 0.7,      // Frequently used decay slower
    'recent': 0.8,       // Recent memories decay slower
    'standard': 1.0,      // Standard decay rate
    'obsolete': 1.5       // Obsolete memories decay faster
  },
  archiveThreshold: 0.4,
  refreshThreshold: 0.6,
  maxDecayPerDay: 0.05
};

/**
 * Memory Decay Manager Class
 */
export class MemoryDecayManager {
  private memories: Map<string, MemoryNode> = new Map();
  private policy: DecayPolicy;
  private decayHistory: Array<{
    timestamp: number;
    memoryId: string;
    result: MemoryDecayResult;
  }> = [];
  private autoDecayEnabled = true;
  private decayInterval: NodeJS.Timeout | null = null;

  constructor(policy?: Partial<DecayPolicy>) {
    this.policy = { ...DEFAULT_DECAY_POLICY, ...policy };
    this.startAutoDecay();
  }

  /**
   * Add a new memory node
   */
  public addMemory(
    id: string,
    content: string,
    category: string = 'standard',
    importance: number = 0.5,
    initialTrust: number = 0.8
  ): MemoryNode {
    const memory: MemoryNode = {
      id,
      content,
      trustScore: initialTrust,
      usageCount: 1,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      category,
      importance,
      decayRate: this.policy.baseDecayRate
    };

    this.memories.set(id, memory);
    return memory;
  }

  /**
   * Access a memory (updates usage and last accessed)
   */
  public accessMemory(id: string): MemoryNode | null {
    const memory = this.memories.get(id);
    if (!memory) {
      return null;
    }

    // Update usage and last accessed
    const updatedMemory = {
      ...memory,
      usageCount: memory.usageCount + 1,
      lastAccessed: Date.now()
    };

    this.memories.set(id, updatedMemory);
    return updatedMemory;
  }

  /**
   * Apply decay to a specific memory
   */
  public applyDecay(id: string, now: number = Date.now()): MemoryDecayResult | null {
    const memory = this.memories.get(id);
    if (!memory) {
      return null;
    }

    const result = decayMemoryTrust(memory, now, this.policy);
    
    // Update memory with new trust score
    this.memories.set(id, result.memory);
    
    // Record in history
    this.decayHistory.push({
      timestamp: now,
      memoryId: id,
      result
    });

    return result;
  }

  /**
   * Apply decay to all memories
   */
  public applyDecayToAll(now: number = Date.now()): MemoryDecayResult[] {
    const results: MemoryDecayResult[] = [];
    
    for (const [id, memory] of this.memories) {
      const result = this.applyDecay(id, now);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Refresh a memory (increase trust score)
   */
  public refreshMemory(id: string, boost: number = 0.1): boolean {
    const memory = this.memories.get(id);
    if (!memory) {
      return false;
    }

    const newTrust = Math.min(1.0, memory.trustScore + boost);
    const updatedMemory = {
      ...memory,
      trustScore: newTrust,
      lastAccessed: Date.now()
    };

    this.memories.set(id, updatedMemory);
    return true;
  }

  /**
   * Get memories by status
   */
  public getMemoriesByStatus(status: MemoryDecayResult['status']): MemoryNode[] {
    const now = Date.now();
    return Array.from(this.memories.values())
      .map(memory => decayMemoryTrust(memory, now, this.policy))
      .filter(result => result.status === status)
      .map(result => result.memory);
  }

  /**
   * Get archive-eligible memories
   */
  public getArchiveEligible(): MemoryNode[] {
    return this.getMemoriesByStatus('archive_eligible');
  }

  /**
   * Get hot memories (high trust, frequently used)
   */
  public getHotMemories(): MemoryNode[] {
    return this.getMemoriesByStatus('hot');
  }

  /**
   * Get warm memories (moderate trust)
   */
  public getWarmMemories(): MemoryNode[] {
    return this.getMemoriesByStatus('warm');
  }

  /**
   * Get decay statistics
   */
  public getDecayStatistics(): {
    totalMemories: number;
    statusDistribution: Record<string, number>;
    avgTrustScore: number;
    avgUsageCount: number;
    archiveEligibleCount: number;
    decayRate: number;
  } {
    const memories = Array.from(this.memories.values());
    const now = Date.now();
    
    if (memories.length === 0) {
      return {
        totalMemories: 0,
        statusDistribution: {},
        avgTrustScore: 0,
        avgUsageCount: 0,
        archiveEligibleCount: 0,
        decayRate: 0
      };
    }

    const statusDistribution: Record<string, number> = {};
    let totalTrust = 0;
    let totalUsage = 0;
    let archiveEligibleCount = 0;

    for (const memory of memories) {
      const result = decayMemoryTrust(memory, now, this.policy);
      
      statusDistribution[result.status] = (statusDistribution[result.status] || 0) + 1;
      totalTrust += result.newTrust;
      totalUsage += memory.usageCount;
      
      if (result.status === 'archive_eligible') {
        archiveEligibleCount++;
      }
    }

    const avgTrustScore = totalTrust / memories.length;
    const avgUsageCount = totalUsage / memories.length;
    
    // Calculate overall decay rate
    const recentDecays = this.decayHistory.slice(-100); // Last 100 decay operations
    const decayRate = recentDecays.length > 0 
      ? recentDecays.reduce((sum, d) => sum + d.result.decayAmount, 0) / recentDecays.length
      : 0;

    return {
      totalMemories: memories.length,
      statusDistribution,
      avgTrustScore,
      avgUsageCount,
      archiveEligibleCount,
      decayRate
    };
  }

  /**
   * Get decay history
   */
  public getDecayHistory(limit: number = 100): typeof this.decayHistory {
    return this.decayHistory.slice(-limit);
  }

  /**
   * Update decay policy
   */
  public updatePolicy(newPolicy: Partial<DecayPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  /**
   * Enable/disable auto decay
   */
  public setAutoDecayEnabled(enabled: boolean): void {
    this.autoDecayEnabled = enabled;
    if (enabled) {
      this.startAutoDecay();
    } else {
      this.stopAutoDecay();
    }
  }

  /**
   * Start automatic decay process
   */
  private startAutoDecay(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
    }

    // Apply decay every hour
    this.decayInterval = setInterval(() => {
      if (this.autoDecayEnabled) {
        this.applyDecayToAll();
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop automatic decay process
   */
  private stopAutoDecay(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }

  /**
   * Manually trigger decay for all memories
   */
  public triggerDecay(): MemoryDecayResult[] {
    return this.applyDecayToAll();
  }

  /**
   * Get memory by ID
   */
  public getMemory(id: string): MemoryNode | null {
    return this.memories.get(id) || null;
  }

  /**
   * Get all memories
   */
  public getAllMemories(): MemoryNode[] {
    return Array.from(this.memories.values());
  }

  /**
   * Remove memory
   */
  public removeMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  /**
   * Clear all memories
   */
  public clearAll(): void {
    this.memories.clear();
    this.decayHistory = [];
  }

  /**
   * Export memories for backup
   */
  public export(): MemoryNode[] {
    return Array.from(this.memories.values());
  }

  /**
   * Import memories from backup
   */
  public import(memories: MemoryNode[]): void {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAutoDecay();
    this.clearAll();
  }
}

// LLM Rule Integration
export const MEMORY_DECAY_RULES = {
  RELEVANCE_EARNED: 'Memory relevance is earned, not permanent',
  NO_SILENT_DELETION: 'No deletion - only decay and archive',
  ENTROPY_CONTROL: 'Just entropy control, no randomness',
  STATUS_POLICY: {
    HOT: 'trust > 0.8 → hot memory',
    WARM: 'trust 0.6–0.8 → warm',
    COOL: 'trust 0.4–0.6 → cool',
    ARCHIVE: 'trust < 0.4 → archive-eligible'
  },
  DECAY_FACTORS: [
    'Usage count reduces decay',
    'Importance reduces decay',
    'Category affects decay rate',
    'Time since last access increases decay'
  ]
};
