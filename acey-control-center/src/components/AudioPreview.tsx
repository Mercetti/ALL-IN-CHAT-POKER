import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

interface AudioPreviewProps {
  src: string;
}

export default function AudioPreview({ src }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        // Stop playback logic would go here
        setIsPlaying(false);
      } else {
        // Start playback logic would go here
        setIsPlaying(true);
        // Auto-stop after 3 seconds for demo
        setTimeout(() => setIsPlaying(false), 3000);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.audioContainer}
        onPress={togglePlayback}
        activeOpacity={0.8}
      >
        <View style={styles.audioIcon}>
          <Text style={styles.playIcon}>
            {isPlaying ? '⏸️' : '▶️'}
          </Text>
        </View>
        <View style={styles.audioInfo}>
          <Text style={styles.audioLabel}>Audio Preview</Text>
          <Text style={styles.duration}>0:03</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.waveform}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((height, index) => (
          <View 
            key={index}
            style={[
              styles.waveBar,
              { 
                height: Math.random() * 20 + 5,
                opacity: isPlaying ? 0.8 : 0.4
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playIcon: {
    fontSize: 16,
    color: '#fff',
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  duration: {
    fontSize: 10,
    color: '#666',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    height: 24,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
