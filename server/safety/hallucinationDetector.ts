/**
 * Live Hallucination Detection System
 * Real-time detection of when Acey is guessing or fabricating information
 */

export interface HallucinationSignals {
  confidence: number;
  memoryMatches: number;
  contradictionCount: number;
  logProbability?: number;
  entropy?: number;
  creativityMarkers?: number;
  factualDensity?: number;
}

export interface HallucinationResult {
  score: number; // 0-1, higher = more likely hallucination
  risk: "low" | "medium" | "high";
  recommendations: string[];
  signals: HallucinationSignals;
  detectedAt: number;
}

export interface ResponsePolicy {
  shouldProceed: boolean;
  shouldHedge: boolean;
  shouldDefer: boolean;
  suggestedModifiers: string[];
}

class HallucinationDetector {
  private readonly LOW_RISK_THRESHOLD = 0.4;
  private readonly MEDIUM_RISK_THRESHOLD = 0.7;
  private readonly HIGH_RISK_THRESHOLD = 0.8;

  /**
   * Calculate hallucination score based on multiple signals
   */
  hallucinationScore(signals: HallucinationSignals): number {
    let score = 0;

    // Low confidence is a strong indicator
    if (signals.confidence < 0.6) {
      score += 0.4;
    } else if (signals.confidence < 0.8) {
      score += 0.2;
    }

    // No supporting memories
    if (signals.memoryMatches < 1) {
      score += 0.4;
    } else if (signals.memoryMatches < 3) {
      score += 0.2;
    }

    // Contradictions are very bad
    if (signals.contradictionCount > 0) {
      score += Math.min(0.3 * signals.contradictionCount, 0.5);
    }

    // Low log probability (model uncertainty)
    if (signals.logProbability !== undefined && signals.logProbability < -2.5) {
      score += 0.2;
    }

    // High entropy (uncertain output)
    if (signals.entropy !== undefined && signals.entropy > 3.0) {
      score += 0.15;
    }

    // Excessive creativity markers
    if (signals.creativityMarkers !== undefined && signals.creativityMarkers > 5) {
      score += 0.1;
    }

    // Low factual density
    if (signals.factualDensity !== undefined && signals.factualDensity < 0.3) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect hallucination in real-time
   */
  detectHallucination(
    content: string,
    signals: HallucinationSignals
  ): HallucinationResult {
    const score = this.hallucinationScore(signals);
    const risk = this.determineRisk(score);
    const recommendations = this.generateRecommendations(score, risk, content);

    return {
      score,
      risk,
      recommendations,
      signals,
      detectedAt: Date.now()
    };
  }

  /**
   * Determine risk level based on score
   */
  private determineRisk(score: number): "low" | "medium" | "high" {
    if (score < this.LOW_RISK_THRESHOLD) return "low";
    if (score < this.HIGH_RISK_THRESHOLD) return "medium";
    return "high";
  }

  /**
   * Generate recommendations based on risk level
   */
  private generateRecommendations(
    score: number,
    risk: "low" | "medium" | "high",
    content: string
  ): string[] {
    const recommendations: string[] = [];

    switch (risk) {
      case "low":
        recommendations.push("Response appears reliable");
        break;

      case "medium":
        recommendations.push("Add uncertainty language");
        recommendations.push("Consider asking for clarification");
        if (content.length > 200) {
          recommendations.push("Shorten response to reduce speculation");
        }
        break;

      case "high":
        recommendations.push("DO NOT fabricate information");
        recommendations.push("Admit uncertainty explicitly");
        recommendations.push("Ask for human guidance");
        recommendations.push("Suggest alternative approaches");
        break;
    }

    return recommendations;
  }

  /**
   * Determine response policy based on hallucination risk
   */
  getResponsePolicy(result: HallucinationResult): ResponsePolicy {
    const { score, risk } = result;

    return {
      shouldProceed: score < this.HIGH_RISK_THRESHOLD,
      shouldHedge: score >= this.LOW_RISK_THRESHOLD && score < this.HIGH_RISK_THRESHOLD,
      shouldDefer: score >= this.HIGH_RISK_THRESHOLD,
      suggestedModifiers: this.getSuggestedModifiers(risk)
    };
  }

  /**
   * Get suggested language modifiers based on risk
   */
  private getSuggestedModifiers(risk: "low" | "medium" | "high"): string[] {
    switch (risk) {
      case "low":
        return [];

      case "medium":
        return [
          "I believe",
          "It seems",
          "Based on my understanding",
          "This might be",
          "I'm not entirely certain, but"
        ];

      case "high":
        return [
          "I'm not sure about this",
          "I don't have enough information",
          "This is speculative",
          "I would need to verify this",
          "I'm uncertain about"
        ];
    }
  }

  /**
   * Analyze content for creativity markers (potential fabrication)
   */
  analyzeCreativityMarkers(content: string): number {
    const creativePatterns = [
      /\b(imagine|picture|envision|visualize)\b/gi,
      /\b(perhaps|maybe|possibly|could be)\b/gi,
      /\b(in my opinion|I think|I believe)\b/gi,
      /\b(theoretically|hypothetically)\b/gi,
      /\b(story|narrative|tale)\b/gi
    ];

    let markerCount = 0;
    for (const pattern of creativePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        markerCount += matches.length;
      }
    }

    return markerCount;
  }

  /**
   * Calculate factual density of content
   */
  calculateFactualDensity(content: string): number {
    // Simple heuristic: count specific indicators vs total words
    const factualIndicators = [
      /\b\d+\b/g, // Numbers
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s\d{1,2},?\s\d{4}\b/gi, // Dates
      /\b(?:https?:\/\/|www\.)\S+\b/g, // URLs
      /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g, // Proper nouns
      /\b(?:\$|€|£)\d+(?:\.\d{2})?\b/g, // Money
      /\b\d+(?:\s|%)|%\d+/g // Percentages
    ];

    let factualCount = 0;
    for (const pattern of factualIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        factualCount += matches.length;
      }
    }

    const totalWords = content.split(/\s+/).length;
    return totalWords > 0 ? factualCount / totalWords : 0;
  }

  /**
   * Detect contradictions in content compared to known facts
   */
  detectContradictions(content: string, knownFacts: string[]): number {
    // Simple contradiction detection - would be more sophisticated in practice
    const contradictions = [
      /\b(always|never)\b/gi,
      /\b(every|none|no one)\b/gi,
      /\b(impossible|certain|definitely)\b/gi
    ];

    let contradictionCount = 0;
    for (const pattern of contradictions) {
      const matches = content.match(pattern);
      if (matches) {
        contradictionCount += matches.length;
      }
    }

    // Check against known facts (simplified)
    for (const fact of knownFacts) {
      if (content.toLowerCase().includes(fact.toLowerCase()) && 
          content.toLowerCase().includes("not")) {
        contradictionCount++;
      }
    }

    return contradictionCount;
  }

  /**
   * Get real-time analysis of content
   */
  async analyzeContent(
    content: string,
    confidence: number,
    memoryMatches: number,
    knownFacts: string[] = []
  ): Promise<HallucinationResult> {
    const signals: HallucinationSignals = {
      confidence,
      memoryMatches,
      contradictionCount: this.detectContradictions(content, knownFacts),
      creativityMarkers: this.analyzeCreativityMarkers(content),
      factualDensity: this.calculateFactualDensity(content)
    };

    return this.detectHallucination(content, signals);
  }

  /**
   * Apply response policy to content
   */
  applyResponsePolicy(content: string, policy: ResponsePolicy): string {
    if (!policy.shouldHedge && !policy.shouldDefer) {
      return content;
    }

    let modifiedContent = content;

    if (policy.shouldHedge && policy.suggestedModifiers.length > 0) {
      // Add uncertainty language at the beginning
      const modifier = policy.suggestedModifiers[
        Math.floor(Math.random() * policy.suggestedModifiers.length)
      ];
      modifiedContent = `${modifier}, ${modifiedContent.toLowerCase()}`;
    }

    if (policy.shouldDefer) {
      // Add explicit uncertainty and request for guidance
      modifiedContent = `I'm not certain about this and would prefer not to speculate. ${modifiedContent}`;
      
      if (!modifiedContent.includes("help") && !modifiedContent.includes("clarify")) {
        modifiedContent += " Could you provide more context or clarify what you'd like me to help with?";
      }
    }

    return modifiedContent;
  }

  /**
   * Get hallucination detection statistics
   */
  getStats(): {
    totalDetections: number;
    averageScore: number;
    riskDistribution: Record<"low" | "medium" | "high", number>;
  } {
    // This would track historical data in a real implementation
    return {
      totalDetections: 0,
      averageScore: 0,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0
      }
    };
  }
}

export { HallucinationDetector };
