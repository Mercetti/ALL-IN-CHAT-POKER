import React, { useState } from "react";
import axios from "axios";

interface Command {
  id: string;
  name: string;
  description: string;
  command: string;
  category: "health" | "deployment" | "development" | "monitoring";
  requiresInput?: boolean;
  inputPlaceholder?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "HEAD";
}

export const CommandCenter: React.FC = () => {
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [commandOutput, setCommandOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<Array<{command: string; output: string; timestamp: string}>>([]);

  const commands: Command[] = [
    // Health Check Commands
    {
      id: "health-local",
      name: "Check Local Health",
      description: "Check if local backend is running",
      command: "curl -I http://localhost:8080/health",
      category: "health",
      endpoint: "http://localhost:8080/health",
      method: "HEAD"
    },
    {
      id: "health-production",
      name: "Check Production Health",
      description: "Check if production backend is healthy",
      command: "curl -I https://all-in-chat-poker.fly.dev/health",
      category: "health",
      endpoint: "https://all-in-chat-poker.fly.dev/health",
      method: "HEAD"
    },

    // Deployment Commands
    {
      id: "fly-status",
      name: "Check Fly.io Status",
      description: "Get current deployment status",
      command: "fly status -a all-in-chat-poker",
      category: "deployment"
    },
    {
      id: "fly-logs",
      name: "View Fly.io Logs",
      description: "Show recent deployment logs",
      command: "fly logs -a all-in-chat-poker",
      category: "deployment"
    },

    // Development Commands
    {
      id: "start-backend",
      name: "Start Backend",
      description: "Start the local backend server",
      command: "node server.js",
      category: "development"
    },
    {
      id: "start-frontend",
      name: "Open AI Control Center",
      description: "Open the AI Control Center UI",
      command: "start http://localhost:5173",
      category: "development"
    },
    {
      id: "start-dashboard",
      name: "Open Dashboard",
      description: "Open the main dashboard",
      command: "start http://localhost:8080",
      category: "development"
    },

    // Monitoring Commands
    {
      id: "check-logs",
      name: "Check Recent Logs",
      description: "View recent interaction logs",
      command: "curl http://localhost:8080/api/logs?limit=10",
      category: "monitoring",
      endpoint: "http://localhost:8080/api/logs?limit=10",
      method: "GET"
    },
    {
      id: "check-stats",
      name: "View Statistics",
      description: "Get logging statistics",
      command: "curl http://localhost:8080/api/logs/stats",
      category: "monitoring",
      endpoint: "http://localhost:8080/api/logs/stats",
      method: "GET"
    },
    {
      id: "check-workflows",
      name: "List Workflows",
      description: "View all fine-tuning workflows",
      command: "curl http://localhost:8080/api/workflow/list",
      category: "monitoring",
      endpoint: "http://localhost:8080/api/workflow/list",
      method: "GET"
    },

    // Custom Commands
    {
      id: "custom-curl",
      name: "Custom cURL",
      description: "Execute custom cURL command",
      command: "curl",
      category: "monitoring",
      requiresInput: true,
      inputPlaceholder: "Enter cURL command..."
    },
    {
      id: "custom-endpoint",
      name: "Test Endpoint",
      description: "Test any API endpoint",
      command: "curl",
      category: "monitoring",
      requiresInput: true,
      inputPlaceholder: "Enter endpoint URL..."
    }
  ];

  const executeCommand = async (command: Command) => {
    setIsRunning(true);
    setCommandOutput("");
    
    try {
      let output = "";

      if (command.endpoint && command.method) {
        // Use axios for HTTP commands
        const config = {
          method: command.method.toLowerCase() as 'get' | 'post' | 'head',
          url: command.endpoint,
          timeout: 10000
        };

        if (command.method === "HEAD") {
          const response = await axios(config);
          output = `Status: ${response.status} ${response.statusText}\n`;
          output += `Headers: ${JSON.stringify(response.headers, null, 2)}`;
        } else {
          const response = await axios(config);
          output = `Status: ${response.status} ${response.statusText}\n`;
          output += `Data: ${JSON.stringify(response.data, null, 2)}`;
        }
      } else if (command.requiresInput && commandInput) {
        // Handle custom commands with input
        if (command.id === "custom-curl") {
          // Execute custom cURL via backend
          const response = await axios.post("http://localhost:8080/api/execute-command", {
            command: commandInput
          });
          output = response.data.output || "Command executed";
        } else if (command.id === "custom-endpoint") {
          // Test custom endpoint
          const response = await axios.get(commandInput);
          output = `Status: ${response.status} ${response.statusText}\n`;
          output += `Data: ${JSON.stringify(response.data, null, 2)}`;
        }
      } else {
        // For other commands, show the command to run manually
        output = `Command to execute:\n${command.command}\n\n`;
        output += "Note: This command needs to be run in your terminal.";
      }

      setCommandOutput(output);
      
      // Add to history
      setCommandHistory(prev => [
        {
          command: command.command + (commandInput ? ` ${commandInput}` : ""),
          output: output,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9) // Keep last 10
      ]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setCommandOutput(`Error: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearHistory = () => {
    setCommandHistory([]);
    setCommandOutput("");
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  const commandsByCategory = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryColors = {
    health: "bg-green-100 text-green-800 border-green-200",
    deployment: "bg-blue-100 text-blue-800 border-blue-200",
    development: "bg-purple-100 text-purple-800 border-purple-200",
    monitoring: "bg-yellow-100 text-yellow-800 border-yellow-200"
  };

  const categoryIcons = {
    health: "🏥",
    deployment: "🚀",
    development: "💻",
    monitoring: "📊"
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🎮 Command Center</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Command Categories */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Quick Commands</h2>
            
            {Object.entries(commandsByCategory).map(([category, cmds]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <span className="mr-2">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cmds.map((cmd) => (
                    <div
                      key={cmd.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${categoryColors[category as keyof typeof categoryColors]}`}
                      onClick={() => setSelectedCommand(cmd)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{cmd.name}</h4>
                          <p className="text-sm opacity-80 mt-1">{cmd.description}</p>
                          <code className="text-xs bg-black bg-opacity-10 px-2 py-1 rounded mt-2 block">
                            {cmd.command}
                          </code>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCommand(cmd.command);
                          }}
                          className="ml-2 text-sm bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Command Execution Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-xl font-semibold mb-4">Execute Command</h2>
            
            {selectedCommand && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">{selectedCommand.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedCommand.description}</p>
                
                {selectedCommand.requiresInput && (
                  <input
                    type="text"
                    placeholder={selectedCommand.inputPlaceholder}
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => executeCommand(selectedCommand)}
                    disabled={isRunning || (selectedCommand.requiresInput && !commandInput.trim())}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRunning ? "Running..." : "Execute"}
                  </button>
                  <button
                    onClick={() => setSelectedCommand(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            
            {!selectedCommand && (
              <p className="text-gray-500 text-center py-8">
                Select a command from the left to execute
              </p>
            )}
          </div>

          {/* Command Output */}
          {commandOutput && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Output</h3>
                <button
                  onClick={() => copyCommand(commandOutput)}
                  className="text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  📋 Copy
                </button>
              </div>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {commandOutput}
              </pre>
            </div>
          )}

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">History</h3>
                <button
                  onClick={clearHistory}
                  className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {commandHistory.map((item, idx) => (
                  <div key={idx} className="border-b pb-2 text-sm">
                    <div className="flex justify-between items-start">
                      <code className="text-xs bg-gray-100 px-1 rounded">
                        {item.command}
                      </code>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                      {item.output.substring(0, 100)}{item.output.length > 100 ? "..." : ""}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">System Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🏥</div>
            <h3 className="font-medium">Health</h3>
            <button
              onClick={() => executeCommand(commands.find(c => c.id === "health-local")!)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mt-2"
            >
              Check Local
            </button>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-medium">Deployment</h3>
            <button
              onClick={() => executeCommand(commands.find(c => c.id === "fly-status")!)}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mt-2"
            >
              Check Status
            </button>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">💻</div>
            <h3 className="font-medium">Development</h3>
            <button
              onClick={() => executeCommand(commands.find(c => c.id === "start-frontend")!)}
              className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 mt-2"
            >
              Open UI
            </button>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium">Monitoring</h3>
            <button
              onClick={() => executeCommand(commands.find(c => c.id === "check-stats")!)}
              className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mt-2"
              >
              View Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
