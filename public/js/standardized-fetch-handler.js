/**
 * Standardized Fetch Error Handling
 * Provides consistent error handling for all API requests
 */

class StandardizedFetchHandler {
  constructor(options = {}) {
    this.options = {
      defaultTimeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableRetry: true,
      enableTimeout: true,
      debugMode: false,
      ...options
    };
    
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorHandlers = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.setupGlobalFetch();
    this.setupDefaultErrorHandlers();
    this.isInitialized = true;
  }

  setupGlobalFetch() {
    if (!window.originalFetch) {
      window.originalFetch = window.fetch;
    }
    
    window.fetch = async (url, options = {}) => {
      const requestId = this.generateRequestId();
      const startTime = performance.now();
      
      try {
        // Apply request interceptors
        let processedOptions = { ...options };
        for (const interceptor of this.requestInterceptors) {
          processedOptions = await interceptor(url, processedOptions);
        }
        
        // Set default headers
        processedOptions.headers = {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...processedOptions.headers
        };
        
        // Add timeout
        if (this.options.enableTimeout && !processedOptions.signal) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.options.defaultTimeout);
          processedOptions.signal = controller.signal;
          
          // Clear timeout on completion
          const originalAbort = controller.signal.abort;
          controller.signal.abort = () => {
            clearTimeout(timeoutId);
            originalAbort.call(controller.signal);
          };
        }
        
        if (this.options.debugMode) {
          console.log(`[${requestId}] Fetch request:`, { url, options: processedOptions });
        }
        
        // Make request with retry logic
        let response = await this.fetchWithRetry(url, processedOptions, requestId);
        
        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response);
        }
        
        // Handle HTTP errors
        if (!response.ok) {
          throw new FetchError(response.status, response.statusText, response);
        }
        
        const endTime = performance.now();
        
        if (this.options.debugMode) {
          console.log(`[${requestId}] Fetch success:`, {
            status: response.status,
            duration: (endTime - startTime).toFixed(2) + 'ms'
          });
        }
        
        return response;
        
      } catch (error) {
        const endTime = performance.now();
        const errorInfo = {
          requestId,
          url,
          method: options.method || 'GET',
          duration: (endTime - startTime).toFixed(2) + 'ms',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        if (this.options.debugMode) {
          console.error(`[${requestId}] Fetch error:`, errorInfo);
        }
        
        // Handle error based on type
        const handledError = this.handleError(error, errorInfo);
        throw handledError;
      }
    };
  }

  async fetchWithRetry(url, options, requestId, attempt = 1) {
    try {
      return await window.originalFetch(url, options);
    } catch (error) {
      if (!this.options.enableRetry || attempt >= this.options.retryAttempts) {
        throw error;
      }
      
      if (this.options.debugMode) {
        console.log(`[${requestId}] Retry attempt ${attempt}/${this.options.retryAttempts}`);
      }
      
      // Wait before retry
      await this.delay(this.options.retryDelay * attempt);
      
      return this.fetchWithRetry(url, options, requestId, attempt + 1);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleError(error, errorInfo) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      return new FetchError(408, 'Request Timeout', null, errorInfo);
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new FetchError(0, 'Network Error', null, errorInfo);
    }
    
    if (error instanceof FetchError) {
      return error;
    }
    
    // Handle other errors
    return new FetchError(500, 'Internal Error', null, { ...errorInfo, originalError: error });
  }

  setupDefaultErrorHandlers() {
    // Network errors
    this.addErrorHandler(0, (error) => {
      console.error('Network error:', error);
      return {
        message: 'Network connection failed. Please check your internet connection.',
        userFriendly: true,
        retryable: true
      };
    });
    
    // Timeout errors
    this.addErrorHandler(408, (error) => {
      console.error('Request timeout:', error);
      return {
        message: 'Request timed out. Please try again.',
        userFriendly: true,
        retryable: true
      };
    });
    
    // Client errors
    this.addErrorHandler(400, (error) => {
      console.error('Bad request:', error);
      return {
        message: 'Invalid request. Please check your input.',
        userFriendly: true,
        retryable: false
      };
    });
    
    this.addErrorHandler(401, (error) => {
      console.error('Unauthorized:', error);
      return {
        message: 'Authentication required. Please log in.',
        userFriendly: true,
        retryable: false,
        requiresAuth: true
      };
    });
    
    this.addErrorHandler(403, (error) => {
      console.error('Forbidden:', error);
      return {
        message: 'Access denied. You do not have permission to perform this action.',
        userFriendly: true,
        retryable: false
      };
    });
    
    this.addErrorHandler(404, (error) => {
      console.error('Not found:', error);
      return {
        message: 'The requested resource was not found.',
        userFriendly: true,
        retryable: false
      };
    });
    
    // Server errors
    this.addErrorHandler(500, (error) => {
      console.error('Server error:', error);
      return {
        message: 'Server error occurred. Please try again later.',
        userFriendly: true,
        retryable: true
      };
    });
    
    this.addErrorHandler(502, (error) => {
      console.error('Bad gateway:', error);
      return {
        message: 'Service temporarily unavailable. Please try again later.',
        userFriendly: true,
        retryable: true
      };
    });
    
    this.addErrorHandler(503, (error) => {
      console.error('Service unavailable:', error);
      return {
        message: 'Service is temporarily unavailable. Please try again later.',
        userFriendly: true,
        retryable: true
      };
    });
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  
  removeRequestInterceptor(interceptor) {
    const index = this.requestInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.requestInterceptors.splice(index, 1);
    }
  }
  
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }
  
  removeResponseInterceptor(interceptor) {
    const index = this.responseInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.responseInterceptors.splice(index, 1);
    }
  }
  
  addErrorHandler(statusCode, handler) {
    this.errorHandlers.set(statusCode, handler);
  }
  
  removeErrorHandler(statusCode) {
    this.errorHandlers.delete(statusCode);
  }
  
  async get(url, options = {}) {
    return window.fetch(url, { ...options, method: 'GET' });
  }
  
  async post(url, data, options = {}) {
    return window.fetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async put(url, data, options = {}) {
    return window.fetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async patch(url, data, options = {}) {
    return window.fetch(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
  
  async delete(url, options = {}) {
    return window.fetch(url, { ...options, method: 'DELETE' });
  }
  
  async upload(url, formData, options = {}) {
    return window.fetch(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...options.headers,
        // Don't set Content-Type for FormData (browser sets it with boundary)
      }
    });
  }
  
  // Utility methods
  
  async handleResponse(response, options = {}) {
    const { parseJson = true, handleErrors = true } = options;
    
    if (handleErrors && !response.ok) {
      throw new FetchError(response.status, response.statusText, response);
    }
    
    if (parseJson) {
      try {
        return await response.json();
      } catch (error) {
        throw new FetchError(500, 'Invalid JSON response', response);
      }
    }
    
    return response;
  }
  
  async safeRequest(url, options = {}) {
    try {
      const response = await window.fetch(url, options);
      return {
        success: true,
        data: await this.handleResponse(response),
        response
      };
    } catch (error) {
      return {
        success: false,
        error,
        response: error.response
      };
    }
  }
  
  // Batch requests
  async batch(requests, options = {}) {
    const { parallel = true, stopOnFirstError = false } = options;
    
    if (parallel) {
      const promises = requests.map(req => this.safeRequest(req.url, req.options));
      const results = await Promise.all(promises);
      
      if (stopOnFirstError) {
        const firstError = results.find(result => !result.success);
        if (firstError) {
          throw firstError.error;
        }
      }
      
      return results;
    } else {
      const results = [];
      for (const req of requests) {
        const result = await this.safeRequest(req.url, req.options);
        results.push(result);
        
        if (stopOnFirstError && !result.success) {
          throw result.error;
        }
      }
      return results;
    }
  }
  
  // Cleanup
  destroy() {
    if (window.originalFetch) {
      window.fetch = window.originalFetch;
      delete window.originalFetch;
    }
    
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorHandlers.clear();
  }
}

// Custom error class
class FetchError extends Error {
  constructor(status, message, response = null, metadata = {}) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.response = response;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }
}

// Create global instance
window.standardizedFetchHandler = new StandardizedFetchHandler({
  defaultTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableRetry: true,
  enableTimeout: true,
  debugMode: false
});

// Global convenience methods
window.safeFetch = (url, options) => window.standardizedFetchHandler.safeRequest(url, options);
window.safeGet = (url, options) => window.standardizedFetchHandler.get(url, options);
window.safePost = (url, data, options) => window.standardizedFetchHandler.post(url, data, options);
window.safePut = (url, data, options) => window.standardizedFetchHandler.put(url, data, options);
window.safeDelete = (url, options) => window.standardizedFetchHandler.delete(url, options);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StandardizedFetchHandler, FetchError };
}
