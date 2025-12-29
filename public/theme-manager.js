// Theme Manager for All-In Chat Poker Enhanced Pages
class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                name: 'Dark Theme',
                icon: '🌙',
                colors: {
                    '--bg-primary': '#0a0f1c',
                    '--bg-secondary': '#1a1f2c',
                    '--bg-tertiary': '#2a2f3c',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#a8b3c5',
                    '--text-muted': '#6b7280',
                    '--text-inverse': '#0a0f1c',
                    '--primary-color': '#00d4ff',
                    '--secondary-color': '#ff00ff',
                    '--accent-color': '#00ff88',
                    '--success-color': '#22c55e',
                    '--warning-color': '#f59e0b',
                    '--error-color': '#ef4444',
                    '--glass-bg': 'rgba(255, 255, 255, 0.05)',
                    '--glass-border': 'rgba(255, 255, 255, 0.1)',
                    '--glass-blur': 'blur(20px)',
                    '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.3)',
                    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
                    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
                    '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.6)',
                    '--shadow-glow': '0 0 20px rgba(0, 212, 255, 0.3)'
                }
            },
            light: {
                name: 'Light Theme',
                icon: '☀️',
                colors: {
                    '--bg-primary': '#ffffff',
                    '--bg-secondary': '#f8f9fa',
                    '--bg-tertiary': '#e9ecef',
                    '--text-primary': '#1a1f2c',
                    '--text-secondary': '#6b7280',
                    '--text-muted': '#9ca3af',
                    '--text-inverse': '#ffffff',
                    '--primary-color': '#0066cc',
                    '--secondary-color': '#6b46c1',
                    '--accent-color': '#00aa44',
                    '--success-color': '#16a34a',
                    '--warning-color': '#d97706',
                    '--error-color': '#dc2626',
                    '--glass-bg': 'rgba(255, 255, 255, 0.7)',
                    '--glass-border': 'rgba(0, 0, 0, 0.1)',
                    '--glass-blur': 'blur(10px)',
                    '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
                    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
                    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
                    '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.1)',
                    '--shadow-glow': '0 0 20px rgba(0, 102, 204, 0.2)'
                }
            },
            neon: {
                name: 'Neon Theme',
                icon: '💜',
                colors: {
                    '--bg-primary': '#0a0014',
                    '--bg-secondary': '#1a0028',
                    '--bg-tertiary': '#2a003c',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#e0e0ff',
                    '--text-muted': '#b0b0ff',
                    '--text-inverse': '#0a0014',
                    '--primary-color': '#ff00ff',
                    '--secondary-color': '#00ffff',
                    '--accent-color': '#ffff00',
                    '--success-color': '#00ff00',
                    '--warning-color': '#ffaa00',
                    '--error-color': '#ff0066',
                    '--glass-bg': 'rgba(255, 0, 255, 0.05)',
                    '--glass-border': 'rgba(255, 0, 255, 0.2)',
                    '--glass-blur': 'blur(20px)',
                    '--shadow-sm': '0 2px 4px rgba(255, 0, 255, 0.3)',
                    '--shadow-md': '0 4px 6px rgba(255, 0, 255, 0.4)',
                    '--shadow-lg': '0 10px 15px rgba(255, 0, 255, 0.5)',
                    '--shadow-xl': '0 20px 25px rgba(255, 0, 255, 0.6)',
                    '--shadow-glow': '0 0 30px rgba(255, 0, 255, 0.5)'
                }
            },
            retro: {
                name: 'Retro Theme',
                icon: '🕹️',
                colors: {
                    '--bg-primary': '#2d1b69',
                    '--bg-secondary': '#1e0f41',
                    '--bg-tertiary': '#0f0420',
                    '--text-primary': '#00ff41',
                    '--text-secondary': '#00cc33',
                    '--text-muted': '#008822',
                    '--text-inverse': '#2d1b69',
                    '--primary-color': '#ff00ff',
                    '--secondary-color': '#00ffff',
                    '--accent-color': '#ffff00',
                    '--success-color': '#00ff41',
                    '--warning-color': '#ffaa00',
                    '--error-color': '#ff0041',
                    '--glass-bg': 'rgba(45, 27, 105, 0.3)',
                    '--glass-border': 'rgba(0, 255, 65, 0.3)',
                    '--glass-blur': 'blur(8px)',
                    '--shadow-sm': '0 2px 4px rgba(0, 255, 65, 0.2)',
                    '--shadow-md': '0 4px 6px rgba(0, 255, 65, 0.3)',
                    '--shadow-lg': '0 10px 15px rgba(0, 255, 65, 0.4)',
                    '--shadow-xl': '0 20px 25px rgba(0, 255, 65, 0.5)',
                    '--shadow-glow': '0 0 20px rgba(0, 255, 65, 0.3)'
                }
            }
        };
        
        this.currentTheme = 'dark';
        this.systemPreference = null;
        this.autoMode = false;
        this.init();
    }

    init() {
        this.loadThemePreference();
        this.detectSystemPreference();
        this.setupThemeToggle();
        this.setupAutoMode();
        this.applyTheme(this.currentTheme);
        this.setupKeyboardShortcuts();
        this.setupThemeTransitions();
    }

    loadThemePreference() {
        const saved = localStorage.getItem('theme-preference');
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
        }
        
        const autoMode = localStorage.getItem('theme-auto-mode');
        this.autoMode = autoMode === 'true';
    }

    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemPreference = 'dark';
        } else {
            this.systemPreference = 'light';
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';
                if (this.autoMode) {
                    this.applyTheme(this.systemPreference);
                }
            });
        }
    }

    setupThemeToggle() {
        // Create theme toggle button
        this.createThemeToggleButton();
        
        // Create theme selector dropdown
        this.createThemeSelector();
    }

    createThemeToggleButton() {
        // Check if toggle already exists
        if (document.getElementById('theme-toggle-btn')) {
            return;
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle-btn';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        toggleBtn.innerHTML = `
            <span class="theme-icon">${this.themes[this.currentTheme].icon}</span>
            <span class="theme-name">${this.themes[this.currentTheme].name}</span>
        `;

        // Add styles
        const styles = `
            .theme-toggle-btn {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm) var(--spacing-md);
                background: var(--glass-bg);
                backdrop-filter: var(--glass-blur);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-full);
                color: var(--text-primary);
                cursor: pointer;
                transition: all var(--transition-normal);
                font-size: var(--font-size-sm);
                font-weight: 500;
                position: relative;
                overflow: hidden;
            }
            
            .theme-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
                border-color: var(--primary-color);
            }
            
            .theme-toggle-btn:active {
                transform: translateY(0);
            }
            
            .theme-icon {
                font-size: var(--font-size-lg);
                transition: transform var(--transition-normal);
            }
            
            .theme-toggle-btn:hover .theme-icon {
                transform: rotate(180deg);
            }
            
            .theme-name {
                opacity: 0.8;
            }
            
            @media (max-width: 768px) {
                .theme-name {
                    display: none;
                }
            }
        `;

        // Inject styles
        if (!document.getElementById('theme-toggle-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'theme-toggle-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        // Add click handler
        toggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add to header or create header if it doesn't exist
        const header = document.querySelector('.header') || document.querySelector('header');
        if (header) {
            const headerContent = header.querySelector('.header-content') || header;
            headerContent.appendChild(toggleBtn);
        } else {
            // Create floating toggle
            toggleBtn.style.position = 'fixed';
            toggleBtn.style.top = '20px';
            toggleBtn.style.right = '20px';
            toggleBtn.style.zIndex = '1000';
            document.body.appendChild(toggleBtn);
        }
    }

    createThemeSelector() {
        // Create theme selector modal
        const selector = document.createElement('div');
        selector.id = 'theme-selector';
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <div class="theme-selector-backdrop"></div>
            <div class="theme-selector-content">
                <div class="theme-selector-header">
                    <h3>Choose Theme</h3>
                    <button class="theme-selector-close">&times;</button>
                </div>
                <div class="theme-options">
                    ${Object.entries(this.themes).map(([key, theme]) => `
                        <button class="theme-option ${key === this.currentTheme ? 'active' : ''}" data-theme="${key}">
                            <span class="theme-option-icon">${theme.icon}</span>
                            <span class="theme-option-name">${theme.name}</span>
                            <span class="theme-option-preview"></span>
                        </button>
                    `).join('')}
                </div>
                <div class="theme-selector-footer">
                    <label class="auto-mode-toggle">
                        <input type="checkbox" id="auto-mode" ${this.autoMode ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Auto (follow system)</span>
                    </label>
                </div>
            </div>
        `;

        // Add styles
        const selectorStyles = `
            .theme-selector {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
            }
            
            .theme-selector.active {
                display: flex;
            }
            
            .theme-selector-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }
            
            .theme-selector-content {
                background: var(--glass-bg);
                backdrop-filter: var(--glass-blur);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl);
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                z-index: 1;
            }
            
            .theme-selector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .theme-selector-header h3 {
                margin: 0;
                color: var(--text-primary);
            }
            
            .theme-selector-close {
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: var(--font-size-2xl);
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: color var(--transition-normal);
            }
            
            .theme-selector-close:hover {
                color: var(--text-primary);
            }
            
            .theme-options {
                display: grid;
                gap: var(--spacing-md);
                margin-bottom: 1.5rem;
            }
            
            .theme-option {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-lg);
                cursor: pointer;
                transition: all var(--transition-normal);
                width: 100%;
                text-align: left;
            }
            
            .theme-option:hover {
                transform: translateY(-2px);
                border-color: var(--primary-color);
                box-shadow: var(--shadow-md);
            }
            
            .theme-option.active {
                border-color: var(--primary-color);
                background: rgba(0, 212, 255, 0.1);
            }
            
            .theme-option-icon {
                font-size: var(--font-size-xl);
                width: 40px;
                text-align: center;
            }
            
            .theme-option-name {
                flex: 1;
                color: var(--text-primary);
                font-weight: 500;
            }
            
            .theme-option-preview {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid var(--glass-border);
            }
            
            .theme-selector-footer {
                padding-top: var(--spacing-md);
                border-top: 1px solid var(--glass-border);
            }
            
            .auto-mode-toggle {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                cursor: pointer;
                color: var(--text-primary);
            }
            
            .auto-mode-toggle input[type="checkbox"] {
                display: none;
            }
            
            .toggle-slider {
                width: 44px;
                height: 24px;
                background: var(--glass-border);
                border-radius: 12px;
                position: relative;
                transition: background var(--transition-normal);
            }
            
            .toggle-slider::before {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: var(--text-muted);
                border-radius: 50%;
                transition: transform var(--transition-normal);
            }
            
            .auto-mode-toggle input:checked + .toggle-slider {
                background: var(--primary-color);
            }
            
            .auto-mode-toggle input:checked + .toggle-slider::before {
                transform: translateX(20px);
                background: var(--text-inverse);
            }
        `;

        // Inject styles
        if (!document.getElementById('theme-selector-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'theme-selector-styles';
            styleSheet.textContent = selectorStyles;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(selector);

        // Add event listeners
        this.setupThemeSelectorEvents(selector);
    }

    setupThemeSelectorEvents(selector) {
        const backdrop = selector.querySelector('.theme-selector-backdrop');
        const closeBtn = selector.querySelector('.theme-selector-close');
        const themeOptions = selector.querySelectorAll('.theme-option');
        const autoModeToggle = selector.querySelector('#auto-mode');

        // Close handlers
        backdrop.addEventListener('click', () => this.closeThemeSelector());
        closeBtn.addEventListener('click', () => this.closeThemeSelector());

        // Theme selection
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.applyTheme(theme);
                this.closeThemeSelector();
            });
        });

        // Auto mode toggle
        autoModeToggle.addEventListener('change', (e) => {
            this.autoMode = e.target.checked;
            localStorage.setItem('theme-auto-mode', this.autoMode);
            
            if (this.autoMode) {
                this.applyTheme(this.systemPreference);
            }
        });

        // Keyboard navigation
        selector.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeThemeSelector();
            }
        });
    }

    setupAutoMode() {
        // Add long press to theme toggle for theme selector
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            let pressTimer;
            
            toggleBtn.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    this.openThemeSelector();
                }, 500);
            });
            
            toggleBtn.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });
            
            toggleBtn.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });
            
            // Right click for theme selector
            toggleBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openThemeSelector();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T for theme toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl/Cmd + Shift + S for theme selector
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.openThemeSelector();
            }
        });
    }

    setupThemeTransitions() {
        // Add smooth transitions for theme changes
        const transitionStyles = `
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
            }
        `;
        
        // Create and inject transition styles
        if (!document.getElementById('theme-transition-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'theme-transition-styles';
            styleSheet.textContent = transitionStyles;
            document.head.appendChild(styleSheet);
        }
    }

    toggleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        this.applyTheme(nextTheme);
    }

    applyTheme(themeName) {
        if (!this.themes[themeName]) {
            console.error(`Theme "${themeName}" not found`);
            return;
        }

        const theme = this.themes[themeName];
        const root = document.documentElement;

        // Apply theme colors
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Update theme toggle button
        this.updateThemeToggleButton(theme);

        // Update theme selector
        this.updateThemeSelector(themeName);

        // Save preference
        this.currentTheme = themeName;
        if (!this.autoMode) {
            localStorage.setItem('theme-preference', themeName);
        }

        // Dispatch theme change event
        this.dispatchThemeChangeEvent(themeName);

        // Update meta theme-color
        this.updateMetaThemeColor(theme.colors['--bg-primary']);

        // Apply theme-specific adjustments
        this.applyThemeSpecificAdjustments(themeName);
    }

    updateThemeToggleButton(theme) {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.theme-icon');
            const name = toggleBtn.querySelector('.theme-name');
            
            if (icon) icon.textContent = theme.icon;
            if (name) name.textContent = theme.name;
        }
    }

    updateThemeSelector(themeName) {
        const selector = document.getElementById('theme-selector');
        if (selector) {
            const options = selector.querySelectorAll('.theme-option');
            options.forEach(option => {
                option.classList.toggle('active', option.dataset.theme === themeName);
            });
        }
    }

    dispatchThemeChangeEvent(themeName) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: themeName,
                colors: this.themes[themeName].colors
            }
        });
        document.dispatchEvent(event);
    }

    updateMetaThemeColor(bgColor) {
        // Update theme-color meta tag for mobile browsers
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = bgColor;
    }

    applyThemeSpecificAdjustments(themeName) {
        // Apply theme-specific adjustments
        switch(themeName) {
            case 'neon':
                this.addNeonEffects();
                break;
            case 'retro':
                this.addRetroEffects();
                break;
            case 'light':
                this.addLightThemeAdjustments();
                break;
            default:
                this.removeThemeEffects();
        }
    }

    addNeonEffects() {
        // Add neon glow effects
        const neonStyles = `
            .neon-glow {
                animation: neon-pulse 2s ease-in-out infinite alternate;
            }
            
            @keyframes neon-pulse {
                from {
                    box-shadow: 0 0 10px var(--primary-color), 0 0 20px var(--primary-color), 0 0 30px var(--primary-color);
                }
                to {
                    box-shadow: 0 0 20px var(--primary-color), 0 0 30px var(--primary-color), 0 0 40px var(--primary-color);
                }
            }
        `;
        
        this.injectThemeStyles('neon-effects', neonStyles);
        
        // Add neon class to interactive elements
        document.querySelectorAll('.btn, .glass-card, .feature-card').forEach(el => {
            el.classList.add('neon-glow');
        });
    }

    addRetroEffects() {
        // Add retro scanlines effect
        const retroStyles = `
            .retro-scanlines {
                position: relative;
            }
            
            .retro-scanlines::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 65, 0.03) 2px,
                    rgba(0, 255, 65, 0.03) 4px
                );
                pointer-events: none;
                z-index: 1;
            }
            
            @keyframes retro-flicker {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.95; }
            }
        `;
        
        this.injectThemeStyles('retro-effects', retroStyles);
        
        // Add retro class to body
        document.body.classList.add('retro-scanlines');
    }

    addLightThemeAdjustments() {
        // Adjustments for light theme
        const lightStyles = `
            .light-theme-adjustments {
                --glass-bg: rgba(255, 255, 255, 0.8);
                --glass-border: rgba(0, 0, 0, 0.1);
                --glass-blur: blur(10px);
            }
        `;
        
        this.injectThemeStyles('light-adjustments', lightStyles);
    }

    removeThemeEffects() {
        // Remove theme-specific classes and styles
        document.querySelectorAll('.neon-glow').forEach(el => {
            el.classList.remove('neon-glow');
        });
        
        document.body.classList.remove('retro-scanlines');
        
        // Remove theme-specific styles
        ['neon-effects', 'retro-effects', 'light-adjustments'].forEach(id => {
            const style = document.getElementById(id);
            if (style) style.remove();
        });
    }

    injectThemeStyles(id, styles) {
        // Remove existing styles with same id
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        // Inject new styles
        const styleSheet = document.createElement('style');
        styleSheet.id = id;
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    openThemeSelector() {
        const selector = document.getElementById('theme-selector');
        if (selector) {
            selector.classList.add('active');
            selector.style.display = 'flex';
            
            // Focus management
            const firstOption = selector.querySelector('.theme-option');
            if (firstOption) {
                firstOption.focus();
            }
        }
    }

    closeThemeSelector() {
        const selector = document.getElementById('theme-selector');
        if (selector) {
            selector.classList.remove('active');
            setTimeout(() => {
                selector.style.display = 'none';
            }, 300);
        }
    }

    // Public API
    getTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            key,
            name: this.themes[key].name,
            icon: this.themes[key].icon
        }));
    }

    setTheme(themeName) {
        this.applyTheme(themeName);
    }

    setAutoMode(enabled) {
        this.autoMode = enabled;
        localStorage.setItem('theme-auto-mode', enabled);
        
        if (enabled) {
            this.applyTheme(this.systemPreference);
        }
    }

    isAutoMode() {
        return this.autoMode;
    }

    getSystemPreference() {
        return this.systemPreference;
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for potential external use
window.ThemeManager = ThemeManager;
