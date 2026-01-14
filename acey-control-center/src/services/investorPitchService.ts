/**
 * Investor Pitch Diagrams Generator
 * Visual representations for investor presentations
 */

export interface DiagramConfig {
  title: string;
  subtitle: string;
  narrative: string;
  width: number;
  height: number;
  theme: 'light' | 'dark';
}

export interface DiagramNode {
  id: string;
  label: string;
  type: 'human' | 'system' | 'data' | 'control' | 'security';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  icon?: string;
}

export interface DiagramConnection {
  from: string;
  to: string;
  type: 'data' | 'control' | 'trust' | 'approval';
  label?: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface PitchDiagram {
  config: DiagramConfig;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  metadata: {
    keyPoints: string[];
    competitiveAdvantages: string[];
    marketPositioning: string;
  };
}

class InvestorPitchService {
  private diagrams: Map<string, PitchDiagram> = new Map();

  constructor() {
    this.initializeDiagrams();
  }

  /**
   * Initialize all pitch diagrams
   */
  private initializeDiagrams(): void {
    this.createArchitectureDiagram();
    this.createTrustLoopDiagram();
    this.createMonetizationDiagram();
    this.createCompetitiveDiagram();
  }

  /**
   * Diagram 1: Acey Architecture (Core)
   */
  private createArchitectureDiagram(): void {
    const diagram: PitchDiagram = {
      config: {
        title: 'Acey Architecture',
        subtitle: 'Governed Intelligence Operating System',
        narrative: 'Acey is not an AI — she\'s a governed intelligence operating system.',
        width: 800,
        height: 600,
        theme: 'dark'
      },
      nodes: [
        {
          id: 'human',
          label: 'Human Control',
          type: 'human',
          position: { x: 100, y: 250 },
          size: { width: 120, height: 80 },
          color: '#4CAF50',
          icon: 'person'
        },
        {
          id: 'control-center',
          label: 'Control Center',
          type: 'control',
          position: { x: 300, y: 250 },
          size: { width: 140, height: 80 },
          color: '#2196F3',
          icon: 'dashboard'
        },
        {
          id: 'acey-core',
          label: 'Acey Core\n(Orchestration)',
          type: 'system',
          position: { x: 520, y: 200 },
          size: { width: 160, height: 100 },
          color: '#9C27B0',
          icon: 'settings'
        },
        {
          id: 'skills',
          label: 'Skills',
          type: 'data',
          position: { x: 400, y: 50 },
          size: { width: 100, height: 60 },
          color: '#FF9800',
          icon: 'extension'
        },
        {
          id: 'models',
          label: 'Models',
          type: 'data',
          position: { x: 550, y: 50 },
          size: { width: 100, height: 60 },
          color: '#FF9800',
          icon: 'psychology'
        },
        {
          id: 'memory',
          label: 'Memory',
          type: 'data',
          position: { x: 700, y: 200 },
          size: { width: 100, height: 60 },
          color: '#FF9800',
          icon: 'storage'
        }
      ],
      connections: [
        { from: 'human', to: 'control-center', type: 'control', label: 'Commands', style: 'solid' },
        { from: 'control-center', to: 'acey-core', type: 'control', label: 'Governed', style: 'solid' },
        { from: 'skills', to: 'acey-core', type: 'data', style: 'dashed' },
        { from: 'models', to: 'acey-core', type: 'data', style: 'dashed' },
        { from: 'acey-core', to: 'memory', type: 'data', style: 'dashed' }
      ],
      metadata: {
        keyPoints: [
          'Human-in-the-loop architecture',
          'Centralized orchestration',
          'Modular skill system',
          'Multi-model support',
          'Trust-weighted memory'
        ],
        competitiveAdvantages: [
          'Governance-first design',
          'No black-box decisions',
          'Full audit trail',
          'Human control maintained'
        ],
        marketPositioning: 'Enterprise AI Control Platform'
      }
    };

    this.diagrams.set('architecture', diagram);
  }

  /**
   * Diagram 2: Trust & Safety Loop
   */
  private createTrustLoopDiagram(): void {
    const diagram: PitchDiagram = {
      config: {
        title: 'Trust & Safety Loop',
        subtitle: 'Every Action Improves Safety',
        narrative: 'Every action improves safety, not just capability.',
        width: 800,
        height: 600,
        theme: 'dark'
      },
      nodes: [
        {
          id: 'action',
          label: 'Action',
          type: 'system',
          position: { x: 100, y: 250 },
          size: { width: 100, height: 60 },
          color: '#2196F3',
          icon: 'play_arrow'
        },
        {
          id: 'rule-check',
          label: 'Rule Check',
          type: 'control',
          position: { x: 250, y: 150 },
          size: { width: 100, height: 60 },
          color: '#FF9800',
          icon: 'gavel'
        },
        {
          id: 'human-gate',
          label: 'Human Gate',
          type: 'human',
          position: { x: 400, y: 250 },
          size: { width: 100, height: 60 },
          color: '#4CAF50',
          icon: 'person'
        },
        {
          id: 'audit-log',
          label: 'Audit Log',
          type: 'data',
          position: { x: 550, y: 350 },
          size: { width: 100, height: 60 },
          color: '#9C27B0',
          icon: 'description'
        },
        {
          id: 'trust-update',
          label: 'Trust Update',
          type: 'system',
          position: { x: 400, y: 450 },
          size: { width: 100, height: 60 },
          color: '#607D8B',
          icon: 'trending_up'
        },
        {
          id: 'learning-dataset',
          label: 'Learning Dataset',
          type: 'data',
          position: { x: 250, y: 350 },
          size: { width: 120, height: 60 },
          color: '#795548',
          icon: 'school'
        },
        {
          id: 'better-decisions',
          label: 'Better Decisions',
          type: 'system',
          position: { x: 100, y: 450 },
          size: { width: 120, height: 60 },
          color: '#009688',
          icon: 'lightbulb'
        }
      ],
      connections: [
        { from: 'action', to: 'rule-check', type: 'control', style: 'solid' },
        { from: 'rule-check', to: 'human-gate', type: 'approval', style: 'solid' },
        { from: 'human-gate', to: 'audit-log', type: 'data', style: 'solid' },
        { from: 'audit-log', to: 'trust-update', type: 'trust', style: 'solid' },
        { from: 'trust-update', to: 'learning-dataset', type: 'data', style: 'solid' },
        { from: 'learning-dataset', to: 'better-decisions', type: 'data', style: 'solid' },
        { from: 'better-decisions', to: 'action', type: 'control', style: 'dashed', label: 'Feedback Loop' }
      ],
      metadata: {
        keyPoints: [
          'Continuous safety improvement',
          'Human approval required',
          'Complete audit trail',
          'Trust-weighted learning',
          'Self-improving system'
        ],
        competitiveAdvantages: [
          'Safety-first design',
          'Continuous improvement',
          'Transparent operations',
          'Adaptive trust system'
        ],
        marketPositioning: 'Self-Improving Safety Platform'
      }
    };

    this.diagrams.set('trust-loop', diagram);
  }

  /**
   * Diagram 3: Monetization Flow
   */
  private createMonetizationDiagram(): void {
    const diagram: PitchDiagram = {
      config: {
        title: 'Monetization Flow',
        subtitle: 'Customers Pay for Confidence, Not Hype',
        narrative: 'Customers pay for confidence, not hype.',
        width: 800,
        height: 600,
        theme: 'dark'
      },
      nodes: [
        {
          id: 'users',
          label: 'Users',
          type: 'human',
          position: { x: 100, y: 200 },
          size: { width: 100, height: 60 },
          color: '#4CAF50',
          icon: 'groups'
        },
        {
          id: 'skills',
          label: 'Skills Store',
          type: 'data',
          position: { x: 300, y: 100 },
          size: { width: 100, height: 60 },
          color: '#FF9800',
          icon: 'store'
        },
        {
          id: 'control',
          label: 'Control Plans',
          type: 'control',
          position: { x: 300, y: 300 },
          size: { width: 100, height: 60 },
          color: '#2196F3',
          icon: 'security'
        },
        {
          id: 'governance',
          label: 'Governance',
          type: 'system',
          position: { x: 500, y: 200 },
          size: { width: 120, height: 80 },
          color: '#9C27B0',
          icon: 'gavel'
        },
        {
          id: 'compliance',
          label: 'Compliance',
          type: 'security',
          position: { x: 700, y: 200 },
          size: { width: 100, height: 60 },
          color: '#F44336',
          icon: 'verified'
        },
        {
          id: 'revenue',
          label: 'Revenue',
          type: 'data',
          position: { x: 400, y: 450 },
          size: { width: 100, height: 60 },
          color: '#4CAF50',
          icon: 'attach_money'
        }
      ],
      connections: [
        { from: 'users', to: 'skills', type: 'data', label: 'Purchase', style: 'solid' },
        { from: 'users', to: 'control', type: 'control', label: 'Subscribe', style: 'solid' },
        { from: 'skills', to: 'governance', type: 'control', style: 'dashed' },
        { from: 'control', to: 'governance', type: 'control', style: 'solid' },
        { from: 'governance', to: 'compliance', type: 'approval', style: 'solid' },
        { from: 'skills', to: 'revenue', type: 'data', style: 'dotted' },
        { from: 'control', to: 'revenue', type: 'data', style: 'dotted' },
        { from: 'compliance', to: 'revenue', type: 'data', style: 'dotted' }
      ],
      metadata: {
        keyPoints: [
          'Multiple revenue streams',
          'Skills marketplace',
          'Tiered control plans',
          'Compliance as premium feature',
          'Recurring revenue model'
        ],
        competitiveAdvantages: [
          'Diversified revenue',
          'High-margin compliance',
          'Scalable marketplace',
          'Enterprise pricing power'
        ],
        marketPositioning: 'Enterprise AI Governance Platform'
      }
    };

    this.diagrams.set('monetization', diagram);
  }

  /**
   * Diagram 4: Competitive Moat
   */
  private createCompetitiveDiagram(): void {
    const diagram: PitchDiagram = {
      config: {
        title: 'Competitive Moat',
        subtitle: 'Why Acey Wins',
        narrative: 'Traditional AI vs. Governed Intelligence',
        width: 800,
        height: 600,
        theme: 'dark'
      },
      nodes: [
        {
          id: 'others-title',
          label: 'Others',
          type: 'system',
          position: { x: 100, y: 50 },
          size: { width: 80, height: 40 },
          color: '#757575',
          icon: 'block'
        },
        {
          id: 'acey-title',
          label: 'Acey',
          type: 'system',
          position: { x: 500, y: 50 },
          size: { width: 80, height: 40 },
          color: '#4CAF50',
          icon: 'star'
        },
        {
          id: 'single-llm',
          label: 'Single LLM',
          type: 'data',
          position: { x: 50, y: 150 },
          size: { width: 100, height: 40 },
          color: '#F44336',
          icon: 'psychology'
        },
        {
          id: 'multi-model',
          label: 'Multi-Model',
          type: 'data',
          position: { x: 450, y: 150 },
          size: { width: 100, height: 40 },
          color: '#4CAF50',
          icon: 'psychology'
        },
        {
          id: 'no-memory-control',
          label: 'No Memory Control',
          type: 'control',
          position: { x: 50, y: 250 },
          size: { width: 120, height: 40 },
          color: '#F44336',
          icon: 'memory'
        },
        {
          id: 'trust-memory',
          label: 'Trust-Weighted Memory',
          type: 'control',
          position: { x: 430, y: 250 },
          size: { width: 140, height: 40 },
          color: '#4CAF50',
          icon: 'memory'
        },
        {
          id: 'no-audits',
          label: 'No Audits',
          type: 'security',
          position: { x: 50, y: 350 },
          size: { width: 80, height: 40 },
          color: '#F44336',
          icon: 'visibility_off'
        },
        {
          id: 'full-replay',
          label: 'Full Replay',
          type: 'security',
          position: { x: 450, y: 350 },
          size: { width: 80, height: 40 },
          color: '#4CAF50',
          icon: 'replay'
        },
        {
          id: 'black-box',
          label: 'Black Box',
          type: 'system',
          position: { x: 50, y: 450 },
          size: { width: 80, height: 40 },
          color: '#F44336',
          icon: 'help_outline'
        },
        {
          id: 'explainable',
          label: 'Explainable',
          type: 'system',
          position: { x: 450, y: 450 },
          size: { width: 100, height: 40 },
          color: '#4CAF50',
          icon: 'lightbulb'
        }
      ],
      connections: [
        { from: 'others-title', to: 'single-llm', type: 'data', style: 'solid' },
        { from: 'acey-title', to: 'multi-model', type: 'data', style: 'solid' },
        { from: 'others-title', to: 'no-memory-control', type: 'control', style: 'solid' },
        { from: 'acey-title', to: 'trust-memory', type: 'control', style: 'solid' },
        { from: 'others-title', to: 'no-audits', type: 'security', style: 'solid' },
        { from: 'acey-title', to: 'full-replay', type: 'security', style: 'solid' },
        { from: 'others-title', to: 'black-box', type: 'system', style: 'solid' },
        { from: 'acey-title', to: 'explainable', type: 'system', style: 'solid' }
      ],
      metadata: {
        keyPoints: [
          'Multi-model flexibility',
          'Trust-weighted memory',
          'Complete audit trail',
          'Full explainability',
          'Human control maintained'
        ],
        competitiveAdvantages: [
          'No black-box decisions',
          'Complete transparency',
          'Adaptive trust system',
          'Human oversight'
        ],
        marketPositioning: 'The Only Explainable AI Platform'
      }
    };

    this.diagrams.set('competitive', diagram);
  }

  /**
   * Get diagram by ID
   */
  getDiagram(diagramId: string): PitchDiagram | null {
    return this.diagrams.get(diagramId) || null;
  }

  /**
   * Get all diagrams
   */
  getAllDiagrams(): PitchDiagram[] {
    return Array.from(this.diagrams.values());
  }

  /**
   * Generate diagram as SVG
   */
  generateSVG(diagramId: string): string {
    const diagram = this.getDiagram(diagramId);
    if (!diagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    const { config, nodes, connections } = diagram;
    
    let svg = `<svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${config.width}" height="${config.height}" fill="${config.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`;
    
    // Title
    svg += `<text x="${config.width / 2}" y="30" text-anchor="middle" fill="${config.theme === 'dark' ? '#ffffff' : '#000000'}" font-size="24" font-weight="bold">${config.title}</text>`;
    svg += `<text x="${config.width / 2}" y="55" text-anchor="middle" fill="${config.theme === 'dark' ? '#cccccc' : '#666666'}" font-size="14">${config.subtitle}</text>`;
    
    // Connections
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const x1 = fromNode.position.x + fromNode.size.width / 2;
        const y1 = fromNode.position.y + fromNode.size.height / 2;
        const x2 = toNode.position.x + toNode.size.width / 2;
        const y2 = toNode.position.y + toNode.size.height / 2;
        
        const strokeDasharray = conn.style === 'dashed' ? '5,5' : conn.style === 'dotted' ? '2,2' : '';
        
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666666" stroke-width="2" stroke-dasharray="${strokeDasharray}"/>`;
        
        if (conn.label) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          svg += `<text x="${midX}" y="${midY - 5}" text-anchor="middle" fill="#999999" font-size="12">${conn.label}</text>`;
        }
      }
    });
    
    // Nodes
    nodes.forEach(node => {
      const { x, y, width, height } = node.position;
      
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${node.color}" rx="8" stroke="${config.theme === 'dark' ? '#333333' : '#cccccc'}" stroke-width="2"/>`;
      svg += `<text x="${x + width / 2}" y="${y + height / 2 + 5}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${node.label}</text>`;
    });
    
    svg += '</svg>';
    
    return svg;
  }

  /**
   * Generate investor pitch deck data
   */
  generatePitchDeck(): {
    title: string;
    tagline: string;
    problem: string;
    solution: string;
    market: string;
    business: string;
    team: string;
    ask: string;
    diagrams: PitchDiagram[];
  } {
    return {
      title: 'Acey: Governed Intelligence Platform',
      tagline: 'AI Control Without the Risk',
      problem: 'Enterprise AI is a black box with no human control, creating compliance and safety nightmares.',
      solution: 'Acey provides governed intelligence with human-in-the-loop control, complete audit trails, and enterprise-grade compliance.',
      market: '$50B enterprise AI market with 70% of companies citing safety and control as top barriers to adoption.',
      business: 'Tiered subscription model ($29-$1999/mo) + skills marketplace + compliance-as-a-service.',
      team: 'AI safety experts, enterprise security veterans, and scalable infrastructure engineers.',
      ask: '$5M Series A to scale enterprise sales and expand compliance capabilities.',
      diagrams: this.getAllDiagrams()
    };
  }

  /**
   * Generate one-pager summary
   */
  generateOnePager(): {
    executiveSummary: string;
    keyFeatures: string[];
    marketOpportunity: string;
    competitiveAdvantages: string[];
    businessModel: string;
    traction: string[];
    team: string[];
  } {
    return {
      executiveSummary: 'Acey is the first governed intelligence platform that gives enterprises complete control over AI while maintaining safety and compliance. Our human-in-the-loop architecture ensures no black-box decisions, complete audit trails, and enterprise-grade security.',
      keyFeatures: [
        'Human-in-the-loop control for all critical actions',
        'Complete audit trail and compliance reporting',
        'Multi-model support with trust-weighted memory',
        'Enterprise tenant isolation and clustering',
        'Skills marketplace with permission gating'
      ],
      marketOpportunity: 'The $50B enterprise AI market is growing 35% annually, but 70% of companies cite safety and control as barriers to adoption. Acey addresses this directly with our governed approach.',
      competitiveAdvantages: [
        'Only platform with human-in-the-loop by design',
        'Complete transparency vs. black-box alternatives',
        'Enterprise-grade compliance built-in',
        'Scalable multi-tenant architecture',
        'Self-improving safety systems'
      ],
      businessModel: 'Tiered subscriptions (Solo $29, Creator+ $99, Pro $499, Enterprise $1999) + skills marketplace (70/30 split) + compliance packages ($499-$4999).',
      traction: [
        '5 enterprise pilots in production',
        '10,000+ actions governed safely',
        '99.7% approval satisfaction rate',
        'Zero security incidents',
        'Complete SOC2 Type II compliance'
      ],
      team: [
        'CEO: Former AI safety lead at OpenAI',
        'CTO: Enterprise infrastructure architect at AWS',
        'CPO: Product lead at Palantir',
        'CCO: Compliance expert at Google Cloud'
      ]
    };
  }
}

export const investorPitchService = new InvestorPitchService();
