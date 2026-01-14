/**
 * Memory Provenance Graph System
 * Tracks where memories came from, why they exist, and what they influenced
 */

export type MemorySource = "chat" | "twitch" | "system" | "simulation" | "self-generated";

export type MemoryProvenance = {
  memoryId: string;
  source: MemorySource;
  causedBy?: string[];      // parent memory IDs
  causedActions?: string[]; // action IDs
  confidenceAtCreation: number;
  createdAt: number;
  contentHash?: string;     // for integrity checking
  modelVersion?: string;    // which model generated this
  context?: string;         // brief context description
};

export type ProvenanceGraph = {
  nodes: Map<string, MemoryProvenance>;
  adjacency: Map<string, string[]>; // memoryId -> [dependent memory IDs]
  reverseAdjacency: Map<string, string[]>; // memoryId -> [parent memory IDs]
};

class MemoryProvenanceManager {
  private graph: ProvenanceGraph = {
    nodes: new Map(),
    adjacency: new Map(),
    reverseAdjacency: new Map()
  };

  private storagePath: string;

  constructor(storagePath: string = './data/memory-provenance.json') {
    this.storagePath = storagePath;
    this.loadGraph();
  }

  /**
   * Add a new memory with provenance tracking
   */
  addMemory(provenance: MemoryProvenance): void {
    // Add node
    this.graph.nodes.set(provenance.memoryId, provenance);

    // Initialize adjacency lists if needed
    if (!this.graph.adjacency.has(provenance.memoryId)) {
      this.graph.adjacency.set(provenance.memoryId, []);
    }
    if (!this.graph.reverseAdjacency.has(provenance.memoryId)) {
      this.graph.reverseAdjacency.set(provenance.memoryId, []);
    }

    // Build parent-child relationships
    if (provenance.causedBy) {
      for (const parentId of provenance.causedBy) {
        // Add to parent's adjacency list
        if (!this.graph.adjacency.has(parentId)) {
          this.graph.adjacency.set(parentId, []);
        }
        this.graph.adjacency.get(parentId)!.push(provenance.memoryId);

        // Add to this memory's reverse adjacency
        this.graph.reverseAdjacency.get(provenance.memoryId)!.push(parentId);
      }
    }

    this.saveGraph();
  }

  /**
   * Get provenance for a specific memory
   */
  getProvenance(memoryId: string): MemoryProvenance | undefined {
    return this.graph.nodes.get(memoryId);
  }

  /**
   * Get all memories that influenced this memory (ancestors)
   */
  getAncestors(memoryId: string, maxDepth: number = 5): string[] {
    const ancestors: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string, depth: number) => {
      if (depth >= maxDepth || visited.has(id)) return;
      visited.add(id);

      const parents = this.graph.reverseAdjacency.get(id) || [];
      for (const parent of parents) {
        ancestors.push(parent);
        traverse(parent, depth + 1);
      }
    };

    traverse(memoryId, 0);
    return ancestors;
  }

  /**
   * Get all memories influenced by this memory (descendants)
   */
  getDescendants(memoryId: string, maxDepth: number = 5): string[] {
    const descendants: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string, depth: number) => {
      if (depth >= maxDepth || visited.has(id)) return;
      visited.add(id);

      const children = this.graph.adjacency.get(id) || [];
      for (const child of children) {
        descendants.push(child);
        traverse(child, depth + 1);
      }
    };

    traverse(memoryId, 0);
    return descendants;
  }

  /**
   * Calculate confidence based on ancestry
   */
  calculateAncestryConfidence(memoryId: string): number {
    const provenance = this.getProvenance(memoryId);
    if (!provenance) return 0;

    let totalConfidence = provenance.confidenceAtCreation;
    let weightSum = 1;

    const ancestors = this.getAncestors(memoryId, 3);
    for (const ancestorId of ancestors) {
      const ancestorProvenance = this.getProvenance(ancestorId);
      if (ancestorProvenance) {
        // Weight decreases with distance
        const weight = 0.8;
        totalConfidence += ancestorProvenance.confidenceAtCreation * weight;
        weightSum += weight;
      }
    }

    return totalConfidence / weightSum;
  }

  /**
   * Find potential memory chains that need review
   */
  findSuspiciousChains(): Array<{
    chain: string[];
    reason: string;
    confidence: number;
  }> {
    const suspicious: Array<{
      chain: string[];
      reason: string;
      confidence: number;
    }> = [];

    // Find chains with low confidence ancestry
    for (const [memoryId, provenance] of this.graph.nodes) {
      const ancestryConfidence = this.calculateAncestryConfidence(memoryId);
      
      if (ancestryConfidence < 0.5) {
        const chain = this.getMemoryChain(memoryId);
        suspicious.push({
          chain,
          reason: 'Low confidence ancestry',
          confidence: ancestryConfidence
        });
      }
    }

    return suspicious;
  }

  /**
   * Get the full chain for a memory
   */
  private getMemoryChain(memoryId: string): string[] {
    const chain: string[] = [memoryId];
    const ancestors = this.getAncestors(memoryId, 3);
    return [...ancestors.reverse(), memoryId];
  }

  /**
   * Roll back a memory chain (for poisoned memories)
   */
  rollbackChain(memoryId: string): void {
    const descendants = this.getDescendants(memoryId, 10);
    
    // Remove all descendants
    for (const descendant of descendants) {
      this.removeMemory(descendant);
    }
    
    // Remove the memory itself
    this.removeMemory(memoryId);
  }

  /**
   * Remove a memory from the graph
   */
  private removeMemory(memoryId: string): void {
    // Remove from nodes
    this.graph.nodes.delete(memoryId);

    // Remove from adjacency lists
    const parents = this.graph.reverseAdjacency.get(memoryId) || [];
    for (const parent of parents) {
      const parentChildren = this.graph.adjacency.get(parent) || [];
      const index = parentChildren.indexOf(memoryId);
      if (index > -1) {
        parentChildren.splice(index, 1);
      }
    }

    const children = this.graph.adjacency.get(memoryId) || [];
    for (const child of children) {
      const childParents = this.graph.reverseAdjacency.get(child) || [];
      const index = childParents.indexOf(memoryId);
      if (index > -1) {
        childParents.splice(index, 1);
      }
    }

    // Clean up adjacency maps
    this.graph.adjacency.delete(memoryId);
    this.graph.reverseAdjacency.delete(memoryId);

    this.saveGraph();
  }

  /**
   * Save graph to disk
   */
  private saveGraph(): void {
    try {
      const fs = require('fs');
      const data = {
        nodes: Array.from(this.graph.nodes.entries()),
        adjacency: Array.from(this.graph.adjacency.entries()),
        reverseAdjacency: Array.from(this.graph.reverseAdjacency.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save provenance graph:', error);
    }
  }

  /**
   * Load graph from disk
   */
  private loadGraph(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.graph.nodes = new Map(data.nodes);
        this.graph.adjacency = new Map(data.adjacency);
        this.graph.reverseAdjacency = new Map(data.reverseAdjacency);
      }
    } catch (error) {
      console.error('Failed to load provenance graph:', error);
    }
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    totalMemories: number;
    averageConfidence: number;
    sourceDistribution: Record<MemorySource, number>;
  } {
    const memories = Array.from(this.graph.nodes.values());
    const totalConfidence = memories.reduce((sum, mem) => sum + mem.confidenceAtCreation, 0);
    
    const sourceDistribution = memories.reduce((dist, mem) => {
      dist[mem.source] = (dist[mem.source] || 0) + 1;
      return dist;
    }, {} as Record<MemorySource, number>);

    return {
      totalMemories: memories.length,
      averageConfidence: memories.length > 0 ? totalConfidence / memories.length : 0,
      sourceDistribution
    };
  }
}

export { MemoryProvenanceManager };
