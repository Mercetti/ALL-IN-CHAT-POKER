import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FeatureTooltipProps } from '../types/upgrade';

const { width: screenWidth } = Dimensions.get('window');

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ 
  title, 
  description, 
  visible, 
  onClose, 
  position 
}) => {
  if (!visible) return null;

  const tooltipWidth = 280;
  const tooltipX = position ? Math.max(20, Math.min(screenWidth - tooltipWidth - 20, position.x - tooltipWidth / 2)) : screenWidth / 2 - tooltipWidth / 2;
  const tooltipY = position ? position.y + 10 : 100;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={0} />
      <View style={[
        styles.tooltip,
        {
          left: tooltipX,
          top: tooltipY,
          width: tooltipWidth,
        }
      ]}>
        <View style={styles.arrow} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Icon name="info" size={20} color="#2196F3" />
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={16} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  arrow: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2A2A2A',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
  },
});
