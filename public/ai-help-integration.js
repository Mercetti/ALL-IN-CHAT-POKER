// AI Help Integration for All-In Chat Poker
class AIHelpIntegration {
    constructor() {
        this.ollamaEndpoint = 'http://localhost:11434';
        this.availableModels = ['qwen:0.5b', 'tinyllama:latest', 'llama3.2:1b', 'mistral:latest'];
        this.currentModel = 'llama3.2:1b'; // Default to the most capable working model
        this.searchHistory = [];
        this.init();
    }

    init() {
        this.checkOllamaStatus();
        this.setupEventListeners();
        this.loadSearchHistory();
    }

    async checkOllamaStatus() {
        try {
            const response = await fetch(`${this.ollamaEndpoint}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                this.updateAvailableModels(data.models);
                console.log('✅ Ollama is connected with models:', data.models.map(m => m.name));
            }
        } catch (error) {
            console.warn('⚠️ Ollama not available:', error.message);
            this.showOllamaWarning();
        }
    }

    updateAvailableModels(models) {
        // Filter to only working models
        this.availableModels = models
            .filter(model => this.isModelWorking(model.name))
            .map(model => model.name);
        
        // Update UI if model selector exists
        this.updateModelSelector();
    }

    isModelWorking(modelName) {
        const workingModels = ['qwen:0.5b', 'tinyllama:latest', 'llama3.2:1b', 'mistral:latest'];
        return workingModels.includes(modelName);
    }

    setupEventListeners() {
        // Add AI search to existing help search
        const searchInput = document.getElementById('helpSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.debounceSearch(e.target.value));
        }

        // Add model selector if not present
        this.addModelSelector();
    }

    addModelSelector() {
        const searchSection = document.querySelector('.search-section');
        if (!searchSection || document.getElementById('ai-model-selector')) return;

        const selectorHTML = `
            <div class="ai-model-selector" id="ai-model-selector">
                <label for="model-select">AI Model:</label>
                <select id="model-select" class="model-select">
                    ${this.availableModels.map(model => 
                        `<option value="${model}" ${model === this.currentModel ? 'selected' : ''}>
                            ${this.getModelDisplayName(model)}
                        </option>`
                    ).join('')}
                </select>
                <div class="ai-status" id="ai-status">
                    <span class="status-dot online"></span>
                    <span class="status-text">AI Ready</span>
                </div>
            </div>
        `;

        searchSection.insertAdjacentHTML('beforeend', selectorHTML);

        // Add event listener for model selection
        document.getElementById('model-select').addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.saveModelPreference();
        });
    }

    getModelDisplayName(modelName) {
        const displayNames = {
            'qwen:0.5b': 'Qwen (Fast)',
            'tinyllama:latest': 'TinyLlama (Quick)',
            'llama3.2:1b': 'Llama 3.2 (Balanced)',
            'mistral:latest': 'Mistral (Capable)'
        };
        return displayNames[modelName] || modelName;
    }

    async debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performAISearch(query);
        }, 300);
    }

    async performAISearch(query) {
        if (query.length < 3) return;

        this.showSearchLoading();
        
        try {
            const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.currentModel,
                    prompt: this.buildSearchPrompt(query),
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.displayAIResults(data.response, query);
            this.saveSearchHistory(query, data.response);

        } catch (error) {
            console.error('AI Search failed:', error);
            this.showSearchError(error.message);
        } finally {
            this.hideSearchLoading();
        }
    }

    buildSearchPrompt(query) {
        return `You are a helpful assistant for All-In Chat Poker, a Twitch streaming poker game. 

User is searching for: "${query}"

Please provide a helpful, concise answer about All-In Chat Poker. Focus on:
- Setup and configuration
- OBS integration  
- Twitch chat commands
- Troubleshooting common issues
- Game rules and features

Keep the answer under 200 words and be specific to All-In Chat Poker. If the query is about general poker, relate it back to how it works in All-In Chat Poker.

Answer:`;
    }

    displayAIResults(response, originalQuery) {
        const searchResults = document.querySelector('.search-results');
        if (!searchResults) {
            this.createSearchResultsContainer();
            return this.displayAIResults(response, originalQuery);
        }

        const aiResultHTML = `
            <div class="ai-search-result">
                <div class="ai-result-header">
                    <div class="ai-badge">
                        <span class="ai-icon">🤖</span>
                        <span class="ai-label">AI Assistant</span>
                        <span class="ai-model">${this.getModelDisplayName(this.currentModel)}</span>
                    </div>
                    <div class="ai-actions">
                        <button class="ai-action-btn" onclick="window.aiHelp.regenerateAnswer('${originalQuery}')" title="Regenerate">
                            🔄
                        </button>
                        <button class="ai-action-btn" onclick="window.aiHelp.copyAnswer()" title="Copy">
                            📋
                        </button>
                    </div>
                </div>
                <div class="ai-response">
                    ${this.formatResponse(response)}
                </div>
                <div class="ai-footer">
                    <span class="ai-query">Query: "${originalQuery}"</span>
                    <span class="ai-timestamp">${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
            <div class="related-articles">
                <h4>Related Help Articles</h4>
                ${this.getRelatedArticles(originalQuery)}
            </div>
        `;

        searchResults.innerHTML = aiResultHTML;
        searchResults.classList.add('active');
        
        // Scroll to results
        searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    formatResponse(response) {
        // Convert newlines to paragraphs and add basic formatting
        return response
            .split('\n\n')
            .map(paragraph => `<p>${paragraph.trim()}</p>`)
            .join('');
    }

    getRelatedArticles(query) {
        // Mock related articles based on query keywords
        const articles = {
            'setup': ['obs-setup', 'first-time-setup', 'twitch-auth'],
            'obs': ['obs-setup', 'overlay-customization'],
            'twitch': ['twitch-auth', 'chat-commands'],
            'error': ['common-errors', 'troubleshooting'],
            'commands': ['chat-commands', 'gameplay']
        };

        const keywords = Object.keys(articles).find(keyword => 
            query.toLowerCase().includes(keyword)
        );

        if (!keywords) return '<p>No specific articles found. Browse categories above.</p>';

        const relatedArticles = articles[keywords].map(articleId => {
            const articleData = this.getArticleData(articleId);
            return `
                <div class="related-article" onclick="window.enhancedHelp.openArticle('${articleId}')">
                    <h5>${articleData.title}</h5>
                    <p>${articleData.excerpt}</p>
                </div>
            `;
        }).join('');

        return relatedArticles;
    }

    getArticleData(articleId) {
        const articles = {
            'obs-setup': { title: 'OBS Browser Source Setup', excerpt: 'Learn how to add All-In Chat Poker to OBS' },
            'first-time-setup': { title: 'First Time Setup', excerpt: 'Get started in minutes' },
            'twitch-auth': { title: 'Twitch OAuth Guide', excerpt: 'Connect your Twitch account' },
            'chat-commands': { title: 'Chat Commands List', excerpt: 'All available viewer commands' },
            'common-errors': { title: 'Common Error Codes', excerpt: 'Troubleshoot common issues' },
            'overlay-customization': { title: 'Customize Your Overlay', excerpt: 'Personalize your game overlay' },
            'troubleshooting': { title: 'Troubleshooting Guide', excerpt: 'Complete troubleshooting guide' }
        };

        return articles[articleId] || { title: 'Article', excerpt: 'Help article content' };
    }

    async regenerateAnswer(query) {
        this.showSearchLoading();
        await this.performAISearch(query);
    }

    copyAnswer() {
        const responseText = document.querySelector('.ai-response')?.textContent;
        if (responseText) {
            navigator.clipboard.writeText(responseText).then(() => {
                if (window.enhancedCommon) {
                    window.enhancedCommon.showToast('Answer copied to clipboard!', 'success');
                }
            });
        }
    }

    showSearchLoading() {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.innerHTML = '<div class="ai-loading">🤖 AI is thinking...</div>';
            searchResults.classList.add('active');
        }
    }

    hideSearchLoading() {
        // Loading will be replaced by results
    }

    showSearchError(error) {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="ai-error">
                    <h4>❌ AI Search Failed</h4>
                    <p>${error}</p>
                    <p>Please try again or browse the help categories above.</p>
                </div>
            `;
            searchResults.classList.add('active');
        }
    }

    showOllamaWarning() {
        const searchSection = document.querySelector('.search-section');
        if (!searchSection || document.getElementById('ollama-warning')) return;

        const warningHTML = `
            <div class="ollama-warning" id="ollama-warning">
                <div class="warning-content">
                    <span class="warning-icon">⚠️</span>
                    <div class="warning-text">
                        <h4>AI Assistant Unavailable</h4>
                        <p>Ollama is not running. Please start Ollama to enable AI-powered search.</p>
                        <button class="btn btn-primary btn-sm" onclick="window.aiHelp.showOllamaSetup()">
                            Setup Instructions
                        </button>
                    </div>
                </div>
            </div>
        `;

        searchSection.insertAdjacentHTML('beforeend', warningHTML);
    }

    showOllamaSetup() {
        if (window.enhancedCommon) {
            window.enhancedCommon.openModal('ollama-setup-modal');
        }
    }

    createSearchResultsContainer() {
        const searchSection = document.querySelector('.search-section');
        const container = document.createElement('div');
        container.className = 'search-results';
        searchSection.appendChild(container);
    }

    updateModelSelector() {
        const select = document.getElementById('model-select');
        if (select) {
            select.innerHTML = this.availableModels.map(model => 
                `<option value="${model}" ${model === this.currentModel ? 'selected' : ''}>
                    ${this.getModelDisplayName(model)}
                </option>`
            ).join('');
        }
    }

    saveSearchHistory(query, response) {
        this.searchHistory.unshift({
            query,
            response,
            model: this.currentModel,
            timestamp: new Date().toISOString()
        });

        // Keep only last 20 searches
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        localStorage.setItem('ai_help_history', JSON.stringify(this.searchHistory));
    }

    loadSearchHistory() {
        const saved = localStorage.getItem('ai_help_history');
        if (saved) {
            try {
                this.searchHistory = JSON.parse(saved);
            } catch (error) {
                console.warn('Failed to load search history:', error);
            }
        }
    }

    saveModelPreference() {
        localStorage.setItem('ai_help_model', this.currentModel);
    }

    loadModelPreference() {
        const saved = localStorage.getItem('ai_help_model');
        if (saved && this.availableModels.includes(saved)) {
            this.currentModel = saved;
        }
    }

    // Public API
    async search(query) {
        await this.performAISearch(query);
    }

    setModel(modelName) {
        if (this.availableModels.includes(modelName)) {
            this.currentModel = modelName;
            this.saveModelPreference();
            this.updateModelSelector();
        }
    }

    getAvailableModels() {
        return this.availableModels;
    }

    isAvailable() {
        return this.availableModels.length > 0;
    }
}

// Add AI-specific styles
const aiStyles = `
.ai-model-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
}

.ai-model-selector label {
    color: var(--text-secondary);
    font-weight: 500;
}

.model-select {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    cursor: pointer;
}

.ai-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success-color);
}

.status-dot.offline {
    background: var(--error-color);
}

.ai-search-result {
    background: var(--glass-bg);
    border: 1px solid var(--primary-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.ai-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.ai-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--primary-color);
    color: var(--text-inverse);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
}

.ai-actions {
    display: flex;
    gap: 0.5rem;
}

.ai-action-btn {
    background: none;
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-normal);
}

.ai-action-btn:hover {
    background: var(--glass-border);
    color: var(--text-primary);
}

.ai-response {
    color: var(--text-primary);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.ai-response p {
    margin-bottom: 1rem;
}

.ai-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    border-top: 1px solid var(--glass-border);
    padding-top: 0.5rem;
}

.related-articles {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--glass-border);
}

.related-articles h4 {
    color: var(--text-primary);
    margin-bottom: 1rem;
}

.related-article {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all var(--transition-normal);
}

.related-article:hover {
    border-color: var(--primary-color);
    transform: translateX(5px);
}

.related-article h5 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.related-article p {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.ai-loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.ai-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--error-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    text-align: center;
}

.ai-error h4 {
    color: var(--error-color);
    margin-bottom: 1rem;
}

.ai-error p {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.ollama-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid var(--warning-color);
    border-radius: var(--radius-lg);
    padding: 1rem;
    margin-bottom: 1rem;
}

.warning-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.warning-icon {
    font-size: var(--font-size-xl);
}

.warning-text h4 {
    color: var(--warning-color);
    margin-bottom: 0.5rem;
}

.warning-text p {
    color: var(--text-secondary);
    margin-bottom: 1rem;
}

@media (max-width: 768px) {
    .ai-model-selector {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .ai-status {
        margin-left: 0;
        justify-content: center;
    }

    .ai-result-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }

    .ai-footer {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = aiStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiHelp = new AIHelpIntegration();
});

// Export for potential external use
window.AIHelpIntegration = AIHelpIntegration;
