/**
 * Intent Router
 * Detects user intent from natural language input
 */

export interface Intent {
  type: string;
  confidence: number;
  entities: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IntentPattern {
  type: string;
  keywords: string[];
  patterns: RegExp[];
  priority: number;
}

const intentPatterns: IntentPattern[] = [
  {
    type: 'code_help',
    keywords: ['code', 'fix', 'debug', 'explain', 'review', 'function', 'class', 'bug', 'error'],
    patterns: [
      /fix\s+my\s+code/i,
      /explain\s+this\s+function/i,
      /debug\s+this/i,
      /review\s+my\s+code/i,
      /help\s+with\s+code/i
    ],
    priority: 1
  },
  {
    type: 'generate_image',
    keywords: ['image', 'picture', 'graphic', 'logo', 'design', 'art', 'draw', 'create'],
    patterns: [
      /generate\s+an?\s+image/i,
      /create\s+a\s+picture/i,
      /design\s+a\s+logo/i,
      /make\s+some\s+art/i,
      /draw\s+me/i
    ],
    priority: 1
  },
  {
    type: 'generate_audio',
    keywords: ['audio', 'sound', 'music', 'voice', 'track', 'beat', 'song'],
    patterns: [
      /generate\s+audio/i,
      /create\s+music/i,
      /make\s+a\s+sound/i,
      /produce\s+a\s+track/i,
      /voice\s+over/i
    ],
    priority: 1
  },
  {
    type: 'review_link',
    keywords: ['review', 'analyze', 'check', 'github', 'repo', 'gist', 'documentation', 'link'],
    patterns: [
      /review\s+this\s+(?:repo|link|url)/i,
      /analyze\s+this\s+(?:repo|link|url)/i,
      /check\s+this\s+(?:github|gist)/i,
      /https?:\/\/[^\s]+/i
    ],
    priority: 2
  },
  {
    type: 'start_game',
    keywords: ['game', 'play', 'start', 'begin', 'trivia', 'quiz'],
    patterns: [
      /start\s+a\s+game/i,
      /let's\s+play/i,
      /begin\s+trivia/i,
      /play\s+a\s+game/i
    ],
    priority: 1
  },
  {
    type: 'stream_monitoring',
    keywords: ['stream', 'monitor', 'check', 'status', 'live', 'broadcast'],
    patterns: [
      /check\s+my\s+stream/i,
      /monitor\s+the\s+stream/i,
      /stream\s+status/i,
      /how's\s+the\s+stream/i
    ],
    priority: 1
  },
  {
    type: 'chat_interaction',
    keywords: ['chat', 'message', 'respond', 'reply', 'talk'],
    patterns: [
      /respond\s+to\s+chat/i,
      /reply\s+to\s+message/i,
      /talk\s+to\s+viewers/i,
      /chat\s+with\s+audience/i
    ],
    priority: 1
  }
];

/**
 * Detect intent from user input
 */
export async function detectIntent(input: string): Promise<Intent> {
  const normalizedInput = input.toLowerCase().trim();
  
  let bestMatch: Intent = {
    type: 'general',
    confidence: 0,
    entities: {}
  };
  
  // Check each pattern
  for (const pattern of intentPatterns) {
    let confidence = 0;
    let entities: Record<string, any> = {};
    
    // Keyword matching
    const keywordMatches = pattern.keywords.filter(keyword => 
      normalizedInput.includes(keyword)
    ).length;
    
    if (keywordMatches > 0) {
      confidence += (keywordMatches / pattern.keywords.length) * 0.6;
    }
    
    // Pattern matching
    for (const regex of pattern.patterns) {
      const match = normalizedInput.match(regex);
      if (match) {
        confidence += 0.4;
        
        // Extract entities from regex groups
        if (match.groups) {
          entities = { ...entities, ...match.groups };
        }
        
        // Special entity extraction
        if (pattern.type === 'review_link') {
          const urlMatch = input.match(/https?:\/\/[^\s]+/i);
          if (urlMatch) {
            entities.url = urlMatch[0];
          }
        }
        
        if (pattern.type === 'generate_image') {
          const descMatch = input.match(/(?:generate|create|make)\s+(?:an?\s+)?(?:image|picture|graphic)\s+(?:of|with|that|showing)\s+(.+)/i);
          if (descMatch) {
            entities.description = descMatch[1];
          }
        }
        
        if (pattern.type === 'generate_audio') {
          const descMatch = input.match(/(?:generate|create|make)\s+(?:audio|music|sound)\s+(?:that|with|of)\s+(.+)/i);
          if (descMatch) {
            entities.description = descMatch[1];
          }
        }
      }
    }
    
    // Apply priority boost
    confidence *= (1 + pattern.priority * 0.1);
    
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        type: pattern.type,
        confidence,
        entities
      };
    }
  }
  
  // Add metadata
  bestMatch.metadata = {
    inputLength: input.length,
    hasUrl: /https?:\/\/[^\s]+/i.test(input),
    timestamp: Date.now()
  };
  
  console.log(`🎯 Intent detected: ${bestMatch.type} (${bestMatch.confidence.toFixed(2)})`);
  console.log(`📝 Entities:`, bestMatch.entities);
  
  return bestMatch;
}

/**
 * Get all available intents
 */
export function getAvailableIntents(): string[] {
  return intentPatterns.map(pattern => pattern.type);
}

/**
 * Add custom intent pattern
 */
export function addIntentPattern(pattern: IntentPattern): void {
  intentPatterns.push(pattern);
  console.log(`➕ Added intent pattern: ${pattern.type}`);
}

/**
 * Get intent patterns by type
 */
export function getIntentPattern(type: string): IntentPattern | undefined {
  return intentPatterns.find(pattern => pattern.type === type);
}

export default {
  detectIntent,
  getAvailableIntents,
  addIntentPattern,
  getIntentPattern
};
