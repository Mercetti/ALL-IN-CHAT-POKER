const express = require('express');
const { spawn } = require('child_process');

const router = express.Router();

/**
 * Execute system command (limited to safe commands)
 */
router.post('/execute-command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }

    // Security: Only allow safe commands
    const allowedCommands = [
      'curl',
      'node',
      'npm',
      'git',
      'ls',
      'ps',
      'netstat',
      'ping',
      'echo'
    ];

    const commandParts = command.split(' ');
    const baseCommand = commandParts[0];

    if (!allowedCommands.includes(baseCommand)) {
      return res.status(403).json({
        success: false,
        error: 'Command not allowed for security reasons'
      });
    }

    // Execute command with timeout
    const result = await executeCommandWithTimeout(command, 10000);
    
    res.json({
      success: true,
      output: result.stdout || result.stderr,
      exitCode: result.exitCode
    });

  } catch (error) {
    console.error('Command execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get system status
 */
router.get('/system-status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check if services are running
 */
router.get('/service-status', async (req, res) => {
  try {
    const services = {
      backend: await checkService('http://localhost:8080/health'),
      aiControlCenter: await checkService('http://localhost:3001/health'),
      database: await checkDatabase(),
      flyio: await checkFlyIO()
    };

    res.json({
      success: true,
      services
    });

  } catch (error) {
    console.error('Service status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute command with timeout
 */
function executeCommandWithTimeout(command, timeout) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [], {
      shell: true,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Command timeout'));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code
      });
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * Check if a service is responding
 */
async function checkService(url) {
  try {
    const axios = require('axios');
    const response = await axios.get(url, { timeout: 5000 });
    return {
      status: 'online',
      statusCode: response.status,
      responseTime: response.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    return {
      status: 'offline',
      error: error.message
    };
  }
}

/**
 * Check database connection
 */
async function checkDatabase() {
  try {
    // This would depend on your database setup
    // For now, return a placeholder
    return {
      status: 'unknown',
      message: 'Database check not implemented'
    };
  } catch (error) {
    return {
      status: 'offline',
      error: error.message
    };
  }
}

/**
 * Check Fly.io status
 */
async function checkFlyIO() {
  try {
    const result = await executeCommandWithTimeout('fly status -a all-in-chat-poker', 10000);
    if (result.exitCode === 0) {
      return {
        status: 'online',
        output: result.stdout
      };
    } else {
      return {
        status: 'offline',
        error: result.stderr
      };
    }
  } catch (error) {
    return {
      status: 'offline',
      error: error.message
    };
  }
}

module.exports = router;
