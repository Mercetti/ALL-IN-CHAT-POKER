/**
 * System Context
 * Provides global state management for Acey Control Center
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useError } from './ErrorContext';
import AceyAPIService from '../services/AceyAPIService';

// Types
interface SystemState {
  status: 'online' | 'offline' | 'error';
  metrics: {
    cpu: number;
    memory: number;
    tokens: number;
    uptime: number;
  };
  mode: 'live' | 'build' | 'safe' | 'offline';
  logs: Array<{
    time: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
  }>;
  loading: boolean;
  error: string | null;
}

type SystemAction =
  | { type: 'SET_STATUS'; payload: SystemState['status'] }
  | { type: 'SET_METRICS'; payload: SystemState['metrics'] }
  | { type: 'SET_MODE'; payload: SystemState['mode'] }
  | { type: 'ADD_LOGS'; payload: SystemState['logs'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: SystemState = {
  status: 'offline',
  metrics: {
    cpu: 0,
    memory: 0,
    tokens: 0,
    uptime: 0,
  },
  mode: 'offline',
  logs: [],
  loading: false,
  error: null,
};

// Reducer
function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'ADD_LOGS':
      return { ...state, logs: [...action.payload, ...state.logs].slice(0, 100) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Context
const SystemContext = createContext<{
  state: SystemState;
  dispatch: React.Dispatch<SystemAction>;
  actions: {
    refreshStatus: () => Promise<void>;
    refreshMetrics: () => Promise<void>;
    refreshLogs: () => Promise<void>;
    setMode: (mode: SystemState['mode']) => Promise<void>;
    startSystem: () => Promise<void>;
    stopSystem: () => Promise<void>;
    restartSystem: () => Promise<void>;
    emergencyStop: () => Promise<void>;
  };
} | null>(null);

// Provider
export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(systemReducer, initialState);
  const { actions: errorActions } = useError();
  const api = useAceyAPI();

  // Actions
  const actions = {
    refreshStatus: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const status = await api.getSystemStatus();
        dispatch({ type: 'SET_STATUS', payload: status.status === 'ok' ? 'online' : 'error' });

        if (status.status !== 'ok') {
          dispatch({ type: 'SET_ERROR', payload: status.message });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to backend' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    refreshMetrics: async () => {
      try {
        const metrics = await api.getSystemMetrics();
        dispatch({ type: 'SET_METRICS', payload: metrics });
      } catch (error) {
        errorActions.addError('api', 'Failed to refresh metrics');
      }
    },

    refreshLogs: async () => {
      try {
        const logs = await api.getSystemLogs();
        dispatch({ type: 'ADD_LOGS', payload: logs });
      } catch (error) {
        errorActions.addError('api', 'Failed to refresh logs');
      }
    },

    setMode: async (mode: SystemState['mode']) => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const result = await api.setOperatingMode(mode);
        if (result.success) {
          dispatch({ type: 'SET_MODE', payload: mode });
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to set operating mode' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to set operating mode' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    startSystem: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const result = await api.startSystem();
        if (result.success) {
          dispatch({ type: 'SET_STATUS', payload: 'online' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to start system' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to start system' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    stopSystem: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const result = await api.stopSystem();
        if (result.success) {
          dispatch({ type: 'SET_STATUS', payload: 'offline' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to stop system' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to stop system' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    restartSystem: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const result = await api.restartSystem();
        if (result.success) {
          dispatch({ type: 'SET_STATUS', payload: 'online' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to restart system' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to restart system' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    emergencyStop: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const result = await api.emergencyStop();
        if (result.success) {
          dispatch({ type: 'SET_STATUS', payload: 'offline' });
          dispatch({ type: 'SET_MODE', payload: 'safe' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to emergency stop system' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to emergency stop system' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
  };

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.status === 'online') {
        actions.refreshMetrics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.status, actions.refreshMetrics]);

  // Initial data load
  useEffect(() => {
    actions.refreshStatus();
    actions.refreshMetrics();
    actions.refreshLogs();
  }, [actions]);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

// Hook
export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
