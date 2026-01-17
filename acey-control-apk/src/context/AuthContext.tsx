/**
 * Authentication Context
 * Provides global authentication state management
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricAuthService from '../../services/BiometricAuthService';

// Types
interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string | null;
    email: string | null;
    role: string | null;
  } | null;
  token: string | null;
  biometricEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthState['user'] }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_BIOMETRIC_ENABLED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  biometricEnabled: false,
  isLoading: false,
  error: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_BIOMETRIC_ENABLED':
      return { ...state, biometricEnabled: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return { ...initialState, biometricEnabled: state.biometricEnabled };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  actions: {
    login: (email: string, password: string) => Promise<boolean>;
    loginWithBiometric: () => Promise<boolean>;
    logout: () => Promise<void>;
    checkBiometricAvailability: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
  };
} | null>(null);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Actions
  const actions = {
    login: async (email: string, password: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        // Simulate API call (replace with real API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUser = {
          id: 'user-123',
          email: email,
          role: 'admin'
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // Store in AsyncStorage
        await AsyncStorage.setItem('auth_token', mockToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
        
        dispatch({ type: 'SET_USER', payload: mockUser });
        dispatch({ type: 'SET_TOKEN', payload: mockToken });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        return true;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Login failed' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return false;
      }
    },

    loginWithBiometric: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        const biometricResult = await BiometricAuthService.authenticate();
        
        if (biometricResult) {
          // Retrieve stored user data
          const storedToken = await AsyncStorage.getItem('auth_token');
          const storedUser = await AsyncStorage.getItem('user_data');
          
          if (storedToken && storedUser) {
            dispatch({ type: 'SET_USER', payload: JSON.parse(storedUser) });
            dispatch({ type: 'SET_TOKEN', payload: storedToken });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
            return true;
          }
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Biometric authentication failed' });
          return false;
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Biometric authentication error' });
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    logout: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Clear stored data
        await AsyncStorage.multiRemove(['auth_token', 'user_data']);
        
        dispatch({ type: 'LOGOUT' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Logout failed' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    checkBiometricAvailability: async () => {
      try {
        const isAvailable = await BiometricAuthService.isAvailable();
        dispatch({ type: 'SET_BIOMETRIC_ENABLED', payload: isAvailable });
      } catch (error) {
        console.error('Failed to check biometric availability:', error);
      }
    },

    refreshToken: async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          // Simulate token refresh (replace with real API)
          const newToken = 'refreshed-token-' + Date.now();
          await AsyncStorage.setItem('auth_token', newToken);
          dispatch({ type: 'SET_TOKEN', payload: newToken });
          return true;
        }
        return false;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Token refresh failed' });
        return false;
      }
    },
  };

  // Check biometric availability on mount
  useEffect(() => {
    actions.checkBiometricAvailability();
  }, []);

  // Check stored authentication on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
          dispatch({ type: 'SET_TOKEN', payload: storedToken });
          dispatch({ type: 'SET_USER', payload: JSON.parse(storedUser) });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        }
      } catch (error) {
        console.error('Failed to check stored auth:', error);
      }
    };

    checkStoredAuth();
  }, []);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
