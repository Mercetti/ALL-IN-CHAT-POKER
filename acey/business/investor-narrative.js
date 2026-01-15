/**
 * Acey Investor Narrative & Business Model
 * Founder-ready positioning and market analysis
 */

const ACEY_INVESTOR_NARRATIVE = {
  version: "1.0.0",
  tagline: "Operational Governance as a Product",
  
  // Executive Summary
  elevator: {
    problem: "Creator and partner-driven platforms fail not because of growth — but because financial operations don't scale.",
    solution: "Acey is an AI-governed financial intelligence layer that sits between revenue, partners, legal obligations, and investors.",
    differentiation: "Acey doesn't replace humans. Acey removes ambiguity."
  },

  // Market Problem
  problem: {
    title: "Financial Operations Break Under Scale",
    painPoints: [
      "Manual payouts create errors and disputes",
      "Opaque revenue splits damage partner trust", 
      "Investor reporting requires manual aggregation",
      "Legal compliance becomes guesswork",
      "Founder becomes bottleneck for financial decisions"
    ],
    currentSolutions: [
      "Spreadsheets (error-prone)",
      "Human approvals (slow, biased)",
      "Legal guesswork (risky)",
      "Custom accounting software (expensive, inflexible)"
    ],
    marketSize: {
      creatorEconomy: "$104B global market",
      saasFinancialOps: "$15B growing 28% YoY",
      addressableMarket: "$2.5B initial TAM"
    }
  },

  // Solution Architecture
  solution: {
    layers: [
      {
        name: "AI Control Center",
        function: "Skills, permissions, memory management",
        value: "Governed AI with human oversight"
      },
      {
        name: "Revenue & Partner Engine", 
        function: "Automated payouts, trust scoring",
        value: "Financial operations without manual errors"
      },
      {
        name: "Governance Layer",
        function: "SOC-lite compliance, audit trails",
        value: "Investor-ready transparency"
      },
      {
        name: "Skill Marketplace",
        function: "Tiered, permission-gated AI capabilities",
        value: "Scalable intelligence platform"
      }
    ],
    keyDifferentiators: [
      "Permission-aware AI respects role boundaries",
      "Read-only legal intelligence (no liability creep)",
      "Trust-based automation with human approval gates",
      "White-label by design (infrastructure, not branding)",
      "Self-hostable future (no long-term dependency risk)"
    ]
  },

  // Business Model
  businessModel: {
    revenueStreams: [
      {
        name: "Tiered Subscriptions",
        description: "Core → Pro → Enterprise pricing ladder",
        margins: "85% gross margin on software",
        retention: "95% annual retention (high switching costs)"
      },
      {
        name: "Skill Economy",
        description: "Pay-per-skill and bundled marketplace",
        margins: "70% margin on marketplace sales",
        networkEffect: "More skills = more value"
      },
      {
        name: "Enterprise Services",
        description: "Custom deployments, compliance support",
        margins: "60% margin on services",
        upsellPath: "Self-hosting and SLA guarantees"
      }
    ],
    pricingStrategy: {
      core: "$499-999/mo - Small platforms",
      pro: "$2,500-5,000/mo - Mid-size platforms", 
      enterprise: "$10,000+/mo - Large platforms",
      expansion: "Data gravity creates contractual lock-in"
    }
  },

  // Market Timing
  timing: {
    whyNow: [
      "Creator economies are maturing rapidly",
      "Regulators & investors demand transparency",
      "AI has matured enough to summarize — not decide",
      "Enterprise needs governance-first AI solutions"
    ],
    marketSignals: [
      "SOC compliance becoming standard for SaaS",
      "Creator platforms hitting scaling walls",
      "Investors requiring audit-ready financial systems",
      "AI governance regulations emerging"
    ]
  },

  // Competitive Moat
  moat: {
    primary: [
      "Governance-first AI architecture",
      "Skill-based permission system",
      "Human + AI co-governance model",
      "Platform-agnostic, self-hostable design"
    ],
    secondary: [
      "Data gravity from financial operations",
      "Network effects from skill marketplace",
      "Regulatory compliance head start",
      "White-label enterprise relationships"
    ]
  },

  // Traction & Milestones
  traction: {
    current: [
      "Live Twitch integration with real-time revenue capture",
      "Mobile control center deployed",
      "Partner payout workflows operational",
      "Modular skill architecture proven"
    ],
    milestones: [
      "Q1 2026: Enterprise pilot with 3 platforms",
      "Q2 2026: Skill marketplace launch",
      "Q3 2026: SOC-lite certification",
      "Q4 2026: Self-hosting option release"
    ]
  },

  // Team & Vision
  team: {
    founder: "Solo technical founder with full-stack expertise",
    vision: "Make operational governance accessible to every creator platform",
    mission: "Eliminate founder bottleneck through intelligent automation"
  },

  // The Ask
  ask: {
    amount: "$2M seed round",
    use: [
      "Harden enterprise features ($800k)",
      "Expand skill marketplace ($500k)", 
      "Support self-hosting roadmap ($400k)",
      "Sales & marketing ($300k)"
    ],
    runway: "24 months to profitability",
    valuation: "$12M pre-money"
  },

  // Investment Risks
  risks: [
    {
      risk: "AI regulation changes",
      mitigation: "Governance-first design, human-in-loop"
    },
    {
      risk: "Competition from established players",
      mitigation: "First-mover in AI-governed financial ops"
    },
    {
      risk: "Platform dependency (Twitch, etc.)",
      mitigation: "Platform-agnostic architecture"
    }
  ],

  // Exit Strategy
  exit: [
    "Acquisition by Stripe/PayPal (financial infrastructure)",
    "Acquisition by Salesforce/HubSpot (CRM integration)",
    "Acquisition by major creator platform (Discord, YouTube)",
    "IPO as category leader in AI governance"
  ]
};

// Investor pitch helper functions
class InvestorNarrativeHelper {
  constructor() {
    this.narrative = ACEY_INVESTOR_NARRATIVE;
  }

  // Generate elevator pitch
  getElevatorPitch() {
    const { problem, solution, tagline } = this.narrative.elevator;
    return `${tagline}. ${problem} ${solution}`;
  }

  // Calculate market opportunity
  getMarketOpportunity() {
    const { marketSize } = this.narrative.problem;
    const { pricingStrategy } = this.narrative.businessModel;
    
    return {
      tam: marketSize.addressableMarket,
      sam: marketSize.saasFinancialOps,
      som: marketSize.creatorEconomy * 0.01, // 1% capture
      pricingLadder: Object.values(pricingStrategy)
    };
  }

  // Generate competitive positioning
  getCompetitivePositioning() {
    return {
      acey: this.narrative.moat.primary,
      competitors: {
        spreadsheets: "Manual, error-prone, no governance",
        accountingSoftware: "Expensive, inflexible, not AI-native",
        customSolutions: "High development cost, maintenance burden"
      }
    };
  }

  // Generate financial projections (simplified)
  getFinancialProjections() {
    const projections = [];
    const baseArr = 50; // Starting ARR
    
    for (let year = 1; year <= 5; year++) {
      const growth = year <= 2 ? 3.5 : 2.2; // 350% Y1-2, 220% Y3-5
      const arr = baseArr * Math.pow(growth, year - 1);
      
      projections.push({
        year,
        arr: Math.round(arr / 1000) + 'K',
        customers: Math.round(arr / 3000), // Avg $3k/customer
        margin: "85%"
      });
    }
    
    return projections;
  }
}

module.exports = {
  ACEY_INVESTOR_NARRATIVE,
  InvestorNarrativeHelper
};
