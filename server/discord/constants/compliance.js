/**
 * Discord Compliance Constants
 * Global compliance flags for Acey Discord integration
 * 
 * IMPORTANT: These are READ-ONLY and must not be changed at runtime
 * LLM must check these before responding publicly
 */

// Core compliance principles - DO NOT CHANGE
const COMPLIANCE = {
  // Entertainment-only framing
  NO_REAL_MONEY: true,
  
  // No gambling language or mechanics
  ENTERTAINMENT_ONLY: true,
  
  // AI is non-authoritative and for entertainment
  AI_NON_AUTHORITY: true,
  
  // No gambling terminology anywhere
  NO_GAMBLING_TERMS: true,
  
  // No financial advice or predictions
  NO_FINANCIAL_ADVICE: true,
  
  // No guaranteed outcomes or promises
  NO_GUARANTEED_OUTCOMES: true,
  
  // Community engagement focus
  COMMUNITY_FOCUS: true,
  
  // Fictional points/chips only
  FICTIONAL_CURRENCY_ONLY: true
};

// Banned terms that must never appear in public responses
const BANNED_TERMS = [
  'gamble', 'gambling', 'gamblers',
  'bet', 'betting', 'bets',
  'wager', 'wagering', 'wagers',
  'stake', 'staking', 'stakes',
  'real money', 'real-money', 'realmoney',
  'cash', 'money', 'currency',
  'profit', 'profits', 'profitable',
  'win', 'winning', 'winner',
  'lose', 'losing', 'loser',
  'payout', 'payouts',
  'jackpot', 'jackpots',
  'casino', 'casinos',
  'poker room', 'poker rooms',
  'investment', 'investing',
  'return', 'returns', 'ROI',
  'risk', 'risky',
  'odds', 'probability',
  'house edge'
];

// Safe terminology to use instead
const SAFE_TERMS = {
  'bet': 'play',
  'betting': 'playing',
  'wager': 'participate',
  'money': 'points',
  'cash': 'chips',
  'win': 'succeed',
  'lose': 'try again',
  'profit': 'progress',
  'gambling': 'gaming',
  'casino': 'game room'
};

// Response templates that are always compliant
const COMPLIANT_RESPONSES = {
  greeting: "Acey is online ♠️ Chat drives the action.",
  entertainment: "This is all for fun and community engagement!",
  fictional: "All points and chips are fictional - no real value involved.",
  community: "Let's build a great community together!",
  ai_disclaimer: "Acey is an AI entertainment host. She does not facilitate gambling, does not provide financial advice, and does not guarantee outcomes. All interactions are for fun and community engagement."
};

// Compliance checker function
function checkCompliance(text) {
  const lowerText = text.toLowerCase();
  
  // Check for banned terms
  const violations = BANNED_TERMS.filter(term => lowerText.includes(term));
  
  if (violations.length > 0) {
    return {
      compliant: false,
      violations,
      suggestion: `Remove or replace: ${violations.join(', ')}`
    };
  }
  
  return { compliant: true };
}

// Safe text sanitizer
function sanitizeText(text) {
  let sanitized = text;
  
  // Replace banned terms with safe alternatives
  Object.entries(SAFE_TERMS).forEach(([banned, safe]) => {
    const regex = new RegExp(banned, 'gi');
    sanitized = sanitized.replace(regex, safe);
  
  return sanitized;
}

module.exports = {
  COMPLIANCE,
  BANNED_TERMS,
  SAFE_TERMS,
  COMPLIANT_RESPONSES,
  checkCompliance,
  sanitizeText
};
