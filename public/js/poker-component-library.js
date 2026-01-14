/**
 * Reusable UI Component Library for Poker Game
 * Provides consistent, accessible, and responsive components
 */

class PokerComponentLibrary {
  constructor() {
    this.components = new Map();
    this.themes = new Map();
    this.defaultTheme = 'poker-blue';
    
    this.init();
  }

  init() {
    // Register default components
    this.registerDefaultComponents();
    
    // Register default themes
    this.registerDefaultThemes();
    
    // Setup component styles
    this.setupComponentStyles();
  }

  registerDefaultComponents() {
    // Button Component
    this.registerComponent('Button', {
      template: (props) => this.createButton(props),
      defaults: {
        variant: 'primary',
        size: 'medium',
        disabled: false,
        loading: false,
        icon: null,
        children: 'Button'
      }
    });

    // Card Component
    this.registerComponent('Card', {
      template: (props) => this.createCard(props),
      defaults: {
        variant: 'default',
        size: 'medium',
        suit: null,
        rank: null,
        faceDown: false,
        selected: false,
        disabled: false
      }
    });

    // Chip Component
    this.registerComponent('Chip', {
      template: (props) => this.createChip(props),
      defaults: {
        value: 0,
        color: 'blue',
        size: 'medium',
        animated: false,
        count: 1
      }
    });

    // Badge Component
    this.registerComponent('Badge', {
      template: (props) => this.createBadge(props),
      defaults: {
        variant: 'default',
        size: 'medium',
        children: null
      }
    });

    // Modal Component
    this.registerComponent('Modal', {
      template: (props) => this.createModal(props),
      defaults: {
        isOpen: false,
        title: 'Modal',
        size: 'medium',
        closable: true,
        children: null
      }
    });

    // Tooltip Component
    this.registerComponent('Tooltip', {
      template: (props) => this.createTooltip(props),
      defaults: {
        content: '',
        position: 'top',
        trigger: 'hover'
      }
    });

    // Progress Component
    this.registerComponent('Progress', {
      template: (props) => this.createProgress(props),
      defaults: {
        value: 0,
        max: 100,
        size: 'medium',
        showLabel: false,
        animated: true
      }
    });

    // Alert Component
    this.registerComponent('Alert', {
      template: (props) => this.createAlert(props),
      defaults: {
        variant: 'info',
        dismissible: false,
        children: 'Alert message'
      }
    });
  }

  registerDefaultThemes() {
    // Poker Blue Theme
    this.registerTheme('poker-blue', {
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      }
    });

    // Poker Green Theme
    this.registerTheme('poker-green', {
      colors: {
        primary: '#059669',
        primaryHover: '#047857',
        secondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#022c22',
        surface: '#064e3b',
        text: '#f0fdf4',
        textSecondary: '#86efac'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      }
    });

    // Poker Dark Theme
    this.registerTheme('poker-dark', {
      colors: {
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        secondary: '#4b5563',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#000000',
        surface: '#111827',
        text: '#f9fafb',
        textSecondary: '#9ca3af'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      }
    });
  }

  registerComponent(name, config) {
    this.components.set(name, config);
  }

  registerTheme(name, theme) {
    this.themes.set(name, theme);
  }

  // Component creation methods
  createButton(props) {
    const {
      variant = 'primary',
      size = 'medium',
      disabled = false,
      loading = false,
      icon = null,
      children = 'Button',
      onClick,
      className = '',
      ...rest
    } = { ...this.components.get('Button').defaults, ...props };

    const theme = this.getCurrentTheme();
    const button = document.createElement('button');
    button.className = `poker-button poker-button--${variant} poker-button--${size} ${className}`;
    button.disabled = disabled || loading;
    
    // Add icon if provided
    if (icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'poker-button__icon';
      iconSpan.textContent = icon;
      button.appendChild(iconSpan);
    }
    
    // Add loading spinner
    if (loading) {
      const spinner = document.createElement('span');
      spinner.className = 'poker-button__spinner';
      spinner.innerHTML = '⟳';
      button.appendChild(spinner);
    }
    
    // Add text
    const textSpan = document.createElement('span');
    textSpan.className = 'poker-button__text';
    textSpan.textContent = children;
    button.appendChild(textSpan);
    
    // Add event listeners
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    // Add accessibility attributes
    button.setAttribute('role', 'button');
    if (disabled) {
      button.setAttribute('aria-disabled', 'true');
    }
    
    return button;
  }

  createCard(props) {
    const {
      variant = 'default',
      size = 'medium',
      suit = null,
      rank = null,
      faceDown = false,
      selected = false,
      disabled = false,
      onClick,
      className = '',
      ...rest
    } = { ...this.components.get('Card').defaults, ...props };

    const card = document.createElement('div');
    card.className = `poker-card poker-card--${variant} poker-card--${size} ${className}`;
    
    if (faceDown) {
      card.classList.add('poker-card--face-down');
    }
    
    if (selected) {
      card.classList.add('poker-card--selected');
    }
    
    if (disabled) {
      card.classList.add('poker-card--disabled');
      card.setAttribute('aria-disabled', 'true');
    }
    
    // Card face
    const cardFace = document.createElement('div');
    cardFace.className = 'poker-card__face';
    
    if (!faceDown && suit && rank) {
      cardFace.innerHTML = `
        <div class="poker-card__rank">${rank}</div>
        <div class="poker-card__suit">${suit}</div>
      `;
    } else {
      cardFace.innerHTML = `
        <div class="poker-card__back">
          <div class="poker-card__pattern"></div>
        </div>
      `;
    }
    
    card.appendChild(cardFace);
    
    // Add event listeners
    if (onClick && !disabled) {
      card.addEventListener('click', onClick);
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      
      // Keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      });
    }
    
    return card;
  }

  createChip(props) {
    const {
      value = 0,
      color = 'blue',
      size = 'medium',
      animated = false,
      count = 1,
      className = '',
      ...rest
    } = { ...this.components.get('Chip').defaults, ...props };

    const chip = document.createElement('div');
    chip.className = `poker-chip poker-chip--${color} poker-chip--${size} ${className}`;
    
    if (animated) {
      chip.classList.add('poker-chip--animated');
    }
    
    // Chip body
    const chipBody = document.createElement('div');
    chipBody.className = 'poker-chip__body';
    
    // Chip value
    if (value > 0) {
      const valueSpan = document.createElement('span');
      valueSpan.className = 'poker-chip__value';
      valueSpan.textContent = this.formatChipValue(value);
      chipBody.appendChild(valueSpan);
    }
    
    // Chip count indicator
    if (count > 1) {
      const countSpan = document.createElement('span');
      countSpan.className = 'poker-chip__count';
      countSpan.textContent = `×${count}`;
      chipBody.appendChild(countSpan);
    }
    
    chip.appendChild(chipBody);
    
    return chip;
  }

  createBadge(props) {
    const {
      variant = 'default',
      size = 'medium',
      children = null,
      className = '',
      ...rest
    } = { ...this.components.get('Badge').defaults, ...props };

    const badge = document.createElement('span');
    badge.className = `poker-badge poker-badge--${variant} poker-badge--${size} ${className}`;
    
    if (children) {
      badge.textContent = children;
    }
    
    return badge;
  }

  createModal(props) {
    const {
      isOpen = false,
      title = 'Modal',
      size = 'medium',
      closable = true,
      children = null,
      onClose,
      className = '',
      ...rest
    } = { ...this.components.get('Modal').defaults, ...props };

    const modal = document.createElement('div');
    modal.className = `poker-modal poker-modal--${size} ${className}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `modal-title-${Date.now()}`);
    
    if (!isOpen) {
      modal.style.display = 'none';
    }
    
    // Modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'poker-modal__overlay';
    
    // Modal content
    const content = document.createElement('div');
    content.className = 'poker-modal__content';
    
    // Modal header
    const header = document.createElement('div');
    header.className = 'poker-modal__header';
    
    const titleElement = document.createElement('h2');
    titleElement.className = 'poker-modal__title';
    titleElement.textContent = title;
    header.appendChild(titleElement);
    
    if (closable) {
      const closeButton = document.createElement('button');
      closeButton.className = 'poker-modal__close';
      closeButton.innerHTML = '×';
      closeButton.setAttribute('aria-label', 'Close modal');
      closeButton.addEventListener('click', () => {
        if (onClose) onClose();
      });
      header.appendChild(closeButton);
    }
    
    // Modal body
    const body = document.createElement('div');
    body.className = 'poker-modal__body';
    
    if (children) {
      if (typeof children === 'string') {
        body.textContent = children;
      } else if (children instanceof HTMLElement) {
        body.appendChild(children);
      }
    }
    
    content.appendChild(header);
    content.appendChild(body);
    modal.appendChild(overlay);
    modal.appendChild(content);
    
    // Close on overlay click
    overlay.addEventListener('click', () => {
      if (onClose) onClose();
    });
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable && onClose) {
        onClose();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return modal;
  }

  createTooltip(props) {
    const {
      content = '',
      position = 'top',
      trigger = 'hover',
      className = '',
      ...rest
    } = { ...this.components.get('Tooltip').defaults, ...props };

    const tooltip = document.createElement('div');
    tooltip.className = `poker-tooltip poker-tooltip--${position} ${className}`;
    tooltip.setAttribute('role', 'tooltip');
    
    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'poker-tooltip__content';
    tooltipContent.textContent = content;
    
    tooltip.appendChild(tooltipContent);
    
    return tooltip;
  }

  createProgress(props) {
    const {
      value = 0,
      max = 100,
      size = 'medium',
      showLabel = false,
      animated = true,
      className = '',
      ...rest
    } = { ...this.components.get('Progress').defaults, ...props };

    const progress = document.createElement('div');
    progress.className = `poker-progress poker-progress--${size} ${className}`;
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'poker-progress__bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'poker-progress__fill';
    if (animated) {
      progressFill.classList.add('poker-progress__fill--animated');
    }
    
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    progressFill.style.width = `${percentage}%`;
    
    progressBar.appendChild(progressFill);
    
    // Label
    if (showLabel) {
      const label = document.createElement('div');
      label.className = 'poker-progress__label';
      label.textContent = `${Math.round(percentage)}%`;
      progress.appendChild(label);
    }
    
    progress.appendChild(progressBar);
    
    return progress;
  }

  createAlert(props) {
    const {
      variant = 'info',
      dismissible = false,
      children = 'Alert message',
      onDismiss,
      className = '',
      ...rest
    } = { ...this.components.get('Alert').defaults, ...props };

    const alert = document.createElement('div');
    alert.className = `poker-alert poker-alert--${variant} ${className}`;
    alert.setAttribute('role', 'alert');
    
    // Alert content
    const content = document.createElement('div');
    content.className = 'poker-alert__content';
    content.textContent = children;
    
    alert.appendChild(content);
    
    // Dismiss button
    if (dismissible) {
      const dismissButton = document.createElement('button');
      dismissButton.className = 'poker-alert__dismiss';
      dismissButton.innerHTML = '×';
      dismissButton.setAttribute('aria-label', 'Dismiss alert');
      dismissButton.addEventListener('click', () => {
        if (onDismiss) onDismiss();
        alert.remove();
      });
      alert.appendChild(dismissButton);
    }
    
    return alert;
  }

  // Utility methods
  getCurrentTheme() {
    return this.themes.get(this.defaultTheme);
  }

  setTheme(themeName) {
    if (this.themes.has(themeName)) {
      this.defaultTheme = themeName;
      this.applyTheme(themeName);
    }
  }

  applyTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) return;
    
    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--poker-color-${key}`, value);
    });
    
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--poker-spacing-${key}`, value);
    });
    
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--poker-radius-${key}`, value);
    });
    
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--poker-shadow-${key}`, value);
    });
  }

  formatChipValue(value) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  setupComponentStyles() {
    if (document.querySelector('#poker-component-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'poker-component-styles';
    style.textContent = `
      /* Base component styles */
      .poker-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--poker-spacing-sm);
        border: none;
        border-radius: var(--poker-radius-md);
        font-family: inherit;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
      }
      
      .poker-button:focus-visible {
        outline: 2px solid var(--poker-color-primary);
        outline-offset: 2px;
      }
      
      .poker-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .poker-button--primary {
        background: var(--poker-color-primary);
        color: white;
      }
      
      .poker-button--primary:hover:not(:disabled) {
        background: var(--poker-color-primaryHover);
      }
      
      .poker-button--secondary {
        background: var(--poker-color-secondary);
        color: white;
      }
      
      .poker-button--outline {
        background: transparent;
        border: 2px solid var(--poker-color-primary);
        color: var(--poker-color-primary);
      }
      
      .poker-button--outline:hover:not(:disabled) {
        background: var(--poker-color-primary);
        color: white;
      }
      
      .poker-button--small {
        padding: var(--poker-spacing-sm) var(--poker-spacing-md);
        font-size: 0.875rem;
      }
      
      .poker-button--medium {
        padding: var(--poker-spacing-md) var(--poker-spacing-lg);
        font-size: 1rem;
      }
      
      .poker-button--large {
        padding: var(--poker-spacing-lg) var(--poker-spacing-xl);
        font-size: 1.125rem;
      }
      
      .poker-button__spinner {
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* Card styles */
      .poker-card {
        position: relative;
        background: white;
        border: 2px solid #333;
        border-radius: var(--poker-radius-md);
        box-shadow: var(--poker-shadow-md);
        transition: all 0.2s ease;
        cursor: default;
      }
      
      .poker-card:hover:not(.poker-card--disabled) {
        transform: translateY(-2px);
        box-shadow: var(--poker-shadow-lg);
      }
      
      .poker-card--selected {
        border-color: var(--poker-color-primary);
        box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
      }
      
      .poker-card--face-down .poker-card__face {
        background: linear-gradient(45deg, #1a1a1a 25%, #2a2a2a 25%, #2a2a2a 50%, #1a1a1a 50%, #1a1a1a 75%, #2a2a2a 75%, #2a2a2a);
        background-size: 20px 20px;
      }
      
      .poker-card__face {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: var(--poker-spacing-sm);
      }
      
      .poker-card__rank {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
      }
      
      .poker-card__suit {
        font-size: 1.2rem;
      }
      
      .poker-card--small {
        width: 60px;
        height: 84px;
      }
      
      .poker-card--medium {
        width: 80px;
        height: 112px;
      }
      
      .poker-card--large {
        width: 100px;
        height: 140px;
      }
      
      /* Chip styles */
      .poker-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px dashed rgba(255, 255, 255, 0.3);
        font-weight: bold;
        font-size: 0.75rem;
        position: relative;
      }
      
      .poker-chip--blue {
        background: linear-gradient(45deg, #2563eb, #1d4ed8);
        color: white;
      }
      
      .poker-chip--red {
        background: linear-gradient(45deg, #dc2626, #b91c1c);
        color: white;
      }
      
      .poker-chip--green {
        background: linear-gradient(45deg, #16a34a, #15803d);
        color: white;
      }
      
      .poker-chip--black {
        background: linear-gradient(45deg, #374151, #1f2937);
        color: white;
      }
      
      .poker-chip--animated {
        animation: chip-bounce 2s ease-in-out infinite;
      }
      
      @keyframes chip-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      /* Badge styles */
      .poker-badge {
        display: inline-flex;
        align-items: center;
        padding: var(--poker-spacing-xs) var(--poker-spacing-sm);
        border-radius: var(--poker-radius-lg);
        font-size: 0.75rem;
        font-weight: 500;
      }
      
      .poker-badge--default {
        background: var(--poker-color-secondary);
        color: white;
      }
      
      .poker-badge--success {
        background: var(--poker-color-success);
        color: white;
      }
      
      .poker-badge--warning {
        background: var(--poker-color-warning);
        color: white;
      }
      
      .poker-badge--error {
        background: var(--poker-color-error);
        color: white;
      }
      
      /* Modal styles */
      .poker-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .poker-modal__overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
      
      .poker-modal__content {
        position: relative;
        background: var(--poker-color-surface);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--poker-radius-lg);
        box-shadow: var(--poker-shadow-xl);
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .poker-modal--small .poker-modal__content {
        width: 90%;
        max-width: 400px;
      }
      
      .poker-modal--medium .poker-modal__content {
        width: 90%;
        max-width: 600px;
      }
      
      .poker-modal--large .poker-modal__content {
        width: 95%;
        max-width: 800px;
      }
      
      .poker-modal__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--poker-spacing-lg);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .poker-modal__title {
        margin: 0;
        color: var(--poker-color-text);
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      .poker-modal__close {
        background: none;
        border: none;
        color: var(--poker-color-textSecondary);
        font-size: 1.5rem;
        cursor: pointer;
        padding: var(--poker-spacing-sm);
        border-radius: var(--poker-radius-sm);
      }
      
      .poker-modal__close:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .poker-modal__body {
        padding: var(--poker-spacing-lg);
        color: var(--poker-color-text);
      }
      
      /* Progress styles */
      .poker-progress {
        width: 100%;
      }
      
      .poker-progress__bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: var(--poker-radius-sm);
        overflow: hidden;
      }
      
      .poker-progress--small .poker-progress__bar {
        height: 4px;
      }
      
      .poker-progress--large .poker-progress__bar {
        height: 12px;
      }
      
      .poker-progress__fill {
        height: 100%;
        background: var(--poker-color-primary);
        border-radius: var(--poker-radius-sm);
        transition: width 0.3s ease;
      }
      
      .poker-progress__fill--animated {
        background: linear-gradient(90deg, var(--poker-color-primary), var(--poker-color-primaryHover));
        background-size: 200% 100%;
        animation: progress-shine 2s ease-in-out infinite;
      }
      
      @keyframes progress-shine {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .poker-progress__label {
        margin-top: var(--poker-spacing-sm);
        text-align: center;
        font-size: 0.875rem;
        color: var(--poker-color-textSecondary);
      }
      
      /* Alert styles */
      .poker-alert {
        display: flex;
        align-items: flex-start;
        gap: var(--poker-spacing-sm);
        padding: var(--poker-spacing-md);
        border-radius: var(--poker-radius-md);
        border: 1px solid transparent;
      }
      
      .poker-alert--info {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
        color: #93c5fd;
      }
      
      .poker-alert--success {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
        color: #86efac;
      }
      
      .poker-alert--warning {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
        color: #fcd34d;
      }
      
      .poker-alert--error {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
        color: #fca5a5;
      }
      
      .poker-alert__dismiss {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .poker-button--large {
          padding: var(--poker-spacing-md) var(--poker-spacing-lg);
          font-size: 1rem;
        }
        
        .poker-modal__content {
          width: 95%;
          margin: var(--poker-spacing-md);
        }
        
        .poker-card--large {
          width: 80px;
          height: 112px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Public API
  render(componentName, props, container) {
    const component = this.components.get(componentName);
    if (!component) {
      console.error(`Component "${componentName}" not found`);
      return null;
    }
    
    const element = component.template(props);
    
    if (container) {
      container.appendChild(element);
    }
    
    return element;
  }

  getComponent(componentName) {
    return this.components.get(componentName);
  }

  getTheme(themeName) {
    return this.themes.get(themeName);
  }

  listComponents() {
    return Array.from(this.components.keys());
  }

  listThemes() {
    return Array.from(this.themes.keys());
  }
}

// Create global instance
window.pokerComponents = new PokerComponentLibrary();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerComponentLibrary;
}
