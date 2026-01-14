/**
 * Loading Skeletons for Main Website
 * Provides skeleton loading states for better UX during content loading
 */

class WebsiteLoadingSkeletons {
  constructor(options = {}) {
    this.options = {
      enableAnimations: true,
      enableShimmer: true,
      enableProgressiveLoading: true,
      enableLazySkeletons: true,
      animationDuration: 1500,
      shimmerColor: '#e0e0e0',
      baseColor: '#f5f5f5',
      highlightColor: '#ffffff',
      ...options
    };
    
    this.isInitialized = false;
    this.skeletons = new Map();
    this.activeSkeletons = new Set();
    this.observer = null;
    this.animationFrame = null;
    
    this.init();
  }

  init() {
    // Setup CSS styles
    this.setupStyles();
    
    // Setup intersection observer for lazy skeletons
    if (this.options.enableLazySkeletons && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }
    
    // Setup progressive loading
    if (this.options.enableProgressiveLoading) {
      this.setupProgressiveLoading();
    }
    
    // Setup global skeleton methods
    this.setupGlobalMethods();
    
    this.isInitialized = true;
  }

  setupStyles() {
    const styleId = 'website-loading-skeletons-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Base Skeleton Styles */
      .skeleton {
        background: linear-gradient(90deg, ${this.options.baseColor} 0%, ${this.options.highlightColor} 50%, ${this.options.baseColor} 100%);
        background-size: 200% 100%;
        border-radius: 4px;
        display: inline-block;
        position: relative;
        overflow: hidden;
      }
      
      .skeleton::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, ${this.options.shimmerColor} 50%, transparent 100%);
        background-size: 200% 100%;
        animation: shimmer ${this.options.animationDuration}ms infinite;
        z-index: 1;
      }
      
      .skeleton::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: inherit;
        z-index: 2;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      /* Skeleton Variants */
      .skeleton-text {
        height: 1em;
        margin: 0.5em 0;
        border-radius: 4px;
      }
      
      .skeleton-text.small {
        height: 0.8em;
        width: 60%;
      }
      
      .skeleton-text.medium {
        height: 1em;
        width: 80%;
      }
      
      .skeleton-text.large {
        height: 1.2em;
        width: 100%;
      }
      
      .skeleton-title {
        height: 1.5em;
        width: 70%;
        margin: 1em 0;
        border-radius: 6px;
      }
      
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: inline-block;
      }
      
      .skeleton-avatar.large {
        width: 60px;
        height: 60px;
      }
      
      .skeleton-avatar.small {
        width: 30px;
        height: 30px;
      }
      
      .skeleton-button {
        height: 36px;
        width: 100px;
        border-radius: 6px;
        margin: 0.5em;
      }
      
      .skeleton-card {
        height: 200px;
        border-radius: 8px;
        margin: 1em 0;
      }
      
      .skeleton-image {
        height: 150px;
        border-radius: 8px;
        margin: 1em 0;
      }
      
      .skeleton-image.square {
        width: 150px;
        height: 150px;
      }
      
      .skeleton-image.rectangle {
        width: 100%;
        height: 200px;
      }
      
      .skeleton-input {
        height: 40px;
        border-radius: 4px;
        margin: 0.5em 0;
      }
      
      .skeleton-badge {
        height: 24px;
        width: 60px;
        border-radius: 12px;
        display: inline-block;
        margin: 0.25em;
      }
      
      .skeleton-progress {
        height: 8px;
        border-radius: 4px;
        margin: 1em 0;
      }
      
      .skeleton-table {
        height: 300px;
        border-radius: 8px;
        margin: 1em 0;
      }
      
      .skeleton-list {
        height: 250px;
        border-radius: 8px;
        margin: 1em 0;
      }
      
      /* Skeleton Container */
      .skeleton-container {
        padding: 1em;
        border-radius: 8px;
        background: ${this.options.baseColor};
      }
      
      /* Skeleton Group */
      .skeleton-group {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        padding: 1em;
        border-radius: 8px;
        background: ${this.options.baseColor};
      }
      
      .skeleton-group.horizontal {
        flex-direction: row;
        align-items: center;
        gap: 1em;
      }
      
      /* Skeleton Grid */
      .skeleton-grid {
        display: grid;
        gap: 1em;
        padding: 1em;
      }
      
      .skeleton-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
      .skeleton-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
      .skeleton-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
      
      /* Loading States */
      .skeleton-loading {
        opacity: 0.7;
        pointer-events: none;
      }
      
      .skeleton-fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }
      
      .skeleton-fade-out {
        animation: fadeOut 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      /* Responsive Skeletons */
      @media (max-width: 768px) {
        .skeleton-grid.cols-3,
        .skeleton-grid.cols-4 {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 480px) {
        .skeleton-grid.cols-2,
        .skeleton-grid.cols-3,
        .skeleton-grid.cols-4 {
          grid-template-columns: 1fr;
        }
      }
      
      /* Dark Theme Support */
      @media (prefers-color-scheme: dark) {
        .skeleton {
          background: linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%);
        }
        
        .skeleton::before {
          background: linear-gradient(90deg, transparent 0%, #4a4a4a 50%, transparent 100%);
        }
        
        .skeleton-container,
        .skeleton-group {
          background: #2a2a2a;
        }
      }
      
      /* Accessibility */
      .skeleton[aria-hidden="true"] {
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
      
      /* Screen Reader Only */
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
      
      /* Loading Spinner */
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Pulse Animation */
      .skeleton-pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    
    document.head.appendChild(style);
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const skeleton = entry.target;
          this.showSkeleton(skeleton);
          this.observer.unobserve(skeleton);
        }
      });
    }, {
      rootMargin: '50px'
    });
  }

  setupProgressiveLoading() {
    // Progressive loading for skeleton groups
    document.addEventListener('DOMContentLoaded', () => {
      const groups = document.querySelectorAll('.skeleton-group');
      groups.forEach((group, index) => {
        setTimeout(() => {
          group.classList.add('skeleton-fade-in');
        }, index * 100);
      });
    });
  }

  setupGlobalMethods() {
    // Global skeleton API
    window.websiteSkeletons = {
      show: (selector, options) => this.showSkeleton(selector, options),
      hide: (selector) => this.hideSkeleton(selector),
      create: (type, options) => this.createSkeleton(type, options),
      replace: (selector, content) => this.replaceWithContent(selector, content),
      preload: (selector) => this.preloadSkeleton(selector),
      destroy: (selector) => this.destroySkeleton(selector)
    };
  }

  // Skeleton Creation Methods
  createSkeleton(type, options = {}) {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-${type}`;
    
    // Add custom classes
    if (options.className) {
      skeleton.className += ` ${options.className}`;
    }
    
    // Add attributes
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        skeleton.setAttribute(key, value);
      });
    }
    
    // Add content based on type
    switch (type) {
      case 'text':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '1em';
        break;
        
      case 'title':
        skeleton.style.width = options.width || '70%';
        skeleton.style.height = options.height || '1.5em';
        break;
        
      case 'avatar':
        skeleton.style.width = options.size || '40px';
        skeleton.style.height = options.size || '40px';
        break;
        
      case 'button':
        skeleton.style.width = options.width || '100px';
        skeleton.style.height = options.height || '36px';
        break;
        
      case 'card':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '200px';
        break;
        
      case 'image':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '150px';
        break;
        
      case 'input':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '40px';
        break;
        
      case 'badge':
        skeleton.style.width = options.width || '60px';
        skeleton.style.height = options.height || '24px';
        break;
        
      case 'progress':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '8px';
        break;
        
      case 'table':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '300px';
        break;
        
      case 'list':
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '250px';
        break;
    }
    
    // Store skeleton reference
    const id = this.generateSkeletonId();
    skeleton.id = id;
    this.skeletons.set(id, skeleton);
    
    return skeleton;
  }

  createSkeletonGroup(items, options = {}) {
    const group = document.createElement('div');
    group.className = `skeleton-group ${options.horizontal ? 'horizontal' : 'vertical'}`;
    
    items.forEach(item => {
      const skeleton = this.createSkeleton(item.type, item.options);
      group.appendChild(skeleton);
    });
    
    return group;
  }

  createSkeletonGrid(cols, rows, skeletonType, options = {}) {
    const grid = document.createElement('div');
    grid.className = `skeleton-grid cols-${cols}`;
    
    for (let i = 0; i < cols * rows; i++) {
      const skeleton = this.createSkeleton(skeletonType, options);
      grid.appendChild(skeleton);
    }
    
    return grid;
  }

  // Skeleton Display Methods
  showSkeleton(selector, options = {}) {
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];
    
    elements.forEach(element => {
      if (this.activeSkeletons.has(element)) {
        return; // Already showing skeleton
      }
      
      // Store original content
      const originalContent = element.innerHTML;
      element.dataset.originalContent = originalContent;
      
      // Create skeleton based on element type
      const skeleton = this.createSkeletonForElement(element, options);
      
      // Clear and add skeleton
      element.innerHTML = '';
      element.appendChild(skeleton);
      element.classList.add('skeleton-loading');
      
      // Add to active skeletons
      this.activeSkeletons.add(element);
      
      // Add fade-in animation
      if (this.options.enableAnimations) {
        skeleton.classList.add('skeleton-fade-in');
      }
      
      // Auto-hide after timeout
      if (options.timeout) {
        setTimeout(() => {
          this.hideSkeleton(element);
        }, options.timeout);
      }
    });
  }

  hideSkeleton(selector) {
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];
    
    elements.forEach(element => {
      if (!this.activeSkeletons.has(element)) {
        return; // No skeleton to hide
      }
      
      // Add fade-out animation
      if (this.options.enableAnimations) {
        element.classList.add('skeleton-fade-out');
        
        setTimeout(() => {
          this.restoreOriginalContent(element);
        }, 300);
      } else {
        this.restoreOriginalContent(element);
      }
      
      // Remove from active skeletons
      this.activeSkeletons.delete(element);
    });
  }

  restoreOriginalContent(element) {
    const originalContent = element.dataset.originalContent;
    if (originalContent) {
      element.innerHTML = originalContent;
      delete element.dataset.originalContent;
    }
    element.classList.remove('skeleton-loading', 'skeleton-fade-out');
  }

  replaceWithContent(selector, content) {
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];
    
    elements.forEach(element => {
      if (this.activeSkeletons.has(element)) {
        // Add fade-out animation
        if (this.options.enableAnimations) {
          element.classList.add('skeleton-fade-out');
          
          setTimeout(() => {
            element.innerHTML = content;
            element.classList.remove('skeleton-loading', 'skeleton-fade-out');
            element.classList.add('skeleton-fade-in');
          }, 300);
        } else {
          element.innerHTML = content;
          element.classList.remove('skeleton-loading');
        }
        
        this.activeSkeletons.delete(element);
      }
    });
  }

  preloadSkeleton(selector) {
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];
    
    elements.forEach(element => {
      if (this.options.enableLazySkeletons && this.observer) {
        this.observer.observe(element);
      } else {
        this.showSkeleton(element);
      }
    });
  }

  destroySkeleton(selector) {
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];
    
    elements.forEach(element => {
      this.hideSkeleton(element);
      
      // Remove from observer
      if (this.observer) {
        this.observer.unobserve(element);
      }
    });
  }

  createSkeletonForElement(element, options = {}) {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    
    // Determine skeleton type based on element
    let skeletonType = 'text';
    
    if (tagName === 'img') {
      skeletonType = 'image';
    } else if (tagName === 'button') {
      skeletonType = 'button';
    } else if (tagName === 'input') {
      skeletonType = 'input';
    } else if (className.includes('avatar')) {
      skeletonType = 'avatar';
    } else if (className.includes('title') || className.includes('heading')) {
      skeletonType = 'title';
    } else if (className.includes('card')) {
      skeletonType = 'card';
    } else if (className.includes('badge')) {
      skeletonType = 'badge';
    } else if (className.includes('progress')) {
      skeletonType = 'progress';
    } else if (className.includes('table')) {
      skeletonType = 'table';
    } else if (className.includes('list')) {
      skeletonType = 'list';
    }
    
    // Create skeleton with element dimensions
    const computedStyle = window.getComputedStyle(element);
    const skeleton = this.createSkeleton(skeletonType, {
      width: computedStyle.width,
      height: computedStyle.height,
      className: options.className
    });
    
    return skeleton;
  }

  // Utility Methods
  generateSkeletonId() {
    return `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveSkeletons() {
    return Array.from(this.activeSkeletons);
  }

  getActiveSkeletonCount() {
    return this.activeSkeletons.size;
  }

  hideAllSkeletons() {
    this.activeSkeletons.forEach(element => {
      this.hideSkeleton(element);
    });
  }

  // Preset Skeleton Templates
  createCardSkeleton() {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton skeleton-image" style="height: 120px;"></div>
      <div class="skeleton skeleton-title" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 100%;"></div>
      <div class="skeleton skeleton-text" style="width: 90%;"></div>
      <div class="skeleton skeleton-button" style="width: 80px;"></div>
    `;
    return card;
  }

  createProfileSkeleton() {
    const profile = document.createElement('div');
    profile.className = 'skeleton-group horizontal';
    profile.innerHTML = `
      <div class="skeleton skeleton-avatar large"></div>
      <div style="flex: 1;">
        <div class="skeleton skeleton-title" style="width: 60%;"></div>
        <div class="skeleton skeleton-text small" style="width: 40%;"></div>
        <div class="skeleton skeleton-text medium" style="width: 80%;"></div>
      </div>
    `;
    return profile;
  }

  createTableSkeleton() {
    const table = document.createElement('div');
    table.className = 'skeleton-table';
    table.innerHTML = `
      <div class="skeleton skeleton-title" style="width: 30%;"></div>
      <div style="display: flex; gap: 1em; margin: 1em 0;">
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
      </div>
      <div style="display: flex; gap: 1em; margin: 1em 0;">
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
      </div>
      <div style="display: flex; gap: 1em; margin: 1em 0;">
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
        <div class="skeleton skeleton-text" style="flex: 1;"></div>
      </div>
    `;
    return table;
  }

  createListSkeleton(items = 5) {
    const list = document.createElement('div');
    list.className = 'skeleton-list';
    
    for (let i = 0; i < items; i++) {
      const item = document.createElement('div');
      item.className = 'skeleton-group horizontal';
      item.style.marginBottom = '1em';
      item.innerHTML = `
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex: 1;">
          <div class="skeleton skeleton-text medium" style="width: 70%;"></div>
          <div class="skeleton skeleton-text small" style="width: 50%;"></div>
        </div>
      `;
      list.appendChild(item);
    }
    
    return list;
  }

  createFormSkeleton() {
    const form = document.createElement('div');
    form.className = 'skeleton-group';
    form.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-input"></div>
      <div class="skeleton skeleton-input"></div>
      <div class="skeleton skeleton-text small" style="width: 60%;"></div>
      <div class="skeleton skeleton-button" style="width: 120px;"></div>
    `;
    return form;
  }

  createDashboardSkeleton() {
    const dashboard = document.createElement('div');
    dashboard.className = 'skeleton-grid cols-3';
    dashboard.innerHTML = `
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-table" style="grid-column: 1 / -1;"></div>
    `;
    return dashboard;
  }

  // Auto-initialize common elements
  autoInitializeSkeletons() {
    // Auto-add skeletons to common loading patterns
    const patterns = [
      { selector: '.loading-card', template: 'createCardSkeleton' },
      { selector: '.loading-profile', template: 'createProfileSkeleton' },
      { selector: '.loading-table', template: 'createTableSkeleton' },
      { selector: '.loading-list', template: 'createListSkeleton' },
      { selector: '.loading-form', template: 'createFormSkeleton' },
      { selector: '.loading-dashboard', template: 'createDashboardSkeleton' }
    ];
    
    patterns.forEach(pattern => {
      const elements = document.querySelectorAll(pattern.selector);
      elements.forEach(element => {
        if (element.children.length === 0) {
          const skeleton = this[pattern.template]();
          element.appendChild(skeleton);
        }
      });
    });
  }

  // Cleanup
  destroy() {
    // Hide all active skeletons
    this.hideAllSkeletons();
    
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clear all references
    this.skeletons.clear();
    this.activeSkeletons.clear();
    
    // Remove styles
    const style = document.getElementById('website-loading-skeletons-styles');
    if (style) {
      style.remove();
    }
    
    // Remove global methods
    delete window.websiteSkeletons;
  }
}

// Create global instance
window.websiteLoadingSkeletons = new WebsiteLoadingSkeletons({
  enableAnimations: true,
  enableShimmer: true,
  enableProgressiveLoading: true,
  enableLazySkeletons: true,
  animationDuration: 1500,
  shimmerColor: '#e0e0e0',
  baseColor: '#f5f5f5',
  highlightColor: '#ffffff'
});

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.websiteLoadingSkeletons.autoInitializeSkeletons();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsiteLoadingSkeletons;
}
