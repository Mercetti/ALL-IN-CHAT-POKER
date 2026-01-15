let applyAutoRules;
try {
  applyAutoRules = require('../acey-control-center/dist/server/autoRules').applyAutoRules;
} catch (error) {
  console.warn('AI Control Center auto-rules not available, using fallback');
  applyAutoRules = (output, options) => output; // Fallback: return output as-is
}

/**
 * Filter Acey logs based on auto-rules
 * @param log - Acey interaction log
 * @returns boolean - true if log should be kept, false if rejected
 */
function filterAceyLogs(log) {
  try {
    // Check if log has aceyOutput to process
    if (!log.aceyOutput) {
      console.warn('Log missing aceyOutput, allowing by default');
      return true;
    }
    
    // Apply auto-rules
    const ruleResult = applyAutoRules(log.aceyOutput, {
      memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true },
      persona: { lockCheck: true, frequencyLimit: true },
      trust: { deltaThrottle: true, boundsCheck: true },
      moderation: { severityFilter: true, frequencyLimit: true }
    });
    
    // Log the rule application
    console.log(`[AUTO-RULE] ${log.taskType} - ${ruleResult.action}: ${ruleResult.reason || 'No reason'}`);
    
    // Return false for rejected/denied logs, true for approved/modified
    return ruleResult.action !== 'reject' && ruleResult.action !== 'deny';
    
  } catch (error) {
    console.error('Auto-rule filtering failed:', error);
    // Default to allowing the log if filtering fails
    return true;
  }
}

/**
 * Apply auto-rules to Acey output and return modified version
 * @param aceyOutput - Original Acey output
 * @param config - Auto-rule configuration
 * @returns Modified Acey output or null if rejected
 */
function applyAutoRulesToOutput(aceyOutput, config = {}) {
  try {
    const ruleConfig = {
      memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true, ...config.memory },
      persona: { lockCheck: true, frequencyLimit: true, ...config.persona },
      trust: { deltaThrottle: true, boundsCheck: true, ...config.trust },
      moderation: { severityFilter: true, frequencyLimit: true, ...config.moderation }
    };
    
    const ruleResult = applyAutoRules(aceyOutput, ruleConfig);
    
    // Handle different rule actions
    switch (ruleResult.action) {
      case 'reject':
      case 'deny':
        return null; // Rejected output
        
      case 'modify':
        return ruleResult.modifiedIntent ? 
          { ...aceyOutput, intents: [ruleResult.modifiedIntent] } : 
          aceyOutput;
          
      case 'approve':
      default:
        return aceyOutput; // Approved output
    }
    
  } catch (error) {
    console.error('Auto-rule application failed:', error);
    return aceyOutput; // Return original if application fails
  }
}

/**
 * Batch filter logs for simulation or processing
 * @param logs - Array of Acey logs
 * @param config - Auto-rule configuration
 * @returns Filtered logs array
 */
function batchFilterLogs(logs, config = {}) {
  return logs.filter(log => {
    if (!log.aceyOutput) return true; // Keep logs without output
    
    try {
      const ruleResult = applyAutoRules(log.aceyOutput, {
        memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true, ...config.memory },
        persona: { lockCheck: true, frequencyLimit: true, ...config.persona },
        trust: { deltaThrottle: true, boundsCheck: true, ...config.trust },
        moderation: { severityFilter: true, frequencyLimit: true, ...config.moderation }
      });
      
      // Add rule results to log metadata
      log.autoRuleResult = ruleResult;
      log.autoRuleApplied = ruleResult.action !== 'approve';
      
      // Keep approved and modified logs, reject others
      return ruleResult.action !== 'reject' && ruleResult.action !== 'deny';
      
    } catch (error) {
      console.error('Batch filtering failed for log:', log.timestamp, error);
      return true; // Keep log if filtering fails
    }
  });
}

/**
 * Get auto-rule statistics for a batch of logs
 * @param logs - Array of processed logs
 * @returns Statistics object
 */
function getAutoRuleStats(logs) {
  const stats = {
    total: logs.length,
    approved: 0,
    modified: 0,
    rejected: 0,
    autoRuleApplications: 0,
    ruleBreakdown: {
      memory: { applied: 0, rejected: 0 },
      persona: { applied: 0, rejected: 0 },
      trust: { applied: 0, rejected: 0 },
      moderation: { applied: 0, rejected: 0 }
    }
  };
  
  logs.forEach(log => {
    if (log.autoRuleResult) {
      const action = log.autoRuleResult.action;
      
      if (action === 'approve') {
        stats.approved++;
      } else if (action === 'modify') {
        stats.modified++;
        stats.autoRuleApplications++;
      } else if (action === 'reject' || action === 'deny') {
        stats.rejected++;
        stats.autoRuleApplications++;
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
function getIntentCategory(intentType) {
  if (intentType.includes('memory')) return 'memory';
  if (intentType.includes('persona')) return 'persona';
  if (intentType.includes('trust')) return 'trust';
  if (intentType.includes('moderation') || intentType.includes('ban')) return 'moderation';
  return 'other';
}

module.exports = {
  filterAceyLogs,
  applyAutoRulesToOutput,
  batchFilterLogs,
  getAutoRuleStats
};
