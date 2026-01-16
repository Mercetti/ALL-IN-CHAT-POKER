/**
 * Acey First-Time User Flow - Identity, Capabilities, Control Expectations
 * Gets users understanding Acey in under 60 seconds
 */

class OnboardingFlow {
  constructor() {
    this.currentStep = 0;
    this.completedSteps = [];
    this.userProfile = {
      firstTime: true,
      experience: "beginner",
      interests: [],
      understoodCapabilities: false,
      understandsControl: false
    };

    this.steps = [
      {
        id: "welcome",
        title: "Meet Acey",
        duration: 15000, // 15 seconds
        content: {
          identity: "Hi, I'm Acey.",
          role: "I help streamers, developers, and creators control AI tools in real time.",
          purpose: "I'm not another chatbot - I'm your AI control layer.",
          visual: "acey-avatar-welcome"
        },
        interactions: ["continue", "learn_more"],
        required: true
      },
      {
        id: "capabilities",
        title: "What I Can Do",
        duration: 20000, // 20 seconds
        content: {
          header: "Right now, I can:",
          capabilities: [
            "• Respond live to chat and requests",
            "• Assist with tools and workflows", 
            "• Manage AI systems safely",
            "• Provide status and monitoring"
          ],
          limitations: "I only run when you turn me on.",
          visual: "capabilities-overview"
        },
        interactions: ["continue", "try_demo"],
        required: true
      },
      {
        id: "control",
        title: "You're in Control",
        duration: 15000, // 15 seconds
        content: {
          header: "Your Control Panel:",
          controls: [
            "• Start/Stop Acey anytime",
            "• Choose operating modes",
            "• Monitor resource usage",
            "• Emergency shutdown available"
          ],
          assurance: "I never run without your permission.",
          visual: "control-panel-preview"
        },
        interactions: ["continue", "view_controls"],
        required: true
      },
      {
        id: "modes",
        title: "Operating Modes",
        duration: 20000, // 20 seconds
        content: {
          header: "Choose your mode:",
          modeList: [
            {
              name: "🟢 Live Mode",
              description: "Twitch integration and real-time interaction"
            },
            {
              name: "🔵 Build Mode", 
              description: "Development tools and system management"
            },
            {
              name: "🔴 Offline Mode",
              description: "Everything off - complete privacy"
            }
          ],
          current: "Currently: Offline",
          visual: "mode-selection"
        },
        interactions: ["continue", "select_mode"],
        required: false
      },
      {
        id: "ready",
        title: "Ready to Start",
        duration: 10000, // 10 seconds
        content: {
          header: "You're all set!",
          summary: "Acey is ready when you are.",
          nextSteps: [
            "• Start with Demo Mode to see me in action",
            "• Try Lite Mode for basic assistance",
            "• Explore the control panel"
          ],
          visual: "ready-screen"
        },
        interactions: ["start_demo", "start_lite", "explore"],
        required: false
      }
    ];

    this.userProgress = {
      startTime: null,
      totalTime: 0,
      interactions: 0,
      skippedSteps: [],
      completedOnboarding: false
    };
  }

  // Start onboarding flow
  startOnboarding() {
    this.currentStep = 0;
    this.userProgress.startTime = Date.now();
    this.userProfile.firstTime = true;
    
    return {
      success: true,
      step: this.getCurrentStep(),
      progress: this.getProgress(),
      message: "Welcome to Acey! Let's get you acquainted."
    };
  }

  // Get current step information
  getCurrentStep() {
    if (this.currentStep >= this.steps.length) {
      return null;
    }

    const step = this.steps[this.currentStep];
    return {
      ...step,
      progress: this.getProgress(),
      timeRemaining: step.duration,
      canSkip: !step.required,
      canGoBack: this.currentStep > 0
    };
  }

  // Move to next step
  nextStep(interaction = "continue") {
    if (this.currentStep >= this.steps.length - 1) {
      return this.completeOnboarding();
    }

    this.completedSteps.push(this.currentStep);
    this.userProgress.interactions++;
    this.currentStep++;

    const step = this.getCurrentStep();
    return {
      success: true,
      step,
      progress: this.getProgress(),
      interaction,
      message: this.getStepMessage(interaction)
    };
  }

  // Go back to previous step
  previousStep() {
    if (this.currentStep <= 0) {
      return {
        success: false,
        message: "Already at the first step",
        step: this.getCurrentStep()
      };
    }

    this.currentStep--;
    this.userProgress.interactions++;
    
    return {
      success: true,
      step: this.getCurrentStep(),
      progress: this.getProgress(),
      message: "Going back to previous step"
    };
  }

  // Skip current step (if allowed)
  skipStep() {
    const currentStep = this.steps[this.currentStep];
    
    if (currentStep.required) {
      return {
        success: false,
        message: "This step is required and cannot be skipped",
        step: this.getCurrentStep()
      };
    }

    this.userProgress.skippedSteps.push(this.currentStep);
    return this.nextStep("skipped");
  }

  // Handle user interaction
  handleInteraction(interaction, data = {}) {
    const currentStep = this.steps[this.currentStep];
    
    // Validate interaction
    if (!currentStep.interactions.includes(interaction)) {
      return {
        success: false,
        message: `Invalid interaction: ${interaction}`,
        validInteractions: currentStep.interactions
      };
    }

    // Process specific interactions
    switch (interaction) {
      case "continue":
        return this.nextStep("continue");
      
      case "learn_more":
        return this.showMoreDetails();
      
      case "try_demo":
        return this.startQuickDemo();
      
      case "view_controls":
        return this.showControlPanel();
      
      case "select_mode":
        return this.selectMode(data.mode);
      
      case "start_demo":
        return this.launchDemoMode();
      
      case "start_lite":
        return this.launchLiteMode();
      
      case "explore":
        return this.showExploreOptions();
      
      default:
        return this.nextStep(interaction);
    }
  }

  // Show more details about current step
  showMoreDetails() {
    const currentStep = this.steps[this.currentStep];
    
    const details = {
      welcome: {
        title: "More About Acey",
        content: "I'm designed to be a responsible AI assistant that helps you manage other AI tools and systems safely.",
        points: [
          "I prioritize your control and privacy",
          "I'm transparent about my capabilities",
          "I never run without your permission"
        ]
      },
      capabilities: {
        title: "Technical Capabilities",
        content: "I integrate with various systems and provide intelligent orchestration.",
        points: [
          "Real-time chat and response processing",
          "Tool integration and workflow management",
          "System monitoring and health checks",
          "Resource optimization and safety controls"
        ]
      },
      control: {
        title: "Advanced Controls",
        content: "You have granular control over every aspect of my operation.",
        points: [
          "Resource budgets and performance limits",
          "Feature gating for stability",
          "Emergency shutdown capabilities",
          "Audit logging and transparency"
        ]
      }
    };

    const detailInfo = details[currentStep.id] || {
      title: "Additional Information",
      content: "More details about this step.",
      points: []
    };

    return {
      success: true,
      type: "details",
      data: detailInfo,
      step: this.getCurrentStep(),
      message: "Showing additional details"
    };
  }

  // Start quick demo
  startQuickDemo() {
    return {
      success: true,
      type: "demo_preview",
      data: {
        title: "Quick Demo Preview",
        description: "See how Acey handles a simple request",
        duration: 30000,
        interactive: true
      },
      step: this.getCurrentStep(),
      message: "Loading quick demo..."
    };
  }

  // Show control panel preview
  showControlPanel() {
    return {
      success: true,
      type: "control_preview",
      data: {
        title: "Control Panel Overview",
        sections: [
          "Status Monitoring",
          "Mode Selection", 
          "Resource Usage",
          "Emergency Controls"
        ]
      },
      step: this.getCurrentStep(),
      message: "Showing control panel preview"
    };
  }

  // Select operating mode
  selectMode(mode) {
    const validModes = ["LIVE", "BUILD", "OFFLINE"];
    if (!validModes.includes(mode)) {
      return {
        success: false,
        message: `Invalid mode: ${mode}`,
        validModes
      };
    }

    this.userProfile.preferredMode = mode;
    return {
      success: true,
      selectedMode: mode,
      step: this.getCurrentStep(),
      message: `Mode preference set to ${mode}`
    };
  }

  // Launch demo mode
  launchDemoMode() {
    this.completeOnboarding();
    return {
      success: true,
      type: "launch",
      mode: "DEMO",
      message: "Onboarding complete! Launching Demo Mode..."
    };
  }

  // Launch lite mode
  launchLiteMode() {
    this.completeOnboarding();
    return {
      success: true,
      type: "launch",
      mode: "LITE",
      message: "Onboarding complete! Launching Lite Mode..."
    };
  }

  // Show explore options
  showExploreOptions() {
    this.completeOnboarding();
    return {
      success: true,
      type: "explore",
      options: [
        "View Documentation",
        "Browse Features",
        "Check System Status",
        "Return to Control Panel"
      ],
      message: "Onboarding complete! Choose what to explore next."
    };
  }

  // Complete onboarding
  completeOnboarding() {
    this.userProgress.completedOnboarding = true;
    this.userProgress.totalTime = Date.now() - this.userProgress.startTime;
    this.userProfile.firstTime = false;
    
    return {
      success: true,
      completed: true,
      progress: this.getProgress(),
      userProfile: this.userProfile,
      userProgress: this.userProgress,
      message: "Onboarding completed successfully!"
    };
  }

  // Get current progress
  getProgress() {
    return {
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      completedSteps: this.completedSteps.length,
      percentage: Math.round((this.completedSteps.length / this.steps.length) * 100),
      timeElapsed: this.userProgress.startTime ? Date.now() - this.userProgress.startTime : 0
    };
  }

  // Get step-specific message
  getStepMessage(interaction) {
    const messages = {
      continue: "Moving to next step...",
      learn_more: "Showing additional information...",
      try_demo: "Loading demo preview...",
      view_controls: "Displaying control panel...",
      select_mode: "Mode selected successfully",
      start_demo: "Preparing demo mode...",
      start_lite: "Initializing lite mode...",
      explore: "Ready to explore!",
      skipped: "Step skipped"
    };

    return messages[interaction] || "Processing interaction...";
  }

  // Get onboarding summary
  getSummary() {
    return {
      userProfile: this.userProfile,
      userProgress: this.userProgress,
      stepsCompleted: this.completedSteps.length,
      stepsSkipped: this.userProgress.skippedSteps.length,
      totalTime: this.userProgress.totalTime,
      averageStepTime: this.userProgress.totalTime / Math.max(this.completedSteps.length, 1),
      completionRate: (this.completedSteps.length / this.steps.length) * 100
    };
  }

  // Reset onboarding (for testing or restart)
  resetOnboarding() {
    this.currentStep = 0;
    this.completedSteps = [];
    this.userProfile = {
      firstTime: true,
      experience: "beginner",
      interests: [],
      understoodCapabilities: false,
      understandsControl: false
    };
    this.userProgress = {
      startTime: null,
      totalTime: 0,
      interactions: 0,
      skippedSteps: [],
      completedOnboarding: false
    };

    return {
      success: true,
      message: "Onboarding reset successfully"
    };
  }

  // Check if user has completed onboarding
  hasCompletedOnboarding() {
    return this.userProgress.completedOnboarding;
  }

  // Get recommended next action
  getRecommendedAction() {
    if (!this.hasCompletedOnboarding()) {
      return {
        action: "complete_onboarding",
        reason: "User hasn't completed onboarding yet",
        priority: "high"
      };
    }

    if (this.userProfile.preferredMode) {
      return {
        action: `start_${this.userProfile.preferredMode.toLowerCase()}`,
        reason: "User has preferred mode selected",
        priority: "medium"
      };
    }

    return {
      action: "start_demo",
      reason: "Demo mode recommended for new users",
      priority: "medium"
    };
  }
}

module.exports = OnboardingFlow;
