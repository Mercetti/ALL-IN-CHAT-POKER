import React from 'react';
import { View, Text, Button, Modal, StyleSheet } from 'react-native';

interface UpgradeModalProps {
  visible: boolean;
  tier: string;
  onUpgrade: () => void;
  onClose: () => void;
}

export default function UpgradeModal({ visible, tier, onUpgrade, onClose }: UpgradeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Upgrade to {tier}</Text>
          <Text style={styles.description}>Unlock new skills and full Acey features.</Text>
          <View style={styles.buttonContainer}>
            <Button title={`Upgrade to ${tier}`} onPress={onUpgrade} />
            <Button title="Cancel" onPress={onClose} color="#666" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000aa',
  },
  modal: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    marginVertical: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
});
