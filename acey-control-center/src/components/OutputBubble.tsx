import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface OutputBubbleProps {
  output: {
    id: string;
    skill: string;
    content: string | Uint8Array;
    timestamp: Date;
    approved?: boolean;
  };
  onApprove?: (id: string) => void;
  onDiscard?: (id: string) => void;
  onLearn?: (id: string) => void;
  onUpload?: (id: string) => void;
}

const OutputBubble: React.FC<OutputBubbleProps> = ({ 
  output, 
  onApprove, 
  onDiscard, 
  onLearn,
  onUpload
}) => {
  const handleApprove = () => {
    if (onApprove) {
      onApprove(output.id);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Output',
      'Are you sure you want to discard this output?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => onDiscard?.(output.id) }
      ]
    );
  };

  const handleLearn = () => {
    if (onLearn) {
      onLearn(output.id);
    }
  };

  const handleUpload = () => {
    if (onUpload) {
      onUpload(output.id);
    }
  };

  const renderContentPreview = () => {
    if (typeof output.content === 'string') {
      // Text content
      const preview = output.content.length > 100 
        ? output.content.substring(0, 100) + '...' 
        : output.content;
      
      return (
        <View style={styles.codePreview}>
          <Text style={styles.codeText}>{preview}</Text>
        </View>
      );
    } else {
      // Binary content (graphics/audio)
      return (
        <View style={styles.binaryPreview}>
          <Text style={styles.binaryText}>[{output.skill.toUpperCase()} Content]</Text>
          <Text style={styles.sizeText}>
            Size: {output.content ? (output.content.byteLength / 1024).toFixed(1) : '0'} KB
          </Text>
        </View>
      );
    }
  };

  const renderActions = () => {
    return (
      <View style={styles.actions}>
        {onApprove && (
          <TouchableOpacity 
            style={[styles.button, styles.approveButton]} 
            onPress={handleApprove}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
        )}
        
        {onLearn && (
          <TouchableOpacity 
            style={[styles.button, styles.learnButton]} 
            onPress={handleLearn}
          >
            <Text style={styles.buttonText}>Learn</Text>
          </TouchableOpacity>
        )}
        
        {onUpload && (
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]} 
            onPress={handleUpload}
          >
            <Text style={styles.buttonText}>Upload</Text>
          </TouchableOpacity>
        )}
        
        {onDiscard && (
          <TouchableOpacity 
            style={[styles.button, styles.discardButton]} 
            onPress={handleDiscard}
          >
            <Text style={styles.buttonText}>Discard</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.skillName}>{output.skill}</Text>
        <Text style={styles.timestamp}>
          {output.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      
      {renderContentPreview()}
      
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  codePreview: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333333',
  },
  binaryPreview: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
  },
  binaryText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  sizeText: {
    fontSize: 12,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10b981', // Success color from unified design system
  },
  learnButton: {
    backgroundColor: '#3b82f6', // Info color from unified design system
  },
  uploadButton: {
    backgroundColor: '#f59e0b', // Warning color from unified design system
  },
  discardButton: {
    backgroundColor: '#ef4444', // Error color from unified design system
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OutputBubble;
