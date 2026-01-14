// File: src/client/components/AceyControlCenter.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Play, Pause, Settings, BarChart3, Brain, Zap, Plus, Trash2, RefreshCw, HardDrive, AlertTriangle, Shield, TrendingUp, Target, Scale } from 'lucide-react';

// Import orchestrator modules (these would be imported from server/utils)
// For now, we'll create mock interfaces for the demo
interface MockOrchestrator {
  runTask(taskType: string, prompt: string, context: any): Promise<any>;
  runBatch(tasks: any[]): Promise<any[]>;
  addTask(taskType: string, prompt: string, context: any): any;
  dryRunSimulation(tasks: any[]): Promise<any>;
  getStats(): any;
}

interface MockContinuousLearningLoop {
  processOutput(taskType: string, prompt: string, output: any, context: any, approved?: boolean, confidence?: number): Promise<any>;
  getLearningStats(): any;
  forceFlush(): Promise<string[]>;
}

interface MockRealTimeFineTune {
  getStats(): any;
  flushQueue(): Promise<string[]>;
}

// Mock implementations for demo purposes
const mockOrchestrator: MockOrchestrator = {
  runTask: async (taskType, prompt, context) => ({
    speech: `Generated ${taskType} output for: ${prompt.substring(0, 50)}...`,
    intents: [{ type: taskType, confidence: 0.8 }],
    confidence: 0.8,
    trust: 0.7
  }),
  runBatch: async (tasks) => tasks.map(task => ({
    speech: `Batch output for: ${task.prompt.substring(0, 30)}...`,
    intents: [{ type: task.taskType, confidence: 0.8 }],
    confidence: 0.8,
    trust: 0.7
  })),
  addTask: (taskType, prompt, context) => ({
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    taskType,
    prompt,
    context,
    priority: 'medium' as const,
    timestamp: new Date().toISOString()
  }),
  dryRunSimulation: async (tasks) => tasks.map(task => ({
    taskId: task.taskType + '_' + Date.now(),
    output: {
      speech: `Simulation output for: ${task.prompt.substring(0, 30)}...`,
      intents: [{ type: task.taskType, confidence: 0.8 }],
      confidence: 0.8,
      trust: 0.7
    },
    processed: true,
    processingTime: Math.random() * 1000
  })),
  getStats: () => ({
    llmEndpoint: 'https://your-llm-endpoint.com',
    personaMode: 'hype',
    autoApprove: true,
    simulationMode: true
  })
};

const mockLearningLoop: MockContinuousLearningLoop = {
  processOutput: async (taskType, prompt, output, context, approved, confidence) => ({
    processed: true,
    fineTuneJobId: `ft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    learningUpdate: true,
    metrics: {
      totalOutputs: 100,
      approvedOutputs: 85,
      rejectedOutputs: 15,
      successRate: 0.85,
      avgConfidence: 0.87,
      taskPerformance: {
        audio: { outputs: 50, approved: 45, avgConfidence: 0.9 },
        coding: { outputs: 30, approved: 25, avgConfidence: 0.85 },
        images: { outputs: 20, approved: 15, avgConfidence: 0.8 }
      },
      lastUpdated: new Date().toISOString()
    }
  }),
  getLearningStats: () => ({
    metrics: {
      totalOutputs: 100,
      approvedOutputs: 85,
      rejectedOutputs: 15,
      successRate: 0.85,
      avgConfidence: 0.87,
      taskPerformance: {
        audio: { outputs: 50, approved: 45, avgConfidence: 0.9 },
        coding: { outputs: 30, approved: 25, avgConfidence: 0.85 },
        images: { outputs: 20, approved: 15, avgConfidence: 0.8 }
      },
      lastUpdated: new Date().toISOString()
    },
    fineTuneStats: {
      queue: { total: 5, byType: { audio: 3, coding: 2 } },
      active: { total: 1, jobs: [] },
      completed: { total: 45, successRate: 0.92, jobs: [] },
      models: { audio: "v1.2.3", coding: "v1.1.5" }
    },
    feedbackStats: {
      total: 25,
      recent: 5,
      avgRating: 4.2,
      commonIssues: [],
      improvementTrends: ["improving"]
    },
    recommendations: [
      "Consider increasing validation thresholds",
      "Review prompt templates and context",
      "Consider flushing fine-tune queue"
    ]
  }),
  forceFlush: async () => ["ft_123", "ft_124"]
};

const mockFineTune: MockRealTimeFineTune = {
  getStats: () => ({
    queue: { total: 5, byType: { audio: 3, coding: 2 } },
    active: { total: 1, jobs: [] },
    completed: { total: 45, successRate: 0.92, jobs: [] },
    models: { audio: "v1.2.3", coding: "v1.1.5" }
  }),
  flushQueue: async () => ["ft_123", "ft_124"]
};

interface TaskDefinition {
  id: string;
  taskType: string;
  prompt: string;
  context: any;
  priority: 'low' | 'medium' | 'high';
  timestamp?: string;
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

export const AceyControlCenter: React.FC = () => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [orchestrator] = useState<MockOrchestrator>(mockOrchestrator);
  const [learningLoop] = useState<MockContinuousLearningLoop>(mockLearningLoop);
  const [fineTuneManager] = useState<MockRealTimeFineTune>(mockFineTune);
  
  // Task queue
  const [taskQueue, setTaskQueue] = useState<TaskDefinition[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [currentBatch, setCurrentBatch] = useState<TaskDefinition[]>([]);
  
  // Learning stats
  const [learningStats, setLearningStats] = useState<any>(null);
  const [isLearningEnabled, setIsLearningEnabled] = useState(true);
  const [autoApproval, setAutoApproval] = useState(true);
  
  // Storage stats
  const [storageStats, setStorageStats] = useState<any>(null);
  const [storageHealth, setStorageHealth] = useState<any>(null);
  
  // Governance stats
  const [governanceStats, setGovernanceStats] = useState<any>(null);
  
  // Configuration
  const [config, setConfig] = useState({
    llmEndpoint: 'https://your-llm-endpoint.com',
    apiKey: 'your-api-key',
    batchSize: 20,
    learningRate: 0.1,
    feedbackThreshold: 0.7,
    simulationMode: true,
    enableValidation: true,
    enableDatasetPrep: true
  });

  // Initialize system
  const initializeSystem = useCallback(async () => {
    console.log('[Dashboard] Initializing Acey system...');
    
    // Load storage stats
    try {
      // Mock storage stats for demo
      setStorageStats({
        audio: 45,
        datasets: 23,
        images: 67,
        models: 8,
        logs: 156,
        archive: 89
      });
      
      // Mock storage health
      setStorageHealth({
        freeGB: 234.5,
        totalGB: 500.0,
        usedPercent: 53.1,
        warning: false,
        critical: false
      });
    } catch (error) {
      console.error('[Dashboard] Failed to load storage stats:', error);
    }
    
    // Load governance stats
    try {
      // Mock governance stats for demo
      setGovernanceStats({
        governance: {
          totalContracts: 2,
          activeContracts: 2
        },
        economics: {
          totalSkills: 5,
          highValueSkills: 3,
          lowValueSkills: 1
        },
        goals: {
          totalGoals: 4,
          activeGoals: 3,
          avgConfidence: 0.78
        },
        ethics: {
          totalConstraints: 5,
          activeConstraints: 5,
          violationRate: 0.02,
          complianceScore: 0.94
        }
      });
    } catch (error) {
      console.error('[Dashboard] Failed to load governance stats:', error);
    }
    
    // In production, this would create real instances
    // For now, we use mock implementations
    setIsInitialized(true);
    console.log('[Dashboard] System initialized successfully');
  }, []);

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
      const results = await orchestrator.dryRunSimulation(
        batch.map(task => ({
          taskType: task.taskType,
          prompt: task.prompt,
          context: task.context
        }))
      );
      
      // Process results
      const processedResults: SimulationResult[] = results.map((result: any, index: number) => ({
        taskDefinition: batch[index],
        output: result.output,
        processed: result.processed,
        fineTuneJobId: `ft_${Date.now()}_${index}`,
        learningUpdate: true,
        metrics: { successRate: 0.9 },
        timestamp: new Date().toISOString()
      }));
      
      setSimulationResults(prev => [...prev, ...processedResults]);
      
      // Remove processed tasks from queue
      setTaskQueue(prev => prev.slice(batchSize));
      setCurrentBatch([]);
      
      console.log(`[Dashboard] Batch completed: ${processedResults.length}/${batchSize} processed`);
      
      // Update learning stats
      const stats = learningLoop.getLearningStats();
      setLearningStats(stats);
      
    } catch (error) {
      console.error('[Dashboard] Simulation batch failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [orchestrator, learningLoop, taskQueue, isRunning]);

  // Force flush fine-tune queue
  const forceFlushQueue = useCallback(async () => {
    if (!learningLoop) return;
    
    try {
      const jobIds = await learningLoop.forceFlush();
      console.log(`[Dashboard] Forced flush: ${jobIds.length} jobs queued`);
      
      const stats = learningLoop.getLearningStats();
      setLearningStats(stats);
    } catch (error) {
      console.error('[Dashboard] Failed to flush queue:', error);
    }
  }, [learningLoop]);

  // Update configuration
  const updateConfiguration = useCallback((newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

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

        {/* Storage Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {storageHealth ? (
              <div className="space-y-3">
                {/* Storage Warning Banner */}
                {storageHealth.warning && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Disk usage is {storageHealth.usedPercent}% - consider archiving old files
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Disk Usage Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span className={storageHealth.critical ? 'text-red-600' : storageHealth.warning ? 'text-yellow-600' : 'text-green-600'}>
                      {storageHealth.usedPercent}%
                    </span>
                  </div>
                  <Progress 
                    value={storageHealth.usedPercent} 
                    className={`h-2 ${storageHealth.critical ? 'bg-red-100' : storageHealth.warning ? 'bg-yellow-100' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{storageHealth.freeGB} GB free</span>
                    <span>{storageHealth.totalGB} GB total</span>
                  </div>
                </div>
                
                {/* File Counts */}
                {storageStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Audio:</span>
                      <Badge variant="outline">{storageStats.audio}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <Badge variant="outline">{storageStats.images}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Datasets:</span>
                      <Badge variant="outline">{storageStats.datasets}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Models:</span>
                      <Badge variant="outline">{storageStats.models}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Logs:</span>
                      <Badge variant="outline">{storageStats.logs}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Archive:</span>
                      <Badge variant="secondary">{storageStats.archive}</Badge>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>Loading storage health...</div>
            )}
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
                {Object.entries(fineTuneStats.queue.byType).map(([taskType, count]: [string, any]) => (
                  <div key={taskType} className="flex justify-between text-sm">
                    <span>{taskType}</span>
                    <Badge variant="outline">{count}</Badge>
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
                {recommendations.map((rec: string, index: number) => (
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

  const renderGovernancePanel = () => {
    if (!governanceStats) return <div>Loading governance stats...</div>;

    const { governance, economics, goals, ethics } = governanceStats;

    return (
      <div className="space-y-4">
        {/* Governance Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Governance Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{governance.totalContracts}</div>
                <div className="text-sm text-muted-foreground">Total Contracts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{governance.activeContracts}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Economics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Skill Economics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{economics.totalSkills}</div>
                <div className="text-sm text-muted-foreground">Total Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{economics.highValueSkills}</div>
                <div className="text-sm text-muted-foreground">High Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{economics.lowValueSkills}</div>
                <div className="text-sm text-muted-foreground">Low Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Long-Term Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Long-Term Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{goals.totalGoals}</div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{goals.activeGoals}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Confidence</span>
                <span>{Math.round(goals.avgConfidence * 100)}%</span>
              </div>
              <Progress value={goals.avgConfidence * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Ethical Constraints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Ethical Constraints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{ethics.totalConstraints}</div>
                <div className="text-sm text-muted-foreground">Total Constraints</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{ethics.activeConstraints}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compliance Score</span>
                <span className={ethics.complianceScore > 0.9 ? 'text-green-600' : ethics.complianceScore > 0.7 ? 'text-yellow-600' : 'text-red-600'}>
                  {Math.round(ethics.complianceScore * 100)}%
                </span>
              </div>
              <Progress value={ethics.complianceScore * 100} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>Violation Rate</span>
                <span className={ethics.violationRate < 0.05 ? 'text-green-600' : 'text-yellow-600'}>
                  {(ethics.violationRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <TabsTrigger value="governance">Governance</TabsTrigger>
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
                    <RefreshCw className="w-4 h-4 mr-2" />
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

        {/* Governance Tab */}
        <TabsContent value="governance">
          {renderGovernancePanel()}
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
