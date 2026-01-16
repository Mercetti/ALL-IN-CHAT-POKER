/**
 * Acey Demo System - One-Click Scripted Demonstrations
 * Provides predictable, repeatable, impressive demos for investors
 */

class DemoSystem {
  constructor() {
    this.isRunning = false;
    this.currentDemo = null;
    this.demoHistory = [];
    this.demoQueue = [];
    
    this.demos = {
      "acey-online": {
        name: "Acey Comes Online",
        duration: 30000, // 30 seconds
        description: "Controlled startup sequence with system announcements",
        steps: [
          { action: "announce", message: "Demo mode enabled. All actions are controlled and logged.", delay: 0 },
          { action: "start_llm", message: "Connecting to thinking engine...", delay: 2000 },
          { action: "start_tools", message: "Initializing tool systems...", delay: 4000 },
          { action: "start_websocket", message: "Establishing communication channels...", delay: 6000 },
          { action: "enable_chat", message: "Chat interface activated.", delay: 8000 },
          { action: "status_check", message: "All systems operational. Acey online.", delay: 10000 }
        ],
        investorSignal: "stability_and_intent"
      },
      
      "tool-orchestration": {
        name: "Tool Orchestration",
        duration: 45000, // 45 seconds
        description: "Demonstrates Acey coordinating external systems",
        steps: [
          { action: "explain", message: "I coordinate systems already in place rather than creating new overhead.", delay: 0 },
          { action: "prepare_action", message: "Preparing workflow orchestration...", delay: 3000 },
          { action: "execute_action", message: "Executing tool sequence with validation...", delay: 8000 },
          { action: "monitor_progress", message: "Monitoring execution progress...", delay: 15000 },
          { action: "validate_result", message: "Validating operation results...", delay: 25000 },
          { action: "confirm_completion", message: "Action completed. Awaiting next instruction.", delay: 30000 }
        ],
        investorSignal: "orchestration_not_chat"
      },
      
      "live-interaction": {
        name: "Live Chat Interaction",
        duration: 60000, // 60 seconds
        description: "Shows personality, safety, and rate limiting",
        steps: [
          { action: "enable_chat", message: "Live interaction mode enabled.", delay: 0 },
          { action: "simulate_chat", message: "Processing incoming chat message...", delay: 5000 },
          { action: "analyze_request", message: "Analyzing request for safety and appropriateness...", delay: 8000 },
          { action: "generate_response", message: "Generating personality-driven response...", delay: 12000 },
          { action: "apply_safety", message: "Applying safety filters and rate limiting...", delay: 18000 },
          { action: "deliver_response", message: "Response delivered with full audit trail.", delay: 25000 },
          { action: "rate_limit_check", message: "Rate limiting active - preventing spam.", delay: 35000 },
          { action: "status_update", message: "All interactions logged and monitored.", delay: 45000 }
        ],
        investorSignal: "market_fit_and_safety"
      },
      
      "shutdown-sequence": {
        name: "Responsible Shutdown",
        duration: 20000, // 20 seconds
        description: "Proves responsibility and control",
        steps: [
          { action: "announce", message: "Initiating controlled shutdown sequence...", delay: 0 },
          { action: "disable_chat", message: "Disabling chat interface...", delay: 2000 },
          { action: "stop_tools", message: "Stopping tool processes...", delay: 5000 },
          { action: "close_sessions", message: "Closing LLM sessions...", delay: 8000 },
          { action: "shutdown_websocket", message: "Shutting down communication channels...", delay: 12000 },
          { action: "final_status", message: "All systems secured. Demo complete.", delay: 15000 }
        ],
        investorSignal: "responsibility_and_control"
      },
      
      "full-demo": {
        name: "Complete Investor Demo",
        duration: 180000, // 3 minutes
        description: "Full demonstration combining all sequences",
        steps: [
          // Startup
          { action: "announce", message: "Starting complete Acey demonstration...", delay: 0 },
          { action: "start_llm", message: "Systems initializing...", delay: 3000 },
          { action: "start_tools", message: "Tool systems coming online...", delay: 8000 },
          { action: "enable_chat", message: "Acey fully operational.", delay: 15000 },
          
          // Capabilities
          { action: "explain_capabilities", message: "I coordinate AI tools, data, and workflows under explicit human control.", delay: 25000 },
          { action: "demonstrate_orchestration", message: "Orchestrating external systems safely...", delay: 40000 },
          { action: "show_monitoring", message: "System health and resource monitoring active...", delay: 60000 },
          
          // Safety
          { action: "demonstrate_safety", message: "All operations include safety validation and audit logging.", delay: 80000 },
          { action: "show_rate_limiting", message: "Rate limiting prevents system overload.", delay: 100000 },
          { action: "demonstrate_control", message: "User control maintained at all times.", delay: 120000 },
          
          // Shutdown
          { action: "begin_shutdown", message: "Initiating graceful shutdown...", delay: 150000 },
          { action: "final_status", message: "All systems secured. Thank you for the demonstration.", delay: 170000 }
        ],
        investorSignal: "complete_package"
      }
    };

    this.demoPresets = {
      quick: ["acey-online", "tool-orchestration"],
      standard: ["acey-online", "tool-orchestration", "live-interaction"],
      full: ["acey-online", "tool-orchestration", "live-interaction", "shutdown-sequence"],
      investor: ["full-demo"]
    };
  }

  // Get available demos
  getAvailableDemos() {
    return Object.keys(this.demos).map(key => ({
      id: key,
      name: this.demos[key].name,
      duration: this.demos[key].duration,
      description: this.demos[key].description,
      investorSignal: this.demos[key].investorSignal,
      currentlyRunning: this.currentDemo === key
    }));
  }

  // Start a demo
  async startDemo(demoId, options = {}) {
    if (this.isRunning) {
      return {
        success: false,
        message: "Demo already running",
        currentDemo: this.currentDemo
      };
    }

    const demo = this.demos[demoId];
    if (!demo) {
      return {
        success: false,
        message: `Demo not found: ${demoId}`,
        availableDemos: Object.keys(this.demos)
      };
    }

    this.isRunning = true;
    this.currentDemo = demoId;
    
    try {
      const result = await this.executeDemo(demo, options);
      return result;
    } catch (error) {
      this.isRunning = false;
      this.currentDemo = null;
      return {
        success: false,
        message: `Demo execution failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Execute demo steps
  async executeDemo(demo) {
    const startTime = Date.now();
    const executedSteps = [];
    
    try {
      for (let i = 0; i < demo.steps.length; i++) {
        const step = demo.steps[i];
        
        // Wait for delay
        if (step.delay > 0) {
          await this.delay(step.delay);
        }

        // Execute step
        const stepResult = await this.executeStep(step);
        executedSteps.push({
          step: i + 1,
          action: step.action,
          message: step.message,
          result: stepResult,
          timestamp: Date.now() - startTime
        });

        // Check if demo was stopped
        if (!this.isRunning) {
          break;
        }
      }

      const totalTime = Date.now() - startTime;
      
      // Record demo completion
      this.recordDemoCompletion(demo, executedSteps, totalTime);

      return {
        success: true,
        demoId: this.currentDemo,
        duration: totalTime,
        steps: executedSteps,
        investorSignal: demo.investorSignal,
        message: `Demo completed successfully in ${Math.round(totalTime / 1000)}s`
      };

    } finally {
      this.isRunning = false;
      this.currentDemo = null;
    }
  }

  // Execute individual demo step
  async executeStep(step) {
    switch (step.action) {
      case "announce":
        return this.announceDemo(step.message);
      
      case "start_llm":
        return this.startLLMConnection();
      
      case "start_tools":
        return this.startToolSystems();
      
      case "start_websocket":
        return this.startWebSocket();
      
      case "enable_chat":
        return this.enableChatInterface();
      
      case "status_check":
        return this.performStatusCheck();
      
      case "explain":
        return this.explainSystem(step.message);
      
      case "prepare_action":
        return this.prepareAction();
      
      case "execute_action":
        return this.executeAction();
      
      case "monitor_progress":
        return this.monitorProgress();
      
      case "validate_result":
        return this.validateResult();
      
      case "confirm_completion":
        return this.confirmCompletion();
      
      case "simulate_chat":
        return this.simulateChatInteraction();
      
      case "analyze_request":
        return this.analyzeRequest();
      
      case "generate_response":
        return this.generateResponse();
      
      case "apply_safety":
        return this.applySafetyFilters();
      
      case "deliver_response":
        return this.deliverResponse();
      
      case "rate_limit_check":
        return this.checkRateLimiting();
      
      case "status_update":
        return this.updateStatus();
      
      case "disable_chat":
        return this.disableChatInterface();
      
      case "stop_tools":
        return this.stopToolSystems();
      
      case "close_sessions":
        return this.closeLLMSessions();
      
      case "shutdown_websocket":
        return this.shutdownWebSocket();
      
      case "final_status":
        return this.finalStatus();
      
      case "explain_capabilities":
        return this.explainCapabilities();
      
      case "demonstrate_orchestration":
        return this.demonstrateOrchestration();
      
      case "show_monitoring":
        return this.showMonitoring();
      
      case "demonstrate_safety":
        return this.demonstrateSafety();
      
      case "show_rate_limiting":
        return this.showRateLimiting();
      
      case "demonstrate_control":
        return this.demonstrateControl();
      
      case "begin_shutdown":
        return this.beginShutdown();
      
      default:
        return this.defaultAction(step.message);
    }
  }

  // Demo action implementations
  async announceDemo(message) {
    return {
      success: true,
      action: "announce",
      message,
      timestamp: new Date().toISOString()
    };
  }

  async startLLMConnection() {
    await this.delay(1500); // Simulate connection time
    return {
      success: true,
      action: "start_llm",
      message: "LLM connection established",
      connectionId: "demo-llm-" + Date.now()
    };
  }

  async startToolSystems() {
    await this.delay(1000);
    return {
      success: true,
      action: "start_tools",
      message: "Tool systems initialized",
      toolsStarted: ["demo-tool-1", "demo-tool-2"]
    };
  }

  async startWebSocket() {
    await this.delay(800);
    return {
      success: true,
      action: "start_websocket",
      message: "WebSocket server running",
      port: 8080
    };
  }

  async enableChatInterface() {
    await this.delay(500);
    return {
      success: true,
      action: "enable_chat",
      message: "Chat interface ready",
      interface: "demo-chat"
    };
  }

  async performStatusCheck() {
    await this.delay(1000);
    return {
      success: true,
      action: "status_check",
      message: "All systems operational",
      status: {
        llm: "connected",
        tools: "running",
        websocket: "active",
        chat: "enabled"
      }
    };
  }

  async simulateChatInteraction() {
    await this.delay(2000);
    return {
      success: true,
      action: "simulate_chat",
      message: "Chat interaction processed",
      requestId: "demo-req-" + Date.now(),
      responseTime: 1200
    };
  }

  async analyzeRequest() {
    await this.delay(800);
    return {
      success: true,
      action: "analyze_request",
      message: "Request analysis complete",
      safety: "passed",
      category: "general_inquiry"
    };
  }

  async generateResponse() {
    await this.delay(1500);
    return {
      success: true,
      action: "generate_response",
      message: "Response generated",
      personality: "professional_helpful",
      length: 85
    };
  }

  async applySafetyFilters() {
    await this.delay(600);
    return {
      success: true,
      action: "apply_safety",
      message: "Safety filters applied",
      filters: ["content", "rate_limit", "privacy"]
    };
  }

  async deliverResponse() {
    await this.delay(400);
    return {
      success: true,
      action: "deliver_response",
      message: "Response delivered",
      delivered: true,
      logged: true
    };
  }

  async checkRateLimiting() {
    await this.delay(300);
    return {
      success: true,
      action: "rate_limit_check",
      message: "Rate limiting active",
      limits: { requests: 10, window: 60 },
      current: 3
    };
  }

  async disableChatInterface() {
    await this.delay(500);
    return {
      success: true,
      action: "disable_chat",
      message: "Chat interface disabled"
    };
  }

  async stopToolSystems() {
    await this.delay(800);
    return {
      success: true,
      action: "stop_tools",
      message: "Tool systems stopped"
    };
  }

  async closeLLMSessions() {
    await this.delay(600);
    return {
      success: true,
      action: "close_sessions",
      message: "LLM sessions closed"
    };
  }

  async shutdownWebSocket() {
    await this.delay(400);
    return {
      success: true,
      action: "shutdown_websocket",
      message: "WebSocket server shut down"
    };
  }

  async finalStatus() {
    await this.delay(500);
    return {
      success: true,
      action: "final_status",
      message: "All systems secured",
      shutdownComplete: true
    };
  }

  // Helper methods for other actions
  async explainSystem(message) {
    return { success: true, action: "explain", message };
  }

  async prepareAction() {
    await this.delay(1000);
    return { success: true, action: "prepare_action", message: "Action prepared" };
  }

  async executeAction() {
    await this.delay(2000);
    return { success: true, action: "execute_action", message: "Action executed" };
  }

  async monitorProgress() {
    await this.delay(1500);
    return { success: true, action: "monitor_progress", message: "Progress monitored" };
  }

  async validateResult() {
    await this.delay(800);
    return { success: true, action: "validate_result", message: "Result validated" };
  }

  async confirmCompletion() {
    return { success: true, action: "confirm_completion", message: "Completion confirmed" };
  }

  async updateStatus() {
    return { success: true, action: "status_update", message: "Status updated" };
  }

  async explainCapabilities() {
    return { success: true, action: "explain_capabilities", message: "Capabilities explained" };
  }

  async demonstrateOrchestration() {
    await this.delay(3000);
    return { success: true, action: "demonstrate_orchestration", message: "Orchestration demonstrated" };
  }

  async showMonitoring() {
    await this.delay(2000);
    return { success: true, action: "show_monitoring", message: "Monitoring displayed" };
  }

  async demonstrateSafety() {
    await this.delay(1500);
    return { success: true, action: "demonstrate_safety", message: "Safety demonstrated" };
  }

  async showRateLimiting() {
    await this.delay(1000);
    return { success: true, action: "show_rate_limiting", message: "Rate limiting shown" };
  }

  async demonstrateControl() {
    await this.delay(2000);
    return { success: true, action: "demonstrate_control", message: "Control demonstrated" };
  }

  async beginShutdown() {
    return { success: true, action: "begin_shutdown", message: "Shutdown begun" };
  }

  async defaultAction(message) {
    return { success: true, action: "default", message };
  }

  // Stop current demo
  stopDemo() {
    if (!this.isRunning) {
      return {
        success: false,
        message: "No demo currently running"
      };
    }

    this.isRunning = false;
    const stoppedDemo = this.currentDemo;
    this.currentDemo = null;

    return {
      success: true,
      message: `Demo ${stoppedDemo} stopped`,
      stoppedDemo
    };
  }

  // Run preset demo sequence
  async runPreset(presetName, options = {}) {
    const preset = this.demoPresets[presetName];
    if (!preset) {
      return {
        success: false,
        message: `Preset not found: ${presetName}`,
        availablePresets: Object.keys(this.demoPresets)
      };
    }

    const results = [];
    
    for (const demoId of preset) {
      const result = await this.startDemo(demoId, options);
      results.push(result);
      
      // Wait between demos
      if (demoId !== preset[preset.length - 1]) {
        await this.delay(3000);
      }
    }

    return {
      success: true,
      preset: presetName,
      results,
      message: `Preset ${presetName} completed`
    };
  }

  // Get demo history
  getDemoHistory(limit = 10) {
    return this.demoHistory.slice(-limit).reverse();
  }

  // Record demo completion
  recordDemoCompletion(demo, steps, totalTime) {
    const record = {
      demoName: demo.name,
      duration: totalTime,
      steps: steps.length,
      investorSignal: demo.investorSignal,
      timestamp: new Date().toISOString(),
      completed: this.isRunning === false
    };

    this.demoHistory.push(record);
    
    // Keep history manageable
    if (this.demoHistory.length > 100) {
      this.demoHistory = this.demoHistory.slice(-50);
    }
  }

  // Helper delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get demo statistics
  getDemoStats() {
    const stats = {
      totalDemos: this.demoHistory.length,
      averageDuration: 0,
      mostRunDemo: null,
      investorSignals: {},
      completionRate: 0
    };

    if (this.demoHistory.length > 0) {
      const totalTime = this.demoHistory.reduce((sum, demo) => sum + demo.duration, 0);
      stats.averageDuration = totalTime / this.demoHistory.length;

      const demoCounts = {};
      this.demoHistory.forEach(demo => {
        demoCounts[demo.demoName] = (demoCounts[demo.demoName] || 0) + 1;
      });

      const mostRun = Object.entries(demoCounts).reduce((a, b) => a[1] > b[1] ? a : b);
      stats.mostRunDemo = mostRun[0];

      this.demoHistory.forEach(demo => {
        stats.investorSignals[demo.investorSignal] = (stats.investorSignals[demo.investorSignal] || 0) + 1;
      });

      const completedDemos = this.demoHistory.filter(demo => demo.completed).length;
      stats.completionRate = (completedDemos / this.demoHistory.length) * 100;
    }

    return stats;
  }
}

module.exports = DemoSystem;
