/**
 * Twitch Chat Feedback Reinforcement Loops
 * Acey learns from crowd reaction without storing personal data
 */

export interface FeedbackSignal {
  actionId: string;
  positive: number;
  negative: number;
  hypeLevel: number; // 0-1
  timestamp: number;
  metadata?: {
    messageCount: number;
    emoteSpam: boolean;
    clipCreated: boolean;
    keywords: string[];
  };
}

export interface ReinforcementMetrics {
  trustDelta: number;
  confidenceAdjustment: number;
  pacingAdjustment: number;
  difficultyAdjustment: number;
  toneAdjustment: number;
}

export interface ChatEvent {
  type: "message" | "emote" | "subscription" | "clip" | "raid";
  content: string;
  timestamp: number;
  userId?: string; // Hashed, not stored
  metadata?: {
    isEmoteSpam?: boolean;
    messageVelocity?: number;
    repetitionCount?: number;
  };
}

class ChatFeedbackProcessor {
  private feedbackHistory: Map<string, FeedbackSignal[]> = new Map();
  private positiveKeywords = [
    "lol", "lmao", "haha", "nice", "good", "great", "awesome", "amazing",
    "love", "like", "yes", "yay", "pog", "poggers", "hyp", "hype", "fire",
    "gg", "wp", "clutch", "insane", "crazy", "epic", "legendary"
  ];
  
  private negativeKeywords = [
    "bad", "terrible", "awful", "hate", "no", "stop", "quit", "leave",
    "boring", "slow", "dumb", "stupid", "wrong", "fail", "trash", "garbage"
  ];

  private emotePatterns = [
    /\b(pog|poggers|pogchamp|kappa|kekw|lul|omegalul|pepelaugh|pepo)\b/gi,
    /\b(hype|hype train|hypers|fire|lit|goat)\b/gi,
    /\b(love|heart|❤️|💕|💖|😍)\b/gi,
    /\b(angry|mad|salt|salty|😠|😡)\b/gi
  ];

  /**
   * Process chat events and extract feedback signals
   */
  processChatEvents(events: ChatEvent[], actionId: string): FeedbackSignal {
    let positive = 0;
    let negative = 0;
    let hypeLevel = 0;
    let messageCount = events.length;
    let emoteSpam = false;
    let clipCreated = false;
    const keywords: string[] = [];

    // Analyze each event
    for (const event of events) {
      const content = event.content.toLowerCase();

      // Count positive reactions
      for (const keyword of this.positiveKeywords) {
        if (content.includes(keyword)) {
          positive++;
          keywords.push(keyword);
        }
      }

      // Count negative reactions
      for (const keyword of this.negativeKeywords) {
        if (content.includes(keyword)) {
          negative++;
          keywords.push(keyword);
        }
      }

      // Detect emote spam
      if (event.metadata?.isEmoteSpam || this.detectEmoteSpam(content)) {
        emoteSpam = true;
        positive += 2; // Emote spam is usually positive
      }

      // Check for clip creation
      if (event.type === "clip") {
        clipCreated = true;
        positive += 5; // Clips are strong positive signals
      }

      // Calculate message velocity (messages per second)
      if (event.metadata?.messageVelocity) {
        const velocity = event.metadata.messageVelocity;
        if (velocity > 10) { // High velocity = high engagement
          hypeLevel = Math.min(velocity / 50, 1.0);
        }
      }
    }

    // Calculate hype level based on various factors
    if (emoteSpam) hypeLevel += 0.3;
    if (clipCreated) hypeLevel += 0.4;
    if (positive > negative * 2) hypeLevel += 0.3;

    hypeLevel = Math.min(hypeLevel, 1.0);

    const feedback: FeedbackSignal = {
      actionId,
      positive,
      negative,
      hypeLevel,
      timestamp: Date.now(),
      metadata: {
        messageCount,
        emoteSpam,
        clipCreated,
        keywords
      }
    };

    // Store feedback
    if (!this.feedbackHistory.has(actionId)) {
      this.feedbackHistory.set(actionId, []);
    }
    this.feedbackHistory.get(actionId)!.push(feedback);

    return feedback;
  }

  /**
   * Detect emote spam in message content
   */
  private detectEmoteSpam(content: string): boolean {
    let emoteCount = 0;
    for (const pattern of this.emotePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        emoteCount += matches.length;
      }
    }

    // Consider it spam if there are 3+ emotes in a short message
    return emoteCount >= 3 && content.length < 100;
  }

  /**
   * Calculate reinforcement metrics from feedback
   */
  calculateReinforcement(feedback: FeedbackSignal): ReinforcementMetrics {
    // Base trust delta calculation
    let trustDelta = (feedback.positive - feedback.negative) * 0.05;
    trustDelta += feedback.hypeLevel * 0.1;

    // Confidence adjustment based on feedback consistency
    const totalReactions = feedback.positive + feedback.negative;
    let confidenceAdjustment = 0;
    
    if (totalReactions > 0) {
      const positiveRatio = feedback.positive / totalReactions;
      if (positiveRatio > 0.7) {
        confidenceAdjustment = 0.1;
      } else if (positiveRatio < 0.3) {
        confidenceAdjustment = -0.1;
      }
    }

    // Pacing adjustment based on message velocity and hype
    let pacingAdjustment = 0;
    if (feedback.hypeLevel > 0.7) {
      pacingAdjustment = 0.05; // Speed up when chat is hyped
    } else if (feedback.hypeLevel < 0.3 && feedback.negative > feedback.positive) {
      pacingAdjustment = -0.05; // Slow down when chat is disengaged
    }

    // Difficulty adjustment based on comprehension
    let difficultyAdjustment = 0;
    if (feedback.negative > feedback.positive * 1.5) {
      difficultyAdjustment = -0.1; // Make content simpler
    } else if (feedback.positive > feedback.negative * 2 && feedback.hypeLevel > 0.6) {
      difficultyAdjustment = 0.1; // Can increase complexity
    }

    // Tone adjustment based on emotional response
    let toneAdjustment = 0;
    if (feedback.metadata?.keywords.some(k => this.positiveKeywords.includes(k))) {
      toneAdjustment = 0.05; // More playful/engaging
    } else if (feedback.metadata?.keywords.some(k => this.negativeKeywords.includes(k))) {
      toneAdjustment = -0.05; // More serious/helpful
    }

    return {
      trustDelta,
      confidenceAdjustment,
      pacingAdjustment,
      difficultyAdjustment,
      toneAdjustment
    };
  }

  /**
   * Get aggregated feedback for an action over time
   */
  getAggregatedFeedback(actionId: string, timeWindow: number = 300000): FeedbackSignal | null {
    const feedbacks = this.feedbackHistory.get(actionId);
    if (!feedbacks || feedbacks.length === 0) {
      return null;
    }

    const now = Date.now();
    const recentFeedbacks = feedbacks.filter(f => now - f.timestamp < timeWindow);

    if (recentFeedbacks.length === 0) {
      return null;
    }

    // Aggregate all recent feedback
    const aggregated: FeedbackSignal = {
      actionId,
      positive: recentFeedbacks.reduce((sum, f) => sum + f.positive, 0),
      negative: recentFeedbacks.reduce((sum, f) => sum + f.negative, 0),
      hypeLevel: recentFeedbacks.reduce((sum, f) => sum + f.hypeLevel, 0) / recentFeedbacks.length,
      timestamp: now,
      metadata: {
        messageCount: recentFeedbacks.reduce((sum, f) => sum + (f.metadata?.messageCount || 0), 0),
        emoteSpam: recentFeedbacks.some(f => f.metadata?.emoteSpam),
        clipCreated: recentFeedbacks.some(f => f.metadata?.clipCreated),
        keywords: recentFeedbacks.flatMap(f => f.metadata?.keywords || [])
      }
    };

    return aggregated;
  }

  /**
   * Apply reinforcement to memory trust scores
   */
  applyReinforcementToMemory(
    memoryId: string,
    reinforcement: ReinforcementMetrics,
    currentTrust: number
  ): number {
    let newTrust = currentTrust;

    // Apply trust delta (bounded between 0 and 1)
    newTrust += reinforcement.trustDelta;
    newTrust = Math.max(0, Math.min(1, newTrust));

    // Apply confidence adjustment
    newTrust += reinforcement.confidenceAdjustment * 0.1;
    newTrust = Math.max(0, Math.min(1, newTrust));

    return newTrust;
  }

  /**
   * Get feedback statistics
   */
  getFeedbackStats(): {
    totalActions: number;
    averagePositiveRatio: number;
    averageHypeLevel: number;
    mostPositiveActions: string[];
    mostNegativeActions: string[];
  } {
    const allFeedbacks: FeedbackSignal[] = [];
    for (const feedbacks of this.feedbackHistory.values()) {
      allFeedbacks.push(...feedbacks);
    }

    if (allFeedbacks.length === 0) {
      return {
        totalActions: 0,
        averagePositiveRatio: 0,
        averageHypeLevel: 0,
        mostPositiveActions: [],
        mostNegativeActions: []
      };
    }

    const totalReactions = allFeedbacks.reduce((sum, f) => sum + f.positive + f.negative, 0);
    const totalPositive = allFeedbacks.reduce((sum, f) => sum + f.positive, 0);
    const averagePositiveRatio = totalReactions > 0 ? totalPositive / totalReactions : 0;
    const averageHypeLevel = allFeedbacks.reduce((sum, f) => sum + f.hypeLevel, 0) / allFeedbacks.length;

    // Find most positive and negative actions
    const actionScores = new Map<string, number>();
    for (const feedback of allFeedbacks) {
      const score = feedback.positive - feedback.negative;
      const existing = actionScores.get(feedback.actionId) || 0;
      actionScores.set(feedback.actionId, existing + score);
    }

    const sortedActions = Array.from(actionScores.entries())
      .sort((a, b) => b[1] - a[1]);

    const mostPositiveActions = sortedActions.slice(0, 5).map(([actionId]) => actionId);
    const mostNegativeActions = sortedActions.slice(-5).reverse().map(([actionId]) => actionId);

    return {
      totalActions: this.feedbackHistory.size,
      averagePositiveRatio,
      averageHypeLevel,
      mostPositiveActions,
      mostNegativeActions
    };
  }

  /**
   * Clean up old feedback data
   */
  cleanup(maxAge: number = 86400000): void { // 24 hours
    const now = Date.now();
    
    for (const [actionId, feedbacks] of this.feedbackHistory.entries()) {
      const recentFeedbacks = feedbacks.filter(f => now - f.timestamp < maxAge);
      
      if (recentFeedbacks.length === 0) {
        this.feedbackHistory.delete(actionId);
      } else {
        this.feedbackHistory.set(actionId, recentFeedbacks);
      }
    }
  }

  /**
   * Export feedback data for analysis (anonymized)
   */
  exportFeedbackData(): Array<{
    actionId: string;
    positive: number;
    negative: number;
    hypeLevel: number;
    timestamp: number;
  }> {
    const exported: Array<{
      actionId: string;
      positive: number;
      negative: number;
      hypeLevel: number;
      timestamp: number;
    }> = [];

    for (const feedbacks of this.feedbackHistory.values()) {
      for (const feedback of feedbacks) {
        exported.push({
          actionId: feedback.actionId,
          positive: feedback.positive,
          negative: feedback.negative,
          hypeLevel: feedback.hypeLevel,
          timestamp: feedback.timestamp
        });
      }
    }

    return exported;
  }
}

export { ChatFeedbackProcessor };
