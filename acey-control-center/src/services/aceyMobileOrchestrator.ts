import { fetchOrchestratorData, triggerSkillInstall, verifySubscription, logApprovedOutput } from './orchestratorAPI';
import { notifySkillUnlock, notifyTrialExpiration, notifyApprovedOutput } from './aceyMobileNotifier';
import { getUserAccess, UserAccess } from './authService';

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'audio' | 'image' | 'code' | 'graphics' | 'clips';
  tier: string;
  preview?: string;
  features: string[];
  usageCount?: number;
  avgRating?: number;
  isLive?: boolean;
  isApproved?: boolean;
}

export interface SkillMetrics {
  usageCount: number;
  avgRating: number;
  approvalRate: number;
  errorRate: number;
  completionSpeed: number;
  lastUpdated: string;
}

export interface UpdateProposal {
  id: string;
  skillId: string;
  suggestion: string;
  metrics: SkillMetrics;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt: string;
  submittedBy: 'acey' | 'owner';
}

export interface UserData {
  userAccess: UserAccess;
  skillsList: Skill[];
}

export class AceyMobileOrchestrator {
  private userToken: string;
  private ownerToken: string;

  constructor(userToken: string, ownerToken?: string) {
    this.userToken = userToken;
    this.ownerToken = ownerToken || 'owner_token_default';
  }

  userCanAccess(userRole: string): boolean {
    return userRole === 'owner' || userRole === 'dev';
  }

  async logOutput(skillType: string, outputData: any) {
    // Mock implementation for logging approved outputs
    console.log(`Logging ${skillType} output:`, outputData);
    return { success: true };
  }

  async checkSubscription() {
    // Mock implementation for subscription check
    return { active: true, tier: 'pro' };
  }

  async getRecentEvents(): Promise<any[]> {
    // Mock recent events for demo
    return [
      {
        title: 'Skill Unlock',
        message: 'User unlocked Code Helper skill',
        timestamp: new Date().toISOString()
      },
      {
        title: 'Trial Expiring',
        message: 'Graphics Wizard trial expires in 2 hours',
        timestamp: new Date().toISOString()
      }
    ];
  }

  // Fetch user data including skills and access
  async fetchUserData(): Promise<UserData> {
    try {
      const userAccess = await getUserAccess(this.userToken);
      
      // Mock skills data - in production this would come from backend
      const skillsList: Skill[] = [
        {
          id: 'code_helper',
          name: 'Code Helper',
          description: 'Advanced code analysis and bug detection',
          type: 'code',
          tier: 'Free',
          preview: 'function analyzeCode(code) { return "AI-powered analysis"; }',
          features: ['Bug detection', 'Syntax help', 'Code optimization'],
          usageCount: 1247,
          avgRating: 4.8,
          isLive: true,
          isApproved: true
        },
        {
          id: 'audio_maestro',
          name: 'Audio Maestro',
          description: 'Generate custom audio and music',
          type: 'audio',
          tier: 'Creator+',
          preview: 'https://example.com/audio-preview.mp3',
          features: ['Custom audio generation', 'Voice synthesis', 'Music creation'],
          usageCount: 892,
          avgRating: 4.6,
          isLive: true,
          isApproved: true
        },
        {
          id: 'graphics_wizard',
          name: 'Graphics Wizard',
          description: 'Create stunning graphics and images',
          type: 'image',
          tier: 'Creator+',
          preview: 'https://example.com/graphics-preview.jpg',
          features: ['Image generation', 'Style transfer', 'Brand assets'],
          usageCount: 756,
          avgRating: 4.7,
          isLive: true,
          isApproved: true
        },
        {
          id: 'link_review_pro',
          name: 'Link Review Pro',
          description: 'Advanced link analysis and security scanning',
          type: 'code',
          tier: 'Pro',
          preview: 'const analyzeLink = (url) => { /* security analysis */ };',
          features: ['Security scanning', 'Content summary', 'Advanced analysis'],
          usageCount: 445,
          avgRating: 4.5,
          isLive: true,
          isApproved: true
        }
      ];

      return {
        userAccess,
        skillsList
      };
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  }

  // Install/unlock skill for user
  async installSkill(skillId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock implementation for skill installation
      console.log(`Installing skill: ${skillId}`);
      
      // Send local notification
      notifySkillUnlock(skillId);

      return { success: true, message: 'Skill unlocked successfully' };
    } catch (error) {
      console.error('Failed to install skill:', error);
      return { success: false, message: 'Failed to unlock skill' };
    }
  }

  // Get skill metrics for improvement analysis
  async fetchSkillMetrics(userToken: string, skillId: string): Promise<SkillMetrics> {
    try {
      // Mock metrics - in production this would come from backend analytics
      return {
        usageCount: Math.floor(Math.random() * 2000) + 100,
        avgRating: Math.random() * 2 + 3, // 3-5 range
        approvalRate: Math.random() * 0.3 + 0.7, // 70-100% range
        errorRate: Math.random() * 0.1, // 0-10% range
        completionSpeed: Math.random() * 2 + 0.5, // 0.5-2.5 seconds
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch skill metrics:', error);
      throw error;
    }
  }

  // Propose skill update
  async proposeSkillUpdate(userToken: string, updateProposal: { skillId: string; suggestion: string }): Promise<{ success: boolean; proposalId: string }> {
    try {
      const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send notification to owner
      // await sendOwnerNotification(this.ownerToken, 'Skill Update Proposal', `Acey proposed an update for ${updateProposal.skillId}`);
      
      return { success: true, proposalId };
    } catch (error) {
      console.error('Failed to propose skill update:', error);
      return { success: false, proposalId: '' };
    }
  }

  // Start trial for skill
  async startTrial(skillId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock implementation for trial start
      console.log(`Starting trial for skill: ${skillId}`);
      
      // Send trial notification
      // await sendUserNotification('Trial Started!', `7-day trial started for skill ${skillId}`);
      
      return { success: true, message: 'Trial started successfully' };
    } catch (error) {
      console.error('Failed to start trial:', error);
      return { success: false, message: 'Failed to start trial' };
    }
  }

  // Get pending update proposals
  async getPendingProposals(): Promise<UpdateProposal[]> {
    try {
      // Mock proposals - in production this would come from backend
      return [
        {
          id: 'proposal_1',
          skillId: 'code_helper',
          suggestion: 'Add support for TypeScript analysis and improve error detection accuracy',
          metrics: {
            usageCount: 1247,
            avgRating: 4.8,
            approvalRate: 0.92,
            errorRate: 0.03,
            completionSpeed: 1.2,
            lastUpdated: new Date().toISOString()
          },
          status: 'pending',
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          submittedBy: 'acey'
        }
      ];
    } catch (error) {
      console.error('Failed to get pending proposals:', error);
      return [];
    }
  }

  // Approve or reject update proposal
  async handleUpdateProposal(proposalId: string, action: 'approve' | 'reject' | 'request_revision'): Promise<{ success: boolean }> {
    try {
      // Send notification about decision
      const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision requested';
      // await sendOwnerNotification(this.ownerToken, 'Proposal Decision', `Update proposal ${proposalId} was ${actionText}`);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to handle update proposal:', error);
      return { success: false };
    }
  }

  async fetchSkillPreview(skillMeta: { skillName: string; skillType: string }) {
    return fetch(`https://your-backend.com/api/orchestrator/skillPreview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.userToken, ...skillMeta }),
    }).then(res => res.json()); // returns URL for image/audio or code snippet
  }

  async approveSkillProposal(proposalId: string) {
    return fetch(`https://your-backend.com/api/orchestrator/approveProposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.userToken, proposalId }),
    }).then(res => res.json());
  }

  async rejectSkillProposal(proposalId: string, reason: string) {
    return fetch(`https://your-backend.com/api/orchestrator/rejectProposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.userToken, proposalId, reason }),
    }).then(res => res.json());
  }

  async getProposalHistory(limit = 50) {
    return fetch(`https://your-backend.com/api/orchestrator/proposalHistory?token=${this.userToken}&limit=${limit}`)
      .then(res => res.json());
  }

  async handleSkillUnlock(username: string, userToken: string, skillName: string, userId?: string) {
    // Mock implementation for skill unlock
    console.log(`User ${username} unlocked skill ${skillName}`);
    
    return { success: true, message: `Skill ${skillName} unlocked` };
  }

  async logLockedAccess(username: string, skillName: string, attemptedTier: string) {
    console.log(`User ${username} attempted to access locked skill ${skillName} with tier ${attemptedTier}`);
    return { success: true };
  }
}

// Export convenience functions for standalone usage
export async function fetchSkillMetrics(userToken: string, skillId: string): Promise<SkillMetrics> {
  const orchestrator = new AceyMobileOrchestrator(userToken);
  return orchestrator.fetchSkillMetrics(userToken, skillId);
}

export async function proposeSkillUpdate(userToken: string, updateProposal: { skillId: string; suggestion: string }): Promise<{ success: boolean; proposalId: string }> {
  const orchestrator = new AceyMobileOrchestrator(userToken);
  return orchestrator.proposeSkillUpdate(userToken, updateProposal);
}

export async function fetchSkillUpdates(userToken: string, userRole: string): Promise<any[]> {
  const orchestrator = new AceyMobileOrchestrator(userToken);
  return orchestrator.getRecentEvents();
}

export async function fetchRecommendations(userToken: string): Promise<any[]> {
  const orchestrator = new AceyMobileOrchestrator(userToken);
  return [
    {
      id: 'rec_1',
      title: 'Cross-Skill Recommendation',
      message: 'Based on your usage, consider upgrading to Creator+ tier for advanced graphics features',
      timestamp: new Date().toISOString(),
      type: 'recommendation',
      preview: {
        type: 'image',
        url: 'https://example.com/graphics-upgrade.jpg'
      }
    }
  ];
}

export async function logApprovedSkillUpdate(userToken: string, updateId: string, skillData: any) {
  return fetch(`https://your-backend.com/api/orchestrator/logApprovedUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken, updateId, skillData }),
  }).then(res => res.json());
}

export async function fetchCrossSkillInsights(userToken: string) {
  return fetch(`https://your-backend.com/api/orchestrator/crossSkillInsights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

export async function proposeNewSkillFromInsights(userToken: string, insightId: string, proposal: any) {
  return fetch(`https://your-backend.com/api/orchestrator/proposeSkillFromInsight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken, insightId, ...proposal }),
  }).then(res => res.json());
}

export async function fetchFineTuneStatus(userToken: string): Promise<any> {
  return fetch(`https://your-backend.com/api/llm/fineTuneStatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

export async function fetchDatasetMetrics(userToken: string): Promise<any> {
  return fetch(`https://your-backend.com/api/llm/datasetMetrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

export async function fetchSkillApprovals(userToken: string): Promise<any[]> {
  return fetch(`https://your-backend.com/api/skills/pendingApprovals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}
