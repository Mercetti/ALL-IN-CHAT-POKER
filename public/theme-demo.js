// Theme Demo JavaScript
class ThemeDemo {
    constructor() {
        this.init();
    }

    init() {
        this.setupThemePreviewCards();
        this.setupKeyboardShortcuts();
        this.setupThemeSettings();
        this.initializeDemoFeatures();
        this.startThemeRotation();
    }

    setupThemePreviewCards() {
        const previewCards = document.querySelectorAll('.theme-preview-card');
        previewCards.forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                if (window.themeManager) {
                    window.themeManager.setTheme(theme);
                    this.showThemeFeedback(theme);
                }
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                this.previewTheme(card.dataset.theme);
            });

            card.addEventListener('mouseleave', () => {
                this.restoreCurrentTheme();
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Additional demo-specific shortcuts
            if (e.ctrlKey && e.shiftKey) {
                switch(e.key) {
                    case 'D':
                        e.preventDefault();
                        this.startThemeRotation();
                        break;
                    case 'R':
                        e.preventDefault();
                        this.randomTheme();
                        break;
                    case 'A':
                        e.preventDefault();
                        this.toggleAutoMode();
                        break;
                }
            }
        });
    }

    setupThemeSettings() {
        // Auto mode toggle
        const autoModeToggle = document.getElementById('auto-mode-toggle');
        if (autoModeToggle && window.themeManager) {
            autoModeToggle.checked = window.themeManager.isAutoMode();
            
            autoModeToggle.addEventListener('change', (e) => {
                window.themeManager.setAutoMode(e.target.checked);
                this.showSettingsFeedback('Auto mode', e.target.checked);
            });
        }

        // Transition duration slider
        const transitionSlider = document.getElementById('transition-duration');
        const durationValue = document.querySelector('.duration-value');
        
        if (transitionSlider && durationValue) {
            transitionSlider.addEventListener('input', (e) => {
                const duration = e.target.value;
                durationValue.textContent = `${duration}ms`;
                this.updateTransitionDuration(duration);
            });
        }

        // Reduced motion toggle
        const reducedMotionToggle = document.getElementById('reduced-motion');
        if (reducedMotionToggle) {
            reducedMotionToggle.addEventListener('change', (e) => {
                this.toggleReducedMotion(e.target.checked);
                this.showSettingsFeedback('Reduced motion', e.target.checked);
            });
        }
    }

    initializeDemoFeatures() {
        // Add theme change listener
        document.addEventListener('themechange', (e) => {
            this.onThemeChange(e.detail.theme);
        });

        // Initialize current theme display
        if (window.themeManager) {
            this.updateCurrentThemeDisplay(window.themeManager.getTheme());
        }
    }

    startThemeRotation() {
        if (this.rotationInterval) {
            this.stopThemeRotation();
            return;
        }

        const themes = ['dark', 'light', 'neon', 'retro'];
        let currentIndex = 0;

        this.rotationInterval = setInterval(() => {
            if (window.themeManager) {
                window.themeManager.setTheme(themes[currentIndex]);
                currentIndex = (currentIndex + 1) % themes.length;
            }
        }, 2000);

        this.showToast('Theme rotation started', 'info');
        
        // Auto-stop after 8 seconds
        setTimeout(() => {
            this.stopThemeRotation();
        }, 8000);
    }

    stopThemeRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
            this.showToast('Theme rotation stopped', 'info');
        }
    }

    randomTheme() {
        if (window.themeManager) {
            const themes = window.themeManager.getAvailableThemes();
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            window.themeManager.setTheme(randomTheme.key);
            this.showThemeFeedback(randomTheme.key);
        }
    }

    toggleAutoMode() {
        if (window.themeManager) {
            const currentAutoMode = window.themeManager.isAutoMode();
            window.themeManager.setAutoMode(!currentAutoMode);
            
            const autoModeToggle = document.getElementById('auto-mode-toggle');
            if (autoModeToggle) {
                autoModeToggle.checked = !currentAutoMode;
            }
        }
    }

    previewTheme(themeName) {
        if (!window.themeManager) return;
        
        const theme = window.themeManager.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        
        // Store original colors
        if (!this.originalColors) {
            this.originalColors = {};
            Object.keys(theme.colors).forEach(property => {
                this.originalColors[property] = root.style.getPropertyValue(property);
            });
        }

        // Apply preview theme
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    restoreCurrentTheme() {
        if (!this.originalColors || !window.themeManager) return;

        const root = document.documentElement;
        const currentTheme = window.themeManager.getTheme();
        const theme = window.themeManager.themes[currentTheme];
        
        if (theme) {
            Object.entries(theme.colors).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });
        }
    }

    onThemeChange(themeName) {
        this.updateCurrentThemeDisplay(themeName);
        this.updateThemePreviewCards(themeName);
        this.addThemeTransitionEffect();
    }

    updateCurrentThemeDisplay(themeName) {
        // Update any current theme indicators
        const indicators = document.querySelectorAll('.current-theme-indicator');
        indicators.forEach(indicator => {
            indicator.textContent = themeName;
        });
    }

    updateThemePreviewCards(activeTheme) {
        const previewCards = document.querySelectorAll('.theme-preview-card');
        previewCards.forEach(card => {
            card.classList.toggle('active', card.dataset.theme === activeTheme);
        });
    }

    addThemeTransitionEffect() {
        // Add a subtle transition effect
        const body = document.body;
        body.style.transition = 'filter 0.3s ease';
        body.style.filter = 'brightness(1.1)';
        
        setTimeout(() => {
            body.style.filter = 'brightness(1)';
        }, 300);
    }

    updateTransitionDuration(duration) {
        // Update CSS transition duration
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            * {
                transition-duration: ${duration}ms !important;
            }
        `;
        styleSheet.id = 'transition-duration-override';
        
        // Remove existing override
        const existing = document.getElementById('transition-duration-override');
        if (existing) {
            existing.remove();
        }
        
        document.head.appendChild(styleSheet);
    }

    toggleReducedMotion(enabled) {
        if (enabled) {
            document.documentElement.style.setProperty('--transition-normal', '0ms');
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');
        } else {
            document.documentElement.style.setProperty('--transition-normal', '0.3s');
            document.documentElement.style.setProperty('--transition-fast', '0.15s');
            document.documentElement.style.setProperty('--transition-slow', '0.5s');
        }
    }

    showThemeFeedback(themeName) {
        const theme = window.themeManager?.themes[themeName];
        if (theme) {
            this.showToast(`Switched to ${theme.name}`, 'success');
        }
    }

    showSettingsFeedback(setting, enabled) {
        const status = enabled ? 'enabled' : 'disabled';
        this.showToast(`${setting} ${status}`, 'info');
    }

    showToast(message, type = 'info') {
        if (window.enhancedCommon) {
            window.enhancedCommon.showToast(message, type);
        } else {
            // Fallback toast
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-lg);
                padding: 1rem;
                color: var(--text-primary);
                z-index: 1000;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // Demo analytics
    trackThemeUsage(themeName) {
        const usage = JSON.parse(localStorage.getItem('theme_usage') || '{}');
        usage[themeName] = (usage[themeName] || 0) + 1;
        localStorage.setItem('theme_usage', JSON.stringify(usage));
    }

    getThemeUsageStats() {
        return JSON.parse(localStorage.getItem('theme_usage') || '{}');
    }

    // Performance monitoring
    measureThemePerformance(themeName) {
        const start = performance.now();
        
        if (window.themeManager) {
            window.themeManager.setTheme(themeName);
        }
        
        const end = performance.now();
        const duration = end - start;
        
        console.log(`Theme "${themeName}" applied in ${duration.toFixed(2)}ms`);
        return duration;
    }

    // Accessibility features
    announceThemeChange(themeName) {
        const theme = window.themeManager?.themes[themeName];
        if (theme && window.enhancedCommon) {
            window.enhancedCommon.announceToScreenReader(`Theme changed to ${theme.name}`);
        }
    }

    // Export theme configuration
    exportThemeConfig() {
        if (window.themeManager) {
            const config = {
                currentTheme: window.themeManager.getTheme(),
                autoMode: window.themeManager.isAutoMode(),
                systemPreference: window.themeManager.getSystemPreference(),
                availableThemes: window.themeManager.getAvailableThemes()
            };
            
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'theme-config.json';
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.showToast('Theme configuration exported', 'success');
        }
    }

    // Import theme configuration
    importThemeConfig(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                if (window.themeManager) {
                    if (config.currentTheme) {
                        window.themeManager.setTheme(config.currentTheme);
                    }
                    if (config.autoMode !== undefined) {
                        window.themeManager.setAutoMode(config.autoMode);
                    }
                }
                
                this.showToast('Theme configuration imported', 'success');
            } catch (error) {
                this.showToast('Invalid theme configuration file', 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

// Utility functions
function toggleAutoMode() {
    if (window.themeDemo) {
        window.themeDemo.toggleAutoMode();
    }
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeDemo = new ThemeDemo();
});

// Export for potential external use
window.ThemeDemo = ThemeDemo;
