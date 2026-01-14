/**
 * Loading States for Poker Game
 * Provides skeleton screens and loading indicators for better UX
 */

class PokerLoadingStates {
  constructor(options = {}) {
    this.options = {
      enableSkeletons: true,
      enableSpinners: true,
      enableProgressBars: true,
      enableShimmer: true,
      defaultDuration: 2000,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.activeLoaders = new Map();
    this.skeletonTemplates = new Map();
    
    this.init();
  }

  init() {
    // Register skeleton templates
    this.registerSkeletonTemplates();
    
    // Setup global loading states
    this.setupGlobalLoading();
    
    // Setup component-specific loading
    this.setupComponentLoading();
    
    this.isInitialized = true;
  }

  registerSkeletonTemplates() {
    // Card skeleton
    this.skeletonTemplates.set('card', `
      <div class="skeleton-card">
        <div class="skeleton-card-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-text">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        <div class="skeleton-card-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    `);
    
    // Player skeleton
    this.skeletonTemplates.set('player', `
      <div class="skeleton-player">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-info">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-chips">
            <div class="skeleton-chip"></div>
            <div class="skeleton-chip"></div>
          </div>
        </div>
      </div>
    `);
    
    // Table skeleton
    this.skeletonTemplates.set('table', `
      <div class="skeleton-table">
        <div class="skeleton-table-surface">
          <div class="skeleton-table-brand">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        <div class="skeleton-seats">
          ${Array.from({ length: 8 }, () => `
            <div class="skeleton-seat">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-line short"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `);
    
    // Action buttons skeleton
    this.skeletonTemplates.set('actions', `
      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
        <div class="skeleton-button primary"></div>
      </div>
    `);
    
    // Pot skeleton
    this.skeletonTemplates.set('pot', `
      <div class="skeleton-pot">
        <div class="skeleton-pot-icon"></div>
        <div class="skeleton-pot-amount">
          <div class="skeleton-line"></div>
        </div>
      </div>
    `);
    
    // Card hand skeleton
    this.skeletonTemplates.set('hand', `
      <div class="skeleton-hand">
        ${Array.from({ length: 2 }, () => `
          <div class="skeleton-card">
            <div class="skeleton-card-face">
              <div class="skeleton-card-rank"></div>
              <div class="skeleton-card-suit"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
    
    // Community cards skeleton
    this.skeletonTemplates.set('community', `
      <div class="skeleton-community">
        ${Array.from({ length: 5 }, () => `
          <div class="skeleton-card">
            <div class="skeleton-card-face">
              <div class="skeleton-card-rank"></div>
              <div class="skeleton-card-suit"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
    
    // Stats skeleton
    this.skeletonTemplates.set('stats', `
      <div class="skeleton-stats">
        <div class="skeleton-stat">
          <div class="skeleton-label"></div>
          <div class="skeleton-value"></div>
        </div>
        <div class="skeleton-stat">
          <div class="skeleton-label"></div>
          <div class="skeleton-value"></div>
        </div>
        <div class="skeleton-stat">
          <div class="skeleton-label"></div>
          <div class="skeleton-value"></div>
        </div>
      </div>
    `);
    
    // List skeleton
    this.skeletonTemplates.set('list', `
      <div class="skeleton-list">
        ${Array.from({ length: 5 }, () => `
          <div class="skeleton-list-item">
            <div class="skeleton-avatar small"></div>
            <div class="skeleton-text">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
  }

  setupGlobalLoading() {
    // Create global loading overlay
    this.createLoadingOverlay();
    
    // Create global loading spinner
    this.createLoadingSpinner();
    
    // Create global progress bar
    this.createProgressBar();
  }

  createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-overlay-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add styles
    this.addLoadingOverlayStyles();
  }

  createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'global-spinner';
    spinner.className = 'global-spinner';
    spinner.innerHTML = `
      <div class="spinner-dots">
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
      </div>
    `;
    
    document.body.appendChild(spinner);
    
    // Add styles
    this.addSpinnerStyles();
  }

  createProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.id = 'global-progress';
    progressBar.className = 'global-progress';
    progressBar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">0%</div>
    `;
    
    document.body.appendChild(progressBar);
    
    // Add styles
    this.addProgressBarStyles();
  }

  setupComponentLoading() {
    // Auto-detect loading states
    this.setupAutoDetection();
    
    // Setup manual loading triggers
    this.setupManualTriggers();
  }

  setupAutoDetection() {
    // Monitor for elements with data-loading attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkLoadingState(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Check existing elements
    document.querySelectorAll('[data-loading]').forEach(element => {
      this.checkLoadingState(element);
    });
  }

  setupManualTriggers() {
    // Global loading methods
    window.pokerLoading = {
      show: (element, type, options = {}) => this.showLoading(element, type, options),
      hide: (element) => this.hideLoading(element),
      showSkeleton: (element, type) => this.showSkeleton(element, type),
      hideSkeleton: (element) => this.hideSkeleton(element),
      showSpinner: (element) => this.showSpinner(element),
      hideSpinner: (element) => this.hideSpinner(element),
      showProgress: (element, progress) => this.showProgress(element, progress),
      hideProgress: (element) => this.hideProgress(element),
      showOverlay: (text) => this.showOverlay(text),
      hideOverlay: () => this.hideOverlay(),
      setGlobalProgress: (progress) => this.setGlobalProgress(progress),
      showGlobalSpinner: () => this.showGlobalSpinner(),
      hideGlobalSpinner: () => this.hideGlobalSpinner()
    };
  }

  checkLoadingState(element) {
    const loadingType = element.getAttribute('data-loading');
    
    if (loadingType) {
      this.showLoading(element, loadingType);
    }
  }

  showLoading(element, type, options = {}) {
    const {
      duration = this.options.defaultDuration,
      skeleton = true,
      spinner = false,
      overlay = false,
      shimmer = true
    } = options;
    
    // Store original content
    const originalContent = element.innerHTML;
    const originalClass = element.className;
    
    // Add loading class
    element.classList.add('loading');
    element.setAttribute('data-original-content', originalContent);
    element.setAttribute('data-original-class', originalClass);
    
    // Show skeleton
    if (skeleton && this.options.enableSkeletons) {
      this.showSkeleton(element, type);
    }
    
    // Show spinner
    if (spinner && this.options.enableSpinners) {
      this.showSpinner(element);
    }
    
    // Show shimmer effect
    if (shimmer && this.options.enableShimmer) {
      element.classList.add('shimmer');
    }
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hideLoading(element);
      }, duration);
    }
    
    // Store loader info
    this.activeLoaders.set(element, {
      type,
      originalContent,
      originalClass,
      startTime: Date.now()
    });
  }

  hideLoading(element) {
    // Restore original content
    const originalContent = element.getAttribute('data-original-content');
    const originalClass = element.getAttribute('data-original-class');
    
    if (originalContent) {
      element.innerHTML = originalContent;
    }
    
    if (originalClass) {
      element.className = originalClass;
    }
    
    // Remove loading classes
    element.classList.remove('loading', 'shimmer');
    
    // Remove loading attributes
    element.removeAttribute('data-original-content');
    element.removeAttribute('data-original-class');
    
    // Hide skeleton
    this.hideSkeleton(element);
    
    // Hide spinner
    this.hideSpinner(element);
    
    // Remove from active loaders
    this.activeLoaders.delete(element);
  }

  showSkeleton(element, type) {
    const template = this.skeletonTemplates.get(type);
    if (!template) {
      console.warn(`Skeleton template not found for type: ${type}`);
      return;
    }
    
    // Create skeleton container
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-container';
    skeleton.innerHTML = template;
    
    // Replace element content with skeleton
    element.innerHTML = '';
    element.appendChild(skeleton);
    
    // Add skeleton styles
    this.addSkeletonStyles();
  }

  hideSkeleton(element) {
    const skeleton = element.querySelector('.skeleton-container');
    if (skeleton) {
      skeleton.remove();
    }
  }

  showSpinner(element) {
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'element-spinner';
    spinner.innerHTML = `
      <div class="spinner-dots">
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
      </div>
    `;
    
    // Add spinner to element
    element.appendChild(spinner);
    
    // Add spinner styles
    this.addSpinnerStyles();
  }

  hideSpinner(element) {
    const spinner = element.querySelector('.element-spinner');
    if (spinner) {
      spinner.remove();
    }
  }

  showProgress(element, progress) {
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'element-progress';
    progressBar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="progress-text">${progress}%</div>
    `;
    
    // Add progress bar to element
    element.appendChild(progressBar);
    
    // Add progress styles
    this.addProgressBarStyles();
  }

  hideProgress(element) {
    const progressBar = element.querySelector('.element-progress');
    if (progressBar) {
      progressBar.remove();
    }
  }

  showOverlay(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.querySelector('.loading-text').textContent = text;
      overlay.classList.add('visible');
    }
  }

  hideOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
    }
  }

  showGlobalSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
      spinner.classList.add('visible');
    }
  }

  hideGlobalSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
      spinner.classList.remove('visible');
    }
  }

  setGlobalProgress(progress) {
    const progressBar = document.getElementById('global-progress');
    if (progressBar) {
      const fill = progressBar.querySelector('.progress-fill');
      const text = progressBar.querySelector('.progress-text');
      
      if (fill) {
        fill.style.width = `${progress}%`;
      }
      
      if (text) {
        text.textContent = `${progress}%`;
      }
      
      progressBar.classList.add('visible');
      
      // Hide when complete
      if (progress >= 100) {
        setTimeout(() => {
          progressBar.classList.remove('visible');
        }, 500);
      }
    }
  }

  // Style methods
  addLoadingOverlayStyles() {
    if (document.querySelector('#loading-overlay-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'loading-overlay-styles';
    style.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .loading-overlay.visible {
        display: flex;
      }
      
      .loading-overlay-content {
        text-align: center;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 1rem;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top: 3px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 1.1rem;
        font-weight: 500;
      }
    `;
    
    document.head.appendChild(style);
  }

  addSpinnerStyles() {
    if (document.querySelector('#spinner-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
      .global-spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9998;
        display: none;
        background: rgba(0, 0, 0, 0.8);
        padding: 1rem;
        border-radius: 8px;
        backdrop-filter: blur(5px);
      }
      
      .global-spinner.visible {
        display: block;
      }
      
      .spinner-dots {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      
      .spinner-dot {
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: spinner-bounce 1.4s ease-in-out infinite both;
      }
      
      .spinner-dot:nth-child(1) {
        animation-delay: -0.32s;
      }
      
      .spinner-dot:nth-child(2) {
        animation-delay: -0.16s;
      }
      
      @keyframes spinner-bounce {
        0%, 80%, 100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
      }
      
      .element-spinner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0.5rem 0;
      }
      
      .element-spinner .spinner-dots {
        width: 20px;
        height: 20px;
        gap: 0.25rem;
      }
      
      .element-spinner .spinner-dot {
        width: 4px;
        height: 4px;
        background: var(--poker-color-primary, #3b82f6);
        border-radius: 50%;
      }
    `;
    
    document.head.appendChild(style);
  }

  addProgressBarStyles() {
    if (document.querySelector('#progress-bar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'progress-bar-styles';
    style.textContent = `
      .global-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 9998;
        display: none;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        padding: 1rem;
        color: white;
      }
      
      .global-progress.visible {
        display: block;
      }
      
      .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--poker-color-primary, #3b82f6), var(--poker-color-primaryHover, #1d4ed8));
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      
      .progress-text {
        text-align: center;
        font-size: 0.9rem;
        font-weight: 500;
      }
      
      .element-progress {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
      }
      
      .element-progress .progress-bar {
        width: 100px;
        height: 6px;
      }
      
      .element-progress .progress-text {
        font-size: 0.8rem;
        min-width: 30px;
      }
    `;
    
    document.head.appendChild(style);
  }

  addSkeletonStyles() {
    if (document.querySelector('#skeleton-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
      .skeleton-container {
        animation: skeleton-fade-in 0.3s ease-out;
      }
      
      @keyframes skeleton-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .skeleton-card {
        background: var(--poker-color-surface, #1e293b);
        border: 1px solid var(--poker-color-border, #374151);
        border-radius: var(--poker-radius-base, 8px);
        padding: 1rem;
        margin: 0.5rem 0;
      }
      
      .skeleton-card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--poker-color-secondary, #64748b);
      }
      
      .skeleton-text {
        flex: 1;
      }
      
      .skeleton-line {
        height: 1rem;
        background: linear-gradient(90deg, var(--poker-color-secondary, #64748b) 25%, var(--poker-color-border, #374151) 50%, var(--poker-color-secondary, #64748b) 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        animation: skeleton-shimmer 1.5s infinite;
      }
      
      .skeleton-line.short {
        width: 60%;
      }
      
      @keyframes skeleton-shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      
      .skeleton-player {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--poker-color-surface, #1e293b);
        border: 1px solid var(--poker-color-border, #374151);
        border-radius: var(--poker-radius-base, 8px);
      }
      
      .skeleton-info {
        flex: 1;
      }
      
      .skeleton-chips {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      
      .skeleton-chip {
        width: 40px;
        height: 20px;
        background: var(--poker-color-secondary, #64748b);
        border-radius: 10px;
      }
      
      .skeleton-table {
        background: var(--poker-color-surface, #1e293b);
        border: 1px solid var(--poker-color-border, #374151);
        border-radius: var(--poker-radius-lg, 16px);
        padding: 2rem;
        margin: 1rem 0;
      }
      
      .skeleton-table-surface {
        width: 200px;
        height: 200px;
        background: var(--poker-color-secondary, #64748b);
        border-radius: 50%;
        margin: 0 auto 2rem;
        position: relative;
      }
      
      .skeleton-table-brand {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }
      
      .skeleton-seats {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 1rem;
      }
      
      .skeleton-seat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }
      
      .skeleton-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 1rem 0;
      }
      
      .skeleton-button {
        width: 80px;
        height: 40px;
        background: var(--poker-color-secondary, #64748b);
        border-radius: var(--poker-radius-base, 8px);
      }
      
      .skeleton-button.primary {
        background: var(--poker-color-primary, #3b82f6);
      }
      
      .skeleton-pot {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--poker-color-surface, #1e293b);
        border: 1px solid var(--poker-color-border, #374151);
        border-radius: var(--poker-radius-base, 8px);
      }
      
      .skeleton-pot-icon {
        width: 24px;
        height: 24px;
        background: var(--poker-color-secondary, #64748b);
        border-radius: 50%;
      }
      
      .skeleton-pot-amount {
        flex: 1;
      }
      
      .skeleton-hand {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      
      .skeleton-card {
        width: 60px;
        height: 84px;
        background: white;
        border: 2px solid #333;
        border-radius: var(--poker-radius-base, 8px);
        position: relative;
      }
      
      .skeleton-card-face {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      
      .skeleton-card-rank {
        width: 20px;
        height: 20px;
        background: #333;
        border-radius: 4px;
        margin-bottom: 0.25rem;
      }
      
      .skeleton-card-suit {
        width: 16px;
        height: 16px;
        background: #333;
        border-radius: 50%;
      }
      
      .skeleton-community {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin: 1rem 0;
      }
      
      .skeleton-stats {
        display: flex;
        gap: 1rem;
        justify-content: space-around;
        margin: 1rem 0;
      }
      
      .skeleton-stat {
        text-align: center;
      }
      
      .skeleton-label {
        height: 0.8rem;
        background: var(--poker-color-secondary, #64748b);
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
      
      .skeleton-value {
        height: 1.2rem;
        background: var(--poker-color-secondary, #64748b);
        border-radius: 4px;
      }
      
      .skeleton-list {
        margin: 1rem 0;
      }
      
      .skeleton-list-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--poker-color-surface, #1e293b);
        border: 1px solid var(--poker-color-border, #374151);
        border-radius: var(--poker-radius-base, 8px);
      }
      
      .skeleton-avatar.small {
        width: 30px;
        height: 30px;
      }
      
      .shimmer {
        position: relative;
        overflow: hidden;
      }
      
      .shimmer::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent
        );
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      
      .loading {
        position: relative;
        overflow: hidden;
      }
      
      .loading::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        animation: loading-pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes loading-pulse {
        0%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Public API
  createSkeleton(type, container) {
    const template = this.skeletonTemplates.get(type);
    if (!template) {
      console.warn(`Skeleton template not found for type: ${type}`);
      return null;
    }
    
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-container';
    skeleton.innerHTML = template;
    
    if (container) {
      container.appendChild(skeleton);
    }
    
    return skeleton;
  }

  showLoadingForDuration(element, type, duration) {
    this.showLoading(element, type, { duration });
  }

  isLoading(element) {
    return this.activeLoaders.has(element);
  }

  getLoadingInfo(element) {
    return this.activeLoaders.get(element);
  }

  // Cleanup
  destroy() {
    // Remove all loading states
    this.activeLoaders.forEach((loader, element) => {
      this.hideLoading(element);
    });
    
    // Remove global elements
    const overlay = document.getElementById('loading-overlay');
    const spinner = document.getElementById('global-spinner');
    const progressBar = document.getElementById('global-progress');
    
    if (overlay) overlay.remove();
    if (spinner) spinner.remove();
    if (progressBar) progressBar.remove();
    
    // Clear caches
    this.skeletonTemplates.clear();
    this.activeLoaders.clear();
    
    // Remove global methods
    delete window.pokerLoading;
  }
}

// Create global instance
window.pokerLoadingStates = new PokerLoadingStates({
  enableSkeletons: true,
  enableSpinners: true,
  enableProgressBars: true,
  enableShimmer: true,
  defaultDuration: 2000,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerLoadingStates;
}
