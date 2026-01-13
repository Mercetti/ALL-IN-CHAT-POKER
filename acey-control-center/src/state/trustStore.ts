export interface TrustStore {
  score: number;
  history: Array<{
    delta: number;
    reason: string;
    timestamp: number;
  }>;
}

export const trustStore: TrustStore = {
  score: 0.5,
  history: []
};
