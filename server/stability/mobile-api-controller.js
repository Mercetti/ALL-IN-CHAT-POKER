/**
 * Simple stub for MobileAPIController
 * Provides REST API endpoints for mobile app control
 */

class MobileAPIController {
  constructor(app, config = {}) {
    this.app = app;
    this.config = config;
    this.isInitialized = false;
  }

  async initialize() {
    console.log('[MOBILE-API] Initializing mobile API controller');
    this.setupRoutes();
    this.isInitialized = true;
    return true;
  }

  setupRoutes() {
    // Health endpoint
    this.app.get('/api/acey/status', (req, res) => {
      res.json({
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });

    // Start endpoint
    this.app.post('/api/acey/start', (req, res) => {
      console.log('[MOBILE-API] Start request received');
      res.json({ success: true, message: 'Acey started' });
    });

    // Stop endpoint
    this.app.post('/api/acey/stop', (req, res) => {
      console.log('[MOBILE-API] Stop request received');
      res.json({ success: true, message: 'Acey stopped' });
    });

    // Skills endpoint
    this.app.get('/api/acey/skills', (req, res) => {
      res.json({
        skills: ['stability', 'monitoring', 'basic-ops'],
        timestamp: new Date().toISOString()
      });
    });

    console.log('[MOBILE-API] Routes registered');
  }

  registerRoutes() {
    this.setupRoutes();
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      uptime: process.uptime(),
      routes: ['/api/acey/status', '/api/acey/start', '/api/acey/stop', '/api/acey/skills']
    };
  }
}

module.exports = { MobileAPIController };
