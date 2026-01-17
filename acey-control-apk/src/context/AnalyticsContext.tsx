/**
 * Analytics Context
 * Provides analytics data management and chart visualization
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSystem } from './SystemContext';
import { useAdvancedControls } from './AdvancedControlsContext';

// Types
interface AnalyticsState {
  metrics: {
    cpu: Array<{ timestamp: string; value: number }>;
    memory: Array<{ timestamp: string; value: number }>;
    tokens: Array<{ timestamp: string; value: number }>;
    requests: Array<{ timestamp: string; count: number }>;
  };
  performance: {
    responseTime: Array<{ timestamp: string; value: number }>;
    errorRate: Array<{ timestamp: string; value: number }>;
    uptime: Array<{ timestamp: string; value: number }>;
  };
  usage: {
    modeChanges: Array<{ timestamp: string; from: string; to: string; reason: string }>;
    controlActions: Array<{ timestamp: string; action: string; success: boolean }>;
    errors: Array<{ timestamp: string; type: string; message: string }>;
  };
  charts: {
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
    selectedMetric: 'cpu' | 'memory' | 'tokens' | 'requests' | 'errors' | 'uptime' | 'responseTime';
    autoRefresh: boolean;
    refreshInterval: number;
  };
  loading: boolean;
  error: string | null;
}

type AnalyticsAction =
  | { type: 'SET_METRICS'; payload: AnalyticsState['metrics'] }
  | { type: 'SET_PERFORMANCE'; payload: AnalyticsState['performance'] }
  | { type: 'SET_USAGE'; payload: AnalyticsState['usage'] }
  | { type: 'SET_CHART_SETTINGS'; payload: Partial<AnalyticsState['charts']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_METRIC_DATA'; payload: { type: keyof AnalyticsState['metrics']; data: any } }
  | { type: 'ADD_PERFORMANCE_DATA'; payload: { type: keyof AnalyticsState['performance']; data: any } }
  | { type: 'ADD_USAGE_DATA'; payload: { type: keyof AnalyticsState['usage']; data: any } }
  | { type: 'ADD_ERROR_DATA'; payload: AnalyticsState['usage']['errors'][0] };

// Initial state
const initialState: AnalyticsState = {
  metrics: {
    cpu: [],
    memory: [],
    tokens: [],
    requests: [],
  },
  performance: {
    responseTime: [],
    errorRate: [],
    uptime: [],
  },
  usage: {
    modeChanges: [],
    controlActions: [],
    errors: [],
  },
  charts: {
    timeRange: '24h',
    selectedMetric: 'cpu',
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  },
  loading: false,
  error: null,
};

// Reducer
function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'SET_METRICS':
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload }
      };
    
    case 'SET_PERFORMANCE':
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };
    
    case 'SET_USAGE':
      return {
        ...state,
        usage: { ...state.usage, ...action.payload }
      };
    
    case 'SET_CHART_SETTINGS':
      return {
        ...state,
        charts: { ...state.charts, ...action.payload }
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_METRIC_DATA':
      return {
        ...state,
        metrics: {
          ...state.metrics,
          [action.payload.type]: [
            ...state.metrics[action.payload.type].slice(-99),
            {
              timestamp: new Date().toISOString(),
              value: action.payload.data
            }
          ]
        }
      };
    
    case 'ADD_PERFORMANCE_DATA':
      return {
        ...state,
        performance: {
          ...state.performance,
          [action.payload.type]: [
            ...state.performance[action.payload.type].slice(-99),
            {
              timestamp: new Date().toISOString(),
              value: action.payload.data
            }
          ]
        }
      };
    
    case 'ADD_USAGE_DATA':
      if (action.payload.type === 'modeChanges') {
        return {
          ...state,
          usage: {
            ...state.usage,
            modeChanges: [
              ...state.usage.modeChanges.slice(-99),
              action.payload.data
            ]
          }
        };
      } else if (action.payload.type === 'controlActions') {
        return {
          ...state,
          usage: {
            ...state.usage,
            controlActions: [
              ...state.usage.controlActions.slice(-99),
              action.payload.data
            ]
          }
        };
      } else if (action.payload.type === 'errors') {
        return {
          ...state,
          usage: {
            ...state.usage,
            errors: [
              ...state.usage.errors.slice(-99),
              action.payload.data
            ]
          }
        };
      }
      return state;
    
    case 'ADD_ERROR_DATA':
      return {
        ...state,
        usage: {
          ...state.usage,
          errors: [
            ...state.usage.errors.slice(-99),
            action.payload.data
          ]
        }
      };
    
    default:
      return state;
  }
}

// Context
const AnalyticsContext = createContext<{
  state: AnalyticsState;
  dispatch: React.Dispatch<AnalyticsAction>;
  actions: {
    // Data Collection
    collectMetrics: () => void;
    collectPerformanceData: () => void;
    collectUsageData: () => void;
    
    // Chart Management
    setTimeRange: (range: AnalyticsState['charts']['timeRange']) => void;
    setSelectedMetric: (metric: AnalyticsState['charts']['selectedMetric']) => void;
    toggleAutoRefresh: () => void;
    setRefreshInterval: (interval: number) => void;
    
    // Data Analysis
    getChartData: (metric: AnalyticsState['charts']['selectedMetric'], timeRange?: AnalyticsState['charts']['timeRange']) => Array<any>;
    getMetricSummary: (metric: keyof AnalyticsState['metrics']) => { current: number; average: number; min: number; max: number; trend: 'up' | 'down' | 'stable' };
    getPerformanceSummary: () => { avgResponseTime: number; errorRate: number; uptime: number };
    
    // Data Management
    exportData: (format: 'json' | 'csv') => void;
    clearData: () => void;
    
    // Helpers
    isDataAvailable: () => boolean;
    getRefreshStatus: () => AnalyticsState['charts'];
  };
} | null>(null);

// Provider
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);
  const { state: systemState } = useSystem();
  const { actions: advancedActions } = useAdvancedControls();

  // Actions
  const actions = {
    // Data Collection
    collectMetrics: () => {
      const metrics = systemState.metrics;
      dispatch({
        type: 'ADD_METRIC_DATA',
        payload: { type: 'cpu', data: metrics.cpu }
      });
      dispatch({
        type: 'ADD_METRIC_DATA',
        payload: { type: 'memory', data: metrics.memory }
      });
      dispatch({
        type: 'ADD_METRIC_DATA',
        payload: { type: 'tokens', data: metrics.tokens }
      });
      dispatch({
        type: 'ADD_METRIC_DATA',
        payload: { type: 'requests', data: Math.floor(Math.random() * 100) } // Mock requests data
      });
    },

    collectPerformanceData: () => {
      const performance = {
        responseTime: Math.random() * 1000 + 200, // Mock response time
        errorRate: Math.random() * 5, // Mock error rate
        uptime: systemState.metrics.uptime || 0
      };
      
      dispatch({
        type: 'ADD_PERFORMANCE_DATA',
        payload: { type: 'responseTime', data: performance.responseTime }
      });
      dispatch({
        type: 'ADD_PERFORMANCE_DATA',
        payload: { type: 'errorRate', data: performance.errorRate }
      });
      dispatch({
        type: 'ADD_PERFORMANCE_DATA',
        payload: { type: 'uptime', data: performance.uptime }
      });
    },

    collectUsageData: () => {
      // Collect mode changes, control actions, and errors
      // This would be populated by the system context
    },

    // Chart Management
    setTimeRange: (range) => {
      dispatch({
        type: 'SET_CHART_SETTINGS',
        payload: { timeRange: range }
      });
    },

    setSelectedMetric: (metric) => {
      dispatch({
        type: 'SET_CHART_SETTINGS',
        payload: { selectedMetric: metric }
      });
    },

    toggleAutoRefresh: () => {
      dispatch({
        type: 'SET_CHART_SETTINGS',
        payload: { autoRefresh: !state.charts.autoRefresh }
      });
    },

    setRefreshInterval: (interval) => {
      dispatch({
        type: 'SET_CHART_SETTINGS',
        payload: { refreshInterval: interval }
      });
    },

    // Data Analysis
    getChartData: (metric, timeRange = state.charts.timeRange) => {
      const data = state.metrics[metric] || [];
      const now = new Date();
      
      // Filter data based on time range
      const filteredData = data.filter(item => {
        const itemTime = new Date(item.timestamp);
        const rangeMs = {
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
        }[timeRange];
        
        return itemTime >= new Date(now.getTime() - rangeMs);
      });
      
      return filteredData.map(item => ({
        timestamp: item.timestamp,
        value: item.value
      }));
    },

    getMetricSummary: (metric) => {
      const data = state.metrics[metric] || [];
      if (data.length === 0) {
        return { current: 0, average: 0, min: 0, max: 0, trend: 'stable' };
      }
      
      const values = data.map(item => item.value);
      const current = values[values.length - 1] || 0;
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (values.length > 1) {
        const recent = values.slice(-10);
        const older = values.slice(-20, -10);
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.05) {
          trend = 'up';
        } else if (recentAvg < olderAvg * 0.95) {
          trend = 'down';
        }
      }
      
      return { current, average, min, max, trend };
    },

    getPerformanceSummary: () => {
      const responseTime = state.performance.responseTime.slice(-10);
      const errorRate = state.performance.errorRate.slice(-10);
      const uptime = state.performance.uptime.slice(-10);
      
      return {
        avgResponseTime: responseTime.length > 0 
          ? responseTime.reduce((sum, val) => sum + val, 0) / responseTime.length 
          : 0,
        errorRate: errorRate.length > 0 
          ? errorRate.reduce((sum, val) => sum + val, 0) / errorRate.length 
          : 0,
        uptime: uptime.length > 0 
          ? uptime[uptime.length - 1] || 0 
          : 0
      };
    },

    // Data Management
    exportData: (format) => {
      const data = {
        metrics: state.metrics,
        performance: state.performance,
        usage: state.usage,
        charts: state.charts,
        exportDate: new Date().toISOString()
      };
      
      if (format === 'json') {
        console.log('Exporting analytics data as JSON:', JSON.stringify(data, null, 2));
      } else if (format === 'csv') {
        console.log('Exporting analytics data as CSV:', data);
      }
    },

    clearData: () => {
      dispatch({
        type: 'SET_METRICS',
        payload: { cpu: [], memory: [], tokens: [], requests: [] }
      });
      dispatch({
        type: 'SET_PERFORMANCE',
        payload: { responseTime: [], errorRate: [], uptime: [] }
      });
      dispatch({
        type: 'SET_USAGE',
        payload: { modeChanges: [], controlActions: [], errors: [] }
      });
    },

    // Helpers
    isDataAvailable: () => {
      return state.metrics.cpu.length > 0 || 
             state.metrics.memory.length > 0 || 
             state.metrics.tokens.length > 0;
    },

    getRefreshStatus: () => state.charts,
  };

  // Auto-refresh data collection
  useEffect(() => {
    if (!state.charts.autoRefresh) return;
    
    const interval = setInterval(() => {
      actions.collectMetrics();
      actions.collectPerformanceData();
    }, state.charts.refreshInterval);

    return () => clearInterval(interval);
  }, [state.charts.autoRefresh, state.charts.refreshInterval]);

  // Initial data load
  useEffect(() => {
    actions.collectMetrics();
    actions.collectPerformanceData();
  }, []);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

// Hook
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
