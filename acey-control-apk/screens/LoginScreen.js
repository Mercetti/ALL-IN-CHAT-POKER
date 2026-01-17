import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { state, actions } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    // If already authenticated, redirect to main app
    if (state.isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [state.isAuthenticated, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    const success = await actions.login(email, password);
    
    if (success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Login Failed', state.error || 'Authentication failed');
    }
  };

  const handleBiometricLogin = async () => {
    const success = await actions.loginWithBiometric();
    
    if (success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Biometric Login Failed', state.error || 'Biometric authentication failed');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality would be implemented here',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acey Control Center</Text>
        <Text style={styles.subtitle}>Secure Authentication</Text>
      </View>
      
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!state.isLoading}
        />
        
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!state.isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁' : '👁'}</Text>
          </TouchableOpacity>
        </View>
        
        {state.biometricEnabled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={state.isLoading}
          >
            <Text style={styles.biometricText}>
              {state.isLoading ? 'Authenticating...' : '👆 Login with Biometrics'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.loginButton, (!email || !password) && styles.disabledButton]}
          onPress={handleLogin}
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      
      {state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  eyeText: {
    fontSize: 16,
  },
  biometricButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#991b1b',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;
