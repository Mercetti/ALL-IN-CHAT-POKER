const express = require('express');
const fs = require('fs');
const path = require('path');
const { AceyInteractionLog } = require('../utils/schema');

const router = express.Router();
const logDir = path.join(__dirname, '../../data/logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// POST /log - Receive and store Acey interaction logs
router.post('/log', async (req, res) => {
  try {
    const logData = req.body;
    
    // Validate log structure
    if (!logData.taskType || !logData.timestamp || !logData.llmPrompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required log fields' 
      });
    }

    // Generate filename
    const filename = `acey-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    const filepath = path.join(logDir, filename);
    
    // Save log file
    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
    
    // Send to AI Control Center if available
    try {
      const axios = require('axios');
      await axios.post('http://localhost:3001/log', logData);
    } catch (error) {
      console.warn('Failed to forward log to AI Control Center:', error.message);
    }
    
    res.json({ 
      success: true, 
      filename,
      timestamp: logData.timestamp 
    });
    
  } catch (error) {
    console.error('Log storage error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to store log' 
    });
  }
});

// GET /logs - Retrieve recent logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const taskType = req.query.taskType;
    
    // Get log files
    const files = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .slice(-limit);
    
    const logs = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
        const log = JSON.parse(content);
        
        // Filter by task type if specified
        if (!taskType || log.taskType === taskType) {
          logs.push({
            ...log,
            filename: file
          });
        }
      } catch (error) {
        console.warn(`Failed to read log file ${file}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      logs: logs.reverse(), // Most recent first
      total: logs.length
    });
    
  } catch (error) {
    console.error('Log retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve logs' 
    });
  }
});

// GET /logs/stats - Get logging statistics
router.get('/logs/stats', async (req, res) => {
  try {
    const files = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'));
    
    const stats = {
      totalLogs: files.length,
      taskTypes: {},
      recentActivity: [],
      averageResponseTime: 0,
      totalCost: 0
    };
    
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    for (const file of files.slice(-100)) { // Last 100 files for stats
      try {
        const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
        const log = JSON.parse(content);
        
        // Count task types
        stats.taskTypes[log.taskType] = (stats.taskTypes[log.taskType] || 0) + 1;
        
        // Calculate response time
        if (log.performance && log.performance.responseTime) {
          totalResponseTime += log.performance.responseTime;
          responseTimeCount++;
        }
        
        // Calculate cost
        if (log.performance && log.performance.cost) {
          stats.totalCost += log.performance.cost;
        }
        
        // Recent activity (last 10)
        if (stats.recentActivity.length < 10) {
          stats.recentActivity.push({
            timestamp: log.timestamp,
            taskType: log.taskType,
            controlDecision: log.controlDecision,
            responseTime: log.performance?.responseTime
          });
        }
        
      } catch (error) {
        console.warn(`Failed to read log file ${file} for stats:`, error.message);
      }
    }
    
    stats.averageResponseTime = responseTimeCount > 0 ? 
      Math.round(totalResponseTime / responseTimeCount) : 0;
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve stats' 
    });
  }
});

// PUT /logs/:filename/decision - Update log decision
router.put('/logs/:filename/decision', async (req, res) => {
  try {
    const { filename } = req.params;
    const { decision, finalAction } = req.body;
    
    const filepath = path.join(logDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Log file not found' 
      });
    }
    
    const log = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    log.controlDecision = decision;
    if (finalAction) {
      log.finalAction = finalAction;
    }
    
    fs.writeFileSync(filepath, JSON.stringify(log, null, 2));
    
    res.json({
      success: true,
      updated: {
        filename,
        decision,
        finalAction
      }
    });
    
  } catch (error) {
    console.error('Log update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update log' 
    });
  }
});

module.exports = router;
