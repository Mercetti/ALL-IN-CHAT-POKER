const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const simulationDir = path.join(__dirname, '../../data/simulations');

// Ensure simulation directory exists
if (!fs.existsSync(simulationDir)) {
  fs.mkdirSync(simulationDir, { recursive: true });
}

// POST /run - Run a simulation
router.post('/run', async (req, res) => {
  try {
    const { type, config = {} } = req.body;
    
    // Generate simulation ID
    const simulationId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create simulation result
    const result = {
      id: simulationId,
      type: type || 'default',
      config: config,
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      results: null
    };
    
    // Save simulation
    const filename = `${simulationId}.json`;
    const filepath = path.join(simulationDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    
    // Simulate running (in real implementation, this would run actual simulation)
    setTimeout(() => {
      try {
        const updatedResult = {
          ...result,
          status: 'completed',
          endTime: Date.now(),
          results: {
            success: true,
            metrics: {
              accuracy: Math.random() * 0.3 + 0.7,
              responseTime: Math.random() * 1000 + 500,
              resourceUsage: Math.random() * 0.5 + 0.2
            }
          }
        };
        fs.writeFileSync(filepath, JSON.stringify(updatedResult, null, 2));
      } catch (error) {
        console.error('Error updating simulation result:', error);
      }
    }, 3000);
    
    res.json({ 
      success: true, 
      message: 'Simulation started',
      simulationId,
      status: 'running'
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to run simulation' 
    });
  }
});

// GET /simulations - List available simulations
router.get('/simulations', (req, res) => {
  try {
    const files = fs.readdirSync(simulationDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
    
    const simulations = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(simulationDir, file), 'utf8'));
      return {
        id: data.id,
        type: data.type,
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
        hasResults: !!data.results
      };
    });
    
    res.json({ 
      success: true, 
      simulations 
    });
  } catch (error) {
    console.error('Error listing simulations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list simulations' 
    });
  }
});

// GET /simulation/:id - Get simulation details
router.get('/simulation/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filename = `${id}.json`;
    const filepath = path.join(simulationDir, filename);
    
    // Security check
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid simulation ID' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Simulation not found' 
      });
    }
    
    const simulation = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ 
      success: true, 
      data: simulation 
    });
  } catch (error) {
    console.error('Error retrieving simulation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve simulation' 
    });
  }
});

module.exports = router;
