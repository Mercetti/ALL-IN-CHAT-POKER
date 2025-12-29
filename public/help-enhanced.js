// Enhanced Help Page JavaScript
class EnhancedHelp {
    constructor() {
        this.searchResults = [];
        this.currentCategory = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initSearch();
        this.initFAQ();
        this.initAnimations();
        this.initAnalytics();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('helpSearch');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (searchInput) {
                    this.performSearch(searchInput.value);
                }
            });
        }

        // Topic tags
        document.querySelectorAll('.topic-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const topic = tag.dataset.topic;
                this.filterByTopic(topic);
            });
        });

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.showCategoryArticles(category);
            });
        });

        // Help articles
        document.querySelectorAll('.help-article').forEach(article => {
            article.addEventListener('click', () => {
                const articleId = article.dataset.article;
                this.openArticle(articleId);
            });
        });

        // FAQ items
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                this.toggleFAQ(faqItem);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                searchInput?.focus();
            }
        });
    }

    initSearch() {
        // Mock search data - in real implementation, this would come from an API
        this.searchData = [
            { id: 'obs-setup', title: 'OBS Browser Source Setup', category: 'obs', excerpt: 'Learn how to add All-In Chat Poker to OBS', content: 'Detailed guide for OBS setup...' },
            { id: 'twitch-auth', title: 'Twitch OAuth Guide', category: 'twitch', excerpt: 'Connect your Twitch account', content: 'Step by step OAuth process...' },
            { id: 'common-errors', title: 'Common Error Codes', category: 'troubleshooting', excerpt: 'Troubleshoot common issues', content: 'Error codes and solutions...' },
            { id: 'chat-commands', title: 'Chat Commands List', category: 'gameplay', excerpt: 'All available viewer commands', content: 'Complete command reference...' },
            { id: 'overlay-customization', title: 'Customize Your Overlay', category: 'advanced', excerpt: 'Personalize your game overlay', content: 'Overlay customization guide...' },
            { id: 'first-time-setup', title: 'First Time Setup', category: 'setup', excerpt: 'Get started in minutes', content: 'Complete setup walkthrough...' }
        ];
    }

    handleSearch(query) {
        const searchResults = document.querySelector('.search-results');
        
        if (query.length < 2) {
            searchResults?.classList.remove('active');
            return;
        }

        const results = this.searchData.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.excerpt.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

        this.displaySearchResults(results);
    }

    performSearch(query) {
        if (query.length < 2) return;

        // Show loading state
        this.showSearchLoading();

        // Simulate API call
        setTimeout(() => {
            const results = this.searchData.filter(item => 
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.excerpt.toLowerCase().includes(query.toLowerCase())
            );

            this.hideSearchLoading();
            this.displaySearchResults(results);
            
            // Track search analytics
            this.trackSearch(query, results.length);
        }, 300);
    }

    displaySearchResults(results) {
        const searchResults = document.querySelector('.search-results');
        
        if (!searchResults) {
            this.createSearchResultsContainer();
            return this.displaySearchResults(results);
        }

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <p>No results found for your search.</p>
                    <p>Try different keywords or <a href="#" onclick="window.enhancedHelp.showContactForm()">contact support</a>.</p>
                </div>
            `;
        } else {
            searchResults.innerHTML = results.map(result => `
                <div class="search-result-item" data-article="${result.id}">
                    <div class="search-result-title">${this.highlightSearchTerm(result.title)}</div>
                    <div class="search-result-excerpt">${this.highlightSearchTerm(result.excerpt)}</div>
                    <span class="search-result-category">${result.category}</span>
                </div>
            `).join('');

            // Add click handlers to results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const articleId = item.dataset.article;
                    this.openArticle(articleId);
                });
            });
        }

        searchResults.classList.add('active');
    }

    highlightSearchTerm(text) {
        const searchInput = document.getElementById('helpSearch');
        const term = searchInput?.value;
        
        if (!term || term.length < 2) return text;

        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    createSearchResultsContainer() {
        const searchSection = document.querySelector('.search-section');
        const container = document.createElement('div');
        container.className = 'search-results';
        searchSection.appendChild(container);
    }

    showSearchLoading() {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.innerHTML = '<div class="loading"></div>';
            searchResults.classList.add('active');
        }
    }

    hideSearchLoading() {
        // Loading will be replaced by results
    }

    filterByTopic(topic) {
        const searchInput = document.getElementById('helpSearch');
        if (searchInput) {
            searchInput.value = topic;
            this.performSearch(topic);
        }

        // Track topic filter
        this.trackTopicFilter(topic);
    }

    showCategoryArticles(category) {
        // Filter articles by category
        const articles = this.searchData.filter(item => item.category === category);
        
        // Update UI to show filtered results
        this.displaySearchResults(articles);
        
        // Scroll to results
        document.querySelector('.search-results')?.scrollIntoView({ behavior: 'smooth' });

        // Track category view
        this.trackCategoryView(category);
    }

    openArticle(articleId) {
        // Find article data
        const article = this.searchData.find(item => item.id === articleId);
        
        if (!article) return;

        // In a real implementation, this would navigate to the article page
        // For now, we'll show a modal with the article content
        this.showArticleModal(article);
        
        // Track article view
        this.trackArticleView(articleId);
    }

    showArticleModal(article) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('article-modal');
        
        if (!modal) {
            modal = this.createArticleModal();
        }

        // Update modal content
        modal.querySelector('.modal-title').textContent = article.title;
        modal.querySelector('.modal-content').innerHTML = `
            <div class="article-category">${article.category}</div>
            <p>${article.content}</p>
            <div class="article-actions">
                <button class="btn btn-secondary" onclick="window.enhancedHelp.closeModal()">Close</button>
                <button class="btn btn-primary" onclick="window.enhancedHelp.contactSupport()">Need more help?</button>
            </div>
        `;

        // Show modal
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus management
        this.trapModalFocus(modal);
    }

    createArticleModal() {
        const modal = document.createElement('div');
        modal.id = 'article-modal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title"></h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body"></div>
            </div>
            <div class="modal-backdrop"></div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        
        return modal;
    }

    closeModal() {
        const modal = document.getElementById('article-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    trapModalFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    initFAQ() {
        // Auto-expand first FAQ item
        const firstFAQ = document.querySelector('.faq-item');
        if (firstFAQ) {
            this.toggleFAQ(firstFAQ);
        }
    }

    toggleFAQ(faqItem) {
        const isExpanded = faqItem.classList.contains('expanded');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('expanded');
            }
        });

        // Toggle current item
        faqItem.classList.toggle('expanded');
        
        // Track FAQ interaction
        if (!isExpanded) {
            const question = faqItem.querySelector('h3').textContent;
            this.trackFAQInteraction(question);
        }
    }

    initAnimations() {
        // Intersection Observer for category cards and articles
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.category-card, .help-article, .faq-item').forEach(el => {
            observer.observe(el);
        });
    }

    animateElement(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    }

    initAnalytics() {
        // Track page view
        this.trackPageView();
    }

    // Analytics tracking methods
    trackSearch(query, resultCount) {
        if (window.enhancedCommon) {
            window.enhancedCommon.saveToStorage('help_search_history', {
                query,
                resultCount,
                timestamp: new Date().toISOString()
            });
        }
    }

    trackTopicFilter(topic) {
        console.log(`Topic filtered: ${topic}`);
    }

    trackCategoryView(category) {
        console.log(`Category viewed: ${category}`);
    }

    trackArticleView(articleId) {
        console.log(`Article viewed: ${articleId}`);
    }

    trackFAQInteraction(question) {
        console.log(`FAQ opened: ${question}`);
    }

    trackPageView() {
        console.log('Help page viewed');
    }

    // Utility methods
    contactSupport() {
        this.closeModal();
        const contactLink = document.querySelector('a[href="contact-enhanced.html"]');
        if (contactLink) {
            contactLink.click();
        }
    }

    showContactForm() {
        this.contactSupport();
    }

    // Public API
    search(query) {
        this.performSearch(query);
    }

    showCategory(category) {
        this.showCategoryArticles(category);
    }
}

// Add modal styles
const modalStyles = `
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    z-index: 1001;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.modal-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: var(--font-size-2xl);
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.modal-close:hover {
    color: var(--text-primary);
}

.article-category {
    display: inline-block;
    background: var(--primary-color);
    color: var(--text-inverse);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    margin-bottom: 1rem;
    text-transform: uppercase;
}

.article-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

mark {
    background: var(--warning-color);
    color: var(--text-inverse);
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
}

.no-results {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.no-results a {
    color: var(--primary-color);
    text-decoration: underline;
}
`;

// Inject modal styles
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedHelp = new EnhancedHelp();
});

// Export for potential external use
window.EnhancedHelp = EnhancedHelp;
