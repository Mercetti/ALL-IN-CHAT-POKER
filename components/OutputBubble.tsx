import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GeneratedOutput } from '../utils/outputManager';

interface OutputBubbleProps {
  output: GeneratedOutput;
  onDownload: () => void;
  onApprove: () => void;
  onDiscard: () => void;
  onCopy?: () => void;
}

export const OutputBubble: React.FC<OutputBubbleProps> = ({
  output,
  onDownload,
  onApprove,
  onDiscard,
  onCopy
}) => {
  const handleDownload = () => {
    Alert.alert(
      'Download Output',
      `Save ${output.skill} output to your device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: onDownload }
      ]
    );
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve for Learning',
      'Add this output to Acey\'s learning dataset?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: onApprove }
      ]
    );
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Output',
      'Remove this output from memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onDiscard }
      ]
    );
  };

  const renderContentPreview = () => {
    if (typeof output.content === 'string') {
      // Code/text content - show first 200 characters
      const preview = output.content.length > 200 
        ? output.content.substring(0, 200) + '...' 
        : output.content;
      
      return (
        <Text style={styles.codePreview}>
          {preview}
        </Text>
      );
    } else {
      // Binary content (graphics/audio)
      return (
        <View style={styles.binaryPreview}>
          <Text style={styles.binaryText}>
            [{output.skill.toUpperCase()} Content]
          </Text>
          <Text style={styles.sizeText}>
            Size: {(output.content.byteLength / 1024).toFixed(1)} KB
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={[styles.bubble, styles[output.skill]]}>
      <View style={styles.header}>
        <Text style={styles.skillType}>{output.skill.toUpperCase()}</Text>
        <Text style={styles.timestamp}>
          {output.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      
      {renderContentPreview()}
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.downloadButton]} 
          onPress={handleDownload}
        >
          <Text style={styles.buttonText}>Download</Text>
        </TouchableOpacity>
        
        {onCopy && typeof output.content === 'string' && (
          <TouchableOpacity 
            style={[styles.button, styles.copyButton]} 
            onPress={onCopy}
          >
            <Text style={styles.buttonText}>Copy</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.approveButton]} 
          onPress={handleApprove}
        >
          <Text style={styles.buttonText}>Learn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.discardButton]} 
          onPress={handleDiscard}
        >
          <Text style={styles.buttonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: { 
    padding: 16, 
    marginVertical: 8, 
    borderRadius: 12,
    shadowColor: '#000',
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
  skillType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  codePreview: { 
    fontFamily: 'monospace', 
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
    maxHeight: 100,
  },
  binaryPreview: {
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
  },
  binaryText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  sizeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  copyButton: {
    backgroundColor: '#34C759',
  },
  approveButton: {
    backgroundColor: '#FF9500',
  },
  discardButton: {
    backgroundColor: '#FF3B30',
  },
  // Skill-specific colors
  Code: { 
    backgroundColor: '#2C3E50',
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  Graphics: { 
    backgroundColor: '#1A1A1A',
    borderLeftWidth: 4,
    borderLeftColor: '#9B59B6',
  },
  Audio: { 
    backgroundColor: '#2C3E50',
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  Analytics: { 
    backgroundColor: '#34495E',
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
});
