const express = require('express');
const fs = require('fs');
const path = require('path');

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
    
    // Store log data
    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Log stored successfully',
      filename 
    });
  } catch (error) {
    console.error('Error storing log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to store log' 
    });
  }
});

// GET /logs - List available log files
router.get('/logs', (req, res) => {
  try {
    const files = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // Sort by newest first
    
    res.json({ 
      success: true, 
      files: files.map(file => ({
        name: file,
        path: path.join(logDir, file),
        created: fs.statSync(path.join(logDir, file)).birthtime
      }))
    });
  } catch (error) {
    console.error('Error listing logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list logs' 
    });
  }
});

// GET /log/:filename - Retrieve a specific log file
router.get('/log/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(logDir, filename);
    
    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Log file not found' 
      });
    }
    
    const logData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ 
      success: true, 
      data: logData 
    });
  } catch (error) {
    console.error('Error retrieving log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve log' 
    });
  }
});

// DELETE /log/:filename - Delete a specific log file
router.delete('/log/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(logDir, filename);
    
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
        error: 'Log file not found' 
      });
    }
    
    fs.unlinkSync(filepath);
    res.json({ 
      success: true, 
      message: 'Log file deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete log' 
    });
  }
});

module.exports = router;
