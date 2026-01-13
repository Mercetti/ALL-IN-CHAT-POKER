const express = require('express');
const fs = require('fs');
const path = require('path');
const { AceyInteractionLog, DatasetPrepConfig } = require('../utils/schema');

const router = express.Router();
const logDir = path.join(__dirname, '../../data/logs');
const datasetDir = path.join(__dirname, '../../data/datasets');

// Ensure dataset directory exists
if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
}

/**
 * Prepare datasets for fine-tuning from logged interactions
 */
function prepareDataset(logs, config = {}) {
  const {
    taskTypes = ['game', 'website', 'graphics', 'audio', 'moderation', 'memory', 'trust', 'persona'],
    minConfidence = 0.5,
    excludeRejected = true,
    dateRange = null
  } = config;

  // Filter logs based on configuration
  const filteredLogs = logs.filter(log => {
    // Filter by task type
    if (!taskTypes.includes(log.taskType)) return false;
    
    // Filter by confidence if available
    if (log.aceyOutput?.intents) {
      const avgConfidence = log.aceyOutput.intents.reduce((sum, intent) => 
        sum + (intent.confidence || 0), 0) / log.aceyOutput.intents.length;
      if (avgConfidence < minConfidence) return false;
    }
    
    // Exclude rejected logs if configured
    if (excludeRejected && log.controlDecision === 'rejected') return false;
    
    // Filter by date range if specified
    if (dateRange) {
      const logDate = new Date(log.timestamp);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (logDate < startDate || logDate > endDate) return false;
    }
    
    return true;
  });

  // Group by task type for separate datasets
  const datasets = {};
  
  taskTypes.forEach(taskType => {
    const taskLogs = filteredLogs.filter(log => log.taskType === taskType);
    
    if (taskLogs.length === 0) return;
    
    // Convert to fine-tuning format
    const trainingData = taskLogs.map(log => {
      // Create training example based on task type
      let trainingExample = createTrainingExample(log, taskType);
      return trainingExample;
    }).filter(example => example !== null); // Remove invalid examples
    
    if (trainingData.length > 0) {
      datasets[taskType] = trainingData;
    }
  });

  return datasets;
}

/**
 * Create training example for different task types
 */
function createTrainingExample(log, taskType) {
  const { llmPrompt, aceyOutput, context } = log;
  
  switch (taskType) {
    case 'game':
    case 'website':
    case 'graphics':
    case 'audio':
      // Instruction-following format
      return {
        instruction: createInstruction(log, taskType),
        input: createInput(log, taskType),
        output: aceyOutput.speech || '',
        metadata: {
          taskType,
          confidence: calculateAverageConfidence(aceyOutput.intents),
          intents: aceyOutput.intents,
          context: context
        }
      };
      
    case 'moderation':
      // Classification format
      return {
        text: llmPrompt,
        label: log.controlDecision === 'approved' ? 'safe' : 'unsafe',
        confidence: calculateAverageConfidence(aceyOutput.intents),
        reasoning: aceyOutput.speech || '',
        metadata: {
          taskType,
          intents: aceyOutput.intents
        }
      };
      
    case 'memory':
    case 'trust':
    case 'persona':
      // Structured output format
      return {
        prompt: llmPrompt,
        completion: JSON.stringify({
          speech: aceyOutput.speech || '',
          intents: aceyOutput.intents || [],
          reasoning: `Generated for ${taskType} task`
        }),
        metadata: {
          taskType,
          controlDecision: log.controlDecision,
          context: context
        }
      };
      
    default:
      return null;
  }
}

/**
 * Create instruction for different task types
 */
function createInstruction(log, taskType) {
  const baseInstructions = {
    game: "Generate engaging poker game commentary based on the current game state and chat messages.",
    website: "Provide helpful responses for website management and user support inquiries.",
    graphics: "Create descriptions and specifications for poker-themed graphics and visual elements.",
    audio: "Generate scripts and descriptions for poker game audio elements and sound effects.",
    moderation: "Evaluate chat messages for appropriate content and community guidelines compliance.",
    memory: "Create memory proposals for significant poker game events and interactions.",
    trust: "Calculate trust score adjustments based on user behavior and engagement.",
    persona: "Determine appropriate persona mode responses based on game context and user interactions."
  };
  
  return baseInstructions[taskType] || "Generate appropriate response for the given context.";
}

/**
 * Create input for different task types
 */
function createInput(log, taskType) {
  const { context, llmPrompt } = log;
  
  switch (taskType) {
    case 'game':
      return JSON.stringify({
        gameState: context.gameState || {},
        recentMessages: context.previousMessages || [],
        currentAction: llmPrompt
      });
      
    case 'website':
      return JSON.stringify({
        userQuery: llmPrompt,
        context: context
      });
      
    default:
      return llmPrompt;
  }
}

/**
 * Calculate average confidence from intents
 */
function calculateAverageConfidence(intents) {
  if (!intents || intents.length === 0) return 0.5;
  
  const total = intents.reduce((sum, intent) => sum + (intent.confidence || 0.5), 0);
  return total / intents.length;
}

/**
 * Save dataset as JSONL file
 */
function saveDatasetAsJSONL(dataset, filename) {
  const jsonlLines = dataset.map(item => JSON.stringify(item)).join('\n');
  const filepath = path.join(datasetDir, filename);
  
  fs.writeFileSync(filepath, jsonlLines);
  return filepath;
}

// POST /dataset/prepare - Prepare datasets from logs
router.post('/prepare', async (req, res) => {
  try {
    const config = req.body || {};
    
    // Load all logs
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'));
    
    const allLogs = [];
    
    for (const file of logFiles) {
      try {
        const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
        const log = JSON.parse(content);
        allLogs.push(log);
      } catch (error) {
        console.warn(`Failed to read log file ${file}:`, error.message);
      }
    }
    
    // Prepare datasets
    const datasets = prepareDataset(allLogs, config);
    
    // Save datasets as JSONL files
    const savedFiles = {};
    
    for (const [taskType, data] of Object.entries(datasets)) {
      const filename = `${taskType}-dataset-${Date.now()}.jsonl`;
      const filepath = saveDatasetAsJSONL(data, filename);
      savedFiles[taskType] = {
        filename,
        count: data.length,
        path: filepath
      };
    }
    
    res.json({
      success: true,
      totalLogs: allLogs.length,
      filteredLogs: allLogs.length,
      datasets: savedFiles,
      summary: {
        totalDatasets: Object.keys(datasets).length,
        totalExamples: Object.values(datasets).reduce((sum, data) => sum + data.length, 0)
      }
    });
    
  } catch (error) {
    console.error('Dataset preparation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to prepare datasets'
    });
  }
});

// GET /dataset/list - List available datasets
router.get('/list', async (req, res) => {
  try {
    const files = fs.readdirSync(datasetDir)
      .filter(file => file.endsWith('.jsonl'))
      .sort();
    
    const datasets = files.map(file => {
      const filepath = path.join(datasetDir, file);
      const stats = fs.statSync(filepath);
      
      // Count lines in JSONL file
      const content = fs.readFileSync(filepath, 'utf-8');
      const lineCount = content.split('\n').filter(line => line.trim()).length;
      
      return {
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        examples: lineCount,
        taskType: file.split('-')[0]
      };
    });
    
    res.json({
      success: true,
      datasets
    });
    
  } catch (error) {
    console.error('Dataset listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list datasets'
    });
  }
});

// GET /dataset/:filename - Download specific dataset
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(datasetDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found'
      });
    }
    
    // Set appropriate headers for JSONL download
    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const content = fs.readFileSync(filepath, 'utf-8');
    res.send(content);
    
  } catch (error) {
    console.error('Dataset download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download dataset'
    });
  }
});

// DELETE /dataset/:filename - Delete specific dataset
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(datasetDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found'
      });
    }
    
    fs.unlinkSync(filepath);
    
    res.json({
      success: true,
      deleted: filename
    });
    
  } catch (error) {
    console.error('Dataset deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete dataset'
    });
  }
});

module.exports = router;
