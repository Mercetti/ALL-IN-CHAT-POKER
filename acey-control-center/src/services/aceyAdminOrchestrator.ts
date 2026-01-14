// services/aceyAdminOrchestrator.ts
import { 
  sendUserNotification, 
  sendOwnerNotification, 
  sendSkillUnlockNotifications,
  sendTrialWarningNotification,
  sendLockedAccessNotification,
  sendLearningUpdateNotification
} from './notificationService';
import { getUserAccess, unlockSkill, getAllUsersWithTrials } from './monetizationService';
import { getApprovedOutputs } from './previewService';
import { canAccessAceyLab } from './authService';

export interface UserTrial {
  skillName: string;
  expiresInHours: number;
  userId: string;
  username: string;
}

export interface LearningUpdate {
  type: 'new_output' | 'fine_tune_complete' | 'trust_score_change';
  message: string;
  data?: any;
}

export interface UserAccessInfo {
  userId: string;
  username: string;
  tier: string;
  unlockedSkills: string[];
  trials: UserTrial[];
  trialRemaining?: number;
}

export class AceyAdminOrchestrator {
  private ownerToken: string;
  private monitoringInterval?: NodeJS.Timeout;
  private recentEvents: any[] = [];

  constructor(ownerToken: string) {
    this.ownerToken = ownerToken;
  }

  // Handle skill unlocks with notifications
  async handleSkillUnlock(
    username: string, 
    userToken: string, 
    skillName: string, 
    userId: string
  ) {
    try {
      // Unlock skill via monetization service
      const accessData = await unlockSkill(userToken, skillName, username, this.ownerToken);
      
      // Send notifications to both user and owner
      await sendSkillUnlockNotifications(
        userToken,
        this.ownerToken,
        username,
        skillName,
        userId
      );

      // Log event
      this.logEvent({
        type: 'skill_unlock',
        username,
        skillName,
        timestamp: new Date().toISOString(),
        data: accessData
      });

      return accessData;
    } catch (error) {
      console.error('Failed to handle skill unlock:', error);
      throw error;
    }
  }

  // Monitor trial expirations for all users
  async monitorTrials() {
    try {
      const users = await getAllUsersWithTrials();
      
      for (const user of users) {
        for (const trial of user.trials) {
          // Send warning if less than 24 hours
          if (trial.expiresInHours <= 24 && trial.expiresInHours > 0) {
            await sendTrialWarningNotification(
              user.userToken,
              this.ownerToken,
              user.username,
              trial.skillName,
              trial.expiresInHours,
              user.userId
            );
          }

          // Log expiring trials
          if (trial.expiresInHours <= 24) {
            this.logEvent({
              type: 'trial_expiring',
              username: user.username,
              skillName: trial.skillName,
              hoursRemaining: trial.expiresInHours,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to monitor trials:', error);
    }
  }

  // Log attempts to access locked skills
  async logLockedAccess(
    username: string, 
    skillName: string, 
    attemptedTier: string
  ) {
    await sendLockedAccessNotification(
      this.ownerToken,
      username,
      skillName,
      attemptedTier
    );

    this.logEvent({
      type: 'locked_access_attempt',
      username,
      skillName,
      attemptedTier,
      timestamp: new Date().toISOString()
    });
  }

  // Monitor learning updates and new approved outputs
  async monitorLearningUpdates() {
    try {
      const outputs = await getApprovedOutputs(this.ownerToken);
      
      // Check for new outputs (simplified - in production would track last seen)
      for (const output of outputs.slice(-5)) { // Last 5 outputs
        await sendLearningUpdateNotification(
          this.ownerToken,
          'new_output',
          {
            message: `${output.approvedBy} submitted a new approved output for ${output.skillType}.`,
            outputId: output.id,
            skillType: output.skillType,
            trustScore: output.trustScore
          }
        );

        this.logEvent({
          type: 'new_approved_output',
          username: output.approvedBy,
          skillType: output.skillType,
          outputId: output.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to monitor learning updates:', error);
    }
  }

  // Handle fine-tune completion
  async handleFineTuneComplete(
    skillTypes: string[], 
    entriesProcessed: number, 
    accuracyImprovement: number
  ) {
    await sendLearningUpdateNotification(
      this.ownerToken,
      'fine_tune_complete',
      {
        message: `Fine-tune completed for ${skillTypes.join(', ')}. Processed ${entriesProcessed} entries with ${(accuracyImprovement * 100).toFixed(2)}% accuracy improvement.`,
        skillTypes,
        entriesProcessed,
        accuracyImprovement
      }
    );

    this.logEvent({
      type: 'fine_tune_complete',
      skillTypes,
      entriesProcessed,
      accuracyImprovement,
      timestamp: new Date().toISOString()
    });
  }

  // Handle trust score changes
  async handleTrustScoreChange(
    skillType: string, 
    oldScore: number, 
    newScore: number
  ) {
    const change = newScore - oldScore;
    const direction = change > 0 ? 'increased' : 'decreased';
    
    await sendLearningUpdateNotification(
      this.ownerToken,
      'trust_score_change',
      {
        message: `${skillType} trust score ${direction} from ${(oldScore * 100).toFixed(1)}% to ${(newScore * 100).toFixed(1)}%.`,
        skillType,
        oldScore,
        newScore,
        change
      }
    );

    this.logEvent({
      type: 'trust_score_change',
      skillType,
      oldScore,
      newScore,
      change,
      timestamp: new Date().toISOString()
    });
  }

  // Run full monitoring loop
  async runFullMonitoringLoop(intervalMs = 3600000) { // Default: 1 hour
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.monitorTrials();
      await this.monitorLearningUpdates();
    }, intervalMs);

    console.log(`Acey Admin Orchestrator monitoring started with ${intervalMs}ms interval`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('Acey Admin Orchestrator monitoring stopped');
    }
  }

  // Check if user can access Acey Lab
  userCanAccess(userRole: string): boolean {
    return canAccessAceyLab(userRole as 'owner' | 'dev');
  }

  // Get recent events for owner dashboard
  getRecentEvents(limit = 50): any[] {
    return this.recentEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get events by type
  getEventsByType(type: string, limit = 20): any[] {
    return this.recentEvents
      .filter(event => event.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get user-specific events
  getUserEvents(username: string, limit = 20): any[] {
    return this.recentEvents
      .filter(event => event.username === username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get monitoring statistics
  getMonitoringStats() {
    const now = new Date();
    const last24Hours = this.recentEvents.filter(
      event => new Date(event.timestamp) > new Date(now.getTime() - 24 * 3600000)
    );

    const eventTypes = last24Hours.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: last24Hours.length,
      eventTypes,
      lastEvent: this.recentEvents[0]?.timestamp || null,
      monitoringActive: !!this.monitoringInterval
    };
  }

  // Private method to log events
  private logEvent(event: any) {
    this.recentEvents.push({
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Keep only last 1000 events to prevent memory issues
    if (this.recentEvents.length > 1000) {
      this.recentEvents = this.recentEvents.slice(-1000);
    }
  }

  // Clear event history
  clearEventHistory() {
    this.recentEvents = [];
    console.log('Acey Admin Orchestrator event history cleared');
  }

  // Export events for analysis
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.recentEvents, null, 2);
    } else {
      // Simple CSV export
      const headers = ['id', 'type', 'username', 'timestamp', 'data'];
      const csvRows = [headers.join(',')];
      
      for (const event of this.recentEvents) {
        const row = [
          event.id || '',
          event.type || '',
          event.username || '',
          event.timestamp || '',
          JSON.stringify(event.data || {})
        ];
        csvRows.push(row.join(','));
      }
      
      return csvRows.join('\n');
    }
  }
}
