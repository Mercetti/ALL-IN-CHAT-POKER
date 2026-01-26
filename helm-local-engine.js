/**
 * Local Helm Engine - Free Implementation
 */

class LocalHelmEngine {
  constructor() {
    this.skills = new Map();
    this.sessions = new Map();
    this.auditLog = [];
    this.isRunning = false;
    this.metrics = { totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0 };
  }

  async initialize() {
    console.log('🚀 Initializing Local Helm Engine...');
    await this.loadBuiltinSkills();
    this.startMonitoring();
    this.isRunning = true;
    console.log('✅ Local Helm Engine Ready');
  }

  async loadBuiltinSkills() {
    const skills = [
      { id: 'poker_deal', name: 'Poker Deal', execute: (p) => this.dealCards(p) },
      { id: 'poker_bet', name: 'Poker Bet', execute: (p) => this.placeBet(p) },
      { id: 'chat_response', name: 'Chat Response', execute: (p) => this.generateChatResponse(p) },
      { id: 'analytics', name: 'Analytics', execute: (p) => this.getAnalytics(p) }
    ];

    skills.forEach(skill => this.skills.set(skill.id, skill));
    console.log(`📦 Loaded ${skills.length} built-in skills`);
  }

  async executeSkill(skillId, params = {}, sessionId = 'default') {
    const startTime = Date.now();
    this.metrics.totalExecutions++;
    
    try {
      this.logEvent('skill_start', { skillId, sessionId, params });
      
      const skill = this.skills.get(skillId);
      if (!skill) throw new Error(`Skill not found: ${skillId}`);

      const result = await skill.execute(params);
      this.updateSession(sessionId, skillId, result);
      
      this.logEvent('skill_complete', { skillId, sessionId, duration: Date.now() - startTime });
      this.metrics.successfulExecutions++;
      
      return { success: true, result, skillId, sessionId };
      
    } catch (error) {
      this.metrics.failedExecutions++;
      this.logEvent('skill_error', { skillId, sessionId, error: error.message });
      throw error;
    }
  }

  async dealCards(params) {
    const { playerId, count = 5 } = params;
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    const cards = [];
    for (let i = 0; i < count; i++) {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      cards.push(`${rank}${suit}`);
    }
    
    return { playerId, cards, count: cards.length };
  }

  async placeBet(params) {
    const { playerId, amount } = params;
    if (amount <= 0) throw new Error('Bet amount must be positive');
    
    return { playerId, amount, betId: `bet_${Date.now()}`, status: 'placed' };
  }

  async generateChatResponse(params) {
    const responses = [
      "That's an interesting move!",
      "Nice cards you've got there!",
      "The pot is looking good right now.",
      "I'd recommend being careful with that bet."
    ];
    
    return { response: responses[Math.floor(Math.random() * responses.length)] };
  }

  async getAnalytics(params) {
    return {
      totalGames: Math.floor(Math.random() * 100) + 50,
      activePlayers: Math.floor(Math.random() * 10) + 1,
      totalBets: Math.floor(Math.random() * 1000) + 500
    };
  }

  logEvent(event, data) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event,
      data
    });
    
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  updateSession(sessionId, skillId, result) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { skills: [], startTime: Date.now() });
    }
    
    const session = this.sessions.get(sessionId);
    session.skills.push({ skillId, timestamp: Date.now(), result });
    session.lastActivity = Date.now();
  }

  startMonitoring() {
    setInterval(() => {
      const health = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        skills: this.skills.size,
        sessions: this.sessions.size,
        metrics: this.metrics
      };
      console.log('🔍 Helm Health:', health);
    }, 30000);
  }

  getStatus() {
    return {
      running: this.isRunning,
      skills: Array.from(this.skills.keys()),
      sessions: this.sessions.size,
      auditLogSize: this.auditLog.length,
      metrics: this.metrics,
      uptime: process.uptime()
    };
  }
}

module.exports = LocalHelmEngine;
