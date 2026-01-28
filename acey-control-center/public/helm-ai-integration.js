// Helm AI Integration Layer for Poker Game
// Bridges poker game with Helm AI backend

/* global fetch, console */

class HelmAIIntegration {
    constructor() {
        this.helmAPIBase = 'http://localhost:3001/api';
        this.isHelmAvailable = false;
        this.fallbackMode = true;
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessing = false;
    }

    // Check if Helm AI server is available
    async checkHelmAvailability() {
        try {
            const response = await fetch(`${this.helmAPIBase}/health`);
            if (response.ok) {
                this.isHelmAvailable = true;
                this.fallbackMode = false;
                // eslint-disable-next-line no-console
                console.log('✅ Helm AI server is available');
                return true;
            }
        } catch {
            // eslint-disable-next-line no-console
            console.log('⚠️ Helm AI server not available, using fallback mode');
            this.isHelmAvailable = false;
            this.fallbackMode = true;
            return false;
        }
    }

    // Get AI analysis from Helm AI or fallback
    async getAIAnalysis(eventType, data) {
        if (this.isHelmAvailable && !this.fallbackMode) {
            return await this.callHelmAI(eventType, data);
        } else {
            return this.getFallbackAnalysis(eventType, data);
        }
    }

    // Call Helm AI backend
    async callHelmAI(eventType, data) {
        try {
            const cacheKey = `${eventType}-${JSON.stringify(data)}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const response = await fetch(`${this.helmAPIBase}/poker/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventType,
                    data,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Cache the result
                this.cache.set(cacheKey, result);
                
                // Limit cache size
                if (this.cache.size > 100) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
                
                return result;
            } else {
                // eslint-disable-next-line no-console
                console.warn('Helm AI call failed, using fallback');
                return this.getFallbackAnalysis(eventType, data);
            }
        } catch {
            // eslint-disable-next-line no-console
            console.error('Error calling Helm AI, using fallback');
            return this.getFallbackAnalysis(eventType, data);
        }
    }

    // Fallback analysis when Helm AI is not available
    getFallbackAnalysis(eventType, data) {
        const fallbackResponses = {
            player_behavior: {
                success: true,
                data: {
                    analysis: {
                        behaviorPattern: this.analyzePlayerBehavior(data),
                        riskLevel: this.assessRiskLevel(data),
                        recommendations: this.getBehaviorRecommendations(data),
                        confidence: 0.85,
                        source: 'fallback'
                    },
                    timestamp: new Date().toISOString()
                }
            },
            game_event: {
                success: true,
                data: {
                    analysis: {
                        eventImpact: this.analyzeGameEvent(data),
                        gameState: this.assessGameState(data),
                        nextActions: this.getNextActions(data),
                        confidence: 0.80,
                        source: 'fallback'
                    },
                    timestamp: new Date().toISOString()
                }
            },
            security_threat: {
                success: true,
                data: {
                    analysis: {
                        threatType: this.classifyThreat(data),
                        severity: this.assessSeverity(data),
                        actions: this.getSecurityActions(data),
                        confidence: 0.90,
                        source: 'fallback'
                    },
                    timestamp: new Date().toISOString()
                }
            }
        };

        return fallbackResponses[eventType] || {
            success: true,
            data: {
                analysis: {
                    message: 'Analysis not available in fallback mode',
                    confidence: 0.50,
                    source: 'fallback'
                },
                timestamp: new Date().toISOString()
            }
        };
    }

    // Fallback player behavior analysis
    analyzePlayerBehavior(data) {
        const behaviors = {
            fold: 'Conservative play pattern detected',
            call: 'Neutral play pattern detected',
            raise: 'Aggressive play pattern detected',
            check: 'Passive play pattern detected',
            all_in: 'High-risk play pattern detected'
        };
        
        return behaviors[data.action] || 'Unknown behavior pattern';
    }

    // Fallback risk assessment
    assessRiskLevel(data) {
        const riskLevels = {
            fold: 'low',
            call: 'medium',
            raise: 'medium',
            check: 'low',
            all_in: 'high'
        };
        
        return riskLevels[data.action] || 'medium';
    }

    // Fallback recommendations
    getBehaviorRecommendations(data) {
        const recommendations = {
            fold: ['Monitor for tight play patterns', 'Consider bluffing opportunities'],
            call: ['Observe betting patterns', 'Look for tells'],
            raise: ['Watch for aggressive play', 'Consider folding if over-raised'],
            check: ['Monitor for trapping behavior', 'Consider continuation bets'],
            all_in: ['Immediate security review required', 'Monitor for collusion patterns']
        };
        
        return recommendations[data.action] || ['Continue monitoring'];
    }

    // Fallback game event analysis
    analyzeGameEvent() {
        return {
            impact: 'Moderate',
            description: 'Game event processed successfully',
            affectedPlayers: []
        };
    }

    // Fallback game state assessment
    assessGameState() {
        return {
            status: 'active',
            stability: 'stable',
            integrity: 'intact'
        };
    }

    // Fallback next actions
    getNextActions() {
        return [
            'Continue monitoring game flow',
            'Maintain security protocols',
            'Update player statistics'
        ];
    }

    // Fallback threat classification
    classifyThreat() {
        return 'unknown';
    }

    // Fallback severity assessment
    assessSeverity() {
        return 'medium';
    }

    // Fallback security actions
    getSecurityActions() {
        return [
            'Log security event',
            'Monitor for patterns',
            'Escalate if necessary'
        ];
    }

    // Get Helm AI capabilities
    async getHelmCapabilities() {
        if (!this.isHelmAvailable) {
            return {
                available: false,
                capabilities: [],
                message: 'Helm AI server not available'
            };
        }

        try {
            const endpoints = [
                '/ai/llm-development',
                '/ai/learning-enhancement',
                '/ai/safety-governance',
                '/ai/improvement-strategies',
                '/ip/protection-assessment',
                '/ip/competitive-moat',
                '/ip/valuation'
            ];

            const capabilities = {};
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${this.helmAPIBase}${endpoint}`);
                    if (response.ok) {
                        const data = await response.json();
                        const capabilityName = endpoint.split('/').pop();
                        capabilities[capabilityName] = {
                            available: true,
                            data: data.success ? data.data : null
                        };
                    }
                } catch {
                    // eslint-disable-next-line no-console
                    console.warn(`Failed to fetch ${endpoint}`);
                }
            }

            return {
                available: true,
                capabilities,
                message: 'Helm AI capabilities loaded successfully'
            };
        } catch {
            return {
                available: false,
                capabilities: [],
                message: 'Failed to load Helm AI capabilities'
            };
        }
    }

    // Initialize Helm AI integration
    async initialize() {
        // eslint-disable-next-line no-console
        console.log('🚀 Initializing Helm AI integration...');
        
        // Check availability
        await this.checkHelmAvailability();
        
        // Load capabilities if available
        if (this.isHelmAvailable) {
            const capabilities = await this.getHelmCapabilities();
            // eslint-disable-next-line no-console
            console.log('🧠 Helm AI capabilities loaded:', capabilities);
        }
        
        // eslint-disable-next-line no-console
        console.log('✅ Helm AI integration initialized');
        return {
            initialized: true,
            helmAvailable: this.isHelmAvailable,
            fallbackMode: this.fallbackMode
        };
    }

    // Get integration status
    getStatus() {
        return {
            helmAvailable: this.isHelmAvailable,
            fallbackMode: this.fallbackMode,
            cacheSize: this.cache.size,
            queueLength: this.requestQueue.length
        };
    }
}

// Create global instance
/* global window */
window.helmAIIntegration = new HelmAIIntegration();

// Auto-initialize when page loads
/* global document */
document.addEventListener('DOMContentLoaded', () => {
    window.helmAIIntegration.initialize();
});

// eslint-disable-next-line no-console
console.log('🤖 Helm AI Integration Layer loaded');
