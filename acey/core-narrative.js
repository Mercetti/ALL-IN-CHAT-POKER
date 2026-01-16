/**
 * Acey Core Narrative - Control Layer Between Humans and AI
 * Defines the story that makes sense and feels inevitable
 */

class CoreNarrative {
  constructor() {
    this.narrative = {
      corePositioning: "Acey is a control layer between humans and AI — not another chatbot.",
      
      fourPartStory: {
        problem: {
          title: "The Problem",
          content: "AI tools are powerful but fragmented, technical, and hard to control in real time.",
          details: [
            "Multiple AI systems require separate interfaces",
            "Real-time control is complex and error-prone", 
            "Safety and oversight are manual and reactive",
            "Resource management is opaque and unpredictable"
          ],
          painPoints: [
            "Cognitive overhead from managing multiple tools",
            "Risk of uncontrolled AI behavior",
            "Difficulty maintaining consistent oversight",
            "Resource waste and system instability"
          ]
        },
        
        insight: {
          title: "The Insight", 
          content: "What's missing isn't intelligence — it's orchestration.",
          details: [
            "Intelligence is abundant - control is scarce",
            "Users need coordination, not more computation",
            "Safety comes from structured oversight",
            "Value is created by intelligent coordination"
          ],
          keyRealizations: [
            "AI tools need a conductor, not more performers",
            "Control is more valuable than raw capability",
            "Human oversight must be built-in, not bolted-on",
            "Systems should be predictable by design"
          ]
        },
        
        solution: {
          title: "The Solution",
          content: "Acey is an AI control center that manages tools, models, and workflows through a single personality-driven interface.",
          details: [
            "Unified interface for multiple AI systems",
            "Real-time orchestration with human oversight",
            "Personality-driven interaction for clarity",
            "Built-in safety and resource management"
          ],
          capabilities: [
            "Coordinates existing AI tools and models",
            "Provides real-time monitoring and control",
            "Maintains audit trails and safety checks",
            "Optimizes resource usage automatically"
          ]
        },
        
        vision: {
          title: "The Vision",
          content: "Eventually, Acey becomes persistent, autonomous, and always-on — but today, she's safe, controlled, and user-driven.",
          details: [
            "Current phase: Controlled, user-driven operation",
            "Next phase: Enhanced automation with oversight",
            "Future vision: Persistent autonomous coordination",
            "Ultimate goal: Invisible AI orchestration"
          ],
          roadmap: [
            "Phase 1: Controlled operation with user approval",
            "Phase 2: Enhanced automation with human veto", 
            "Phase 3: Persistent operation with monitoring",
            "Phase 4: Autonomous coordination with governance"
          ]
        }
      },

      investorMessaging: {
        elevator: "We're not building another AI model - we're building the control layer that makes all AI models safe, predictable, and valuable in production.",
        
        problemSolution: "Companies are drowning in AI tools they can't control. Acey provides the orchestration layer that makes AI investments actually pay off.",
        
        marketOpportunity: "The AI control market is bigger than the AI model market because every AI tool needs a conductor.",
        
        competitiveAdvantage: "While others build smarter models, we build smarter control. Control is more valuable than intelligence when it comes to production AI.",
        
        businessModel: "We sell operational governance as a service - the AI equivalent of air traffic control for autonomous systems.",
        
        team: "We understand that AI safety and control are more important than raw intelligence for enterprise adoption."
      },

      userMessaging: {
        valueProposition: "Acey helps you control AI tools safely and efficiently, so you can focus on results instead of managing complexity.",
        
        benefits: [
          "One interface for all your AI tools",
          "Real-time monitoring and control",
          "Built-in safety and resource management", 
          "Predictable, reliable AI operations"
        ],
        
        differentiation: "Unlike chatbots that just talk, Acey actually coordinates your AI systems and keeps them safe.",
        
        assurance: "You're always in control. Acey never acts without your permission and always explains what she's doing."
      },

      technicalNarrative: {
        architecture: "Acey is designed as a modular orchestration layer that sits above individual AI tools and below user interfaces.",
        
        principles: [
          "Control over capability",
          "Transparency over black boxes", 
          "Predictability over novelty",
          "Safety over speed"
        ],
        
        designDecisions: [
          "Explicit human approval for all actions",
          "Comprehensive audit logging",
          "Resource budgeting and throttling",
          "Graceful degradation under stress"
        ]
      }
    };

    this.messaging = {
      taglines: [
        "AI Control, Not AI Chaos",
        "The Conductor for Your AI Orchestra",
        "Safe AI by Design",
        "Control Your AI, Don't Chase It"
      ],
      
      corePhrases: [
        "control layer between humans and AI",
        "orchestration over intelligence",
        "safety first, autonomy later",
        "predictable AI operations"
      ],
      
      proofPoints: [
        "Controlled startup/shutdown sequences",
        "Feature gating for stability",
        "Performance budgets and monitoring",
        "Comprehensive audit trails",
        "Emergency shutdown capabilities"
      ]
    };
  }

  // Get the complete narrative
  getCompleteNarrative() {
    return {
      positioning: this.narrative.corePositioning,
      story: this.narrative.fourPartStory,
      messaging: this.narrative,
      consistency: this.validateNarrativeConsistency()
    };
  }

  // Get narrative for specific audience
  getNarrativeForAudience(audience) {
    const narratives = {
      investor: {
        positioning: this.narrative.investorMessaging.elevator,
        problem: this.narrative.fourPartStory.problem,
        solution: this.narrative.fourPartStory.solution,
        vision: this.narrative.fourPartStory.vision,
        businessModel: this.narrative.investorMessaging.businessModel,
        marketOpportunity: this.narrative.investorMessaging.marketOpportunity
      },
      
      user: {
        valueProposition: this.narrative.userMessaging.valueProposition,
        benefits: this.narrative.userMessaging.benefits,
        differentiation: this.narrative.userMessaging.differentiation,
        assurance: this.narrative.userMessaging.assurance,
        capabilities: this.narrative.fourPartStory.solution.capabilities
      },
      
      technical: {
        architecture: this.narrative.technicalNarrative.architecture,
        principles: this.narrative.technicalNarrative.principles,
        designDecisions: this.narrative.technicalNarrative.designDecisions,
        implementation: this.getImplementationStory()
      },
      
      founder: {
        mission: "Build the control layer that makes AI safe and valuable in production",
        vision: this.narrative.fourPartStory.vision,
        strategy: "Control over capability, safety over speed",
        differentiation: this.narrative.investorMessaging.competitiveAdvantage
      }
    };

    return narratives[audience] || narratives.founder;
  }

  // Get implementation story
  getImplementationStory() {
    return {
      approach: "We built control first, then intelligence",
      phases: [
        {
          phase: "Foundation",
          focus: "Control systems and safety infrastructure",
          deliverables: [
            "Master controller with startup/shutdown sequences",
            "Feature gating for stability",
            "Performance budgets and monitoring",
            "Soft failure system with graceful degradation"
          ]
        },
        {
          phase: "Interface", 
          focus: "User experience and onboarding",
          deliverables: [
            "Visual consistency and personality",
            "First-time user flow",
            "Operating modes for different use cases",
            "One-click demo system"
          ]
        },
        {
          phase: "Integration",
          focus: "Connecting to existing systems",
          deliverables: [
            "Audio engine integration",
            "Mobile control interface",
            "Demo mode with safety constraints",
            "Investor-ready demonstrations"
          ]
        },
        {
          phase: "Intelligence",
          focus: "Smart orchestration capabilities",
          deliverables: [
            "Advanced tool coordination",
            "Automated workflow management", 
            "Predictive resource optimization",
            "Learning from user patterns"
          ]
        }
      ],
      philosophy: "Every feature is built with control, safety, and clarity as primary requirements"
    };
  }

  // Generate consistent messaging
  generateMessage(context, audience = "general") {
    const messages = {
      introduction: {
        investor: this.narrative.investorMessaging.elevator,
        user: this.narrative.userMessaging.valueProposition,
        technical: this.narrative.technicalNarrative.architecture,
        general: this.narrative.corePositioning
      },
      
      problem: {
        investor: this.narrative.investorMessaging.problemSolution,
        user: "Managing multiple AI tools is complex and risky",
        technical: "Fragmented AI systems lack unified control",
        general: this.narrative.fourPartStory.problem.content
      },
      
      solution: {
        investor: this.narrative.investorMessaging.competitiveAdvantage,
        user: this.narrative.userMessaging.differentiation,
        technical: this.narrative.technicalNarrative.principles.join(", "),
        general: this.narrative.fourPartStory.solution.content
      },
      
      vision: {
        investor: this.narrative.fourPartStory.vision.content,
        user: "AI that works for you, safely and predictably",
        technical: "Autonomous coordination with human governance",
        general: this.narrative.fourPartStory.vision.content
      }
    };

    const baseMessage = messages[context] && messages[context][audience] 
      ? messages[context][audience] 
      : this.narrative.corePositioning;

    return {
      message: baseMessage,
      context,
      audience,
      consistency: this.validateMessageConsistency(baseMessage)
    };
  }

  // Get key talking points
  getTalkingPoints(format = "bullets") {
    const points = {
      core: [
        "Acey is a control layer, not another AI model",
        "We solve AI control, not AI intelligence", 
        "Safety and control are built-in, not bolted-on",
        "Users are always in control with full oversight"
      ],
      
      market: [
        "AI control market is bigger than AI model market",
        "Every AI tool needs a conductor",
        "Enterprise adoption requires control, not just capability",
        "Production AI needs operational governance"
      ],
      
      differentiation: [
        "Control over capability",
        "Transparency over black boxes",
        "Predictability over novelty", 
        "Safety over speed"
      ],
      
      proof: [
        "Controlled startup/shutdown sequences",
        "Feature gating prevents instability",
        "Performance budgets prevent resource spikes",
        "Comprehensive audit trails and monitoring"
      ]
    };

    if (format === "narrative") {
      return Object.keys(points).map(category => ({
        category,
        points: points[category]
      }));
    }

    return points;
  }

  // Validate narrative consistency
  validateNarrativeConsistency() {
    const coreThemes = ["control", "safety", "orchestration", "human-oversight"];
    const narrative = this.narrative;
    
    const consistency = {
      themes: {},
      score: 0,
      issues: []
    };

    coreThemes.forEach(theme => {
      const themeCount = this.countThemeOccurrences(narrative, theme);
      consistency.themes[theme] = themeCount;
      consistency.score += themeCount;
    });

    // Check for contradictions
    if (this.hasContradictions(narrative)) {
      consistency.issues.push("Found contradictory messaging");
    }

    consistency.valid = consistency.issues.length === 0;
    consistency.strength = consistency.score > 10 ? "strong" : "moderate";

    return consistency;
  }

  // Count theme occurrences in narrative
  countThemeOccurrences(narrative, theme) {
    let count = 0;
    const narrativeText = JSON.stringify(narrative).toLowerCase();
    
    const themeWords = theme.split("-");
    themeWords.forEach(word => {
      const regex = new RegExp(word, "gi");
      const matches = narrativeText.match(regex);
      count += matches ? matches.length : 0;
    });

    return count;
  }

  // Check for narrative contradictions
  hasContradictions(narrative) {
    const contradictions = [
      { term1: "autonomous", term2: "control" },
      { term1: "uncontrolled", term2: "safety" },
      { term1: "black-box", term2: "transparency" }
    ];

    const narrativeText = JSON.stringify(narrative).toLowerCase();
    
    return contradictions.some(pair => {
      const term1Count = (narrativeText.match(new RegExp(pair.term1, "gi")) || []).length;
      const term2Count = (narrativeText.match(new RegExp(pair.term2, "gi")) || []).length;
      return term1Count > 0 && term2Count > 0;
    });
  }

  // Validate message consistency
  validateMessageConsistency(message) {
    const coreNarrative = this.narrative.corePositioning.toLowerCase();
    const messageText = message.toLowerCase();
    
    const consistencyScore = this.calculateConsistencyScore(coreNarrative, messageText);
    
    return {
      score: consistencyScore,
      consistent: consistencyScore > 0.5,
      recommendation: consistencyScore > 0.5 ? "Good alignment" : "Consider aligning with core narrative"
    };
  }

  // Calculate consistency score
  calculateConsistencyScore(narrative, message) {
    const narrativeWords = narrative.split(" ");
    const messageWords = message.split(" ");
    
    let matches = 0;
    narrativeWords.forEach(nWord => {
      if (messageWords.some(mWord => mWord.includes(nWord) || nWord.includes(mWord))) {
        matches++;
      }
    });

    return matches / Math.max(narrativeWords.length, 1);
  }

  // Get brand voice guidelines
  getBrandVoice() {
    return {
      personality: "Professional yet approachable",
      tone: "Confident but humble",
      characteristics: [
        "Clear and direct",
        "Transparent about limitations",
        "Focused on control and safety",
        "Respectful of user intelligence"
      ],
      avoid: [
        "Overpromising capabilities",
        "Technical jargon without explanation",
        "Hype or exaggeration",
        "Minimizing safety considerations"
      ],
      keyPhrases: this.messaging.corePhrases,
      taglines: this.messaging.taglines
    };
  }

  // Get proof points and validation
  getProofPoints() {
    return {
      implemented: this.messaging.proofPoints,
      validation: [
        "Controlled startup/shutdown sequences prove operational maturity",
        "Feature gating demonstrates responsible development",
        "Performance budgets show cost awareness",
        "Soft failures display operational intelligence",
        "Visual consistency indicates product polish"
      ],
      investorSignals: [
        "Stability over reckless autonomy",
        "Control over raw capability",
        "Transparency over black boxes",
        "Safety over speed to market"
      ]
    };
  }
}

module.exports = CoreNarrative;
