const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const workflowDir = path.join(__dirname, '../../data/workflows');

// Ensure workflow directory exists
if (!fs.existsSync(workflowDir)) {
  fs.mkdirSync(workflowDir, { recursive: true });
}

// POST /create - Create a new workflow
router.post('/create', async (req, res) => {
  try {
    const { name, description, steps = [] } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and description are required' 
      });
    }
    
    // Create workflow
    const workflow = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      steps,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executions: []
    };
    
    // Save workflow
    const filename = `${workflow.id}.json`;
    const filepath = path.join(workflowDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(workflow, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Workflow created successfully',
      workflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create workflow' 
    });
  }
});

// GET /workflows - List available workflows
router.get('/workflows', (req, res) => {
  try {
    const files = fs.readdirSync(workflowDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
    
    const workflows = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(workflowDir, file), 'utf8'));
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        stepCount: data.steps.length,
        executionCount: data.executions.length
      };
    });
    
    res.json({ 
      success: true, 
      workflows 
    });
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list workflows' 
    });
  }
});

// GET /workflow/:id - Get workflow details
router.get('/workflow/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filename = `${id}.json`;
    const filepath = path.join(workflowDir, filename);
    
    // Security check
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid workflow ID' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found' 
      });
    }
    
    const workflow = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ 
      success: true, 
      data: workflow 
    });
  } catch (error) {
    console.error('Error retrieving workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve workflow' 
    });
  }
});

// POST /workflow/:id/execute - Execute a workflow
router.post('/workflow/:id/execute', async (req, res) => {
  try {
    const id = req.params.id;
    const filename = `${id}.json`;
    const filepath = path.join(workflowDir, filename);
    
    // Security check
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid workflow ID' 
      });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found' 
      });
    }
    
    const workflow = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    // Create execution record
    const execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: id,
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      results: [],
      context: req.body.context || {}
    };
    
    // Add execution to workflow
    workflow.executions.push(execution);
    workflow.updatedAt = Date.now();
    
    // Save updated workflow
    fs.writeFileSync(filepath, JSON.stringify(workflow, null, 2));
    
    // Simulate execution (in real implementation, this would run actual workflow)
    setTimeout(() => {
      try {
        execution.status = 'completed';
        execution.endTime = Date.now();
        execution.results = [
          { step: 1, status: 'success', output: 'Step 1 completed' },
          { step: 2, status: 'success', output: 'Step 2 completed' }
        ];
        
        // Update workflow with execution results
        const updatedWorkflow = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const execIndex = updatedWorkflow.executions.findIndex(e => e.id === execution.id);
        if (execIndex !== -1) {
          updatedWorkflow.executions[execIndex] = execution;
          updatedWorkflow.updatedAt = Date.now();
          fs.writeFileSync(filepath, JSON.stringify(updatedWorkflow, null, 2));
        }
      } catch (error) {
        console.error('Error updating workflow execution:', error);
      }
    }, 2000);
    
    res.json({ 
      success: true, 
      message: 'Workflow execution started',
      executionId: execution.id,
      status: 'running'
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to execute workflow' 
    });
  }
});

module.exports = router;
