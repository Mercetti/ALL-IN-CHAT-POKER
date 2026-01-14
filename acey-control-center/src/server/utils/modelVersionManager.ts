// File: src/server/utils/modelVersionManager.ts

/**
 * Model Rollback Automation
 * Instantly revert bad self-modifications or fine-tunes with automatic rollback triggers
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

const MODEL_DIR = "models";
const MANIFEST = "model_manifest.json";
const BACKUP_DIR = "model_backups";

export type ModelMetadata = {
  version: string;
  timestamp: number;
  stable: boolean;
  performance: {
    accuracy: number;
    confidence: number;
    trust: number;
    errorRate: number;
    latency: number;
  };
  source: 'base' | 'fine_tune' | 'rollback';
  parentVersion?: string;
  description: string;
  metrics: {
    datasetSize: number;
    trainingTime: number;
    validationScore: number;
  };
  rollbackReason?: string;
  healthStatus: 'healthy' | 'degraded' | 'critical';
};

export type RollbackTrigger = {
  type: 'performance_regression' | 'error_spike' | 'trust_collapse' | 'hallucination_threshold' | 'manual';
  threshold: number;
  currentValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
};

export type RollbackDecision = {
  shouldRollback: boolean;
  targetVersion: string;
  reason: string;
  triggers: RollbackTrigger[];
  estimatedImpact: 'low' | 'medium' | 'high';
};

/**
 * Model Version Manager Class
 */
export class ModelVersionManager extends EventEmitter {
  private manifest: ModelMetadata[] = [];
  private currentVersion: string | null = null;
  private isInitialized = false;
  private monitoringEnabled = true;
  private rollbackThresholds = {
    performanceRegression: 0.15,  // 15% drop in accuracy
    errorSpike: 0.5,                // 50% increase in error rate
    trustCollapse: 0.3,             // 30% drop in trust score
    hallucinationThreshold: 0.8,    // 80% hallucination rate
    latencyIncrease: 2.0            // 2x increase in latency
  };

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the version manager
   */
  private async initialize(): Promise<void> {
    try {
      // Create directories if they don't exist
      if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
      }
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      // Load manifest
      await this.loadManifest();
      
      // Set current version to latest stable
      const latestStable = this.getLatestStableVersion();
      if (latestStable) {
        this.currentVersion = latestStable.version;
      }

      this.isInitialized = true;
      console.log('[ModelVersionManager] Initialized successfully');
      
    } catch (error) {
      console.error('[ModelVersionManager] Initialization failed:', error);
    }
  }

  /**
   * Load manifest from disk
   */
  private async loadManifest(): Promise<void> {
    const manifestPath = path.join(MODEL_DIR, MANIFEST);
    
    if (fs.existsSync(manifestPath)) {
      try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        this.manifest = JSON.parse(content);
      } catch (error) {
        console.error('[ModelVersionManager] Failed to load manifest:', error);
        this.manifest = [];
      }
    } else {
      this.manifest = [];
      await this.saveManifest();
    }
  }

  /**
   * Save manifest to disk
   */
  private async saveManifest(): Promise<void> {
    const manifestPath = path.join(MODEL_DIR, MANIFEST);
    try {
      fs.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
    } catch (error) {
      console.error('[ModelVersionManager] Failed to save manifest:', error);
    }
  }

  /**
   * Register a new model version
   */
  public async registerModelVersion(
    version: string,
    metadata: Omit<ModelMetadata, 'version' | 'timestamp'>
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const fullMetadata: ModelMetadata = {
      version,
      timestamp: Date.now(),
      ...metadata
    };

    // Add to manifest
    this.manifest.push(fullMetadata);
    await this.saveManifest();

    // Create backup
    await this.createBackup(version, fullMetadata);

    // Set as current version if it's marked stable
    if (fullMetadata.stable) {
      this.currentVersion = version;
    }

    console.log(`[ModelVersionManager] Registered version ${version}`);
    this.emit('versionRegistered', { version, metadata: fullMetadata });
  }

  /**
   * Create backup of model files
   */
  private async createBackup(version: string, metadata: ModelMetadata): Promise<void> {
    const backupPath = path.join(BACKUP_DIR, version);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Save metadata to backup
    const metadataPath = path.join(backupPath, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // In a real implementation, this would copy actual model files
    console.log(`[ModelVersionManager] Created backup for version ${version}`);
  }

  /**
   * Get the last stable model version
   */
  public getLastStableModel(): ModelMetadata | null {
    const stableVersions = this.manifest
      .filter(m => m.stable)
      .sort((a, b) => b.timestamp - a.timestamp);

    return stableVersions.length > 0 ? stableVersions[0] : null;
  }

  /**
   * Get the latest stable version
   */
  public getLatestStableVersion(): ModelMetadata | null {
    return this.getLastStableModel();
  }

  /**
   * Evaluate current model performance and determine if rollback is needed
   */
  public async evaluateRollbackNeed(
    currentPerformance: ModelMetadata['performance']
  ): Promise<RollbackDecision> {
    if (!this.currentVersion) {
      return {
        shouldRollback: false,
        targetVersion: '',
        reason: 'No current version set',
        triggers: [],
        estimatedImpact: 'low'
      };
    }

    const currentMetadata = this.manifest.find(m => m.version === this.currentVersion);
    if (!currentMetadata) {
      return {
        shouldRollback: false,
        targetVersion: '',
        reason: 'Current version not found in manifest',
        triggers: [],
        estimatedImpact: 'low'
      };
    }

    const triggers: RollbackTrigger[] = [];
    let shouldRollback = false;
    let targetVersion = '';

    // Check for performance regression
    const accuracyDrop = (currentMetadata.performance.accuracy - currentPerformance.accuracy) / currentMetadata.performance.accuracy;
    if (accuracyDrop > this.rollbackThresholds.performanceRegression) {
      triggers.push({
        type: 'performance_regression',
        threshold: this.rollbackThresholds.performanceRegression,
        currentValue: accuracyDrop,
        severity: accuracyDrop > 0.3 ? 'critical' : accuracyDrop > 0.2 ? 'high' : 'medium',
        description: `Accuracy dropped by ${(accuracyDrop * 100).toFixed(1)}%`
      });
      shouldRollback = true;
    }

    // Check for error spike
    const errorIncrease = (currentPerformance.errorRate - currentMetadata.performance.errorRate) / currentMetadata.performance.errorRate;
    if (errorIncrease > this.rollbackThresholds.errorSpike) {
      triggers.push({
        type: 'error_spike',
        threshold: this.rollbackThresholds.errorSpike,
        currentValue: errorIncrease,
        severity: errorIncrease > 1.0 ? 'critical' : errorIncrease > 0.75 ? 'high' : 'medium',
        description: `Error rate increased by ${(errorIncrease * 100).toFixed(1)}%`
      });
      shouldRollback = true;
    }

    // Check for trust collapse
    const trustDrop = (currentMetadata.performance.trust - currentPerformance.trust) / currentMetadata.performance.trust;
    if (trustDrop > this.rollbackThresholds.trustCollapse) {
      triggers.push({
        type: 'trust_collapse',
        threshold: this.rollbackThresholds.trustCollapse,
        currentValue: trustDrop,
        severity: trustDrop > 0.5 ? 'critical' : trustDrop > 0.4 ? 'high' : 'medium',
        description: `Trust score dropped by ${(trustDrop * 100).toFixed(1)}%`
      });
      shouldRollback = true;
    }

    // Check for latency increase
    const latencyIncrease = currentPerformance.latency / currentMetadata.performance.latency;
    if (latencyIncrease > this.rollbackThresholds.latencyIncrease) {
      triggers.push({
        type: 'performance_regression',
        threshold: this.rollbackThresholds.latencyIncrease,
        currentValue: latencyIncrease,
        severity: latencyIncrease > 3.0 ? 'high' : 'medium',
        description: `Latency increased by ${latencyIncrease.toFixed(1)}x`
      });
    }

    // Determine target version for rollback
    if (shouldRollback) {
      targetVersion = this.findBestRollbackTarget(currentMetadata.version);
    }

    // Estimate impact
    const estimatedImpact = this.estimateRollbackImpact(triggers);

    const decision: RollbackDecision = {
      shouldRollback,
      targetVersion,
      reason: shouldRollback 
        ? `Performance degradation detected: ${triggers.map(t => t.description).join(', ')}`
        : 'Performance within acceptable range',
      triggers,
      estimatedImpact
    };

    // Emit event for monitoring
    this.emit('rollbackEvaluated', decision);

    return decision;
  }

  /**
   * Find the best target version for rollback
   */
  private findBestRollbackTarget(currentVersion: string): string {
    // Get all stable versions before current version
    const currentMetadata = this.manifest.find(m => m.version === currentVersion);
    if (!currentMetadata) return '';

    const candidates = this.manifest
      .filter(m => 
        m.stable && 
        m.timestamp < currentMetadata.timestamp &&
        m.healthStatus === 'healthy'
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    return candidates.length > 0 ? candidates[0].version : '';
  }

  /**
   * Estimate rollback impact based on triggers
   */
  private estimateRollbackImpact(triggers: RollbackTrigger[]): 'low' | 'medium' | 'high' {
    if (triggers.some(t => t.severity === 'critical')) {
      return 'high';
    }
    if (triggers.some(t => t.severity === 'high')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Execute rollback to specified version
   */
  public async executeRollback(targetVersion: string, reason: string): Promise<boolean> {
    try {
      const targetMetadata = this.manifest.find(m => m.version === targetVersion);
      if (!targetMetadata) {
        throw new Error(`Target version ${targetVersion} not found`);
      }

      console.log(`[ModelVersionManager] Executing rollback to ${targetVersion}: ${reason}`);

      // In a real implementation, this would:
      // 1. Load model files from backup
      // 2. Update current model in production
      // 3. Verify rollback success
      // 4. Update current version

      this.currentVersion = targetVersion;

      // Record rollback in manifest
      await this.registerModelVersion(
        `${targetVersion}_rollback_${Date.now()}`,
        {
          stable: false,
          performance: targetMetadata.performance,
          source: 'rollback',
          parentVersion: targetVersion,
          description: `Rollback from previous version: ${reason}`,
          metrics: {
            datasetSize: 0,
            trainingTime: 0,
            validationScore: 0
          },
          rollbackReason: reason,
          healthStatus: 'healthy'
        }
      );

      console.log(`[ModelVersionManager] Rollback to ${targetVersion} completed successfully`);
      this.emit('rollbackCompleted', { targetVersion, reason });

      return true;

    } catch (error) {
      console.error(`[ModelVersionManager] Rollback failed:`, error);
      this.emit('rollbackFailed', { targetVersion, error });
      return false;
    }
  }

  /**
   * Auto-rollback based on performance monitoring
   */
  public async autoRollback(currentPerformance: ModelMetadata['performance']): Promise<boolean> {
    if (!this.monitoringEnabled) {
      return false;
    }

    const decision = await this.evaluateRollbackNeed(currentPerformance);

    if (decision.shouldRollback && decision.targetVersion) {
      console.log(`[ModelVersionManager] Auto-rollback triggered: ${decision.reason}`);
      return await this.executeRollback(decision.targetVersion, decision.reason);
    }

    return false;
  }

  /**
   * Get current version
   */
  public getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  /**
   * Get all versions
   */
  public getAllVersions(): ModelMetadata[] {
    return [...this.manifest];
  }

  /**
   * Get version history
   */
  public getVersionHistory(): ModelMetadata[] {
    return this.manifest.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Update rollback thresholds
   */
  public updateRollbackThresholds(thresholds: Partial<typeof this.rollbackThresholds>): void {
    this.rollbackThresholds = { ...this.rollbackThresholds, ...thresholds };
  }

  /**
   * Enable/disable monitoring
   */
  public setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  /**
   * Mark version as stable
   */
  public async markVersionStable(version: string): Promise<boolean> {
    const metadata = this.manifest.find(m => m.version === version);
    if (!metadata) {
      return false;
    }

    metadata.stable = true;
    await this.saveManifest();
    
    console.log(`[ModelVersionManager] Marked version ${version} as stable`);
    this.emit('versionMarkedStable', { version });

    return true;
  }

  /**
   * Get rollback statistics
   */
  public getRollbackStatistics(): {
    totalVersions: number;
    stableVersions: number;
    rollbackCount: number;
    avgTimeBetweenRollbacks: number;
    lastRollback?: ModelMetadata;
  } {
    const totalVersions = this.manifest.length;
    const stableVersions = this.manifest.filter(m => m.stable).length;
    const rollbacks = this.manifest.filter(m => m.source === 'rollback');
    const rollbackCount = rollbacks.length;

    let avgTimeBetweenRollbacks = 0;
    if (rollbackCount > 1) {
      const sortedRollbacks = rollbacks.sort((a, b) => a.timestamp - b.timestamp);
      const intervals = [];
      for (let i = 1; i < sortedRollbacks.length; i++) {
        intervals.push(sortedRollbacks[i].timestamp - sortedRollbacks[i - 1].timestamp);
      }
      avgTimeBetweenRollbacks = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    const lastRollback = rollbacks.length > 0 
      ? rollbacks.sort((a, b) => b.timestamp - a.timestamp)[0]
      : undefined;

    return {
      totalVersions,
      stableVersions,
      rollbackCount,
      avgTimeBetweenRollbacks,
      lastRollback
    };
  }
}

// LLM Rule Integration
export const MODEL_ROLLBACK_RULES = {
  CONFIDENCE_DROP_ROLLBACK: 'If confidence drops after update → rollback immediately',
  AUTO_ROLLBACK_TRIGGERS: [
    'Eval regression',
    'Error spike',
    'Trust score collapse',
    'Hallucination threshold exceeded'
  ],
  ROLLBACK_DECISION_FACTORS: [
    'Performance regression > 15%',
    'Error rate increase > 50%',
    'Trust score drop > 30%',
    'Latency increase > 2x'
  ]
};
