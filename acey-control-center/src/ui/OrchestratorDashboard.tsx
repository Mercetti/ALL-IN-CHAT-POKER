import React, { useState, useEffect } from "react";
import axios from "axios";
import { AceyOutput, AceyInteractionLog, TaskType, PersonaMode } from "../server/utils/schema";
import { HelmOrchestrator } from "../server/utils/orchestrator";

interface SimulationDashboardProps {
  orchestrator: HelmOrchestrator;
}

export const OrchestratorDashboard: React.FC<SimulationDashboardProps> = ({ orchestrator }) => {
  const [taskQueue, setTaskQueue] = useState<{ taskType: TaskType; prompt: string; context: any; id: string }[]>([]);
  const [simulationLogs, setSimulationLogs] = useState<AceyInteractionLog[]>([]);
  const [results, setResults] = useState<AceyOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>("game");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customContext, setCustomContext] = useState("{}");
  const [personaMode, setPersonaMode] = useState<PersonaMode>("hype");
  const [autoApprove, setAutoApprove] = useState(true);
  const [simulationMode, setSimulationMode] = useState(true);

  // Add a task to queue
  const addTask = (taskType: TaskType, prompt: string, context: any) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTaskQueue([...taskQueue, { taskType, prompt, context, id: taskId }]);
  };

  // Add custom task
  const addCustomTask = () => {
    try {
      const context = JSON.parse(customContext);
      addTask(selectedTaskType, customPrompt, context);
      setCustomPrompt("");
      setCustomContext("{}");
    } catch (error) {
      alert("Invalid JSON in context field");
    }
  };

  // Remove task from queue
  const removeTask = (taskId: string) => {
    setTaskQueue(taskQueue.filter(task => task.id !== taskId));
  };

  // Run dry-run simulation
  const runSimulation = async () => {
    if (!taskQueue.length) return;
    
    setIsRunning(true);
    try {
      // Update orchestrator configuration
      orchestrator.updateConfig({
        personaMode,
        autoApprove,
        simulationMode: true
      });

      // Run batch simulation
      const tasks = taskQueue.map(({ taskType, prompt, context }) => ({ taskType, prompt, context }));
      const outputs = await orchestrator.runBatch(tasks);
      setResults(outputs);

      // Fetch all logs for display
      const { data } = await axios.get<AceyInteractionLog[]>("http://localhost:8080/api/logs?limit=100");
      setSimulationLogs(data);

    } catch (error) {
      console.error("Simulation failed:", error);
      alert("Simulation failed. Check console for details.");
    } finally {
      setIsRunning(false);
    }
  };

  // Reset simulation
  const resetSimulation = () => {
    setTaskQueue([]);
    setSimulationLogs([]);
    setResults([]);
  };

  // Clear logs
  const clearLogs = () => {
    setSimulationLogs([]);
  };

  // Get task statistics
  const getTaskStats = () => {
    const stats = {
      total: taskQueue.length,
      game: taskQueue.filter(t => t.taskType === "game").length,
      website: taskQueue.filter(t => t.taskType === "website").length,
      graphics: taskQueue.filter(t => t.taskType === "graphics").length,
      audio: taskQueue.filter(t => t.taskType === "audio").length,
      moderation: taskQueue.filter(t => t.taskType === "moderation").length,
      memory: taskQueue.filter(t => t.taskType === "memory").length,
      trust: taskQueue.filter(t => t.taskType === "trust").length,
      persona: taskQueue.filter(t => t.taskType === "persona").length
    };
    return stats;
  };

  // Get log statistics
  const getLogStats = () => {
    const stats = {
      total: simulationLogs.length,
      approved: simulationLogs.filter(log => log.controlDecision === "approved").length,
      rejected: simulationLogs.filter(log => log.controlDecision === "rejected").length,
      pending: simulationLogs.filter(log => log.controlDecision === "pending").length,
      modified: simulationLogs.filter(log => log.controlDecision === "modified").length,
      avgResponseTime: simulationLogs.length > 0 
        ? simulationLogs.reduce((sum, log) => sum + (log.performance?.responseTime || 0), 0) / simulationLogs.length 
        : 0
    };
    return stats;
  };

  // Export simulation data
  const exportSimulation = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      orchestratorConfig: orchestrator.getStats(),
      taskQueue,
      results,
      logs: simulationLogs,
      statistics: {
        tasks: getTaskStats(),
        logs: getLogStats()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🎮 Acey Orchestrator Dashboard</h1>
      
      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Persona Mode</label>
            <select 
              value={personaMode} 
              onChange={(e) => setPersonaMode(e.target.value as PersonaMode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="calm">Calm</option>
              <option value="hype">Hype</option>
              <option value="neutral">Neutral</option>
              <option value="locked">Locked</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto Approve</label>
            <select 
              value={autoApprove ? "true" : "false"}
              onChange={(e) => setAutoApprove(e.target.value === "true")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Simulation Mode</label>
            <select 
              value={simulationMode ? "true" : "false"}
              onChange={(e) => setSimulationMode(e.target.value === "true")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Dry Run</option>
              <option value="false">Live Mode</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={exportSimulation}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Task Queue Management */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Task Queue ({taskQueue.length})</h2>
          <div className="text-sm text-gray-600">
            {Object.entries(getTaskStats()).map(([type, count]) => (
              <span key={type} className="ml-4">{type}: {count}</span>
            ))}
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => addTask("game", "All-in call, generate hype speech", { pot: 500 })}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          >
            Add Game Task
          </button>
          <button
            onClick={() => addTask("graphics", "Generate neon badge", { subTier: 1 })}
            className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
          >
            Add Graphics Task
          </button>
          <button
            onClick={() => addTask("audio", "Victory sound clip", { intensity: "high" })}
            className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600"
          >
            Add Audio Task
          </button>
          <button
            onClick={() => addTask("website", "Fix navigation issue", { page: "/home" })}
            className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
          >
            Add Website Task
          </button>
          <button
            onClick={() => addTask("moderation", "Check chat message", { message: "test message" })}
            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
          >
            Add Moderation Task
          </button>
        </div>

        {/* Custom Task Input */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Custom Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select 
              value={selectedTaskType}
              onChange={(e) => setSelectedTaskType(e.target.value as TaskType)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="game">Game</option>
              <option value="website">Website</option>
              <option value="graphics">Graphics</option>
              <option value="audio">Audio</option>
              <option value="moderation">Moderation</option>
              <option value="memory">Memory</option>
              <option value="trust">Trust</option>
              <option value="persona">Persona</option>
            </select>
            <input
              type="text"
              placeholder="Prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Context (JSON)"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={addCustomTask}
              className="bg-indigo-500 text-white px-3 py-2 rounded-md hover:bg-indigo-600"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Task Queue Display */}
        {taskQueue.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Queued Tasks</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {taskQueue.map((task) => (
                <div key={task.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{task.taskType}</span>
                    <span className="text-sm text-gray-600 ml-2">{task.prompt.substring(0, 50)}...</span>
                  </div>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simulation Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Simulation Controls</h2>
        <div className="flex gap-4">
          <button
            onClick={runSimulation}
            disabled={isRunning || taskQueue.length === 0}
            className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRunning ? "Running..." : "Run Simulation"}
          </button>
          <button
            onClick={resetSimulation}
            className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
          >
            Reset
          </button>
          <button
            onClick={clearLogs}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Logs */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Simulation Logs</h2>
            <div className="text-sm text-gray-600">
              {Object.entries(getLogStats()).map(([decision, count]) => (
                <span key={decision} className="ml-4">{decision}: {count}</span>
              ))}
            </div>
          </div>
          
          {simulationLogs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run a simulation to see results.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleTimeString()} | {log.taskType}
                      </p>
                      <p className="font-medium text-sm">{log.aceyOutput.speech}</p>
                      <p className="text-xs text-gray-500">
                        Decision: <span className={`font-semibold ${
                          log.controlDecision === 'approved' ? 'text-green-600' :
                          log.controlDecision === 'rejected' ? 'text-red-600' :
                          log.controlDecision === 'pending' ? 'text-yellow-600' : 'text-blue-600'
                        }`}>{log.controlDecision}</span>
                      </p>
                      {log.performance && (
                        <p className="text-xs text-gray-500">
                          Response: {log.performance.responseTime}ms | 
                          Tokens: {log.performance.tokenCount || 0}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulation Results */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Simulation Results ({results.length})</h2>
          
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Run a simulation to see outputs.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((res, idx) => (
                <div key={idx} className="border-b pb-2">
                  <p className="font-medium">{res.speech}</p>
                  {res.intents && res.intents.length > 0 && (
                    <div className="mt-1">
                      {res.intents.map((intent, iidx) => (
                        <p key={iidx} className="text-xs text-gray-600">
                          Intent: {intent.type} | 
                          Confidence: {intent.confidence ? (intent.confidence * 100).toFixed(1) : 'N/A'}%
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
