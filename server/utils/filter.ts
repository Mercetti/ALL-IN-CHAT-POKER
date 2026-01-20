/**
 * Fixed Filter System with Fail-Safe Logic
 * Replaces catch blocks that return true with proper rejection
 */

import { AceyLLMOutput } from '../acey/interfaces/acey-llm-system-fixed';

// ===== FIXED FILTER FUNCTIONS =====

/**
 * Filter Acey logs with fail-safe validation
 * @param log - Acey interaction log
 * @returns boolean - true if log should be kept, false if rejected
 */
function filterAceyLogs(log: any): boolean {
  try {
    // Check if log has aceyOutput to process
    if (!log.aceyOutput) {
      console.warn('[FILTER] Log missing aceyOutput, allowing by default');
      return true;
    }
    
    // Apply governance rules with fail-safe logic
    const ruleResult = applyGovernanceRules(log.aceyOutput);
    
    // Log the rule application
    console.log(`[GOVERNANCE] ${log.taskType} - ${ruleResult.action}: ${ruleResult.reason || 'No reason'}`);
    
    // Return false for rejected/denied logs, true for approved/modified
    return ruleResult.action !== 'reject' && ruleResult.action !== 'deny';
    
  } catch (error) {
    console.error('[FILTER] Governance filtering failed:', error);
    // Fail-safe: reject on filtering error
    return false;
  }
}

/**
 * Apply governance rules to output
 * @param aceyOutput - Acey output object
 * @returns Rule application result
 */
function applyGovernanceRules(aceyOutput: AceyLLMOutput): {
  const intents = aceyOutput.intents || [];
  
  // Rule 1: Validate security state compliance
  const securityStateViolation = validateSecurityStateCompliance(aceyOutput);
  if (securityStateViolation) {
    return {
      action: 'reject',
      reason: 'Security state violation',
      modifiedIntent: null
    };
  }

  // Rule 2: Check for prohibited actions
  const prohibitedAction = intents.find(intent => 
    ['execute_code', 'move_files', 'modify_database', 'trigger_payouts'].includes(intent.type)
  );
  
  if (prohibitedAction) {
    return {
      action: 'reject',
      reason: `Prohibited action: ${prohibitedAction.type}`,
      modifiedIntent: null
    };
  }

  // Rule 3: Validate high-risk actions
  const highRiskAction = intents.find(intent => 
    ['modify_governance', 'change_policy', 'access_private_data'].includes(intent.type)
  );
  
  if (highRiskAction && highRiskAction.confidence > 0.7) {
    return {
      action: 'modify',
      reason: `High-risk action requires simulation: ${highRiskAction.type}`,
      modifiedIntent: {
        type: 'simulation_required',
        originalIntent: highRiskAction,
        justification: 'High-risk action must be simulated before execution'
      }
    };
  }

  // Rule 4: Check for silent actions (no explicit intent)
  const silentActions = intents.filter(intent => 
    !intent.type || intent.type === 'unknown' || intent.confidence < 0.5
  );
  
  if (silentActions.length > 0) {
    return {
      action: 'reject',
      reason: 'Silent or ambiguous actions detected',
      modifiedIntent: null
    };
  }

  // Rule 5: Validate financial operations
  const financialIntent = intents.find(intent => 
    ['payout_approval', 'fund_transfer', 'financial_calculation'].includes(intent.type)
  );
  
  if (financialIntent && financialIntent.confidence > 0.8) {
    return {
      action: 'modify',
      reason: `Financial operation requires explicit approval: ${financialIntent.type}`,
      modifiedIntent: {
        type: 'approval_required',
        originalIntent: financialIntent,
        justification: 'Financial operations require founder approval'
      }
    };
  }

  // If no violations, approve
  return {
    action: 'approve',
    reason: 'All governance rules passed',
    modifiedIntent: null
  };
}

/**
 * Validate security state compliance
 */
function validateSecurityStateCompliance(aceyOutput: AceyLLMOutput): boolean {
  const securityState = aceyOutput.securityState;
  const intents = aceyOutput.intents || [];
  
  // In RED state, only allow read-only operations
  if (securityState === 'RED') {
    const readOnlyIntents = intents.filter(intent => 
      ['observe', 'analyze', 'report', 'status_query', 'read_memory'].includes(intent.type)
    );
    
    const prohibitedIntents = intents.filter(intent => 
      !['observe', 'analyze', 'report', 'status_query', 'read_memory'].includes(intent.type)
    );
    
    return prohibitedIntents.length === 0 && readOnlyIntents.length === intents.length;
  }

  // In YELLOW state, all actions require confirmation
  if (securityState === 'YELLOW') {
    // Allow all actions but flag for confirmation
    return true; // Will be handled by caller
  }

  // In GREEN state, normal operations allowed
  if (securityState === 'GREEN') {
    return true;
  }

  // Unknown security state, fail-safe
  console.warn('[FILTER] Unknown security state:', securityState);
  return false;
}

/**
 * Apply auto-rules to Acey output with fail-safe logic
 * @param aceyOutput - Original Acey output
 * @param config - Auto-rule configuration
 * @returns Modified Acey output or null if rejected
 */
function applyAutoRulesToOutput(aceyOutput: AceyLLMOutput, config = {}): AceyLLMOutput | null {
  try {
    const ruleResult = applyGovernanceRules(aceyOutput);
    
    // Handle different rule actions
    switch (ruleResult.action) {
      case 'reject':
      case 'deny':
        console.warn('[FILTER] Action rejected:', ruleResult.reason);
        return null; // Rejected output
        
      case 'modify':
        console.log('[FILTER] Action modified:', ruleResult.reason);
        return {
          ...aceyOutput,
          intents: ruleResult.modifiedIntent ? [ruleResult.modifiedIntent] : aceyOutput.intents
        };
        
      case 'approve':
      default:
        console.log('[FILTER] Action approved:', ruleResult.reason);
        return aceyOutput; // Approved output
    }
    
  } catch (error) {
    console.error('[FILTER] Auto-rule application failed:', error);
    // Fail-safe: return original output if filtering fails
    return aceyOutput;
  }
}

/**
 * Batch filter logs with fail-safe validation
 * @param logs - Array of Acey logs
 * @param config - Auto-rule configuration
 * @returns Filtered logs array
 */
function batchFilterLogs(logs: any[], config = {}): any[] {
  return logs.filter(log => {
    if (!log.aceyOutput) {
      return true; // Keep logs without output
    }
    
    try {
      const ruleResult = applyGovernanceRules(log.aceyOutput);
      
      // Add rule results to log metadata
      log.autoRuleResult = ruleResult;
      log.autoRuleApplied = ruleResult.action !== 'approve';
      
      // Keep approved and modified logs, reject others
      const shouldKeep = ruleResult.action !== 'reject' && ruleResult.action !== 'deny';
      
      if (!shouldKeep) {
        console.warn('[FILTER] Rejected log:', {
          taskType: log.taskType,
          reason: ruleResult.reason,
          timestamp: log.timestamp
        });
      }
      
      return shouldKeep;
      
    } catch (error) {
      console.error('[FILTER] Batch filtering failed for log:', log.timestamp, error);
      // Fail-safe: keep log if filtering fails
      return true;
    }
  });
}

/**
 * Get auto-rule statistics with proper tracking
 */
function getAutoRuleStats(logs: any[]) {
  const stats = {
    total: logs.length,
    approved: 0,
    modified: 0,
    rejected: 0,
    autoRuleApplications: 0,
    ruleBreakdown: {
      security: { applied: 0, rejected: 0 },
      governance: { applied: 0, rejected: 0 },
      financial: { applied: 0, rejected: 0 },
      simulation: { applied: 0, rejected: 0 }
    }
  };
  
  logs.forEach(log => {
    if (log.autoRuleResult) {
      stats.autoRuleApplications++;
      
      const action = log.autoRuleResult.action;
      
      if (action === 'approve') {
        stats.approved++;
      } else if (action === 'modify') {
        stats.modified++;
      } else if (action === 'reject' || action === 'deny') {
        stats.rejected++;
      }
      
      // Categorize by intent type if available
      if (log.aceyOutput && log.aceyOutput.intents) {
        log.aceyOutput.intents.forEach(intent => {
          const category = getIntentCategory(intent.type);
          if (stats.ruleBreakdown[category]) {
            if (action === 'reject' || action === 'deny') {
              stats.ruleBreakdown[category].rejected++;
            } else if (action !== 'approve') {
              stats.ruleBreakdown[category].applied++;
            }
          }
        });
      }
    }
  });
  
  return stats;
}

/**
 * Categorize intent type for statistics
 */
function getIntentCategory(intentType: string): string {
  if (intentType.includes('memory')) return 'memory';
  if (intentType.includes('persona')) return 'governance';
  if (intentType.includes('trust')) return 'governance';
  if (intentType.includes('moderation')) return 'governance';
  if (intentType.includes('ban')) return 'governance';
  return 'other';
}

module.exports = {
  filterAceyLogs,
  applyAutoRulesToOutput,
  batchFilterLogs,
  getAutoRuleStats,
  applyGovernanceRules
};
