import React, { useState, useEffect } from "react";
import axios from "axios";
import { TaskType } from "../server/utils/schema";
import { HelmOrchestrator } from "../server/utils/orchestrator";

interface HelmDashboardProps {
  orchestrator: HelmOrchestrator;
}

interface HelmTask {
  skillId: string;
  params: any;
  id: string;
  timestamp: number;
}

interface HelmResponse {
  success: boolean;
  result?: any;
  error?: string;
  model?: string;
  skill?: string;
}

export const HelmDashboard: React.FC<HelmDashboardProps> = ({ orchestrator }) => {
  const [taskQueue, setTaskQueue] = useState<HelmTask[]>([]);
  const [responses, setResponses] = useState<HelmResponse[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("simple_chat");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("tinyllama");
  const [helmStatus, setHelmStatus] = useState<any>(null);
  const [realTimeLogs, setRealTimeLogs] = useState<any[]>([]);

  // Available Helm skills
  const helmSkills = [
    { id: "simple_chat", name: "Chat", description: "General conversation" },
    { id: "create_content", name: "Creative", description: "Logo/design creation" },
    { id: "code_analysis", name: "Code Analysis", description: "Code review and analysis" },
    { id: "quick_commentary", name: "Poker", description: "Poker commentary and advice" },
    { id: "basic_analysis", name: "Analysis", description: "Game analysis" },
    { id: "quick_assist", name: "Assist", description: "Player assistance" },
    { id: "poker_deal", name: "Deal", description: "Smart card dealing" },
    { id: "poker_bet", name: "Bet", description: "Betting assistance" }
  ];

  // Available models
  const availableModels = ["tinyllama", "phi", "qwen:0.5b", "deepseek-coder:1.3b"];

  // Check Helm status on mount
  useEffect(() => {
    const checkHelmStatus = async () => {
      try {
        const response = await axios.get("http://localhost:3001/helm/status");
        setHelmStatus(response.data);
      } catch (error) {
        console.error("Helm not connected:", error);
        setHelmStatus({ running: false, error: "Connection failed" });
      }
    };

    checkHelmStatus();
    const interval = setInterval(checkHelmStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Add task to queue
  const addTask = (skillId: string, params: any) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTaskQueue([...taskQueue, { 
      skillId, 
      params: { ...params, model: selectedModel }, 
      id: taskId,
      timestamp: Date.now()
    }]);
  };

  // Add custom task
  const addCustomTask = () => {
    if (!customPrompt.trim()) return;
    
    let params = { message: customPrompt };
    
    // Smart parameter detection based on skill
    if (selectedSkill === "create_content") {
      params = {
        type: "logo",
        description: customPrompt,
        style: "modern",
        format: "detailed"
      };
    } else if (selectedSkill === "code_analysis") {
      params = {
        code: customPrompt,
        language: "javascript",
        task: "analyze"
      };
    }

    addTask(selectedSkill, params);
    setCustomPrompt("");
  };

  // Remove task from queue
  const removeTask = (taskId: string) => {
    setTaskQueue(taskQueue.filter(task => task.id !== taskId));
  };

  // Execute all tasks
  const executeTasks = async () => {
    if (!taskQueue.length) return;
    
    setIsRunning(true);
    try {
      const results: HelmResponse[] = [];
      
      for (const task of taskQueue) {
        try {
          const response = await axios.post(
            `http://localhost:3001/helm/skill/${task.skillId}`,
            { 
              params: task.params,
              sessionId: "mobile-dashboard"
            }
          );
          
          results.push({
            success: true,
            result: response.data,
            model: task.params.model,
            skill: task.skillId
          });
          
          // Add to real-time logs
          setRealTimeLogs(prev => [...prev, {
            timestamp: Date.now(),
            skill: task.skillId,
            model: task.params.model,
            success: true,
            response: response.data
          }]);
          
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            skill: task.skillId
          });
        }
      }
      
      setResponses(results);
      setTaskQueue([]); // Clear queue after execution
      
    } catch (error) {
      console.error("Task execution failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  // Get task statistics
  const getTaskStats = () => {
    const stats: Record<string, number> = {};
    taskQueue.forEach(task => {
      stats[task.skillId] = (stats[task.skillId] || 0) + 1;
    });
    return stats;
  };

  // Get response statistics
  const getResponseStats = () => {
    const stats = {
      total: responses.length,
      successful: responses.filter(r => r.success).length,
      failed: responses.filter(r => !r.success).length,
      models: {} as Record<string, number>
    };
    
    responses.forEach(response => {
      if (response.model) {
        stats.models[response.model] = (stats.models[response.model] || 0) + 1;
      }
    });
    
    return stats;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🛡️ Helm Control Dashboard</h1>
      
      {/* Helm Status */}
      <div className={`bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 ${
        helmStatus?.running ? 'border-green-500' : 'border-red-500'
      }`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Helm System Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            helmStatus?.running ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {helmStatus?.running ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
        
        {helmStatus && (
          <div className="mt-2 text-sm text-gray-600">
            {helmStatus.running ? (
              <div>
                <span>Models: {availableModels.length} available</span>
                <span className="ml-4">Skills: {helmSkills.length} ready</span>
                {helmStatus.metrics && (
                  <span className="ml-4">Requests: {helmStatus.metrics.totalExecutions || 0}</span>
                )}
              </div>
            ) : (
              <span className="text-red-600">Cannot connect to Helm server at localhost:3001</span>
            )}
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
            <select 
              value={selectedSkill} 
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {helmSkills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} - {skill.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setResponses([])}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => addTask("simple_chat", { message: "Hello! How are you?" })}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          >
            💬 Chat Test
          </button>
          <button
            onClick={() => addTask("create_content", { 
              type: "logo", 
              description: "Modern logo for AI company", 
              style: "minimalist" 
            })}
            className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600"
          >
            🎨 Create Logo
          </button>
          <button
            onClick={() => addTask("code_analysis", { 
              code: "function hello() { console.log('Hi'); }", 
              language: "javascript" 
            })}
            className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
          >
            💻 Analyze Code
          </button>
          <button
            onClick={() => addTask("quick_commentary", { context: "All-in poker situation" })}
            className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
          >
            🃏 Poker Advice
          </button>
        </div>
      </div>

      {/* Custom Task Input */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Custom Task</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your prompt or task..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomTask()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addCustomTask}
            className="bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-600"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Task Queue */}
      {taskQueue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Task Queue ({taskQueue.length})</h2>
            <div className="text-sm text-gray-600">
              {Object.entries(getTaskStats()).map(([skill, count]) => (
                <span key={skill} className="ml-4">{skill}: {count}</span>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {taskQueue.map((task) => (
              <div key={task.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{task.skillId}</span>
                  <span className="text-sm text-gray-600 ml-2">Model: {task.params.model}</span>
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
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={executeTasks}
              disabled={isRunning || !helmStatus?.running}
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? "Executing..." : "Execute All Tasks"}
            </button>
            <button
              onClick={() => setTaskQueue([])}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
            >
              Clear Queue
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {responses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Results ({responses.length})</h2>
            <div className="text-sm text-gray-600">
              {Object.entries(getResponseStats()).map(([key, value]) => (
                <span key={key} className="ml-4">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {responses.map((response, idx) => (
              <div key={idx} className={`border-l-4 pl-4 py-2 ${
                response.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {response.skill} • {response.model}
                    </p>
                    {response.success ? (
                      <p className="text-sm text-gray-700 mt-1">
                        {response.result?.response || response.result?.analysis || response.result?.content || 'Task completed successfully'}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {response.error}
                      </p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    response.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {response.success ? '✓ Success' : '✗ Failed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
