import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { mobileLogin, setStoredToken, getStoredDeviceId, setStoredDeviceId } from '../services/api';
import { useAceyStore } from '../state/aceyStore';

const AuthScreen: React.FC = ({ navigation }: any) => {
  const { setToken, setDeviceId, setLoading, setError } = useAceyStore();
  const [deviceId, setLocalDeviceId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if device is already registered
    const storedDeviceId = getStoredDeviceId();
    if (storedDeviceId) {
      setLocalDeviceId(storedDeviceId);
    }
  }, []);

  const handleLogin = async () => {
    if (!deviceId.trim() || !pin.trim()) {
      Alert.alert('Error', 'Please enter both device ID and PIN');
      return;
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      Alert.alert('Error', 'PIN must be exactly 6 digits');
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);

      const response = await mobileLogin(deviceId.trim(), pin);

      if (response.error) {
        setError(response.error);
        Alert.alert('Login Failed', response.error);
      } else if (response.data) {
        // Store token and device ID
        setStoredToken(response.data.token);
        setStoredDeviceId(deviceId.trim());
        
        // Update store
        setToken(response.data.token);
        setDeviceId(deviceId.trim());
        setError(null);

        Alert.alert('Success', 'Authentication successful');
      }
    } catch (error) {
      setError('Login failed');
      Alert.alert('Login Failed', 'An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const generateDeviceId = () => {
    // Generate a simple UUID-like device ID
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const androidId = `android-${uuid}`;
    setLocalDeviceId(androidId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="security" size={64} color="#2196F3" />
          <Text style={styles.title}>Acey Control Center</Text>
          <Text style={styles.subtitle}>Secure Mobile Access</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Authentication</Text>
          <Text style={styles.formSubtitle}>
            Enter your device credentials to access the control center
          </Text>

          {/* Device ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Device ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={deviceId}
                onChangeText={setLocalDeviceId}
                placeholder="Enter device ID"
                placeholderTextColor="#666666"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={generateDeviceId} style={styles.generateButton}>
                <Icon name="refresh" size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              Your unique device identifier. Generate if you don't have one.
            </Text>
          </View>

          {/* PIN Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Security PIN</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 6-digit PIN"
                placeholderTextColor="#666666"
                secureTextEntry={!showPin}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.toggleButton}>
                <Icon name={showPin ? "visibility-off" : "visibility"} size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              6-digit security PIN provided by system administrator
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.loginButtonText}>Authenticating...</Text>
            ) : (
              <>
                <Icon name="login" size={20} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Login</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Icon name="info" size={20} color="#FF9800" />
          <View style={styles.securityNoticeContent}>
            <Text style={styles.securityNoticeTitle}>Security Notice</Text>
            <Text style={styles.securityNoticeText}>
              This is a secure control center. All actions are monitored and logged for safety.
            </Text>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <View style={styles.helpItem}>
            <Icon name="help" size={16} color="#9E9E9E" />
            <Text style={styles.helpText}>
              Contact your system administrator for device credentials
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Icon name="security" size={16} color="#9E9E9E" />
            <Text style={styles.helpText}>
              Ensure your device is registered in the trusted devices list
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  form: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  generateButton: {
    padding: 12,
  },
  toggleButton: {
    padding: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    lineHeight: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#555555',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  securityNoticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityNoticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  securityNoticeText: {
    fontSize: 12,
    color: '#9E9E9E',
    lineHeight: 16,
  },
  helpSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default AuthScreen;
