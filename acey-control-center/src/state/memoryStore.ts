export interface MemoryStore {
  pending: Array<{
    id: string;
    scope: string;
    summary: string;
    confidence: number;
    timestamp: number;
  }>;
  approved: Array<{
    id: string;
    scope: string;
    summary: string;
    approvedAt: number;
  }>;
}

export const memoryStore: MemoryStore = {
  pending: [],
  approved: []
};
