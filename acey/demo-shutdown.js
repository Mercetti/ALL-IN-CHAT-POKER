/**
 * Demo 4: Responsible Shutdown - Proving Control and Responsibility
 * Demonstrates controlled shutdown sequence with proper resource cleanup
 */

class DemoShutdown {
  constructor() {
    this.isRunning = false;
    this.currentStep = 0;
    this.startTime = null;
    this.systemStatus = {
      llm: "connected",
      tools: "ready",
      websocket: "active",
      chat: "enabled",
      monitoring: "active"
    };
    
    this.steps = [
      {
        id: "announce_shutdown",
        title: "Announcing Shutdown",
        duration: 2000,
        message: "Initiating controlled shutdown sequence...",
        action: "announce_shutdown",
        type: "announcement"
      },
      {
        id: "disable_chat",
        title: "Disabling Chat Interface",
        duration: 2000,
        message: "Disabling chat interface...",
        action: "disable_chat",
        type: "chat_shutdown"
      },
      {
        id: "stop_tools",
        title: "Stopping Tool Processes",
        duration: 3000,
        message: "Stopping tool processes...",
        action: "stop_tools",
        type: "tools_shutdown"
      },
      {
        id: "close_sessions",
        title: "Closing LLM Sessions",
        duration: 2500,
        message: "Closing LLM sessions...",
        action: "close_sessions",
        type: "llm_shutdown"
      },
      {
        id: "shutdown_websocket",
        title: "Shutting Down Communication",
        duration: 2000,
        message: "Shutting down communication channels...",
        action: "shutdown_websocket",
        type: "websocket_shutdown"
      },
      {
        id: "stop_monitoring",
        title: "Stopping Monitoring",
        duration: 2000,
        message: "Stopping system monitoring...",
        action: "stop_monitoring",
        type: "monitoring_shutdown"
      },
      {
        id: "save_state",
        title: "Saving System State",
        duration: 3000,
        message: "Saving system state and audit logs...",
        action: "save_state",
        type: "state_preservation"
      },
      {
        id: "cleanup_resources",
        title: "Cleaning Up Resources",
        duration: 2000,
        message: "Cleaning up allocated resources...",
        action: "cleanup_resources",
        type: "resource_cleanup"
      },
      {
        id: "final_verification",
        title: "Final Verification",
        duration: 2000,
        message: "Verifying all systems are properly shut down...",
        action: "final_verification",
        type: "verification"
      },
      {
        id: "final_status",
        title: "Final Status",
        duration: 2000,
        message: "All systems secured. Demo complete.",
        action: "final_status",
        type: "completion"
      }
    ];

    this.investorSignals = {
      responsibility: "Shows controlled shutdown with proper cleanup",
      safety: "Demonstrates data preservation and security",
      professionalism: "Systematic approach to resource management",
      control: "User maintains oversight throughout process"
    };

    this.shutdownMetrics = {
      sessions_closed: 0,
      resources_freed: 0,
      data_saved: 0,
      audit_entries: 0
    };
  }

  // Start the demo
  async startDemo() {
    if (this.isRunning) {
      return {
        success: false,
        message: "Demo already running",
        currentStep: this.currentStep
      };
    }

    this.isRunning = true;
    this.currentStep = 0;
    this.startTime = Date.now();
    
    try {
      const result = await this.executeDemo();
      return result;
    } catch (error) {
      this.isRunning = false;
      return {
        success: false,
        message: `Demo failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Execute all demo steps
  async executeDemo() {
    const executedSteps = [];
    
    for (let i = 0; i < this.steps.length; i++) {
      if (!this.isRunning) break;
      
      const step = this.steps[i];
      this.currentStep = i;
      
      const stepResult = await this.executeStep(step);
      executedSteps.push({
        step: i + 1,
        id: step.id,
        title: step.title,
        message: step.message,
        type: step.type,
        result: stepResult,
        timestamp: Date.now() - this.startTime,
        systemStatus: { ...this.systemStatus }
      });

      // Update system status based on step
      this.updateSystemStatus(step.type);
    }

    const totalTime = Date.now() - this.startTime;
    this.isRunning = false;

    return {
      success: true,
      demoName: "Responsible Shutdown",
      duration: totalTime,
      steps: executedSteps,
      finalStatus: {
        systemStatus: this.systemStatus,
        shutdownMetrics: this.shutdownMetrics,
        allSystemsSecured: this.verifyAllSystemsShutdown()
      },
      investorSignals: this.investorSignals,
      message: `Demo completed in ${Math.round(totalTime / 1000)}s`
    };
  }

  // Execute individual step
  async executeStep(step) {
    console.log(`[DEMO] Step ${step.id}: ${step.title}`);
    
    switch (step.action) {
      case "announce_shutdown":
        return this.announceShutdown();
      
      case "disable_chat":
        return this.disableChat();
      
      case "stop_tools":
        return this.stopTools();
      
      case "close_sessions":
        return this.closeSessions();
      
      case "shutdown_websocket":
        return this.shutdownWebSocket();
      
      case "stop_monitoring":
        return this.stopMonitoring();
      
      case "save_state":
        return this.saveState();
      
      case "cleanup_resources":
        return this.cleanupResources();
      
      case "final_verification":
        return this.finalVerification();
      
      case "final_status":
        return this.finalStatus();
      
      default:
        return this.defaultAction(step);
    }
  }

  // Step implementations
  async announceShutdown() {
    await this.delay(2000);
    
    return {
      success: true,
      action: "announce_shutdown",
      message: "Initiating controlled shutdown sequence...",
      details: {
        shutdown_type: "controlled",
        reason: "demo_completion",
        safety_level: "maximum",
        data_preservation: "enabled"
      }
    };
  }

  async disableChat() {
    await this.delay(2000);
    this.systemStatus.chat = "disabling";
    
    return {
      success: true,
      action: "disable_chat",
      message: "Disabling chat interface...",
      details: {
        interface: "demo-chat",
        status: "disabling",
        active_sessions: 3,
        graceful_shutdown: true
      }
    };
  }

  async stopTools() {
    await this.delay(3000);
    this.systemStatus.tools = "stopping";
    this.shutdownMetrics.resources_freed += 5;
    
    return {
      success: true,
      action: "stop_tools",
      message: "Stopping tool processes...",
      details: {
        tools_stopping: ["code_analyzer", "file_manager", "system_monitor"],
        processes_terminated: 5,
        memory_freed: "256MB",
        status: "stopping"
      }
    };
  }

  async closeSessions() {
    await this.delay(2500);
    this.systemStatus.llm = "disconnecting";
    this.shutdownMetrics.sessions_closed += 3;
    
    return {
      success: true,
      action: "close_sessions",
      message: "Closing LLM sessions...",
      details: {
        sessions_closing: 3,
        provider: "demo-llm",
        connection_type: "encrypted",
        data_preserved: true
      }
    };
  }

  async shutdownWebSocket() {
    await this.delay(2000);
    this.systemStatus.websocket = "shutting_down";
    
    return {
      success: true,
      action: "shutdown_websocket",
      message: "Shutting down communication channels...",
      details: {
        protocol: "wss",
        port: 8080,
        connections_closed: 2,
        graceful_shutdown: true
      }
    };
  }

  async stopMonitoring() {
    await this.delay(2000);
    this.systemStatus.monitoring = "stopping";
    
    return {
      success: true,
      action: "stop_monitoring",
      message: "Stopping system monitoring...",
      details: {
        monitoring_stopped: ["cpu", "memory", "tokens", "connections"],
        final_metrics_saved: true,
        status: "stopping"
      }
    };
  }

  async saveState() {
    await this.delay(3000);
    this.shutdownMetrics.data_saved += 1250;
    this.shutdownMetrics.audit_entries += 47;
    
    return {
      success: true,
      action: "save_state",
      message: "Saving system state and audit logs...",
      details: {
        state_saved: {
          timestamp: new Date().toISOString(),
          session_duration: Date.now() - this.startTime,
          total_interactions: 12,
          performance_metrics: true
        },
        audit_logs: {
          entries_saved: 47,
          time_range: "full_session",
          integrity_check: "passed"
        },
        data_preserved: "1250KB"
      }
    };
  }

  async cleanupResources() {
    await this.delay(2000);
    this.shutdownMetrics.resources_freed += 15;
    
    return {
      success: true,
      action: "cleanup_resources",
      message: "Cleaning up allocated resources...",
      details: {
        cleanup: {
          memory_freed: "512MB",
          temp_files_removed: 23,
          connections_closed: 5,
          caches_cleared: true
        },
        resource_recovery: "98%",
        environmental_impact: "minimal"
      }
    };
  }

  async finalVerification() {
    await this.delay(2000);
    
    return {
      success: true,
      action: "final_verification",
      message: "Verifying all systems are properly shut down...",
      details: {
        verification: {
          llm_sessions: "closed",
          tool_processes: "terminated",
          websockets: "shutdown",
          monitoring: "stopped",
          data_preserved: "confirmed"
        },
        security_check: "passed",
        compliance_check: "passed"
      }
    };
  }

  async finalStatus() {
    await this.delay(2000);
    
    return {
      success: true,
      action: "final_status",
      message: "All systems secured. Demo complete.",
      details: {
        completion: {
          status: "completed_successfully",
          total_time: Date.now() - this.startTime,
          shutdown_type: "controlled_responsible",
          user_control: "maintained"
        },
        final_metrics: this.shutdownMetrics,
        investor_signals: this.investorSignals,
        next_actions: ["await_restart", "maintain_logs", "ready_for_next_session"]
      }
    };
  }

  async defaultAction(step) {
    await this.delay(step.duration);
    return {
      success: true,
      action: step.action,
      message: step.message,
      details: { executed: true }
    };
  }

  // Update system status based on step type
  updateSystemStatus(stepType) {
    switch (stepType) {
      case "chat_shutdown":
        this.systemStatus.chat = "disabled";
        break;
      case "tools_shutdown":
        this.systemStatus.tools = "stopped";
        break;
      case "llm_shutdown":
        this.systemStatus.llm = "disconnected";
        break;
      case "websocket_shutdown":
        this.systemStatus.websocket = "offline";
        break;
      case "monitoring_shutdown":
        this.systemStatus.monitoring = "offline";
        break;
    }
  }

  // Verify all systems are properly shut down
  verifyAllSystemsShutdown() {
    return Object.values(this.systemStatus).every(status => 
      status === "disabled" || status === "stopped" || 
      status === "disconnected" || status === "offline"
    );
  }

  // Stop the demo
  stopDemo() {
    if (!this.isRunning) {
      return {
        success: false,
        message: "Demo not currently running"
      };
    }

    this.isRunning = false;
    return {
      success: true,
      message: "Demo stopped by user",
      step: this.currentStep,
      systemStatus: this.systemStatus
    };
  }

  // Get current demo status
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      progress: Math.round((this.currentStep / this.steps.length) * 100),
      systemStatus: this.systemStatus,
      shutdownMetrics: this.shutdownMetrics,
      startTime: this.startTime,
      elapsed: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  // Get demo information
  getDemoInfo() {
    return {
      name: "Responsible Shutdown",
      description: "Proves control and responsibility through proper shutdown sequence",
      duration: this.steps.reduce((sum, step) => sum + step.duration, 0),
      steps: this.steps.map(step => ({
        id: step.id,
        title: step.title,
        type: step.type,
        duration: step.duration
      })),
      investorSignals: this.investorSignals,
      features: [
        "Controlled shutdown sequence",
        "Proper resource cleanup",
        "Data preservation and audit logging",
        "System verification and security checks",
        "User control throughout process"
      ]
    };
  }

  // Helper delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DemoShutdown;
