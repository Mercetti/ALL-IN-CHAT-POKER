/**
 * QR-Based Device Pairing Component
 * Handles device pairing through QR code scanning for trusted devices
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Linking from 'expo-linking';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Device, DevicePairingRequest } from '../types/auth';
import { getOrCreateDeviceId, storeSecureItem, authenticateBiometric } from '../utils/auth';

interface Props {
  onPaired: (device: Device) => void;
  onCancel?: () => void;
  showInstructions?: boolean;
}

interface QRData {
  deviceId: string;
  deviceName: string;
  trustLevel: number;
  expiresAt: string;
  signature: string; // Would be cryptographic signature in production
}

export const DevicePairing: React.FC<Props> = ({ 
  onPaired, 
  onCancel, 
  showInstructions = true 
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);
    setError(null);

    try {
      // Parse QR code data
      const qrData: QRData = JSON.parse(data);
      
      // Validate QR data structure
      if (!qrData.deviceId || !qrData.deviceName || !qrData.trustLevel) {
        throw new Error('Invalid QR code format');
      }

      // Check if QR code has expired
      const expiresAt = new Date(qrData.expiresAt);
      if (expiresAt < new Date()) {
        throw new Error('QR code has expired');
      }

      // Authenticate user before pairing
      const isAuthenticated = await authenticateBiometric('Authenticate to pair this device');
      if (!isAuthenticated) {
        throw new Error('Authentication required for device pairing');
      }

      // Get current device ID
      const currentDeviceId = await getOrCreateDeviceId();
      
      // Prevent self-pairing
      if (qrData.deviceId === currentDeviceId) {
        throw new Error('Cannot pair device with itself');
      }

      // Create device object
      const pairedDevice: Device = {
        id: qrData.deviceId,
        name: qrData.deviceName,
        paired: true,
        trustLevel: qrData.trustLevel,
        lastActive: new Date().toISOString(),
        ownerVerified: true,
        deviceType: 'mobile', // Would be detected from QR data
        platform: 'Unknown', // Would be detected from QR data
        version: '1.0.0', // Would be detected from QR data
      };

      // Store paired device securely
      const pairingKey = `paired_device_${qrData.deviceId}`;
      await storeSecureItem(pairingKey, JSON.stringify(pairedDevice));

      // Show success message
      Alert.alert(
        'Device Paired Successfully',
        `${pairedDevice.name} has been paired with your device.\nTrust Level: ${pairedDevice.trustLevel}%`,
        [
          { text: 'OK', onPress: () => onPaired(pairedDevice) }
        ]
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setScanned(false);
      
      Alert.alert('Pairing Failed', errorMessage, [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Icon name="qr-code-scanner" size={48} color="#2196F3" />
      <Text style={styles.instructionsTitle}>Device Pairing</Text>
      <Text style={styles.instructionsText}>
        Scan the QR code from the device you want to pair with this Control Center.
      </Text>
      <View style={styles.stepsContainer}>
        <View style={styles.stepItem}>
          <Icon name="looks-one" size={20} color="#4CAF50" />
          <Text style={styles.stepText}>Ensure both devices are connected to the same network</Text>
        </View>
        <View style={styles.stepItem}>
          <Icon name="looks-two" size={20} color="#4CAF50" />
          <Text style={styles.stepText}>Generate QR code on the target device</Text>
        </View>
        <View style={styles.stepItem}>
          <Icon name="looks-3" size={20} color="#4CAF50" />
          <Text style={styles.stepText}>Scan the QR code and authenticate</Text>
        </View>
      </View>
    </View>
  );

  const renderScanner = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.permissionContainer}>
          <Icon name="camera-alt" size={48} color="#F44336" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Camera permission is required to scan QR codes for device pairing.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => BarCodeScanner.requestPermissionsAsync()}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        
        {scanned && (
          <View style={styles.scannerOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.scannerText}>Processing device pairing...</Text>
          </View>
        )}
        
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <Text style={styles.scannerHint}>Align QR code within the frame</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showInstructions && renderInstructions()}
      
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {renderScanner()}
      
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Icon name="close" size={20} color="#FFFFFF" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  instructionsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E',
    margin: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  stepsContainer: {
    width: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 12,
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  scannerFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    width: 300,
    height: 300,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#2196F3',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scannerHint: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
