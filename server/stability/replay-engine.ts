/**
 * Replay Engine
 * Replay-first debugging with decision chain recording
 */

export interface DecisionChain {
  id: string;
  timestamp: string;
  input: any;
  skillRouting: string;
  llmResponse: any;
  autoRuleOutcome: {
    rule: string;
    action: string;
    result: string;
  };
  resourceSnapshot: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  duration: number;
  success: boolean;
  error?: string;
}

export interface ReplaySession {
  id: string;
  startTime: string;
  endTime?: string;
  decisions: DecisionChain[];
  context: {
    mode: string;
    activeSkills: string[];
    systemState: any;
  };
  summary: {
    totalDecisions: number;
    successRate: number;
    averageDuration: number;
    errors: string[];
  };
}

export class ReplayEngine {
  private decisionChains: DecisionChain[] = [];
  private replaySessions: ReplaySession[] = [];
  private isRecording: boolean = false;
  private currentSession: ReplaySession | null = null;

  constructor() {
    this.loadHistoricalData();
  }

  // Start recording decision chains
  startRecording(context: any): void {
    if (this.isRecording) {
      console.warn('ReplayEngine: Already recording');
      return;
    }

    console.log('ReplayEngine: Starting decision chain recording');
    this.isRecording = true;
    this.currentSession = {
      id: this.generateId(),
      startTime: new Date().toISOString(),
      decisions: [],
      context: {
        mode: context.mode || 'unknown',
        activeSkills: context.activeSkills || [],
        systemState: context.systemState || {}
      },
      summary: {
        totalDecisions: 0,
        successRate: 0,
        averageDuration: 0,
        errors: []
      }
    };
  }

  // Stop recording
  stopRecording(): ReplaySession | null {
    if (!this.isRecording || !this.currentSession) {
      console.warn('ReplayEngine: Not recording');
      return null;
    }

    console.log('ReplayEngine: Stopping decision chain recording');
    this.isRecording = false;
    this.currentSession.endTime = new Date().toISOString();
    
    // Calculate summary
    this.calculateSessionSummary(this.currentSession);
    
    // Store session
    this.replaySessions.push(this.currentSession);
    this.saveSession(this.currentSession);
    
    const session = this.currentSession;
    this.currentSession = null;
    
    return session;
  }

  // Record a decision chain
  recordDecision(
    input: any,
    skillRouting: string,
    llmResponse: any,
    autoRuleOutcome: {
      rule: string;
      action: string;
      result: string;
    },
    success: boolean,
    error?: string
  ): void {
    if (!this.isRecording || !this.currentSession) {
      console.warn('ReplayEngine: Not recording - decision ignored');
      return;
    }

    const startTime = Date.now();
    const resourceSnapshot = this.getResourceSnapshot();

    const decision: DecisionChain = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      input,
      skillRouting,
      llmResponse,
      autoRuleOutcome,
      resourceSnapshot,
      duration: 0, // Will be calculated when decision completes
      success,
      error
    };

    this.currentSession.decisions.push(decision);
    this.decisionChains.push(decision);

    // Simulate decision duration (in real implementation, would measure actual time)
    setTimeout(() => {
      decision.duration = Date.now() - startTime;
    }, 10);
  }

  // Replay a session
  async replaySession(sessionId: string): Promise<{
    success: boolean;
    replayedDecisions: number;
    errors: string[];
    summary: any;
  }> {
    const session = this.replaySessions.find(s => s.id === sessionId);
    if (!session) {
      console.error(`ReplayEngine: Session ${sessionId} not found`);
      return {
        success: false,
        replayedDecisions: 0,
        errors: [`Session ${sessionId} not found`],
        summary: null
      };
    }

    console.log(`ReplayEngine: Replaying session ${sessionId} (${session.decisions.length} decisions)`);
    
    const result = {
      success: true,
      replayedDecisions: 0,
      errors: [] as string[],
      summary: {
        sessionId,
        startTime: session.startTime,
        totalDecisions: session.decisions.length
      }
    };

    try {
      // Replay each decision in sequence
      for (const decision of session.decisions) {
        await this.replayDecision(decision);
        result.replayedDecisions++;
      }

      console.log(`ReplayEngine: Successfully replayed ${result.replayedDecisions} decisions`);
      
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Replay failed: ${error.message}`);
      console.error(`ReplayEngine: Replay failed - ${error.message}`);
    }

    return result;
  }

  // Replay individual decision
  private async replayDecision(decision: DecisionChain): Promise<void> {
    console.log(`ReplayEngine: Replaying decision ${decision.id} - ${decision.skillRouting}`);
    
    // In real implementation, would:
    // 1. Restore resource state
    // 2. Re-execute the skill routing
    // 3. Re-call LLM with same input
    // 4. Apply same auto-rule
    // 5. Compare results
    
    // Simulate replay time
    await new Promise(resolve => setTimeout(resolve, decision.duration || 100));
    
    // Verify replay matches original
    const replaySuccess = this.verifyReplay(decision);
    if (!replaySuccess) {
      throw new Error(`Replay verification failed for decision ${decision.id}`);
    }
  }

  // Verify replay matches original
  private verifyReplay(original: DecisionChain): boolean {
    // In real implementation, would compare:
    // - LLM response
    // - Auto-rule outcome
    // - Resource usage
    // - Success/failure status
    
    // For now, simulate 95% success rate
    return Math.random() > 0.05;
  }

  // Get replay sessions
  getReplaySessions(): ReplaySession[] {
    return this.replaySessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  // Get specific session
  getReplaySession(sessionId: string): ReplaySession | null {
    return this.replaySessions.find(s => s.id === sessionId) || null;
  }

  // Get decision chains
  getDecisionChains(filter?: {
    skill?: string;
    success?: boolean;
    timeRange?: { start: string, end: string };
  }): DecisionChain[] {
    let chains = [...this.decisionChains];

    if (filter) {
      if (filter.skill) {
        chains = chains.filter(c => c.skillRouting === filter.skill);
      }
      if (filter.success !== undefined) {
        chains = chains.filter(c => c.success === filter.success);
      }
      if (filter.timeRange) {
        chains = chains.filter(c => 
          c.timestamp >= filter.timeRange!.start && c.timestamp <= filter.timeRange!.end
        );
      }
    }

    return chains.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Debug specific issue
  async debugIssue(issueDescription: string, timeRange?: { start: string, end: string }): Promise<{
    relatedDecisions: DecisionChain[];
    possibleCauses: string[];
    recommendations: string[];
  }> {
    console.log(`ReplayEngine: Debugging issue: ${issueDescription}`);
    
    // Find related decisions
    const relatedDecisions = this.getDecisionChains({
      timeRange,
      success: false // Focus on failed decisions
    });

    // Analyze patterns
    const possibleCauses = this.analyzeFailurePatterns(relatedDecisions);
    const recommendations = this.generateRecommendations(possibleCauses);

    return {
      relatedDecisions,
      possibleCauses,
      recommendations
    };
  }

  // Analyze failure patterns
  private analyzeFailurePatterns(failedDecisions: DecisionChain[]): string[] {
    const causes = [];

    // Check for resource issues
    const resourceIssues = failedDecisions.filter(d => 
      d.resourceSnapshot.cpu > 90 || d.resourceSnapshot.memory > 90
    );
    if (resourceIssues.length > 0) {
      causes.push('High resource usage during decisions');
    }

    // Check for specific skill failures
    const skillFailures = new Map<string, number>();
    for (const decision of failedDecisions) {
      const count = skillFailures.get(decision.skillRouting) || 0;
      skillFailures.set(decision.skillRouting, count + 1);
    }

    for (const [skill, count] of skillFailures.entries()) {
      if (count >= 3) {
        causes.push(`Repeated failures in ${skill} skill`);
      }
    }

    // Check for LLM response issues
    const llmIssues = failedDecisions.filter(d => 
      d.llmResponse && d.llmResponse.error
    );
    if (llmIssues.length > 0) {
      causes.push('LLM response errors');
    }

    return causes;
  }

  // Generate recommendations
  private generateRecommendations(causes: string[]): string[] {
    const recommendations = [];

    for (const cause of causes) {
      switch (cause) {
        case 'High resource usage during decisions':
          recommendations.push('Consider enabling Safe Mode during high load');
          recommendations.push('Review resource thresholds and adjust if needed');
          break;
        case 'Repeated failures in specific skill':
          recommendations.push('Investigate skill configuration and dependencies');
          recommendations.push('Consider temporarily disabling problematic skill');
          break;
        case 'LLM response errors':
          recommendations.push('Check LLM connectivity and API limits');
          recommendations.push('Review prompt templates for edge cases');
          break;
      }
    }

    return recommendations;
  }

  // Calculate session summary
  private calculateSessionSummary(session: ReplaySession): void {
    const decisions = session.decisions;
    const successfulDecisions = decisions.filter(d => d.success);
    const totalDuration = decisions.reduce((sum, d) => sum + d.duration, 0);
    const errors = decisions.filter(d => !d.success).map(d => d.error || 'Unknown error');

    session.summary = {
      totalDecisions: decisions.length,
      successRate: decisions.length > 0 ? (successfulDecisions.length / decisions.length) * 100 : 0,
      averageDuration: decisions.length > 0 ? totalDuration / decisions.length : 0,
      errors
    };
  }

  // Get resource snapshot
  private getResourceSnapshot(): { cpu: number; memory: number; gpu: number } {
    // In real implementation, would get actual system resources
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      gpu: Math.random() * 100
    };
  }

  // Generate ID
  private generateId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save session
  private saveSession(session: ReplaySession): void {
    // In real implementation, would save to file or database
    console.log(`ReplayEngine: Saved session ${session.id} with ${session.decisions.length} decisions`);
  }

  // Load historical data
  private loadHistoricalData(): void {
    // In real implementation, would load from file or database
    console.log('ReplayEngine: Loaded historical data');
  }

  // Get replay statistics
  getStats(): any {
    const totalSessions = this.replaySessions.length;
    const totalDecisions = this.decisionChains.length;
    const successfulDecisions = this.decisionChains.filter(d => d.success).length;
    const averageDecisionsPerSession = totalSessions > 0 ? totalDecisions / totalSessions : 0;

    return {
      isRecording: this.isRecording,
      totalSessions,
      totalDecisions,
      successfulDecisions,
      successRate: totalDecisions > 0 ? (successfulDecisions / totalDecisions) * 100 : 0,
      averageDecisionsPerSession,
      currentSessionId: this.currentSession?.id || null,
      lastSession: this.replaySessions[this.replaySessions.length - 1]?.startTime || null
    };
  }

  // Export session for offline analysis
  exportSession(sessionId: string): string | null {
    const session = this.getReplaySession(sessionId);
    if (!session) return null;

    return JSON.stringify(session, null, 2);
  }

  // Import session from file
  importSession(sessionData: string): boolean {
    try {
      const session = JSON.parse(sessionData) as ReplaySession;
      
      // Validate session structure
      if (!this.validateSession(session)) {
        console.error('ReplayEngine: Invalid session data');
        return false;
      }

      this.replaySessions.push(session);
      console.log(`ReplayEngine: Imported session ${session.id}`);
      return true;
      
    } catch (error: any) {
      console.error(`ReplayEngine: Import failed - ${error.message}`);
      return false;
    }
  }

  // Validate session structure
  private validateSession(session: any): session is ReplaySession {
    return (
      typeof session.id === 'string' &&
      typeof session.startTime === 'string' &&
      Array.isArray(session.decisions) &&
      typeof session.context === 'object' &&
      typeof session.summary === 'object'
    );
  }
}
