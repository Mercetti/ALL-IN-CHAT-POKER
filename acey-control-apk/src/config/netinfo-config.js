/**
 * NetInfo Configuration
 * Filters out reachability check errors from console
 */

export const configureNetInfo = () => {
  try {
    // Wait for the page to load, then filter console errors
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.console) {
        const originalError = window.console.error;
        window.console.error = function(...args) {
          // Filter out reachability errors
          const message = args[0];
          if (typeof message === 'string' && 
              (message.includes('net::ERR_CONNECTION_REFUSED') ||
               message.includes('localhost:8081') ||
               message.includes('localhost:8082') ||
               message.includes('HEAD http://localhost'))) {
            return; // Suppress these errors
          }
          return originalError.apply(window.console, args);
        };
      }
    }, 1000); // Delay to ensure NetInfo has loaded
  } catch (error) {
    // Silently ignore configuration errors
  }
};

export default configureNetInfo;
