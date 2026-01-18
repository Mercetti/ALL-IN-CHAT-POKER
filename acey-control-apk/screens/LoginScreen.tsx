import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useSystem } from '../src/context/SystemContext';
import { useAdvancedControls } from '../src/context/AdvancedControlsContext';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { state, dispatch, actions } = useAuth();
  const { actions: systemActions } = useSystem();
  const { actions: advancedActions } = useAdvancedControls();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  // Debug navigation prop
  console.log('🔐 LoginScreen navigation prop:', navigation);
  console.log('🔐 Navigation type:', typeof navigation);
  console.log('🔐 Navigation methods:', navigation ? Object.keys(navigation) : 'undefined');

  useEffect(() => {
    // Check if already authenticated
    if (state.isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [state.isAuthenticated, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔐 Attempting login with:', { email, password });
      
      // Use local backend for development
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 Login response status:', response.status);
      console.log('🔐 Login response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔐 Login failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Login failed: ${response.status} - ${errorText}`);
      }

      const { accessToken, refreshToken, user } = await response.json();
      console.log('🔐 Login successful:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });
      
      // Update auth state
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_TOKEN', payload: accessToken });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      
      Alert.alert('Success', 'Login successful!');
      
      // Safe navigation with error handling
      if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('MainTabs');
      } else {
        console.error('Navigation is not available');
        Alert.alert('Error', 'Navigation error occurred');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Use the proper biometric login function
      const success = await actions.loginWithBiometric();
      
      if (success) {
        Alert.alert('Success', 'Biometric login successful!');
        
        // Safe navigation with error handling
        if (navigation && typeof navigation.replace === 'function') {
          navigation.replace('MainTabs');
        } else {
          console.error('Navigation is not available');
          Alert.alert('Error', 'Navigation error occurred');
        }
      } else {
        Alert.alert('Error', 'Biometric authentication failed');
      }
      
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acey Control Center</Text>
        <Text style={styles.subtitle}>Secure System Access</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        {state.biometricEnabled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
          >
            <Text style={styles.biometricButtonText}>👆 Use Biometric</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Authentication</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  biometricButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  versionText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
});

export default LoginScreen;
