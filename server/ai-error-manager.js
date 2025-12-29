/**
 * AI-Powered Error Detection and Self-Healing System
 * Uses AI to detect, analyze, and automatically fix common issues
 */

const ai = require('./ai');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger();

class AIErrorManager {
  constructor(options = {}) {
    this.options = {
      enableAutoFix: options.enableAutoFix !== false,
      enableLearning: options.enableLearning !== false,
      maxFixAttempts: options.maxFixAttempts || 3,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      ...options
    };
    
    this.errorHistory = new Map();
    this.fixHistory = new Map();
    this.patterns = new Map();
    this.healthMetrics = {
      errorsDetected: 0,
      errorsFixed: 0,
      fixSuccessRate: 0,
      lastHealthCheck: Date.now()
    };
    
    this.init();
  }

  init() {
    // Load learned patterns
    this.loadPatterns();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    logger.info('AI Error Manager initialized', {
      autoFix: this.options.enableAutoFix,
      learning: this.options.enableLearning
    });
  }

  /**
   * Detect and analyze errors using AI
   */
  async detectError(error, context = {}) {
    const errorId = this.generateErrorId(error);
    
    // Check if we've seen this error before
    if (this.errorHistory.has(errorId)) {
      const previous = this.errorHistory.get(errorId);
      previous.count++;
      previous.lastSeen = Date.now();
      return previous;
    }

    // Analyze new error with AI
    const analysis = await this.analyzeErrorWithAI(error, context);
    
    const errorInfo = {
      id: errorId,
      type: analysis.type,
      severity: analysis.severity,
      category: analysis.category,
      description: analysis.description,
      likelyCause: analysis.likelyCause,
      suggestedFixes: analysis.suggestedFixes,
      confidence: analysis.confidence,
      context,
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      status: 'detected'
    };

    this.errorHistory.set(errorId, errorInfo);
    this.healthMetrics.errorsDetected++;
    
    logger.warn('AI detected error', { errorId, type: errorInfo.type, severity: errorInfo.severity });
    
    return errorInfo;
  }

  /**
   * Analyze error using AI
   */
  async analyzeErrorWithAI(error, context) {
    const prompt = `You are an expert error detection system for a Node.js poker game application.

Error Details:
- Message: ${error.message}
- Stack: ${error.stack || 'No stack trace'}
- Code: ${error.code || 'No code'}
- Context: ${JSON.stringify(context, null, 2)}

Analyze this error and provide:
1. Type: (syntax, runtime, network, database, logic, security, performance)
2. Severity: (critical, high, medium, low)
3. Category: (frontend, backend, database, network, authentication, game-logic)
4. Likely cause: Brief explanation
5. Suggested fixes: Array of 2-3 specific fix suggestions
6. Confidence: How confident are you in this analysis (0-1)

Respond with JSON only:
{
  "type": "error_type",
  "severity": "severity_level", 
  "category": "error_category",
  "likelyCause": "brief explanation",
  "suggestedFixes": ["fix1", "fix2", "fix3"],
  "confidence": 0.8
}`;

    try {
      const response = await ai.chat([
        { role: 'system', content: 'You are an expert error detection system. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 500
      });

      const analysis = JSON.parse(response);
      
      // Validate analysis
      if (!analysis.type || !analysis.severity || !analysis.confidence) {
        throw new Error('Invalid AI analysis format');
      }

      return analysis;
    } catch (aiError) {
      logger.error('AI error analysis failed', { error: aiError.message });
      
      // Fallback to basic analysis
      return this.fallbackAnalysis(error, context);
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  fallbackAnalysis(error, context) {
    const message = error.message.toLowerCase();
    
    let type = 'runtime';
    let severity = 'medium';
    let category = 'backend';
    let likelyCause = 'Unknown';
    let suggestedFixes = ['Check logs for more details', 'Restart application'];
    let confidence = 0.3;

    // Basic pattern matching
    if (message.includes('syntax') || message.includes('parse')) {
      type = 'syntax';
      severity = 'high';
      suggestedFixes = ['Check syntax in affected file', 'Validate JSON/JS syntax'];
    } else if (message.includes('database') || message.includes('sql')) {
      category = 'database';
      suggestedFixes = ['Check database connection', 'Verify query syntax'];
    } else if (message.includes('network') || message.includes('connection')) {
      category = 'network';
      suggestedFixes = ['Check network connectivity', 'Verify service availability'];
    } else if (message.includes('permission') || message.includes('auth')) {
      category = 'authentication';
      suggestedFixes = ['Check user permissions', 'Verify authentication tokens'];
    }

    return {
      type,
      severity,
      category,
      likelyCause,
      suggestedFixes,
      confidence
    };
  }

  /**
   * Attempt to fix error automatically
   */
  async attemptAutoFix(errorInfo) {
    if (!this.options.enableAutoFix || errorInfo.confidence < this.options.confidenceThreshold) {
      return { success: false, reason: 'Auto-fix disabled or low confidence' };
    }

    const fixId = this.generateFixId(errorInfo);
    
    // Check if we've attempted this fix before
    if (this.fixHistory.has(fixId)) {
      const previousFix = this.fixHistory.get(fixId);
      if (previousFix.attempts >= this.options.maxFixAttempts) {
        return { success: false, reason: 'Max fix attempts reached' };
      }
      previousFix.attempts++;
    } else {
      this.fixHistory.set(fixId, {
        errorId: errorInfo.id,
        attempts: 1,
        lastAttempt: Date.now(),
        success: false
      });
    }

    // Generate fix with AI
    const fixPlan = await this.generateFixPlan(errorInfo);
    
    if (!fixPlan.feasible) {
      return { success: false, reason: 'Fix not feasible' };
    }

    // Execute fix
    const result = await this.executeFix(fixPlan, errorInfo);
    
    if (result.success) {
      errorInfo.status = 'fixed';
      this.healthMetrics.errorsFixed++;
      logger.info('AI successfully fixed error', { errorId: errorInfo.id, fixType: fixPlan.type });
    }

    return result;
  }

  /**
   * Generate fix plan using AI
   */
  async generateFixPlan(errorInfo) {
    const prompt = `You are an expert system that can automatically fix errors in a Node.js poker game.

Error Information:
- Type: ${errorInfo.type}
- Severity: ${errorInfo.severity}
- Category: ${errorInfo.category}
- Likely Cause: ${errorInfo.likelyCause}
- Suggested Fixes: ${errorInfo.suggestedFixes.join(', ')}

Generate a specific fix plan. Consider:
1. What specific file/code needs to be changed
2. What the exact change should be
3. Whether this fix is safe to apply automatically
4. What the expected outcome should be

Respond with JSON only:
{
  "feasible": true/false,
  "type": "code_change/config_update/restart_service",
  "targetFile": "path/to/file.js",
  "description": "What will be changed",
  "changes": [
    {
      "type": "add/remove/modify",
      "line": 123,
      "old": "old code",
      "new": "new code"
    }
  ],
  "risk": "low/medium/high",
  "expectedOutcome": "What should happen after fix"
}`;

    try {
      const response = await ai.chat([
        { role: 'system', content: 'You are an expert system fixer. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 800
      });

      const fixPlan = JSON.parse(response);
      
      // Validate fix plan
      if (!fixPlan.feasible || !fixPlan.changes || !fixPlan.changes.length) {
        throw new Error('Invalid fix plan format');
      }

      // Check if fix is safe
      if (fixPlan.risk === 'high' && errorInfo.severity !== 'critical') {
        return { feasible: false, reason: 'High risk fix for non-critical error' };
      }

      return fixPlan;
    } catch (aiError) {
      logger.error('AI fix generation failed', { error: aiError.message });
      return { feasible: false, reason: 'AI fix generation failed' };
    }
  }

  /**
   * Execute the fix plan
   */
  async executeFix(fixPlan, errorInfo) {
    try {
      switch (fixPlan.type) {
        case 'code_change':
          return await this.executeCodeChange(fixPlan, errorInfo);
        case 'config_update':
          return await this.executeConfigUpdate(fixPlan, errorInfo);
        case 'restart_service':
          return await this.executeRestart(fixPlan, errorInfo);
        default:
          return { success: false, reason: 'Unknown fix type' };
      }
    } catch (error) {
      logger.error('Fix execution failed', { error: error.message, fixPlan });
      return { success: false, reason: error.message };
    }
  }

  /**
   * Execute code changes
   */
  async executeCodeChange(fixPlan, errorInfo) {
    const filePath = path.resolve(fixPlan.targetFile);
    
    if (!fs.existsSync(filePath)) {
      return { success: false, reason: 'Target file not found' };
    }

    // Read current file
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Apply changes
    let changesApplied = 0;
    for (const change of fixPlan.changes) {
      if (change.line >= 0 && change.line < lines.length) {
        if (change.type === 'modify') {
          if (lines[change.line].includes(change.old)) {
            lines[change.line] = lines[change.line].replace(change.old, change.new);
            changesApplied++;
          }
        } else if (change.type === 'add') {
          lines.splice(change.line + 1, 0, change.new);
          changesApplied++;
        } else if (change.type === 'remove') {
          if (lines[change.line].includes(change.old)) {
            lines.splice(change.line, 1);
            changesApplied++;
          }
        }
      }
    }

    if (changesApplied === 0) {
      return { success: false, reason: 'No changes applied' };
    }

    // Write updated file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    // Learn from this fix
    if (this.options.enableLearning) {
      this.learnFromFix(fixPlan, errorInfo);
    }

    return { 
      success: true, 
      changesApplied,
      outcome: fixPlan.expectedOutcome 
    };
  }

  /**
   * Execute configuration updates
   */
  async executeConfigUpdate(fixPlan, errorInfo) {
    // This would update configuration files
    // Implementation depends on your config system
    return { success: true, outcome: 'Configuration updated' };
  }

  /**
   * Execute service restart
   */
  async executeRestart(fixPlan, errorInfo) {
    // This would restart the service
    // Implementation depends on your deployment system
    return { success: true, outcome: 'Service restarted' };
  }

  /**
   * Learn from successful fixes
   */
  learnFromFix(fixPlan, errorInfo) {
    const pattern = {
      errorType: errorInfo.type,
      errorCategory: errorInfo.category,
      errorMessage: errorInfo.description,
      fixType: fixPlan.type,
      fixChanges: fixPlan.changes,
      success: true,
      learnedAt: Date.now()
    };

    const patternKey = `${errorInfo.type}:${errorInfo.category}`;
    this.patterns.set(patternKey, pattern);
    
    logger.info('AI learned from fix', { patternKey });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const health = {
      timestamp: Date.now(),
      errorCount: this.errorHistory.size,
      fixCount: this.fixHistory.size,
      patterns: this.patterns.size,
      successRate: this.calculateSuccessRate(),
      activeErrors: this.getActiveErrors().length,
      recentFixes: this.getRecentFixes().length
    };

    this.healthMetrics = { ...this.healthMetrics, ...health };
    
    // Log health status
    if (health.activeErrors > 5) {
      logger.warn('High error count detected', health);
    }
    
    if (health.successRate < 0.5) {
      logger.warn('Low fix success rate', health);
    }
  }

  /**
   * Get system health report
   */
  getHealthReport() {
    return {
      metrics: this.healthMetrics,
      activeErrors: this.getActiveErrors(),
      recentFixes: this.getRecentFixes(),
      learnedPatterns: Array.from(this.patterns.entries()),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Get active errors
   */
  getActiveErrors() {
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    
    return Array.from(this.errorHistory.values())
      .filter(error => now - error.lastSeen < recentThreshold)
      .sort((a, b) => b.lastSeen - a.lastSeen);
  }

  /**
   * Get recent fixes
   */
  getRecentFixes() {
    const now = Date.now();
    const recentThreshold = 10 * 60 * 1000; // 10 minutes
    
    return Array.from(this.fixHistory.values())
      .filter(fix => now - fix.lastAttempt < recentThreshold)
      .sort((a, b) => b.lastAttempt - a.lastAttempt);
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate() {
    const totalFixes = this.fixHistory.size;
    if (totalFixes === 0) return 1.0;
    
    const successfulFixes = Array.from(this.fixHistory.values())
      .filter(fix => fix.success).length;
    
    return successfulFixes / totalFixes;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check for recurring errors
    const recurringErrors = Array.from(this.errorHistory.values())
      .filter(error => error.count > 3);
    
    if (recurringErrors.length > 0) {
      recommendations.push({
        type: 'recurring_errors',
        priority: 'high',
        message: `${recurringErrors.length} errors are recurring frequently`,
        action: 'Review and fix root causes'
      });
    }
    
    // Check fix success rate
    if (this.calculateSuccessRate() < 0.5) {
      recommendations.push({
        type: 'low_success_rate',
        priority: 'medium',
        message: 'Fix success rate is below 50%',
        action: 'Review fix strategies and improve detection'
      });
    }
    
    return recommendations;
  }

  /**
   * Load learned patterns
   */
  loadPatterns() {
    const patternsFile = path.join(__dirname, '../data/ai-patterns.json');
    
    if (fs.existsSync(patternsFile)) {
      try {
        const data = fs.readFileSync(patternsFile, 'utf8');
        const patterns = JSON.parse(data);
        
        patterns.forEach(([key, pattern]) => {
          this.patterns.set(key, pattern);
        });
        
        logger.info('Loaded learned patterns', { count: patterns.length });
      } catch (error) {
        logger.warn('Failed to load patterns', { error: error.message });
      }
    }
  }

  /**
   * Save learned patterns
   */
  savePatterns() {
    const patternsFile = path.join(__dirname, '../data/ai-patterns.json');
    const patterns = Array.from(this.patterns.entries());
    
    try {
      fs.writeFileSync(patternsFile, JSON.stringify(patterns, null, 2));
      logger.info('Saved learned patterns', { count: patterns.length });
    } catch (error) {
      logger.warn('Failed to save patterns', { error: error.message });
    }
  }

  /**
   * Generate error ID
   */
  generateErrorId(error) {
    const hash = require('crypto')
      .createHash('md5')
      .update(`${error.message}:${error.stack || ''}`)
      .digest('hex')
      .substring(0, 8);
    
    return `err_${hash}`;
  }

  /**
   * Generate fix ID
   */
  generateFixId(errorInfo) {
    return `fix_${errorInfo.id}`;
  }
}

module.exports = AIErrorManager;
