import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Play, Pause, Settings, BarChart3, Brain, Zap } from 'lucide-react';

// Import our orchestrator modules
import { AudioCodingOrchestrator } from '../server/utils/audioCodingOrchestrator';
import { ContinuousLearningLoop } from '../server/utils/continuousLearning';
import { RealTimeFineTune } from '../server/utils/realtimeFineTune';
import { AceyOrchestrator } from '../server/utils/orchestrator';
import { TaskType } from '../server/utils/schema';

interface TaskDefinition {
  id: string;
  taskType: TaskType;
  prompt: string;
  context: any;
  priority: 'low' | 'medium' | 'high';
}

interface LearningStats {
  metrics: {
    totalOutputs: number;
    approvedOutputs: number;
    rejectedOutputs: number;
    fineTuneJobs: number;
    successRate: number;
    avgConfidence: number;
    taskPerformance: Record<TaskType, any>;
    lastUpdated: string;
  };
  fineTuneStats: {
    queue: { total: number; byType: Record<TaskType, number> };
    active: { total: number; jobs: any[] };
    completed: { total: number; successRate: number; jobs: any[] };
    models: Record<TaskType, string>;
  };
  feedbackStats: any;
  recommendations: string[];
}

interface SimulationResult {
  taskDefinition: TaskDefinition;
  output: any;
  processed: boolean;
  fineTuneJobId?: string;
  learningUpdate: boolean;
  metrics: any;
  timestamp: string;
}

export const InteractiveAceyDashboard: React.FC = () => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [orchestrator, setOrchestrator] = useState<AudioCodingOrchestrator | null>(null);
  const [learningLoop, setLearningLoop] = useState<ContinuousLearningLoop | null>(null);
  const [fineTuneManager, setFineTuneManager] = useState<RealTimeFineTune | null>(null);
  
  // Task queue
  const [taskQueue, setTaskQueue] = useState<TaskDefinition[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [currentBatch, setCurrentBatch] = useState<TaskDefinition[]>([]);
  
  // Learning stats
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [isLearningEnabled, setIsLearningEnabled] = useState(true);
  const [autoApproval, setAutoApproval] = useState(true);
  
  // Configuration
  const [config, setConfig] = useState({
    llmEndpoint: 'https://your-llm-endpoint.com/generate',
    apiKey: 'your-api-key',
    batchSize: 20,
    learningRate: 0.1,
    feedbackThreshold: 0.7,
    simulationMode: true,
    enableValidation: true,
    enableDatasetPrep: true
  });

  // Initialize orchestrator and learning loop
  const initializeSystem = useCallback(async () => {
    try {
      console.log('[Dashboard] Initializing Acey system...');
      
      // Create base orchestrator
      const baseOrchestrator = new AceyOrchestrator({
        llmEndpoint: config.llmEndpoint,
        personaMode: 'hype',
        autoApprove: autoApproval,
        simulationMode: config.simulationMode
      });

      // Create audio coding orchestrator
      const audioCodingOrchestrator = new AudioCodingOrchestrator({
        baseOrchestrator,
        simulationMode: config.simulationMode,
        autoApprove,
        enableValidation: config.enableValidation,
        enableDatasetPrep: config.enableDatasetPrep
      });

      // Create continuous learning loop
      const learningLoop = new ContinuousLearningLoop(audioCodingOrchestrator, {
        fineTuneOptions: {
          datasetDir: './data/dataset',
          batchSize: config.batchSize,
          fineTuneEndpoint: config.llmEndpoint + '/fine-tune',
          apiKey: config.apiKey,
          adaptiveBatchSize: true,
          minConfidence: config.feedbackThreshold,
          maxQueueSize: 100,
          retryAttempts: 3,
          timeout: 30000
        },
        learningRate: config.learningRate,
        feedbackThreshold: config.feedbackThreshold,
        enableAutoApproval: autoApproval,
        simulationValidation: config.enableValidation,
        crossTaskLearning: true
      });

      setOrchestrator(audioCodingOrchestrator);
      setLearningLoop(learningLoop);
      setIsInitialized(true);
      
      console.log('[Dashboard] System initialized successfully');
      
    } catch (error) {
      console.error('[Dashboard] Failed to initialize system:', error);
    }
  }, [config, autoApproval]);

  // Load sample tasks
  const loadSampleTasks = useCallback(() => {
    const sampleTasks: TaskDefinition[] = [
      {
        id: '1',
        taskType: 'audio',
        prompt: 'Generate hype TTS line for all-in play',
        context: {
          type: 'speech',
          mood: 'hype',
          lengthSeconds: 3,
          voice: 'energetic',
          gameState: { pot: 500, player: 'JohnDoe', action: 'all-in' }
        },
        priority: 'high'
      },
      {
        id: '2',
        taskType: 'coding',
        prompt: 'Create TypeScript validation function for chat messages',
        context: {
          language: 'typescript',
          description: 'Validate chat messages for safe characters only',
          functionName: 'validateChatMessage',
          maxLines: 30,
          validationRules: [
            { type: 'security', rule: 'No eval usage', severity: 'error' },
            { type: 'style', rule: 'Include JSDoc', severity: 'warning' }
          ]
        },
        priority: 'medium'
      },
      {
        id: '3',
        taskType: 'audio',
        prompt: 'Generate celebratory music for new subscriber',
        context: {
          type: 'music',
          mood: 'hype',
          lengthSeconds: 10,
          intensity: 'high',
          format: 'mp3',
          subscriberCount: 1
        },
        priority: 'medium'
      },
      {
        id: '4',
        taskType: 'coding',
        prompt: 'Create Python script for image processing',
        context: {
          language: 'python',
          description: 'Convert images to 512x512 PNG format',
          functionName: 'convertImages',
          maxLines: 50,
          dependencies: ['PIL', 'os', 'path']
        },
        priority: 'low'
      },
      {
        id: '5',
        taskType: 'audio',
        prompt: 'Generate victory sound effect',
        context: {
          type: 'effect',
          mood: 'hype',
          lengthSeconds: 2,
          intensity: 'medium',
          player: 'Alice',
          action: 'won_pot'
        },
        priority: 'high'
      }
    ];
    
    setTaskQueue(sampleTasks);
  }, []);

  // Run simulation batch
  const runSimulation = useCallback(async () => {
    if (!orchestrator || !learningLoop || isRunning) return;
    
    setIsRunning(true);
    console.log('[Dashboard] Starting simulation batch...');
    
    try {
      // Prepare batch
      const batchSize = Math.min(5, taskQueue.length);
      const batch = taskQueue.slice(0, batchSize);
      setCurrentBatch(batch);
      
      // Run batch through learning loop
      const learningSummary = await learningLoop.runBatchLearningCycle(
        batch.map(task => ({
          taskType: task.taskType,
          prompt: task.prompt,
          context: task.context
        }))
      );
      
      // Process results
      const results: SimulationResult[] = learningSummary.results.map((result, index) => ({
        taskDefinition: batch[index],
        output: result.output,
        processed: result.result?.processed || false,
        fineTuneJobId: result.result?.fineTuneJobId,
        learningUpdate: result.result?.learningUpdate || false,
        metrics: result.result?.metrics,
        timestamp: new Date().toISOString()
      }));
      
      setSimulationResults(prev => [...prev, ...results]);
      
      // Remove processed tasks from queue
      setTaskQueue(prev => prev.slice(batchSize));
      setCurrentBatch([]);
      
      console.log(`[Dashboard] Batch completed: ${learningSummary.learningSummary.processed}/${batchSize} processed`);
      console.log(`[Dashboard] Fine-tune jobs: ${learningSummary.learningSummary.fineTuneJobs.length}`);
      
    } catch (error) {
      console.error('[Dashboard] Simulation batch failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [orchestrator, learningLoop, taskQueue, isRunning]);

  // Update learning stats
  const updateLearningStats = useCallback(async () => {
    if (!learningLoop) return;
    
    try {
      const stats = learningLoop.getLearningStats();
      setLearningStats(stats);
    } catch (error) {
      console.error('[Dashboard] Failed to update learning stats:', error);
    }
  }, [learningLoop]);

  // Force flush fine-tune queue
  const forceFlushQueue = useCallback(async () => {
    if (!learningLoop) return;
    
    try {
      const jobIds = await learningLoop.forceFlush();
      console.log(`[Dashboard] Forced flush: ${jobIds.length} jobs queued`);
      await updateLearningStats();
    } catch (error) {
      console.error('[Dashboard] Failed to flush queue:', error);
    }
  }, [learningLoop, updateLearningStats]);

  // Update configuration
  const updateConfiguration = useCallback((newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Effects
  useEffect(() => {
    initializeSystem();
    loadSampleTasks();
  }, [initializeSystem, loadSampleTasks]);

  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(updateLearningStats, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isInitialized, updateLearningStats]);

  // Render helpers
  const renderTaskQueue = () => (
    <div className="space-y-2">
      {taskQueue.map((task, index) => (
        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={task.taskType === 'audio' ? 'default' : 'secondary'}>
                {task.taskType}
              </Badge>
              <span className="text-sm font-medium">{task.prompt.substring(0, 50)}...</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Priority: {task.priority}
            </div>
          </div>
          <Badge variant={index < 5 ? 'outline' : 'secondary'}>
            {index < 5 ? 'Next Batch' : 'Queued'}
          </Badge>
        </div>
      ))}
    </div>
  );

  const renderSimulationResults = () => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {simulationResults.slice(-10).reverse().map((result, index) => (
        <div key={`${result.taskDefinition.id}-${index}`} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={result.processed ? 'default' : 'destructive'}>
                {result.processed ? 'Processed' : 'Failed'}
              </Badge>
              <Badge variant="outline">{result.taskDefinition.taskType}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="text-sm">
            <div className="font-medium">{result.taskDefinition.prompt}</div>
            {result.output && (
              <div className="text-muted-foreground mt-1">
                {result.output.speech?.substring(0, 100)}...
              </div>
            )}
          </div>
          
          {result.fineTuneJobId && (
            <div className="flex items-center gap-2 mt-2">
              <Brain className="w-4 h-4" />
              <span className="text-xs">Fine-tune job: {result.fineTuneJobId}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderLearningStats = () => {
    if (!learningStats) return <div>Loading stats...</div>;

    const { metrics, fineTuneStats, recommendations } = learningStats;

    return (
      <div className="space-y-4">
        {/* Overall Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.totalOutputs}</div>
                <div className="text-sm text-muted-foreground">Total Outputs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.approvedOutputs}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.rejectedOutputs}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(metrics.successRate * 100)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Success Rate</span>
                <span>{Math.round(metrics.successRate * 100)}%</span>
              </div>
              <Progress value={metrics.successRate * 100} className="h-2" />
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Confidence</span>
                <span>{Math.round(metrics.avgConfidence * 100)}%</span>
              </div>
              <Progress value={metrics.avgConfidence * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Fine-Tune Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fine-Tuning Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Queue Size:</span>
                <Badge variant="outline">{fineTuneStats.queue.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Active Jobs:</span>
                <Badge variant="secondary">{fineTuneStats.active.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Completed Jobs:</span>
                <Badge variant="default">{fineTuneStats.completed.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <Badge variant={fineTuneStats.completed.successRate > 0.8 ? 'default' : 'destructive'}>
                  {Math.round(fineTuneStats.completed.successRate * 100)}%
                </Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Queue by Task Type</h4>
              <div className="space-y-1">
                {Object.entries(fineTuneStats.queue.byType).map(([taskType, count]) => (
                  <div key={taskType} className="flex justify-between text-sm">
                    <span>{taskType}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <Zap className="w-4 h-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Initializing Acey System...</h2>
          <p className="text-muted-foreground">Setting up orchestrator and learning loop</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interactive Acey Dashboard</h1>
          <p className="text-muted-foreground">Real-time learning and fine-tuning control center</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLearningEnabled(!isLearningEnabled)}
          >
            <Brain className="w-4 h-4 mr-2" />
            Learning: {isLearningEnabled ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoApproval(!autoApproval)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Auto-Approve: {autoApproval ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={forceFlushQueue}
          >
            <Zap className="w-4 h-4 mr-2" />
            Flush Queue
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="simulation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="learning">Learning Stats</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Task Queue ({taskQueue.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderTaskQueue()}
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={runSimulation}
                    disabled={isRunning || taskQueue.length === 0}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Batch ({Math.min(5, taskQueue.length)} tasks)
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={loadSampleTasks}>
                    Load Sample Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Batch Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Batch Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isRunning ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span>Processing {currentBatch.length} tasks...</span>
                    </div>
                    <Progress value={66} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      Learning loop active, fine-tuning enabled
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No batch running</p>
                    <p className="text-sm">Click "Run Batch" to start simulation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Stats Tab */}
        <TabsContent value="learning">
          {renderLearningStats()}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Results ({simulationResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSimulationResults()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
