/**
 * Error Handling Context
 * Provides global error handling and network resilience
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Types
interface ErrorState {
  errors: Array<{
    id: string;
    type: 'network' | 'api' | 'websocket' | 'authentication' | 'unknown';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  networkStatus: {
    isConnected: boolean;
    type: 'wifi' | 'cellular' | 'none' | 'unknown';
    strength: 'weak' | 'medium' | 'strong' | 'unknown';
  };
  retryCount: Map<string, number>;
  isOnline: boolean;
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<ErrorState['errors'][0], 'id'> }
  | { type: 'RESOLVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_NETWORK_STATUS'; payload: ErrorState['networkStatus'] }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'INCREMENT_RETRY'; payload: string };

// Initial state
const initialState: ErrorState = {
  errors: [],
  networkStatus: {
    isConnected: true,
    type: 'unknown',
    strength: 'unknown',
  },
  retryCount: new Map(),
  isOnline: true,
};

// Reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [
          {
            id: Date.now().toString(),
            type: action.payload.type,
            message: action.payload.message,
            timestamp: new Date().toISOString(),
            resolved: false,
          },
          ...state.errors
        ].slice(0, 50) // Keep only last 50 errors
      };
    
    case 'RESOLVE_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload
            ? { ...error, resolved: true }
            : error
        )
      };
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };
    
    case 'SET_NETWORK_STATUS':
      return {
        ...state,
        networkStatus: action.payload
      };
    
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload
      };
    
    case 'INCREMENT_RETRY':
      const currentRetries = state.retryCount.get(action.payload) || 0;
      state.retryCount.set(action.payload, currentRetries + 1);
      return { ...state };
    
    default:
      return state;
  }
}

// Context
const ErrorContext = createContext<{
  state: ErrorState;
  dispatch: React.Dispatch<ErrorAction>;
  actions: {
    addError: (type: ErrorState['errors'][0]['type'], message: string) => void;
    resolveError: (id: string) => void;
    clearErrors: () => void;
    retryOperation: (id: string, operation: () => Promise<any>) => Promise<any>;
    checkNetworkStatus: () => Promise<void>;
    isOnline: () => boolean;
    getRetryCount: (id: string) => number;
  };
} | null>(null);

// Provider
export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Monitor network status
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        const connectionType = netInfo.type;
        const isConnected = netInfo.isConnected ?? false;
        const strength = netInfo.details?.cellularGeneration 
          ? (netInfo.details.cellularGeneration as any).includes('4G') ? 'strong' : 
             (netInfo.details.cellularGeneration as any).includes('3G') ? 'medium' : 'weak'
          : connectionType === 'wifi' ? 'strong' : 'unknown';

        dispatch({
          type: 'SET_NETWORK_STATUS',
          payload: {
            isConnected,
            type: connectionType as any,
            strength
          }
        });
        
        dispatch({
          type: 'SET_ONLINE_STATUS',
          payload: isConnected
        });
      } catch (error) {
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            type: 'network',
            message: 'Failed to check network status',
            timestamp: new Date().toISOString(),
            resolved: false,
          }
        });
      }
    };

    checkNetwork();
    
    // Set up network status listener
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      const connectionType = state.type;
      const strength = state.details?.cellularGeneration 
        ? (state.details.cellularGeneration as any).includes('4G') ? 'strong' : 
           (state.details.cellularGeneration as any).includes('3G') ? 'medium' : 'weak'
        : connectionType === 'wifi' ? 'strong' : 'unknown';

      dispatch({
        type: 'SET_NETWORK_STATUS',
        payload: {
          isConnected,
          type: connectionType as any,
          strength
        }
      });
      
      dispatch({
        type: 'SET_ONLINE_STATUS',
          payload: isConnected
      });
    });

    return () => unsubscribe();
  }, []);

  // Actions
  const actions = {
    addError: (type: ErrorState['errors'][0]['type'], message: string) => {
      dispatch({
        type: 'ADD_ERROR',
        payload: {
          type,
          message,
          timestamp: new Date().toISOString(),
          resolved: false,
        }
      });
    },

    resolveError: (id: string) => {
      dispatch({
        type: 'RESOLVE_ERROR',
        payload: id
      });
    },

    clearErrors: () => {
      dispatch({ type: 'CLEAR_ERRORS' });
    },

    retryOperation: async (id: string, operation: () => Promise<any>) => {
      const retryCount = state.retryCount.get(id) || 0;
      
      // Don't retry more than 3 times
      if (retryCount >= 3) {
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            type: 'api',
            message: `Max retries exceeded for operation: ${id}`,
            timestamp: new Date().toISOString(),
            resolved: false,
          }
        });
        return null;
      }

      dispatch({ type: 'INCREMENT_RETRY', payload: id });
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await operation();
        
        // Clear retry count on success
        const newRetryCount = new Map(state.retryCount);
        newRetryCount.delete(id);
        
        return {
          ...state,
          retryCount: newRetryCount,
        };
      } catch (error) {
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            type: 'api',
            message: `Retry failed for operation: ${id} - ${error.message}`,
            timestamp: new Date().toISOString(),
            resolved: false,
          }
        });
        return null;
      }
    },

    checkNetworkStatus: async () => {
      try {
        const netInfo = await NetInfo.fetch();
        const isConnected = netInfo.isConnected ?? false;
        
        dispatch({
          type: 'SET_ONLINE_STATUS',
          payload: isConnected
        });
        
        return isConnected;
      } catch (error) {
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            type: 'network',
            message: 'Failed to check network status',
            timestamp: new Date().toISOString(),
            resolved: false,
          }
        });
        return false;
      }
    },

    isOnline: () => state.isOnline,

    getRetryCount: (id: string) => state.retryCount.get(id) || 0,
  };

  const value = {
    state,
    dispatch,
    actions,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

// Hook
export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
