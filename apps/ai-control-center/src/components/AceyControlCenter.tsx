import React, { useState, useEffect, useRef } from "react";
import { SimpleCodeEditor } from "./SimpleCodeEditor";
import { AceyOrchestrator } from "../utils/orchestrator";
import { AudioCodingOrchestrator } from "../utils/audioCodingOrchestrator";
import { ContinuousLearningLoop } from "../utils/continuousLearning";
import { AceyOutput, TaskType, TaskEntry } from "../utils/schema";

interface DatasetStats {
  audio: number;
  website: number;
  graphics: number;
  images: number;
}

interface FineTuneProgress {
  queuedBatches: number;
  lastFineTune: Date | null;
  progress: number;
  estimatedTimeRemaining: number;
}

interface TrustMetrics {
  taskId: string;
  confidence: number;
  trust: number;
  approvalScore: number;
  qualityScore: number;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  taskId?: string;
  metadata?: any;
}

interface Props {
  orchestrator: AceyOrchestrator;
}

export const AceyControlCenter: React.FC<Props> = ({ orchestrator }) => {
  const [taskQueue, setTaskQueue] = useState<TaskEntry[]>([]);
  const [results, setResults] = useState<AceyOutput[]>([]);
  const [datasetStats, setDatasetStats] = useState<DatasetStats>({
    audio: 0,
    website: 0,
    graphics: 0,
    images: 0,
  });
  const [fineTuneProgress, setFineTuneProgress] = useState<FineTuneProgress>({
    queuedBatches: 0,
    lastFineTune: null,
    progress: 0,
    estimatedTimeRemaining: 0,
  });
  const [trustMetrics, setTrustMetrics] = useState<TrustMetrics[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState<TaskType>("audio");
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AceyOutput | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'simulation' | 'dataset' | 'learning'>('tasks');
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const aceyTasks = new AudioCodingOrchestrator({ baseOrchestrator: orchestrator });
  const learningLoop = new ContinuousLearningLoop(aceyTasks, { 
    autoFineTune: true, 
    fineTuneBatchSize: 20,
    learningRate: 0.001,
    validationSplit: 0.2
  });

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Initialize with sample data
  useEffect(() => {
    updateDatasetStats();
    updateFineTuneProgress();
    const interval = setInterval(() => {
      updateDatasetStats();
      updateFineTuneProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (level: LogEntry['level'], message: string, taskId?: string, metadata?: any) => {
    const logEntry: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      level,
      message,
      taskId,
      metadata
    };
    setLogs(prev => [...prev.slice(-100), logEntry]); // Keep last 100 logs
  };

  const addTask = () => {
    if (!newPrompt.trim()) {
      addLog('warn', 'Prompt cannot be empty');
      return;
    }

    let context: any;
    switch (newType) {
      case "audio":
        context = { 
          type: "speech", 
          mood: "hype", 
          lengthSeconds: 3, 
          targetFileName: `audio_${Date.now()}.mp3`,
          voice: "default",
          quality: "high"
        };
        break;
      case "website":
        context = { 
          language: "typescript", 
          description: newPrompt, 
          maxLines: 30,
          framework: "react",
          style: "modern"
        };
        break;
      case "graphics":
        context = { 
          style: "neon", 
          resolution: "512x512",
          format: "png",
          backgroundColor: "#000000"
        };
        break;
      case "images":
        context = { 
          style: "photorealistic", 
          resolution: "1024x1024",
          format: "jpg",
          aspectRatio: "1:1"
        };
        break;
      default:
        context = {};
    }

    const newTask: TaskEntry = {
      id: Date.now().toString(),
      taskType: newType,
      prompt: newPrompt,
      context,
      timestamp: new Date(),
      status: 'pending'
    };

    setTaskQueue(prev => [...prev, newTask]);
    addLog('info', `Added ${newType} task: ${newPrompt.substring(0, 50)}...`, newTask.id);
    setNewPrompt("");
  };

  const runSimulation = async () => {
    if (taskQueue.length === 0) {
      addLog('warn', 'No tasks in queue');
      return;
    }

    setIsSimulating(true);
    addLog('info', `Starting batch simulation with ${taskQueue.length} tasks`);

    try {
      // Update task statuses
      setTaskQueue(prev => prev.map(task => ({ ...task, status: 'running' as const })));

      const simResults = await aceyTasks.runBatch(taskQueue);
      setResults(simResults);

      // Generate trust metrics for each result
      const newTrustMetrics: TrustMetrics[] = simResults.map((result, idx) => ({
        taskId: taskQueue[idx].id,
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        trust: Math.random() * 0.4 + 0.6, // 0.6-1.0
        approvalScore: result.approved ? 1.0 : 0.0,
        qualityScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
      }));
      setTrustMetrics(newTrustMetrics);

      // Feed approved outputs to continuous learning
      simResults.forEach((res, idx) => {
        const task = taskQueue[idx];
        const approved = res.approved || newTrustMetrics[idx].confidence > 0.8;
        
        learningLoop.processOutput(task.taskType, task.prompt, res, approved);
        
        addLog('info', `Task ${task.taskType} ${approved ? 'approved' : 'rejected'} (confidence: ${newTrustMetrics[idx].confidence.toFixed(2)})`, task.id);
      });

      // Update task statuses
      setTaskQueue(prev => prev.map(task => ({ ...task, status: 'completed' as const })));
      
      updateDatasetStats();
      addLog('info', `Batch simulation completed with ${simResults.length} results`);

    } catch (error) {
      addLog('error', `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTaskQueue(prev => prev.map(task => ({ ...task, status: 'failed' as const })));
    } finally {
      setIsSimulating(false);
    }
  };

  const updateDatasetStats = () => {
    // Simulate reading from dataset files
    setDatasetStats({
      audio: Math.floor(Math.random() * 50) + 150,
      website: Math.floor(Math.random() * 30) + 120,
      graphics: Math.floor(Math.random() * 25) + 75,
      images: Math.floor(Math.random() * 20) + 60,
    });
  };

  const updateFineTuneProgress = () => {
    // Simulate fine-tune progress
    setFineTuneProgress({
      queuedBatches: Math.floor(Math.random() * 3) + 1,
      lastFineTune: new Date(Date.now() - Math.random() * 3600000), // Within last hour
      progress: Math.random() * 100,
      estimatedTimeRemaining: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
    });
  };

  const resetAll = () => {
    setTaskQueue([]);
    setResults([]);
    setTrustMetrics([]);
    addLog('info', 'Dashboard reset');
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'debug': return 'text-gray-600';
      default: return 'text-gray-800';
    }
  };

  const renderPreview = (result: AceyOutput, task: TaskEntry) => {
    if (task.taskType === 'audio' && result.audioUrl) {
      return (
        <audio controls src={result.audioUrl} className="w-full my-2">
          Your browser does not support the audio element.
        </audio>
      );
    }

    if ((task.taskType === 'website' || task.taskType === 'graphics') && result.speech) {
      const isCode = result.speech.includes('function') || result.speech.includes('class') || result.speech.includes('import');
      if (isCode) {
        return (
          <SimpleCodeEditor
            width="100%"
            height="200"
            language="typescript"
            theme="vs-dark"
            value={result.speech}
            options={{ 
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12
            }}
          />
        );
      }
    }

    if (task.taskType === 'images' && result.metadata?.imageUrl) {
      return (
        <img 
          src={result.metadata.imageUrl} 
          alt="Generated" 
          className="w-full mt-2 rounded border"
        />
      );
    }

    return (
      <div className="bg-gray-50 p-2 rounded text-sm">
        <pre className="whitespace-pre-wrap">{result.speech?.substring(0, 200)}...</pre>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acey Control Center</h1>
          <p className="text-gray-600">Self-learning AI assistant with continuous improvement</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['tasks', 'simulation', 'dataset', 'learning'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Task Manager */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Task Manager</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TaskType)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="audio">Audio</option>
                  <option value="website">Coding</option>
                  <option value="graphics">Graphics</option>
                  <option value="images">Image Generation</option>
                </select>
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Enter prompt"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button
                  onClick={addTask}
                  disabled={!newPrompt.trim()}
                  className="w-full bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Task
                </button>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Task Queue ({taskQueue.length})</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {taskQueue.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks queued</p>
                  ) : (
                    taskQueue.map((task, idx) => (
                      <div key={task.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.taskType}
                          </span>
                          <span className="text-xs text-gray-500">#{idx + 1}</span>
                        </div>
                        <p className="text-sm text-gray-900">{task.prompt}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={runSimulation}
                  disabled={isSimulating || taskQueue.length === 0}
                  className="w-full bg-yellow-500 text-white rounded-md px-4 py-2 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
                <button
                  onClick={resetAll}
                  className="w-full bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Middle Panel: Simulation & Preview */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Simulation Results</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No results yet</p>
              ) : (
                <div className="space-y-4">
                  {results.map((result, idx) => {
                    const task = taskQueue.find(t => results.indexOf(result) === taskQueue.indexOf(t));
                    const trust = trustMetrics[idx];
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedResult === result ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {task?.taskType || 'Unknown'}
                          </span>
                          <div className="flex items-center space-x-2">
                            {result.approved && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Auto-Approved</span>
                            )}
                            {trust && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {(trust.confidence * 100).toFixed(0)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{task?.prompt}</p>
                        
                        {renderPreview(result, task!)}

                        {result.intents && result.intents.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {result.intents.length} intents detected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Dataset Growth + Fine-Tune + Trust */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Acey Self-Learning Metrics</h3>
            </div>
            <div className="p-4 space-y-6">
              {/* Dataset Growth */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Dataset Growth</h4>
                <div className="space-y-2">
                  {Object.entries(datasetStats).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                      <span className="text-sm font-medium text-gray-900">{count} samples</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fine-Tune Progress */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Fine-Tune Progress</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Queued batches</span>
                    <span className="text-sm font-medium text-gray-900">{fineTuneProgress.queuedBatches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">{fineTuneProgress.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${fineTuneProgress.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last fine-tune</span>
                    <span className="text-sm font-medium text-gray-900">
                      {fineTuneProgress.lastFineTune ? 
                        `${Math.floor((Date.now() - fineTuneProgress.lastFineTune.getTime()) / 60000)} mins ago` : 
                        'Never'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Est. time remaining</span>
                    <span className="text-sm font-medium text-gray-900">{fineTuneProgress.estimatedTimeRemaining} mins</span>
                  </div>
                </div>
              </div>

              {/* Trust Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Trust / Confidence Metrics</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {trustMetrics.length === 0 ? (
                    <p className="text-sm text-gray-500">No metrics yet</p>
                  ) : (
                    trustMetrics.map((metric, idx) => (
                      <div key={metric.taskId} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Task {idx + 1}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${metric.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {(metric.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Real-time Logs</h3>
          </div>
          <div className="p-4 h-48 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <span className="text-gray-500 text-xs">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={getLogLevelColor(log.level)}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
