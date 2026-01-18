/**
 * NetInfo Configuration
 * Suppresses reachability check errors
 */

export const configureNetInfo = () => {
  try {
    // Suppress reachability check errors in development
    if (typeof console !== 'undefined') {
      const originalError = console.error;
      console.error = function(...args) {
        // Filter out reachability errors
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('net::ERR_CONNECTION_REFUSED') ||
             message.includes('localhost:8081') ||
             message.includes('localhost:8082'))) {
          return; // Suppress these errors
        }
        return originalError.apply(console, args);
      };
    }
  } catch (error) {
    // Silently ignore configuration errors
  }
};

export default configureNetInfo;
