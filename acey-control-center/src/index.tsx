import React from "react";
import ReactDOM from "react-dom";
import { HelmOrchestrator } from "./server/utils/orchestrator";
import { HelmDashboard } from "./ui/HelmDashboard";

// Initialize Helm orchestrator with local small LLMs
const helmOrchestrator = new HelmOrchestrator({
  helmEndpoint: "http://localhost:3001", // Helm server endpoint
  autoApprove: true,
  simulationMode: true, // Start in dry-run mode for safety
  retryAttempts: 3,
  timeout: 30000,
  smallLLMs: true, // Use small LLMs
  models: ["tinyllama", "phi", "qwen:0.5b", "deepseek-coder:1.3b"]
});

// Render the Helm dashboard
ReactDOM.render(
  <HelmDashboard orchestrator={helmOrchestrator} />,
  document.getElementById("root")
);
