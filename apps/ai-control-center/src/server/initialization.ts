import AceyLibraryManager from "./utils/libraryManager";
import { AceyOrchestrator } from "../utils/orchestrator";
import { AudioCodingOrchestrator } from "../utils/audioCodingOrchestrator";
import { ContinuousLearningLoop } from "../utils/continuousLearning";
import { RealTimeFineTune } from "./utils/realtimeFineTune";

export interface SystemConfig {
  llm: {
    endpoint: string;
    apiKey: string;
    maxTokens: number;
    temperature: number;
  };
  database: {
    host: string;
    port: number;
    database: string;
  };
  storage: {
    datasetPath: string;
    modelPath: string;
    tempPath: string;
  };
  websocket: {
    port: number;
    enabled: boolean;
  };
  fineTune: {
    batchSize: number;
    threshold: number;
    maxConcurrent: number;
  };
}

export interface System {
  orchestrator: AceyOrchestrator;
  audioCodingOrchestrator: AudioCodingOrchestrator;
  learningLoop: ContinuousLearningLoop;
  fineTune: RealTimeFineTune;
  libraryManager: typeof AceyLibraryManager;
}

/**
 * Initialize the complete Acey system
 */
export async function initializeSystem(config: SystemConfig): Promise<System> {
  console.log('🚀 Initializing Acey System...');

  // 1. Initialize Library Manager
  console.log('📚 Initializing Library Manager...');
  AceyLibraryManager.initLibrary();
  
  // Validate library structure
  const validation = AceyLibraryManager.validateLibrary();
  if (!validation.valid) {
    console.warn('⚠️ Library validation issues:', validation.issues);
  }

  // 2. Initialize Core Orchestrator
  console.log('🎛️ Initializing Core Orchestrator...');
  const orchestrator = new AceyOrchestrator({
    llmEndpoint: config.llm.endpoint,
    personaMode: 'hype',
    autoApprove: true,
    simulationMode: true,
    maxConcurrentTasks: 3,
    timeout: 30000
  });

  // 3. Initialize Specialized Orchestrator
  console.log('🎵 Initializing Audio Coding Orchestrator...');
  const audioCodingOrchestrator = new AudioCodingOrchestrator({
    baseOrchestrator: orchestrator,
    maxBatchSize: 10,
    batchTimeout: 60000,
    enableParallel: true
  });

  // 4. Initialize Learning Loop
  console.log('🧠 Initializing Continuous Learning Loop...');
  const learningLoop = new ContinuousLearningLoop(audioCodingOrchestrator, {
    autoFineTune: true,
    fineTuneBatchSize: config.fineTune.batchSize,
    learningRate: 0.001,
    validationSplit: 0.2,
    minConfidenceThreshold: 0.7,
    maxDatasetSize: 10000,
    checkpointInterval: 100
  });

  // 5. Initialize Real-Time Fine-Tune
  console.log('⚡ Initializing Real-Time Fine-Tune...');
  const fineTune = new RealTimeFineTune(learningLoop);

  // 6. Schedule periodic archiving
  console.log('🗄️ Setting up periodic archiving...');
  setInterval(() => {
    const archiveResult = AceyLibraryManager.archiveOldFiles();
    if (archiveResult.archived > 0) {
      console.log(`📦 Archived ${archiveResult.archived} files:`, archiveResult.folders);
    }
    if (archiveResult.errors.length > 0) {
      console.error('❌ Archive errors:', archiveResult.errors);
    }
  }, 24 * 60 * 60 * 1000); // Run daily

  // 7. Schedule periodic fine-tuning
  console.log('🔄 Setting up periodic fine-tuning...');
  fineTune.schedulePeriodicFineTune('audio', 24); // Every 24 hours
  fineTune.schedulePeriodicFineTune('website', 48); // Every 48 hours
  fineTune.schedulePeriodicFineTune('graphics', 72); // Every 72 hours
  fineTune.schedulePeriodicFineTune('images', 48); // Every 48 hours

  // 8. Log system statistics
  const stats = AceyLibraryManager.getLibraryStats();
  console.log('📊 Library Statistics:', {
    audio: stats.audio,
    datasets: stats.datasets,
    images: stats.images,
    models: stats.models,
    totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`
  });

  console.log('✅ Acey System initialized successfully!');
  
  return {
    orchestrator,
    audioCodingOrchestrator,
    learningLoop,
    fineTune,
    libraryManager: AceyLibraryManager
  };
}

/**
 * Health check for all system components
 */
export async function healthCheck(system: System): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, boolean>;
  issues: string[];
}> {
  const issues: string[] = [];
  const components: Record<string, boolean> = {};

  // Check Library Manager
  try {
    const validation = system.libraryManager.validateLibrary();
    components.libraryManager = validation.valid;
    if (!validation.valid) {
      issues.push(...validation.issues);
    }
  } catch (error) {
    components.libraryManager = false;
    issues.push(`Library Manager error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Learning Loop
  try {
    const metrics = system.learningLoop.getMetrics();
    components.learningLoop = metrics.totalSamples >= 0;
    if (metrics.totalSamples < 0) {
      issues.push('Learning Loop has negative sample count');
    }
  } catch (error) {
    components.learningLoop = false;
    issues.push(`Learning Loop error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Fine-Tune System
  try {
    const fineTuneStats = system.fineTune.getSystemStats();
    components.fineTune = fineTuneStats.totalJobs >= 0;
    if (fineTuneStats.totalJobs < 0) {
      issues.push('Fine-Tune system has negative job count');
    }
  } catch (error) {
    components.fineTune = false;
    issues.push(`Fine-Tune error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Orchestrator
  try {
    const config = system.orchestrator.getConfig();
    components.orchestrator = !!config.llmEndpoint;
    if (!config.llmEndpoint) {
      issues.push('Orchestrator missing LLM endpoint');
    }
  } catch (error) {
    components.orchestrator = false;
    issues.push(`Orchestrator error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Determine overall status
  const healthyCount = Object.values(components).filter(Boolean).length;
  const totalCount = Object.keys(components).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === totalCount) {
    status = 'healthy';
  } else if (healthyCount >= totalCount / 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    components,
    issues
  };
}

/**
 * Graceful shutdown
 */
export async function shutdown(system: System): Promise<void> {
  console.log('🛑 Shutting down Acey System...');

  try {
    // Create backup before shutdown
    const backupPath = system.libraryManager.createBackup();
    console.log(`📦 Created backup: ${backupPath}`);

    // Archive old files
    const archiveResult = system.libraryManager.archiveOldFiles();
    if (archiveResult.archived > 0) {
      console.log(`📦 Archived ${archiveResult.archived} files during shutdown`);
    }

    console.log('✅ Acey System shut down successfully');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

/**
 * Get system metrics
 */
export function getSystemMetrics(system: System): {
  library: ReturnType<typeof AceyLibraryManager.getLibraryStats>;
  learning: ReturnType<typeof system.learningLoop.getMetrics>;
  fineTune: ReturnType<typeof system.fineTune.getSystemStats>;
  uptime: number;
} {
  return {
    library: system.libraryManager.getLibraryStats(),
    learning: system.learningLoop.getMetrics(),
    fineTune: system.fineTune.getSystemStats(),
    uptime: process.uptime()
  };
}
