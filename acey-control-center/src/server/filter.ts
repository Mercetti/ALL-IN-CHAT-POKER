import { AceyInteractionLog } from "./utils/schema";

/**
 * Filter Acey logs based on auto-rules
 */
export function filterAceyLogs(log: AceyInteractionLog): boolean {
  try {
    // Check if log has aceyOutput to process
    if (!log.aceyOutput) {
      console.warn('Log missing aceyOutput, allowing by default');
      return true;
    }
    
    // Simple filtering logic - in production this would use the full auto-rules system
    const intents = log.aceyOutput.intents || [];
    
    // Check for low confidence intents
    const lowConfidenceIntents = intents.filter(intent => 
      intent.confidence && intent.confidence < 0.4
    );
    
    if (lowConfidenceIntents.length > 0) {
      console.log(`[FILTER] Rejected due to low confidence: ${lowConfidenceIntents.length} intents`);
      return false;
    }
    
    // Check for moderation issues
    const moderationIntents = intents.filter(intent => 
      intent.type === 'moderation' || intent.type === 'shadow_ban_suggestion'
    );
    
    if (moderationIntents.length > 0) {
      const highSeverity = moderationIntents.some(intent => 
        intent.severity === 'high' || intent.severity === 'critical'
      );
      
      if (highSeverity) {
        console.log(`[FILTER] Rejected due to high severity moderation intent`);
        return false;
      }
    }
    
    // Log the filtering decision
    console.log(`[FILTER] ${log.taskType} - approved`);
    return true;
    
  } catch (error) {
    console.error('Auto-rule filtering failed:', error);
    // Default to allowing the log if filtering fails
    return true;
  }
}
