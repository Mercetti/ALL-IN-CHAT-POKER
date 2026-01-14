const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const logDir = path.join(__dirname, '../../data/logs');
const datasetDir = path.join(__dirname, '../../data/datasets');

// Ensure dataset directory exists
if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
}

// POST /prepare - Prepare dataset from logs
router.post('/prepare', async (req, res) => {
  try {
    const { taskTypes = ['game', 'website', 'graphics', 'audio'], minConfidence = 0.5 } = req.body;
    
    // Get all log files
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(logDir, file), 'utf8'));
        return { file, data };
      });
    
    // Filter logs based on configuration
    const filteredLogs = logFiles.filter(({ data }) => {
      if (!taskTypes.includes(data.taskType)) return false;
      if (data.confidence && data.confidence < minConfidence) return false;
      return true;
    });
    
    // Prepare dataset
    const dataset = filteredLogs.map(({ data }) => ({
      prompt: data.llmPrompt,
      completion: data.llmResponse,
      taskType: data.taskType,
      confidence: data.confidence,
      timestamp: data.timestamp
    }));
    
    // Save dataset
    const filename = `dataset-${Date.now()}.json`;
    const filepath = path.join(datasetDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(dataset, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Dataset prepared successfully',
      filename,
      count: dataset.length
    });
  } catch (error) {
    console.error('Error preparing dataset:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to prepare dataset' 
    });
  }
});

// GET /datasets - List available datasets
router.get('/datasets', (req, res) => {
  try {
    const files = fs.readdirSync(datasetDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
    
    res.json({ 
      success: true, 
      datasets: files.map(file => ({
        name: file,
        path: path.join(datasetDir, file),
        created: fs.statSync(path.join(datasetDir, file)).birthtime
      }))
    });
  } catch (error) {
    console.error('Error listing datasets:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list datasets' 
    });
  }
});

// GET /dataset/:filename - Retrieve a specific dataset
router.get('/dataset/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(datasetDir, filename);
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Dataset not found' 
      });
    }
    
    const dataset = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ 
      success: true, 
      data: dataset 
    });
  } catch (error) {
    console.error('Error retrieving dataset:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve dataset' 
    });
  }
});

module.exports = router;
