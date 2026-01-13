const express = require('express');
const { applyAutoRules } = require('../acey-control-center/dist/server/autoRules');

const router = express.Router();

/**
 * Run simulation on provided logs
 */
router.post('/simulate', async (req, res) => {
  try {
    const { logs, config = {} } = req.body;
    
    if (!Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        error: 'Logs must be an array'
      });
    }
    
    const simulationConfig = {
      dryRun: config.dryRun !== false,
      autoRules: config.autoRules !== false,
      playbackSpeed: config.playbackSpeed || 1,
      startTime: config.startTime || Date.now(),
      endTime: config.endTime
    };
    
    // Process logs through simulation
    const simulatedLogs = [];
    let autoRuleApplications = 0;
    let rejections = 0;
    
    for (const log of logs) {
      let processedLog = { ...log };
      
      // Apply auto-rules if enabled
      if (simulationConfig.autoRules && log.aceyOutput) {
        try {
          const ruleResult = applyAutoRules(log.aceyOutput, {
            memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true },
            persona: { lockCheck: true, frequencyLimit: true },
            trust: { deltaThrottle: true, boundsCheck: true },
            moderation: { severityFilter: true, frequencyLimit: true }
          });
          
          // Apply rule results
          if (ruleResult.action === 'reject' || ruleResult.action === 'deny') {
            processedLog.controlDecision = 'rejected';
            processedLog.finalAction = `Auto-rule: ${ruleResult.reason}`;
            rejections++;
          } else if (ruleResult.modifiedIntent) {
            // Replace modified intent
            const intentIndex = processedLog.aceyOutput.intents.findIndex(
              intent => intent.type === ruleResult.modifiedIntent.type
            );
            if (intentIndex >= 0) {
              processedLog.aceyOutput.intents[intentIndex] = ruleResult.modifiedIntent;
            }
            processedLog.controlDecision = 'modified';
            processedLog.finalAction = `Auto-rule modified: ${ruleResult.reason}`;
            autoRuleApplications++;
          } else {
            processedLog.controlDecision = 'approved';
            processedLog.finalAction = 'No auto-rule action';
          }
          
          // Add simulation metadata
          processedLog.simulation = {
            dryRun: simulationConfig.dryRun,
            autoRulesApplied: ruleResult.action !== 'approve',
            ruleReason: ruleResult.reason,
            timestamp: Date.now()
          };
          
        } catch (error) {
          console.warn('Auto-rule application failed:', error);
          processedLog.controlDecision = 'approved';
          processedLog.finalAction = 'Auto-rule error - approved';
        }
      } else {
        processedLog.controlDecision = 'approved';
        processedLog.finalAction = 'Auto-rules disabled';
      }
      
      simulatedLogs.push(processedLog);
    }
    
    // Calculate simulation statistics
    const statistics = {
      totalLogs: logs.length,
      processedLogs: simulatedLogs.length,
      autoRuleApplications,
      rejections,
      approvals: simulatedLogs.filter(log => log.controlDecision === 'approved').length,
      modifications: simulatedLogs.filter(log => log.controlDecision === 'modified').length,
      config: simulationConfig
    };
    
    res.json({
      success: true,
      simulation: {
        logs: simulatedLogs,
        statistics,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Simulation failed'
    });
  }
});

/**
 * Dry-run endpoint for testing without affecting live data
 */
router.post('/dryrun', async (req, res) => {
  try {
    const { aceyOutput, config = {} } = req.body;
    
    if (!aceyOutput || !aceyOutput.speech) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Acey output format'
      });
    }
    
    // Apply auto-rules in dry-run mode
    const ruleResult = applyAutoRules(aceyOutput, {
      memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true },
      persona: { lockCheck: true, frequencyLimit: true },
      trust: { deltaThrottle: true, boundsCheck: true },
      moderation: { severityFilter: true, frequencyLimit: true }
    });
    
    // Determine what would happen in live mode
    let decision = 'approved';
    let action = 'No auto-rule action';
    let modifiedOutput = aceyOutput;
    
    if (ruleResult.action === 'reject' || ruleResult.action === 'deny') {
      decision = 'rejected';
      action = `Would reject: ${ruleResult.reason}`;
    } else if (ruleResult.modifiedIntent) {
      decision = 'modified';
      action = `Would modify: ${ruleResult.reason}`;
      // Apply the modification for preview
      const intentIndex = modifiedOutput.intents.findIndex(
        intent => intent.type === ruleResult.modifiedIntent.type
      );
      if (intentIndex >= 0) {
        modifiedOutput.intents[intentIndex] = ruleResult.modifiedIntent;
      }
    }
    
    res.json({
      success: true,
      dryRun: {
        originalOutput: aceyOutput,
        modifiedOutput,
        decision,
        action,
        ruleResult,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Dry-run error:', error);
    res.status(500).json({
      success: false,
      error: 'Dry-run failed'
    });
  }
});

/**
 * Compare two different outputs
 */
router.post('/compare', async (req, res) => {
  try {
    const { outputA, outputB } = req.body;
    
    if (!outputA || !outputB) {
      return res.status(400).json({
        success: false,
        error: 'Both outputs are required for comparison'
      });
    }
    
    const differences = [];
    
    // Compare speech
    if (outputA.speech !== outputB.speech) {
      differences.push(`Speech changed: "${outputA.speech}" → "${outputB.speech}"`);
    }
    
    // Compare intents
    const aIntents = outputA.intents || [];
    const bIntents = outputB.intents || [];
    const aIntentTypes = aIntents.map(i => i.type);
    const bIntentTypes = bIntents.map(i => i.type);
    
    const removedIntents = aIntentTypes.filter(i => !bIntentTypes.includes(i));
    const addedIntents = bIntentTypes.filter(i => !aIntentTypes.includes(i));
    
    if (removedIntents.length > 0) {
      differences.push(`Removed intents: ${removedIntents.join(', ')}`);
    }
    
    if (addedIntents.length > 0) {
      differences.push(`Added intents: ${addedIntents.join(', ')}`);
    }
    
    // Compare confidence scores
    const aConfidence = aIntents.reduce((sum, intent) => 
      sum + (intent.confidence || 0), 0) / aIntents.length;
    const bConfidence = bIntents.reduce((sum, intent) => 
      sum + (intent.confidence || 0), 0) / bIntents.length;
    
    if (Math.abs(aConfidence - bConfidence) > 0.1) {
      differences.push(`Confidence changed: ${aConfidence.toFixed(2)} → ${bConfidence.toFixed(2)}`);
    }
    
    res.json({
      success: true,
      comparison: {
        timestamp: Date.now(),
        outputA: {
          speech: outputA.speech,
          intents: aIntents,
          confidence: aConfidence
        },
        outputB: {
          speech: outputB.speech,
          intents: bIntents,
          confidence: bConfidence
        },
        differences,
        similarity: differences.length === 0 ? 'identical' : 
                     differences.length <= 2 ? 'similar' : 'different'
      }
    });
    
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Comparison failed'
    });
  }
});

/**
 * Get simulation status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    // This would typically fetch from a database or state management
    // For now, return basic status
    res.json({
      success: true,
      status: {
        available: true,
        features: {
          dryRun: true,
          autoRules: true,
          comparison: true,
          batchSimulation: true
        },
        lastSimulation: null, // Would be populated from state
        statistics: {
          totalSimulations: 0,
          averageProcessingTime: 0,
          autoRuleHitRate: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed'
    });
  }
});

module.exports = router;
