/**
 * Integration Guide for AI Control Center
 * How to integrate the Control Center with existing Acey system
 * Clean, scalable architecture with clear separation of concerns
 */

// ===== INTEGRATION ARCHITECTURE =====
/*
Twitch Chat / Game Events
           ↓
      Web Server (WS)
           ↓
        Acey LLM
           ↓
     INTENT OUTPUT (JSON)
           ↓
   AI CONTROL CENTER (LOCAL)
           ↓
   Approved Actions / State
           ↓
      Web Server
           ↓
        Stream Output

Acey asks → Control Center decides
*/

// ===== STEP 1: UPDATE EXISTING ACEY ENGINE =====

// In your existing aceyEngine.js or similar file
const AIControlCenterClient = require('./interfaces/control-center-server');

class IntegratedAceyEngine {
  constructor() {
    // Existing Acey initialization
    this.memorySystem = new MemorySystem();
    this.trustSystem = new TrustSystem();
    this.personaModes = new PersonaModes();
    
    // NEW: Connect to Control Center
    this.controlCenter = null;
    this.connectToControlCenter();
  }

  async connectToControlCenter() {
    try {
      // Option A: Connect to running Control Center server
      this.controlCenter = new AIControlCenterClient(3001);
      await this.controlCenter.start();
      
      console.log('🧠 Connected to AI Control Center');
    } catch (error) {
      console.error('❌ Failed to connect to Control Center:', error);
      // Fallback to local mode
      this.controlCenter = new LocalControlCenter();
    }
  }

  /**
   * Process message through Control Center instead of direct execution
   */
  async processMessage(userId, message, context = {}) {
    if (!this.controlCenter) {
      throw new Error('Control Center not available');
    }

    try {
      // Generate Acey response (existing logic)
      const aceyOutput = await this.generateAceyResponse(userId, message, context);
      
      // Send to Control Center for approval/execution
      const result = await this.controlCenter.processAceyIntent(aceyOutput, 'acey');
      
      return {
        speech: aceyOutput.speech,
        intents: aceyOutput.intents,
        processingResult: result,
        // Speech is returned immediately, intents are processed asynchronously
        requiresApproval: result.status === 'pending'
      };

    } catch (error) {
      console.error('❌ Message processing error:', error);
      return {
        speech: "I'm having trouble processing that right now.",
        error: error.message
      };
    }
  }

  /**
   * Generate Acey response (existing logic)
   */
  async generateAceyResponse(userId, message, context) {
    // Your existing Acey LLM logic here
    // This should return the structured AceyOutput format
    
    // Example:
    const response = await this.callLLM({
      context: this.buildContext(context),
      message: { userId, content: message },
      systemPrompts: this.getSystemPrompts()
    });

    return {
      speech: response.speech,
      intents: response.intents || []
    };
  }

  /**
   * Handle Control Center decisions
   */
  async handleControlCenterDecision(decision) {
    switch (decision.action) {
      case 'memory_written':
        // Memory was approved and written
        console.log('✅ Memory written:', decision.details);
        break;
        
      case 'trust_updated':
        // Trust score was updated
        console.log('✅ Trust updated:', decision.details);
        break;
        
      case 'persona_changed':
        // Persona was changed
        console.log('✅ Persona changed:', decision.details);
        break;
        
      case 'moderation_applied':
        // Moderation was applied
        console.log('✅ Moderation applied:', decision.details);
        break;
        
      case 'rejected':
        // Intent was rejected
        console.log('❌ Intent rejected:', decision.reason);
        break;
        
      default:
        console.log('📋 Control Center decision:', decision);
    }
  }
}

// ===== STEP 2: UPDATE YOUR WEB SERVER =====

// In your main server.js or similar
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class IntegratedWebServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    
    this.aceyEngine = new IntegratedAceyEngine();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    // Existing routes...
    
    // NEW: Route for Control Center to send decisions back
    this.app.post('/control-center/decision', (req, res) => {
      try {
        const decision = req.body;
        this.aceyEngine.handleControlCenterDecision(decision);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // NEW: Health check that includes Control Center status
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        controlCenter: this.aceyEngine.controlCenter ? 'connected' : 'disconnected',
        mode: this.aceyEngine.controlCenter?.getConfig()?.mode || 'unknown'
      });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle chat messages
      socket.on('chat_message', async (data) => {
        try {
          const result = await this.aceyEngine.processMessage(
            data.userId,
            data.message,
            data.context
          );

          // Send speech response immediately
          socket.emit('chat_response', {
            speech: result.speech,
            requiresApproval: result.requiresApproval
          });

          // Log intent processing
          if (result.processingResult) {
            console.log('📋 Intent processing:', result.processingResult);
          }

        } catch (error) {
          console.error('❌ Chat message error:', error);
          socket.emit('error', { message: error.message });
        }
      });

      // Handle Control Center events
      socket.on('control_center_event', (event) => {
        console.log('🧠 Control Center event:', event);
        this.aceyEngine.handleControlCenterDecision(event);
    });
  }

  start(port = 8080) {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`🚀 Integrated server running on port ${port}`);
        resolve();
    });
  }
}

// ===== STEP 3: UPDATE YOUR FRONTEND =====

// In your client-side JavaScript
class IntegratedClient {
  constructor() {
    this.socket = io();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('chat_response', (response) => {
      // Display speech response immediately
      this.displayMessage(response.speech);
      
      // Show approval status if needed
      if (response.requiresApproval) {
        this.showPendingApproval();
      }
    });

    this.socket.on('control_center_update', (update) => {
      // Handle Control Center updates
      this.handleControlCenterUpdate(update);

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.showError(error.message);
  }

  sendMessage(message) {
    this.socket.emit('chat_message', {
      userId: this.getCurrentUserId(),
      message: message,
      context: this.getCurrentContext()
    });
  }

  displayMessage(message) {
    // Your existing message display logic
    console.log('Acey:', message);
  }

  showPendingApproval() {
    // Show that message is pending approval
    console.log('⏳ Message sent, awaiting approval...');
  }

  handleControlCenterUpdate(update) {
    // Handle Control Center updates
    console.log('🧠 Control Center update:', update);
  }

  showError(error) {
    // Show error to user
    console.error('❌ Error:', error);
  }
}

// ===== STEP 4: DEPLOYMENT OPTIONS =====

// Option A: Separate Control Center Server (Recommended)
/*
1. Run Control Center server: node control-center-server.js
2. Run main application: node server.js
3. Main app connects to Control Center via HTTP/WebSocket
4. Control Center runs locally, main app can be deployed anywhere
*/

// Option B: Integrated Control Center
/*
1. Include Control Center in main application
2. Control Center runs in same process
3. Simpler deployment, but less flexible
4. Good for development/testing
*/

// ===== STEP 5: CONFIGURATION =====

// config/control-center.json
{
  "server": {
    "port": 3001,
    "host": "localhost"
  },
  "controlCenter": {
    "autoApproveThreshold": 0.9,
    "memoryLocked": false,
    "personaLocked": false,
    "simulationMode": false,
    "auditEnabled": true,
    "maxPendingIntents": 50,
    "intentTimeout": 300000
  },
  "integration": {
    "mode": "separate", // "separate" or "integrated"
    "fallbackToLocal": true,
    "retryAttempts": 3,
    "retryDelay": 1000
  }
}

// ===== STEP 6: TESTING INTEGRATION =====

// test/integration.test.js
const assert = require('assert');

class IntegrationTest {
  async testControlCenterConnection() {
    const engine = new IntegratedAceyEngine();
    await engine.connectToControlCenter();
    
    assert(engine.controlCenter, 'Control Center should be connected');
    console.log('✅ Control Center connection test passed');
  }

  async testMessageProcessing() {
    const engine = new IntegratedAceyEngine();
    await engine.connectToControlCenter();
    
    const result = await engine.processMessage(
      'test_user',
      'hello world',
      { channel: 'test' }
    );
    
    assert(result.speech, 'Should have speech response');
    assert(typeof result.requiresApproval === 'boolean', 'Should have approval status');
    console.log('✅ Message processing test passed');
  }

  async testIntentApproval() {
    const engine = new IntegratedAceyEngine();
    await engine.connectToControlCenter();
    
    // Send message that generates intents
    const result = await engine.processMessage(
      'test_user',
      'all in with everything',
      { channel: 'test' }
    );
    
    if (result.requiresApproval) {
      console.log('✅ Intent approval test passed - requires approval');
    } else {
      console.log('✅ Intent approval test passed - auto-approved');
    }
  }

  async runAllTests() {
    console.log('🧪 Running integration tests...');
    
    try {
      await this.testControlCenterConnection();
      await this.testMessageProcessing();
      await this.testIntentApproval();
      
      console.log('✅ All integration tests passed');
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      throw error;
    }
  }
}

// ===== STEP 7: MONITORING & HEALTH CHECKS =====

// health/control-center.js
class ControlCenterHealthCheck {
  constructor(controlCenter) {
    this.controlCenter = controlCenter;
  }

  async checkHealth() {
    const health = {
      status: 'unknown',
      timestamp: Date.now(),
      controlCenter: {
        connected: false,
        mode: 'unknown',
        pendingIntents: 0,
        systemStats: {}
      },
      integration: {
        lastActivity: null,
        errorCount: 0,
        lastError: null
      }
    };

    try {
      if (this.controlCenter) {
        const state = this.controlCenter.getState();
        const config = this.controlCenter.getConfig();
        
        health.controlCenter = {
          connected: state.active,
          mode: state.mode,
          pendingIntents: state.systemStats.pending,
          systemStats: state.systemStats
        };

        health.status = state.active ? 'healthy' : 'inactive';
      }
    } catch (error) {
      health.status = 'error';
      health.integration.lastError = error.message;
      health.integration.errorCount++;
    }

    return health;
  }

  async startHealthCheck(interval = 30000) {
    console.log('🏥 Starting Control Center health checks...');
    
    setInterval(async () => {
      const health = await this.checkHealth();
      
      if (health.status !== 'healthy') {
        console.warn('⚠️ Control Center health issue:', health);
        
        // Attempt recovery
        await this.attemptRecovery();
      }
    }, interval);
  }

  async attemptRecovery() {
    console.log('🔄 Attempting Control Center recovery...');
    
    try {
      await this.controlCenter.connectToControlCenter();
      console.log('✅ Control Center recovery successful');
    } catch (error) {
      console.error('❌ Control Center recovery failed:', error);
    }
  }
}

// ===== STEP 8: GRACEFUL SHUTDOWN =====

// shutdown.js
class GracefulShutdown {
  constructor(server, controlCenter) {
    this.server = server;
    this.controlCenter = controlCenter;
    this.shuttingDown = false;
  }

  async shutdown() {
    if (this.shuttingDown) {
      console.log('⚠️ Shutdown already in progress');
      return;
    }

    this.shuttingDown = true;
    console.log('🛑 Starting graceful shutdown...');

    try {
      // Stop accepting new connections
      this.server.close(() => {
        console.log('✅ Server stopped accepting connections');

      // Wait for pending operations to complete
      await this.waitForPendingOperations(10000);

      // Shutdown Control Center
      if (this.controlCenter) {
        await this.controlCenter.stop();
        console.log('✅ Control Center stopped');
      }

      console.log('✅ Graceful shutdown complete');
      process.exit(0);

    } catch (error) {
      console.error('❌ Shutdown error:', error);
      process.exit(1);
    }
  }

  async waitForPendingOperations(timeout) {
    const startTime = Date.now;
    
    while (Date.now() - startTime < timeout) {
      const state = this.controlCenter?.getState();
      
      if (!state || state.systemStats.pending === 0) {
        console.log('✅ No pending operations');
        return;
      }

      console.log(`⏳ Waiting for ${state.systemStats.pending} pending operations...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('⚠️ Timeout reached, forcing shutdown');
  }
}

// ===== USAGE EXAMPLE =====

// Main application entry point
async function main() {
  try {
    // Initialize integrated server
    const server = new IntegratedWebServer();
    
    // Start health checks
    const healthCheck = new ControlCenterHealthCheck(server.aceyEngine.controlCenter);
    await healthCheck.startHealthCheck();
    
    // Setup graceful shutdown
    const shutdown = new GracefulShutdown(server, server.aceyEngine.controlCenter);
    process.on('SIGINT', () => shutdown.shutdown());
    process.on('SIGTERM', () => shutdown.shutdown());
    
    // Start server
    await server.start(8080);
    
    console.log('🚀 Integrated Acey system ready');
    console.log('📊 Control Center available at http://localhost:3001');
    console.log('💬 Main application at http://localhost:8080');
    
  } catch (error) {
    console.error('❌ Failed to start integrated system:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  IntegratedAceyEngine,
  IntegratedWebServer,
  IntegratedClient,
  ControlCenterHealthCheck,
  GracefulShutdown,
  main
};
