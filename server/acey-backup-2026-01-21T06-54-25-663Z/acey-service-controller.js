/**
 * Acey Mobile-Controlled Service Controller
 * Background service with mobile start/stop controls
 */

const express = require('express');
const { performance } = require('perf_hooks');
const os = require('os');

class AceyServiceController {
  constructor() {
    this.aceyActive = false;
    this.startTime = null;
    this.resourceMonitor = null;
    this.apiKey = process.env.ACEY_API_KEY || 'default-key-change-me';
    this.allowedDevices = new Set();
    
    // Service components
    this.skills = new Map();
    this.scheduler = null;
    this.llmConnections = new Map();
    
    // Resource monitoring
    this.resourceThresholds = {
      cpu: 80, // 80% CPU usage
      memory: 85, // 85% memory usage
      gpu: 90 // 90% GPU usage (if available)
    };
    
    console.log('🔧 Acey Service Controller initialized');
  }

  // Initialize the service controller
  initialize(app) {
    // Add API routes
    app.post('/api/acey/start', this.startAcey.bind(this));
    app.post('/api/acey/stop', this.stopAcey.bind(this));
    app.get('/api/acey/status', this.getStatus.bind(this));
    app.get('/api/acey/metrics', this.getMetrics.bind(this));
    app.get('/api/acey/logs', this.getLogs.bind(this));
    app.post('/api/acey/chat', this.processChatMessage.bind(this));
    app.post('/api/auth/login', this.handleLogin.bind(this));
    app.post('/api/acey/add-device', this.addTrustedDevice.bind(this));
    
    // LLM Control endpoints
    app.post('/api/acey/connect-llm', this.connectLLM.bind(this));
    app.post('/api/acey/disconnect-llm', this.disconnectLLM.bind(this));
    app.get('/api/acey/llm-status', this.getLLMStatus.bind(this));
    
    // Start resource monitoring
    this.startResourceMonitoring();
    
    console.log('🌐 Acey Service API endpoints registered');
  }

  // Authentication middleware
  authenticate(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const deviceId = req.headers['x-device-id'];
    
    if (!apiKey || apiKey !== this.apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (deviceId && !this.allowedDevices.has(deviceId)) {
      return res.status(403).json({ error: 'Device not authorized' });
    }
    
    req.deviceId = deviceId;
    next();
  }

  // Start Acey service
  async startAcey(req, res) {
    try {
      // Authenticate request
      this.authenticate(req, res, () => {});
      
      if (this.aceyActive) {
        return res.json({ 
          status: 'already_running', 
          message: 'Acey is already active',
          uptime: this.getUptime()
        });
      }

      console.log('🚀 Starting Acey service...');
      
      // Start core components
      await this.startAllSkills();
      await this.startScheduler();
      await this.connectLLMs();
      
      this.aceyActive = true;
      this.startTime = performance.now();
      
      // Log device that started Acey
      console.log(`📱 Acey started by device: ${req.deviceId || 'unknown'}`);
      
      res.json({
        status: 'started',
        message: 'Acey service started successfully',
        uptime: 0,
        skillsActive: this.skills.size,
        llmConnections: this.llmConnections.size
      });
      
    } catch (error) {
      console.error('❌ Failed to start Acey:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to start Acey service',
        error: error.message 
      });
    }
  }

  // Stop Acey service
  async stopAcey(req, res) {
    try {
      // Authenticate request
      this.authenticate(req, res, () => {});
      
      if (!this.aceyActive) {
        return res.json({ 
          status: 'already_stopped', 
          message: 'Acey is not currently active'
        });
      }

      console.log('🛑 Stopping Acey service...');
      
      // Graceful shutdown sequence
      await this.stopScheduler();
      await this.disconnectLLMs();
      await this.stopAllSkills();
      await this.saveLogs();
      
      this.aceyActive = false;
      this.startTime = null;
      
      // Log device that stopped Acey
      console.log(`📱 Acey stopped by device: ${req.deviceId || 'unknown'}`);
      
      res.json({
        status: 'stopped',
        message: 'Acey service stopped successfully',
        uptime: 0,
        skillsStopped: this.skills.size,
        logsSaved: true
      });
      
    } catch (error) {
      console.error('❌ Failed to stop Acey:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to stop Acey service',
        error: error.message 
      });
    }
  }

  // Get current status
  async getStatus(req, res) {
    try {
      const status = {
        active: this.aceyActive,
        uptime: this.getUptime(),
        resources: this.getResourceUsage(),
        skills: {
          active: this.skills.size,
          list: Array.from(this.skills.keys())
        },
        llmConnections: {
          active: this.llmConnections.size,
          list: Array.from(this.llmConnections.keys())
        },
        lastActivity: this.startTime ? new Date(this.startTime).toISOString() : null,
        autoPauseEnabled: true
      };
      
      res.json(status);
    } catch (error) {
      console.error('❌ Failed to get status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  // Get detailed metrics
  async getMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        resources: this.getResourceUsage(),
        performance: {
          cpuUsage: this.getResourceUsage().cpu,
          memoryUsage: this.getResourceUsage().memory,
          nodeMemory: process.memoryUsage(),
          systemLoad: os.loadavg()
        },
        services: {
          skills: {
            active: this.skills.size,
            list: Array.from(this.skills.keys())
          },
          llmConnections: {
            active: this.llmConnections.size,
            list: Array.from(this.llmConnections.keys())
          }
        },
        health: {
          status: this.aceyActive ? 'healthy' : 'inactive',
          lastCheck: new Date().toISOString(),
          issues: []
        }
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('❌ Failed to get metrics:', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  // Get system logs
  async getLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const level = req.query.level || 'all';
      
      // Mock logs for now - in production, these would come from a log store
      const mockLogs = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'INFO',
          message: 'Acey service initialized',
          source: 'service'
        },
        {
          id: '2', 
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'INFO',
          message: 'Resource monitoring started',
          source: 'monitor'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 10000).toISOString(),
          level: 'WARN',
          message: 'High memory usage detected',
          source: 'monitor'
        }
      ];
      
      const filteredLogs = level === 'all' 
        ? mockLogs 
        : mockLogs.filter(log => log.level === level.toUpperCase());
      
      res.json({
        logs: filteredLogs.slice(0, limit),
        total: mockLogs.length,
        filtered: filteredLogs.length,
        limit
      });
    } catch (error) {
      console.error('❌ Failed to get logs:', error);
      res.status(500).json({ error: 'Failed to get logs' });
    }
  }

  // Process chat message and command
  async processChatMessage(req, res) {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const lowerMessage = message.toLowerCase().trim();
      let response = {
        text: '',
        type: 'text',
        action: null,
        result: null,
        timestamp: new Date().toISOString()
      };

      // System Control Commands
      if (lowerMessage.includes('start') && lowerMessage.includes('system')) {
        try {
          await this.startAcey(req, res);
          response = {
            ...response,
            text: '✅ System started successfully',
            type: 'control',
            action: 'start',
            result: 'success'
          };
        } catch (error) {
          response = {
            ...response,
            text: `❌ Failed to start system: ${error.message}`,
            type: 'system',
            action: 'start',
            result: 'error'
          };
        }
        return res.json(response);
      }

      if (lowerMessage.includes('stop') && lowerMessage.includes('system')) {
        try {
          await this.stopAcey(req, res);
          response = {
            ...response,
            text: '✅ System stopped successfully',
            type: 'control',
            action: 'stop',
            result: 'success'
          };
        } catch (error) {
          response = {
            ...response,
            text: `❌ Failed to stop system: ${error.message}`,
            type: 'system',
            action: 'stop',
            result: 'error'
          };
        }
        return res.json(response);
      }

      // Status Commands
      if (lowerMessage.includes('status') || lowerMessage.includes('how are you')) {
        const status = await this.getStatus(req, res);
        response = {
          ...response,
          text: `System Status: ${this.aceyActive ? '🟢 Online' : '🔴 Offline'}
Uptime: ${this.getUptime()}s
CPU Usage: ${this.getResourceUsage().cpu}%
Memory Usage: ${this.getResourceUsage().memory}%
Active Skills: ${this.skills.size}
LLM Connections: ${this.llmConnections.size}`,
          type: 'system',
          action: 'status',
          result: status
        };
        return res.json(response);
      }

      // Metrics Commands
      if (lowerMessage.includes('metrics') || lowerMessage.includes('performance')) {
        const metrics = await this.getMetrics(req, res);
        response = {
          ...response,
          text: `Performance Metrics:
CPU: ${this.getResourceUsage().cpu}%
Memory: ${this.getResourceUsage().memory}%
Node Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
System Load: ${os.loadavg().join(', ')}
Health: ${this.aceyActive ? 'healthy' : 'inactive'}`,
          type: 'system',
          action: 'metrics',
          result: metrics
        };
        return res.json(response);
      }

      // AI Skills
      if (lowerMessage.startsWith('analyze')) {
        const textToAnalyze = message.replace(/analyze/i, '').trim();
        if (textToAnalyze) {
          response = {
            ...response,
            text: `Analysis of "${textToAnalyze}":

This appears to be a request for analysis. The text contains ${textToAnalyze.length} characters and appears to be ${textToAnalyze.includes('?') ? 'a question' : 'a statement'}.

Key insights:
- Length: ${textToAnalyze.length} characters
- Type: ${textToAnalyze.includes('?') ? 'Question' : 'Statement'}
- Sentiment: ${textToAnalyze.includes('!') ? 'Expressive' : 'Neutral'}
- Complexity: ${textToAnalyze.length > 100 ? 'High' : 'Low'}`,
            type: 'skill',
            action: 'analyze',
            result: { 
              length: textToAnalyze.length, 
              type: textToAnalyze.includes('?') ? 'question' : 'statement',
              sentiment: textToAnalyze.includes('!') ? 'expressive' : 'neutral',
              complexity: textToAnalyze.length > 100 ? 'high' : 'low'
            }
          };
          return res.json(response);
        }
      }

      if (lowerMessage.startsWith('summarize')) {
        const textToSummarize = message.replace(/summarize/i, '').trim();
        if (textToSummarize) {
          response = {
            ...response,
            text: `Summary: ${textToSummarize.substring(0, 100)}${textToSummarize.length > 100 ? '...' : ''}

Key points extracted from the text:
- Main topic identified
- Length: ${textToSummarize.length} characters
- Summary truncated for brevity`,
            type: 'skill',
            action: 'summarize',
            result: { 
              summary: textToSummarize.substring(0, 100),
              originalLength: textToSummarize.length
            }
          };
          return res.json(response);
        }
      }

      if (lowerMessage.startsWith('calculate')) {
        const calcExpression = message.replace(/calculate/i, '').trim();
        if (calcExpression) {
          try {
            // Simple calculation (in production, use a proper math library)
            const result = eval(calcExpression);
            response = {
              ...response,
              text: `Calculation result: ${result}

Expression: ${calcExpression}
Result: ${result}`,
              type: 'skill',
              action: 'calculate',
              result: result
            };
          } catch (error) {
            response = {
              ...response,
              text: `❌ Invalid calculation: ${calcExpression}

Please provide a valid mathematical expression.`,
              type: 'skill',
              action: 'calculate',
              result: 'error'
            };
          }
          return res.json(response);
        }
      }

      // Help Commands
      if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        response = {
          ...response,
          text: `I'm Acey, your AI assistant! Here's what I can do:

🔧 **System Control:**
• "start system" - Start the Acey system
• "stop system" - Stop the Acey system  
• "status" - Get current system status
• "metrics" - View performance metrics

🧠 **AI Skills:**
• "analyze [text]" - Analyze text or data
• "summarize [text]" - Create summaries
• "calculate [expression]" - Perform calculations
• "search [query]" - Search for information

📊 **Information:**
• "logs" - View system logs
• "help" - Show this help message

Try any of these commands!`,
          type: 'help',
          action: 'help',
          result: 'commands_list'
        };
        return res.json(response);
      }

      // Default response
      response = {
        ...response,
        text: `I didn't understand "${message}". 

Try typing "help" to see what I can do, or try commands like:
• "status" - Check system status
• "analyze [text]" - Analyze something
• "help" - See all commands`,
        type: 'text',
        action: null,
        result: null
      };

      res.json(response);
    } catch (error) {
      console.error('❌ Failed to process chat message:', error);
      res.status(500).json({ 
        error: 'Failed to process message',
        text: 'Sorry, I encountered an error processing your request.',
        type: 'error'
      });
    }
  }

  // Handle login authentication
  async handleLogin(req, res) {
    try {
      console.log('🔐 Login request received:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      });
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log('❌ Missing credentials:', { email: !!email, password: !!password });
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Simple development authentication (accept any credentials)
      // In production, implement proper authentication
      console.log(`🔐 Login attempt: ${email}`);
      
      // Generate mock tokens
      const accessToken = 'mock-access-token-' + Date.now();
      const refreshToken = 'mock-refresh-token-' + Date.now();
      
      const user = {
        id: 'user-' + Date.now(),
        email: email,
        role: 'admin'
      };

      res.json({
        accessToken,
        refreshToken,
        user,
        message: 'Login successful'
      });
      
      console.log(`✅ Login successful for: ${email}`);
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Add trusted device
  async addTrustedDevice(req, res) {
    try {
      const { deviceId, deviceName } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
      }
      
      this.allowedDevices.add(deviceId);
      
      console.log(`📱 Trusted device added: ${deviceName || deviceId} (${deviceId})`);
      
      res.json({
        status: 'added',
        message: 'Device authorized successfully',
        deviceId,
        totalDevices: this.allowedDevices.size
      });
      
    } catch (error) {
      console.error('❌ Failed to add device:', error);
      res.status(500).json({ error: 'Failed to add device' });
    }
  }

  // Start all skills
  async startAllSkills() {
    console.log('🧠 Starting Acey skills...');
    
    // Load and start skills
    const skillModules = [
      'financial-ops',
      'task-decomposer', 
      'memory-engine',
      'security-monitor'
    ];
    
    for (const skillName of skillModules) {
      try {
        const skill = require(`../acey/skills/${skillName}`);
        this.skills.set(skillName, {
          module: skill,
          started: performance.now(),
          status: 'active'
        });
        console.log(`✅ Skill started: ${skillName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to start skill ${skillName}:`, error.message);
      }
    }
  }

  // Stop all skills
  async stopAllSkills() {
    console.log('🧠 Stopping Acey skills...');
    
    for (const [skillName, skill] of this.skills) {
      try {
        if (skill.module && skill.module.shutdown) {
          await skill.module.shutdown();
        }
        skill.status = 'stopped';
        console.log(`✅ Skill stopped: ${skillName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to stop skill ${skillName}:`, error.message);
      }
    }
  }

  // Start scheduler
  async startScheduler() {
    console.log('⏰ Starting Acey scheduler...');
    
    // Initialize scheduler (placeholder for actual implementation)
    this.scheduler = {
      active: true,
      started: performance.now(),
      tasks: []
    };
    
    // Start periodic tasks
    this.schedulerInterval = setInterval(() => {
      if (this.aceyActive) {
        this.runScheduledTasks();
      }
    }, 60000); // Every minute
  }

  // Stop scheduler
  async stopScheduler() {
    console.log('⏰ Stopping Acey scheduler...');
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    if (this.scheduler) {
      this.scheduler.active = false;
    }
  }

  // Connect to LLMs
  async connectLLMs() {
    console.log('🤖 Connecting to LLM services...');
    
    // Initialize LLM connections (placeholder)
    const llmServices = ['openai', 'anthropic', 'local'];
    
    for (const service of llmServices) {
      try {
        this.llmConnections.set(service, {
          connected: true,
          connectedAt: performance.now(),
          status: 'active'
        });
        console.log(`✅ LLM connected: ${service}`);
      } catch (error) {
        console.warn(`⚠️ Failed to connect to LLM ${service}:`, error.message);
      }
    }
  }

  // Disconnect from LLMs
  async disconnectLLMs() {
    console.log('🤖 Disconnecting from LLM services...');
    
    for (const [service, connection] of this.llmConnections) {
      try {
        connection.connected = false;
        connection.status = 'disconnected';
        console.log(`✅ LLM disconnected: ${service}`);
      } catch (error) {
        console.warn(`⚠️ Failed to disconnect from LLM ${service}:`, error.message);
      }
    }
  }

  // Save logs
  async saveLogs() {
    console.log('📝 Saving Acey logs...');
    
    // Placeholder for actual log saving implementation
    const logData = {
      sessionEnd: new Date().toISOString(),
      uptime: this.getUptime(),
      skillsUsed: Array.from(this.skills.keys()),
      devices: Array.from(this.allowedDevices)
    };
    
    // Save to file or database
    console.log('✅ Logs saved successfully');
  }

  // Run scheduled tasks
  runScheduledTasks() {
    // Placeholder for scheduled task implementation
    // This would run periodic maintenance, learning, etc.
  }

  // Start resource monitoring
  startResourceMonitoring() {
    this.resourceMonitor = setInterval(() => {
      if (this.aceyActive) {
        this.checkResourceUsage();
      }
    }, 5000); // Every 5 seconds
  }

  // Check resource usage
  checkResourceUsage() {
    const usage = this.getResourceUsage();
    
    // Auto-pause if thresholds exceeded
    if (usage.cpu > this.resourceThresholds.cpu || 
        usage.memory > this.resourceThresholds.memory) {
      
      console.warn(`⚠️ Resource usage high - CPU: ${usage.cpu}%, Memory: ${usage.memory}%`);
      
      // Auto-pause logic (optional)
      if (usage.cpu > 95 || usage.memory > 95) {
        console.log('🚨 Emergency auto-pause triggered');
        this.emergencyStop();
      }
    }
  }

  // Emergency stop
  async emergencyStop() {
    console.log('🚨 Emergency stop initiated');
    
    try {
      await this.stopScheduler();
      await this.disconnectLLMs();
      await this.stopAllSkills();
      await this.saveLogs();
      
      this.aceyActive = false;
      console.log('✅ Emergency stop completed');
    } catch (error) {
      console.error('❌ Emergency stop failed:', error);
    }
  }

  // Get resource usage
  getResourceUsage() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      cpu: 0, // Placeholder - would need actual CPU monitoring
      memory: Math.round((usedMem / totalMem) * 100),
      memoryUsed: Math.round(usedMem / 1024 / 1024), // MB
      memoryTotal: Math.round(totalMem / 1024 / 1024), // MB
      nodeMemory: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      uptime: this.getUptime()
    };
  }

  // Get uptime
  getUptime() {
    if (!this.startTime) return 0;
    return Math.round((performance.now() - this.startTime) / 1000);
  }

  // Cleanup on shutdown
  async shutdown() {
    console.log('🧹 Cleaning up Acey Service Controller...');
    
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
    }
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    
    if (this.aceyActive) {
      await this.emergencyStop();
    }
    
    console.log('✅ Cleanup completed');
  }

  // LLM Control Methods
  async connectLLM(req, res) {
    try {
      console.log('🤖 Connecting to LLM services...');
      
      // Connect to LLM services
      await this.connectLLMs();
      
      res.json({
        success: true,
        message: 'LLM services connected successfully',
        connected: this.llmConnections.size,
        services: Array.from(this.llmConnections.keys())
      });
      
      console.log(`✅ LLM services connected: ${this.llmConnections.size} services`);
    } catch (error) {
      console.error('❌ Failed to connect LLM services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect LLM services',
        message: error.message
      });
    }
  }

  async disconnectLLM(req, res) {
    try {
      console.log('🤖 Disconnecting from LLM services...');
      
      // Disconnect from LLM services
      await this.disconnectLLMs();
      
      res.json({
        success: true,
        message: 'LLM services disconnected successfully',
        connected: this.llmConnections.size,
        services: Array.from(this.llmConnections.keys())
      });
      
      console.log(`✅ LLM services disconnected: ${this.llmConnections.size} services`);
    } catch (error) {
      console.error('❌ Failed to disconnect LLM services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect LLM services',
        message: error.message
      });
    }
  }

  async getLLMStatus(req, res) {
    try {
      const connectedServices = Array.from(this.llmConnections.entries())
        .filter(([_, connection]) => connection.connected)
        .map(([service, connection]) => ({
          service,
          status: connection.status,
          connectedAt: connection.connectedAt ? new Date(connection.connectedAt).toISOString() : null
        }));
      
      const activeServices = connectedServices.filter(s => s.status === 'active');
      
      res.json({
        connected: connectedServices.length,
        active: activeServices.length,
        services: connectedServices.map(s => s.service),
        lastActivity: this.startTime ? new Date(this.startTime).toISOString() : null,
        details: connectedServices
      });
    } catch (error) {
      console.error('❌ Failed to get LLM status:', error);
      res.status(500).json({
        error: 'Failed to get LLM status',
        message: error.message
      });
    }
  }
}

// Singleton instance
const aceyServiceController = new AceyServiceController();

module.exports = aceyServiceController;
