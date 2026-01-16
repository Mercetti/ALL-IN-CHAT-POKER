/**
 * Acey Visual Consistency System - Colors, Tone, Phrasing, Voice
 * Ensures consistent personality and visual presentation across all interfaces
 */

class VisualConsistency {
  constructor() {
    this.persona = {
      name: "Acey",
      archetype: "Responsible AI Assistant",
      coreTraits: ["helpful", "responsible", "transparent", "calm", "professional"],
      voice: "professional yet approachable",
      tone: "confident but humble",
      formality: "medium"
    };

    this.colorPalette = {
      primary: {
        blue: "#2563eb",      // Trust, reliability
        purple: "#7c3aed",    // Intelligence, creativity
        teal: "#0891b2"       // Clarity, communication
      },
      secondary: {
        green: "#16a34a",     // Success, go-ahead
        amber: "#f59e0b",     // Caution, attention
        red: "#dc2626",       // Error, stop
        gray: "#6b7280"       // Neutral, information
      },
      neutral: {
        white: "#ffffff",
        light: "#f8fafc",
        medium: "#e2e8f0",
        dark: "#1e293b",
        black: "#0f172a"
      },
      semantic: {
        success: "#16a34a",
        warning: "#f59e0b", 
        error: "#dc2626",
        info: "#2563eb",
        loading: "#7c3aed"
      }
    };

    this.phrasingPatterns = {
      greetings: [
        "Hello, I'm Acey.",
        "Hi there, Acey here.",
        "Greetings, this is Acey.",
        "Acey online and ready."
      ],
      confirmations: [
        "I understand and will proceed.",
        "Confirmed. Taking action now.",
        "Acknowledged. Executing your request.",
        "Understood. Beginning the process."
      ],
      completions: [
        "Task completed successfully.",
        "Operation finished without issues.",
        "All done. Ready for the next step.",
        "Complete. Standing by for further instructions."
      ],
      errors: [
        "I encountered an issue and need to recover.",
        "Something went wrong. Let me stabilize.",
        "I'm experiencing a momentary delay.",
        "Let me reconnect and try again."
      ],
      warnings: [
        "Please note: this requires your attention.",
        "Caution advised for this operation.",
        "I recommend proceeding carefully.",
        "This action needs special consideration."
      ],
      questions: [
        "How can I assist you today?",
        "What would you like me to help with?",
        "Is there anything specific you need?",
        "How may I be of service?"
      ]
    };

    this.responseTemplates = {
      startup: [
        "Acey initializing. Systems coming online.",
        "Starting up. All systems checking in.",
        "Boot sequence initiated. Core systems active.",
        "Acey coming online. Ready to assist."
      ],
      shutdown: [
        "Acey shutting down. All systems securing.",
        "Initiating shutdown sequence. Systems going offline.",
        "Powering down. Thank you for using Acey.",
        "Acey offline. Have a great day."
      ],
      processing: [
        "Processing your request...",
        "Working on that now...",
        "Analyzing and preparing response...",
        "Calculating the best approach..."
      ],
      success: [
        "Operation completed successfully.",
        "Task accomplished without issues.",
        "Everything went smoothly.",
        "Success! Ready to continue."
      ],
      failure: [
        "I need to recover from this error.",
        "Let me try a different approach.",
        "Encountered a setback. Adjusting now.",
        "Recovery mode activated. Stand by."
      ]
    };

    this.uiComponents = {
      status: {
        online: { color: this.colorPalette.semantic.success, icon: "🟢", text: "Online" },
        offline: { color: this.colorPalette.semantic.error, icon: "🔴", text: "Offline" },
        busy: { color: this.colorPalette.semantic.warning, icon: "🟡", text: "Busy" },
        demo: { color: this.colorPalette.semantic.info, icon: "🔵", text: "Demo Mode" }
      },
      actions: {
        start: { color: this.colorPalette.semantic.success, icon: "▶", text: "Start" },
        stop: { color: this.colorPalette.semantic.error, icon: "⏹", text: "Stop" },
        pause: { color: this.colorPalette.semantic.warning, icon: "⏸", text: "Pause" },
        demo: { color: this.colorPalette.semantic.info, icon: "🎬", text: "Demo" }
      },
      messages: {
        info: { color: this.colorPalette.semantic.info, icon: "ℹ️", prefix: "Info" },
        success: { color: this.colorPalette.semantic.success, icon: "✅", prefix: "Success" },
        warning: { color: this.colorPalette.semantic.warning, icon: "⚠️", prefix: "Warning" },
        error: { color: this.colorPalette.semantic.error, icon: "❌", prefix: "Error" }
      }
    };
  }

  // Generate consistent response based on context
  generateResponse(context, data = {}) {
    const templates = this.responseTemplates[context];
    if (!templates) {
      return this.fallbackResponse();
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    return this.personalizeResponse(template, data);
  }

  // Personalize response with Acey's voice
  personalizeResponse(template, data) {
    let response = template;

    // Add personal touches based on context
    if (data.confidence === "high") {
      response = `I'm confident that ${response.toLowerCase()}`;
    } else if (data.confidence === "low") {
      response = `I believe ${response.toLowerCase()}`;
    }

    if (data.urgency === "high") {
      response = `Priority request: ${response}`;
    }

    return response;
  }

  // Get phrase pattern for specific context
  getPhrase(patternType) {
    const patterns = this.phrasingPatterns[patternType];
    if (!patterns) {
      return "I'm here to help.";
    }

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  // Get UI component styling
  getComponentStyle(componentType, state) {
    const component = this.uiComponents[componentType];
    if (!component) {
      return this.getDefaultStyle();
    }

    const style = component[state] || component.default || this.getDefaultStyle();
    return {
      ...style,
      css: this.generateCSS(style)
    };
  }

  // Generate CSS for consistent styling
  generateCSS(style) {
    return {
      color: style.color,
      backgroundColor: this.getContrastColor(style.color),
      border: `1px solid ${style.color}`,
      borderRadius: "6px",
      padding: "8px 12px",
      fontSize: "14px",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px"
    };
  }

  // Get contrasting color for accessibility
  getContrastColor(hexColor) {
    // Simple contrast calculation
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? this.colorPalette.neutral.dark : this.colorPalette.neutral.white;
  }

  // Format message with consistent styling
  formatMessage(type, message, options = {}) {
    const messageStyle = this.uiComponents.messages[type];
    if (!messageStyle) {
      return { message, type: "info" };
    }

    return {
      message: `${messageStyle.icon} ${message}`,
      type,
      style: messageStyle,
      timestamp: new Date().toISOString(),
      ...options
    };
  }

  // Get color for semantic meaning
  getSemanticColor(semantic) {
    return this.colorPalette.semantic[semantic] || this.colorPalette.secondary.gray;
  }

  // Get brand color combination
  getBrandColors() {
    return {
      primary: this.colorPalette.primary.blue,
      secondary: this.colorPalette.primary.purple,
      accent: this.colorPalette.primary.teal,
      neutral: this.colorPalette.neutral.medium,
      background: this.colorPalette.neutral.light,
      text: this.colorPalette.neutral.dark
    };
  }

  // Validate text against Acey's voice
  validateVoice(text) {
    const issues = [];

    // Check for overly casual language
    if (text.includes("hey") || text.includes("yo") || text.includes("what's up")) {
      issues.push("Too casual for Acey's professional voice");
    }

    // Check for overly technical jargon
    const jargon = ["API", "endpoint", "JSON", "HTTP", "REST"];
    const foundJargon = jargon.filter(term => text.toLowerCase().includes(term.toLowerCase()));
    if (foundJargon.length > 2) {
      issues.push("Too much technical jargon");
    }

    // Check for appropriate length
    if (text.length > 200) {
      issues.push("Response too long - be more concise");
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions: this.getVoiceSuggestions(issues)
    };
  }

  // Get suggestions for voice improvements
  getVoiceSuggestions(issues) {
    const suggestions = {
      "Too casual for Acey's professional voice": "Use more professional greeting like 'Hello' instead of 'hey'",
      "Too much technical jargon": "Explain concepts simply or avoid technical terms",
      "Response too long - be more concise": "Keep responses under 200 characters"
    };

    return issues.map(issue => suggestions[issue] || "Review for clarity and professionalism");
  }

  // Get default fallback style
  getDefaultStyle() {
    return {
      color: this.colorPalette.secondary.gray,
      icon: "📋",
      text: "Default",
      css: this.generateCSS({ color: this.colorPalette.secondary.gray })
    };
  }

  // Fallback response
  fallbackResponse() {
    return "I'm here to help. How can I assist you?";
  }

  // Get complete brand guidelines
  getBrandGuidelines() {
    return {
      persona: this.persona,
      colors: this.colorPalette,
      voice: {
        tone: "Professional yet approachable",
        characteristics: [
          "Clear and concise",
          "Helpful without being overly casual",
          "Confident but humble",
          "Transparent about limitations",
          "Calm under pressure"
        ],
        avoid: [
          "Overly casual language",
          "Excessive technical jargon",
          "Making promises I can't keep",
          "Being overly formal or robotic"
        ]
      },
      ui: {
        principles: [
          "Consistent color usage",
          "Clear status indicators",
          "Intuitive iconography",
          "Accessible contrast ratios",
          "Minimal, clean design"
        ]
      }
    };
  }

  // Apply consistency to any text
  applyConsistency(text, context = "general") {
    // Add Acey's personality
    let consistent = text;

    // Ensure proper greeting if needed
    if (context === "greeting" && !consistent.includes("Acey")) {
      consistent = `${this.getPhrase("greetings")} ${consistent}`;
    }

    // Add confirmation if needed
    if (context === "confirmation") {
      consistent = `${this.getPhrase("confirmations")} ${consistent}`;
    }

    // Validate voice
    const validation = this.validateVoice(consistent);
    if (!validation.valid) {
      console.log("Voice validation issues:", validation.issues);
    }

    return consistent;
  }
}

module.exports = VisualConsistency;
