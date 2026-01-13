import React from "react";
import ReactDOM from "react-dom";
import { AceyOrchestrator } from "./server/utils/orchestrator";
import { OrchestratorDashboard } from "./ui/OrchestratorDashboard";

// Initialize orchestrator with your LLM endpoint
const orchestrator = new AceyOrchestrator({
  llmEndpoint: "https://your-llm-endpoint.com/generate", // Replace with your actual LLM endpoint
  personaMode: "hype",
  autoApprove: true,
  simulationMode: true, // Start in dry-run mode for safety
  retryAttempts: 3,
  timeout: 30000
});

// Render the dashboard
ReactDOM.render(
  <OrchestratorDashboard orchestrator={orchestrator} />,
  document.getElementById("root")
);
