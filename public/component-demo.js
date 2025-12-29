// Component Demo JavaScript
class ComponentDemo {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDemoFeatures();
        this.startPerformanceMonitoring();
    }

    setupEventListeners() {
        // Add click handlers to all demo buttons
        document.querySelectorAll('.demo-controls .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleDemoButtonClick(e);
            });
        });

        // Add hover effects for component showcase
        document.querySelectorAll('.showcase-item').forEach(item => {
            item.addEventListener('mouseenter', () => this.handleShowcaseHover(item, true));
            item.addEventListener('mouseleave', () => this.handleShowcaseHover(item, false));
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    initializeDemoFeatures() {
        // Initialize interactive features
        this.initializeComponentVariations();
        this.initializeThemeShowcase();
        this.initializeAccessibilityDemo();
        this.initializeCodeExamples();
    }

    initializeComponentVariations() {
        // Add variation toggles for components
        const variationGroups = document.querySelectorAll('.variation-group');
        variationGroups.forEach(group => {
            const buttons = group.querySelectorAll('.btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.toggleComponentVariation(btn, group);
                });
            });
        });
    }

    initializeThemeShowcase() {
        // Add theme switching functionality
        const themeButtons = document.querySelectorAll('.theme-preview .btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTheme(btn.textContent.trim());
            });
        });
    }

    initializeAccessibilityDemo() {
        // Add accessibility feature demonstrations
        const accessibilityFeatures = document.querySelectorAll('.accessibility-feature');
        accessibilityFeatures.forEach(feature => {
            feature.addEventListener('click', () => {
                this.demonstrateAccessibilityFeature(feature);
            });
        });
    }

    initializeCodeExamples() {
        // Add code highlighting and copying
        const codeBlocks = document.querySelectorAll('.code-block');
        codeBlocks.forEach(block => {
            this.addCodeBlockFeatures(block);
        });
    }

    handleDemoButtonClick(event) {
        const btn = event.target;
        const action = btn.textContent.trim();
        
        // Add ripple effect
        this.createRippleEffect(event, btn);
        
        // Track demo interactions
        this.trackDemoInteraction(action);
        
        // Show feedback
        this.showDemoFeedback(action);
    }

    handleShowcaseHover(item, isEntering) {
        if (isEntering) {
            item.style.transform = 'translateY(-5px) scale(1.02)';
            item.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.3)';
        } else {
            item.style.transform = '';
            item.style.boxShadow = '';
        }
    }

    handleKeyboardNavigation(e) {
        // Handle keyboard shortcuts for demo
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.showToast('info', 'Keyboard shortcut: Component 1 selected');
                    break;
                case '2':
                    e.preventDefault();
                    this.showToast('info', 'Keyboard shortcut: Component 2 selected');
                    break;
                case '3':
                    e.preventDefault();
                    this.showToast('info', 'Keyboard shortcut: Component 3 selected');
                    break;
            }
        }
    }

    toggleComponentVariation(btn, group) {
        // Remove active state from all buttons in group
        group.querySelectorAll('.btn').forEach(b => {
            b.classList.remove('active');
        });
        
        // Add active state to clicked button
        btn.classList.add('active');
        
        // Update component preview
        const componentName = group.dataset.component;
        const variation = btn.dataset.variation;
        this.updateComponentPreview(componentName, variation);
    }

    updateComponentPreview(componentName, variation) {
        // Update the component preview based on variation
        const preview = document.querySelector(`[data-component="${componentName}"]`);
        if (preview) {
            // Apply variation styles
            preview.className = preview.className.replace(/variant-\w+/g, '');
            preview.classList.add(`variant-${variation}`);
            
            // Show feedback
            this.showToast('info', `Updated ${componentName} to ${variation} variation`);
        }
    }

    switchTheme(themeName) {
        // Switch between different theme variations
        const root = document.documentElement;
        
        switch(themeName.toLowerCase()) {
            case 'dark':
                root.style.setProperty('--bg-primary', '#0a0f1c');
                root.style.setProperty('--bg-secondary', '#1a1f2c');
                break;
            case 'light':
                root.style.setProperty('--bg-primary', '#ffffff');
                root.style.setProperty('--bg-secondary', '#f8f9fa');
                break;
            case 'neon':
                root.style.setProperty('--primary-color', '#00ff88');
                root.style.setProperty('--secondary-color', '#ff00ff');
                break;
            default:
                // Reset to default theme
                location.reload();
                return;
        }
        
        this.showToast('success', `Switched to ${themeName} theme`);
    }

    demonstrateAccessibilityFeature(feature) {
        const featureText = feature.textContent.trim();
        
        switch(featureText) {
            case 'Screen Reader Support':
                this.demonstrateScreenReader();
                break;
            case 'Keyboard Navigation':
                this.demonstrateKeyboardNavigation();
                break;
            case 'High Contrast Mode':
                this.demonstrateHighContrast();
                break;
            case 'Reduced Motion':
                this.demonstrateReducedMotion();
                break;
            default:
                this.showToast('info', `Demonstrating: ${featureText}`);
        }
    }

    demonstrateScreenReader() {
        // Add ARIA live region
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.textContent = 'Screen reader demonstration: This content is now accessible to screen readers';
        document.body.appendChild(liveRegion);
        
        setTimeout(() => {
            liveRegion.remove();
        }, 3000);
        
        this.showToast('info', 'Screen reader support demonstrated');
    }

    demonstrateKeyboardNavigation() {
        // Add focus indicators
        const focusableElements = document.querySelectorAll('button, [href], input, select, textarea');
        focusableElements.forEach(element => {
            element.style.outline = '2px solid var(--primary-color)';
            element.style.outlineOffset = '2px';
        });
        
        setTimeout(() => {
            focusableElements.forEach(element => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            });
        }, 3000);
        
        this.showToast('info', 'Keyboard navigation demonstrated');
    }

    demonstrateHighContrast() {
        // Apply high contrast styles
        const root = document.documentElement;
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#cccccc');
        root.style.setProperty('--glass-border', '#ffffff');
        
        setTimeout(() => {
            // Reset styles
            root.style.removeProperty('--text-primary');
            root.style.removeProperty('--text-secondary');
            root.style.removeProperty('--glass-border');
        }, 3000);
        
        this.showToast('info', 'High contrast mode demonstrated');
    }

    demonstrateReducedMotion() {
        // Disable animations
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            element.style.animation = 'none';
            element.style.transition = 'none';
        });
        
        setTimeout(() => {
            // Restore animations
            elements.forEach(element => {
                element.style.animation = '';
                element.style.transition = '';
            });
        }, 3000);
        
        this.showToast('info', 'Reduced motion demonstrated');
    }

    addCodeBlockFeatures(block) {
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => {
            this.copyCode(block);
        });
        
        block.appendChild(copyBtn);
        
        // Add syntax highlighting (basic)
        this.highlightCode(block);
    }

    copyCode(block) {
        const code = block.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('success', 'Code copied to clipboard!');
        }).catch(() => {
            this.showToast('error', 'Failed to copy code');
        });
    }

    highlightCode(block) {
        // Basic syntax highlighting
        const code = block.querySelector('code');
        const highlighted = code.textContent
            .replace(/(["'])([^"']*)\1/g, '<span style="color: #ff79c6">$1$2$1</span>')
            .replace(/\b(function|const|let|var|if|else|return|class|extends)\b/g, '<span style="color: #ff79c6">$1</span>')
            .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #bd93f9">$1</span>')
            .replace(/\b(\d+)\b/g, '<span style="color: #bd93f9">$1</span>');
        
        code.innerHTML = highlighted;
    }

    startPerformanceMonitoring() {
        // Monitor component performance
        this.performanceMetrics = {
            componentCount: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        
        // Update metrics periodically
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);
    }

    updatePerformanceMetrics() {
        // Count components
        const components = document.querySelectorAll('[data-component]');
        this.performanceMetrics.componentCount = components.length;
        
        // Measure render time (simplified)
        const start = performance.now();
        // Simulate render measurement
        this.performanceMetrics.renderTime = performance.now() - start;
        
        // Update display
        this.updateMetricsDisplay();
    }

    updateMetricsDisplay() {
        const metricsDisplay = document.querySelector('.performance-metrics');
        if (metricsDisplay) {
            const componentCount = metricsDisplay.querySelector('.metric-value');
            if (componentCount) {
                componentCount.textContent = this.performanceMetrics.componentCount;
            }
        }
    }

    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    trackDemoInteraction(action) {
        // Track demo interactions for analytics
        console.log(`Demo interaction: ${action}`);
        
        // Store in localStorage for demo persistence
        const interactions = JSON.parse(localStorage.getItem('demo_interactions') || '[]');
        interactions.push({
            action,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('demo_interactions', JSON.stringify(interactions.slice(-50))); // Keep last 50
    }

    showDemoFeedback(action) {
        // Show contextual feedback based on action
        const feedbackMessages = {
            'Show Success Toast': 'Success toast demonstrated!',
            'Show Error Toast': 'Error toast demonstrated!',
            'Show Warning Toast': 'Warning toast demonstrated!',
            'Show Info Toast': 'Info toast demonstrated!',
            'Show Modal': 'Modal demonstrated!',
            'Create Dynamic Component': 'Dynamic component creation demonstrated!'
        };
        
        const message = feedbackMessages[action];
        if (message) {
            // Show subtle feedback
            const feedback = document.createElement('div');
            feedback.className = 'demo-feedback';
            feedback.textContent = message;
            feedback.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-md);
                padding: 1rem;
                color: var(--text-primary);
                animation: slideInRight 0.3s ease-out;
                z-index: 1001;
            `;
            
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => feedback.remove(), 300);
            }, 2000);
        }
    }
}

// Demo utility functions
function showToast(type, message) {
    if (window.componentLibrary) {
        const toastContainer = document.getElementById('toast-demo');
        if (toastContainer) {
            toastContainer.showToast(message, type);
        }
    }
}

function showModal() {
    const modal = document.getElementById('demo-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

function closeModal() {
    const modal = document.getElementById('demo-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function createDynamicComponent() {
    if (window.componentRegistry) {
        const dynamicCard = window.componentRegistry.create('glass-card', {
            header: 'Dynamic Component',
            content: 'This component was created dynamically using the component library!',
            footer: '<button class="btn btn-primary" onclick="this.closest(\'.glass-card\').remove()">Remove</button>'
        });
        
        if (dynamicCard) {
            // Add to demo section
            const demoSection = document.querySelector('.demo-section');
            if (demoSection) {
                demoSection.appendChild(dynamicCard);
                
                // Animate in
                dynamicCard.style.opacity = '0';
                dynamicCard.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    dynamicCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    dynamicCard.style.opacity = '1';
                    dynamicCard.style.transform = 'translateY(0)';
                }, 10);
            }
        }
    }
}

// Add ripple styles
const rippleStyles = `
.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.demo-feedback {
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.code-copy-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all var(--transition-normal);
}

.code-copy-btn:hover {
    background: var(--primary-color);
    color: var(--text-inverse);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = rippleStyles;
document.head.appendChild(styleSheet);

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.componentDemo = new ComponentDemo();
});

// Export for potential external use
window.ComponentDemo = ComponentDemo;
