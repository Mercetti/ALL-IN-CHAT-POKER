/**
 * Settings Context
 * Provides settings and preferences management
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface SettingsState {
  // General Settings
  general: {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'es' | 'fr' | 'de' | 'ja';
    autoRefresh: boolean;
    refreshInterval: number; // in seconds
    notifications: boolean;
    soundEffects: boolean;
    hapticFeedback: boolean;
  };
  
  // System Settings
  system: {
    apiEndpoint: string;
    timeout: number; // in milliseconds
    retryAttempts: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableAnalytics: boolean;
    crashReporting: boolean;
  };
  
  // Security Settings
  security: {
    biometricAuth: boolean;
    sessionTimeout: number; // in minutes
    requireAuthOnStart: boolean;
    encryptData: boolean;
    autoLock: boolean;
  };
  
  // Advanced Settings
  advanced: {
    developerMode: boolean;
    debugMode: boolean;
    experimentalFeatures: boolean;
    betaUpdates: boolean;
    customHeaders: Record<string, string>;
  };
  
  // UI Settings
  ui: {
    compactMode: boolean;
    showAnimations: boolean;
    fontSize: 'small' | 'medium' | 'large';
    chartRefreshRate: number; // in seconds
    showSystemInfo: boolean;
  };
  
  loading: boolean;
  error: string | null;
}

type SettingsAction =
  | { type: 'SET_GENERAL_SETTINGS'; payload: Partial<SettingsState['general']> }
  | { type: 'SET_SYSTEM_SETTINGS'; payload: Partial<SettingsState['system']> }
  | { type: 'SET_SECURITY_SETTINGS'; payload: Partial<SettingsState['security']> }
  | { type: 'SET_ADVANCED_SETTINGS'; payload: Partial<SettingsState['advanced']> }
  | { type: 'SET_UI_SETTINGS'; payload: Partial<SettingsState['ui']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_SETTINGS' }
  | { type: 'LOAD_SETTINGS'; payload: SettingsState };

// Initial state
const initialState: SettingsState = {
  general: {
    theme: 'dark',
    language: 'en',
    autoRefresh: true,
    refreshInterval: 30,
    notifications: true,
    soundEffects: true,
    hapticFeedback: true,
  },
  system: {
    apiEndpoint: 'https://all-in-chat-poker.fly.dev',
    timeout: 10000,
    retryAttempts: 3,
    logLevel: 'info',
    enableAnalytics: true,
    crashReporting: true,
  },
  security: {
    biometricAuth: false,
    sessionTimeout: 30,
    requireAuthOnStart: true,
    encryptData: true,
    autoLock: true,
  },
  advanced: {
    developerMode: false,
    debugMode: false,
    experimentalFeatures: false,
    betaUpdates: false,
    customHeaders: {},
  },
  ui: {
    compactMode: false,
    showAnimations: true,
    fontSize: 'medium',
    chartRefreshRate: 30,
    showSystemInfo: true,
  },
  loading: false,
  error: null,
};

// Reducer
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_GENERAL_SETTINGS':
      return {
        ...state,
        general: { ...state.general, ...action.payload }
      };
    
    case 'SET_SYSTEM_SETTINGS':
      return {
        ...state,
        system: { ...state.system, ...action.payload }
      };
    
    case 'SET_SECURITY_SETTINGS':
      return {
        ...state,
        security: { ...state.security, ...action.payload }
      };
    
    case 'SET_ADVANCED_SETTINGS':
      return {
        ...state,
        advanced: { ...state.advanced, ...action.payload }
      };
    
    case 'SET_UI_SETTINGS':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'RESET_SETTINGS':
      return initialState;
    
    case 'LOAD_SETTINGS':
      return action.payload;
    
    default:
      return state;
  }
}

// Context
const SettingsContext = createContext<{
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
  actions: {
    // General Settings
    updateGeneralSettings: (settings: Partial<SettingsState['general']>) => void;
    updateSystemSettings: (settings: Partial<SettingsState['system']>) => void;
    updateSecuritySettings: (settings: Partial<SettingsState['security']>) => void;
    updateAdvancedSettings: (settings: Partial<SettingsState['advanced']>) => void;
    updateUISettings: (settings: Partial<SettingsState['ui']>) => void;
    
    // Data Management
    loadSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
    resetSettings: () => void;
    
    // Validation
    validateSettings: () => { isValid: boolean; errors: string[] };
    
    // Export/Import
    exportSettings: () => string;
    importSettings: (settingsJson: string) => boolean;
    
    // Helpers
    getSetting: (category: keyof SettingsState, key: string) => any;
    getAllSettings: () => SettingsState;
  };
} | null>(null);

// Provider
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Actions
  const actions = {
    // General Settings
    updateGeneralSettings: (settings) => {
      dispatch({
        type: 'SET_GENERAL_SETTINGS',
        payload: settings
      });
    },

    updateSystemSettings: (settings) => {
      dispatch({
        type: 'SET_SYSTEM_SETTINGS',
        payload: settings
      });
    },

    updateSecuritySettings: (settings) => {
      dispatch({
        type: 'SET_SECURITY_SETTINGS',
        payload: settings
      });
    },

    updateAdvancedSettings: (settings) => {
      dispatch({
        type: 'SET_ADVANCED_SETTINGS',
        payload: settings
      });
    },

    updateUISettings: (settings) => {
      dispatch({
        type: 'SET_UI_SETTINGS',
        payload: settings
      });
    },

    // Data Management
    loadSettings: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const settingsJson = await AsyncStorage.getItem('acey_settings');
        if (settingsJson) {
          const settings = JSON.parse(settingsJson);
          dispatch({ type: 'LOAD_SETTINGS', payload: settings });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load settings' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    saveSettings: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const settingsJson = JSON.stringify(state);
        await AsyncStorage.setItem('acey_settings', settingsJson);
      } catch (error) {
        console.error('Failed to save settings:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to save settings' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    resetSettings: () => {
      dispatch({ type: 'RESET_SETTINGS' });
    },

    // Validation
    validateSettings: () => {
      const errors: string[] = [];
      
      // Validate general settings
      if (state.general.refreshInterval < 5 || state.general.refreshInterval > 300) {
        errors.push('Refresh interval must be between 5 and 300 seconds');
      }
      
      // Validate system settings
      if (state.system.timeout < 1000 || state.system.timeout > 60000) {
        errors.push('Timeout must be between 1000 and 60000 milliseconds');
      }
      
      if (state.system.retryAttempts < 0 || state.system.retryAttempts > 10) {
        errors.push('Retry attempts must be between 0 and 10');
      }
      
      // Validate security settings
      if (state.security.sessionTimeout < 1 || state.security.sessionTimeout > 1440) {
        errors.push('Session timeout must be between 1 and 1440 minutes');
      }
      
      // Validate UI settings
      if (state.ui.chartRefreshRate < 5 || state.ui.chartRefreshRate > 300) {
        errors.push('Chart refresh rate must be between 5 and 300 seconds');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },

    // Export/Import
    exportSettings: () => {
      return JSON.stringify(state, null, 2);
    },

    importSettings: (settingsJson) => {
      try {
        const settings = JSON.parse(settingsJson);
        dispatch({ type: 'LOAD_SETTINGS', payload: settings });
        return true;
      } catch (error) {
        console.error('Failed to import settings:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to import settings' });
        return false;
      }
    },

    // Helpers
    getSetting: (category, key) => {
      const categorySettings = state[category as keyof SettingsState];
      if (typeof categorySettings === 'object' && categorySettings !== null) {
        return (categorySettings as any)[key];
      }
      return undefined;
    },

    getAllSettings: () => state,
  };

  // Auto-save settings when they change
  useEffect(() => {
    if (!state.loading) {
      actions.saveSettings();
    }
  }, [state]);

  // Load settings on mount
  useEffect(() => {
    actions.loadSettings();
  }, []);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// Hook
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
