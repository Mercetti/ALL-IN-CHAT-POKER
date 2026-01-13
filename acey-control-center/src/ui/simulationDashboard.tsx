import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { SimulationEvent, ModelComparison, SimulationData } from "../types/simulation";

export function SimulationDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationData>({
    events: [],
    comparison: [],
    isDryRun: true,
    autoRulesEnabled: true,
    currentTime: 0,
    totalEvents: 0
  });
  const [selectedEvent, setSelectedEvent] = useState<SimulationEvent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [eventFilter, setEventFilter] = useState("all");
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState({
    totalEvents: 0,
    eventsByType: {} as Record<string, number>,
    averageConfidence: 0,
    timeSpan: 0,
    autoRuleApplications: 0,
    rejections: 0
  });

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("simulation_update", (data: SimulationData) => {
      setSimulationData(data);
    });

    newSocket.on("simulation_event", (event: SimulationEvent) => {
      setSimulationData((prev: SimulationData) => ({
        ...prev,
        events: [...prev.events, event]
      }));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleDryRunToggle = () => {
    const newState = !simulationData.isDryRun;
    setSimulationData((prev: SimulationData) => ({ ...prev, isDryRun: newState }));
    socket?.emit("simulation_config", { dryRun: newState });
  };

  const handleAutoRulesToggle = () => {
    const newState = !simulationData.autoRulesEnabled;
    setSimulationData((prev: SimulationData) => ({ ...prev, autoRulesEnabled: newState }));
    socket?.emit("simulation_config", { autoRules: newState });
  };

  const handleReset = () => {
    setSimulationData({
      events: [],
      comparison: [],
      isDryRun: true,
      autoRulesEnabled: true,
      currentTime: 0,
      totalEvents: 0
    });
    socket?.emit("simulation_reset");
  };

  const handleExport = () => {
    const exportData = {
      timestamp: Date.now(),
      events: simulationData.events,
      comparison: simulationData.comparison,
      config: {
        dryRun: simulationData.isDryRun,
        autoRules: simulationData.autoRulesEnabled
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    socket?.emit("simulation_playback", { playing: !isPlaying, speed: playbackSpeed });
  };

  const handleStepForward = () => {
    socket?.emit("simulation_step");
  };

  const handleDryRun = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/dryrun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aceyOutput: selectedEvent ? {
            speech: selectedEvent.intent.speech || '',
            intents: [selectedEvent.intent]
          } : {
            speech: 'Test dry-run',
            intents: []
          },
          config: {
            dryRun: true,
            autoRules: simulationData.autoRulesEnabled
          }
        })
      });
      
      const result = await response.json();
      console.log('Dry-run result:', result);
      
      // Update UI with dry-run results
      if (result.success) {
        console.log(`Dry-run decision: ${result.dryRun.decision}`);
        console.log(`Action: ${result.dryRun.action}`);
      }
      
    } catch (error) {
      console.error('Dry-run failed:', error);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "text-gray-500";
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getDifferenceColor = (diff: string) => {
    if (diff.includes("same")) return "text-green-600";
    if (diff.includes("changed")) return "text-yellow-600";
    if (diff.includes("new") || diff.includes("removed")) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Acey Simulation Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation Log */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Simulation Log</h2>
            <div className="h-96 overflow-y-auto border rounded p-2">
              {simulationData.events.map((event: SimulationEvent, index: number) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    selectedEvent === event ? "bg-blue-100" : ""
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="font-medium">{event.eventType}</p>
                      {event.intent.summary && (
                        <p className="text-sm text-gray-700">{event.intent.summary}</p>
                      )}
                      {event.intent.confidence && (
                        <p className={`text-sm ${getConfidenceColor(event.intent.confidence)}`}>
                          Confidence: {(event.intent.confidence * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.originalModel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Comparison Panel */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Model Comparison</h2>
            <div className="h-96 overflow-y-auto border rounded p-2">
              {simulationData.comparison.map((comp: ModelComparison, index: number) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-600">Model A</h4>
                      <p className="text-sm">{comp.modelA.speech}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {(comp.modelA.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-600">Model B</h4>
                      <p className="text-sm">{comp.modelB.speech}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {(comp.modelB.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <h5 className="text-sm font-medium">Differences:</h5>
                    {comp.differences.map((diff: string, i: number) => (
                      <p key={i} className={`text-xs ${getDifferenceColor(diff)}`}>
                        {diff}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Control Panel</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Dry-run Mode:</span>
                <button
                  onClick={handleDryRunToggle}
                  className={`px-4 py-2 rounded ${
                    simulationData.isDryRun
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {simulationData.isDryRun ? "ON" : "OFF"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>Auto-rules:</span>
                <button
                  onClick={handleAutoRulesToggle}
                  className={`px-4 py-2 rounded ${
                    simulationData.autoRulesEnabled
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {simulationData.autoRulesEnabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>Dry-Run Test:</span>
                <button
                  onClick={handleDryRun}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Selected
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>Event Filter:</span>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="px-3 py-1 border rounded"
                >
                  <option value="all">All Events</option>
                  <option value="memory">Memory</option>
                  <option value="persona">Persona</option>
                  <option value="trust">Trust</option>
                  <option value="moderation">Moderation</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span>Playback Speed:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="px-3 py-1 border rounded"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span>Show Statistics:</span>
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className={`px-4 py-2 rounded ${
                    showStatistics
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {showStatistics ? "HIDE" : "SHOW"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Reset Simulation
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Export Results
                </button>
              </div>
            </div>
          </div>

          {/* Replay Controls */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Replay Controls</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isPlaying ? "⏸️ Pause" : "▶️ Play"}
                </button>
                <button
                  onClick={handleStepForward}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  ⏭️ Step
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p>Events: {simulationData.events.length}</p>
                <p>Comparisons: {simulationData.comparison.length}</p>
                <p>Current Time: {new Date(simulationData.currentTime).toLocaleTimeString()}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Quick Jump:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">
                    All-in Moments
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">
                    High Trust
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">
                    Persona Changes
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">
                    Memory Events
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStatistics && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">📊 Simulation Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium text-blue-800">Events</h3>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalEvents}</p>
                <p className="text-sm text-blue-600">Total processed</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-medium text-green-800">Avg Confidence</h3>
                <p className="text-2xl font-bold text-green-600">
                  {(statistics.averageConfidence * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">Across all events</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-medium text-purple-800">Time Span</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(statistics.timeSpan / 1000)}s
                </p>
                <p className="text-sm text-purple-600">Simulation duration</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-medium text-yellow-800">Auto-Rule Applications</h3>
                <p className="text-2xl font-bold text-yellow-600">{statistics.autoRuleApplications}</p>
                <p className="text-sm text-yellow-600">Rules applied</p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <h3 className="font-medium text-red-800">Rejections</h3>
                <p className="text-2xl font-bold text-red-600">{statistics.rejections}</p>
                <p className="text-sm text-red-600">Events rejected</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Events by Type</h3>
              <div className="space-y-2">
                {Object.entries(statistics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(count / statistics.totalEvents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Original Event</h3>
                <p><strong>Time:</strong> {new Date(selectedEvent.timestamp).toLocaleString()}</p>
                <p><strong>Type:</strong> {selectedEvent.eventType}</p>
                <p><strong>Model:</strong> {selectedEvent.originalModel}</p>
                {selectedEvent.intent.speech && (
                  <p><strong>Speech:</strong> {selectedEvent.intent.speech}</p>
                )}
              </div>
              <div>
                <h3 className="font-medium">Intent Analysis</h3>
                <p><strong>Type:</strong> {selectedEvent.intent.type}</p>
                {selectedEvent.intent.summary && (
                  <p><strong>Summary:</strong> {selectedEvent.intent.summary}</p>
                )}
                {selectedEvent.intent.confidence && (
                  <p><strong>Confidence:</strong> {(selectedEvent.intent.confidence * 100).toFixed(1)}%</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
