/**
 * Advanced Controls Context
 * Provides advanced system controls with mode switching and throttling
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSystem } from './SystemContext';

// Types
interface AdvancedControlsState {
  throttling: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high' | 'off';
    maxRequestsPerMinute: number;
    currentRequests: number;
  };
  modeSwitching: {
    enabled: boolean;
    currentMode: 'live' | 'build' | 'safe' | 'offline';
    transitionInProgress: boolean;
    scheduledTransitions: Array<{
      id: string;
      from: string;
      to: string;
      timestamp: string;
      reason: string;
      delay: number;
    }>;
  };
  resourceLimits: {
    enabled: boolean;
    cpu: {
      max: number;
      warningThreshold: number;
    };
    memory: {
      max: number;
      warningThreshold: number;
    };
    tokens: {
      maxPerMinute: number;
      warningThreshold: number;
    };
  };
  autoOptimization: {
    enabled: boolean;
    aggressiveMode: boolean;
    cleanupInterval: number;
  };
}

type AdvancedControlsAction =
  | { type: 'SET_THROTTLING'; payload: Partial<AdvancedControlsState['throttling']> }
  | { type: 'SET_MODE_SWITCHING'; payload: Partial<AdvancedControlsState['modeSwitching']> }
  | { type: 'SET_RESOURCE_LIMITS'; payload: Partial<AdvancedControlsState['resourceLimits']> }
  | { type: 'SET_AUTO_OPTIMIZATION'; payload: Partial<AdvancedControlsState['autoOptimization']> }
  | { type: 'SET_SCHEDULED_TRANSITION'; payload: AdvancedControlsState['modeSwitching']['scheduledTransitions'][0] }
  | { type: 'EXECUTE_SCHEDULED_TRANSITION'; payload: string };

// Initial state
const initialState: AdvancedControlsState = {
  throttling: {
    enabled: false,
    level: 'off',
    maxRequestsPerMinute: 60,
    currentRequests: 0,
  },
  modeSwitching: {
    enabled: false,
    currentMode: 'offline',
    transitionInProgress: false,
    scheduledTransitions: [],
  },
  resourceLimits: {
    enabled: false,
    cpu: { max: 80, warningThreshold: 70 },
    memory: { max: 512, warningThreshold: 400 },
    tokens: { maxPerMinute: 100, warningThreshold: 80 },
  },
  autoOptimization: {
    enabled: false,
    aggressiveMode: false,
    cleanupInterval: 300000, // 5 minutes
  },
};

// Reducer
function advancedControlsReducer(state: AdvancedControlsState, action: AdvancedControlsAction): AdvancedControlsState {
  switch (action.type) {
    case 'SET_THROTTLING':
      return {
        ...state,
        throttling: { ...state.throttling, ...action.payload }
      };
    
    case 'SET_MODE_SWITCHING':
      return {
        ...state,
        modeSwitching: { ...state.modeSwitching, ...action.payload }
      };
    
    case 'SET_RESOURCE_LIMITS':
      return {
        ...state,
        resourceLimits: { ...state.resourceLimits, ...action.payload }
      };
    
    case 'SET_AUTO_OPTIMIZATION':
      return {
        ...state,
        autoOptimization: { ...state.autoOptimization, ...action.payload }
      };
    
    case 'SET_SCHEDULED_TRANSITION':
      return {
        ...state,
        modeSwitching: {
          ...state.modeSwitching,
          scheduledTransitions: [...state.modeSwitching.scheduledTransitions, action.payload]
        }
      };
    
    case 'EXECUTE_SCHEDULED_TRANSITION':
      const transition = state.modeSwitching.scheduledTransitions.find(t => t.id === action.payload);
      if (transition) {
        return {
          ...state,
          modeSwitching: {
            ...state.modeSwitching,
            currentMode: transition.to as 'live' | 'build' | 'safe' | 'offline',
            transitionInProgress: true,
            scheduledTransitions: state.modeSwitching.scheduledTransitions.filter(t => t.id !== action.payload)
          }
        };
      }
      return state;
    
    default:
      return state;
  }
}

// Context
const AdvancedControlsContext = createContext<{
  state: AdvancedControlsState;
  dispatch: React.Dispatch<AdvancedControlsAction>;
  actions: {
    // Throttling
    enableThrottling: (level: AdvancedControlsState['throttling']['level'], maxRequests?: number) => void;
    disableThrottling: () => void;
    setThrottlingLevel: (level: AdvancedControlsState['throttling']['level']) => void;
    
    // Mode Switching
    enableModeSwitching: () => void;
    disableModeSwitching: () => void;
    setMode: (mode: AdvancedControlsState['modeSwitching']['currentMode']) => void;
    scheduleModeTransition: (from: string, to: string, reason: string, delay?: number) => void;
    executeScheduledTransition: (transitionId: string) => void;
    
    // Resource Limits
    enableResourceLimits: (limits: Partial<AdvancedControlsState['resourceLimits']>) => void;
    disableResourceLimits: () => void;
    setResourceLimits: (limits: Partial<AdvancedControlsState['resourceLimits']>) => void;
    
    // Auto-Optimization
    enableAutoOptimization: (aggressiveMode?: boolean, cleanupInterval?: number) => void;
    disableAutoOptimization: () => void;
    setAutoOptimization: (enabled: boolean, aggressiveMode?: boolean, cleanupInterval?: number) => void;
    
    // System Control
    startSystem: () => Promise<void>;
    stopSystem: () => Promise<void>;
    restartSystem: () => Promise<void>;
    emergencyStop: () => Promise<void>;
    
    // Helpers
    getCurrentThrottlingLevel: () => AdvancedControlsState['throttling']['level'];
    getCurrentMode: () => AdvancedControlsState['modeSwitching']['currentMode'];
    isThrottlingActive: () => boolean;
    isResourceLimitExceeded: (resource: 'cpu' | 'memory' | 'tokens') => boolean;
    getOptimizationStatus: () => AdvancedControlsState['autoOptimization'];
  };
} | null>(null);

// Provider
export function AdvancedControlsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(advancedControlsReducer, initialState);
  const { state: systemState, actions: systemActions } = useSystem();

  // Actions
  const actions = {
    // Throttling
    enableThrottling: (level: AdvancedControlsState['throttling']['level'], maxRequests?: number) => {
      dispatch({
        type: 'SET_THROTTLING',
        payload: {
          enabled: true,
          level,
          maxRequestsPerMinute: maxRequests || 60
        }
      });
    },

    disableThrottling: () => {
      dispatch({
        type: 'SET_THROTTLING',
        payload: { enabled: false, level: 'off' }
      });
    },

    setThrottlingLevel: (level: AdvancedControlsState['throttling']['level']) => {
      dispatch({
        type: 'SET_THROTTLING',
        payload: { level }
      });
    },
    
    // Mode Switching
    enableModeSwitching: () => {
      dispatch({
        type: 'SET_MODE_SWITCHING',
        payload: { enabled: true }
      });
    },

    disableModeSwitching: () => {
      dispatch({
        type: 'SET_MODE_SWITCHING',
        payload: { enabled: false }
      });
    },

    scheduleModeTransition: (from: string, to: string, reason: string, delay: number = 0) => {
      const transition = {
        id: Date.now().toString(),
        from,
        to,
        timestamp: new Date().toISOString(),
        reason,
        delay
      };
      
      dispatch({
        type: 'SET_SCHEDULED_TRANSITION',
        payload: transition
      });
    },

    executeScheduledTransition: async (transitionId: string) => {
      const transition = state.modeSwitching.scheduledTransitions.find(t => t.id === transitionId);
      if (!transition) {
        return false;
      }
      
      dispatch({
        type: 'EXECUTE_SCHEDULED_TRANSITION',
        payload: transition.id
      });
      
      // Execute transition
      if (transition.delay) {
        await new Promise(resolve => setTimeout(resolve, transition.delay));
      }
      
      try {
        const success = await systemActions.setMode(transition.to as 'live' | 'build' | 'safe' | 'offline');
        
        dispatch({
          type: 'SET_MODE_SWITCHING',
          payload: {
            ...state.modeSwitching,
            currentMode: transition.to as 'live' | 'build' | 'safe' | 'offline',
            transitionInProgress: false,
            scheduledTransitions: state.modeSwitching.scheduledTransitions.filter(t => t.id !== transition.id)
          }
        });
        
        return success;
      } catch (error) {
        // Transition failed, keep current mode
        return false;
      }
    },
    
    // Resource Limits
    enableResourceLimits: (limits: Partial<AdvancedControlsState['resourceLimits']>) => {
      dispatch({
        type: 'SET_RESOURCE_LIMITS',
        payload: {
          enabled: true,
          ...limits
        }
      });
    },

    disableResourceLimits: () => {
      dispatch({
        type: 'SET_RESOURCE_LIMITS',
        payload: { enabled: false }
      });
    },

    updateResourceLimit: (resource: 'cpu' | 'memory' | 'tokens', limit: number, threshold?: number) => {
      const resourceConfig = state.resourceLimits[resource];
      if (typeof resourceConfig === 'boolean') return;
      
      dispatch({
        type: 'SET_RESOURCE_LIMITS',
        payload: {
          enabled: state.resourceLimits.enabled,
          [resource]: { 
            ...resourceConfig, 
            max: limit, 
            ...(threshold && { warningThreshold: threshold })
          }
        }
      });
    },
    
    // Auto Optimization
    enableAutoOptimization: (aggressive: boolean = false) => {
      dispatch({
        type: 'SET_AUTO_OPTIMIZATION',
        payload: {
          enabled: true,
          aggressiveMode: aggressive
        }
      });
    },

    disableAutoOptimization: () => {
      dispatch({
        type: 'SET_AUTO_OPTIMIZATION',
        payload: { enabled: false }
      });
    },

    setCleanupInterval: (interval: number) => {
      dispatch({
        type: 'SET_AUTO_OPTIMIZATION',
        payload: { cleanupInterval: interval }
      });
    },
    
    // Mode Switching
    setMode: (mode: AdvancedControlsState['modeSwitching']['currentMode']) => {
      dispatch({
        type: 'SET_MODE_SWITCHING',
        payload: { currentMode: mode }
      });
    },
    
    // Resource Limits
    setResourceLimits: (limits: Partial<AdvancedControlsState['resourceLimits']>) => {
      dispatch({
        type: 'SET_RESOURCE_LIMITS',
        payload: limits
      });
    },
    
    // Auto-Optimization
    setAutoOptimization: (enabled: boolean, aggressiveMode?: boolean, cleanupInterval?: number) => {
      dispatch({
        type: 'SET_AUTO_OPTIMIZATION',
        payload: {
          enabled,
          ...(aggressiveMode !== undefined && { aggressiveMode }),
          ...(cleanupInterval !== undefined && { cleanupInterval })
        }
      });
    },
    
    // System Control
    startSystem: async () => systemActions.startSystem(),
    stopSystem: async () => systemActions.stopSystem(),
    restartSystem: async () => systemActions.restartSystem(),
    emergencyStop: async () => systemActions.emergencyStop(),
    
    // Helpers
    getCurrentThrottlingLevel: () => state.throttling.level,
    getCurrentMode: () => state.modeSwitching.currentMode,
    isThrottlingActive: () => state.throttling.enabled,
    isResourceLimitExceeded: (resource: 'cpu' | 'memory' | 'tokens') => {
      if (!state.resourceLimits.enabled) return false;
      const resourceConfig = state.resourceLimits[resource];
      if (typeof resourceConfig === 'boolean') return false;
      
      // Handle different resource types
      if ('max' in resourceConfig) {
        const limit = resourceConfig.max;
        const current = systemState.metrics[resource] || 0;
        return current > limit;
      } else if ('maxPerMinute' in resourceConfig) {
        const limit = resourceConfig.maxPerMinute;
        const current = systemState.metrics.tokens || 0;
        return current > limit;
      }
      return false;
    },
    getOptimizationStatus: () => state.autoOptimization,
  };

  // Auto-cleanup and optimization
  useEffect(() => {
    if (!state.autoOptimization.enabled) return;
    
    const cleanup = async () => {
      // Memory cleanup
      if (state.resourceLimits.enabled && state.autoOptimization.cleanupInterval > 0) {
        const memoryUsage = systemState.metrics.memory || 0;
        const memoryLimit = state.resourceLimits.memory.max;
        const memoryThreshold = state.resourceLimits.memory.warningThreshold;
        
        if (memoryUsage > memoryThreshold) {
          console.log('High memory usage detected, triggering cleanup');
          // Trigger garbage collection
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      // Performance optimization
      if (state.autoOptimization.aggressiveMode) {
        // Aggressive optimization measures
        console.log('Performing aggressive performance optimization');
      }
    };
    
    const cleanupInterval = setInterval(cleanup, state.autoOptimization.cleanupInterval);
    
    return () => clearInterval(cleanupInterval);
  }, [state.autoOptimization.enabled, state.autoOptimization.cleanupInterval]);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <AdvancedControlsContext.Provider value={value}>{children}</AdvancedControlsContext.Provider>;
}

// Hook
export function useAdvancedControls() {
  const context = useContext(AdvancedControlsContext);
  if (!context) {
    throw new Error('useAdvancedControls must be used within an AdvancedControlsProvider');
  }
  return context;
}
