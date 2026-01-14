export type StorageDecision = {
  action: "KEEP" | "ARCHIVE" | "COMPRESS";
  reason: string;
  confidence: number;
};

export type StorageContext = {
  assetType: "audio" | "image" | "dataset" | "model";
  ageDays: number;
  usageCount: number;
  trustScore: number;
  fineTuneWeight: number;
};

export function evaluateStoragePolicy(
  ctx: StorageContext
): StorageDecision {
  // High-value assets that should be kept
  if (ctx.fineTuneWeight > 0.7 || ctx.trustScore > 0.8) {
    return {
      action: "KEEP",
      reason: "High training value or trust score",
      confidence: 0.9,
    };
  }

  // Low usage and aging assets should be compressed
  if (ctx.ageDays > 30 && ctx.usageCount < 3) {
    return {
      action: "COMPRESS",
      reason: "Low usage and aging asset",
      confidence: 0.7,
    };
  }

  // Old assets with moderate usage should be archived
  if (ctx.ageDays > 60 && ctx.usageCount < 5) {
    return {
      action: "ARCHIVE",
      reason: "Inactive asset with moderate usage",
      confidence: 0.6,
    };
  }

  // Default to keep for newer or frequently used assets
  return {
    action: "KEEP",
    reason: "Active or recently used asset",
    confidence: 0.8,
  };
}

export function explainStorageDecision(decision: StorageDecision): string {
  return `${decision.action}: ${decision.reason} (confidence: ${(decision.confidence * 100).toFixed(0)}%)`;
}
