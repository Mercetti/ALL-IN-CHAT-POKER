/**
 * Security Context
 * Provides security state management and token handling
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SecurityManager, useSecurity } from '../utils/SecurityManager';

// Types
interface SecurityState {
  isAuthenticated: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  };
  session: {
    isActive: boolean;
    expiresAt: number | null;
    lastActivity: number;
  };
  device: {
    id: string | null;
    isTrusted: boolean;
    isBiometricEnabled: boolean;
  };
  security: {
    encryptionEnabled: boolean;
    lastTokenRefresh: number | null;
    auditLog: Array<{
      timestamp: number;
      event: string;
      details: any;
    }>;
  };
  loading: boolean;
  error: string | null;
}

type SecurityAction =
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_TOKENS'; payload: SecurityState['tokens'] }
  | { type: 'SET_SESSION'; payload: Partial<SecurityState['session']> }
  | { type: 'SET_DEVICE'; payload: Partial<SecurityState['device']> }
  | { type: 'ADD_AUDIT_LOG'; payload: SecurityState['security']['auditLog'][0] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Initial state
const initialState: SecurityState = {
  isAuthenticated: false,
  tokens: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  },
  session: {
    isActive: false,
    expiresAt: null,
    lastActivity: Date.now(),
  },
  device: {
    id: null,
    isTrusted: false,
    isBiometricEnabled: false,
  },
  security: {
    encryptionEnabled: true,
    lastTokenRefresh: null,
    auditLog: [],
  },
  loading: false,
  error: null,
};

// Reducer
function securityReducer(state: SecurityState, action: SecurityAction): SecurityState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    
    case 'SET_TOKENS':
      return {
        ...state,
        tokens: { ...state.tokens, ...action.payload },
        isAuthenticated: !!(action.payload.accessToken && action.payload.refreshToken),
      };
    
    case 'SET_SESSION':
      return {
        ...state,
        session: { ...state.session, ...action.payload },
      };
    
    case 'SET_DEVICE':
      return {
        ...state,
        device: { ...state.device, ...action.payload },
      };
    
    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        security: {
          ...state.security,
          auditLog: [...state.security.auditLog, action.payload].slice(-100), // Keep last 100 entries
        },
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'LOGOUT':
      return {
        ...initialState,
        security: {
          ...initialState.security,
          auditLog: state.security.auditLog, // Keep audit log
        },
        device: state.device, // Keep device info
      };
    
    default:
      return state;
  }
}

// Context
const SecurityContext = createContext<{
  state: SecurityState;
  dispatch: React.Dispatch<SecurityAction>;
  actions: {
    // Authentication
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    
    // Token Management
    storeTokens: (accessToken: string, refreshToken: string, expiresAt: number) => Promise<boolean>;
    getTokens: () => Promise<SecurityState['tokens']>;
    clearTokens: () => Promise<boolean>;
    
    // Session Management
    startSession: (timeoutMinutes?: number) => void;
    extendSession: () => void;
    endSession: () => void;
    
    // Device Security
    initializeDevice: () => Promise<void>;
    trustDevice: () => Promise<void>;
    enableBiometric: () => Promise<void>;
    
    // Data Security
    encryptData: (data: any) => Promise<any>;
    decryptData: (encryptedData: any) => Promise<any>;
    storeSecureData: (key: string, data: any) => Promise<boolean>;
    getSecureData: (key: string) => Promise<any>;
    
    // Security Audit
    getSecurityAudit: () => Promise<any>;
    logSecurityEvent: (event: string, details?: any) => void;
    
    // Validation
    validateToken: (token: string) => boolean;
    
    // Error Handling
    clearError: () => void;
  };
} | null>(null);

// Provider
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(securityReducer, initialState);
  const security = useSecurity();

  // Actions
  const actions = {
    // Authentication
    login: async (email: string, password: string): Promise<boolean> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Simulate login API call
        const response = await fetch('https://all-in-chat-poker.fly.dev/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const { accessToken, refreshToken, expiresAt, userId } = await response.json();
        
        // Store tokens securely
        await security.storeTokens({
          accessToken,
          refreshToken,
          expiresAt,
          issuedAt: Date.now(),
          userId,
          deviceId: await security.getDeviceId(),
        });

        // Update state
        dispatch({
          type: 'SET_TOKENS',
          payload: { accessToken, refreshToken, expiresAt }
        });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        // Start session
        actions.startSession();
        
        // Log security event
        actions.logSecurityEvent('LOGIN_SUCCESS', { userId, email });
        
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Login failed. Please try again.' });
        actions.logSecurityEvent('LOGIN_FAILED', { email, error: (error as any).message });
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    logout: async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Clear tokens
        await security.clearTokens();
        
        // Update state
        dispatch({ type: 'LOGOUT' });
        
        // Log security event
        actions.logSecurityEvent('LOGOUT_SUCCESS');
      } catch (error) {
        console.error('Logout failed:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Logout failed.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    refreshToken: async (): Promise<boolean> => {
      try {
        const tokens = await security.getTokens();
        if (!tokens || !tokens.refreshToken) {
          return false;
        }

        const newTokens = await security.refreshToken(tokens.refreshToken);
        if (!newTokens) {
          return false;
        }

        dispatch({
          type: 'SET_TOKENS',
          payload: {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: newTokens.expiresAt,
          }
        });

        actions.logSecurityEvent('TOKEN_REFRESH_SUCCESS');
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        actions.logSecurityEvent('TOKEN_REFRESH_FAILED', { error: (error as any).message });
        return false;
      }
    },

    // Token Management
    storeTokens: async (accessToken: string, refreshToken: string, expiresAt: number): Promise<boolean> => {
      try {
        const success = await security.storeTokens({
          accessToken,
          refreshToken,
          expiresAt,
          issuedAt: Date.now(),
          userId: 'current-user',
          deviceId: await security.getDeviceId(),
        });

        if (success) {
          dispatch({
            type: 'SET_TOKENS',
            payload: { accessToken, refreshToken, expiresAt }
          });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        }

        return success;
      } catch (error) {
        console.error('Failed to store tokens:', error);
        return false;
      }
    },

    getTokens: async (): Promise<SecurityState['tokens']> => {
      try {
        const tokens = await security.getTokens();
        if (tokens) {
          dispatch({
            type: 'SET_TOKENS',
            payload: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
            }
          });
        }
        return tokens || { accessToken: null, refreshToken: null, expiresAt: null };
      } catch (error) {
        console.error('Failed to get tokens:', error);
        return { accessToken: null, refreshToken: null, expiresAt: null };
      }
    },

    clearTokens: async (): Promise<boolean> => {
      try {
        const success = await security.clearTokens();
        if (success) {
          dispatch({ type: 'LOGOUT' });
        }
        return success;
      } catch (error) {
        console.error('Failed to clear tokens:', error);
        return false;
      }
    },

    // Session Management
    startSession: (timeoutMinutes?: number): void => {
      security.startSessionTimer(timeoutMinutes);
      dispatch({
        type: 'SET_SESSION',
        payload: {
          isActive: true,
          expiresAt: Date.now() + (timeoutMinutes || 30) * 60 * 1000,
          lastActivity: Date.now(),
        }
      });
    },

    extendSession: (): void => {
      security.resetSessionTimer();
      dispatch({
        type: 'SET_SESSION',
        payload: {
          lastActivity: Date.now(),
        }
      });
    },

    endSession: (): void => {
      security.stopSessionTimer();
      dispatch({
        type: 'SET_SESSION',
        payload: {
          isActive: false,
          expiresAt: null,
        }
      });
    },

    // Device Security
    initializeDevice: async (): Promise<void> => {
      try {
        const deviceId = await security.getDeviceId();
        dispatch({
          type: 'SET_DEVICE',
          payload: {
            id: deviceId,
            isTrusted: deviceId !== 'unknown-device',
          }
        });
      } catch (error) {
        console.error('Failed to initialize device:', error);
      }
    },

    trustDevice: async (): Promise<void> => {
      try {
        // Store device trust status
        await security.storeSecureData('device_trusted', true);
        dispatch({
          type: 'SET_DEVICE',
          payload: { isTrusted: true }
        });
        actions.logSecurityEvent('DEVICE_TRUSTED');
      } catch (error) {
        console.error('Failed to trust device:', error);
      }
    },

    enableBiometric: async (): Promise<void> => {
      try {
        await security.storeSecureData('biometric_enabled', true);
        dispatch({
          type: 'SET_DEVICE',
          payload: { isBiometricEnabled: true }
        });
        actions.logSecurityEvent('BIOMETRIC_ENABLED');
      } catch (error) {
        console.error('Failed to enable biometric:', error);
      }
    },

    // Data Security
    encryptData: async (data: any): Promise<any> => {
      return await security.encryptData(JSON.stringify(data));
    },

    decryptData: async (encryptedData: any): Promise<any> => {
      const decrypted = await security.decryptData(encryptedData);
      return JSON.parse(decrypted);
    },

    storeSecureData: async (key: string, data: any): Promise<boolean> => {
      return await security.storeSecureData(key, data);
    },

    getSecureData: async (key: string): Promise<any> => {
      return await security.getSecureData(key);
    },

    // Security Audit
    getSecurityAudit: async (): Promise<any> => {
      return await security.getSecurityAudit();
    },

    logSecurityEvent: (event: string, details?: any): void => {
      dispatch({
        type: 'ADD_AUDIT_LOG',
        payload: {
          timestamp: Date.now(),
          event,
          details,
        }
      });
    },

    // Validation
    validateToken: (token: string): boolean => {
      return security.validateToken(token);
    },

    // Error Handling
    clearError: (): void => {
      dispatch({ type: 'CLEAR_ERROR' });
    },
  };

  // Initialize device on mount
  useEffect(() => {
    actions.initializeDevice();
    actions.getTokens(); // Load existing tokens
  }, []);

  // Check token expiration
  useEffect(() => {
    if (state.tokens.expiresAt && Date.now() > state.tokens.expiresAt) {
      actions.logSecurityEvent('TOKEN_EXPIRED');
      actions.logout();
    }
  }, [state.tokens.expiresAt]);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

// Hook
export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}
