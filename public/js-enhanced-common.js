// Common Enhanced JavaScript - Shared functionality across all enhanced pages

class EnhancedCommon {
    constructor() {
        this.init();
    }

    init() {
        this.initAnimations();
        this.initScrollEffects();
        this.initKeyboardNavigation();
        this.initAccessibility();
        this.initTheme();
    }

    // Animation System
    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.glass-panel, .overview-card, .feature-card').forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(element);
        });
    }

    // Scroll Effects
    initScrollEffects() {
        let ticking = false;

        const updateScrollEffects = () => {
            const scrolled = window.pageYOffset;
            
            // Parallax effect for floating elements
            const parallaxElements = document.querySelectorAll('.floating-card, .gradient-orb');
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });

            // Header background opacity on scroll
            const header = document.querySelector('.header');
            if (header) {
                const opacity = Math.min(scrolled / 100, 0.95);
                header.style.background = `rgba(10, 10, 15, ${opacity})`;
            }

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // Keyboard Navigation
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Global keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.openSearch();
                        break;
                    case '/':
                        e.preventDefault();
                        this.openHelp();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                }
            }

            // Escape key to close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }

            // Tab navigation enhancement
            if (e.key === 'Tab') {
                this.enhanceTabFocus(e);
            }
        });
    }

    // Accessibility Features
    initAccessibility() {
        // Announce dynamic content changes to screen readers
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.style.position = 'absolute';
        this.announcer.style.left = '-10000px';
        this.announcer.style.width = '1px';
        this.announcer.style.height = '1px';
        this.announcer.style.overflow = 'hidden';
        document.body.appendChild(this.announcer);

        // Focus management
        this.manageFocus();

        // Reduced motion support
        this.initReducedMotion();

        // High contrast mode support
        this.initHighContrast();
    }

    // Theme Management - Updated to use Unified Theme Manager
    initTheme() {
        // Wait for unified theme manager to be available
        if (window.unifiedThemeManager) {
            // Unified manager already handles initialization
            return;
        }
        
        // Fallback for pages without unified manager
        const savedTheme = this.getLegacyTheme() || 'dark';
        this.setTheme(savedTheme);

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addListener((e) => {
                if (!this.getLegacyTheme()) {
                    this.setTheme(e.matches ? 'light' : 'dark');
                }
            });
        }
    }

    getLegacyTheme() {
        // Check multiple legacy keys for migration
        return localStorage.getItem('theme') || 
               localStorage.getItem('app_theme') || 
               localStorage.getItem('theme-preference');
    }

    setTheme(theme) {
        // Use unified manager if available
        if (window.unifiedThemeManager) {
            window.unifiedThemeManager.setTheme(theme);
            return;
        }
        
        // Fallback behavior
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button if it exists
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.showToast(`Switched to ${newTheme} theme`, 'success');
    }

    // Toast Notification System
    showToast(message, type = 'success', duration = 5000) {
        const toastContainer = this.getToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        toastContainer.appendChild(toast);

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto-remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    getToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // Modal Management
    openModal(modalId, focusElement = null) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus management
        this.previousFocus = document.activeElement;
        if (focusElement) {
            focusElement.focus();
        } else {
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }

        // Trap focus within modal
        this.trapFocus(modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        // Restore focus
        if (this.previousFocus) {
            this.previousFocus.focus();
        }

        // Restore body scroll
        document.body.style.overflow = '';
    }

    closeModals() {
        document.querySelectorAll('[role="dialog"]').forEach(modal => {
            if (modal.style.display === 'flex') {
                this.closeModal(modal.id);
            }
        });
    }

    // Focus Management
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const trapFocusHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        element.addEventListener('keydown', trapFocusHandler);
        element._focusTrapHandler = trapFocusHandler;
    }

    enhanceTabFocus(e) {
        // Add visual indicator for focused elements
        setTimeout(() => {
            if (document.activeElement) {
                document.activeElement.classList.add('keyboard-focused');
                
                // Remove class when focus is lost
                document.activeElement.addEventListener('blur', () => {
                    document.activeElement.classList.remove('keyboard-focused');
                }, { once: true });
            }
        }, 0);
    }

    manageFocus() {
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.position = 'absolute';
        skipLink.style.top = '-40px';
        skipLink.style.left = '6px';
        skipLink.style.background = 'var(--primary-color)';
        skipLink.style.color = 'white';
        skipLink.style.padding = '8px';
        skipLink.style.textDecoration = 'none';
        skipLink.style.zIndex = '9999';
        skipLink.style.borderRadius = '4px';
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content id if it doesn't exist
        const mainContent = document.querySelector('main, .main-container, #main-content');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    // Accessibility Support
    initReducedMotion() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Disable animations
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    initHighContrast() {
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.setAttribute('data-high-contrast', 'true');
        }

        // Listen for contrast preference changes
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        mediaQuery.addListener((e) => {
            document.documentElement.setAttribute('data-high-contrast', e.matches ? 'true' : 'false');
        });
    }

    announceToScreenReader(message) {
        if (this.announcer) {
            this.announcer.textContent = message;
            setTimeout(() => {
                this.announcer.textContent = '';
            }, 1000);
        }
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Search functionality (placeholder)
    openSearch() {
        this.showToast('Search functionality coming soon!', 'info');
    }

    // Help functionality (placeholder)
    openHelp() {
        this.showToast('Help documentation coming soon!', 'info');
    }

    // Storage helpers
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    }

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    }

    // API helper (mock implementation)
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            // In a real implementation, this would make an actual API call
            console.log(`API Call: ${endpoint}`, finalOptions);
            
            // Mock response for development
            return {
                success: true,
                data: null,
                message: 'API call successful (mock)'
            };
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize common functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedCommon = new EnhancedCommon();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedCommon;
} else {
    window.EnhancedCommon = EnhancedCommon;
}
