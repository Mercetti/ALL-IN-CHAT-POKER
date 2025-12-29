/**
 * AI-Powered User Experience Monitoring
 * Monitors user behavior and suggests UX improvements
 */

const ai = require('./ai');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger();

class AIUXMonitor {
  constructor(options = {}) {
    this.options = {
      enableAutoImprovements: options.enableAutoImprovements !== false,
      trackingWindow: options.trackingWindow || 300000, // 5 minutes
      minUserSessions: options.minUserSessions || 10,
      ...options
    };
    
    this.userSessions = new Map();
    this.interactionPatterns = new Map();
    this.uxMetrics = {
      engagement: [],
      navigation: [],
      errors: [],
      performance: []
    };
    
    this.insights = [];
    this.improvements = new Map();
    
    this.init();
  }

  init() {
    // Start periodic analysis
    this.startPeriodicAnalysis();
    
    logger.info('AI UX Monitor initialized', {
      autoImprovements: this.options.enableAutoImprovements,
      trackingWindow: this.options.trackingWindow
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(userId, interaction) {
    const now = Date.now();
    
    // Get or create user session
    let session = this.userSessions.get(userId);
    if (!session) {
      session = {
        userId,
        startTime: now,
        interactions: [],
        errors: [],
        navigation: []
      };
      this.userSessions.set(userId, session);
    }
    
    // Add interaction
    session.interactions.push({
      type: interaction.type,
      element: interaction.element,
      timestamp: now,
      duration: interaction.duration || 0,
      success: interaction.success !== false
    });
    
    // Update metrics
    this.updateUXMetrics(interaction);
    
    // Clean old sessions
    this.cleanOldSessions();
  }

  /**
   * Track user error
   */
  trackUserError(userId, error) {
    const session = this.userSessions.get(userId);
    if (session) {
      session.errors.push({
        type: error.type,
        message: error.message,
        timestamp: Date.now(),
        context: error.context
      });
    }
    
    this.uxMetrics.errors.push({
      userId,
      type: error.type,
      timestamp: Date.now()
    });
  }

  /**
   * Track navigation pattern
   */
  trackNavigation(userId, from, to, duration) {
    const session = this.userSessions.get(userId);
    if (session) {
      session.navigation.push({
        from,
        to,
        duration,
        timestamp: Date.now()
      });
    }
    
    this.uxMetrics.navigation.push({
      userId,
      from,
      to,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Update UX metrics
   */
  updateUXMetrics(interaction) {
    const metric = {
      type: interaction.type,
      element: interaction.element,
      timestamp: Date.now(),
      success: interaction.success !== false,
      duration: interaction.duration || 0
    };
    
    this.uxMetrics.engagement.push(metric);
    
    // Keep only recent metrics
    this.trimMetrics();
  }

  /**
   * Trim old metrics
   */
  trimMetrics() {
    const now = Date.now();
    const cutoff = now - this.options.trackingWindow;
    
    Object.keys(this.uxMetrics).forEach(key => {
      this.uxMetrics[key] = this.uxMetrics[key].filter(m => m.timestamp > cutoff);
    });
  }

  /**
   * Clean old user sessions
   */
  cleanOldSessions() {
    const now = Date.now();
    const cutoff = now - this.options.trackingWindow;
    
    for (const [userId, session] of this.userSessions.entries()) {
      if (session.startTime < cutoff) {
        this.userSessions.delete(userId);
      }
    }
  }

  /**
   * Start periodic analysis
   */
  startPeriodicAnalysis() {
    setInterval(() => {
      this.analyzeUserBehavior();
    }, 60000); // Analyze every minute
  }

  /**
   * Analyze user behavior with AI
   */
  async analyzeUserBehavior() {
    if (this.userSessions.size < this.options.minUserSessions) {
      return; // Not enough data
    }
    
    const behaviorData = this.prepareBehaviorData();
    const analysis = await this.analyzeWithAI(behaviorData);
    
    if (analysis.insights && analysis.insights.length > 0) {
      await this.processInsights(analysis.insights);
    }
    
    if (analysis.improvements && analysis.improvements.length > 0) {
      await this.applyImprovements(analysis.improvements);
    }
  }

  /**
   * Prepare behavior data for AI analysis
   */
  prepareBehaviorData() {
    const sessions = Array.from(this.userSessions.values());
    const now = Date.now();
    const recentSessions = sessions.filter(s => now - s.startTime < this.options.trackingWindow);
    
    return {
      totalSessions: recentSessions.length,
      averageSessionDuration: this.calculateAverageSessionDuration(recentSessions),
      interactionPatterns: this.getInteractionPatterns(recentSessions),
      errorPatterns: this.getErrorPatterns(recentSessions),
      navigationPatterns: this.getNavigationPatterns(recentSessions),
      engagementMetrics: this.getEngagementMetrics(),
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  /**
   * Calculate average session duration
   */
  calculateAverageSessionDuration(sessions) {
    if (sessions.length === 0) return 0;
    
    const durations = sessions.map(session => {
      const lastInteraction = session.interactions[session.interactions.length - 1];
      return lastInteraction ? lastInteraction.timestamp - session.startTime : 0;
    });
    
    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  /**
   * Get interaction patterns
   */
  getInteractionPatterns(sessions) {
    const patterns = {};
    
    sessions.forEach(session => {
      session.interactions.forEach(interaction => {
        const key = `${interaction.type}:${interaction.element}`;
        if (!patterns[key]) {
          patterns[key] = { count: 0, success: 0, totalDuration: 0 };
        }
        patterns[key].count++;
        if (interaction.success) patterns[key].success++;
        patterns[key].totalDuration += interaction.duration || 0;
      });
    });
    
    return patterns;
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(sessions) {
    const patterns = {};
    
    sessions.forEach(session => {
      session.errors.forEach(error => {
        const key = error.type;
        if (!patterns[key]) {
          patterns[key] = { count: 0, contexts: [] };
        }
        patterns[key].count++;
        if (error.context) patterns[key].contexts.push(error.context);
      });
    });
    
    return patterns;
  }

  /**
   * Get navigation patterns
   */
  getNavigationPatterns(sessions) {
    const patterns = {};
    
    sessions.forEach(session => {
      session.navigation.forEach(nav => {
        const key = `${nav.from}->${nav.to}`;
        if (!patterns[key]) {
          patterns[key] = { count: 0, totalDuration: 0 };
        }
        patterns[key].count++;
        patterns[key].totalDuration += nav.duration;
      });
    });
    
    return patterns;
  }

  /**
   * Get engagement metrics
   */
  getEngagementMetrics() {
    const recent = this.uxMetrics.engagement.slice(-100);
    
    return {
      totalInteractions: recent.length,
      successRate: recent.filter(i => i.success).length / recent.length,
      averageDuration: recent.reduce((sum, i) => sum + i.duration, 0) / recent.length,
      mostUsedElements: this.getMostUsedElements(recent)
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const recent = this.uxMetrics.engagement.slice(-100);
    
    return {
      averageResponseTime: recent.reduce((sum, i) => sum + i.duration, 0) / recent.length,
      slowInteractions: recent.filter(i => i.duration > 1000).length,
      failedInteractions: recent.filter(i => !i.success).length
    };
  }

  /**
   * Get most used elements
   */
  getMostUsedElements(interactions) {
    const counts = {};
    
    interactions.forEach(i => {
      counts[i.element] = (counts[i.element] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([element, count]) => ({ element, count }));
  }

  /**
   * Analyze behavior with AI
   */
  async analyzeWithAI(behaviorData) {
    const prompt = `You are an expert UX analyst for a poker game web application.

User Behavior Data:
- Total Sessions: ${behaviorData.totalSessions}
- Average Session Duration: ${behaviorData.averageSessionDuration}ms
- Interaction Patterns: ${JSON.stringify(behaviorData.interactionPatterns, null, 2)}
- Error Patterns: ${JSON.stringify(behaviorData.errorPatterns, null, 2)}
- Navigation Patterns: ${JSON.stringify(behaviorData.navigationPatterns, null, 2)}
- Engagement Metrics: ${JSON.stringify(behaviorData.engagementMetrics, null, 2)}
- Performance Metrics: ${JSON.stringify(behaviorData.performanceMetrics, null, 2)}

Analyze the user experience and provide:
1. Insights: Array of UX insights with priority (low/medium/high)
2. Improvements: Array of specific UX improvements with implementation details
3. Issues: Array of UX problems that need attention

Respond with JSON only:
{
  "insights": [
    {
      "type": "engagement/navigation/performance/error",
      "priority": "low/medium/high",
      "description": "Insight description",
      "impact": "How this affects user experience",
      "data": "Supporting data"
    }
  ],
  "improvements": [
    {
      "type": "ui/flow/performance/accessibility",
      "priority": "low/medium/high",
      "description": "What to improve",
      "implementation": "How to implement",
      "expectedImpact": "Expected improvement"
    }
  ],
  "issues": [
    {
      "type": "usability/performance/accessibility",
      "severity": "low/medium/high",
      "description": "Issue description",
      "affectedUsers": "Number of affected users"
    }
  ]
}`;

    try {
      const response = await ai.chat([
        { role: 'system', content: 'You are an expert UX analyst. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1000
      });

      return JSON.parse(response);
    } catch (error) {
      logger.error('AI UX analysis failed', { error: error.message });
      return { insights: [], improvements: [], issues: [] };
    }
  }

  /**
   * Process AI insights
   */
  async processInsights(insights) {
    for (const insight of insights) {
      this.insights.push({
        ...insight,
        timestamp: Date.now(),
        status: 'detected'
      });
      
      logger.info('UX insight detected', insight);
      
      // Handle high priority insights
      if (insight.priority === 'high') {
        await this.handleHighPriorityInsight(insight);
      }
    }
  }

  /**
   * Handle high priority insights
   */
  async handleHighPriorityInsight(insight) {
    switch (insight.type) {
      case 'performance':
        await this.handlePerformanceInsight(insight);
        break;
      case 'engagement':
        await this.handleEngagementInsight(insight);
        break;
      case 'error':
        await this.handleErrorInsight(insight);
        break;
    }
  }

  /**
   * Handle performance insight
   */
  async handlePerformanceInsight(insight) {
    // This would implement performance-specific UX improvements
    logger.warn('High priority performance UX issue detected', insight);
  }

  /**
   * Handle engagement insight
   */
  async handleEngagementInsight(insight) {
    // This would implement engagement-specific UX improvements
    logger.warn('High priority engagement UX issue detected', insight);
  }

  /**
   * Handle error insight
   */
  async handleErrorInsight(insight) {
    // This would implement error-specific UX improvements
    logger.warn('High priority error UX issue detected', insight);
  }

  /**
   * Apply UX improvements
   */
  async applyImprovements(improvements) {
    if (!this.options.enableAutoImprovements) return;
    
    // Sort by priority
    const sortedImprovements = improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    for (const improvement of sortedImprovements) {
      if (improvement.priority === 'high') {
        await this.applyUXImprovement(improvement);
      }
    }
  }

  /**
   * Apply specific UX improvement
   */
  async applyUXImprovement(improvement) {
    const improvementId = `ux_${Date.now()}`;
    
    try {
      switch (improvement.type) {
        case 'ui':
          await this.applyUIImprovement(improvement);
          break;
        case 'flow':
          await this.applyFlowImprovement(improvement);
          break;
        case 'performance':
          await this.applyPerformanceImprovement(improvement);
          break;
        case 'accessibility':
          await this.applyAccessibilityImprovement(improvement);
          break;
      }
      
      this.improvements.set(improvementId, {
        ...improvement,
        appliedAt: Date.now(),
        status: 'applied'
      });
      
      logger.info('Applied UX improvement', { 
        id: improvementId, 
        type: improvement.type,
        description: improvement.description 
      });
      
    } catch (error) {
      logger.error('Failed to apply UX improvement', { 
        id: improvementId, 
        error: error.message 
      });
      
      this.improvements.set(improvementId, {
        ...improvement,
        appliedAt: Date.now(),
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Apply UI improvement
   */
  async applyUIImprovement(improvement) {
    // This would implement UI-specific improvements
    // For example: adjusting button sizes, colors, layouts
    logger.info('Applied UI improvement', improvement);
  }

  /**
   * Apply flow improvement
   */
  async applyFlowImprovement(improvement) {
    // This would implement flow-specific improvements
    // For example: simplifying navigation, reducing steps
    logger.info('Applied flow improvement', improvement);
  }

  /**
   * Apply performance improvement
   */
  async applyPerformanceImprovement(improvement) {
    // This would implement performance-specific UX improvements
    // For example: optimizing animations, reducing load times
    logger.info('Applied performance improvement', improvement);
  }

  /**
   * Apply accessibility improvement
   */
  async applyAccessibilityImprovement(improvement) {
    // This would implement accessibility-specific improvements
    // For example: adding ARIA labels, keyboard navigation
    logger.info('Applied accessibility improvement', improvement);
  }

  /**
   * Get UX report
   */
  getUXReport() {
    const now = Date.now();
    const recentInsights = this.insights.filter(i => now - i.timestamp < 3600000);
    const recentImprovements = Array.from(this.improvements.values())
      .filter(i => now - i.appliedAt < 3600000);
    
    return {
      summary: {
        activeSessions: this.userSessions.size,
        totalInteractions: this.uxMetrics.engagement.length,
        recentErrors: this.uxMetrics.errors.filter(e => now - e.timestamp < 300000).length,
        averageSessionDuration: this.calculateAverageSessionDuration(Array.from(this.userSessions.values()))
      },
      insights: recentInsights.slice(-10),
      improvements: recentImprovements,
      metrics: {
        engagement: this.getEngagementMetrics(),
        performance: this.getPerformanceMetrics(),
        navigation: this.getNavigationPatterns(Array.from(this.userSessions.values()))
      }
    };
  }
}

module.exports = AIUXMonitor;
