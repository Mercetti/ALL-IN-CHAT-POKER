/**
 * Dynamic Import System for Admin Panels
 * Reduces initial bundle size by loading panels on demand
 */

class DynamicLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }

    async loadPanel(panelName) {
        // Check cache first
        if (this.cache.has(panelName)) {
            return this.cache.get(panelName);
        }

        // Check if already loading
        if (this.loading.has(panelName)) {
            return this.loading.get(panelName);
        }

        // Start loading
        const loadPromise = this._loadPanel(panelName);
        this.loading.set(panelName, loadPromise);

        try {
            const panel = await loadPromise;
            this.cache.set(panelName, panel);
            this.loading.delete(panelName);
            return panel;
        } catch (error) {
            this.loading.delete(panelName);
            throw error;
        }
    }

    async _loadPanel(panelName) {
        switch (panelName) {
            case 'admin':
                return import('./admin-panel.js');
            case 'analytics':
                return import('./analytics-panel.js');
            case 'logs':
                return import('./logs-panel.js');
            case 'demo':
                return import('./demo-panel.js');
            case 'financial':
                return import('./financial-panel.js');
            default:
                throw new Error(`Unknown panel: ${panelName}`);
        }
    }

    preloadCriticalPanels() {
        // Preload only critical panels
        return Promise.all([
            this.loadPanel('admin'),
            this.loadPanel('analytics')
        ]);
    }

    clearCache() {
        this.cache.clear();
        this.loading.clear();
    }
}

// Global instance
window.dynamicLoader = new DynamicLoader();

// Usage example:
// const panel = await window.dynamicLoader.loadPanel('admin');
// panel.render();