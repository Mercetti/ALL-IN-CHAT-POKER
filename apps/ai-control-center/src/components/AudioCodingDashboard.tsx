import React, { useState, useEffect, useRef } from "react";
import { AceyOrchestrator } from "../utils/orchestrator";
import { AudioCodingOrchestrator } from "../utils/audioCodingOrchestrator";
import { AceyOutput, TaskType } from "../utils/schema";

interface TaskEntry {
  id: string;
  taskType: TaskType;
  prompt: string;
  context: any;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface LogEntry {
  id: string;
  taskId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: any;
}

interface Props {
  orchestrator: AceyOrchestrator;
}

export const AudioCodingDashboard: React.FC<Props> = ({ orchestrator }) => {
  const [taskQueue, setTaskQueue] = useState<TaskEntry[]>([]);
  const [results, setResults] = useState<AceyOutput[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState<TaskType>("audio");
  const [isRunning, setIsRunning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AceyOutput | null>(null);
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [autoApprove, setAutoApprove] = useState(true);
  const [simulationMode, setSimulationMode] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const aceyTasks = new AudioCodingOrchestrator({ baseOrchestrator: orchestrator });

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Add log entry
  const addLog = (level: LogEntry['level'], message: string, taskId?: string, metadata?: any) => {
    const logEntry: LogEntry = {
      id: Date.now().toString() + Math.random(),
      taskId: taskId || '',
      level,
      message,
      timestamp: new Date(),
      metadata
    };
    setLogs(prev => [...prev, logEntry]);
  };

  // Add task dynamically
  const addTask = () => {
    if (!newPrompt.trim()) {
      addLog('warn', 'Prompt cannot be empty');
      return;
    }

    let context: any;
    if (newType === "audio") {
      context = { 
        type: "speech", 
        mood: "hype", 
        lengthSeconds: 3,
        voice: "default"
      };
    } else if (newType === "website") {
      context = { 
        language: "typescript", 
        description: newPrompt, 
        maxLines: 30,
        framework: "react"
      };
    } else if (newType === "graphics") {
      context = {
        type: "sprite",
        dimensions: "512x512",
        style: "pixel-art"
      };
    } else {
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

  // Run batch simulation
  const runSimulation = async () => {
    if (taskQueue.length === 0) {
      addLog('warn', 'No tasks in queue');
      return;
    }

    setIsRunning(true);
    addLog('info', `Starting batch simulation with ${taskQueue.length} tasks`);

    try {
      // Update task statuses
      setTaskQueue(prev => prev.map(task => ({ ...task, status: 'running' as const })));

      const simResults = await aceyTasks.runBatch(taskQueue);
      
      // Update results and task statuses
      setResults(simResults);
      setTaskQueue(prev => prev.map(task => ({ ...task, status: 'completed' as const })));
      
      addLog('info', `Batch simulation completed with ${simResults.length} results`);
      
      // Log each result
      simResults.forEach((result, idx) => {
        const task = taskQueue[idx];
        addLog('info', `Task ${task.taskType} completed`, task.id, {
          speechLength: result.speech?.length || 0,
          intents: result.intents?.length || 0,
          approved: result.approved
        });

    } catch (error) {
      addLog('error', `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTaskQueue(prev => prev.map(task => ({ ...task, status: 'failed' as const })));
    } finally {
      setIsRunning(false);
    }
  };

  // Reset tasks and results
  const resetAll = () => {
    setTaskQueue([]);
    setResults([]);
    setLogs([]);
    setSelectedResult(null);
    addLog('info', 'Dashboard reset');
  };

  // Export results as JSONL
  const exportResults = () => {
    const jsonl = results.map(r => JSON.stringify(r)).join('\n');
    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acey-simulation-${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('info', 'Results exported as JSONL');
  };

  // Play audio if available
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      addLog('info', 'Playing audio preview');
    }
  };

  // Filter results
  const filteredResults = filterType === 'all' 
    ? results 
    : results.filter((_, idx) => taskQueue[idx]?.taskType === filterType);

  // Get log level color
  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'debug': return 'text-gray-600';
      default: return 'text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acey Audio & Coding Dashboard</h1>
          <p className="text-gray-600">Dynamic task orchestration with batch simulations and real-time monitoring</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Add Task */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Add New Task</h3>
            <div className="space-y-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as TaskType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="audio">Audio</option>
                <option value="website">Coding</option>
                <option value="graphics">Graphics</option>
              </select>
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Enter prompt/description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Auto-approve results</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={simulationMode}
                  onChange={(e) => setSimulationMode(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Simulation mode</span>
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="audio">Audio</option>
                <option value="website">Coding</option>
                <option value="graphics">Graphics</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={runSimulation}
                disabled={isRunning || taskQueue.length === 0}
                className="w-full bg-yellow-500 text-white rounded-md px-4 py-2 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? 'Running...' : 'Run Simulation'}
              </button>
              <button 
                onClick={resetAll}
                className="w-full bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 transition-colors"
              >
                Reset All
              </button>
              <button 
                onClick={exportResults}
                disabled={results.length === 0}
                className="w-full bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Export JSONL
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Queue */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Task Queue ({taskQueue.length})</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {taskQueue.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks queued</p>
              ) : (
                <div className="space-y-2">
                  {taskQueue.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.taskType} - {task.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{task.prompt}</p>
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer">Context</summary>
                        <pre className="mt-1 bg-gray-50 p-2 rounded">{JSON.stringify(task.context, null, 2)}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Simulation Results ({filteredResults.length})</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {filteredResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No results yet</p>
              ) : (
                <div className="space-y-2">
                  {filteredResults.map((result, idx) => {
                    const task = taskQueue.find(t => results.indexOf(result) === taskQueue.indexOf(t));
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedResult === result ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {task?.taskType || 'Unknown'}
                          </span>
                          <div className="flex items-center space-x-2">
                            {result.approved && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Auto-Approved</span>
                            )}
                            {result.audioUrl && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playAudio(result.audioUrl!);
                                }}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                              >
                                ▶ Play
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {result.speech?.substring(0, 100)}...
                        </p>
                        {result.intents && result.intents.length > 0 && (
                          <div className="text-xs text-gray-500">
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
        </div>

        {/* Selected Result Details */}
        {selectedResult && (
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Result Details</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Generated Content</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">{selectedResult.speech}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-sm text-gray-800">{JSON.stringify(selectedResult, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Real-time Logs</h3>
          </div>
          <div className="p-4 h-64 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm">
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
                    {log.taskId && (
                      <span className="text-gray-500 text-xs">
                        #{taskQueue.findIndex(t => t.id === log.taskId) + 1}
                      </span>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
