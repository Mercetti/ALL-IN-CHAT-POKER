/**
 * Error Boundary for Main Website Components
 * Catches JavaScript errors and provides fallback UI with retry functionality
 */

class WebsiteErrorBoundary {
  constructor(options = {}) {
    this.fallbackComponent = options.fallbackComponent || this.createDefaultFallback();
    this.onError = options.onError || this.defaultErrorHandler;
    this.onRetry = options.onRetry || this.defaultRetryHandler;
    this.maxRetries = options.maxRetries || 3;
    this.retryCount = 0;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'JavaScript Error');
      event.preventDefault();
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
      event.preventDefault();
    });

    this.isInitialized = true;
  }

  handleError(error, errorType = 'Unknown Error') {
    const errorInfo = {
      error: error || new Error('Unknown error occurred'),
      errorType,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.retryCount
    };

    // Log error
    console.error('Website Error Boundary caught:', errorInfo);
    
    // Call custom error handler
    this.onError(errorInfo);

    // Show fallback UI
    this.showFallbackUI(errorInfo);
  }

  createDefaultFallback() {
    const fallback = document.createElement('div');
    fallback.className = 'error-boundary-fallback';
    fallback.innerHTML = `
      <div class="error-boundary-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-message">We encountered an unexpected error. The page has been refreshed to restore functionality.</p>
        <div class="error-actions">
          <button class="error-retry-btn" onclick="window.location.reload()">
            🔄 Reload Page
          </button>
          <button class="error-report-btn" onclick="window.errorBoundary.reportError()">
            📝 Report Issue
          </button>
        </div>
        <details class="error-details">
          <summary>Technical Details</summary>
          <pre id="error-details-content"></pre>
        </details>
      </div>
    `;
    return fallback;
  }

  showFallbackUI(errorInfo) {
    // Remove existing fallback if present
    const existing = document.querySelector('.error-boundary-fallback');
    if (existing) existing.remove();

    // Clone fallback element
    const fallback = this.fallbackComponent.cloneNode(true);
    
    // Update error details
    const detailsContent = fallback.querySelector('#error-details-content');
    if (detailsContent) {
      detailsContent.textContent = JSON.stringify(errorInfo, null, 2);
    }

    // Show fallback
    document.body.appendChild(fallback);
    
    // Add animation
    requestAnimationFrame(() => {
      fallback.classList.add('error-boundary-fallback--visible');
    });
  }

  hideFallbackUI() {
    const fallback = document.querySelector('.error-boundary-fallback');
    if (fallback) {
      fallback.classList.remove('error-boundary-fallback--visible');
      setTimeout(() => fallback.remove(), 300);
    }
  }

  retry() {
    if (this.retryCount >= this.maxRetries) {
      console.warn('Max retries reached');
      return;
    }

    this.retryCount++;
    this.hideFallbackUI();
    this.onRetry(this.retryCount);
  }

  reportError() {
    const errorDetails = document.querySelector('#error-details-content')?.textContent;
    if (errorDetails) {
      // Create mailto link with error details
      const subject = encodeURIComponent('Poker Game Error Report');
      const body = encodeURIComponent(`Error Details:\n\n${errorDetails}\n\nPlease describe what you were doing when this error occurred:`);
      window.open(`mailto:support@allinchatpoker.com?subject=${subject}&body=${body}`);
    }
  }

  defaultErrorHandler(errorInfo) {
    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.group('🚨 Website Error Boundary');
      console.error('Error:', errorInfo.error);
      console.error('Type:', errorInfo.errorType);
      console.error('URL:', errorInfo.url);
      console.error('Timestamp:', errorInfo.timestamp);
      console.groupEnd();
    }

    // In production, you could send to error tracking service
    // this.sendToErrorService(errorInfo);
  }

  defaultRetryHandler(retryCount) {
    console.log(`Retrying... Attempt ${retryCount} of ${this.maxRetries}`);
    
    // Simple retry - reload page
    if (retryCount === 1) {
      window.location.reload();
    }
  }

  // Component-specific error boundaries
  wrapComponent(element, componentName) {
    if (!element) return;

    const originalHTML = element.outerHTML;
    let hasError = false;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (hasError) return;
        
        // Check for error attributes or classes
        if (element.hasAttribute('data-error') || element.classList.contains('error')) {
          hasError = true;
          this.handleError(
            new Error(`Component error in ${componentName}`),
            `Component Error: ${componentName}`
          );
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-error', 'class'],
      childList: true,
      subtree: true
    });

    return observer;
  }
}

// Create global instance
window.errorBoundary = new WebsiteErrorBoundary({
  maxRetries: 3,
  onError: (errorInfo) => {
    // Custom error handling logic
    if (window.Toast) {
      Toast.error('An error occurred. The page will refresh automatically.');
    }
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.errorBoundary.init());
} else {
  window.errorBoundary.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsiteErrorBoundary;
}
