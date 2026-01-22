/**
 * Helm Memory Engine - Core Memory and Data Management
 * Provides memory, provenance, and data persistence for the Helm Control engine
 */

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'skill_execution' | 'system_event' | 'user_data' | 'persona_config';
  userId: string;
  sessionId?: string;
  timestamp: number;
  data: any;
  metadata: Record<string, any>;
  tags: string[];
  ttl?: number; // Time to live in milliseconds
}

export interface ProvenanceRecord {
  id: string;
  parentId: string;
  childId: string;
  relationship: 'derived_from' | 'response_to' | 'triggered_by' | 'modified_by';
  timestamp: number;
  metadata: Record<string, any>;
}

export interface MemoryQuery {
  userId?: string;
  sessionId?: string;
  type?: MemoryEntry['type'];
  tags?: string[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

export interface MemoryStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  entriesByUser: Record<string, number>;
  oldestEntry: number;
  newestEntry: number;
  memoryUsage: number;
}

export class HelmMemory {
  private entries: Map<string, MemoryEntry> = new Map();
  private provenance: Map<string, ProvenanceRecord[]> = new Map();
  private indexes: Map<string, Set<string>> = new Map(); // For fast lookups
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeIndexes();
    this.startCleanupTimer();
  }

  private initializeIndexes(): void {
    this.indexes.set('user', new Set());
    this.indexes.set('type', new Set());
    this.indexes.set('session', new Set());
    this.indexes.set('tags', new Set());
    this.indexes.set('timestamp', new Set());
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Memory Management
  store(entry: Omit<MemoryEntry, 'id'>): string {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const memoryEntry: MemoryEntry = { ...entry, id };

    this.entries.set(id, memoryEntry);
    this.updateIndexes(memoryEntry);

    return id;
  }

  retrieve(id: string): MemoryEntry | undefined {
    return this.entries.get(id);
  }

  update(id: string, updates: Partial<MemoryEntry>): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    Object.assign(entry, updates);
    this.updateIndexes(entry);
    return true;
  }

  delete(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    this.entries.delete(id);
    this.removeFromIndexes(entry);
    this.provenance.delete(id);
    return true;
  }

  // Query Operations
  query(query: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.entries.values());

    // Filter by user
    if (query.userId) {
      const userEntries = this.indexes.get(`user:${query.userId}`);
      if (userEntries) {
        results = results.filter(entry => userEntries.has(entry.id));
      } else {
        return [];
      }
    }

    // Filter by session
    if (query.sessionId) {
      const sessionEntries = this.indexes.get(`session:${query.sessionId}`);
      if (sessionEntries) {
        results = results.filter(entry => sessionEntries.has(entry.id));
      } else {
        return [];
      }
    }

    // Filter by type
    if (query.type) {
      const typeEntries = this.indexes.get(`type:${query.type}`);
      if (typeEntries) {
        results = results.filter(entry => typeEntries.has(entry.id));
      } else {
        return [];
      }
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(entry => 
        query.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(entry => entry.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      results = results.filter(entry => entry.timestamp <= query.endTime!);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return results.slice(offset, offset + limit);
  }

  // Provenance Tracking
  addProvenance(record: Omit<ProvenanceRecord, 'id'>): string {
    const id = `prov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const provenanceRecord: ProvenanceRecord = { ...record, id };

    if (!this.provenance.has(record.parentId)) {
      this.provenance.set(record.parentId, []);
    }

    this.provenance.get(record.parentId)!.push(provenanceRecord);
    return id;
  }

  getProvenance(parentId: string): ProvenanceRecord[] {
    return this.provenance.get(parentId) || [];
  }

  getChildren(parentId: string): MemoryEntry[] {
    const provenanceRecords = this.getProvenance(parentId);
    return provenanceRecords
      .map(record => this.retrieve(record.childId))
      .filter(entry => entry !== undefined) as MemoryEntry[];
  }

  getParents(childId: string): MemoryEntry[] {
    const parents: MemoryEntry[] = [];
    
    for (const [parentId, records] of this.provenance.entries()) {
      if (records.some(record => record.childId === childId)) {
        const parent = this.retrieve(parentId);
        if (parent) {
          parents.push(parent);
        }
      }
    }

    return parents;
  }

  // Session Management
  createSession(userId: string, metadata?: Record<string, any>): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.store({
      type: 'system_event',
      userId,
      sessionId,
      timestamp: Date.now(),
      data: { action: 'session_start', sessionId },
      metadata: metadata || {},
      tags: ['session', 'start']
    });

    return sessionId;
  }

  endSession(sessionId: string): void {
    // Find session entries
    const sessionEntries = this.query({ sessionId });
    if (sessionEntries.length === 0) {
      return;
    }

    const userId = sessionEntries[0].userId;
    
    this.store({
      type: 'system_event',
      userId,
      sessionId,
      timestamp: Date.now(),
      data: { action: 'session_end', sessionId },
      metadata: { duration: Date.now() - sessionEntries[0].timestamp },
      tags: ['session', 'end']
    });
  }

  getSessionHistory(sessionId: string): MemoryEntry[] {
    return this.query({ sessionId });
  }

  // Analytics and Statistics
  getStats(): MemoryStats {
    const entries = Array.from(this.entries.values());
    const entriesByType: Record<string, number> = {};
    const entriesByUser: Record<string, number> = {};

    let oldestEntry = Date.now();
    let newestEntry = 0;

    entries.forEach(entry => {
      // Count by type
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;

      // Count by user
      entriesByUser[entry.userId] = (entriesByUser[entry.userId] || 0) + 1;

      // Track time range
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);

    return {
      totalEntries: entries.length,
      entriesByType,
      entriesByUser,
      oldestEntry,
      newestEntry,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  getUserStats(userId: string): {
    totalEntries: number;
    entriesByType: Record<string, number>;
    sessionCount: number;
    averageSessionDuration: number;
  } {
    const userEntries = this.query({ userId });
    const entriesByType: Record<string, number> = {};

    userEntries.forEach(entry => {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
    });

    // Calculate session statistics
    const sessionStarts = userEntries.filter(entry => 
      entry.type === 'system_event' && entry.data.action === 'session_start'
    );
    const sessionEnds = userEntries.filter(entry => 
      entry.type === 'system_event' && entry.data.action === 'session_end'
    );

    let totalDuration = 0;
    let completedSessions = 0;

    sessionEnds.forEach(endEntry => {
      const startEntry = userEntries.find(entry => 
        entry.type === 'system_event' && 
        entry.data.action === 'session_start' &&
        entry.sessionId === endEntry.sessionId
      );

      if (startEntry) {
        totalDuration += endEntry.timestamp - startEntry.timestamp;
        completedSessions++;
      }
    });

    return {
      totalEntries: userEntries.length,
      entriesByType,
      sessionCount: sessionStarts.length,
      averageSessionDuration: completedSessions > 0 ? totalDuration / completedSessions : 0
    };
  }

  // Index Management
  private updateIndexes(entry: MemoryEntry): void {
    // User index
    const userIndex = this.indexes.get('user')!;
    userIndex.add(`user:${entry.userId}`);

    // Type index
    const typeIndex = this.indexes.get('type')!;
    typeIndex.add(`type:${entry.type}`);

    // Session index
    if (entry.sessionId) {
      const sessionIndex = this.indexes.get('session')!;
      sessionIndex.add(`session:${entry.sessionId}`);
    }

    // Tag indexes
    const tagIndex = this.indexes.get('tags')!;
    entry.tags.forEach(tag => {
      tagIndex.add(`tag:${tag}`);

    // Timestamp index (for time-based queries)
    const timestampIndex = this.indexes.get('timestamp')!;
    timestampIndex.add(`time:${entry.timestamp}`);
  }

  private removeFromIndexes(entry: MemoryEntry): void {
    // Remove from user index
    const userIndex = this.indexes.get('user')!;
    userIndex.delete(`user:${entry.userId}`);

    // Remove from type index
    const typeIndex = this.indexes.get('type')!;
    typeIndex.delete(`type:${entry.type}`);

    // Remove from session index
    if (entry.sessionId) {
      const sessionIndex = this.indexes.get('session')!;
      sessionIndex.delete(`session:${entry.sessionId}`);
    }

    // Remove from tag indexes
    const tagIndex = this.indexes.get('tags')!;
    entry.tags.forEach(tag => {
      tagIndex.delete(`tag:${tag}`);

    // Remove from timestamp index
    const timestampIndex = this.indexes.get('timestamp')!;
    timestampIndex.delete(`time:${entry.timestamp}`);
  }

  // Memory Management
  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;

    for (const entry of this.entries.values()) {
      totalSize += JSON.stringify(entry).length * 2; // UTF-16 characters
    }

    for (const records of this.provenance.values()) {
      totalSize += JSON.stringify(records).length * 2;
    }

    return totalSize;
  }

  cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Find expired entries
    for (const [id, entry] of this.entries.entries()) {
      if (entry.ttl && entry.timestamp + entry.ttl < now) {
        entriesToDelete.push(id);
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(id => this.delete(id));

    // Clean up old provenance records (older than 30 days)
    const cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
    for (const [parentId, records] of this.provenance.entries()) {
      const validRecords = records.filter(record => record.timestamp > cutoffTime);
      
      if (validRecords.length === 0) {
        this.provenance.delete(parentId);
      } else {
        this.provenance.set(parentId, validRecords);
      }
    }
  }

  // Persistence (placeholder for real implementation)
  async save(): Promise<void> {
    // In a real implementation, this would save to disk/database
    console.log('Memory save operation - would persist to storage');
  }

  async load(): Promise<void> {
    // In a real implementation, this would load from disk/database
    console.log('Memory load operation - would load from storage');
  }

  // Cleanup on shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cleanup();
  }
}

// Export singleton instance
export const helmMemory = new HelmMemory();

// Compatibility alias for migration
export const AceyMemory = HelmMemory;
