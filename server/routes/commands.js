const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const commandsDir = path.join(__dirname, '../../data/commands');

// Ensure commands directory exists
if (!fs.existsSync(commandsDir)) {
  fs.mkdirSync(commandsDir, { recursive: true });
}

// POST /register - Register a new command
router.post('/register', async (req, res) => {
  try {
    const { name, description, handler, category = 'general' } = req.body;
    
    if (!name || !description || !handler) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, description, and handler are required' 
      });
    }
    
    // Create command
    const command = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      handler,
      category,
      enabled: true,
      createdAt: Date.now(),
      usageCount: 0,
      lastUsed: null
    };
    
    // Save command
    const filename = `${command.id}.json`;
    const filepath = path.join(commandsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(command, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Command registered successfully',
      command
    });
  } catch (error) {
    console.error('Error registering command:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register command' 
    });
  }
});

// GET /commands - List available commands
router.get('/commands', (req, res) => {
  try {
    const files = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
    
    const commands = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(commandsDir, file), 'utf8'));
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        enabled: data.enabled,
        createdAt: data.createdAt,
        usageCount: data.usageCount,
        lastUsed: data.lastUsed
      };
    });
    
    res.json({ 
      success: true, 
      commands 
    });
  } catch (error) {
    console.error('Error listing commands:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list commands' 
    });
  }
});

// GET /command/:id - Get command details
router.get('/command/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filename = `${id}.json`;
    const filepath = path.join(commandsDir, filename);
    
    // Security check
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid command ID' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Command not found' 
      });
    }
    
    const command = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ 
      success: true, 
      data: command 
    });
  } catch (error) {
    console.error('Error retrieving command:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve command' 
    });
  }
});

// POST /command/:id/execute - Execute a command
router.post('/command/:id/execute', async (req, res) => {
  try {
    const id = req.params.id;
    const filename = `${id}.json`;
    const filepath = path.join(commandsDir, filename);
    
    // Security check
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid command ID' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Command not found' 
      });
    }
    
    const command = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    if (!command.enabled) {
      return res.status(400).json({ 
        success: false, 
        error: 'Command is disabled' 
      });
    }
    
    // Update usage stats
    command.usageCount++;
    command.lastUsed = Date.now();
    
    // Save updated command
    fs.writeFileSync(filepath, JSON.stringify(command, null, 2));
    
    // Simulate execution (in real implementation, this would run actual command)
    const execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      commandId: id,
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      input: req.body.input || {},
      output: `Command "${command.name}" executed successfully`,
      context: req.body.context || {}
    };
    
    res.json({ 
      success: true, 
      message: 'Command executed successfully',
      execution
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to execute command' 
    });
  }
});

// PUT /command/:id/toggle - Enable/disable a command
router.put('/command/:id/toggle', async (req, res) => {
  try {
    const id = req.params.id;
    const filename = `${id}.json`;
    const filepath = path.join(commandsDir, filename);
    
    // Security check
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid command ID' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Command not found' 
      });
    }
    
    const command = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    command.enabled = !command.enabled;
    
    // Save updated command
    fs.writeFileSync(filepath, JSON.stringify(command, null, 2));
    
    res.json({ 
      success: true, 
      message: `Command ${command.enabled ? 'enabled' : 'disabled'}`,
      enabled: command.enabled
    });
  } catch (error) {
    console.error('Error toggling command:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to toggle command' 
    });
  }
});

module.exports = router;
