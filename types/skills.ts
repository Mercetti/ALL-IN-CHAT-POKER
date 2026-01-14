export type SkillType = 
  | 'CodeHelper'
  | 'GraphicsWizard' 
  | 'AudioMaestro'
  | 'StreamAnalyticsPro'
  | 'AICoHostGames'
  | 'CustomMiniAceyPersona'
  | 'DonationIncentiveManager'
  | 'DynamicAlertDesigner'
  | 'ExternalLinkReview';

export interface GeneratedOutput {
  id: string;
  skill: SkillType;
  content: string | ArrayBuffer; // string for code, ArrayBuffer for graphics/audio
  metadata?: SkillMetadata;
  timestamp: number;
  filename?: string;
  description?: string;
  // New properties for unified system
  contentType?: 'Code' | 'Text' | 'Audio' | 'Image' | 'Video';
  summary?: string;       // text summary / code snippet / instructions
  logicOrSteps?: string[]; 
  feedback?: 'approve' | 'needs_improvement';
  trustScore?: number;
}

export interface SkillMetadata {
  description?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  category?: string;
  language?: string;
  dimensions?: { width: number; height: number };
  duration?: number; // for audio
  format?: string; // file format
  size?: number; // file size in bytes
  tags?: string[];
  performanceMetrics?: {
    executionTime?: number;
    renderTime?: number;
    processingTime?: number;
    quality?: number;
  };
  // New metadata for new skills
  viewerMetrics?: {
    currentViewers: number;
    peakViewers: number;
    averageViewers: number;
    engagementRate: number;
  };
  gameData?: {
    gameType: string;
    playerCount: number;
    duration: number;
    winner?: string;
    prize?: number;
  };
  personaData?: {
    personaName: string;
    traits: string[];
    duration: number;
    context: string;
  };
  donationData?: {
    totalRaised: number;
    donorCount: number;
    averageDonation: number;
    incentives: string[];
  };
  alertData?: {
    alertType: string;
    triggerConditions: string[];
    animationStyle: string;
    duration: number;
    priority: 'low' | 'medium' | 'high';
  };
}

export interface AceyLearningPattern {
  id: string;
  skill: SkillType;
  contentType: 'Code' | 'Image' | 'Audio' | 'Analytics' | 'MiniPersona' | 'DonationAutomation';
  summary: string;           // short description of what output does
  logicOrSteps: string[];    // code logic, image generation steps, audio transformation steps
  fixesApplied?: string[];
  timestamp: number;
  usageCount: number;
  successRate: number;
  userContext?: string;
  performanceMetrics?: {
    averageExecutionTime?: number;
    averageRenderTime?: number;
    averageProcessingTime?: number;
    quality?: number;
    errorRate?: number;
  };
}

export interface UnifiedChatMessage {
  id: string;
  type: 'user' | 'acey' | 'output';
  content: string;
  timestamp: Date;
  outputId?: string;
  skill?: SkillType;
}

export interface SkillStoreItem {
  skill: SkillType;
  name: string;
  description: string;
  icon: string;
  tier: 'Free' | 'Pro' | 'Enterprise';
  price: number;
  features: string[];
  isInstalled: boolean;
  installDate?: Date;
  lastUsed?: Date;
}

export interface SkillInstallationRequest {
  skill: SkillType;
  userId: string;
  tier: string;
  sessionId: string;
  timestamp: number;
}

export type LinkType = 'GitHubRepo' | 'Gist' | 'Documentation' | 'Issue' | 'Video' | 'API' | 'Other';

export interface LinkReviewResult {
  summary: string;
  suggestions: string[];
  actionablePoints: string[];
  confidence: number;
  contentPreview?: string;
}

export interface ReviewFeedback {
  type: 'approve' | 'needs_improvement';
  comment?: string;
  trustScore: number;
  timestamp: number;
}

export interface SkillGenerationRequest {
  id: string;
  skill: SkillType;
  prompt: string;
  context?: string;
  requirements?: string[];
  constraints?: string[];
  userId?: string;
  sessionId: string;
  timestamp: number;
  skillSpecific?: {
    language?: string;
    dimensions?: { width: number; height: number };
    duration?: number;
    format?: string;
    style?: string;
  };
}

export interface SkillGenerationResponse {
  id: string;
  requestId: string;
  output: GeneratedOutput;
  patterns: AceyLearningPattern[];
  processingTime: number;
  confidence: number;
  alternatives?: GeneratedOutput[];
}

export interface UnifiedUsageTracking {
  userId?: string;
  sessionId: string;
  skill: SkillType;
  action: 'generate' | 'download' | 'discard' | 'learn';
  content?: string;
  timestamp: number;
  outputId?: string;
  tier?: 'free' | 'pro' | 'enterprise';
  usageCount: number;
}

export interface UnifiedLearningAnalytics {
  totalPatterns: number;
  patternsBySkill: Record<SkillType, number>;
  patternsByContentType: Record<'Code' | 'Image' | 'Audio' | 'Analytics' | 'MiniPersona' | 'DonationAutomation', number>;
  averageSuccessRate: number;
  mostUsedSkills: SkillType[];
  recentImprovements: AceyLearningPattern[];
  learningTrends: {
    date: string;
    patternsAdded: number;
    successRate: number;
    skill: SkillType;
  }[];
  userPreferences: {
    favoriteSkill: SkillType;
    mostUsedLanguage: string;
    averageSessionLength: number;
    downloadRate: number;
    learningRate: number;
  };
}

export interface SkillConfig {
  CodeHelper: {
    supportedLanguages: string[];
    defaultLanguage: string;
    maxComplexity: 'simple' | 'medium' | 'complex';
    features: string[];
  };
  GraphicsWizard: {
    supportedFormats: string[];
    defaultDimensions: { width: number; height: number };
    maxFileSize: number; // bytes
    styles: string[];
    features: string[];
  };
  AudioMaestro: {
    supportedFormats: string[];
    maxDuration: number; // seconds
    sampleRates: number[];
    bitRates: number[];
    features: string[];
  };
}
