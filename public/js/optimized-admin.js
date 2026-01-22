/**
 * Optimized Admin Panel with Dynamic Loading
 * Loads components on-demand to reduce bundle size
 */

class OptimizedAdminPanel {
    constructor() {
        this.currentPanel = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        this.initialized = true;
        console.log('🚀 Admin panel initialized with dynamic loading');
        
        // Setup navigation
        this.setupNavigation();
        
        // Load default panel
        await this.loadPanel('dashboard');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('[data-panel]');
        navButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const panelName = button.dataset.panel;
                await this.loadPanel(panelName);
            });
        });
    }

    async loadPanel(panelName) {
        try {
            // Show loading state
            this.showLoading();
            
            // Load panel dynamically
            const panelModule = await window.dynamicLoader.loadPanel(panelName);
            
            // Hide loading state
            this.hideLoading();
            
            // Render panel
            if (panelModule.default) {
                panelModule.default.render();
            }
            
            this.currentPanel = panelName;
            console.log(`✅ Loaded panel: ${panelName}`);
            
        } catch (error) {
            console.error(`❌ Failed to load panel ${panelName}:`, error);
            this.showError(`Failed to load ${panelName} panel`);
        }
    }

    showLoading() {
        const container = document.getElementById('admin-panel-container');
        if (container) {
            container.innerHTML = '<div class="loading">Loading panel...</div>';
        }
    }

    hideLoading() {
        // Loading will be replaced by panel content
    }

    showError(message) {
        const container = document.getElementById('admin-panel-container');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new OptimizedAdminPanel();
    window.adminPanel.init();
});