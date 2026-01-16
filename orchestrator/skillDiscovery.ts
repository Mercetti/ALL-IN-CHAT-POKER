/**
 * Skill Discovery Module for Acey
 * Phase 3: Emergent Skill Discovery / Dynamic Skill Marketplace
 * 
 * This module analyzes usage patterns and proposes new skills
 * based on repetitive patterns and high-demand features
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SkillUsageLog {
  timestamp: string;
  skillName: string;
  input: any;
  output: any;
  executionTime: number;
  success: boolean;
  userId?: string;
  context?: any;
  confidence: number;
}

export interface UsagePattern {
  pattern: string;
  frequency: number;
  skillName: string;
  inputType: string;
  outputType: string;
  avgExecutionTime: number;
  successRate: number;
  lastSeen: string;
}

export interface SkillProposal {
  id: string;
  name: string;
  description: string;
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  type: 'enhancement' | 'new_skill' | 'variant';
  basedOn: string; // Existing skill or pattern
  reasoning: string;
  proposedAt: string;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  usageData: UsagePattern;
  estimatedValue: number; // 0-1 score
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface SkillDiscoveryConfig {
  logPath: string;
  proposalPath: string;
  analysisInterval: number; // minutes
  minPatternFrequency: number;
  proposalThreshold: number; // 0-1
  enableAutoAnalysis: boolean;
}

export class SkillDiscovery extends EventEmitter {
  private config: SkillDiscoveryConfig;
  private usageLogs: SkillUsageLog[] = [];
  private patterns: Map<string, UsagePattern> = new Map();
  private proposals: SkillProposal[] = [];
  private analysisTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(config: SkillDiscoveryConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize skill discovery system
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🔍 Initializing Skill Discovery System...');

      // Create directories
      this.ensureDirectories();

      // Load existing data
      await this.loadExistingData();

      // Start periodic analysis
      if (this.config.enableAutoAnalysis) {
        this.startPeriodicAnalysis();
      }

      this.isInitialized = true;

      this.emit('initialized', {
        logCount: this.usageLogs.length,
        patternCount: this.patterns.size,
        proposalCount: this.proposals.length
      });

      console.log('✅ Skill Discovery System initialized');
      console.log(`📊 Usage logs: ${this.usageLogs.length}`);
      console.log(`🔍 Patterns: ${this.patterns.size}`);
      console.log(`💡 Proposals: ${this.proposals.length}`);

    } catch (error) {
      console.error('❌ Failed to initialize Skill Discovery:', error);
      this.emit('error', error);
    }
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const directories = [
      this.config.logPath,
      this.config.proposalPath,
      path.join(this.config.logPath, 'patterns'),
      path.join(this.config.logPath, 'proposals')
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Load existing usage logs and patterns
   */
  private async loadExistingData(): Promise<void> {
    // Load usage logs
    const logFiles = fs.readdirSync(this.config.logPath)
      .filter(file => file.endsWith('.json') && file.startsWith('usage_'));

    for (const file of logFiles) {
      try {
        const filePath = path.join(this.config.logPath, file);
        const logs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.usageLogs.push(...logs);
      } catch (error) {
        console.error(`Failed to load log file ${file}:`, error);
      }
    }

    // Load patterns
    const patternFiles = fs.readdirSync(path.join(this.config.logPath, 'patterns'))
      .filter(file => file.endsWith('.json'));

    for (const file of patternFiles) {
      try {
        const filePath = path.join(this.config.logPath, 'patterns', file);
        const patterns = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        patterns.forEach((pattern: UsagePattern) => {
          this.patterns.set(pattern.pattern, pattern);
        });
      } catch (error) {
        console.error(`Failed to load pattern file ${file}:`, error);
      }
    }

    // Load proposals
    const proposalFiles = fs.readdirSync(path.join(this.config.logPath, 'proposals'))
      .filter(file => file.endsWith('.json'));

    for (const file of proposalFiles) {
      try {
        const filePath = path.join(this.config.logPath, 'proposals', file);
        const proposals = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.proposals.push(...proposals);
      } catch (error) {
        console.error(`Failed to load proposal file ${file}:`, error);
      }
    }
  }

  /**
   * Log skill usage for analysis
   */
  logUsage(log: SkillUsageLog): void {
    // Add to memory
    this.usageLogs.push(log);

    // Save to file
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.config.logPath, `usage_${today}.json`);
    
    let existingLogs: SkillUsageLog[] = [];
    if (fs.existsSync(logFile)) {
      existingLogs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    }
    
    existingLogs.push(log);
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));

    // Update patterns
    this.updatePatterns(log);
  }

  /**
   * Update usage patterns based on new log
   */
  private updatePatterns(log: SkillUsageLog): void {
    // Extract pattern from input
    const patternKey = this.extractPattern(log);
    
    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        frequency: 0,
        skillName: log.skillName,
        inputType: this.getInputType(log.input),
        outputType: this.getOutputType(log.output),
        avgExecutionTime: 0,
        successRate: 0,
        lastSeen: log.timestamp
      });
    }

    const pattern = this.patterns.get(patternKey)!;
    pattern.frequency++;
    pattern.lastSeen = log.timestamp;
    
    // Update averages
    const totalLogs = this.usageLogs.filter(l => this.extractPattern(l) === patternKey);
    pattern.avgExecutionTime = totalLogs.reduce((sum, l) => sum + l.executionTime, 0) / totalLogs.length;
    pattern.successRate = totalLogs.filter(l => l.success).length / totalLogs.length;

    // Save patterns
    this.savePatterns();
  }

  /**
   * Extract pattern from usage log
   */
  private extractPattern(log: SkillUsageLog): string {
    // Create pattern based on skill and input structure
    const input = log.input;
    let pattern = `${log.skillName}:`;
    
    if (typeof input === 'object' && input !== null) {
      const keys = Object.keys(input).sort();
      pattern += keys.join(',');
    } else {
      pattern += typeof input;
    }
    
    // Add context if available
    if (log.context && typeof log.context === 'object') {
      const contextKeys = Object.keys(log.context).sort();
      if (contextKeys.length > 0) {
        pattern += `|${contextKeys.join(',')}`;
      }
    }
    
    return pattern;
  }

  /**
   * Get input type from input data
   */
  private getInputType(input: any): string {
    if (typeof input === 'string') return 'string';
    if (Array.isArray(input)) return 'array';
    if (typeof input === 'object' && input !== null) {
      return `object_${Object.keys(input).length}`;
    }
    return typeof input;
  }

  /**
   * Get output type from output data
   */
  private getOutputType(output: any): string {
    if (typeof output === 'string') return 'string';
    if (Array.isArray(output)) return 'array';
    if (typeof output === 'object' && output !== null) {
      return `object_${Object.keys(output).length}`;
    }
    return typeof output;
  }

  /**
   * Analyze usage and generate proposals
   */
  analyzeUsage(): SkillProposal[] {
    const newProposals: SkillProposal[] = [];
    const now = new Date().toISOString();

    // Analyze high-frequency patterns
    for (const [patternKey, pattern] of this.patterns) {
      // Check if pattern meets threshold for proposal
      if (pattern.frequency >= this.config.minPatternFrequency) {
        // Calculate proposal value
        const value = this.calculateProposalValue(pattern);
        
        if (value >= this.config.proposalThreshold) {
          const proposal = this.generateProposal(pattern, value, now);
          
          // Check if similar proposal already exists
          const exists = this.proposals.some(p => 
            p.name === proposal.name && p.basedOn === proposal.basedOn
          );
          
          if (!exists) {
            newProposals.push(proposal);
          }
        }
      }
    }

    // Analyze skill combinations
    const combinationProposals = this.analyzeSkillCombinations(now);
    newProposals.push(...combinationProposals);

    // Save new proposals
    if (newProposals.length > 0) {
      this.proposals.push(...newProposals);
      this.saveProposals();
      
      this.emit('proposalsGenerated', newProposals);
    }

    return newProposals;
  }

  /**
   * Calculate proposal value based on pattern
   */
  private calculateProposalValue(pattern: UsagePattern): number {
    let value = 0;

    // Frequency value (0-0.4)
    const frequencyScore = Math.min(pattern.frequency / 100, 1) * 0.4;
    value += frequencyScore;

    // Success rate value (0-0.2)
    const successScore = pattern.successRate * 0.2;
    value += successScore;

    // Performance value (0-0.2)
    const performanceScore = pattern.avgExecutionTime < 1000 ? 0.2 : 
                            pattern.avgExecutionTime < 5000 ? 0.1 : 0;
    value += performanceScore;

    // Recency value (0-0.2)
    const daysSinceLastSeen = (Date.now() - new Date(pattern.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceLastSeen / 30) * 0.2;
    value += recencyScore;

    return Math.max(0, Math.min(1, value));
  }

  /**
   * Generate proposal from pattern
   */
  private generateProposal(pattern: UsagePattern, value: number, timestamp: string): SkillProposal {
    const proposalType = this.determineProposalType(pattern);
    const tier = this.determineTier(pattern, value);
    const complexity = this.determineComplexity(pattern);

    return {
      id: crypto.randomUUID(),
      name: this.generateProposalName(pattern, proposalType),
      description: this.generateProposalDescription(pattern, proposalType),
      tier,
      type: proposalType,
      basedOn: pattern.skillName,
      reasoning: this.generateReasoning(pattern, value),
      proposedAt: timestamp,
      status: 'proposed',
      usageData: pattern,
      estimatedValue: value,
      implementationComplexity: complexity
    };
  }

  /**
   * Determine proposal type
   */
  private determineProposalType(pattern: UsagePattern): 'enhancement' | 'new_skill' | 'variant' {
    if (pattern.frequency > 50) {
      return 'enhancement'; // High usage suggests enhancement
    } else if (pattern.inputType.includes('object_') && pattern.inputType !== 'object_1') {
      return 'new_skill'; // Complex inputs suggest new skill
    } else {
      return 'variant'; // Simple variations
    }
  }

  /**
   * Determine tier based on pattern and value
   */
  private determineTier(pattern: UsagePattern, value: number): 'Free' | 'Pro' | 'Creator+' | 'Enterprise' {
    if (value >= 0.8) return 'Enterprise';
    if (value >= 0.6) return 'Creator+';
    if (value >= 0.4) return 'Pro';
    return 'Free';
  }

  /**
   * Determine implementation complexity
   */
  private determineComplexity(pattern: UsagePattern): 'low' | 'medium' | 'high' {
    if (pattern.avgExecutionTime < 500 && pattern.successRate > 0.9) {
      return 'low';
    } else if (pattern.avgExecutionTime < 2000 && pattern.successRate > 0.8) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Generate proposal name
   */
  private generateProposalName(pattern: UsagePattern, type: 'enhancement' | 'new_skill' | 'variant'): string {
    const baseName = pattern.skillName.replace(/([A-Z])/g, ' $1').trim();
    
    switch (type) {
      case 'enhancement':
        return `Enhanced ${baseName}`;
      case 'new_skill':
        return `${baseName} Specialist`;
      case 'variant':
        return `${baseName} Lite`;
      default:
        return `${baseName} Improvement`;
    }
  }

  /**
   * Generate proposal description
   */
  private generateProposalDescription(pattern: UsagePattern, type: 'enhancement' | 'new_skill' | 'variant'): string {
    const frequency = pattern.frequency;
    const successRate = (pattern.successRate * 100).toFixed(1);
    
    switch (type) {
      case 'enhancement':
        return `Enhanced version of ${pattern.skillName} based on ${frequency} uses with ${successRate}% success rate. Optimized for ${pattern.inputType} inputs.`;
      case 'new_skill':
        return `Specialized skill derived from ${pattern.skillName} usage patterns. Handles ${frequency} repeated requests with ${successRate}% success rate.`;
      case 'variant':
        return `Lightweight variant of ${pattern.skillName} for common use cases. Used ${frequency} times with ${successRate}% success rate.`;
      default:
        return `Improvement for ${pattern.skillName} based on usage analysis.`;
    }
  }

  /**
   * Generate reasoning for proposal
   */
  private generateReasoning(pattern: UsagePattern, value: number): string {
    const reasons = [];
    
    if (pattern.frequency > 50) {
      reasons.push(`High frequency usage (${pattern.frequency} times) indicates strong demand`);
    }
    
    if (pattern.successRate > 0.9) {
      reasons.push(`Excellent success rate (${(pattern.successRate * 100).toFixed(1)}%) suggests reliable pattern`);
    }
    
    if (pattern.avgExecutionTime < 1000) {
      reasons.push(`Fast execution (${pattern.avgExecutionTime.toFixed(0)}ms avg) indicates efficiency`);
    }
    
    if (value > 0.7) {
      reasons.push(`High estimated value (${(value * 100).toFixed(1)}%) justifies development effort`);
    }
    
    const daysSinceLastSeen = (Date.now() - new Date(pattern.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen < 7) {
      reasons.push(`Recent activity (${daysSinceLastSeen.toFixed(0)} days ago) shows current relevance`);
    }
    
    return reasons.join('. ') + '.';
  }

  /**
   * Analyze skill combinations for new opportunities
   */
  private analyzeSkillCombinations(timestamp: string): SkillProposal[] {
    const proposals: SkillProposal[] = [];
    
    // Find frequently used skill sequences
    const sequences = this.findSkillSequences();
    
    for (const sequence of sequences) {
      if (sequence.frequency >= 10) { // Threshold for combinations
        const proposal: SkillProposal = {
          id: crypto.randomUUID(),
          name: this.generateCombinationName(sequence.skills),
          description: `Combined skill for ${sequence.skills.join(' + ')} workflow. Used ${sequence.frequency} times together.`,
          tier: this.determineTierFromSequence(sequence),
          type: 'new_skill',
          basedOn: sequence.skills.join(' + '),
          reasoning: `Frequently used together (${sequence.frequency} times) suggests workflow optimization opportunity.`,
          proposedAt: timestamp,
          status: 'proposed',
          usageData: {
            pattern: sequence.skills.join(' -> '),
            frequency: sequence.frequency,
            skillName: sequence.skills[0],
            inputType: 'combination',
            outputType: 'combination',
            avgExecutionTime: sequence.avgExecutionTime,
            successRate: sequence.successRate,
            lastSeen: timestamp
          },
          estimatedValue: Math.min(sequence.frequency / 50, 1),
          implementationComplexity: 'medium'
        };
        
        proposals.push(proposal);
      }
    }
    
    return proposals;
  }

  /**
   * Find frequently used skill sequences
   */
  private findSkillSequences(): Array<{
    skills: string[];
    frequency: number;
    avgExecutionTime: number;
    successRate: number;
  }> {
    const sequences: Map<string, {
      skills: string[];
      count: number;
      totalTime: number;
      successCount: number;
    }> = new Map();
    
    // Analyze logs for sequences (simplified - would need proper session tracking)
    for (let i = 0; i < this.usageLogs.length - 1; i++) {
      const current = this.usageLogs[i];
      const next = this.usageLogs[i + 1];
      
      // Check if logs are close in time (within 5 minutes)
      const timeDiff = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
      if (timeDiff < 5 * 60 * 1000 && current.success && next.success) {
        const sequenceKey = `${current.skillName} -> ${next.skillName}`;
        
        if (!sequences.has(sequenceKey)) {
          sequences.set(sequenceKey, {
            skills: [current.skillName, next.skillName],
            count: 0,
            totalTime: 0,
            successCount: 0
          });
        }
        
        const seq = sequences.get(sequenceKey)!;
        seq.count++;
        seq.totalTime += current.executionTime + next.executionTime;
        seq.successCount++;
      }
    }
    
    // Convert to array and filter
    return Array.from(sequences.values())
      .filter(seq => seq.count >= 5)
      .map(seq => ({
        skills: seq.skills,
        frequency: seq.count,
        avgExecutionTime: seq.totalTime / seq.count,
        successRate: seq.successCount / seq.count
      }));
  }

  /**
   * Generate combination name
   */
  private generateCombinationName(skills: string[]): string {
    if (skills.length === 2) {
      return `${skills[0]} + ${skills[1]} Workflow`;
    } else {
      return `${skills[0]} Combo`;
    }
  }

  /**
   * Determine tier from sequence
   */
  private determineTierFromSequence(sequence: any): 'Free' | 'Pro' | 'Creator+' | 'Enterprise' {
    if (sequence.frequency > 20) return 'Enterprise';
    if (sequence.frequency > 10) return 'Creator+';
    if (sequence.frequency > 5) return 'Pro';
    return 'Free';
  }

  /**
   * Save patterns to file
   */
  private savePatterns(): void {
    const patternsFile = path.join(this.config.logPath, 'patterns', 'patterns.json');
    const patternsArray = Array.from(this.patterns.values());
    fs.writeFileSync(patternsFile, JSON.stringify(patternsArray, null, 2));
  }

  /**
   * Save proposals to file
   */
  private saveProposals(): void {
    const proposalsFile = path.join(this.config.logPath, 'proposals', `proposals_${Date.now()}.json`);
    fs.writeFileSync(proposalsFile, JSON.stringify(this.proposals, null, 2));
  }

  /**
   * Start periodic analysis
   */
  private startPeriodicAnalysis(): void {
    this.analysisTimer = setInterval(() => {
      this.analyzeUsage();
    }, this.config.analysisInterval * 60 * 1000);
  }

  /**
   * Get current proposals
   */
  getProposals(status?: 'proposed' | 'approved' | 'rejected' | 'implemented'): SkillProposal[] {
    if (status) {
      return this.proposals.filter(p => p.status === status);
    }
    return this.proposals;
  }

  /**
   * Approve a proposal
   */
  approveProposal(proposalId: string): boolean {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (proposal) {
      proposal.status = 'approved';
      this.saveProposals();
      this.emit('proposalApproved', proposal);
      return true;
    }
    return false;
  }

  /**
   * Reject a proposal
   */
  rejectProposal(proposalId: string, reason?: string): boolean {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (proposal) {
      proposal.status = 'rejected';
      this.saveProposals();
      this.emit('proposalRejected', { proposal, reason });
      return true;
    }
    return false;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalLogs: number;
    uniqueSkills: number;
    totalPatterns: number;
    totalProposals: number;
    proposalsByStatus: Record<string, number>;
    proposalsByTier: Record<string, number>;
  } {
    const proposalsByStatus: Record<string, number> = {};
    const proposalsByTier: Record<string, number> = {};
    
    for (const proposal of this.proposals) {
      proposalsByStatus[proposal.status] = (proposalsByStatus[proposal.status] || 0) + 1;
      proposalsByTier[proposal.tier] = (proposalsByTier[proposal.tier] || 0) + 1;
    }
    
    return {
      totalLogs: this.usageLogs.length,
      uniqueSkills: new Set(this.usageLogs.map(l => l.skillName)).size,
      totalPatterns: this.patterns.size,
      totalProposals: this.proposals.length,
      proposalsByStatus,
      proposalsByTier
    };
  }

  /**
   * Generate discovery report
   */
  generateDiscoveryReport(): string {
    const stats = this.getUsageStats();
    const topPatterns = Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    const recentProposals = this.proposals
      .sort((a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime())
      .slice(0, 10);
    
    const report = `
# Skill Discovery Report

## Usage Statistics
- Total Usage Logs: ${stats.totalLogs}
- Unique Skills: ${stats.uniqueSkills}
- Usage Patterns: ${stats.totalPatterns}
- Total Proposals: ${stats.totalProposals}

## Proposals by Status
${Object.entries(stats.proposalsByStatus)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}

## Proposals by Tier
${Object.entries(stats.proposalsByTier)
  .map(([tier, count]) => `- ${tier}: ${count}`)
  .join('\n')}

## Top Usage Patterns
${topPatterns.map((pattern, index) => 
  `${index + 1}. ${pattern.pattern} (${pattern.frequency} uses, ${(pattern.successRate * 100).toFixed(1)}% success)`
).join('\n')}

## Recent Proposals
${recentProposals.map(proposal => 
  `- ${proposal.name} (${proposal.tier}) - ${proposal.status}`
).join('\n')}

## Recommendations
${this.generateRecommendations()}

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.config.logPath, `discovery_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Discovery report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(): string {
    const recommendations: string[] = [];
    
    const stats = this.getUsageStats();
    
    if (stats.totalProposals === 0) {
      recommendations.push('📊 Collect more usage data to generate skill proposals');
    }
    
    const approvedCount = stats.proposalsByStatus.approved || 0;
    if (approvedCount > 5) {
      recommendations.push('⚡ Consider implementing approved proposals to improve efficiency');
    }
    
    const highValueProposals = this.proposals.filter(p => p.estimatedValue > 0.7 && p.status === 'proposed');
    if (highValueProposals.length > 0) {
      recommendations.push('🎯 Review high-value proposals for immediate implementation');
    }
    
    const enterpriseProposals = this.proposals.filter(p => p.tier === 'Enterprise');
    if (enterpriseProposals.length > 0) {
      recommendations.push('💼 Enterprise proposals indicate opportunities for premium features');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Shutdown skill discovery
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Skill Discovery System...');
    
    // Generate final report
    this.generateDiscoveryReport();
    
    // Stop periodic analysis
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    
    // Save final data
    this.savePatterns();
    this.saveProposals();
    
    this.isInitialized = false;
    
    this.emit('shutdown', { timestamp: new Date().toISOString() });
    
    console.log('✅ Skill Discovery System shutdown complete');
  }
}

export default SkillDiscovery;
