import axios from "axios";
import { AceyInteractionLog } from "./schema";

/**
 * Simple logger for the orchestrator
 */
export async function saveLog(log: AceyInteractionLog): Promise<void> {
  try {
    // Send to main server logging endpoint
    await axios.post("http://localhost:8080/api/log", log);
    console.log(`[LOG] ${log.taskType} - ${log.controlDecision}`);
  } catch (error) {
    console.error("Failed to save log:", error);
    // Continue execution even if logging fails
  }
}
