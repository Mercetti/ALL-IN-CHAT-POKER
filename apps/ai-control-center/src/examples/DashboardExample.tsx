import React from "react";
import ReactDOM from "react-dom";
import { AudioCodingDashboard } from "../components/AudioCodingDashboard";
import { AceyOrchestrator } from "../utils/orchestrator";

// Example usage of the AudioCodingDashboard
const DashboardExample: React.FC = () => {
  // Initialize the base orchestrator with configuration
  const baseOrchestrator = new AceyOrchestrator({
    llmEndpoint: "https://your-llm-endpoint.com/generate",
    personaMode: "hype",
    autoApprove: true,
    simulationMode: true,
    maxConcurrentTasks: 3,
    timeout: 30000
  });

  return (
    <div style={{ height: '100vh' }}>
      <AudioCodingDashboard orchestrator={baseOrchestrator} />
    </div>
  );
};

// For development/testing
if (process.env.NODE_ENV === 'development') {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(<DashboardExample />, root);
  }
}

export default DashboardExample;
