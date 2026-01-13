import React from "react";
import ReactDOM from "react-dom";
import { AceyControlCenter } from "../components/AceyControlCenter";
import { AceyOrchestrator } from "../utils/orchestrator";

// Example usage of the Acey Control Center
const AceyControlCenterExample: React.FC = () => {
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
      <AceyControlCenter orchestrator={baseOrchestrator} />
    </div>
  );
};

// For development/testing
if (process.env.NODE_ENV === 'development') {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(<AceyControlCenterExample />, root);
  }
}

export default AceyControlCenterExample;
