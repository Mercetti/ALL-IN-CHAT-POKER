// Component Library for All-In Chat Poker Enhanced Pages
class ComponentLibrary {
    constructor() {
        this.components = new Map();
        this.init();
    }

    init() {
        this.registerCoreComponents();
        this.setupComponentRegistry();
        this.initComponentLoader();
    }

    registerCoreComponents() {
        // Register all core components
        this.registerComponent('glass-card', this.createGlassCardComponent());
        this.registerComponent('enhanced-button', this.createEnhancedButtonComponent());
        this.registerComponent('toast-container', this.createToastContainerComponent());
        this.registerComponent('modal', this.createModalComponent());
        this.registerComponent('loading-spinner', this.createLoadingSpinnerComponent());
        this.registerComponent('status-badge', this.createStatusBadgeComponent());
        this.registerComponent('feature-card', this.createFeatureCardComponent());
        this.registerComponent('navigation-header', this.createNavigationHeaderComponent());
        this.registerComponent('hero-section', this.createHeroSectionComponent());
        this.registerComponent('form-input', this.createFormInputComponent());
        this.registerComponent('icon-button', this.createIconButtonComponent());
    }

    registerComponent(name, component) {
        this.components.set(name, component);
    }

    getComponent(name) {
        return this.components.get(name);
    }

    // Glass Card Component
    createGlassCardComponent() {
        return {
            template: (data = {}) => `
                <div class="glass-card ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    ${data.header ? `<div class="glass-card-header">${data.header}</div>` : ''}
                    <div class="glass-card-content">
                        ${data.content || ''}
                    </div>
                    ${data.footer ? `<div class="glass-card-footer">${data.footer}</div>` : ''}
                </div>
            `,
            styles: `
                .glass-card {
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-xl);
                    transition: all var(--transition-normal);
                    position: relative;
                    overflow: hidden;
                }
                
                .glass-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    opacity: 0;
                    transition: opacity var(--transition-normal);
                }
                
                .glass-card:hover::before {
                    opacity: 1;
                }
                
                .glass-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary-color);
                    box-shadow: var(--shadow-lg);
                }
                
                .glass-card-header {
                    margin-bottom: var(--spacing-lg);
                    padding-bottom: var(--spacing-md);
                    border-bottom: 1px solid var(--glass-border);
                }
                
                .glass-card-content {
                    flex: 1;
                }
                
                .glass-card-footer {
                    margin-top: var(--spacing-lg);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid var(--glass-border);
                }
            `,
            init: (element, data) => {
                // Initialize glass card with animations
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 100);
            }
        };
    }

    // Enhanced Button Component
    createEnhancedButtonComponent() {
        return {
            template: (data = {}) => `
                <button class="enhanced-btn btn-${data.variant || 'primary'} ${data.size || 'md'} ${data.className || ''}" 
                        ${data.id ? `id="${data.id}"` : ''} 
                        ${data.disabled ? 'disabled' : ''}
                        type="${data.type || 'button'}">
                    ${data.icon ? `<span class="btn-icon">${data.icon}</span>` : ''}
                    <span class="btn-text">${data.text || ''}</span>
                    ${data.loading ? '<span class="btn-loading"></span>' : ''}
                </button>
            `,
            styles: `
                .enhanced-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-md) var(--spacing-lg);
                    border: none;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    position: relative;
                    overflow: hidden;
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    color: var(--text-primary);
                }
                
                .enhanced-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .enhanced-btn:active {
                    transform: translateY(0);
                }
                
                .enhanced-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .enhanced-btn.btn-primary {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: var(--text-inverse);
                }
                
                .enhanced-btn.btn-secondary {
                    background: var(--glass-bg);
                    border-color: var(--glass-border);
                    color: var(--text-primary);
                }
                
                .enhanced-btn.btn-success {
                    background: var(--success-color);
                    border-color: var(--success-color);
                    color: var(--text-inverse);
                }
                
                .enhanced-btn.btn-warning {
                    background: var(--warning-color);
                    border-color: var(--warning-color);
                    color: var(--text-inverse);
                }
                
                .enhanced-btn.btn-error {
                    background: var(--error-color);
                    border-color: var(--error-color);
                    color: var(--text-inverse);
                }
                
                .enhanced-btn.sm {
                    padding: var(--spacing-sm) var(--spacing-md);
                    font-size: var(--font-size-sm);
                }
                
                .enhanced-btn.lg {
                    padding: var(--spacing-lg) var(--spacing-xl);
                    font-size: var(--font-size-lg);
                }
                
                .btn-icon {
                    font-size: 1.1em;
                }
                
                .btn-loading {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `,
            init: (element, data) => {
                // Add ripple effect
                element.addEventListener('click', (e) => {
                    this.createRippleEffect(e, element);
                });

                // Handle loading state
                if (data.loading) {
                    element.classList.add('loading');
                }
            }
        };
    }

    // Toast Container Component
    createToastContainerComponent() {
        return {
            template: (data = {}) => `
                <div class="toast-container ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <!-- Toast messages will be inserted here -->
                </div>
            `,
            styles: `
                .toast-container {
                    position: fixed;
                    top: var(--spacing-xl);
                    right: var(--spacing-xl);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                    pointer-events: none;
                }
                
                .toast {
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-md) var(--spacing-lg);
                    min-width: 300px;
                    max-width: 400px;
                    box-shadow: var(--shadow-lg);
                    pointer-events: auto;
                    animation: slideInRight 0.3s ease-out;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                
                .toast.success {
                    border-left: 4px solid var(--success-color);
                }
                
                .toast.error {
                    border-left: 4px solid var(--error-color);
                }
                
                .toast.warning {
                    border-left: 4px solid var(--warning-color);
                }
                
                .toast.info {
                    border-left: 4px solid var(--primary-color);
                }
                
                .toast-icon {
                    font-size: var(--font-size-lg);
                    flex-shrink: 0;
                }
                
                .toast-content {
                    flex: 1;
                }
                
                .toast-title {
                    font-weight: 600;
                    margin-bottom: var(--spacing-xs);
                    color: var(--text-primary);
                }
                
                .toast-message {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: var(--spacing-xs);
                    font-size: var(--font-size-lg);
                    line-height: 1;
                    opacity: 0.7;
                    transition: opacity var(--transition-normal);
                }
                
                .toast-close:hover {
                    opacity: 1;
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
            `,
            init: (element, data) => {
                // Initialize toast container
                this.toastContainer = element;
                this.toasts = [];
            },
            methods: {
                showToast: (message, type = 'info', options = {}) => {
                    const toast = this.createToast(message, type, options);
                    this.toastContainer.appendChild(toast);
                    this.toasts.push(toast);
                    
                    // Auto remove after duration
                    setTimeout(() => {
                        this.removeToast(toast);
                    }, options.duration || 5000);
                },
                createToast: (message, type, options) => {
                    const toast = document.createElement('div');
                    toast.className = `toast ${type}`;
                    
                    const icons = {
                        success: '✅',
                        error: '❌',
                        warning: '⚠️',
                        info: 'ℹ️'
                    };
                    
                    toast.innerHTML = `
                        <span class="toast-icon">${icons[type]}</span>
                        <div class="toast-content">
                            ${options.title ? `<div class="toast-title">${options.title}</div>` : ''}
                            <div class="toast-message">${message}</div>
                        </div>
                        <button class="toast-close">&times;</button>
                    `;
                    
                    // Add close handler
                    toast.querySelector('.toast-close').addEventListener('click', () => {
                        this.removeToast(toast);
                    });
                    
                    return toast;
                },
                removeToast: (toast) => {
                    toast.style.animation = 'slideOutRight 0.3s ease-out';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                        const index = this.toasts.indexOf(toast);
                        if (index > -1) {
                            this.toasts.splice(index, 1);
                        }
                    }, 300);
                }
            }
        };
    }

    // Modal Component
    createModalComponent() {
        return {
            template: (data = {}) => `
                <div class="modal-overlay ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">${data.title || ''}</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            ${data.content || ''}
                        </div>
                        ${data.footer ? `<div class="modal-footer">${data.footer}</div>` : ''}
                    </div>
                </div>
            `,
            styles: `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all var(--transition-normal);
                }
                
                .modal-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .modal-content {
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-xl);
                    padding: 0;
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow: hidden;
                    transform: scale(0.9);
                    transition: transform var(--transition-normal);
                    box-shadow: var(--shadow-xl);
                }
                
                .modal-overlay.active .modal-content {
                    transform: scale(1);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--spacing-lg);
                    border-bottom: 1px solid var(--glass-border);
                }
                
                .modal-title {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: var(--font-size-xl);
                    font-weight: 600;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    font-size: var(--font-size-2xl);
                    cursor: pointer;
                    padding: var(--spacing-xs);
                    line-height: 1;
                    transition: color var(--transition-normal);
                }
                
                .modal-close:hover {
                    color: var(--text-primary);
                }
                
                .modal-body {
                    padding: var(--spacing-lg);
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .modal-footer {
                    padding: var(--spacing-lg);
                    border-top: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--spacing-md);
                }
            `,
            init: (element, data) => {
                // Initialize modal
                this.modal = element;
                this.isOpen = false;
                
                // Add close handlers
                const closeBtn = element.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.close());
                }
                
                // Close on overlay click
                element.addEventListener('click', (e) => {
                    if (e.target === element) {
                        this.close();
                    }
                });
                
                // Close on escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.isOpen) {
                        this.close();
                    }
                });
            },
            methods: {
                open: () => {
                    this.modal.classList.add('active');
                    this.isOpen = true;
                    document.body.style.overflow = 'hidden';
                    
                    // Focus management
                    const focusableElements = this.modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusableElements.length > 0) {
                        focusableElements[0].focus();
                    }
                },
                close: () => {
                    this.modal.classList.remove('active');
                    this.isOpen = false;
                    document.body.style.overflow = '';
                }
            }
        };
    }

    // Loading Spinner Component
    createLoadingSpinnerComponent() {
        return {
            template: (data = {}) => `
                <div class="loading-spinner ${data.size || 'md'} ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <div class="spinner-circle"></div>
                    ${data.text ? `<span class="spinner-text">${data.text}</span>` : ''}
                </div>
            `,
            styles: `
                .loading-spinner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                
                .spinner-circle {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--glass-border);
                    border-top: 3px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                .loading-spinner.sm .spinner-circle {
                    width: 24px;
                    height: 24px;
                    border-width: 2px;
                }
                
                .loading-spinner.lg .spinner-circle {
                    width: 56px;
                    height: 56px;
                    border-width: 4px;
                }
                
                .spinner-text {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `
        };
    }

    // Status Badge Component
    createStatusBadgeComponent() {
        return {
            template: (data = {}) => `
                <span class="status-badge ${data.status || 'info'} ${data.size || 'md'} ${data.className || ''}" 
                      ${data.id ? `id="${data.id}"` : ''}>
                    ${data.icon ? `<span class="badge-icon">${data.icon}</span>` : ''}
                    <span class="badge-text">${data.text || ''}</span>
                </span>
            `,
            styles: `
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: var(--radius-full);
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .status-badge.success {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }
                
                .status-badge.error {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                
                .status-badge.warning {
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.3);
                }
                
                .status-badge.info {
                    background: rgba(0, 212, 255, 0.2);
                    color: #00d4ff;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                }
                
                .status-badge.sm {
                    font-size: var(--font-size-xs);
                    padding: 2px var(--spacing-xs);
                }
                
                .status-badge.lg {
                    font-size: var(--font-size-base);
                    padding: var(--spacing-xs) var(--spacing-md);
                }
                
                .badge-icon {
                    font-size: 1em;
                }
            `
        };
    }

    // Feature Card Component
    createFeatureCardComponent() {
        return {
            template: (data = {}) => `
                <div class="feature-card ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <div class="feature-icon">${data.icon || ''}</div>
                    <h3 class="feature-title">${data.title || ''}</h3>
                    <p class="feature-description">${data.description || ''}</p>
                    ${data.link ? `<a href="${data.link}" class="feature-link">Learn more →</a>` : ''}
                </div>
            `,
            styles: `
                .feature-card {
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-xl);
                    text-align: center;
                    transition: all var(--transition-normal);
                    cursor: pointer;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--primary-color);
                    box-shadow: var(--shadow-lg);
                }
                
                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: var(--spacing-md);
                    display: block;
                }
                
                .feature-title {
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    margin-bottom: var(--spacing-sm);
                    color: var(--text-primary);
                }
                
                .feature-description {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: var(--spacing-md);
                }
                
                .feature-link {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 500;
                    transition: color var(--transition-normal);
                }
                
                .feature-link:hover {
                    color: var(--secondary-color);
                }
            `
        };
    }

    // Navigation Header Component
    createNavigationHeaderComponent() {
        return {
            template: (data = {}) => `
                <header class="navigation-header ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <div class="header-content">
                        <div class="logo-section">
                            <div class="logo">
                                <span class="logo-icon">${data.logoIcon || '♠️'}</span>
                                <div class="logo-text">
                                    <h1>${data.title || 'All-In Chat Poker'}</h1>
                                    <span class="logo-subtitle">${data.subtitle || ''}</span>
                                </div>
                            </div>
                        </div>
                        <nav class="header-nav">
                            ${data.navItems ? data.navItems.map(item => 
                                `<a href="${item.href}" class="nav-link ${item.active ? 'active' : ''}">${item.text}</a>`
                            ).join('') : ''}
                        </nav>
                    </div>
                </header>
            `,
            styles: `
                .navigation-header {
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border-bottom: 1px solid var(--glass-border);
                    padding: var(--spacing-md) 0;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                
                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 var(--spacing-lg);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    text-decoration: none;
                    color: var(--text-primary);
                }
                
                .logo-icon {
                    font-size: var(--font-size-2xl);
                }
                
                .logo-text h1 {
                    margin: 0;
                    font-size: var(--font-size-xl);
                    font-weight: 600;
                }
                
                .logo-subtitle {
                    font-size: var(--font-size-sm);
                    color: var(--text-muted);
                }
                
                .header-nav {
                    display: flex;
                    gap: var(--spacing-lg);
                }
                
                .nav-link {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-weight: 500;
                    transition: color var(--transition-normal);
                    position: relative;
                }
                
                .nav-link:hover,
                .nav-link.active {
                    color: var(--primary-color);
                }
                
                .nav-link.active::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--primary-color);
                }
            `
        };
    }

    // Hero Section Component
    createHeroSectionComponent() {
        return {
            template: (data = {}) => `
                <section class="hero-section ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <div class="hero-content">
                        ${data.badge ? `<div class="hero-badge">${data.badge}</div>` : ''}
                        <h1 class="hero-title">${data.title || ''}</h1>
                        <p class="hero-subtitle">${data.subtitle || ''}</p>
                        ${data.buttons ? data.buttons.map(btn => 
                            `<button class="btn btn-${btn.variant || 'primary'} ${btn.className || ''}">${btn.text}</button>`
                        ).join('') : ''}
                    </div>
                    ${data.visual ? `<div class="hero-visual">${data.visual}</div>` : ''}
                </section>
            `,
            styles: `
                .hero-section {
                    padding: 6rem 2rem 4rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    align-items: center;
                }
                
                .hero-content {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xl);
                }
                
                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 25px;
                    color: var(--text-primary);
                    font-weight: 500;
                    width: fit-content;
                }
                
                .hero-title {
                    font-size: var(--font-size-4xl);
                    font-weight: 600;
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1.2;
                }
                
                .hero-subtitle {
                    font-size: var(--font-size-lg);
                    color: var(--text-secondary);
                    line-height: 1.6;
                }
                
                .hero-visual {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                @media (max-width: 768px) {
                    .hero-section {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-xl);
                        padding: 4rem 1rem 2rem;
                    }
                    
                    .hero-title {
                        font-size: var(--font-size-3xl);
                    }
                }
            `
        };
    }

    // Form Input Component
    createFormInputComponent() {
        return {
            template: (data = {}) => `
                <div class="form-input-group ${data.className || ''}" ${data.id ? `id="${data.id}"` : ''}>
                    <label for="${data.inputId}" class="form-label">${data.label}</label>
                    <div class="form-input-wrapper">
                        ${data.icon ? `<span class="form-input-icon">${data.icon}</span>` : ''}
                        <input type="${data.type || 'text'}" 
                               id="${data.inputId}" 
                               class="form-input" 
                               placeholder="${data.placeholder || ''}"
                               ${data.required ? 'required' : ''}
                               ${data.disabled ? 'disabled' : ''}>
                    </div>
                    ${data.error ? `<span class="form-error">${data.error}</span>` : ''}
                    ${data.help ? `<span class="form-help">${data.help}</span>` : ''}
                </div>
            `,
            styles: `
                .form-input-group {
                    margin-bottom: var(--spacing-lg);
                }
                
                .form-label {
                    display: block;
                    margin-bottom: var(--spacing-sm);
                    color: var(--text-primary);
                    font-weight: 500;
                }
                
                .form-input-wrapper {
                    position: relative;
                }
                
                .form-input-icon {
                    position: absolute;
                    left: var(--spacing-md);
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    pointer-events: none;
                    transition: color var(--transition-normal);
                }
                
                .form-input {
                    width: 100%;
                    padding: var(--spacing-md) var(--spacing-lg);
                    ${data.icon ? 'padding-left: 3rem;' : ''}
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: var(--font-size-base);
                    transition: all var(--transition-normal);
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
                }
                
                .form-input:focus + .form-input-icon {
                    color: var(--primary-color);
                }
                
                .form-error {
                    display: block;
                    color: var(--error-color);
                    font-size: var(--font-size-sm);
                    margin-top: var(--spacing-xs);
                }
                
                .form-help {
                    display: block;
                    color: var(--text-muted);
                    font-size: var(--font-size-sm);
                    margin-top: var(--spacing-xs);
                }
            `
        };
    }

    // Icon Button Component
    createIconButtonComponent() {
        return {
            template: (data = {}) => `
                <button class="icon-btn ${data.size || 'md'} ${data.variant || 'primary'} ${data.className || ''}" 
                        ${data.id ? `id="${data.id}"` : ''} 
                        ${data.disabled ? 'disabled' : ''}
                        type="${data.type || 'button'}"
                        title="${data.title || ''}">
                    <span class="icon-btn-icon">${data.icon || ''}</span>
                </button>
            `,
            styles: `
                .icon-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    background: var(--glass-bg);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    color: var(--text-primary);
                }
                
                .icon-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .icon-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .icon-btn.sm {
                    width: 32px;
                    height: 32px;
                    font-size: var(--font-size-sm);
                }
                
                .icon-btn.md {
                    width: 40px;
                    height: 40px;
                    font-size: var(--font-size-base);
                }
                
                .icon-btn.lg {
                    width: 48px;
                    height: 48px;
                    font-size: var(--font-size-lg);
                }
                
                .icon-btn.primary {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: var(--text-inverse);
                }
                
                .icon-btn.secondary {
                    background: var(--glass-bg);
                    border-color: var(--glass-border);
                    color: var(--text-primary);
                }
            `
        };
    }

    setupComponentRegistry() {
        // Create global component registry
        window.componentRegistry = {
            get: (name) => this.getComponent(name),
            create: (name, data) => this.createComponent(name, data),
            register: (name, component) => this.registerComponent(name, component)
        };
    }

    initComponentLoader() {
        // Auto-load components with data-component attributes
        document.addEventListener('DOMContentLoaded', () => {
            this.loadComponents();
        });
    }

    loadComponents() {
        const elements = document.querySelectorAll('[data-component]');
        elements.forEach(element => {
            const componentName = element.getAttribute('data-component');
            const component = this.getComponent(componentName);
            
            if (component) {
                const data = this.parseComponentData(element);
                this.renderComponent(element, component, data);
            }
        });
    }

    parseComponentData(element) {
        const data = {};
        
        // Parse data attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                const key = attr.name.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                data[key] = attr.value;
            }
        });
        
        // Parse inner content
        if (element.innerHTML.trim()) {
            data.content = element.innerHTML;
        }
        
        return data;
    }

    renderComponent(element, component, data) {
        // Render component template
        const template = component.template(data);
        element.innerHTML = template;
        
        // Inject styles if not already injected
        if (component.styles && !document.getElementById(`component-styles-${element.getAttribute('data-component')}`)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = `component-styles-${element.getAttribute('data-component')}`;
            styleSheet.textContent = component.styles;
            document.head.appendChild(styleSheet);
        }
        
        // Initialize component
        if (component.init) {
            component.init(element, data);
        }
        
        // Bind methods if available
        if (component.methods) {
            Object.entries(component.methods).forEach(([methodName, method]) => {
                element[methodName] = method.bind(this);
            });
        }
    }

    createComponent(name, data) {
        const component = this.getComponent(name);
        if (!component) {
            console.error(`Component "${name}" not found`);
            return null;
        }
        
        const element = document.createElement('div');
        this.renderComponent(element, component, data);
        return element.firstElementChild || element;
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
}

// Initialize component library
document.addEventListener('DOMContentLoaded', () => {
    window.componentLibrary = new ComponentLibrary();
});

// Export for potential external use
window.ComponentLibrary = ComponentLibrary;
