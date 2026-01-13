import React, { useState } from "react";
import { SimulationDashboard } from "./simulationDashboard";
import { CommandCenter } from "./CommandCenter";

export const DashboardWithCommands: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"simulation" | "commands">("simulation");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("simulation")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "simulation"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🎮 Simulation Dashboard
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "commands"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🎮 Command Center
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "simulation" && <SimulationDashboard />}
        {activeTab === "commands" && <CommandCenter />}
      </div>
    </div>
  );
};
